from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager

from core.cors import add_cors
from core.errors import generic_exception_handler, http_exception_handler
from routers import health, documents, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar Firebase al arrancar
    from core.firebase import init_firebase
    init_firebase()
    yield


app = FastAPI(
    title="AppMiSalud Familia API",
    version="0.1.0",
    docs_url="/docs" if True else None,  # desactivar en producción
    lifespan=lifespan,
)

add_cors(app)

app.add_exception_handler(Exception, generic_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

app.include_router(health.router, tags=["health"])
app.include_router(documents.router)
app.include_router(ai.router)
