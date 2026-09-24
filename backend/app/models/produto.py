from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Produto(Base):
    __tablename__ = "produto"

    id_produto: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_categoria: Mapped[int] = mapped_column(ForeignKey("categoria.id_categoria"), nullable=False)
    nome: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    ingredientes: Mapped[str] = mapped_column(String(500), nullable=False)
    alergenos: Mapped[str] = mapped_column(String(255), nullable=False)
    preco: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    imagem_url: Mapped[str] = mapped_column(String(255), nullable=False)
    vegano: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sem_gluten: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quantidade_estoque: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    categoria: Mapped["Categoria"] = relationship(back_populates="produtos")  # noqa: F821

    def esta_disponivel(self, quantidade: int = 1) -> bool:
        """RN-02 / RN-04: ativo e com estoque suficiente."""
        return bool(self.ativo) and self.quantidade_estoque >= quantidade
