"""Pagamento simulado (RN-11). Nenhum dado de cartão é gravado ou registrado em log (RNF-07)."""
import re
from datetime import date

from app.models.enums import MetodoPagamento, StatusPagamento
from app.utils.erros import AppError
from app.utils.mensagens import msg


def _erro_cartao(campo: str, rotulo: str) -> AppError:
    return AppError(422, "MSG-E11", msg("MSG-E11", campo=rotulo), campo=campo)


def validar_cartao(numero: str | None, nome: str | None, validade: str | None, cvv: str | None,
                   hoje: date | None = None) -> str:
    """Valida os campos do T07 e devolve só os 4 últimos dígitos (o resto é descartado)."""
    hoje = hoje or date.today()
    numero = re.sub(r"[\s.-]", "", numero or "")
    if not re.fullmatch(r"\d{16}", numero):
        raise _erro_cartao("numero", "número do cartão (16 dígitos)")
    if not (nome or "").strip() or len(nome.strip()) > 60:
        raise _erro_cartao("nome", "nome impresso no cartão")
    combinacao = re.fullmatch(r"(\d{2})/(\d{2})", (validade or "").strip())
    if not combinacao or not 1 <= int(combinacao.group(1)) <= 12:
        raise _erro_cartao("validade", "validade (MM/AA)")
    mes, ano = int(combinacao.group(1)), 2000 + int(combinacao.group(2))
    if (ano, mes) < (hoje.year, hoje.month):  # vale até o último dia do mês
        raise _erro_cartao("validade", "validade (cartão vencido)")
    if not re.fullmatch(r"\d{3}", (cvv or "").strip()):
        raise _erro_cartao("cvv", "CVV (3 dígitos)")
    return numero[-4:]


def simular(metodo: str, final_cartao: str | None) -> str:
    """RN-11: cartão com final 0000 é recusado; os demais são aprovados; PIX é aprovado."""
    if metodo == MetodoPagamento.PIX:
        return StatusPagamento.APROVADO
    return StatusPagamento.RECUSADO if final_cartao == "0000" else StatusPagamento.APROVADO
