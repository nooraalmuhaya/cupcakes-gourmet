from decimal import Decimal


def reais(valor: Decimal) -> str:
    """Formata 1234.5 como "1.234,50" (padrão brasileiro, sem o "R$")."""
    texto = f"{Decimal(valor):,.2f}"
    return texto.replace(",", "X").replace(".", ",").replace("X", ".")


def agora():
    """Data/hora local sem microssegundos (a coluna DATETIME do MySQL não guarda frações)."""
    from datetime import datetime

    return datetime.now().replace(microsecond=0)
