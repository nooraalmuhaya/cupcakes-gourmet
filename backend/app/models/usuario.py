from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(15), nullable=True)
    perfil: Mapped[str] = mapped_column(String(10), nullable=False, default="CLIENTE")
    data_cadastro: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    enderecos: Mapped[list["Endereco"]] = relationship(back_populates="usuario")  # noqa: F821
    pedidos: Mapped[list["Pedido"]] = relationship(back_populates="usuario")  # noqa: F821
