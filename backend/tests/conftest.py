"""Configuração dos testes automatizados.

Os testes rodam contra um banco MySQL SEPARADO (TEST_DB_NAME, padrão
cupcakes_gourmet_test), criado com o mesmo script database/01_schema_mysql.sql
da Situação 1. Antes de cada teste todas as tabelas desse banco são esvaziadas
e recebem um conjunto pequeno de dados conhecidos. O banco principal
(DB_NAME) nunca é tocado.
"""
import re
from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
from app.database.connection import get_db
from app.main import app
from app.models import Categoria, Cupom, Produto, Usuario
from app.security.password import gerar_hash

if settings.test_db_name == settings.db_name:
    raise RuntimeError("TEST_DB_NAME precisa ser diferente de DB_NAME: os testes apagam os dados do banco de teste.")

TABELAS = ["notificacao", "avaliacao", "pagamento", "item_pedido", "pedido",
           "endereco", "produto", "categoria", "cupom", "usuario"]

SENHA_CLIENTE = "Cliente2026"
SENHA_ADMIN = "Admin2026"


def _comandos_do_schema(nome_banco: str) -> list[str]:
    sql = settings.schema_sql.read_text(encoding="utf-8")
    sql = "\n".join(re.sub(r"--.*$", "", linha) for linha in sql.splitlines())
    sql = sql.replace("cupcakes_gourmet", nome_banco)
    return [c.strip() for c in sql.split(";") if c.strip()]


def _criar_banco_de_teste() -> None:
    servidor = create_engine(settings.database_url("").replace("/?", "?"))
    comandos = _comandos_do_schema(settings.test_db_name)
    with servidor.begin() as conn:
        conn.execute(text(comandos[0]))  # CREATE DATABASE IF NOT EXISTS
        conn.execute(text(f"USE `{settings.test_db_name}`"))
        existentes = {r[0] for r in conn.execute(text("SHOW TABLES"))}
        if set(TABELAS) <= existentes:
            return
        for comando in comandos[2:]:  # pula CREATE DATABASE e USE
            conn.execute(text(comando))
    servidor.dispose()


@pytest.fixture(scope="session")
def engine():
    _criar_banco_de_teste()
    eng = create_engine(settings.database_url(settings.test_db_name), pool_pre_ping=True)
    yield eng
    eng.dispose()


@pytest.fixture(scope="session")
def hashes():
    return {"cliente": gerar_hash(SENHA_CLIENTE), "admin": gerar_hash(SENHA_ADMIN)}


