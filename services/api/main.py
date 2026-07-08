from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from core.config import get_settings
from core.cors import add_cors
from core.errors import generic_exception_handler, http_exception_handler
from core.rate_limit import RateLimitMiddleware
from routers import admin, ai, documents, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    from core.firebase import init_firebase

    init_firebase()
    yield


settings = get_settings()

app = FastAPI(
    title="MiSalud FamilIA API",
    version="0.1.0",
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
    openapi_url="/openapi.json" if settings.app_env != "production" else None,
    lifespan=lifespan,
)

add_cors(app)
app.add_middleware(RateLimitMiddleware)

app.add_exception_handler(Exception, generic_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

app.include_router(health.router, tags=["health"])
app.include_router(documents.router)
app.include_router(ai.router)
app.include_router(admin.router)
