
from pymongo import MongoClient
from app.core.config import settings

_sync_client = None


def get_sync_db():
    """Return sync MongoDB database. Use only in sync context (e.g. background_jobs)."""
    global _sync_client
    if _sync_client is None:
        _sync_client = MongoClient(settings.DATABASE_URL)
    return _sync_client.get_database()
