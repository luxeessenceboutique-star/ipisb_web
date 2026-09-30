import logging
import re
import httpcore
import httpx
from gotrue.errors import AuthRetryableError
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from deps import FRONTEND_URL, reset_db_client
from routers import chatbot, news

log = logging.getLogger(__name__)

app = FastAPI(title="IPISBE Site API", version="1.0.0")

ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:5180",
    "http://localhost:5181",
    "http://localhost:5182",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "http://127.0.0.1:5178",
    "http://127.0.0.1:5179",
    "http://127.0.0.1:5180",
    "http://127.0.0.1:5181",
    "http://127.0.0.1:5182",
]
ALLOWED_ORIGIN_REGEX = re.compile(r"https://.*\.vercel\.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX.pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot.router, prefix="/api")
app.include_router(news.router, prefix="/api")


@app.get("/health")
async def health():
    return {"ok": True, "version": "1.0.0"}


# An exception that isn't an HTTPException (e.g. a missing-table DB error)
# propagates past CORSMiddleware entirely: Starlette always runs the outermost
# ServerErrorMiddleware above all user middleware (including CORS), even if you
# register @app.exception_handler(Exception) — Starlette special-cases that
# registration straight into ServerErrorMiddleware, which is *outside* CORS.
# So the 500 response never gets an Access-Control-Allow-Origin header, the
# browser blocks it as a cross-origin failure, and the frontend sees a bare
# "Failed to fetch" instead of the real error. Catching it ourselves in a
# middleware — with CORS headers attached by hand — sidesteps that ordering
# entirely, regardless of where CORSMiddleware sits in the stack.
# Le client Supabase (deps._client) est un singleton mis en cache pour tout
# le process : son pool de connexions HTTP/2 survit entre les requêtes. Après
# une période d'inactivité, Supabase referme la connexion de son côté ; httpx
# ne le détecte qu'en la réutilisant, et la requête suivante meurt avec ce
# type d'erreur au lieu de rouvrir une connexion. On le traite à part : on
# jette le client en cache (nouvelle connexion à la prochaine requête) et,
# pour les lectures (GET/HEAD, sans risque de double-écriture), on retente
# une fois avant d'abandonner.
_TRANSIENT_DB_CONN_ERRORS = (
    httpx.RemoteProtocolError,
    httpcore.RemoteProtocolError,
    httpx.ConnectError,
    httpcore.ConnectError,
    # gotrue classe déjà ses propres erreurs de transport à part (voir
    # gotrue.helpers.handle_exception) — deps.get_current_user relaie cette
    # exception telle quelle plutôt que de la déguiser en "token invalide".
    AuthRetryableError,
)


@app.middleware("http")
async def cors_safe_error_handler(request: Request, call_next):
    try:
        return await call_next(request)
    except _TRANSIENT_DB_CONN_ERRORS as exc:
        logging.warning("Connexion Supabase coupée (idle) sur %s %s (%r) — reconnexion.",
                         request.method, request.url.path, exc)
        reset_db_client()
        if request.method in ("GET", "HEAD"):
            try:
                return await call_next(request)
            except Exception:
                logging.exception("Échec après reconnexion sur %s %s", request.method, request.url.path)
        response = JSONResponse(status_code=503, content={"detail": "Service temporairement indisponible, réessayez."})
        origin = request.headers.get("origin")
        if origin and (origin in ALLOWED_ORIGINS or ALLOWED_ORIGIN_REGEX.match(origin)):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
        return response
    except Exception:
        logging.exception("Unhandled exception on %s %s", request.method, request.url.path)
        response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
        origin = request.headers.get("origin")
        if origin and (origin in ALLOWED_ORIGINS or ALLOWED_ORIGIN_REGEX.match(origin)):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
        return response
