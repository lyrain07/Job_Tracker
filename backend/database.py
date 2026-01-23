import psycopg2

DB_NAME = "Job_Tracker"
DB_USER = "postgres"
DB_PASSWORD = "613jm7"
DB_HOST = "localhost"
DB_PORT = "5432"

def get_connection():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    return conn