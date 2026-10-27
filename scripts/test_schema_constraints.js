const { pool } = require('../server/db/pool');

async function testConstraints() {
  console.log('================================================================');
  console.log('SprintOS — PostgreSQL Schema Constraints & Triggers Test Suite');
  console.log('================================================================');

  const client = await pool.connect();
  let passed = true;

  try {
    await client.query('BEGIN');

    // 0. Setup test user and subject
    await client.query(`
      INSERT INTO institutions (id, name, short_code) VALUES ('inst-test', 'Test University', 'TEST-U') ON CONFLICT DO NOTHING;
      INSERT INTO cohorts (id, institution_id, name, program, batch, semester) 
      VALUES ('cohort-test', 'inst-test', 'Elon Musk', 'B.Tech CSE', '2024-28', 'Semester 5') ON CONFLICT DO NOTHING;
      INSERT INTO users (id, email, full_name, role, cohort_id) 
      VALUES ('user-test', 'test@sprintos.local', 'Ashutosh Rai', 'student', 'cohort-test') ON CONFLICT DO NOTHING;
      INSERT INTO curriculum_subjects (id, code, name, cohort_id) 
      VALUES ('S5-TEST01', 'TEST01', 'Test Subject', 'cohort-test') ON CONFLICT DO NOTHING;
    `);

    // Helper to run expectation of error with savepoint
    async function expectError(name, query, expectedPhrases) {
      await client.query('SAVEPOINT sp');
      try {
        await client.query(query);
        await client.query('RELEASE SAVEPOINT sp');
        console.error(`❌ FAIL [${name}]: Database unexpectedly permitted invalid query!`);
        passed = false;
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT sp');
        const phrases = Array.isArray(expectedPhrases) ? expectedPhrases : [expectedPhrases];
        const matched = phrases.some(p => err.message.toLowerCase().includes(p.toLowerCase()));
        if (matched) {
          console.log(`  ✓ SUCCESS [${name}]: Rejected as expected -> "${err.message.split('\n')[0]}"`);
        } else {
          console.error(`❌ FAIL [${name}]: Error message did not match expected phrases [${phrases.join(', ')}]: ${err.message}`);
          passed = false;
        }
      }
    }

    // Test 1: Invalid time format (e.g. 29:30)
    console.log('\n[Test 1] Testing rejection of invalid time (29:30)...');
    await expectError(
      'Invalid 29:30',
      `INSERT INTO user_timetable_entries 
       (id, user_id, specific_date, day_of_week, start_time, end_time, duration_minutes, slot_type, subject_id)
       VALUES ('tt-inv-1', 'user-test', '2026-10-24', 6, '29:30', '30:30', 60, 'lecture', 'S5-TEST01');`,
      ['out of range', 'invalid']
    );

    // Test 2: End time before start time (11:00 to 10:00)
    console.log('\n[Test 2] Testing rejection of end time before start time (11:00 to 10:00)...');
    await expectError(
      'End < Start',
      `INSERT INTO user_timetable_entries 
       (id, user_id, specific_date, day_of_week, start_time, end_time, duration_minutes, slot_type, subject_id)
       VALUES ('tt-inv-2', 'user-test', '2026-10-24', 6, '11:00', '10:00', 60, 'lecture', 'S5-TEST01');`,
      ['chk_user_entry_time_order', 'chk_user_entry_duration_matches']
    );

    // Test 3: Duration mismatch (10:00 to 11:00 is 60m, but passing 30m)
    console.log('\n[Test 3] Testing rejection of duration mismatch (10:00-11:00 with duration=30)...');
    await expectError(
      'Duration Mismatch',
      `INSERT INTO user_timetable_entries 
       (id, user_id, specific_date, day_of_week, start_time, end_time, duration_minutes, slot_type, subject_id)
       VALUES ('tt-inv-3', 'user-test', '2026-10-24', 6, '10:00', '11:00', 30, 'lecture', 'S5-TEST01');`,
      ['chk_user_entry_duration_matches']
    );

    // Test 4: Valid insert (10:00 to 11:00, 60 min)
    console.log('\n[Test 4] Testing valid slot insertion (10:00 to 11:00, 60m)...');
    await client.query(`
      INSERT INTO user_timetable_entries 
      (id, user_id, specific_date, day_of_week, start_time, end_time, duration_minutes, slot_type, subject_id, classroom)
      VALUES ('tt-valid-1', 'user-test', '2026-10-24', 6, '10:00', '11:00', 60, 'lecture', 'S5-TEST01', 'Classroom 37');
    `);
    console.log('  ✓ SUCCESS [Valid Insert]: Inserted valid timetable entry.');

    // Test 5: Timetable Overlap Trigger (overlapping slot 10:30 to 11:30 on same date)
    console.log('\n[Test 5] Testing trigger rejection of overlapping student slot (10:30 to 11:30)...');
    await expectError(
      'Overlap Guard',
      `INSERT INTO user_timetable_entries 
       (id, user_id, specific_date, day_of_week, start_time, end_time, duration_minutes, slot_type, subject_id, classroom)
       VALUES ('tt-overlap-1', 'user-test', '2026-10-24', 6, '10:30', '11:30', 60, 'lecture', 'S5-TEST01', 'Classroom 4');`,
      ['Timetable overlap conflict']
    );

    // Test 6: Classroom NULL duplicate handling (two slots at same time with NULL classroom)
    console.log('\n[Test 6] Testing duplicate prevention on NULL classroom slots...');
    await client.query(`
      INSERT INTO user_timetable_entries 
      (id, user_id, specific_date, day_of_week, start_time, end_time, duration_minutes, slot_type, subject_id, classroom)
      VALUES ('tt-null-1', 'user-test', '2026-10-25', 0, '14:00', '15:00', 60, 'lecture', 'S5-TEST01', NULL);
    `);
    console.log('  ✓ Inserted first entry with NULL classroom.');
    await expectError(
      'NULL Classroom Duplicate',
      `INSERT INTO user_timetable_entries 
       (id, user_id, specific_date, day_of_week, start_time, end_time, duration_minutes, slot_type, subject_id, classroom)
       VALUES ('tt-null-2', 'user-test', '2026-10-25', 0, '14:00', '15:00', 60, 'lecture', 'S5-TEST01', NULL);`,
      ['uq_user_timetable_slot', 'Timetable overlap conflict']
    );

    // Rollback test transaction to keep database clean
    await client.query('ROLLBACK');
    console.log('\n  ✓ Test transaction rolled back. Database remains pristine.');

  } catch (outerErr) {
    await client.query('ROLLBACK');
    console.error('❌ FATAL TEST ERROR:', outerErr);
    passed = false;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n================================================================');
  if (passed) {
    console.log('✅ ALL SCHEMA CONSTRAINTS & TRIGGERS PASSED VALIDATION (6/6)');
  } else {
    console.log('❌ SOME CONSTRAINTS FAILED VALIDATION');
  }
  console.log('================================================================\n');

  process.exit(passed ? 0 : 1);
}

testConstraints();
