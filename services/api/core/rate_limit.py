import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import get_settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if request.url.path in {"/health"}:
            return await call_next(request)

        identifier = request.headers.get("authorization", "")[-32:] or request.client.host if request.client else "unknown"
        now = time.monotonic()
        window_start = now - 60
        bucket = self.requests[identifier]

        while bucket and bucket[0] < window_start:
            bucket.popleft()

        if len(bucket) >= settings.rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Demasiadas solicitudes. Intenta nuevamente en un minuto."},
            )

        bucket.append(now)
        return await call_next(request)
