from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.comum import obrigatorio
from app.utils.mensagens import msg

TEXTO_SEM_ALERGENOS = "Não contém alérgenos declarados"  # RN-03


class CategoriaSaida(BaseModel):
    id_categoria: int
    nome: str

    model_config = {"from_attributes": True}


class ProdutoResumo(BaseModel):
    """Card do cardápio (T01)."""
    id_produto: int
    nome: str
    descricao: str
    preco: Decimal
    imagem_url: str
    vegano: bool
    sem_gluten: bool
    quantidade_estoque: int
    disponivel: bool
    id_categoria: int
    categoria: str


class ProdutoDetalhe(ProdutoResumo):
    """Tela de detalhes (T02)."""
    ingredientes: str
    alergenos: str


class ProdutoAdmin(ProdutoDetalhe):
    ativo: bool


class ProdutoEntrada(BaseModel):
    """Formulário de produto (A04) – validações de US16 CA2."""
    nome: str = Field(max_length=80)
    id_categoria: int | None = None
    descricao: str = Field(max_length=500)
    ingredientes: str = Field(max_length=500)
    alergenos: str | None = Field(default=None, max_length=255)
    preco: Decimal | None = None
    imagem_url: str = Field(max_length=255)
    vegano: bool = False
    sem_gluten: bool = False
    quantidade_estoque: int | None = None
    ativo: bool = True

    _obrigatorios = field_validator("nome", "descricao", "ingredientes", "imagem_url", mode="before")(obrigatorio)

    @field_validator("alergenos", mode="before")
    @classmethod
    def _alergenos(cls, v):
        # RN-03: se não houver alérgenos, usa o texto padrão
        if v is None or not str(v).strip():
            return TEXTO_SEM_ALERGENOS
        return str(v).strip()

    @field_validator("id_categoria", mode="before")
    @classmethod
    def _categoria(cls, v):
        if v in (None, ""):
            raise ValueError(msg("MSG-E05"))
        return v

    @field_validator("preco", mode="before")
    @classmethod
    def _preco(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError(msg("MSG-E05"))
        if isinstance(v, str):
            v = v.replace(",", ".")
        try:
            valor = Decimal(str(v))
        except Exception as exc:  # noqa: BLE001
            raise ValueError(msg("MSG-E21")) from exc
        if valor <= 0:
            raise ValueError(msg("MSG-E21"))
        if valor >= Decimal("1000000") or valor != valor.quantize(Decimal("0.01")):
            raise ValueError("Informe o preço com no máximo 2 casas decimais.")
        return valor

    @field_validator("quantidade_estoque", mode="before")
    @classmethod
    def _estoque(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError(msg("MSG-E05"))
        erro = "O estoque deve ser um número inteiro maior ou igual a zero."
        if isinstance(v, bool) or not (isinstance(v, int) or str(v).strip().isdigit()):
            raise ValueError(erro)
        n = int(v)
        if n < 0:
            raise ValueError(erro)
        return n


class SituacaoEntrada(BaseModel):
    ativo: bool
