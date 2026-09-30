import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from utils.news_auth import issue_token, require_news_admin

router = APIRouter()
log = logging.getLogger(__name__)

VALID_CATEGORIES = {"recherche", "vie", "plateforme", "evenement"}
IMAGE_BUCKET = "news-images"


def _client():
    from chatbot.supabase_client import _client as sb_client
    return sb_client()


class LoginRequest(BaseModel):
    password: str


class NewsArticleIn(BaseModel):
    category: str = "vie"
    published: bool = True
    featured: bool = False
    image_url: Optional[str] = None
    published_at: Optional[str] = None  # YYYY-MM-DD, defaults server-side if omitted
    read_time_minutes: int = 3
    title_fr: str
    excerpt_fr: str
    title_en: Optional[str] = None
    excerpt_en: Optional[str] = None
    title_ar: Optional[str] = None
    excerpt_ar: Optional[str] = None


def _row_to_public(row: dict, lang: str) -> dict:
    title = row.get(f"title_{lang}") or row["title_fr"]
    excerpt = row.get(f"excerpt_{lang}") or row["excerpt_fr"]
    return {
        "id": row["id"],
        "category": row["category"],
        "featured": row["featured"],
        "image_url": row.get("image_url"),
        "published_at": row["published_at"],
        "read_time_minutes": row["read_time_minutes"],
        "title": title,
        "excerpt": excerpt,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Public endpoints — used by the live site
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/news")
async def list_news(lang: str = "fr", category: Optional[str] = None, limit: int = 50):
    if lang not in ("fr", "en", "ar"):
        lang = "fr"
    q = _client().table("news_articles").select("*").eq("published", True).order("published_at", desc=True).limit(limit)
    if category and category in VALID_CATEGORIES:
        q = q.eq("category", category)
    rows = q.execute().data or []
    return {"articles": [_row_to_public(r, lang) for r in rows]}


# ─────────────────────────────────────────────────────────────────────────────
# Admin auth
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/news/admin/login")
async def admin_login(req: LoginRequest):
    token = issue_token(req.password)
    return {"token": token}


# ─────────────────────────────────────────────────────────────────────────────
# Admin CRUD — all require a valid news_admin token
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/news/admin", dependencies=[Depends(require_news_admin)])
async def admin_list_news():
    rows = _client().table("news_articles").select("*").order("published_at", desc=True).execute().data or []
    return {"articles": rows}


@router.post("/news/admin", dependencies=[Depends(require_news_admin)])
async def admin_create_news(article: NewsArticleIn):
    if article.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(VALID_CATEGORIES)}")
    payload = article.model_dump(exclude_none=True)
    row = _client().table("news_articles").insert(payload).execute().data
    return row[0] if row else {}


@router.put("/news/admin/{article_id}", dependencies=[Depends(require_news_admin)])
async def admin_update_news(article_id: str, article: NewsArticleIn):
    if article.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(VALID_CATEGORIES)}")
    payload = article.model_dump(exclude_none=True)
    row = _client().table("news_articles").update(payload).eq("id", article_id).execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    return row[0]


@router.delete("/news/admin/{article_id}", dependencies=[Depends(require_news_admin)])
async def admin_delete_news(article_id: str):
    _client().table("news_articles").delete().eq("id", article_id).execute()
    return {"ok": True}


@router.post("/news/admin/upload-image", dependencies=[Depends(require_news_admin)])
async def admin_upload_image(file: UploadFile = File(...)):
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "gif": "image/gif"}
    content_type = mime_map.get(ext, "application/octet-stream")
    storage_path = f"{uuid.uuid4()}.{ext}"

    try:
        client = _client()
        client.storage.from_(IMAGE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        public_url: str = client.storage.from_(IMAGE_BUCKET).get_public_url(storage_path)
    except Exception as e:
        log.error("News image upload failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    return {"url": public_url}
