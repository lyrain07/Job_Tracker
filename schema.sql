CREATE TABLE users (
	user_id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) unique not null,
	password_hash VARCHAR(255) not null,
    bio TEXT,
    resume_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    twitter_url VARCHAR(500),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    website VARCHAR(255)
);

CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE user_skills (
    user_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(100),
	salary_range VARCHAR(100),
    application_link VARCHAR(500),
	posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
	CHECK(job_type IN ('Full-time','Part-time','Contract','Remote'))
);

CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Applied',
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_job UNIQUE(user_id, job_id),
	CHECK (status IN ('Applied', 'Interviewing', 'Rejected', 'Hired'))
);

CREATE TABLE interviews (
    interview_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
	round INTEGER NOT NULL,
    interview_date DATE,
    mode VARCHAR(50),
    remarks TEXT,
	result VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
	CHECK (result IN('Passed','Failed','Pending'))
);

-- Indexes for faster queries

CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_interviews_application ON interviews(application_id);

--View for tracking application

CREATE VIEW application_details AS
SELECT 
    a.application_id,
    u.name AS applicant_name,
    c.company_name,
    j.title AS job_title,
    j.job_type,
    j.salary_range,
    a.applied_date,
    a.status,
    a.notes
FROM applications a
JOIN users u ON a.user_id = u.user_id
JOIN jobs j ON a.job_id = j.job_id
JOIN companies c ON j.company_id = c.company_id; 

CREATE VIEW interview_details AS
SELECT
    a.application_id,
    u.name AS applicant_name,
    c.company_name,
    j.title AS job_title,
    j.job_type,
    j.salary_range,
    a.applied_date,
    a.status AS application_status,
    COALESCE(i.round, 0) AS round,
    COALESCE(i.interview_date::TEXT, 'Not Scheduled') AS interview_date,
    COALESCE(i.mode, 'Not Scheduled') AS mode,
    COALESCE(i.remarks, 'Not Scheduled') AS remarks,
    COALESCE(i.result, 'Not Scheduled') AS result
FROM applications a
JOIN users u ON a.user_id = u.user_id
JOIN jobs j ON a.job_id = j.job_id
JOIN companies c ON j.company_id = c.company_id
LEFT JOIN interviews i ON a.application_id = i.application_id;

CREATE VIEW user_profile AS
SELECT
    u.user_id,
    u.name,
    u.email,
    u.created_at,
    a.application_id,
    j.title AS job_title,
    c.company_name,
    a.status AS application_status,
    a.applied_date
FROM users u
LEFT JOIN applications a ON u.user_id = a.user_id
LEFT JOIN jobs j ON a.job_id = j.job_id
LEFT JOIN companies c ON j.company_id = c.company_id;

CREATE VIEW user_profile_full AS
SELECT
    u.user_id,
    u.name,
    u.email,
    u.created_at,
    a.application_id,
    j.title AS job_title,
    c.company_name,
    a.status AS application_status,
    a.applied_date,
    COALESCE(i.round, 0) AS interview_round,
    COALESCE(i.interview_date::TEXT, 'Not Scheduled') AS interview_date,
    COALESCE(i.mode, 'Not Scheduled') AS interview_mode,
    COALESCE(i.result, 'Not Scheduled') AS interview_result
FROM users u
LEFT JOIN applications a ON u.user_id = a.user_id
LEFT JOIN jobs j ON a.job_id = j.job_id
LEFT JOIN companies c ON j.company_id = c.company_id
LEFT JOIN interviews i ON a.application_id = i.application_id;


CREATE VIEW upcoming_interviews AS
SELECT
    u.user_id,
    u.name,
    a.application_id,
    j.title AS job_title,
    c.company_name,
    i.round AS interview_round,
    i.interview_date,
    i.mode AS interview_mode,
    i.result AS interview_result
FROM users u
JOIN applications a ON u.user_id = a.user_id
JOIN jobs j ON a.job_id = j.job_id
JOIN companies c ON j.company_id = c.company_id
JOIN interviews i ON a.application_id = i.application_id
WHERE i.result = 'Pending'
ORDER BY i.interview_date ASC;

--Dashboard
CREATE VIEW user_dashboard AS
SELECT
    u.user_id,
    u.name,
    u.email,
    
    -- Total applications
    COUNT(a.application_id) AS total_applications,
    
    -- Applications by status
    COUNT(CASE WHEN a.status = 'Applied' THEN 1 END) AS applied_count,
    COUNT(CASE WHEN a.status = 'Interviewing' THEN 1 END) AS interviewing_count,
    COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) AS rejected_count,
    COUNT(CASE WHEN a.status = 'Hired' THEN 1 END) AS hired_count,
    
    -- Upcoming interviews
    COUNT(CASE WHEN i.result = 'Pending' THEN 1 END) AS upcoming_interviews,
    
    -- Last applied job info
    MAX(a.applied_date) AS last_applied_date,
    MAX(j.title) FILTER (WHERE a.applied_date = (SELECT MAX(a2.applied_date) 
                                                FROM applications a2 
                                                WHERE a2.user_id = u.user_id)) AS last_applied_job
FROM users u
LEFT JOIN applications a ON u.user_id = a.user_id
LEFT JOIN jobs j ON a.job_id = j.job_id
LEFT JOIN interviews i ON a.application_id = i.application_id
GROUP BY u.user_id, u.name, u.email;


