from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Pedido(Base):
    __tablename__ = "pedido"

    id_pedido: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero_pedido: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"), nullable=False)
    id_cupom: Mapped[int | None] = mapped_column(ForeignKey("cupom.id_cupom"), nullable=True)
    endereco_entrega: Mapped[str] = mapped_column(String(255), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    valor_desconto: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    taxa_entrega: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    valor_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(25), nullable=False, default="AGUARDANDO_PAGAMENTO")
    data_pedido: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    data_atualizacao: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    usuario: Mapped["Usuario"] = relationship(back_populates="pedidos")  # noqa: F821
    cupom: Mapped["Cupom | None"] = relationship()  # noqa: F821
    itens: Mapped[list["ItemPedido"]] = relationship(  # noqa: F821
        back_populates="pedido", cascade="all, delete-orphan", order_by="ItemPedido.id_item_pedido"
    )
    pagamento: Mapped["Pagamento | None"] = relationship(  # noqa: F821
        back_populates="pedido", uselist=False, cascade="all, delete-orphan"
    )
    avaliacao: Mapped["Avaliacao | None"] = relationship(  # noqa: F821
        back_populates="pedido", uselist=False, cascade="all, delete-orphan"
    )
    notificacoes: Mapped[list["Notificacao"]] = relationship(  # noqa: F821
        back_populates="pedido", cascade="all, delete-orphan"
    )

    def calcular_total(self) -> Decimal:
        return self.subtotal - self.valor_desconto + self.taxa_entrega
