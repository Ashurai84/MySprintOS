-- ============================================================================
-- SprintOS 2.0 / 2.1 — Corrected Database-First PostgreSQL Schema
-- Database: sprintos_db
-- ============================================================================

-- Ensure uuid-ossp extension for stable unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. INSTITUTION & SHARED REFERENCE CATALOG (COLLEGE-PROVIDED CONTENT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS institutions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    short_code VARCHAR(50) NOT NULL UNIQUE,
    campus VARCHAR(100),
    academic_year VARCHAR(50) DEFAULT '2026-27',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cohorts (
    id VARCHAR(50) PRIMARY KEY,
    institution_id VARCHAR(50) REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Elon Musk"
    program VARCHAR(150) NOT NULL, -- "B.Tech Computer Science Engineering"
    batch VARCHAR(50) NOT NULL,   -- "2024–28"
    semester VARCHAR(50) NOT NULL, -- "Semester 5"
    sprint VARCHAR(50) DEFAULT 'Sprint 2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    title VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classrooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    building VARCHAR(100),
    capacity INTEGER CHECK (capacity IS NULL OR capacity > 0)
);

CREATE TABLE IF NOT EXISTS curriculum_subjects (
    id VARCHAR(50) PRIMARY KEY, -- e.g. "S5-CS01"
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    total_hours INTEGER DEFAULT 45 CHECK (total_hours > 0),
    credits INTEGER DEFAULT 3 CHECK (credits > 0),
    default_faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE SET NULL,
    course_type VARCHAR(50) DEFAULT 'Core',
    cohort_id VARCHAR(50) REFERENCES cohorts(id) ON DELETE CASCADE,
    description TEXT,
    official_doc_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_modules (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    unit_number VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    hours INTEGER DEFAULT 0 CHECK (hours >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_topics (
    id VARCHAR(50) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS official_documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('pdf', 'docx', 'xlsx', 'txt', 'other')),
    file_size VARCHAR(50),
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 for duplicate and re-import detection
    url TEXT NOT NULL,
    file_path TEXT,
    subject_id VARCHAR(50) REFERENCES curriculum_subjects(id) ON DELETE SET NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    is_master_plan BOOLEAN DEFAULT FALSE,
    extraction_status VARCHAR(30) DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'staged', 'completed', 'failed')),
    extractor_version VARCHAR(30) DEFAULT 'v1.0.0',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extracted chunks for AI RAG provenance
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL REFERENCES official_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    sheet_name VARCHAR(100),
    section_heading VARCHAR(255),
    content_text TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ingestion anomalies table (discrepancy flagging)
CREATE TABLE IF NOT EXISTS document_ingestion_anomalies (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL REFERENCES official_documents(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    extracted_value TEXT,
    expected_value TEXT,
    severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'ignored')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Master timetable template (Standard college weekly schedule)
CREATE TABLE IF NOT EXISTS official_timetable_templates (
    id VARCHAR(50) PRIMARY KEY,
    cohort_id VARCHAR(50) NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    slot_type VARCHAR(30) NOT NULL CHECK (slot_type IN ('lecture', 'lunch_break', 'short_break', 'free_period', 'unassigned', 'independent_study')),
    subject_id VARCHAR(50) REFERENCES curriculum_subjects(id) ON DELETE SET NULL,
    faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE SET NULL,
    classroom VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_template_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_template_duration_matches CHECK (ROUND(EXTRACT(EPOCH FROM (end_time - start_time)) / 60) = duration_minutes)
);

-- ============================================================================
-- 2. USERS & USER-OWNED ACADEMIC RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'guest')),
    cohort_id VARCHAR(50) REFERENCES cohorts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    program VARCHAR(150),
    cohort VARCHAR(100),
    batch VARCHAR(50),
    semester VARCHAR(50),
    sprint VARCHAR(50),
    academic_year VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_academic_settings (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    min_attendance_percent INTEGER DEFAULT 75 CHECK (min_attendance_percent BETWEEN 50 AND 100),
    internal_marks_total INTEGER DEFAULT 60 CHECK (internal_marks_total > 0),
    external_marks_total INTEGER DEFAULT 40 CHECK (external_marks_total > 0),
    internal_breakdown JSONB NOT NULL,
    external_breakdown JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student's active calendar timetable entries (overrides, custom slots, personalized days)
CREATE TABLE IF NOT EXISTS user_timetable_entries (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specific_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    slot_type VARCHAR(30) NOT NULL CHECK (slot_type IN ('lecture', 'lunch_break', 'short_break', 'free_period', 'unassigned', 'independent_study')),
    subject_id VARCHAR(50) REFERENCES curriculum_subjects(id) ON DELETE SET NULL,
    faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE SET NULL,
    classroom VARCHAR(100),
    is_holiday BOOLEAN DEFAULT FALSE,
    is_rescheduled BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_entry_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_user_entry_duration_matches CHECK (ROUND(EXTRACT(EPOCH FROM (end_time - start_time)) / 60) = duration_minutes)
);

-- Unique index accounting for PostgreSQL NULL classroom behavior
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_timetable_slot 
ON user_timetable_entries (user_id, specific_date, start_time, COALESCE(classroom, 'UNASSIGNED'));

-- User Actual Held Lectures & Attendance Records
CREATE TABLE IF NOT EXISTS lectures (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject_id VARCHAR(50) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE SET NULL,
    faculty_name VARCHAR(150),
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    status VARCHAR(20) NOT NULL DEFAULT 'attended' CHECK (status IN ('attended', 'absent', 'cancelled', 'scheduled')),
    classroom VARCHAR(100),
    notes TEXT,
    what_i_learned TEXT,
    important_concepts JSONB DEFAULT '[]'::jsonb,
    examples_or_code TEXT,
    doubts_or_questions TEXT,
    homework_or_followup TEXT,
    confidence_rating INTEGER CHECK (confidence_rating IS NULL OR (confidence_rating BETWEEN 1 AND 5)),
    needs_revision BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lecture_time_order CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time),
    CONSTRAINT uq_lecture_user_slot UNIQUE (user_id, date, subject_id, start_time)
);

-- Attendance audit history (Reason required for any status modification)
CREATE TABLE IF NOT EXISTS attendance_audit_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecture_id VARCHAR(50) NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Topic Learning Progress
CREATE TABLE IF NOT EXISTS topic_learning_progress (
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id VARCHAR(50) NOT NULL,
    subject_id VARCHAR(50) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'learning' CHECK (status IN ('not_started', 'learning', 'understood', 'needs_revision')),
    confidence_rating INTEGER DEFAULT 3 CHECK (confidence_rating BETWEEN 1 AND 5),
    needs_revision BOOLEAN DEFAULT FALSE,
    next_revision_date DATE,
    personal_notes TEXT,
    questions_to_ask TEXT,
    last_revised_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, topic_id)
);

