from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from database import get_connection
from passlib.context import CryptContext
from jose import JWTError, jwt
import hashlib
import os
import uuid
import logging
from datetime import datetime, timedelta, timezone

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── JWT Configuration ────────────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY", "job-tracker-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ─── Password Hashing ─────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── OAuth2 scheme ─────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://job-tracker-two-amber.vercel.app",
        "https://job-tracker-git-main-lyrain07s-projects.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"GLOBAL ERROR: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "https://job-tracker-two-amber.vercel.app",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@app.middleware("http")
async def add_process_time_header(request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"MIDDLEWARE ERROR: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error in Middleware", "error": str(e)},
            headers={
                "Access-Control-Allow-Origin": "https://job-tracker-two-amber.vercel.app",
                "Access-Control-Allow-Credentials": "true"
            }
        )

@app.get("/api/health")
def health_check():
    results = {"status": "healthy", "checks": {}}
    try:
        # DB check
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        results["checks"]["database"] = "OK"
    except Exception as e:
        results["status"] = "unhealthy"
        results["checks"]["database"] = str(e)

    try:
        # Hashing check
        h = hash_password("test")
        verify_password("test", h)
        results["checks"]["hashing"] = "OK"
    except Exception as e:
        results["status"] = "unhealthy"
        results["checks"]["hashing"] = f"Hashing error: {str(e)}"

    try:
        # JWT check
        token = create_access_token({"test": "data"})
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        results["checks"]["jwt"] = "OK"
    except Exception as e:
        results["status"] = "unhealthy"
        results["checks"]["jwt"] = f"JWT error: {str(e)}"

    return results

UPLOAD_DIR = "backend/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/api/resumes", StaticFiles(directory=UPLOAD_DIR), name="resumes")

# ─── Pydantic Models ──────────────────────────────────────────
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
    interview_round: Optional[int] = None

# ─── Auth Helpers ──────────────────────────────────────────────
def hash_password_legacy(password: str):
    """Legacy SHA-256 hashing for backward compatibility."""
    return hashlib.sha256(password.encode()).hexdigest()

def hash_password(password: str):
    """Hash password with bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash, with SHA-256 fallback for legacy users."""
    # Try bcrypt first
    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception:
        pass
    # Fallback: SHA-256 for legacy accounts
    if hash_password_legacy(plain_password) == hashed_password:
        return True
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency that extracts and validates the JWT token."""
    if token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        name: str = payload.get("name")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "email": email, "name": name}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ─── Public Routes ─────────────────────────────────────────────
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
        cur.execute(
            "SELECT user_id, name, email, password_hash FROM users WHERE email = %s",
            (request.email,)
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id, name, email, stored_hash = user

        if not verify_password(request.password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Upgrade legacy SHA-256 hash to bcrypt on successful login
        if not stored_hash.startswith("$2"):
            new_hash = hash_password(request.password)
            cur.execute("UPDATE users SET password_hash = %s WHERE user_id = %s", (new_hash, user_id))
            conn.commit()

        # Create JWT token
        access_token = create_access_token(
            data={"user_id": user_id, "email": email, "name": name}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user_id,
            "name": name,
            "email": email
        }
    finally:
        cur.close()
        conn.close()

# ─── Public Job Listings (no auth needed) ──────────────────────
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

# ─── Protected Routes (require JWT) ───────────────────────────
@app.get("/api/dashboard/{user_id}")
def get_dashboard(user_id: int, current_user: dict = Depends(get_current_user)):
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

@app.post("/api/jobs/apply")
def apply_job(request: ApplyRequest, current_user: dict = Depends(get_current_user)):
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

@app.get("/api/applications/{user_id}")
def get_applications(user_id: int, current_user: dict = Depends(get_current_user)):
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
def update_application(application_id: int, request: ApplicationUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Update application status and notes
        cur.execute(
            "UPDATE applications SET status = %s, notes = %s WHERE application_id = %s",
            (request.status, request.notes, application_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Application not found")

        # Handle interview round if status is 'Interviewing'
        if request.status == 'Interviewing' and request.interview_round is not None:
            # Check if an interview record already exists for this application
            cur.execute("SELECT interview_id FROM interviews WHERE application_id = %s", (application_id,))
            existing_interview = cur.fetchone()
            
            if existing_interview:
                cur.execute(
                    "UPDATE interviews SET round = %s WHERE application_id = %s",
                    (request.interview_round, application_id)
                )
            else:
                cur.execute(
                    "INSERT INTO interviews (application_id, round, result) VALUES (%s, %s, 'Pending')",
                    (application_id, request.interview_round)
                )

        conn.commit()
        return {"message": "Application updated"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.delete("/api/applications/{application_id}")
def delete_application(application_id: int, current_user: dict = Depends(get_current_user)):
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
def get_profile(user_id: int, current_user: dict = Depends(get_current_user)):
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
def update_profile(user_id: int, request: ProfileUpdate, current_user: dict = Depends(get_current_user)):
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
async def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
    return {"resume_url": f"{BASE_URL}/api/resumes/{filename}"}

@app.post("/api/user/skills/{user_id}")
def update_user_skills(user_id: int, request: SkillUpdate, current_user: dict = Depends(get_current_user)):
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
