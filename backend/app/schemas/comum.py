"""Validadores reutilizados pelos schemas (mensagens do catálogo da seção 10.4)."""
import re

from email_validator import EmailNotValidError, validate_email

from app.utils.mensagens import msg


def obrigatorio(valor: str | None) -> str:
    if valor is None or not str(valor).strip():
        raise ValueError(msg("MSG-E05"))
    return str(valor).strip()


def opcional(valor: str | None) -> str | None:
    if valor is None:
        return None
    valor = str(valor).strip()
    return valor or None


def email_normalizado(valor: str | None) -> str:
    valor = obrigatorio(valor)
    try:
        return validate_email(valor, check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise ValueError("Digite um e-mail válido, por exemplo: nome@email.com.") from exc


def telefone_normalizado(valor: str | None) -> str | None:
    """Telefone com DDD, somente números (dicionário de dados). Opcional."""
    valor = opcional(valor)
    if valor is None:
        return None
    digitos = re.sub(r"\D", "", valor)
    if not 10 <= len(digitos) <= 11:
        raise ValueError("Telefone inválido. Informe o DDD e o número, ex.: (11) 98765-4321.")
    return digitos
