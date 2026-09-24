from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.comum import obrigatorio


class ItemEntrada(BaseModel):
    id_produto: int
    quantidade: int = Field(default=1, ge=1, le=99,
                            description="Mínimo 1 (RN-04). O máximo real é o estoque.")


class QuantidadeEntrada(BaseModel):
    quantidade: int = Field(ge=1, le=99)


class CupomEntrada(BaseModel):
    codigo: str = Field(max_length=20)

    _codigo = field_validator("codigo", mode="before")(obrigatorio)


class ItemCarrinho(BaseModel):
    id_produto: int
    nome: str
    imagem_url: str
    preco: Decimal
    quantidade: int
    subtotal: Decimal
    quantidade_estoque: int
    disponivel: bool
    preco_alterado: bool


class CupomAplicado(BaseModel):
    codigo: str
    tipo: str
    valor: Decimal


class Carrinho(BaseModel):
    itens: list[ItemCarrinho]
    quantidade_itens: int
    subtotal: Decimal
    cupom: CupomAplicado | None
    desconto: Decimal
    taxa_entrega: Decimal
    total: Decimal
    vazio: bool
    pode_finalizar: bool
    aviso: str | None = Field(None, description="MSG-E07 quando algum item mudou de preço ou ficou indisponível")
    aviso_cupom: str | None = None


class RespostaCarrinho(BaseModel):
    mensagem: str | None = None
    codigo: str | None = None
    carrinho: Carrinho