--test
--Insert sample users
INSERT INTO users (name, email, password_hash) VALUES
('John Doe', 'john@example.com', '$2b$12$KIXQnZy...'),
('Jane Smith', 'jane@example.com', 'hashed_password456'),
('Mike Johnson', 'mike@example.com', 'hashes_password789');

-- Insert sample companies
INSERT INTO companies (company_name, location, website) VALUES
('Google', 'Mountain View, CA', 'https://google.com'),
('Microsoft', 'Seattle, WA', 'https://microsoft.com'),
('Amazon', 'Seattle, WA', 'https://amazon.com'),
('Meta', 'Menlo Park, CA', 'https://meta.com'),
('Apple', 'Cupertino, CA', 'https://apple.com');

-- Insert sample jobs
INSERT INTO jobs (company_id, title, description, job_type, salary_range) VALUES
(1, 'Software Engineer', 'Build scalable applications using modern technologies', 'Full-time', '$100k-$150k'),
(1, 'Frontend Developer', 'Create amazing user interfaces with React', 'Full-time', '$90k-$130k'),
(2, 'Data Analyst', 'Analyze data and create insights for business decisions', 'Full-time', '$80k-$120k'),
(3, 'Backend Developer', 'Design and implement server-side logic', 'Remote', '$95k-$140k'),
(4, 'UI/UX Designer', 'Design intuitive and beautiful user experiences', 'Contract', '$70k-$110k'),
(5, 'Mobile Developer', 'Build iOS and Android applications', 'Full-time', '$100k-$145k');

-- Insert sample applications
INSERT INTO applications (user_id, job_id, applied_date, status, notes) VALUES
(1, 1, '2025-01-15', 'Applied', 'Submitted resume and cover letter'),
(1, 2, '2025-01-18', 'Interviewing', 'First round completed'),
(1, 3, '2025-01-20', 'Applied', 'Waiting for response'),
(2, 4, '2025-01-10', 'Rejected', 'Not enough experience'),
(2, 5, '2025-01-22', 'Applied', 'Applied through LinkedIn');

-- Insert sample interviews
INSERT INTO interviews (application_id, round, interview_date, mode, remarks, result) VALUES
(1, 1, '2025-01-17', 'Online', 'Initial HR screening', 'Passed'),
(2, 1, '2025-01-25', 'Online', 'Technical interview scheduled with senior engineer', DEFAULT),
(2, 2, '2025-01-28', 'In-person', 'Final round with hiring manager', DEFAULT),
(3, 1, '2025-01-22', 'Online', 'Phone screening', 'Failed'),
(4, 1, '2025-01-12', 'Online', 'HR round', 'Failed');

-- DROP TABLE IF EXISTS interview, application, job, company, users CASCADE;


-- SELECT * FROM interview;

TRUNCATE TABLE user_skills, skills, interviews, applications, jobs, companies, users RESTART IDENTITY CASCADE;


--Test
SELECT 
    a.application_id,
    u.name AS user_name,
    u.email AS user_email,
    j.title AS job_title,
    j.job_type,
    c.company_name,
    c.location AS company_location,
    a.applied_date,
    a.status,
    a.notes
FROM applications a
JOIN users u ON a.user_id = u.user_id
JOIN jobs j ON a.job_id = j.job_id
JOIN companies c ON j.company_id = c.company_id
ORDER BY a.application_id;

SELECT
    a.application_id,
    u.name AS user_name,
    u.email AS user_email,
    j.title AS job_title,
    j.job_type,
    c.company_name,
    c.location AS company_location,
    a.applied_date,
    a.status AS application_status,
    COALESCE(i.round, 0) AS interview_round,
	COALESCE(i.interview_date, null) AS interview_date,
	COALESCE(i.mode, '-') AS interview_mode,
    COALESCE(i.result, 'Not Scheduled') AS interview_result
FROM applications a
JOIN users u ON a.user_id = u.user_id
JOIN jobs j ON a.job_id = j.job_id
JOIN companies c ON j.company_id = c.company_id
LEFT JOIN interviews i ON a.application_id = i.application_id
ORDER BY a.application_id, i.round;



--test views


SELECT *
FROM interview_details
WHERE applicant_name = 'John Doe'
ORDER BY applied_date DESC;

SELECT *
FROM interview_details
WHERE applicant_name = 'John Doe'
  AND application_status IN ('Applied', 'Interviewing')
ORDER BY applied_date DESC;

SELECT * FROM user_profile WHERE user_id = 1;
SELECT * FROM user_profile_full WHERE user_id = 1;
SELECT * FROM upcoming_interviews WHERE user_id = 1;

SELECT * FROM user_dashboard WHERE user_id = 1;


DROP VIEW IF EXISTS interview_details CASCADE;
DROP VIEW IF EXISTS application_details CASCADE;

Select * from users;


-- DROP TABLE IF EXISTS user_skills CASCADE;
-- DROP TABLE IF EXISTS skills CASCADE;
-- DROP TABLE IF EXISTS interviews CASCADE;
-- DROP TABLE IF EXISTS applications CASCADE;
-- DROP TABLE IF EXISTS jobs CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
