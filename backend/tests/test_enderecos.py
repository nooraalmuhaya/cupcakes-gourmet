"""US14 – endereços (RN-08)."""
from tests.conftest import ENDERECO


def test_primeiro_endereco_vira_padrao_msg_s03(maria):
    r = maria.post("/api/enderecos", json=ENDERECO)
    assert r.status_code == 201 and r.json()["codigo"] == "MSG-S03"
    assert r.json()["endereco"]["padrao"] is True and r.json()["endereco"]["cep"] == "01415000"


def test_cep_invalido_msg_e04_e_obrigatorio_msg_e05(maria):
    r = maria.post("/api/enderecos", json={**ENDERECO, "cep": "0123-45", "logradouro": ""})
    erros = {e["campo"]: e["mensagem"] for e in r.json()["erros"]}
    assert r.status_code == 422
    assert erros == {"cep": "CEP inválido. Digite os 8 números do CEP.", "logradouro": "Preencha este campo."}


def test_uf_invalida(maria):
    assert maria.post("/api/enderecos", json={**ENDERECO, "uf": "XX"}).status_code == 422


def test_limite_de_cinco_enderecos_msg_e16(maria):
    for i in range(5):
        assert maria.post("/api/enderecos", json={**ENDERECO, "apelido": f"E{i}"}).status_code == 201
    r = maria.post("/api/enderecos", json=ENDERECO)
    assert r.status_code == 409 and r.json()["codigo"] == "MSG-E16"


def test_tornar_padrao_deixa_so_um(maria):
    maria.post("/api/enderecos", json=ENDERECO)
    segundo = maria.post("/api/enderecos", json={**ENDERECO, "apelido": "Trabalho"}).json()["endereco"]
    maria.put(f"/api/enderecos/{segundo['id_endereco']}/padrao")
    lista = maria.get("/api/enderecos").json()
    assert [(e["apelido"], e["padrao"]) for e in lista] == [("Trabalho", True), ("Casa", False)]


def test_excluir_padrao_passa_para_o_mais_antigo(maria):
    ids = [maria.post("/api/enderecos", json={**ENDERECO, "apelido": n}).json()["endereco"]["id_endereco"]
           for n in ["A", "B", "C"]]
    maria.put(f"/api/enderecos/{ids[2]}/padrao")
    maria.delete(f"/api/enderecos/{ids[2]}")
    assert [(e["apelido"], e["padrao"]) for e in maria.get("/api/enderecos").json()] == [("A", True), ("B", False)]


def test_editar_endereco(maria, endereco_maria):
    r = maria.put(f"/api/enderecos/{endereco_maria}", json={**ENDERECO, "numero": "S/N", "complemento": ""})
    assert r.json()["endereco"]["numero"] == "S/N" and r.json()["endereco"]["complemento"] is None


def test_cliente_nao_mexe_no_endereco_de_outro_rnf08(joao, endereco_maria):
    assert joao.put(f"/api/enderecos/{endereco_maria}", json=ENDERECO).json()["codigo"] == "MSG-E13"
    assert joao.delete(f"/api/enderecos/{endereco_maria}").status_code == 403
    assert joao.get("/api/enderecos").json() == []


def test_endereco_exige_login(anonimo):
    assert anonimo.get("/api/enderecos").status_code == 401


def test_admin_nao_tem_enderecos_rn22(admin):
    assert admin.post("/api/enderecos", json=ENDERECO).status_code == 403
