"""Real Supabase Auth account for the news admin panel — login is a genuine
email+password account stored in Supabase (auth.users), but access is
gated by an email allowlist here rather than deps.py's user_roles/permissions
system, which belongs to the separate IPISB Connect platform sharing this
database. No dependency on that system's tables or role logic.
"""

import os
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
NEWS_ADMIN_EMAILS = {
    e.strip().lower() for e in os.environ.get("NEWS_ADMIN_EMAILS", "").split(",") if e.strip()
}

_bearer = HTTPBearer(auto_error=True)


def _anon_client():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def login(email: str, password: str) -> str:
    if not NEWS_ADMIN_EMAILS:
        raise HTTPException(status_code=500, detail="News admin auth is not configured on the server")
    if email.strip().lower() not in NEWS_ADMIN_EMAILS:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    try:
        resp = _anon_client().auth.sign_in_with_password({"email": email, "password": password})
        if not resp.session:
            raise ValueError("no session")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return resp.session.access_token


async def require_news_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> None:
    from chatbot.supabase_client import _client as service_client

    try:
        resp = service_client().auth.get_user(credentials.credentials)
        email = (resp.user.email or "").strip().lower() if resp.user else ""
        if not email or email not in NEWS_ADMIN_EMAILS:
            raise ValueError("not an allowed news admin")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )
