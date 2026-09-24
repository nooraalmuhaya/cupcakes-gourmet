"""Enumerações do diagrama de classes (dc_enums). No banco são VARCHAR com CHECK."""
from enum import StrEnum


class PerfilUsuario(StrEnum):
    CLIENTE = "CLIENTE"
    ADMIN = "ADMIN"


class StatusPedido(StrEnum):
    AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO"
    RECEBIDO = "RECEBIDO"
    EM_PREPARO = "EM_PREPARO"
    SAIU_PARA_ENTREGA = "SAIU_PARA_ENTREGA"
    ENTREGUE = "ENTREGUE"
    CANCELADO = "CANCELADO"


class MetodoPagamento(StrEnum):
    CREDITO = "CREDITO"
    DEBITO = "DEBITO"
    PIX = "PIX"


class StatusPagamento(StrEnum):
    PENDENTE = "PENDENTE"
    APROVADO = "APROVADO"
    RECUSADO = "RECUSADO"


class TipoCupom(StrEnum):
    PERCENTUAL = "PERCENTUAL"
    VALOR_FIXO = "VALOR_FIXO"
