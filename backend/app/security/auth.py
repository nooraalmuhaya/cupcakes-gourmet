"""Autenticação por sessão (cookie assinado) e controle de acesso por perfil (RF-11, RNF-08)."""
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.models.enums import PerfilUsuario
from app.utils.erros import AppError

CHAVE_USUARIO = "uid"


def login_na_sessao(request: Request, usuario: Usuario) -> None:
    request.session[CHAVE_USUARIO] = usuario.id_usuario


def logout_da_sessao(request: Request) -> None:
    request.session.clear()


def usuario_opcional(request: Request, db: Session = Depends(get_db)) -> Usuario | None:
    uid = request.session.get(CHAVE_USUARIO)
    if uid is None:
        return None
    usuario = db.get(Usuario, uid)
    if usuario is None:  # conta removida do banco: encerra a sessão
        request.session.pop(CHAVE_USUARIO, None)
    return usuario


def usuario_logado(usuario: Usuario | None = Depends(usuario_opcional)) -> Usuario:
    if usuario is None:
        raise AppError(401, "MSG-I06")
    return usuario


def cliente_logado(usuario: Usuario = Depends(usuario_logado)) -> Usuario:
    """Funções de compra são só do CLIENTE (RN-22: administrador não tem endereços nem pedidos)."""
    if usuario.perfil != PerfilUsuario.CLIENTE:
        raise AppError(403, "MSG-E13")
    return usuario


def admin_logado(usuario: Usuario = Depends(usuario_logado)) -> Usuario:
    if usuario.perfil != PerfilUsuario.ADMIN:
        raise AppError(403, "MSG-E13")
    return usuario
