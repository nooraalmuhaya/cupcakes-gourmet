from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ItemPedido(Base):
    __tablename__ = "item_pedido"

    id_item_pedido: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_pedido: Mapped[int] = mapped_column(ForeignKey("pedido.id_pedido"), nullable=False)
    id_produto: Mapped[int] = mapped_column(ForeignKey("produto.id_produto"), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)

    pedido: Mapped["Pedido"] = relationship(back_populates="itens")  # noqa: F821
    produto: Mapped["Produto"] = relationship()  # noqa: F821

    def calcular_subtotal(self) -> Decimal:
        return self.preco_unitario * self.quantidade
