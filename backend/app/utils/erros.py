"""Erros de negócio e tratamento padronizado de erros da API.

Formato de toda resposta de erro:
    {"detail": "<mensagem em português>", "codigo": "MSG-E..", "campo": "<campo>" | null,
     "erros": [{"campo": ..., "mensagem": ...}]  # só em erros de validação
    }
Nenhum stack trace é enviado ao usuário.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.utils.mensagens import msg

logger = logging.getLogger("cupcakes")


class AppError(Exception):
    """Erro previsto pelas regras de negócio (vira uma resposta JSON amigável)."""

    def __init__(self, status_code: int, codigo: str | None, mensagem: str | None = None,
                 campo: str | None = None, dados: dict | None = None):
        self.status_code = status_code
        self.codigo = codigo
        self.mensagem = mensagem or (msg(codigo) if codigo else "Erro.")
        self.campo = campo
        self.dados = dados or {}
        super().__init__(self.mensagem)


def _corpo(detail: str, codigo: str | None = None, campo: str | None = None, **extra) -> dict:
    corpo = {"detail": detail, "codigo": codigo, "campo": campo}
    corpo.update(extra)
    return corpo


def _mensagem_validacao(erro: dict) -> str:
    tipo = erro.get("type", "")
    if tipo == "missing":
        return msg("MSG-E05")
    if tipo == "value_error":
        texto = str(erro.get("msg", ""))
        return texto.removeprefix("Value error, ")
    if tipo in {"string_too_long"}:
        limite = erro.get("ctx", {}).get("max_length")
        return f"Use no máximo {limite} caracteres." if limite else "Texto muito longo."
    if tipo in {"string_too_short"}:
        return msg("MSG-E05")
    return "Valor inválido."


def registrar_tratadores(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code,
                            content=_corpo(exc.mensagem, exc.codigo, exc.campo, **exc.dados))

    @app.exception_handler(RequestValidationError)
    async def _validacao(_: Request, exc: RequestValidationError):
        erros = []
        for e in exc.errors():
            loc = [str(p) for p in e.get("loc", []) if p not in ("body", "query", "path")]
            erros.append({"campo": ".".join(loc) or None, "mensagem": _mensagem_validacao(e)})
        primeiro = erros[0] if erros else {"campo": None, "mensagem": "Dados inválidos."}
        return JSONResponse(status_code=422, content=_corpo(
            primeiro["mensagem"], "VALIDACAO", primeiro["campo"], erros=erros))

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        textos = {404: "Recurso não encontrado.", 405: "Método não permitido."}
        detail = exc.detail if isinstance(exc.detail, str) and exc.status_code not in textos else textos.get(exc.status_code, "Erro.")
        return JSONResponse(status_code=exc.status_code, content=_corpo(detail))

    @app.exception_handler(Exception)
    async def _inesperado(request: Request, exc: Exception):
        # O detalhe técnico fica só no log do servidor (RNF: não expor stack trace)
        logger.exception("Erro inesperado em %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content=_corpo(msg("MSG-E18"), "MSG-E18"))
