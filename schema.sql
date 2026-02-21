CREATE TABLE users (
	user_id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    resume_url VARCHAR(500),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    website VARCHAR(255)
);

CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(100),
	salary_range VARCHAR(100),
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
    UNIQUE(user_id, job_id),
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

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_link VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500);


--test
-- Insert sample users
INSERT INTO users (name, email, password_hash, bio) VALUES
('John Doe', 'john@example.com', '$2b$12$KIXQnZy...', 'Passionate software engineer with a love for building scalable systems.'),
('Jane Smith', 'jane@example.com', 'hashed_password456', 'Frontend specialist focused on user-centric design.'),
('Mike Johnson', 'mike@example.com', 'hashes_password789', 'Backend developer with expertise in Python and SQL.');

-- Insert sample skills
INSERT INTO skills (skill_name) VALUES
('Java'),
('C++'),
('C#'),
('Go'),
('TypeScript'),
('Kotlin'),
('Swift'),
('Node.js'),
('Express.js'),
('Django'),
('Flask'),
('REST APIs'),
('GraphQL'),
('JWT Authentication'),
('MySQL'),
('MongoDB'),
('Redis'),
('Data Analysis'),
('Machine Learning'),
('Power BI'),
('Tableau'),
('AWS'),
('Azure'),
('Google Cloud'),
('Kubernetes'),
('CI/CD'),
('Linux'),
('Terraform'),
('React Native'),
('Flutter'),
('Android Development'),
('iOS Development'),
('Figma'),
('UI Design'),
('UX Research'),
('Adobe XD'),
('Project Management'),
('Agile Methodology'),
('Scrum'),
('Business Analysis'),
('Strategic Planning'),
('Digital Marketing'),
('SEO'),
('Content Marketing'),
('Email Marketing'),
('CRM Tools'),
('Sales Negotiation'),
('Financial Modeling'),
('Budget Planning'),
('Supply Chain Management'),
('Risk Management'),
('Communication'),
('Leadership'),
('Problem Solving'),
('Critical Thinking'),
('Team Collaboration'),
('Time Management'),
('Public Speaking');

-- Insert user skills
INSERT INTO user_skills (user_id, skill_id) VALUES
(1, 1), (1, 4), (1, 5), (2, 2), (2, 3), (2, 7), (2, 8), (3, 1), (3, 5), (3, 6);

-- Insert sample companies
INSERT INTO companies (company_name, location, website) VALUES
('Google', 'Mountain View, CA', 'https://google.com'),
('Microsoft', 'Seattle, WA', 'https://microsoft.com'),
('Amazon', 'Seattle, WA', 'https://amazon.com'),
('Meta', 'Menlo Park, CA', 'https://meta.com'),
('Apple', 'Cupertino, CA', 'https://apple.com'),
('Tesla', 'Austin, TX', 'https://tesla.com'),
('Netflix', 'Los Gatos, CA', 'https://netflix.com'),
('Goldman Sachs', 'New York, NY', 'https://goldmansachs.com'),
('Pfizer', 'New York, NY', 'https://pfizer.com'),
('Airbnb', 'San Francisco, CA', 'https://airbnb.com'),
('Nike', 'Beaverton, OR', 'https://nike.com'),
('IBM', 'Armonk, NY', 'https://ibm.com'),
('Salesforce', 'San Francisco, CA', 'https://salesforce.com');

INSERT INTO jobs (company_id, title, description, job_type, salary_range) VALUES
(1, 'Software Engineer',
'We are seeking a passionate Software Engineer to design, develop, and maintain scalable web applications that power critical business operations. In this role, you will collaborate with cross-functional teams to build reliable backend services, optimize system performance, and implement secure RESTful APIs. The ideal candidate has strong knowledge of data structures and algorithms, hands-on experience with backend frameworks, and familiarity with relational databases such as PostgreSQL. You should be comfortable working in an agile development environment, writing clean and testable code, and participating in code reviews. Experience with cloud platforms, CI/CD pipelines, and version control systems like Git is highly valued. This position offers opportunities to work on impactful projects and grow into a senior technical role.',
'Full-time', '$100k-$150k'),

(1, 'Frontend Developer',
'We are looking for a creative and detail-oriented Frontend Developer to craft responsive and engaging user interfaces for modern web applications. You will translate UI/UX designs into interactive experiences using HTML, CSS, JavaScript, and frameworks such as React. The role involves collaborating closely with backend developers to integrate APIs and ensure seamless data flow across the application. Strong understanding of responsive design principles, accessibility standards, and performance optimization techniques is required. Experience with state management libraries, component-based architecture, and version control workflows is preferred. This role provides the opportunity to shape user experiences that directly impact customer satisfaction and product success.',
'Full-time', '$90k-$130k'),

(2, 'Data Analyst',
'We are hiring a results-driven Data Analyst to collect, process, and analyze complex datasets that inform strategic business decisions. You will be responsible for creating dashboards, generating reports, and presenting actionable insights to stakeholders across departments. Strong proficiency in SQL, data visualization tools, and spreadsheet analysis is essential. The ideal candidate has a solid understanding of statistical concepts and the ability to interpret trends and patterns effectively. Experience working with large datasets and familiarity with business intelligence platforms is highly desirable. This role is ideal for someone who enjoys transforming data into meaningful stories that drive organizational growth.',
'Full-time', '$80k-$120k'),

(3, 'Backend Developer',
'We are seeking a skilled Backend Developer to build and maintain secure, high-performance server-side applications. You will design scalable APIs, manage database interactions, and ensure system reliability and security. The ideal candidate has experience with backend technologies such as FastAPI or similar frameworks, and strong knowledge of PostgreSQL or other relational databases. Responsibilities include implementing authentication mechanisms, optimizing queries, and collaborating with frontend teams for smooth feature integration. Familiarity with containerization tools like Docker and deployment workflows is considered a strong advantage. This remote role offers flexibility and the chance to contribute to architecture-level decisions.',
'Remote', '$95k-$140k'),

