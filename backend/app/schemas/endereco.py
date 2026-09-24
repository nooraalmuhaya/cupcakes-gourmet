import re

from pydantic import BaseModel, Field, field_validator

from app.schemas.comum import obrigatorio, opcional
from app.utils.mensagens import msg

UFS = {"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB",
       "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"}


class EnderecoEntrada(BaseModel):
    apelido: str = Field(max_length=30, examples=["Casa"])
    cep: str = Field(examples=["01415-000"])
    logradouro: str = Field(max_length=120)
    numero: str = Field(max_length=10, examples=["123", "S/N"])
    complemento: str | None = Field(default=None, max_length=60)
    bairro: str = Field(max_length=60)
    cidade: str = Field(max_length=60)
    uf: str = Field(examples=["SP"])
    padrao: bool = False

    _obrigatorios = field_validator("apelido", "logradouro", "numero", "bairro", "cidade",
                                    mode="before")(obrigatorio)
    _complemento = field_validator("complemento", mode="before")(opcional)

    @field_validator("cep", mode="before")
    @classmethod
    def _cep(cls, v):
        v = obrigatorio(v)
        digitos = re.sub(r"\D", "", v)
        if len(digitos) != 8 or not re.fullmatch(r"[\d\-. ]+", v):
            raise ValueError(msg("MSG-E04"))
        return digitos

    @field_validator("uf", mode="before")
    @classmethod
    def _uf(cls, v):
        v = obrigatorio(v).upper()
        if v not in UFS:
            raise ValueError("Escolha uma UF válida (ex.: SP).")
        return v


class EnderecoSaida(BaseModel):
    id_endereco: int
    apelido: str
    cep: str
    logradouro: str
    numero: str
    complemento: str | None
    bairro: str
    cidade: str
    uf: str
    padrao: bool

    model_config = {"from_attributes": True}


class RespostaEndereco(BaseModel):
    mensagem: str | None = None
    codigo: str | None = None
    endereco: EnderecoSaida
