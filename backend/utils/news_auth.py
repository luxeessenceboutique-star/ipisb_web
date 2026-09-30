"""Standalone password auth for the news admin panel.

Deliberately independent from deps.py's Supabase-Auth/role system (which
belongs to the separate IPISB Connect platform sharing this database) — a
single shared admin password is enough for this one-person content tool.
"""

import os
import time
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

NEWS_ADMIN_PASSWORD = os.environ.get("NEWS_ADMIN_PASSWORD", "")
NEWS_ADMIN_SECRET = os.environ.get("NEWS_ADMIN_SECRET", "")
TOKEN_TTL_SECONDS = 30 * 24 * 3600  # 30 days

_bearer = HTTPBearer(auto_error=True)


def issue_token(password: str) -> str:
    if not NEWS_ADMIN_PASSWORD or not NEWS_ADMIN_SECRET:
        raise HTTPException(status_code=500, detail="News admin auth is not configured on the server")
    if password != NEWS_ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    now = int(time.time())
    payload = {"scope": "news_admin", "iat": now, "exp": now + TOKEN_TTL_SECONDS}
    return jwt.encode(payload, NEWS_ADMIN_SECRET, algorithm="HS256")


async def require_news_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> None:
    if not NEWS_ADMIN_SECRET:
        raise HTTPException(status_code=500, detail="News admin auth is not configured on the server")
    try:
        payload = jwt.decode(credentials.credentials, NEWS_ADMIN_SECRET, algorithms=["HS256"])
        if payload.get("scope") != "news_admin":
            raise ValueError("wrong scope")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )
