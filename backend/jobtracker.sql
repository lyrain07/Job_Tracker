--
-- PostgreSQL database dump
--

\restrict dQACNCPoTZs2JePmc3d5PrMo8Dytre9dYvpMXHEWJWMLFF2PbVHdu7jYDwxaH7e

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-21 13:20:31

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 17996)
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    application_id integer NOT NULL,
    user_id integer NOT NULL,
    job_id integer NOT NULL,
    applied_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'Applied'::character varying,
    notes text,
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['Applied'::character varying, 'Interviewing'::character varying, 'Rejected'::character varying, 'Hired'::character varying])::text[])))
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17966)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    company_id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    location character varying(255),
    website character varying(255)
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17977)
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    job_id integer NOT NULL,
    company_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    job_type character varying(100),
    salary_range character varying(100),
    posted_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT jobs_job_type_check CHECK (((job_type)::text = ANY ((ARRAY['Full-time'::character varying, 'Part-time'::character varying, 'Contract'::character varying, 'Remote'::character varying])::text[])))
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17950)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    bio text,
    resume_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 18072)
-- Name: application_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.application_details AS
 SELECT a.application_id,
    u.name AS applicant_name,
    c.company_name,
    j.title AS job_title,
    j.job_type,
    j.salary_range,
    a.applied_date,
    a.status,
    a.notes
   FROM (((public.applications a
     JOIN public.users u ON ((a.user_id = u.user_id)))
     JOIN public.jobs j ON ((a.job_id = j.job_id)))
     JOIN public.companies c ON ((j.company_id = c.company_id)));


ALTER VIEW public.application_details OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17995)
-- Name: applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_application_id_seq OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 225
-- Name: applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_application_id_seq OWNED BY public.applications.application_id;


--
-- TOC entry 221 (class 1259 OID 17965)
-- Name: companies_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_company_id_seq OWNER TO postgres;

--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 221
-- Name: companies_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_company_id_seq OWNED BY public.companies.company_id;


--
-- TOC entry 228 (class 1259 OID 18023)
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interviews (
    interview_id integer NOT NULL,
    application_id integer NOT NULL,
    round integer NOT NULL,
    interview_date date,
    mode character varying(50),
    remarks text,
    result character varying(50) DEFAULT 'Pending'::character varying,
    CONSTRAINT interviews_result_check CHECK (((result)::text = ANY ((ARRAY['Passed'::character varying, 'Failed'::character varying, 'Pending'::character varying])::text[])))
);


ALTER TABLE public.interviews OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 18077)
-- Name: interview_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.interview_details AS
 SELECT a.application_id,
    u.name AS applicant_name,
    c.company_name,
    j.title AS job_title,
    j.job_type,
    j.salary_range,
    a.applied_date,
    a.status AS application_status,
    COALESCE(i.round, 0) AS round,
    COALESCE((i.interview_date)::text, 'Not Scheduled'::text) AS interview_date,
    COALESCE(i.mode, 'Not Scheduled'::character varying) AS mode,
    COALESCE(i.remarks, 'Not Scheduled'::text) AS remarks,
    COALESCE(i.result, 'Not Scheduled'::character varying) AS result
   FROM ((((public.applications a
     JOIN public.users u ON ((a.user_id = u.user_id)))
     JOIN public.jobs j ON ((a.job_id = j.job_id)))
     JOIN public.companies c ON ((j.company_id = c.company_id)))
     LEFT JOIN public.interviews i ON ((a.application_id = i.application_id)));


ALTER VIEW public.interview_details OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 18022)
-- Name: interviews_interview_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interviews_interview_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interviews_interview_id_seq OWNER TO postgres;

--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 227
-- Name: interviews_interview_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interviews_interview_id_seq OWNED BY public.interviews.interview_id;


--
-- TOC entry 223 (class 1259 OID 17976)
-- Name: jobs_job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_job_id_seq OWNER TO postgres;

--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 223
-- Name: jobs_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_job_id_seq OWNED BY public.jobs.job_id;


--
-- TOC entry 230 (class 1259 OID 18042)
-- Name: skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skills (
    skill_id integer NOT NULL,
    skill_name character varying(100) NOT NULL
);