(4, 'UI/UX Designer',
'We are looking for a talented UI/UX Designer to create intuitive, visually appealing, and user-centered digital experiences. In this role, you will conduct user research, develop wireframes and interactive prototypes, and refine visual designs based on user feedback. Proficiency in design tools such as Figma or Adobe XD is required, along with a strong understanding of usability principles and accessibility guidelines. You will collaborate closely with product managers and developers to ensure that design concepts are effectively translated into functional interfaces. This position is ideal for someone who combines creativity with analytical thinking to enhance overall user satisfaction.',
'Contract', '$70k-$110k'),

(5, 'Mobile Developer',
'We are seeking an experienced Mobile Developer to design and build high-quality mobile applications for iOS and Android platforms. You will be responsible for implementing new features, optimizing application performance, and ensuring smooth user interactions across devices. The ideal candidate has hands-on experience with mobile frameworks such as Flutter, React Native, or native development tools. Strong understanding of API integration, mobile UI standards, and app deployment processes is required. You should be comfortable debugging issues, improving code efficiency, and collaborating with cross-functional teams. This role offers the opportunity to contribute to innovative mobile solutions used by a growing user base.',
'Full-time', '$100k-$145k'),
(6, 'DevOps Engineer',
'We are seeking a DevOps Engineer to manage CI/CD pipelines, cloud infrastructure, and deployment workflows. The ideal candidate has experience with Docker, Kubernetes, and cloud platforms such as AWS or Azure. Strong scripting skills and understanding of system reliability are essential.',
'Full-time', '$110k-$160k'),

(7, 'Machine Learning Engineer',
'Design and deploy machine learning models that power recommendation systems and data-driven insights. Candidates should have experience with Python, TensorFlow or PyTorch, and data preprocessing techniques.',
'Full-time', '$120k-$170k'),

(8, 'Cybersecurity Analyst',
'Protect organizational systems by monitoring threats, performing vulnerability assessments, and implementing security protocols. Knowledge of network security, encryption, and incident response is required.',
'Full-time', '$95k-$140k'),

 
(9, 'Financial Analyst',
'Analyze financial data, prepare forecasts, and support strategic investment decisions. Strong analytical skills, Excel proficiency, and understanding of financial modeling are required.',
'Full-time', '$85k-$130k'),

(9, 'Investment Banking Associate',
'Support mergers, acquisitions, and capital raising activities by preparing presentations, conducting market research, and performing valuation analysis.',
'Full-time', '$130k-$200k'),

(10, 'Digital Marketing Specialist',
'Develop and execute online marketing campaigns across social media, SEO, and paid advertising platforms. Experience with analytics tools and content strategy is preferred.',
'Full-time', '$70k-$110k'),

(11, 'Sales Executive',
'Drive revenue growth by identifying new business opportunities and managing client relationships. Strong communication and negotiation skills are essential.',
'Full-time', '$75k-$120k'),

(13, 'Brand Manager',
'Lead brand strategy, oversee marketing campaigns, and ensure consistent messaging across channels. Experience in consumer behavior analysis and market research is required.',
'Full-time', '$90k-$140k'),
 
(12, 'Human Resources Manager',
'Oversee recruitment, employee relations, and performance management processes. Strong interpersonal skills and knowledge of labor laws are required.',
'Full-time', '$80k-$120k'),

(6, 'Operations Manager',
'Coordinate cross-departmental operations to improve efficiency and productivity. Experience in supply chain management and process optimization is preferred.',
'Full-time', '$95k-$145k'),

(10, 'Healthcare Data Coordinator',
'Manage healthcare data records, ensure regulatory compliance, and assist in reporting. Experience in healthcare systems and data accuracy standards is required.',
'Full-time', '$65k-$95k'),

(10, 'Clinical Research Associate',
'Monitor clinical trials, ensure regulatory compliance, and analyze trial data. A background in life sciences or related fields is preferred.',
'Contract', '$75k-$115k'),

(7, 'Technical Trainer',
'Develop and deliver training programs on technical tools and systems. Strong presentation skills and hands-on technical knowledge are essential.',
'Full-time', '$70k-$105k'),

(12, 'Learning & Development Specialist',
'Design employee development programs and training materials to enhance workforce skills and engagement.',
'Full-time', '$75k-$110k'),

(7, 'Content Strategist',
'Plan, create, and manage engaging content across digital platforms. Experience in storytelling, SEO, and analytics is preferred.',
'Full-time', '$70k-$115k'),

(10, 'Product Manager',
'Lead cross-functional teams to deliver innovative products from concept to launch. Strong leadership and strategic planning skills required.',
'Full-time', '$110k-$160k'),

(6, 'Supply Chain Analyst',
'Analyze supply chain processes to improve efficiency and reduce costs. Strong analytical and problem-solving skills required.',
'Full-time', '$80k-$120k'),

(13, 'Retail Operations Supervisor',
'Oversee daily retail operations, manage staff performance, and ensure excellent customer experience.',
'Full-time', '$60k-$90k'),

(11, 'Customer Success Manager',
'Build long-term client relationships, ensure customer satisfaction, and drive retention strategies.',
'Remote', '$75k-$115k'),

(12, 'Business Analyst',
'Gather and analyze business requirements to support strategic initiatives and technology implementations.',
'Full-time', '$85k-$125k');

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


-- DROP TABLE IF EXISTS interviews CASCADE;
-- DROP TABLE IF EXISTS applications CASCADE;
-- DROP TABLE IF EXISTS jobs CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
