from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_connection
import hashlib
import os
import uuid
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "backend/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/api/resumes", StaticFiles(directory=UPLOAD_DIR), name="resumes")

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ApplyRequest(BaseModel):
    user_id: int
    job_id: int
    notes: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: str
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None

class SkillUpdate(BaseModel):
    skill_names: List[str]

class ApplicationUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

@app.get("/")
def home():
    return {"message": "Job Tracker API is running"}

@app.post("/api/register")
def register(request: RegisterRequest):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT email FROM users WHERE email = %s", (request.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        password_hash = hash_password(request.password)
        cur.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING user_id",
            (request.name, request.email, password_hash)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        return {"message": "Registration successful", "user_id": user_id}
    finally:
        cur.close()
        conn.close()

@app.post("/api/login")
def login(request: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()
    try:
        password_hash = hash_password(request.password)
        cur.execute(
            "SELECT user_id, name, email FROM users WHERE email = %s AND password_hash = %s",
            (request.email, password_hash)
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "user_id": user[0],
            "name": user[1],
            "email": user[2]
        }
    finally:
        cur.close()
        conn.close()

@app.get("/api/dashboard/{user_id}")
def get_dashboard(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM user_dashboard WHERE user_id = %s", (user_id,))
        data = cur.fetchone()
        if not data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "name": data[1],
            "total_applications": data[3],
            "applied_count": data[4],
            "interviewing_count": data[5],
            "rejected_count": data[6],
            "hired_count": data[7]
        }
    finally:
        cur.close()
        conn.close()


@app.get("/api/jobs/popular")
def get_popular_jobs():
    conn = get_connection()
    cur = conn.cursor()
    try:
        query = """
            SELECT j.job_id, j.title, j.job_type, j.salary_range, c.company_name, c.location,
                   COUNT(a.application_id) as app_count
            FROM jobs j
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN applications a ON j.job_id = a.job_id
            GROUP BY j.job_id, c.company_name, c.location
            ORDER BY app_count DESC, j.posted_date DESC
            LIMIT 5
        """
        cur.execute(query)
        jobs = cur.fetchall()
        return [{
            "job_id": row[0],
            "title": row[1],
            "type": row[2],
            "salary": row[3],
            "company": row[4],
            "location": row[5],
            "application_count": row[6]
        } for row in jobs]
    finally:
        cur.close()
        conn.close()

@app.post("/api/jobs/apply")
def apply_job(request: ApplyRequest):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO applications (user_id, job_id, notes) VALUES (%s, %s, %s) RETURNING application_id",
            (request.user_id, request.job_id, request.notes)
        )
        application_id = cur.fetchone()[0]
        conn.commit()
        return {"message": "Application submitted", "application_id": application_id}
    except Exception as e:
        conn.rollback()
        if "unique_user_job" in str(e) or "duplicate key" in str(e).lower():
            raise HTTPException(status_code=400, detail="You have already applied for this job")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/api/jobs")
def get_jobs(search: Optional[str] = None):
    conn = get_connection()
    cur = conn.cursor()
    try:
        query = """
            SELECT j.job_id, j.title, j.job_type, j.salary_range, c.company_name, c.location, j.description, j.application_link
            FROM jobs j
            JOIN companies c ON j.company_id = c.company_id
        """
        if search:
            query += " WHERE j.title ILIKE %s OR c.company_name ILIKE %s"
            cur.execute(query, (f"%{search}%", f"%{search}%"))
        else:
            cur.execute(query)
        
        jobs = cur.fetchall()
        return [{
            "job_id": row[0],
            "title": row[1],
            "type": row[2],
            "salary": row[3],
            "company": row[4],
            "location": row[5],
            "description": row[6],
            "application_link": row[7]
        } for row in jobs]
    finally:
        cur.close()
        conn.close()

