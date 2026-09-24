"""Avaliação do pedido entregue (US12, RN-17)."""
from app.utils.formatos import agora

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Avaliacao, Usuario
from app.models.enums import StatusPedido
from app.services.pedido_service import obter_do_cliente
from app.utils.erros import AppError


def avaliar(db: Session, usuario: Usuario, id_pedido: int, nota: int, comentario: str | None) -> Avaliacao:
    pedido = obter_do_cliente(db, usuario, id_pedido)
    # Só ENTREGUE e uma vez por pedido; não pode ser editada (MSG-E20)
    if pedido.status != StatusPedido.ENTREGUE or pedido.avaliacao is not None:
        raise AppError(409, "MSG-E20")
    avaliacao = Avaliacao(id_pedido=pedido.id_pedido, nota=nota, comentario=comentario,
                          data_avaliacao=agora())
    db.add(avaliacao)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "uq_avaliacao_id_pedido" in str(exc.orig):  # envio duplicado ao mesmo tempo
            raise AppError(409, "MSG-E20") from exc
        raise
    db.refresh(avaliacao)
    return avaliacao
