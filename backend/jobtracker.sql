--
-- PostgreSQL database dump
--

\restrict 6s81GSlOzo2FAccEs99UwSZGQws0W8GMFjFJOcA71f3HTJOFFiSEuHGqc5BSEho

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-23 20:50:57

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
-- TOC entry 226 (class 1259 OID 17267)
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
-- TOC entry 222 (class 1259 OID 17237)
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
-- TOC entry 224 (class 1259 OID 17248)
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
-- TOC entry 220 (class 1259 OID 17221)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17315)
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
-- TOC entry 225 (class 1259 OID 17266)
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
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 225
-- Name: applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_application_id_seq OWNED BY public.applications.application_id;


--
-- TOC entry 221 (class 1259 OID 17236)
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
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 221
-- Name: companies_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_company_id_seq OWNED BY public.companies.company_id;


--
-- TOC entry 228 (class 1259 OID 17294)
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
-- TOC entry 230 (class 1259 OID 17320)
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
-- TOC entry 227 (class 1259 OID 17293)
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
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 227
-- Name: interviews_interview_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interviews_interview_id_seq OWNED BY public.interviews.interview_id;


--
-- TOC entry 223 (class 1259 OID 17247)
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
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 223
-- Name: jobs_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_job_id_seq OWNED BY public.jobs.job_id;


--
-- TOC entry 233 (class 1259 OID 17335)
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
-- TOC entry 234 (class 1259 OID 17340)
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
-- TOC entry 231 (class 1259 OID 17325)
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
-- TOC entry 232 (class 1259 OID 17330)
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
-- TOC entry 219 (class 1259 OID 17220)
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
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4905 (class 2604 OID 17270)
-- Name: applications application_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN application_id SET DEFAULT nextval('public.applications_application_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 17240)
-- Name: companies company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN company_id SET DEFAULT nextval('public.companies_company_id_seq'::regclass);


--
-- TOC entry 4908 (class 2604 OID 17297)
-- Name: interviews interview_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews ALTER COLUMN interview_id SET DEFAULT nextval('public.interviews_interview_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 17251)
-- Name: jobs job_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN job_id SET DEFAULT nextval('public.jobs_job_id_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 17224)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5094 (class 0 OID 17267)
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
-- TOC entry 5090 (class 0 OID 17237)
-- Dependencies: 222
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (company_id, company_name, location, website) FROM stdin;
1	Google	Mountain View, CA	https://google.com
2	Microsoft	Seattle, WA	https://microsoft.com
3	Amazon	Seattle, WA	https://amazon.com
4	Meta	Menlo Park, CA	https://meta.com
5	Apple	Cupertino, CA	https://apple.com
\.


--
-- TOC entry 5096 (class 0 OID 17294)
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
-- TOC entry 5092 (class 0 OID 17248)
-- Dependencies: 224
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (job_id, company_id, title, description, job_type, salary_range, posted_date) FROM stdin;
1	1	Software Engineer	Build scalable applications using modern technologies	Full-time	$100k-$150k	2026-01-23 19:49:44.700578
2	1	Frontend Developer	Create amazing user interfaces with React	Full-time	$90k-$130k	2026-01-23 19:49:44.700578
3	2	Data Analyst	Analyze data and create insights for business decisions	Full-time	$80k-$120k	2026-01-23 19:49:44.700578
4	3	Backend Developer	Design and implement server-side logic	Remote	$95k-$140k	2026-01-23 19:49:44.700578
5	4	UI/UX Designer	Design intuitive and beautiful user experiences	Contract	$70k-$110k	2026-01-23 19:49:44.700578
6	5	Mobile Developer	Build iOS and Android applications	Full-time	$100k-$145k	2026-01-23 19:49:44.700578
\.


--
-- TOC entry 5088 (class 0 OID 17221)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, password_hash, created_at) FROM stdin;
1	John Doe	john@example.com	hashed_password123	2026-01-23 19:49:44.700578
2	Jane Smith	jane@example.com	hashed_password456	2026-01-23 19:49:44.700578
3	Mike Johnson	mike@example.com	hashes_password789	2026-01-23 19:49:44.700578
\.


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 225
-- Name: applications_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_application_id_seq', 5, true);


--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 221
-- Name: companies_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_company_id_seq', 5, true);


--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 227
-- Name: interviews_interview_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interviews_interview_id_seq', 5, true);


--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 223
-- Name: jobs_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_job_id_seq', 6, true);


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 3, true);


--
-- TOC entry 4922 (class 2606 OID 17280)
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (application_id);


--
-- TOC entry 4924 (class 2606 OID 17282)
-- Name: applications applications_user_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_job_id_key UNIQUE (user_id, job_id);


--
-- TOC entry 4918 (class 2606 OID 17246)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4929 (class 2606 OID 17306)
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (interview_id);


--
-- TOC entry 4920 (class 2606 OID 17260)
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (job_id);


--
-- TOC entry 4914 (class 2606 OID 17235)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4916 (class 2606 OID 17233)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4925 (class 1259 OID 17313)
-- Name: idx_applications_job; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_job ON public.applications USING btree (job_id);


--
-- TOC entry 4926 (class 1259 OID 17312)
-- Name: idx_applications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_user ON public.applications USING btree (user_id);


--
-- TOC entry 4927 (class 1259 OID 17314)
-- Name: idx_interviews_application; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interviews_application ON public.interviews USING btree (application_id);


--
-- TOC entry 4931 (class 2606 OID 17288)
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 17283)
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4933 (class 2606 OID 17307)
-- Name: interviews interviews_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id) ON DELETE CASCADE;


--
-- TOC entry 4930 (class 2606 OID 17261)
-- Name: jobs jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE;


-- Completed on 2026-01-23 20:50:58

--
-- PostgreSQL database dump complete
--

\unrestrict 6s81GSlOzo2FAccEs99UwSZGQws0W8GMFjFJOcA71f3HTJOFFiSEuHGqc5BSEho

