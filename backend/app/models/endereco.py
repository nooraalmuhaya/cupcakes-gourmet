from sqlalchemy import Boolean, CHAR, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Endereco(Base):
    __tablename__ = "endereco"

    id_endereco: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"), nullable=False)
    apelido: Mapped[str] = mapped_column(String(30), nullable=False)
    cep: Mapped[str] = mapped_column(CHAR(8), nullable=False)
    logradouro: Mapped[str] = mapped_column(String(120), nullable=False)
    numero: Mapped[str] = mapped_column(String(10), nullable=False)
    complemento: Mapped[str | None] = mapped_column(String(60), nullable=True)
    bairro: Mapped[str] = mapped_column(String(60), nullable=False)
    cidade: Mapped[str] = mapped_column(String(60), nullable=False)
    uf: Mapped[str] = mapped_column(CHAR(2), nullable=False)
    padrao: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    usuario: Mapped["Usuario"] = relationship(back_populates="enderecos")  # noqa: F821

    def formatar_texto(self) -> str:
        """Texto copiado para pedido.endereco_entrega (método do diagrama de classes)."""
        linha = f"{self.logradouro}, {self.numero}"
        if self.complemento:
            linha += f", {self.complemento}"
        cep = f"{self.cep[:5]}-{self.cep[5:]}"
        return f"{self.apelido} – {linha} – {self.bairro} – {self.cidade} – {self.uf} – {cep}"[:255]
