"""Validação de cupom na ordem do SD-03 (RN-09)."""
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Cupom, Pedido
from app.models.enums import StatusPedido
from app.utils.erros import AppError


def normalizar_codigo(codigo: str) -> str:
    return (codigo or "").strip().upper()


def validar(db: Session, codigo: str, id_usuario: int, subtotal: Decimal,
            hoje: date | None = None, ignorar_pedido: int | None = None) -> tuple[Cupom, Decimal]:
    """Devolve (cupom, desconto) ou lança MSG-E08 com o motivo.

    Ordem: existe → ativo → dentro da validade → não usado por esta conta.
    "Usado" = está em um pedido não cancelado desta conta.
    """
    hoje = hoje or date.today()
    cupom = db.scalar(select(Cupom).where(Cupom.codigo == normalizar_codigo(codigo)))
    if cupom is None:
        raise _recusa("não encontrado")
    if not cupom.ativo:
        raise _recusa("inativo")
    if hoje > cupom.data_validade:
        raise _recusa("vencido")

    usos = select(func.count()).select_from(Pedido).where(
        Pedido.id_usuario == id_usuario,
        Pedido.id_cupom == cupom.id_cupom,
        Pedido.status != StatusPedido.CANCELADO,
    )
    if ignorar_pedido is not None:
        usos = usos.where(Pedido.id_pedido != ignorar_pedido)
    if db.scalar(usos):
        raise _recusa("já utilizado")

    return cupom, cupom.calcular_desconto(subtotal)


def _recusa(motivo: str) -> AppError:
    return AppError(422, "MSG-E08", f"Cupom inválido: {motivo}.", campo="codigo", dados={"motivo": motivo})