-- Revision sessions
CREATE TABLE IF NOT EXISTS revision_sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject_id VARCHAR(50) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    topic_id VARCHAR(50),
    topic_title VARCHAR(255) NOT NULL,
    duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0),
    confidence_after INTEGER CHECK (confidence_after BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks / Assignments
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id VARCHAR(50) REFERENCES curriculum_subjects(id) ON DELETE SET NULL,
    deadline DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('not_started', 'todo', 'in_progress', 'submitted', 'completed')),
    assessment_category VARCHAR(50),
    estimated_hours NUMERIC(5,2) DEFAULT 1.0 CHECK (estimated_hours >= 0),
    actual_hours NUMERIC(5,2) DEFAULT 0.0 CHECK (actual_hours >= 0),
    resource_url TEXT,
    submission_url TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student-uploaded personal documents
CREATE TABLE IF NOT EXISTS student_documents (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('pdf', 'docx', 'xlsx', 'txt', 'other')),
    file_size VARCHAR(50),
    file_hash VARCHAR(64) NOT NULL,
    subject_id VARCHAR(50) REFERENCES curriculum_subjects(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Conversations & Context-Linked Messages
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) REFERENCES curriculum_subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb, -- Array of { documentId, filename, page, excerpt }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes & Attempts
CREATE TABLE IF NOT EXISTS quizzes (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    topic_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id VARCHAR(50) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    answers JSONB NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quiz_score CHECK (score <= total_questions)
);

-- ============================================================================
-- 3. MIGRATION STAGING & FIELD-LEVEL CONFLICT AUDITING
-- ============================================================================

CREATE TABLE IF NOT EXISTS migration_staged_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'subjects', 'faculty', 'timetable', 'lectures', 'tasks'
    entity_id VARCHAR(50) NOT NULL,
    current_record JSONB,
    incoming_record JSONB NOT NULL,
    field_conflicts JSONB DEFAULT '[]'::jsonb, -- Array of { field, current, incoming, conflict_type }
    status VARCHAR(30) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'committed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. INTEGRITY TRIGGERS (TIMETABLE OVERLAP & DOUBLE-BOOKING GUARDS)
-- ============================================================================

-- A. Student cannot have overlapping timetable slots on the same date
CREATE OR REPLACE FUNCTION check_user_timetable_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_timetable_entries
        WHERE user_id = NEW.user_id
          AND specific_date = NEW.specific_date
          AND id != NEW.id
          AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    ) THEN
        RAISE EXCEPTION 'Timetable overlap conflict: Slot % to % overlaps with an existing slot on %', NEW.start_time, NEW.end_time, NEW.specific_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_user_timetable_overlap ON user_timetable_entries;
CREATE TRIGGER trg_check_user_timetable_overlap
BEFORE INSERT OR UPDATE ON user_timetable_entries
FOR EACH ROW EXECUTE FUNCTION check_user_timetable_overlap();

-- B. Classroom double-booking guard (prevent two classes in same physical room simultaneously)
CREATE OR REPLACE FUNCTION check_classroom_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.classroom IS NOT NULL AND TRIM(NEW.classroom) != '' AND NEW.classroom NOT IN ('UNASSIGNED', 'Cafeteria') THEN
        IF EXISTS (
            SELECT 1 FROM user_timetable_entries
            WHERE specific_date = NEW.specific_date
              AND classroom = NEW.classroom
              AND id != NEW.id
              AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
        ) THEN
            RAISE EXCEPTION 'Classroom double-booking conflict: Room % is already booked between % and % on %', NEW.classroom, NEW.start_time, NEW.end_time, NEW.specific_date;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_classroom_double_booking ON user_timetable_entries;
CREATE TRIGGER trg_check_classroom_double_booking
BEFORE INSERT OR UPDATE ON user_timetable_entries
FOR EACH ROW EXECUTE FUNCTION check_classroom_double_booking();

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lectures_user_date ON lectures (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_lectures_user_subject ON lectures (user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_date ON user_timetable_entries (user_id, specific_date);
CREATE INDEX IF NOT EXISTS idx_timetable_templates_day ON official_timetable_templates (cohort_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_tasks_user_deadline ON tasks (user_id, deadline, status);
CREATE INDEX IF NOT EXISTS idx_chunks_doc_page ON document_chunks (document_id, page_number);
