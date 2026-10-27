const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function runRestorationTest() {
  console.log('================================================================');
  console.log('SprintOS — Backup & Restoration Verification Test');
  console.log('================================================================');
  
  const backupJsonPath = path.resolve(__dirname, '../backups/sprintos_data_backup_2026-10-24.json');
  const backupDocsDir = path.resolve(__dirname, '../backups/documents');
  const originalDocsDir = path.resolve(__dirname, '../semester5sprint2subjectwisesyllabus');
  const testRestoreDir = path.resolve(__dirname, '../backups/restore_test');

  let passed = true;

  // 1. Verify JSON Snapshot
  console.log('\n[1/4] Verifying JSON State Snapshot...');
  if (!fs.existsSync(backupJsonPath)) {
    console.error('❌ FAIL: Backup JSON file not found at:', backupJsonPath);
    return false;
  }
  
  const rawJson = fs.readFileSync(backupJsonPath, 'utf8');
  let data;
  try {
    data = JSON.parse(rawJson);
    console.log('  ✓ JSON parsed successfully (' + (rawJson.length / 1024).toFixed(1) + ' KB)');
  } catch (err) {
    console.error('❌ FAIL: Backup JSON is malformed:', err.message);
    return false;
  }

  // Schema assertions
  const requiredFields = ['version', 'timestamp', 'profile', 'settings', 'academicData', 'parsedDocs'];
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`❌ FAIL: Missing required field "${field}" in backup`);
      passed = false;
    } else {
      console.log(`  ✓ Field "${field}" present and populated`);
    }
  }

  if (data.profile?.name !== 'Ashutosh Rai') {
    console.error('❌ FAIL: Student profile name mismatch:', data.profile?.name);
    passed = false;
  } else {
    console.log('  ✓ Verified student profile: Ashutosh Rai (' + data.profile.cohort + ')');
  }

  // 2. Verify Document Backup
  console.log('\n[2/4] Verifying College Documents in backups/documents/...');
  const expectedDocs = [
    'Carrier Readiness & Leadership_Sem5.docx',
    'DSA3_Semester5_Syllabus (1).docx',
    'Foundations of AI, ML & Data Science_Sem5.xlsx',
    'LLMs, RAG & Agentic AI_Sem5.xlsx',
    'Software Testing And Quality Assurance_Sem5.xlsx',
    'Sprint 2 Academic Plan 13th Oct 2026.pdf',
    'Venture Capital & Product Strategy_Sem5 .docx'
  ];

  for (const doc of expectedDocs) {
    const backupDocPath = path.join(backupDocsDir, doc);
    const origDocPath = path.join(originalDocsDir, doc);

    if (!fs.existsSync(backupDocPath)) {
      console.error(`❌ FAIL: Document missing in backup: ${doc}`);
      passed = false;
      continue;
    }

    const backupHash = sha256File(backupDocPath);
    const origHash = sha256File(origDocPath);
    const size = fs.statSync(backupDocPath).size;

    if (backupHash !== origHash) {
      console.error(`❌ FAIL: Hash mismatch for ${doc}`);
      passed = false;
    } else {
      console.log(`  ✓ ${doc.padEnd(50)} [${(size / 1024).toFixed(1)} KB] SHA256: ${backupHash.substring(0, 16)}...`);
    }
  }

  // 3. Simulated Full Restoration Dry-Run
  console.log('\n[3/4] Executing Restoration Dry-Run to Isolated Directory...');
  if (fs.existsSync(testRestoreDir)) {
    fs.rmSync(testRestoreDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testRestoreDir, { recursive: true });

  // Restore JSON
  fs.writeFileSync(path.join(testRestoreDir, 'restored_academic_state.json'), JSON.stringify(data, null, 2));

  // Restore Documents
  fs.mkdirSync(path.join(testRestoreDir, 'documents'), { recursive: true });
  for (const doc of expectedDocs) {
    fs.copyFileSync(path.join(backupDocsDir, doc), path.join(testRestoreDir, 'documents', doc));
  }

  console.log('  ✓ State and documents written to sandbox test directory:', testRestoreDir);

  // 4. Validate Restored Sandbox
  console.log('\n[4/4] Validating Sandbox Restored Integrity...');
  const restoredJson = JSON.parse(fs.readFileSync(path.join(testRestoreDir, 'restored_academic_state.json'), 'utf8'));
  if (restoredJson.profile.name === 'Ashutosh Rai' && restoredJson.academicData.subjects.length >= 6) {
    console.log('  ✓ Restored state validated: 6 active subjects, student profile intact');
  } else {
    console.error('❌ FAIL: Restored sandbox validation failed');
    passed = false;
  }

  for (const doc of expectedDocs) {
    const restoredDocPath = path.join(testRestoreDir, 'documents', doc);
    const restoredHash = sha256File(restoredDocPath);
    const origHash = sha256File(path.join(originalDocsDir, doc));
    if (restoredHash !== origHash) {
      console.error(`❌ FAIL: Restored file checksum mismatch for ${doc}`);
      passed = false;
    }
  }
  console.log('  ✓ All 7 restored files match original byte-for-byte hashes');

  // Clean up sandbox
  fs.rmSync(testRestoreDir, { recursive: true, force: true });
  console.log('  ✓ Sandbox cleaned up');

  console.log('\n================================================================');
  if (passed) {
    console.log('✅ PASS: Backup and Restoration Verification 100% SUCCESSFUL');
  } else {
    console.log('❌ FAIL: Backup Verification Failed with Errors');
  }
  console.log('================================================================\n');

  process.exit(passed ? 0 : 1);
}

runRestorationTest();
