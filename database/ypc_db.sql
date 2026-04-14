-- ============================================================
--  YPC Student Portal — Database Schema
--  Run this entire file in phpMyAdmin → SQL tab
-- ============================================================

CREATE DATABASE IF NOT EXISTS ypc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ypc_db;

-- ============================================================
--  STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ypc_id        VARCHAR(20)  UNIQUE NOT NULL,
  ljmu_id       VARCHAR(30)  UNIQUE,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  programme     VARCHAR(150),
  semester      INT DEFAULT 1,
  cgpa          DECIMAL(3,2) DEFAULT 0.00,
  phone         VARCHAR(20),
  ic_number     VARCHAR(20),
  intake_date   DATE,
  status        ENUM('active','suspended','graduated') DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  code    VARCHAR(20)  UNIQUE NOT NULL,
  name    VARCHAR(150) NOT NULL,
  credits INT DEFAULT 3
);

-- ============================================================
--  ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  semester   VARCHAR(20),
  attended   INT DEFAULT 0,
  total      INT DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)  ON DELETE CASCADE
);

-- ============================================================
--  RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  semester   VARCHAR(20),
  grade      VARCHAR(5),
  score      INT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)  ON DELETE CASCADE
);

-- ============================================================
--  SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  day        ENUM('Mon','Tue','Wed','Thu','Fri','Sat') NOT NULL,
  time_start TIME NOT NULL,
  time_end   TIME NOT NULL,
  room       VARCHAR(80),
  lecturer   VARCHAR(100),
  type       ENUM('Lecture','Lab','Tutorial') DEFAULT 'Lecture',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)  ON DELETE CASCADE
);

-- ============================================================
--  ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  tag            VARCHAR(50),
  author         VARCHAR(100),
  content        TEXT,
  published_date DATE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  description VARCHAR(255),
  amount      DECIMAL(10,2),
  due_date    DATE,
  paid_date   DATE,
  status      ENUM('paid','pending','overdue') DEFAULT 'pending',
  type        ENUM('tuition','registration','exam','hostel','other') DEFAULT 'tuition',
  reference   VARCHAR(50),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
--  EXAM SLIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_slips (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  subject_id  INT NOT NULL,
  exam_date   DATE NOT NULL,
  exam_time   TIME NOT NULL,
  hall        VARCHAR(100),
  seat_number VARCHAR(10),
  semester    VARCHAR(20),
  qr_token    VARCHAR(64) UNIQUE NOT NULL,
  scanned_at  TIMESTAMP NULL DEFAULT NULL,
  scanned_by  VARCHAR(100),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)  ON DELETE CASCADE
);

-- ============================================================
--  ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(80)  NOT NULL DEFAULT 'Administrator',
  email         VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  SAMPLE DATA
-- ============================================================

-- NOTE: The password_hash below is for the plain-text password: password123
-- To regenerate run in PHP: echo password_hash('password123', PASSWORD_DEFAULT);
-- Then replace the hash string below.

-- ============================================================
--  ADMIN ACCOUNTS
-- ============================================================
-- Passwords below (plain text → hash):
--   admin      → admin123   (hash of 'admin123')
--   registrar  → reg2026    (hash of 'reg2026')
-- Regenerate: echo password_hash('yourpassword', PASSWORD_DEFAULT);

