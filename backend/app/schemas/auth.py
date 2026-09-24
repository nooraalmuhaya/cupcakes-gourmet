from pydantic import BaseModel, Field, field_validator

from app.schemas.comum import email_normalizado, obrigatorio, telefone_normalizado
from app.security.password import senha_valida
from app.utils.mensagens import msg


class RegistroEntrada(BaseModel):
    nome: str = Field(max_length=100, examples=["Maria Oliveira"])
    email: str = Field(max_length=120, examples=["maria@email.com"])
    telefone: str | None = Field(default=None, examples=["(11) 98765-4321"])
    senha: str = Field(examples=["senha1234"])
    confirmacao_senha: str = Field(examples=["senha1234"])

    _nome = field_validator("nome", mode="before")(obrigatorio)
    _email = field_validator("email", mode="before")(email_normalizado)
    _telefone = field_validator("telefone", mode="before")(telefone_normalizado)

    @field_validator("senha", mode="before")
    @classmethod
    def _senha(cls, v):
        if v is None or v == "":
            return obrigatorio(v)
        if not senha_valida(str(v)):
            raise ValueError(msg("MSG-E03"))  # RN-06
        return v

    @field_validator("confirmacao_senha", mode="before")
    @classmethod
    def _confirmacao(cls, v):
        if v is None or v == "":
            return obrigatorio(v)
        return v


class LoginEntrada(BaseModel):
    email: str = Field(examples=["maria@email.com"])
    senha: str = Field(examples=["senha1234"])

    @field_validator("email", mode="before")
    @classmethod
    def _email(cls, v):
        return obrigatorio(v).lower()

    @field_validator("senha", mode="before")
    @classmethod
    def _senha(cls, v):
        if v is None or v == "":
            return obrigatorio(v)
        return v


class UsuarioSaida(BaseModel):
    id_usuario: int
    nome: str
    email: str
    telefone: str | None
    perfil: str

    model_config = {"from_attributes": True}


class RespostaUsuario(BaseModel):
    mensagem: str | None = None
    codigo: str | None = None
    usuario: UsuarioSaida


class PerfilEntrada(BaseModel):
    nome: str = Field(max_length=100)
    telefone: str | None = None

    _nome = field_validator("nome", mode="before")(obrigatorio)
    _telefone = field_validator("telefone", mode="before")(telefone_normalizado)
