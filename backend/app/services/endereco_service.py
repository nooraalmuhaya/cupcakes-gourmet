"""Regras dos endereços do cliente (US14, RN-08)."""
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models import Endereco, Usuario
from app.schemas.endereco import EnderecoEntrada
from app.utils.erros import AppError

LIMITE_ENDERECOS = 5


def listar(db: Session, usuario: Usuario) -> list[Endereco]:
    consulta = (select(Endereco).where(Endereco.id_usuario == usuario.id_usuario)
                .order_by(Endereco.padrao.desc(), Endereco.id_endereco))
    return list(db.scalars(consulta))


def obter(db: Session, usuario: Usuario, id_endereco: int) -> Endereco:
    endereco = db.get(Endereco, id_endereco)
    if endereco is None:
        raise AppError(404, None, "Endereço não encontrado.")
    if endereco.id_usuario != usuario.id_usuario:  # RNF-08
        raise AppError(403, "MSG-E13")
    return endereco


def _desmarcar_padrao(db: Session, usuario: Usuario) -> None:
    db.execute(update(Endereco).where(Endereco.id_usuario == usuario.id_usuario).values(padrao=False))


def criar(db: Session, usuario: Usuario, dados: EnderecoEntrada) -> Endereco:
    # Trava as linhas do usuário para duas requisições simultâneas não passarem do limite
    quantidade = db.scalar(select(func.count()).select_from(
        select(Endereco.id_endereco).where(Endereco.id_usuario == usuario.id_usuario)
        .with_for_update().subquery()))
    if quantidade >= LIMITE_ENDERECOS:
        raise AppError(409, "MSG-E16")
    padrao = dados.padrao or quantidade == 0  # o primeiro vira padrão
    if padrao:
        _desmarcar_padrao(db, usuario)
    endereco = Endereco(id_usuario=usuario.id_usuario, **dados.model_dump(exclude={"padrao"}), padrao=padrao)
    db.add(endereco)
    db.commit()
    db.refresh(endereco)
    return endereco


def atualizar(db: Session, usuario: Usuario, id_endereco: int, dados: EnderecoEntrada) -> Endereco:
    """Editar não altera pedidos antigos: o pedido guarda uma cópia em texto (US14 CA5)."""
    endereco = obter(db, usuario, id_endereco)
    for campo, valor in dados.model_dump(exclude={"padrao"}).items():
        setattr(endereco, campo, valor)
    if dados.padrao and not endereco.padrao:
        _desmarcar_padrao(db, usuario)
        endereco.padrao = True
    db.commit()
    db.refresh(endereco)
    return endereco


def tornar_padrao(db: Session, usuario: Usuario, id_endereco: int) -> Endereco:
    endereco = obter(db, usuario, id_endereco)
    _desmarcar_padrao(db, usuario)
    endereco.padrao = True
    db.commit()
    db.refresh(endereco)
    return endereco


def excluir(db: Session, usuario: Usuario, id_endereco: int) -> None:
    """Se era o padrão, o endereço mais antigo que sobrou vira padrão (UC-07 A2)."""
    endereco = obter(db, usuario, id_endereco)
    era_padrao = endereco.padrao
    db.delete(endereco)
    db.flush()
    if era_padrao:
        mais_antigo = db.scalar(select(Endereco).where(Endereco.id_usuario == usuario.id_usuario)
                                .order_by(Endereco.id_endereco).limit(1))
        if mais_antigo is not None:
            mais_antigo.padrao = True
    db.commit()