ALTER TABLE public.skills OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 18041)
-- Name: skills_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skills_skill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skills_skill_id_seq OWNER TO postgres;

--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 229
-- Name: skills_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skills_skill_id_seq OWNED BY public.skills.skill_id;


--
-- TOC entry 236 (class 1259 OID 18092)
-- Name: upcoming_interviews; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.upcoming_interviews AS
 SELECT u.user_id,
    u.name,
    a.application_id,
    j.title AS job_title,
    c.company_name,
    i.round AS interview_round,
    i.interview_date,
    i.mode AS interview_mode,
    i.result AS interview_result
   FROM ((((public.users u
     JOIN public.applications a ON ((u.user_id = a.user_id)))
     JOIN public.jobs j ON ((a.job_id = j.job_id)))
     JOIN public.companies c ON ((j.company_id = c.company_id)))
     JOIN public.interviews i ON ((a.application_id = i.application_id)))
  WHERE ((i.result)::text = 'Pending'::text)
  ORDER BY i.interview_date;


ALTER VIEW public.upcoming_interviews OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 18097)
-- Name: user_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_dashboard AS
 SELECT u.user_id,
    u.name,
    u.email,
    count(a.application_id) AS total_applications,
    count(
        CASE
            WHEN ((a.status)::text = 'Applied'::text) THEN 1
            ELSE NULL::integer
        END) AS applied_count,
    count(
        CASE
            WHEN ((a.status)::text = 'Interviewing'::text) THEN 1
            ELSE NULL::integer
        END) AS interviewing_count,
    count(
        CASE
            WHEN ((a.status)::text = 'Rejected'::text) THEN 1
            ELSE NULL::integer
        END) AS rejected_count,
    count(
        CASE
            WHEN ((a.status)::text = 'Hired'::text) THEN 1
            ELSE NULL::integer
        END) AS hired_count,
    count(
        CASE
            WHEN ((i.result)::text = 'Pending'::text) THEN 1
            ELSE NULL::integer
        END) AS upcoming_interviews,
    max(a.applied_date) AS last_applied_date,
    max((j.title)::text) FILTER (WHERE (a.applied_date = ( SELECT max(a2.applied_date) AS max
           FROM public.applications a2
          WHERE (a2.user_id = u.user_id)))) AS last_applied_job
   FROM (((public.users u
     LEFT JOIN public.applications a ON ((u.user_id = a.user_id)))
     LEFT JOIN public.jobs j ON ((a.job_id = j.job_id)))
     LEFT JOIN public.interviews i ON ((a.application_id = i.application_id)))
  GROUP BY u.user_id, u.name, u.email;


ALTER VIEW public.user_dashboard OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 18082)
-- Name: user_profile; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_profile AS
 SELECT u.user_id,
    u.name,
    u.email,
    u.created_at,
    a.application_id,
    j.title AS job_title,
    c.company_name,
    a.status AS application_status,
    a.applied_date
   FROM (((public.users u
     LEFT JOIN public.applications a ON ((u.user_id = a.user_id)))
     LEFT JOIN public.jobs j ON ((a.job_id = j.job_id)))
     LEFT JOIN public.companies c ON ((j.company_id = c.company_id)));


ALTER VIEW public.user_profile OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 18087)
-- Name: user_profile_full; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_profile_full AS
 SELECT u.user_id,
    u.name,
    u.email,
    u.created_at,
    a.application_id,
    j.title AS job_title,
    c.company_name,
    a.status AS application_status,
    a.applied_date,
    COALESCE(i.round, 0) AS interview_round,
    COALESCE((i.interview_date)::text, 'Not Scheduled'::text) AS interview_date,
    COALESCE(i.mode, 'Not Scheduled'::character varying) AS interview_mode,
    COALESCE(i.result, 'Not Scheduled'::character varying) AS interview_result
   FROM ((((public.users u
     LEFT JOIN public.applications a ON ((u.user_id = a.user_id)))
     LEFT JOIN public.jobs j ON ((a.job_id = j.job_id)))
     LEFT JOIN public.companies c ON ((j.company_id = c.company_id)))
     LEFT JOIN public.interviews i ON ((a.application_id = i.application_id)));


