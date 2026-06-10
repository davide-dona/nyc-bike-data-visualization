from contextlib import contextmanager
from threading import BoundedSemaphore
from psycopg2.pool import ThreadedConnectionPool

from src.backend.config import settings

# Global connection pool, initialized by init_pool()
_pool: ThreadedConnectionPool | None = None
# Counts free pool slots: psycopg2's pool raises immediately when exhausted, so
# callers wait on this semaphore instead (FastAPI runs sync endpoints on a thread
# pool larger than the connection pool).
_pool_slots: BoundedSemaphore | None = None

def init_pool() -> None:
    """Initialise the global database connection pool."""
    global _pool, _pool_slots
    _pool = ThreadedConnectionPool(
        minconn=settings.pool_min_conn,
        maxconn=settings.pool_max_conn,
        dsn=settings.database_url,
    )
    _pool_slots = BoundedSemaphore(settings.pool_max_conn)

def close_pool() -> None:
    """Close all pool connections (called on application shutdown)."""
    global _pool, _pool_slots
    if _pool is not None:
        _pool.closeall()
    _pool = None
    _pool_slots = None


def fetch_rows(cur) -> list[dict]:
    """Fetch all rows from the cursor and return as a list of dictionaries."""
    # Get the column names from the cursor description
    cols = [d[0] for d in cur.description]
    # Fetch all rows and zip each with the column names to create a list of dictionaries
    return [dict(zip(cols, row)) for row in cur.fetchall()]


@contextmanager
def get_conn() -> 'psycopg2.extensions.connection':
    """Get a database connection from the pool, yielding it for use, and ensuring it's returned to the pool afterwards."""
    if _pool is None:
        raise RuntimeError("DB pool not initialised — call init_pool() first")
    _pool_slots.acquire()
    try:
        conn = _pool.getconn()
        try:
            yield conn
        finally:
            _pool.putconn(conn)
    finally:
        _pool_slots.release()
