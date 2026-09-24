"""Testes unitários das regras de negócio puras (sem banco) – RNF-14."""
from datetime import date
from decimal import Decimal

import pytest

from app.models import Cupom, Endereco, Produto
from app.security.password import gerar_hash, senha_valida, verificar_senha
from app.services.pagamento_service import simular, validar_cartao
from app.services.pedido_service import transicao_admin_permitida
from app.utils.erros import AppError
from app.utils.formatos import reais


@pytest.mark.parametrize("senha,esperado", [
    ("abc12345", True), ("Senha2026", True), ("abcdefgh", False), ("12345678", False), ("abc123", False), ("", False),
])
def test_regra_de_senha_rn06(senha, esperado):
    assert senha_valida(senha) is esperado


def test_hash_de_senha_nao_guarda_texto_puro():
    h = gerar_hash("abc12345")
    assert h != "abc12345" and h.startswith("$2b$")
    assert verificar_senha("abc12345", h)
    assert not verificar_senha("abc12346", h)


def test_cupom_percentual_calcula_10_por_cento():
    cupom = Cupom(codigo="X", tipo="PERCENTUAL", valor=Decimal("10"), data_validade=date(2030, 1, 1), ativo=True)
    assert cupom.calcular_desconto(Decimal("39.00")) == Decimal("3.90")


def test_desconto_nunca_passa_do_subtotal_rn09():
    cupom = Cupom(codigo="X", tipo="VALOR_FIXO", valor=Decimal("50"), data_validade=date(2030, 1, 1), ativo=True)
    assert cupom.calcular_desconto(Decimal("12.50")) == Decimal("12.50")


def test_cupom_valido_ate_o_ultimo_dia():
    cupom = Cupom(codigo="X", tipo="VALOR_FIXO", valor=Decimal("5"), data_validade=date(2026, 9, 24), ativo=True)
    assert cupom.esta_valido(date(2026, 9, 24))
    assert not cupom.esta_valido(date(2026, 9, 25))


def test_produto_disponivel_depende_de_ativo_e_estoque():
    p = Produto(ativo=True, quantidade_estoque=2)
    assert p.esta_disponivel(2) and not p.esta_disponivel(3)
    p.ativo = False
    assert not p.esta_disponivel(1)


@pytest.mark.parametrize("atual,novo,permitido", [
    ("RECEBIDO", "EM_PREPARO", True), ("EM_PREPARO", "SAIU_PARA_ENTREGA", True),
    ("SAIU_PARA_ENTREGA", "ENTREGUE", True), ("RECEBIDO", "CANCELADO", True), ("EM_PREPARO", "CANCELADO", True),
    ("RECEBIDO", "ENTREGUE", False), ("SAIU_PARA_ENTREGA", "CANCELADO", False),
    ("AGUARDANDO_PAGAMENTO", "RECEBIDO", False), ("ENTREGUE", "CANCELADO", False), ("CANCELADO", "RECEBIDO", False),
])
def test_transicoes_de_status_do_admin_est01(atual, novo, permitido):
    assert transicao_admin_permitida(atual, novo) is permitido


def test_pagamento_simulado_rn11():
    assert simular("CREDITO", "1111") == "APROVADO"
    assert simular("DEBITO", "0000") == "RECUSADO"
    assert simular("PIX", None) == "APROVADO"


def test_validacao_do_cartao_devolve_so_o_final():
    assert validar_cartao("4111 1111 1111 1234", "Maria", "12/30", "123", date(2026, 9, 24)) == "1234"


@pytest.mark.parametrize("numero,nome,validade,cvv,campo", [
    ("411111111111", "Maria", "12/30", "123", "numero"),
    ("4111111111111111", "", "12/30", "123", "nome"),
    ("4111111111111111", "Maria", "13/30", "123", "validade"),
    ("4111111111111111", "Maria", "08/26", "123", "validade"),
    ("4111111111111111", "Maria", "12/30", "12", "cvv"),
])
def test_cartao_invalido_msg_e11(numero, nome, validade, cvv, campo):
    with pytest.raises(AppError) as erro:
        validar_cartao(numero, nome, validade, cvv, date(2026, 9, 24))
    assert erro.value.codigo == "MSG-E11" and erro.value.campo == campo


def test_cartao_do_mes_atual_ainda_vale():
    assert validar_cartao("4111111111111111", "Maria", "09/26", "123", date(2026, 9, 30)) == "1111"


def test_endereco_formatado_para_o_pedido():
    e = Endereco(apelido="Casa", cep="01415000", logradouro="Rua das Flores", numero="123",
                 complemento="apto 12", bairro="Jardim Paulista", cidade="São Paulo", uf="SP")
    assert e.formatar_texto() == "Casa – Rua das Flores, 123, apto 12 – Jardim Paulista – São Paulo – SP – 01415-000"


def test_formato_de_moeda_brasileiro():
    assert reais(Decimal("1234.5")) == "1.234,50"
    assert reais(Decimal("3.9")) == "3,90"
