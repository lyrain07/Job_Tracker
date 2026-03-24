# Job Tracker

A job tracking application with a FastAPI backend and a React (Vite) SPA frontend.

## Prerequisites

- PostgreSQL installed and running.
- Python 3.8+ installed.
- Node.js and npm installed.

## 🚀 Live Demo

- **Frontend:** [Job Tracker](https://job-tracker-git-main-lyrain07s-projects.vercel.app)
- **Backend API:** [API Docs](https://job-tracker-8e22.onrender.com/docs)

## 🛠️ Tech Stack

- **Frontend:** React, Vite, React Router, CSS
- **Backend:** FastAPI (Python), JWT Authentication
- **Database:** PostgreSQL (Neon)
- **Hosting:** Vercel (Frontend) + Render (Backend)

## Setup Instructions

### 1. Database Setup

1. Open your PostgreSQL terminal or tool (like pgAdmin).
2. Create a database named `Job_Tracker`:
   ```sql
   CREATE DATABASE "Job_Tracker";
   ```
3. Import the schema using `schema.sql`:
   ```bash
   psql -U postgres -d Job_Tracker -f schema.sql
   ```
   *(Note: Ensure your password matches the one in `backend/database.py` or update the file).*

### 2. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be running at `http://localhost:8000`.

### 3. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
   Then visit `http://localhost:3000`.

## Features
- User Registration & Login
- Job Dashboard
- Application Status Tracking
