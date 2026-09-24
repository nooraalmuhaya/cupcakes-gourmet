from decimal import Decimal


def reais(valor: Decimal) -> str:
    """Formata 1234.5 como "1.234,50" (padrão brasileiro, sem o "R$")."""
    texto = f"{Decimal(valor):,.2f}"
    return texto.replace(",", "X").replace(".", ",").replace("X", ".")
