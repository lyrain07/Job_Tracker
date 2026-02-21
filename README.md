# Job Tracker

A simple job tracking application with a FastAPI backend and a vanilla HTML/CSS/JS frontend.

## Prerequisites

- PostgreSQL installed and running.
- Python 3.8+ installed.

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
   pip install fastapi uvicorn psycopg2 pydantic
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
2. Open `index.html` directly in your browser or run a simple server:
   ```bash
   python -m http.server 3000
   ```
   Then visit `http://localhost:3000`.

## Features
- User Registration & Login
- Job Dashboard
- Application Status Tracking
