"""Ponto de entrada da API do App de Cupcakes Gourmet (Situação 2).

Execução (dentro da pasta backend):
    python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
"""
import logging
import secrets

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.config.settings import settings
from app.routers import saude
from app.utils.erros import registrar_tratadores

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("cupcakes")

DESCRICAO = """
API REST do **App de Cupcakes Gourmet** (loja *Cupcake Haven*).

* Autenticação por sessão (cookie). Use `POST /api/auth/login` antes das rotas protegidas.
* Rotas `/api/admin/...` exigem perfil **ADMIN**.
* Todas as mensagens seguem o catálogo da seção 10.4 da Situação 1 (campo `codigo`).
* O pagamento é **simulado**: nenhum valor real é cobrado.
"""


def criar_app() -> FastAPI:
    app = FastAPI(
        title="Cupcakes Gourmet – API",
        description=DESCRICAO,
        version="2.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    chave = settings.secret_key
    if not chave or chave == "CHANGE_ME":
        chave = secrets.token_hex(32)
        logger.warning("SECRET_KEY não definida no .env: usando chave temporária "
                       "(as sessões serão perdidas ao reiniciar o servidor).")

    app.add_middleware(
        SessionMiddleware,
        secret_key=chave,
        session_cookie="cupcakes_sessao",
        max_age=60 * 60 * 24,  # 1 dia
        same_site="lax",
        https_only=settings.session_https_only,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type"],
    )

    registrar_tratadores(app)

    for modulo in (saude,):
        app.include_router(modulo.router)

    # View (MVC): o próprio servidor entrega o front-end, na mesma origem da API.
    if settings.frontend_dir.exists():
        app.mount("/", StaticFiles(directory=settings.frontend_dir, html=True), name="frontend")

    return app


app = criar_app()
