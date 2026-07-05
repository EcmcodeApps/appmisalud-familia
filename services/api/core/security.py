from fastapi import HTTPException, Header
from firebase_admin import auth
from .firebase import init_firebase


async def verify_firebase_token(authorization: str = Header(...)) -> dict:
    """Verifica el ID token de Firebase en cada request privado."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")

    token = authorization.split("Bearer ")[1]
    try:
        init_firebase()
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="No autorizado")
