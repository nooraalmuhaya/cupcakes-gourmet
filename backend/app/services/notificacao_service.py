"""Notificações internas (US13, RN-16)."""
from app.utils.formatos import agora

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models import Notificacao, Pedido, Usuario
from app.utils.erros import AppError
from app.utils.mensagens import NOTIFICACAO_STATUS


def gerar(db: Session, pedido: Pedido, novo_status: str) -> Notificacao:
    """Cria a notificação da mudança de status (não faz commit: entra na mesma transação)."""
    notificacao = Notificacao(pedido=pedido, mensagem=NOTIFICACAO_STATUS[novo_status],
                              lida=False, data_envio=agora())
    db.add(notificacao)
    return notificacao


def _do_usuario(usuario: Usuario):
    return select(Notificacao).join(Notificacao.pedido).where(Pedido.id_usuario == usuario.id_usuario)


def listar(db: Session, usuario: Usuario, limite: int = 50) -> list[Notificacao]:
    consulta = _do_usuario(usuario).order_by(Notificacao.data_envio.desc(),
                                             Notificacao.id_notificacao.desc()).limit(limite)
    return list(db.scalars(consulta))


def contar_nao_lidas(db: Session, usuario: Usuario) -> int:
    consulta = (select(func.count()).select_from(Notificacao).join(Notificacao.pedido)
                .where(Pedido.id_usuario == usuario.id_usuario, Notificacao.lida.is_(False)))
    return db.scalar(consulta) or 0


def marcar_lida(db: Session, usuario: Usuario, id_notificacao: int) -> Notificacao:
    notificacao = db.get(Notificacao, id_notificacao)
    if notificacao is None:
        raise AppError(404, None, "Notificação não encontrada.")
    if notificacao.pedido.id_usuario != usuario.id_usuario:
        raise AppError(403, "MSG-E13")
    notificacao.lida = True
    db.commit()
    return notificacao


def marcar_todas(db: Session, usuario: Usuario) -> None:
    ids_pedidos = select(Pedido.id_pedido).where(Pedido.id_usuario == usuario.id_usuario)
    db.execute(update(Notificacao).where(Notificacao.id_pedido.in_(ids_pedidos)).values(lida=True))
    db.commit()
