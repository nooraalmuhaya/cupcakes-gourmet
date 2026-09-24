from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Notificacao(Base):
    __tablename__ = "notificacao"

    id_notificacao: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_pedido: Mapped[int] = mapped_column(ForeignKey("pedido.id_pedido"), nullable=False)
    mensagem: Mapped[str] = mapped_column(String(255), nullable=False)
    lida: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    data_envio: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    pedido: Mapped["Pedido"] = relationship(back_populates="notificacoes")  # noqa: F821
