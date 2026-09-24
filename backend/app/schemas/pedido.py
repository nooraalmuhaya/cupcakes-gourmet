from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.comum import opcional
from app.utils.mensagens import msg

Metodo = Literal["CREDITO", "DEBITO", "PIX"]
Status = Literal["AGUARDANDO_PAGAMENTO", "RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "ENTREGUE", "CANCELADO"]


class PedidoEntrada(BaseModel):
    """Checkout (T06 + T07): endereço escolhido e forma de pagamento (SD-01)."""
    id_endereco: int | None = None
    metodo: Metodo

    @field_validator("id_endereco", mode="before")
    @classmethod
    def _endereco(cls, v):
        if v in (None, ""):
            raise ValueError("Escolha um endereço de entrega.")
        return v


class CartaoEntrada(BaseModel):
    """Usado só para a simulação; nunca é gravado (RNF-07)."""
    numero: str | None = None
    nome: str | None = None
    validade: str | None = Field(None, examples=["12/28"])
    cvv: str | None = None


class PagamentoEntrada(BaseModel):
    id_pedido: int
    metodo: Metodo
    cartao: CartaoEntrada | None = None


class StatusEntrada(BaseModel):
    novo_status: Status
    status_atual: Status | None = Field(None, description="Status que o painel estava mostrando (MSG-E14)")


class AvaliacaoEntrada(BaseModel):
    nota: int | None = None
    comentario: str | None = Field(None, max_length=500)

    @field_validator("nota", mode="before")
    @classmethod
    def _nota(cls, v):
        if v in (None, "") or isinstance(v, bool):
            raise ValueError(msg("MSG-E12"))
        try:
            n = int(v)
        except (TypeError, ValueError) as exc:
            raise ValueError(msg("MSG-E12")) from exc
        if n != v and str(n) != str(v) or not 1 <= n <= 5:
            raise ValueError(msg("MSG-E12"))
        return n

    _comentario = field_validator("comentario", mode="before")(opcional)


class ItemSaida(BaseModel):
    id_produto: int
    nome: str
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    imagem_url: str


class PagamentoSaida(BaseModel):
    metodo: str
    status: str
    data_pagamento: datetime | None


class AvaliacaoSaida(BaseModel):
    nota: int
    comentario: str | None
    data_avaliacao: datetime


class EtapaSaida(BaseModel):
    status: str
    texto: str
    data: datetime | None
    concluida: bool
    atual: bool


class PedidoResumo(BaseModel):
    id_pedido: int
    numero_pedido: str
    data_pedido: datetime
    data_atualizacao: datetime
    status: str
    status_texto: str
    valor_total: Decimal


class PedidoDetalhe(PedidoResumo):
    itens: list[ItemSaida]
    endereco_entrega: str
    subtotal: Decimal
    valor_desconto: Decimal
    taxa_entrega: Decimal
    cupom: str | None
    pagamento: PagamentoSaida | None
    avaliacao: AvaliacaoSaida | None
    pode_avaliar: bool
    pode_cancelar: bool
    linha_do_tempo: list[EtapaSaida]


class ClienteSaida(BaseModel):
    nome: str
    email: str
    telefone: str | None


class PedidoAdminDetalhe(PedidoDetalhe):
    cliente: ClienteSaida
    proximo_status: str | None
    proximo_status_texto: str | None
    admin_pode_cancelar: bool


class PedidoHistorico(PedidoResumo):
    itens_texto: str
    nota: int | None
    pode_avaliar: bool


class PaginaPedidos(BaseModel):
    pedidos: list[PedidoHistorico]
    pagina: int
    total: int
    total_paginas: int


class PedidoAdminLinha(PedidoResumo):
    cliente: str


class PaginaPedidosAdmin(BaseModel):
    pedidos: list[PedidoAdminLinha]
    pagina: int
    total: int
    total_paginas: int


class RespostaPedido(BaseModel):
    mensagem: str | None = None
    codigo: str | None = None
    pedido: PedidoDetalhe


class RespostaPedidoAdmin(BaseModel):
    mensagem: str | None = None
    codigo: str | None = None
    pedido: PedidoAdminDetalhe


class StatusSaida(BaseModel):
    """Resposta leve para a consulta a cada 30 s (SD-02)."""
    id_pedido: int
    status: str
    status_texto: str
    data_atualizacao: datetime


class RespostaRepetir(BaseModel):
    mensagem: str | None
    aviso: str | None
    indisponiveis: list[str]


class NotificacaoSaida(BaseModel):
    id_notificacao: int
    id_pedido: int
    numero_pedido: str
    mensagem: str
    lida: bool
    data_envio: datetime