INSERT INTO admins (username, full_name, role, email, password_hash) VALUES
  ('admin',     'System Administrator', 'System Administrator', 'admin@ypc.edu.my',      '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('registrar', 'Registrar Office',     'Registrar',            'registrar@ypc.edu.my',  '$2y$10$lHMfON5N0jK2Q.bHb0N0eeWQBJxHAa6G9xN6MKrU0VyFNMLN2dHfy');

-- NOTE: The hash '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' is for 'password123'.
-- For production, generate real hashes:
--   admin:     password_hash('admin123', PASSWORD_DEFAULT)
--   registrar: password_hash('reg2026',  PASSWORD_DEFAULT)
-- Then replace both hashes above.

-- ============================================================
--  STUDENT SAMPLE DATA
-- ============================================================

INSERT INTO students (ypc_id, ljmu_id, name, email, password_hash, programme, semester, cgpa, phone, ic_number, intake_date, status)
VALUES (
  '23BIS12345',
  'LJMU-23-456789',
  'Maxwell Ng Yi Ken',
  'maxwell@student.ypc.edu.my',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Diploma in Business Information Systems',
  4,
  3.65,
  '+60123456789',
  '050312-14-XXXX',
  '2024-01-15',
  'active'
);

INSERT INTO subjects (code, name, credits) VALUES
  ('BIS2204', 'Database Systems',          3),
  ('BIS2101', 'Introduction to Programming', 3),
  ('BIS2301', 'Business Mathematics',       3),
  ('BIS2401', 'Principles of Marketing',    3),
  ('MPU2313', 'Communication Skills',       2);

-- Attendance (student id = 1)
INSERT INTO attendance (student_id, subject_id, semester, attended, total) VALUES
  (1, 1, 'Jan-Apr 2026', 23, 25),
  (1, 2, 'Jan-Apr 2026', 24, 25),
  (1, 3, 'Jan-Apr 2026', 22, 25),
  (1, 4, 'Jan-Apr 2026', 19, 25),
  (1, 5, 'Jan-Apr 2026', 21, 25);

-- Results (student id = 1)
INSERT INTO results (student_id, subject_id, semester, grade, score) VALUES
  (1, 1, 'Jan-Apr 2026', 'A',  88),
  (1, 2, 'Jan-Apr 2026', 'A-', 84),
  (1, 3, 'Jan-Apr 2026', 'B+', 76),
  (1, 4, 'Jan-Apr 2026', 'B',  72),
  (1, 5, 'Jan-Apr 2026', 'B-', 68);

-- Schedule (student id = 1)
INSERT INTO schedule (student_id, subject_id, day, time_start, time_end, room, lecturer, type) VALUES
  (1, 3, 'Fri', '08:00:00', '10:00:00', 'Block A, Room 203',  'Dr. Ahmad Fadzli', 'Lecture'),
  (1, 1, 'Fri', '10:00:00', '12:00:00', 'IT Block, Lab 2',    'Ms. Nurul Ain',    'Lab'),
  (1, 5, 'Fri', '14:00:00', '16:00:00', 'Block C, Room 105',  'Pn. Siti Hajar',   'Tutorial'),
  (1, 2, 'Mon', '08:00:00', '10:00:00', 'IT Block, Lab 1',    'Mr. Razif',        'Lab'),
  (1, 4, 'Mon', '14:00:00', '16:00:00', 'Block B, Room 110',  'Dr. Halim',        'Lecture'),
  (1, 1, 'Wed', '10:00:00', '12:00:00', 'Block A, Room 201',  'Ms. Nurul Ain',    'Lecture'),
  (1, 3, 'Wed', '14:00:00', '16:00:00', 'Block A, Room 203',  'Dr. Ahmad Fadzli', 'Tutorial');

-- Announcements
INSERT INTO announcements (title, tag, author, published_date) VALUES
  ('Online Evaluation for Foundation (Jan–Apr 2026)', '📢 Evaluation', 'HAMIZA YAZMIN', '2026-03-02'),
  ('Degree results and resit procedure for Sep–Dec 2025', '📋 Results',   'HAMIZA YAZMIN', '2026-02-27'),
  ('Bus schedule during Ramadhan 2026',                   '🚌 Transport',  'HAMIZA YAZMIN', '2026-02-23');

-- Payments (student id = 1)
INSERT INTO payments (student_id, description, amount, due_date, paid_date, status, type, reference) VALUES
  (1, 'Tuition Fee – Semester 4',       3500.00, '2026-01-10', '2026-01-08', 'paid', 'tuition',      'PAY2026-001'),
  (1, 'Registration Fee – Semester 4',   150.00, '2026-01-10', '2026-01-08', 'paid', 'registration', 'PAY2026-002'),
  (1, 'Exam Fee – Jan–Apr 2026',         200.00, '2026-04-01', '2026-03-20', 'paid', 'exam',         'PAY2026-003'),
  (1, 'Tuition Fee – Semester 3',       3500.00, '2025-07-10', '2025-07-05', 'paid', 'tuition',      'PAY2025-004'),
  (1, 'Registration Fee – Semester 3',   150.00, '2025-07-10', '2025-07-05', 'paid', 'registration', 'PAY2025-005');

-- Exam slips (student id = 1)
-- qr_token should be a unique random string per student per subject — these are samples
INSERT INTO exam_slips (student_id, subject_id, exam_date, exam_time, hall, seat_number, semester, qr_token) VALUES
  (1, 1, '2026-05-12', '09:00:00', 'Exam Hall A', 'A12', 'Jan-Apr 2026', 'ES-BIS2204-23BIS12345-0512'),
  (1, 2, '2026-05-14', '09:00:00', 'Exam Hall A', 'A14', 'Jan-Apr 2026', 'ES-BIS2101-23BIS12345-0514'),
  (1, 3, '2026-05-16', '14:00:00', 'Exam Hall B', 'B07', 'Jan-Apr 2026', 'ES-BIS2301-23BIS12345-0516'),
  (1, 4, '2026-05-19', '09:00:00', 'Exam Hall A', 'A12', 'Jan-Apr 2026', 'ES-BIS2401-23BIS12345-0519'),
  (1, 5, '2026-05-21', '14:00:00', 'Exam Hall B', 'B03', 'Jan-Apr 2026', 'ES-MPU2313-23BIS12345-0521');
