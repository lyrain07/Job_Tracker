import psycopg2
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    database_url = os.environ.get("DATABASE_URL")
    
    if database_url:
        # Render provides postgres:// but psycopg2 needs postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(database_url)
    else:
        # Local fallback
        return psycopg2.connect(
            host="localhost",
            database="Job_Tracker",
            user="postgres",
            password="777"
        )