ALTER VIEW public.user_profile_full OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 18052)
-- Name: user_skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_skills (
    user_id integer NOT NULL,
    skill_id integer NOT NULL
);


ALTER TABLE public.user_skills OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17949)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4914 (class 2604 OID 17999)
-- Name: applications application_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN application_id SET DEFAULT nextval('public.applications_application_id_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 17969)
-- Name: companies company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN company_id SET DEFAULT nextval('public.companies_company_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 18026)
-- Name: interviews interview_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews ALTER COLUMN interview_id SET DEFAULT nextval('public.interviews_interview_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 17980)
-- Name: jobs job_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN job_id SET DEFAULT nextval('public.jobs_job_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 18045)
-- Name: skills skill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills ALTER COLUMN skill_id SET DEFAULT nextval('public.skills_skill_id_seq'::regclass);


--
-- TOC entry 4909 (class 2604 OID 17953)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5112 (class 0 OID 17996)
-- Dependencies: 226
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (application_id, user_id, job_id, applied_date, status, notes) FROM stdin;
1	1	1	2025-01-15 00:00:00	Applied	Submitted resume and cover letter
2	1	2	2025-01-18 00:00:00	Interviewing	First round completed
3	1	3	2025-01-20 00:00:00	Applied	Waiting for response
4	2	4	2025-01-10 00:00:00	Rejected	Not enough experience
5	2	5	2025-01-22 00:00:00	Applied	Applied through LinkedIn
\.


--
-- TOC entry 5108 (class 0 OID 17966)
-- Dependencies: 222
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (company_id, company_name, location, website) FROM stdin;
1	Google	Mountain View, CA	https://google.com
2	Microsoft	Seattle, WA	https://microsoft.com
3	Amazon	Seattle, WA	https://amazon.com
4	Meta	Menlo Park, CA	https://meta.com
5	Apple	Cupertino, CA	https://apple.com
6	Tesla	Austin, TX	https://tesla.com
7	Netflix	Los Gatos, CA	https://netflix.com
8	Goldman Sachs	New York, NY	https://goldmansachs.com
9	Pfizer	New York, NY	https://pfizer.com
10	Airbnb	San Francisco, CA	https://airbnb.com
11	Nike	Beaverton, OR	https://nike.com
12	IBM	Armonk, NY	https://ibm.com
13	Salesforce	San Francisco, CA	https://salesforce.com
\.


--
-- TOC entry 5114 (class 0 OID 18023)
-- Dependencies: 228
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interviews (interview_id, application_id, round, interview_date, mode, remarks, result) FROM stdin;
1	1	1	2025-01-17	Online	Initial HR screening	Passed
2	2	1	2025-01-25	Online	Technical interview scheduled with senior engineer	Pending
3	2	2	2025-01-28	In-person	Final round with hiring manager	Pending
4	3	1	2025-01-22	Online	Phone screening	Failed
5	4	1	2025-01-12	Online	HR round	Failed
\.


--
-- TOC entry 5110 (class 0 OID 17977)
-- Dependencies: 224
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (job_id, company_id, title, description, job_type, salary_range, posted_date) FROM stdin;
1	1	Software Engineer	We are seeking a passionate Software Engineer to design, develop, and maintain scalable web applications that power critical business operations. In this role, you will collaborate with cross-functional teams to build reliable backend services, optimize system performance, and implement secure RESTful APIs. The ideal candidate has strong knowledge of data structures and algorithms, hands-on experience with backend frameworks, and familiarity with relational databases such as PostgreSQL. You should be comfortable working in an agile development environment, writing clean and testable code, and participating in code reviews. Experience with cloud platforms, CI/CD pipelines, and version control systems like Git is highly valued. This position offers opportunities to work on impactful projects and grow into a senior technical role.	Full-time	$100k-$150k	2026-02-21 13:02:13.226149
2	1	Frontend Developer	We are looking for a creative and detail-oriented Frontend Developer to craft responsive and engaging user interfaces for modern web applications. You will translate UI/UX designs into interactive experiences using HTML, CSS, JavaScript, and frameworks such as React. The role involves collaborating closely with backend developers to integrate APIs and ensure seamless data flow across the application. Strong understanding of responsive design principles, accessibility standards, and performance optimization techniques is required. Experience with state management libraries, component-based architecture, and version control workflows is preferred. This role provides the opportunity to shape user experiences that directly impact customer satisfaction and product success.	Full-time	$90k-$130k	2026-02-21 13:02:13.226149
3	2	Data Analyst	We are hiring a results-driven Data Analyst to collect, process, and analyze complex datasets that inform strategic business decisions. You will be responsible for creating dashboards, generating reports, and presenting actionable insights to stakeholders across departments. Strong proficiency in SQL, data visualization tools, and spreadsheet analysis is essential. The ideal candidate has a solid understanding of statistical concepts and the ability to interpret trends and patterns effectively. Experience working with large datasets and familiarity with business intelligence platforms is highly desirable. This role is ideal for someone who enjoys transforming data into meaningful stories that drive organizational growth.	Full-time	$80k-$120k	2026-02-21 13:02:13.226149
4	3	Backend Developer	We are seeking a skilled Backend Developer to build and maintain secure, high-performance server-side applications. You will design scalable APIs, manage database interactions, and ensure system reliability and security. The ideal candidate has experience with backend technologies such as FastAPI or similar frameworks, and strong knowledge of PostgreSQL or other relational databases. Responsibilities include implementing authentication mechanisms, optimizing queries, and collaborating with frontend teams for smooth feature integration. Familiarity with containerization tools like Docker and deployment workflows is considered a strong advantage. This remote role offers flexibility and the chance to contribute to architecture-level decisions.	Remote	$95k-$140k	2026-02-21 13:02:13.226149
5	4	UI/UX Designer	We are looking for a talented UI/UX Designer to create intuitive, visually appealing, and user-centered digital experiences. In this role, you will conduct user research, develop wireframes and interactive prototypes, and refine visual designs based on user feedback. Proficiency in design tools such as Figma or Adobe XD is required, along with a strong understanding of usability principles and accessibility guidelines. You will collaborate closely with product managers and developers to ensure that design concepts are effectively translated into functional interfaces. This position is ideal for someone who combines creativity with analytical thinking to enhance overall user satisfaction.	Contract	$70k-$110k	2026-02-21 13:02:13.226149
6	5	Mobile Developer	We are seeking an experienced Mobile Developer to design and build high-quality mobile applications for iOS and Android platforms. You will be responsible for implementing new features, optimizing application performance, and ensuring smooth user interactions across devices. The ideal candidate has hands-on experience with mobile frameworks such as Flutter, React Native, or native development tools. Strong understanding of API integration, mobile UI standards, and app deployment processes is required. You should be comfortable debugging issues, improving code efficiency, and collaborating with cross-functional teams. This role offers the opportunity to contribute to innovative mobile solutions used by a growing user base.	Full-time	$100k-$145k	2026-02-21 13:02:13.226149
7	6	DevOps Engineer	We are seeking a DevOps Engineer to manage CI/CD pipelines, cloud infrastructure, and deployment workflows. The ideal candidate has experience with Docker, Kubernetes, and cloud platforms such as AWS or Azure. Strong scripting skills and understanding of system reliability are essential.	Full-time	$110k-$160k	2026-02-21 13:02:13.226149
8	7	Machine Learning Engineer	Design and deploy machine learning models that power recommendation systems and data-driven insights. Candidates should have experience with Python, TensorFlow or PyTorch, and data preprocessing techniques.	Full-time	$120k-$170k	2026-02-21 13:02:13.226149
9	8	Cybersecurity Analyst	Protect organizational systems by monitoring threats, performing vulnerability assessments, and implementing security protocols. Knowledge of network security, encryption, and incident response is required.	Full-time	$95k-$140k	2026-02-21 13:02:13.226149
10	9	Financial Analyst	Analyze financial data, prepare forecasts, and support strategic investment decisions. Strong analytical skills, Excel proficiency, and understanding of financial modeling are required.	Full-time	$85k-$130k	2026-02-21 13:02:13.226149
11	9	Investment Banking Associate	Support mergers, acquisitions, and capital raising activities by preparing presentations, conducting market research, and performing valuation analysis.	Full-time	$130k-$200k	2026-02-21 13:02:13.226149
12	10	Digital Marketing Specialist	Develop and execute online marketing campaigns across social media, SEO, and paid advertising platforms. Experience with analytics tools and content strategy is preferred.	Full-time	$70k-$110k	2026-02-21 13:02:13.226149
13	11	Sales Executive	Drive revenue growth by identifying new business opportunities and managing client relationships. Strong communication and negotiation skills are essential.	Full-time	$75k-$120k	2026-02-21 13:02:13.226149
14	13	Brand Manager	Lead brand strategy, oversee marketing campaigns, and ensure consistent messaging across channels. Experience in consumer behavior analysis and market research is required.	Full-time	$90k-$140k	2026-02-21 13:02:13.226149
15	12	Human Resources Manager	Oversee recruitment, employee relations, and performance management processes. Strong interpersonal skills and knowledge of labor laws are required.	Full-time	$80k-$120k	2026-02-21 13:02:13.226149
16	6	Operations Manager	Coordinate cross-departmental operations to improve efficiency and productivity. Experience in supply chain management and process optimization is preferred.	Full-time	$95k-$145k	2026-02-21 13:02:13.226149
17	10	Healthcare Data Coordinator	Manage healthcare data records, ensure regulatory compliance, and assist in reporting. Experience in healthcare systems and data accuracy standards is required.	Full-time	$65k-$95k	2026-02-21 13:02:13.226149
18	10	Clinical Research Associate	Monitor clinical trials, ensure regulatory compliance, and analyze trial data. A background in life sciences or related fields is preferred.	Contract	$75k-$115k	2026-02-21 13:02:13.226149
19	7	Technical Trainer	Develop and deliver training programs on technical tools and systems. Strong presentation skills and hands-on technical knowledge are essential.	Full-time	$70k-$105k	2026-02-21 13:02:13.226149
20	12	Learning & Development Specialist	Design employee development programs and training materials to enhance workforce skills and engagement.	Full-time	$75k-$110k	2026-02-21 13:02:13.226149
21	7	Content Strategist	Plan, create, and manage engaging content across digital platforms. Experience in storytelling, SEO, and analytics is preferred.	Full-time	$70k-$115k	2026-02-21 13:02:13.226149
22	10	Product Manager	Lead cross-functional teams to deliver innovative products from concept to launch. Strong leadership and strategic planning skills required.	Full-time	$110k-$160k	2026-02-21 13:02:13.226149
23	6	Supply Chain Analyst	Analyze supply chain processes to improve efficiency and reduce costs. Strong analytical and problem-solving skills required.	Full-time	$80k-$120k	2026-02-21 13:02:13.226149
24	13	Retail Operations Supervisor	Oversee daily retail operations, manage staff performance, and ensure excellent customer experience.	Full-time	$60k-$90k	2026-02-21 13:02:13.226149
25	11	Customer Success Manager	Build long-term client relationships, ensure customer satisfaction, and drive retention strategies.	Remote	$75k-$115k	2026-02-21 13:02:13.226149
26	12	Business Analyst	Gather and analyze business requirements to support strategic initiatives and technology implementations.	Full-time	$85k-$125k	2026-02-21 13:02:13.226149
\.


--
-- TOC entry 5116 (class 0 OID 18042)
-- Dependencies: 230
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skills (skill_id, skill_name) FROM stdin;
1	Java
2	C++
3	C#
4	Go
5	TypeScript
6	Kotlin
7	Swift
8	Node.js
9	Express.js
10	Django
11	Flask
12	REST APIs
13	GraphQL
14	JWT Authentication
15	MySQL
16	MongoDB
17	Redis
18	Data Analysis
19	Machine Learning
20	Power BI
21	Tableau
22	AWS
23	Azure
24	Google Cloud
25	Kubernetes
26	CI/CD
27	Linux
28	Terraform
29	React Native
30	Flutter
31	Android Development
32	iOS Development
33	Figma
34	UI Design
35	UX Research
36	Adobe XD
37	Project Management
38	Agile Methodology
39	Scrum
40	Business Analysis
41	Strategic Planning
42	Digital Marketing
43	SEO
44	Content Marketing
45	Email Marketing
46	CRM Tools
47	Sales Negotiation
48	Financial Modeling
49	Budget Planning
50	Supply Chain Management
51	Risk Management
52	Communication
53	Leadership
54	Problem Solving
55	Critical Thinking
56	Team Collaboration
57	Time Management
58	Public Speaking
\.


--
-- TOC entry 5117 (class 0 OID 18052)
-- Dependencies: 231
-- Data for Name: user_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_skills (user_id, skill_id) FROM stdin;
1	1
1	4
1	5
2	2
2	3
2	7
2	8
3	1
3	5
3	6
\.


--
-- TOC entry 5106 (class 0 OID 17950)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, password_hash, bio, resume_url, created_at) FROM stdin;
1	John Doe	john@example.com	$2b$12$KIXQnZy...	Passionate software engineer with a love for building scalable systems.	\N	2026-02-21 13:02:13.226149
2	Jane Smith	jane@example.com	hashed_password456	Frontend specialist focused on user-centric design.	\N	2026-02-21 13:02:13.226149
3	Mike Johnson	mike@example.com	hashes_password789	Backend developer with expertise in Python and SQL.	\N	2026-02-21 13:02:13.226149
\.


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 225
-- Name: applications_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_application_id_seq', 5, true);


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 221
-- Name: companies_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_company_id_seq', 13, true);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 227
-- Name: interviews_interview_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interviews_interview_id_seq', 5, true);


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 223
-- Name: jobs_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_job_id_seq', 26, true);


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 229
-- Name: skills_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skills_skill_id_seq', 58, true);


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 3, true);


--
-- TOC entry 4932 (class 2606 OID 18009)
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (application_id);


--
-- TOC entry 4934 (class 2606 OID 18011)
-- Name: applications applications_user_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_job_id_key UNIQUE (user_id, job_id);


--
-- TOC entry 4928 (class 2606 OID 17975)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4939 (class 2606 OID 18035)
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (interview_id);


--
-- TOC entry 4930 (class 2606 OID 17989)
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (job_id);


--
-- TOC entry 4941 (class 2606 OID 18049)
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (skill_id);


--
-- TOC entry 4943 (class 2606 OID 18051)
-- Name: skills skills_skill_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_skill_name_key UNIQUE (skill_name);


--
-- TOC entry 4945 (class 2606 OID 18058)
-- Name: user_skills user_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_pkey PRIMARY KEY (user_id, skill_id);


--
-- TOC entry 4924 (class 2606 OID 17964)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4926 (class 2606 OID 17962)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4935 (class 1259 OID 18070)
-- Name: idx_applications_job; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_job ON public.applications USING btree (job_id);


--
-- TOC entry 4936 (class 1259 OID 18069)
-- Name: idx_applications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_user ON public.applications USING btree (user_id);


--
-- TOC entry 4937 (class 1259 OID 18071)
-- Name: idx_interviews_application; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interviews_application ON public.interviews USING btree (application_id);


--
-- TOC entry 4947 (class 2606 OID 18017)
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE;


--
-- TOC entry 4948 (class 2606 OID 18012)
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4949 (class 2606 OID 18036)
-- Name: interviews interviews_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id) ON DELETE CASCADE;


--
-- TOC entry 4946 (class 2606 OID 17990)
-- Name: jobs jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE;


--
-- TOC entry 4950 (class 2606 OID 18064)
-- Name: user_skills user_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- TOC entry 4951 (class 2606 OID 18059)
-- Name: user_skills user_skills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2026-02-21 13:20:32

--
-- PostgreSQL database dump complete
--

\unrestrict dQACNCPoTZs2JePmc3d5PrMo8Dytre9dYvpMXHEWJWMLFF2PbVHdu7jYDwxaH7e