@pytest.fixture()
def db_session_factory(engine):
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(autouse=True)
def dados(engine, db_session_factory, hashes):
    """Esvazia o banco de teste e insere os dados base de cada teste."""
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        for tabela in TABELAS:
            conn.execute(text(f"TRUNCATE TABLE {tabela}"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

    db = db_session_factory()
    classicos, frutados = Categoria(nome="Clássicos"), Categoria(nome="Frutados")
    db.add_all([classicos, frutados])
    db.flush()
    produtos = {
        "red": Produto(categoria=classicos, nome="Red Velvet", descricao="Massa aveludada.",
                       ingredientes="Farinha, cacau.", alergenos="Leite, ovos e trigo.", preco=Decimal("12.50"),
                       imagem_url="assets/images/produtos/red-velvet.svg", quantidade_estoque=8),
        "choc": Produto(categoria=classicos, nome="Chocolate Belga", descricao="Ganache.",
                        ingredientes="Cacau.", alergenos="Leite.", preco=Decimal("14.00"),
                        imagem_url="assets/images/produtos/chocolate-belga.svg", quantidade_estoque=12),
        "baunilha": Produto(categoria=classicos, nome="Baunilha Clássico", descricao="Buttercream.",
                            ingredientes="Farinha de arroz.", alergenos="Leite e ovos.", preco=Decimal("10.00"),
                            imagem_url="b.svg", sem_gluten=True, quantidade_estoque=0),
        "limao": Produto(categoria=frutados, nome="Limão Siciliano", descricao="Cítrico.",
                         ingredientes="Limão.", alergenos="Trigo.", preco=Decimal("13.00"),
                         imagem_url="l.svg", vegano=True, quantidade_estoque=5),
        "frutas": Produto(categoria=frutados, nome="Frutas Vermelhas", descricao="Geleia.",
                          ingredientes="Frutas.", alergenos="Não contém alérgenos declarados",
                          preco=Decimal("13.50"), imagem_url="f.svg", vegano=True, sem_gluten=True,
                          quantidade_estoque=9),
        "pistache": Produto(categoria=classicos, nome="Pistache Especial", descricao="Pistache.",
                            ingredientes="Pistache.", alergenos="Pistache.", preco=Decimal("16.00"),
                            imagem_url="p.svg", quantidade_estoque=3, ativo=False),
    }
    db.add_all(produtos.values())
    hoje = date.today()
    db.add_all([
        Cupom(codigo="BEMVINDO10", tipo="PERCENTUAL", valor=Decimal("10"), data_validade=hoje + timedelta(days=30)),
        Cupom(codigo="DOCE5", tipo="VALOR_FIXO", valor=Decimal("5"), data_validade=hoje),
        Cupom(codigo="GRANDE50", tipo="VALOR_FIXO", valor=Decimal("50"), data_validade=hoje + timedelta(days=1)),
        Cupom(codigo="NATAL2025", tipo="PERCENTUAL", valor=Decimal("15"), data_validade=hoje - timedelta(days=1)),
        Cupom(codigo="PAUSADO20", tipo="PERCENTUAL", valor=Decimal("20"),
              data_validade=hoje + timedelta(days=30), ativo=False),
        Usuario(nome="Maria Oliveira", email="maria@example.com", senha_hash=hashes["cliente"], perfil="CLIENTE"),
        Usuario(nome="João Pereira", email="joao@example.com", senha_hash=hashes["cliente"], perfil="CLIENTE"),
        Usuario(nome="Administrador", email="admin@example.com", senha_hash=hashes["admin"], perfil="ADMIN"),
    ])
    db.commit()
    ids = {chave: p.id_produto for chave, p in produtos.items()}
    ids["cat_classicos"], ids["cat_frutados"] = classicos.id_categoria, frutados.id_categoria
    db.close()
    return ids


@pytest.fixture()
def db(db_session_factory):
    sessao = db_session_factory()
    yield sessao
    sessao.close()


@pytest.fixture(autouse=True)
def _usar_banco_de_teste(db_session_factory):
    def get_db_teste():
        sessao = db_session_factory()
        try:
            yield sessao
        finally:
            sessao.close()

    app.dependency_overrides[get_db] = get_db_teste
    yield
    app.dependency_overrides.clear()


def _cliente_http(email: str | None = None, senha: str | None = None) -> TestClient:
    client = TestClient(app, raise_server_exceptions=False)
    if email:
        resposta = client.post("/api/auth/login", json={"email": email, "senha": senha})
        assert resposta.status_code == 200, resposta.text
    return client


@pytest.fixture()
def anonimo():
    return _cliente_http()


@pytest.fixture()
def maria():
    return _cliente_http("maria@example.com", SENHA_CLIENTE)


@pytest.fixture()
def joao():
    return _cliente_http("joao@example.com", SENHA_CLIENTE)


@pytest.fixture()
def admin():
    return _cliente_http("admin@example.com", SENHA_ADMIN)


ENDERECO = {"apelido": "Casa", "cep": "01415-000", "logradouro": "Rua das Flores", "numero": "123",
            "complemento": "apto 12", "bairro": "Jardim Paulista", "cidade": "São Paulo", "uf": "SP"}
CARTAO_OK = {"numero": "4111111111111111", "nome": "MARIA OLIVEIRA", "validade": "12/30", "cvv": "123"}
CARTAO_RECUSADO = {**CARTAO_OK, "numero": "4111111111110000"}


@pytest.fixture()
def endereco_maria(maria):
    resposta = maria.post("/api/enderecos", json=ENDERECO)
    assert resposta.status_code == 201, resposta.text
    return resposta.json()["endereco"]["id_endereco"]


@pytest.fixture()
def pedido_pago(maria, endereco_maria, dados):
    """Pedido de Maria já pago (RECEBIDO): 2x Red Velvet + 1x Chocolate Belga."""
    maria.post("/api/carrinho/itens", json={"id_produto": dados["red"], "quantidade": 2})
    maria.post("/api/carrinho/itens", json={"id_produto": dados["choc"], "quantidade": 1})
    pedido = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).json()["pedido"]
    resposta = maria.post("/api/pagamentos", json={"id_pedido": pedido["id_pedido"], "metodo": "PIX"})
    assert resposta.status_code == 200, resposta.text
    return resposta.json()["pedido"]
