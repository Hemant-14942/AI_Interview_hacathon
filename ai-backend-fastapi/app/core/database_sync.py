"""
Sync MongoDB client for use in background (sync) code only.
Motor is async and returns Futures when used without await; background_jobs runs in a sync thread,
so we use PyMongo here for find_one / update_one to get real results.
"""
from pymongo import MongoClient
from app.core.config import settings

_sync_client = None


def get_sync_db():
    """Return sync MongoDB database. Use only in sync context (e.g. background_jobs)."""
    global _sync_client
    if _sync_client is None:
        _sync_client = MongoClient(settings.DATABASE_URL)
    return _sync_client.get_database()
