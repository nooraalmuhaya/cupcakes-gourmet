"""Regras de cadastro, login e perfil (US06, RN-06, RN-22)."""
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Usuario
from app.models.enums import PerfilUsuario
from app.schemas.auth import PerfilEntrada, RegistroEntrada
from app.security.password import gerar_hash, senha_valida, verificar_senha
from app.utils.erros import AppError


def buscar_por_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email))


def cadastrar_cliente(db: Session, dados: RegistroEntrada) -> Usuario:
    if not senha_valida(dados.senha):
        raise AppError(422, "MSG-E03", campo="senha")
    if dados.senha != dados.confirmacao_senha:
        raise AppError(422, "MSG-E19", campo="confirmacao_senha")
    if buscar_por_email(db, dados.email):
        raise AppError(409, "MSG-E02", campo="email")

    # RN-22: o cadastro público sempre cria perfil CLIENTE
    usuario = Usuario(nome=dados.nome, email=dados.email, telefone=dados.telefone,
                      senha_hash=gerar_hash(dados.senha), perfil=PerfilUsuario.CLIENTE)
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError as exc:  # e-mail cadastrado ao mesmo tempo por outra requisição
        db.rollback()
        raise AppError(409, "MSG-E02", campo="email") from exc
    db.refresh(usuario)
    return usuario


def autenticar(db: Session, email: str, senha: str) -> Usuario:
    usuario = buscar_por_email(db, email)
    # MSG-E01 não diz se o erro foi no e-mail ou na senha (US06 CA5)
    if usuario is None or not verificar_senha(senha, usuario.senha_hash):
        raise AppError(401, "MSG-E01")
    return usuario


def atualizar_perfil(db: Session, usuario: Usuario, dados: PerfilEntrada) -> Usuario:
    """RF-12: o cliente altera nome e telefone (e-mail não é alterado nesta versão)."""
    usuario.nome = dados.nome
    usuario.telefone = dados.telefone
    db.commit()
    db.refresh(usuario)
    return usuario
