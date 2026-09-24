"""US06 – cadastro, login, logout e perfil."""

NOVO = {"nome": "Ana Costa", "email": "ana@example.com", "telefone": "(11) 98765-4321",
        "senha": "abc12345", "confirmacao_senha": "abc12345"}


def test_cadastro_com_sucesso_ja_faz_login(anonimo, db):
    r = anonimo.post("/api/auth/register", json=NOVO)
    assert r.status_code == 201
    corpo = r.json()
    assert corpo["codigo"] == "MSG-S05" and corpo["usuario"]["perfil"] == "CLIENTE"
    assert corpo["usuario"]["telefone"] == "11987654321"
    assert anonimo.get("/api/auth/me").json()["email"] == "ana@example.com"


def test_senha_gravada_como_hash(anonimo, db):
    from sqlalchemy import select
    from app.models import Usuario
    anonimo.post("/api/auth/register", json=NOVO)
    usuario = db.scalar(select(Usuario).where(Usuario.email == "ana@example.com"))
    assert usuario.senha_hash != "abc12345" and usuario.senha_hash.startswith("$2b$")


def test_cadastro_publico_nunca_cria_admin_rn22(anonimo):
    r = anonimo.post("/api/auth/register", json={**NOVO, "perfil": "ADMIN"})
    assert r.json()["usuario"]["perfil"] == "CLIENTE"


def test_email_duplicado_msg_e02(anonimo):
    r = anonimo.post("/api/auth/register", json={**NOVO, "email": "MARIA@example.com"})
    assert r.status_code == 409
    assert r.json()["codigo"] == "MSG-E02" and r.json()["campo"] == "email"


def test_senha_fraca_msg_e03(anonimo):
    r = anonimo.post("/api/auth/register", json={**NOVO, "senha": "abcdefgh", "confirmacao_senha": "abcdefgh"})
    assert r.status_code == 422
    assert r.json()["erros"][0] == {"campo": "senha",
                                    "mensagem": "A senha deve ter pelo menos 8 caracteres, com letras e números."}


def test_senhas_diferentes_msg_e19(anonimo):
    r = anonimo.post("/api/auth/register", json={**NOVO, "confirmacao_senha": "abc123456"})
    assert r.status_code == 422 and r.json()["codigo"] == "MSG-E19"


def test_campos_obrigatorios_e_email_invalido(anonimo):
    r = anonimo.post("/api/auth/register", json={"nome": " ", "email": "sem-arroba", "senha": "", "confirmacao_senha": ""})
    assert r.status_code == 422
    erros = {e["campo"]: e["mensagem"] for e in r.json()["erros"]}
    assert erros["nome"] == "Preencha este campo."
    assert erros["senha"] == "Preencha este campo."
    assert "e-mail válido" in erros["email"]


def test_login_com_sucesso(anonimo):
    r = anonimo.post("/api/auth/login", json={"email": "maria@example.com", "senha": "Cliente2026"})
    assert r.status_code == 200 and r.json()["usuario"]["nome"] == "Maria Oliveira"
    assert "cupcakes_sessao" in r.cookies


def test_login_senha_errada_msg_e01(anonimo):
    r = anonimo.post("/api/auth/login", json={"email": "maria@example.com", "senha": "Errada2026"})
    assert r.status_code == 401 and r.json()["detail"] == "E-mail ou senha incorretos."


def test_login_conta_inexistente_mesma_mensagem(anonimo):
    r = anonimo.post("/api/auth/login", json={"email": "ninguem@example.com", "senha": "Cliente2026"})
    assert r.status_code == 401 and r.json()["codigo"] == "MSG-E01"


def test_login_email_vazio(anonimo):
    r = anonimo.post("/api/auth/login", json={"email": "", "senha": "x"})
    assert r.status_code == 422 and r.json()["erros"][0]["campo"] == "email"


def test_logout_encerra_sessao(maria):
    assert maria.post("/api/auth/logout").json()["codigo"] == "MSG-S06"
    assert maria.get("/api/auth/me").json() is None
    assert maria.get("/api/pedidos").status_code == 401


def test_rota_protegida_sem_login_msg_i06(anonimo):
    r = anonimo.get("/api/pedidos")
    assert r.status_code == 401 and r.json()["codigo"] == "MSG-I06"


def test_editar_nome_e_telefone(maria):
    r = maria.put("/api/conta", json={"nome": "Maria O. Silva", "telefone": "11 91234-5678"})
    assert r.status_code == 200
    assert r.json()["usuario"]["nome"] == "Maria O. Silva" and r.json()["usuario"]["telefone"] == "11912345678"


def test_editar_perfil_nome_vazio(maria):
    r = maria.put("/api/conta", json={"nome": "", "telefone": None})
    assert r.status_code == 422 and r.json()["detail"] == "Preencha este campo."


def test_cookie_de_sessao_adulterado_nao_autentica(anonimo):
    anonimo.cookies.set("cupcakes_sessao", "eyJ1aWQiOiAxfQ==.falso.assinatura")
    assert anonimo.get("/api/auth/me").json() is None
