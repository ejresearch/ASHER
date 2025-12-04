"""
Database connection and helper functions for AsherGO
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

# Get DATABASE_URL and fix postgres:// to postgresql:// for psycopg2 compatibility
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/ashergo")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


@contextmanager
def get_db():
    """Get a database connection with automatic cleanup"""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def query(sql, params=None, fetch_one=False):
    """Execute a query and return results as dictionaries"""
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            if fetch_one:
                return dict(cur.fetchone()) if cur.fetchone() else None
            return [dict(row) for row in cur.fetchall()]


def query_one(sql, params=None):
    """Execute a query and return a single result"""
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            return dict(row) if row else None


def execute(sql, params=None):
    """Execute a query without returning results"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)


def execute_returning(sql, params=None):
    """Execute a query and return the result (for INSERT RETURNING)"""
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            return dict(row) if row else None


def init_db():
    """Initialize database tables if they don't exist"""
    with get_db() as conn:
        with conn.cursor() as cur:
            # Users table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100),
                    subscription_status VARCHAR(50) DEFAULT 'trial',
                    trial_ends_at TIMESTAMP,
                    api_keys JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Add missing columns to users table if they don't exist
            cur.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name') THEN
                        ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='subscription_status') THEN
                        ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'trial';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='trial_ends_at') THEN
                        ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='api_keys') THEN
                        ALTER TABLE users ADD COLUMN api_keys JSONB DEFAULT '{}';
                    END IF;
                END $$;
            """)

            # Conversations table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) DEFAULT 'New Conversation',
                    system_prompt TEXT DEFAULT '',
                    provider_settings JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Messages table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                    role VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    model VARCHAR(100),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()
            print("Database tables initialized")
