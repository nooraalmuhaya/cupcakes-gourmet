"""Verifica que o banco MySQL da Situação 1 aplica as restrições (CHECK, UNIQUE, FK)."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError


def executar(db, sql, **params):
    try:
        db.execute(text(sql), params)
        db.commit()
    finally:
        db.rollback()


def test_saude_da_api_e_das_tabelas(anonimo):
    r = anonimo.get("/api/saude").json()
    assert r["banco"] == "ok" and r["mysql"].startswith("8.") and r["tabelas_faltando"] == []


def test_collation_ignora_acentos(db):
    assert db.execute(text("SELECT 'Limão' = 'limao'")).scalar() == 1


@pytest.mark.parametrize("sql", [
    "UPDATE produto SET quantidade_estoque = -1",                         # ck_produto_estoque
    "UPDATE produto SET preco = 0",                                        # ck_produto_preco
    "UPDATE usuario SET perfil = 'GERENTE'",                               # ck_usuario_perfil
    "UPDATE cupom SET valor = 150 WHERE tipo = 'PERCENTUAL'",              # ck_cupom_percentual
])
def test_check_constraints(db, sql):
    with pytest.raises(OperationalError):
        executar(db, sql)


def test_email_unico(db):
    with pytest.raises(IntegrityError):
        executar(db, "INSERT INTO usuario (nome, email, senha_hash) VALUES ('X', 'maria@example.com', 'h')")


def test_total_do_pedido_consistente(db, pedido_pago):
    with pytest.raises(OperationalError):
        executar(db, "UPDATE pedido SET valor_total = valor_total + 1")


def test_status_invalido(db, pedido_pago):
    with pytest.raises(OperationalError):
        executar(db, "UPDATE pedido SET status = 'PROXIMO_AO_DESTINO'")


def test_produto_vendido_nao_pode_ser_apagado_rn23(db, pedido_pago, dados):
    with pytest.raises(IntegrityError):
        executar(db, "DELETE FROM produto WHERE id_produto = :id", id=dados["red"])


def test_uma_avaliacao_por_pedido(db, pedido_pago):
    executar(db, "INSERT INTO avaliacao (id_pedido, nota) VALUES (:id, 5)", id=pedido_pago["id_pedido"])
    with pytest.raises(IntegrityError):
        executar(db, "INSERT INTO avaliacao (id_pedido, nota) VALUES (:id, 4)", id=pedido_pago["id_pedido"])
