"""
Database connection and helper functions for AsherGO
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/ashergo")


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
