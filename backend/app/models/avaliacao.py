from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Avaliacao(Base):
    __tablename__ = "avaliacao"

    id_avaliacao: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_pedido: Mapped[int] = mapped_column(ForeignKey("pedido.id_pedido"), nullable=False, unique=True)
    nota: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # TINYINT no MySQL
    comentario: Mapped[str | None] = mapped_column(String(500), nullable=True)
    data_avaliacao: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    pedido: Mapped["Pedido"] = relationship(back_populates="avaliacao")  # noqa: F821
