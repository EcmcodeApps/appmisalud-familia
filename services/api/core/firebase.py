import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from functools import lru_cache
from .config import get_settings


@lru_cache()
def init_firebase():
    settings = get_settings()
    if firebase_admin._apps:
        return firebase_admin.get_app()

    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": settings.firebase_project_id,
        "client_email": settings.firebase_client_email,
        "private_key": settings.firebase_private_key.replace("\\n", "\n"),
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    return firebase_admin.initialize_app(cred, {
        "storageBucket": settings.firebase_storage_bucket,
    })


def get_firestore():
    init_firebase()
    return firestore.client()


def get_storage():
    init_firebase()
    return storage.bucket()


def get_auth():
    init_firebase()
    return auth
