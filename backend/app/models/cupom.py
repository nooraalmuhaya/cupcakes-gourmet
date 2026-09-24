from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import Boolean, Date, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.enums import TipoCupom


class Cupom(Base):
    __tablename__ = "cupom"

    id_cupom: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    tipo: Mapped[str] = mapped_column(String(12), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    data_validade: Mapped[date] = mapped_column(Date, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    def esta_valido(self, hoje: date) -> bool:
        return bool(self.ativo) and hoje <= self.data_validade

    def calcular_desconto(self, subtotal: Decimal) -> Decimal:
        """RN-09: o desconto nunca passa do subtotal (não vale para a taxa de entrega)."""
        if self.tipo == TipoCupom.PERCENTUAL:
            desconto = (subtotal * self.valor / Decimal(100)).quantize(Decimal("0.01"), ROUND_HALF_UP)
        else:
            desconto = Decimal(self.valor)
        return min(desconto, subtotal)
