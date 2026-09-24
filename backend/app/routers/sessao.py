"""Resumo da sessão para o cabeçalho de todas as telas (seção 10.1)."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.models.enums import PerfilUsuario
from app.schemas.auth import UsuarioSaida
from app.security.auth import usuario_opcional
from app.services import carrinho_service, notificacao_service

router = APIRouter(prefix="/api", tags=["Autenticação e conta"])


@router.get("/sessao", summary="Usuário logado, itens no carrinho e notificações não lidas")
def sessao(request: Request, usuario: Usuario | None = Depends(usuario_opcional), db: Session = Depends(get_db)):
    nao_lidas = 0
    if usuario is not None and usuario.perfil == PerfilUsuario.CLIENTE:
        nao_lidas = notificacao_service.contar_nao_lidas(db, usuario)  # RNF-17
    return {
        "usuario": UsuarioSaida.model_validate(usuario) if usuario else None,
        "carrinho_quantidade": carrinho_service.quantidade_total(request.session),
        "notificacoes_nao_lidas": nao_lidas,
    }
