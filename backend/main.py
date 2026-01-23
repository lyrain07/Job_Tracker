from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_connection
import hashlib

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

@app.get("/")
def home():
    return {"message": "Job Tracker API is running"}

@app.post("/api/register")
def register(request: RegisterRequest):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT email FROM users WHERE email = %s", (request.email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")
    
    password_hash = hash_password(request.password)
    cur.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING user_id",
        (request.name, request.email, password_hash)
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Registration successful", "user_id": user_id}

@app.post("/api/login")
def login(request: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()
    
    password_hash = hash_password(request.password)
    cur.execute(
        "SELECT user_id, name, email FROM users WHERE email = %s AND password_hash = %s",
        (request.email, password_hash)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "user_id": user[0],
        "name": user[1],
        "email": user[2]
    }

@app.get("/api/dashboard/{user_id}")
def get_dashboard(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM user_dashboard WHERE user_id = %s", (user_id,))
    data = cur.fetchone()
    cur.close()
    conn.close()
    
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "name": data[1],
        "total_applications": data[3],
        "applied_count": data[4],
        "interviewing_count": data[5],
        "rejected_count": data[6]
    }

@app.get("/api/applications/{user_id}")
def get_applications(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT company_name, job_title, job_type, salary_range, applied_date, status 
        FROM application_details 
        WHERE applicant_name = (SELECT name FROM users WHERE user_id = %s)
    """, (user_id,))
    
    applications = cur.fetchall()
    cur.close()
    conn.close()
    
    result = []
    for app in applications:
        result.append({
            "company": app[0],
            "title": app[1],
            "type": app[2],
            "salary": app[3],
            "date": str(app[4]),
            "status": app[5]
        })
    
    return result