@app.get("/api/applications/{user_id}")
def get_applications(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT
                a.application_id,
                c.company_name,
                j.title,
                j.job_type,
                j.salary_range,
                a.applied_date,
                a.status,
                a.notes,
                COALESCE(MAX(i.round), 0)           AS interview_round,
                COALESCE(MAX(i.interview_date)::TEXT, NULL) AS interview_date,
                COALESCE(MAX(i.mode), NULL)          AS interview_mode,
                COALESCE(
                    (SELECT res.result FROM interviews res
                     WHERE res.application_id = a.application_id
                     ORDER BY res.round DESC LIMIT 1),
                    NULL
                ) AS interview_result
            FROM applications a
            JOIN jobs j ON a.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN interviews i ON i.application_id = a.application_id
            WHERE a.user_id = %s
            GROUP BY a.application_id, c.company_name, j.title, j.job_type, j.salary_range,
                     a.applied_date, a.status, a.notes
            ORDER BY a.applied_date DESC
        """, (user_id,))

        apps = cur.fetchall()
        return [{
            "application_id": row[0],
            "company": row[1],
            "title": row[2],
            "type": row[3],
            "salary": row[4],
            "date": str(row[5]),
            "status": row[6],
            "notes": row[7],
            "interview_round": row[8],
            "interview_date": row[9],
            "interview_mode": row[10],
            "interview_result": row[11]
        } for row in apps]
    finally:
        cur.close()
        conn.close()

@app.put("/api/applications/{application_id}")
def update_application(application_id: int, request: ApplicationUpdate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE applications SET status = %s, notes = %s WHERE application_id = %s",
            (request.status, request.notes, application_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        conn.commit()
        return {"message": "Application updated"}
    finally:
        cur.close()
        conn.close()

@app.delete("/api/applications/{application_id}")
def delete_application(application_id: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM applications WHERE application_id = %s", (application_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        conn.commit()
        return {"message": "Application deleted"}
    finally:
        cur.close()
        conn.close()

@app.get("/api/profile/{user_id}")
def get_profile(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT name, email, bio, resume_url, linkedin_url, github_url, twitter_url FROM users WHERE user_id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        cur.execute("""
            SELECT s.skill_id, s.skill_name 
            FROM skills s
            JOIN user_skills us ON s.skill_id = us.skill_id
            WHERE us.user_id = %s
        """, (user_id,))
        skills = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]
        
        return {
            "name": user[0],
            "email": user[1],
            "bio": user[2],
            "resume_url": user[3],
            "linkedin_url": user[4],
            "github_url": user[5],
            "twitter_url": user[6],
            "skills": skills
        }
    finally:
        cur.close()
        conn.close()

@app.put("/api/profile/{user_id}")
def update_profile(user_id: int, request: ProfileUpdate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE users SET name = %s, bio = %s, resume_url = %s, linkedin_url = %s, github_url = %s, twitter_url = %s WHERE user_id = %s",
            (request.name, request.bio, request.resume_url, request.linkedin_url, request.github_url, request.twitter_url, user_id)
        )
        conn.commit()
        return {"message": "Profile updated"}
    finally:
        cur.close()
        conn.close()

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())
    return {"resume_url": f"http://127.0.0.1:8000/api/resumes/{filename}"}

@app.get("/api/skills")
def get_all_skills():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT skill_id, skill_name FROM skills")
        return [{"id": row[0], "name": row[1]} for row in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

@app.post("/api/user/skills/{user_id}")
def update_user_skills(user_id: int, request: SkillUpdate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM user_skills WHERE user_id = %s", (user_id,))
        
        for name in request.skill_names:
            cur.execute("INSERT INTO skills (skill_name) VALUES (%s) ON CONFLICT (skill_name) DO NOTHING RETURNING skill_id", (name,))
            res = cur.fetchone()
            if res:
                skill_id = res[0]
            else:
                cur.execute("SELECT skill_id FROM skills WHERE skill_name = %s", (name,))
                skill_id = cur.fetchone()[0]
            
            cur.execute("INSERT INTO user_skills (user_id, skill_id) VALUES (%s, %s)", (user_id, skill_id))
            
        conn.commit()
        return {"message": "Skills updated successfully"}
    finally:
        cur.close()
        conn.close()