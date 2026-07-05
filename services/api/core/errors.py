from fastapi import Request
from fastapi.responses import JSONResponse


async def generic_exception_handler(request: Request, exc: Exception):
    # No exponer stack traces al usuario
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Intenta de nuevo."},
    )


async def http_exception_handler(request: Request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
