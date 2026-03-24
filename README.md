# Job Tracker

A full-stack web app to track job applications, browse jobs, manage interview rounds, and build a profile with skills.

## Live Demo

- Frontend: [https://job-tracker-two-amber.vercel.app/](https://job-tracker-two-amber.vercel.app/)
- Backend API Docs: [https://job-tracker-8e22.onrender.com/docs](https://job-tracker-8e22.onrender.com/docs)

## Features

### Authentication
User registration and login with JWT authentication.
![Authentication](readme_img/RegisterPage.png)

### Dashboard
Dashboard with real-time application statistics and summaries.
![Dashboard](readme_img/dashboardpage.jpg)

### Job Search
Browse and search job listings with category and location filters.
![Jobs](readme_img/jobsPage.png)

### Application Tracker
Track applications with status updates, interview round management, and personal notes.
![Tracker](readme_img/TrackerPage.png)
![Manage Tracker](readme_img/TrackerManagesection.png)

### Profile Management
Professional profile management including resume links and skill sets.
![Profile](readme_img/ProfilePage.png)
![Edit Skills](readme_img/SkillEdiySection.png)

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| Frontend | React, Vite, react-router-dom, Vanilla CSS |
| Backend | FastAPI (Python), JWT (python-jose), bcrypt |
| Database | PostgreSQL |

## Local Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in a `.env` file:

   | Variable | Description | Example |
   | :--- | :--- | :--- |
   | DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/Job_Tracker` |
   | SECRET_KEY | JWT signing key | `your-secret-key` |
   | BASE_URL | Backend API base URL | `http://localhost:8000` |

5. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in a `.env.local` file:

   | Variable | Description | Default |
   | :--- | :--- | :--- |
   | VITE_API_BASE_URL | Backend API URL | `http://localhost:8000` |

4. Start the development server:
   ```bash
   npm run dev
   ```
