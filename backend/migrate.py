import psycopg2
from database import get_connection

def migrate():
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Check if bio column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='bio'")
        if not cur.fetchone():
            print("Adding 'bio' column...")
            cur.execute("ALTER TABLE users ADD COLUMN bio TEXT")
        
        # Check if resume_url column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='resume_url'")
        if not cur.fetchone():
            print("Adding 'resume_url' column...")
            cur.execute("ALTER TABLE users ADD COLUMN resume_url VARCHAR(500)")
        
        # Check if application_link column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='jobs' AND column_name='application_link'")
        if not cur.fetchone():
            print("Adding 'application_link' column to jobs...")
            cur.execute("ALTER TABLE jobs ADD COLUMN application_link VARCHAR(500)")
            
        # Check if skills table exists
        cur.execute("SELECT to_regclass('skills')")
        if not cur.fetchone()[0]:
            print("Creating 'skills' and 'user_skills' tables...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS skills (
                    skill_id SERIAL PRIMARY KEY,
                    skill_name VARCHAR(100) UNIQUE NOT NULL
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_skills (
                    user_id INTEGER NOT NULL,
                    skill_id INTEGER NOT NULL,
                    PRIMARY KEY (user_id, skill_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
                )
            """)
            # Insert some default skills
            skills = ['Python', 'JavaScript', 'HTML', 'CSS', 'PostgreSQL', 'FastAPI', 'React', 'Node.js']
            for s in skills:
                cur.execute("INSERT INTO skills (skill_name) VALUES (%s) ON CONFLICT DO NOTHING", (s,))

        conn.commit()
        print("Migration complete.")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
