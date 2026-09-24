"""US05 e US09 – carrinho e cupom."""


def adicionar(client, id_produto, quantidade=1):
    return client.post("/api/carrinho/itens", json={"id_produto": id_produto, "quantidade": quantidade})


def test_adicionar_item_sem_login_rn07(anonimo, dados):
    r = adicionar(anonimo, dados["red"], 2)
    assert r.status_code == 200 and r.json()["codigo"] == "MSG-S01"
    c = r.json()["carrinho"]
    assert c["subtotal"] == "25.00" and c["taxa_entrega"] == "8.00" and c["total"] == "33.00"


def test_adicionar_mesmo_produto_soma_quantidade(anonimo, dados):
    adicionar(anonimo, dados["red"], 2)
    c = adicionar(anonimo, dados["red"], 3).json()["carrinho"]
    assert len(c["itens"]) == 1 and c["itens"][0]["quantidade"] == 5


def test_nao_passa_do_estoque_msg_e06(anonimo, dados):
    adicionar(anonimo, dados["red"], 5)
    r = adicionar(anonimo, dados["red"], 4)
    assert r.status_code == 409 and r.json()["detail"] == "Só temos 8 unidades deste cupcake no momento."
    assert anonimo.get("/api/carrinho").json()["carrinho"]["itens"][0]["quantidade"] == 5


def test_produto_sem_estoque_nao_entra_rn02(anonimo, dados):
    assert adicionar(anonimo, dados["baunilha"]).status_code == 409


def test_produto_inativo_nao_entra(anonimo, dados):
    assert adicionar(anonimo, dados["pistache"]).json()["codigo"] == "MSG-E15"


def test_quantidade_invalida(anonimo, dados):
    r = adicionar(anonimo, dados["red"], 0)
    assert r.status_code == 422 and r.json()["erros"][0]["mensagem"] == "O valor mínimo é 1."
    adicionar(anonimo, dados["red"], 1)
    assert anonimo.put(f"/api/carrinho/itens/{dados['red']}", json={"quantidade": -2}).status_code == 422
    assert anonimo.put(f"/api/carrinho/itens/{dados['red']}", json={"quantidade": "abc"}).status_code == 422


def test_alterar_quantidade_e_recalcular(anonimo, dados):
    adicionar(anonimo, dados["red"])
    c = anonimo.put(f"/api/carrinho/itens/{dados['red']}", json={"quantidade": 3}).json()["carrinho"]
    assert c["itens"][0]["subtotal"] == "37.50" and c["total"] == "45.50"


def test_alterar_acima_do_estoque_mantem_anterior(anonimo, dados):
    adicionar(anonimo, dados["limao"], 2)
    r = anonimo.put(f"/api/carrinho/itens/{dados['limao']}", json={"quantidade": 6})
    assert r.status_code == 409 and r.json()["codigo"] == "MSG-E06"
    assert anonimo.get("/api/carrinho").json()["carrinho"]["itens"][0]["quantidade"] == 2


def test_remover_item_msg_s02(anonimo, dados):
    adicionar(anonimo, dados["red"])
    r = anonimo.delete(f"/api/carrinho/itens/{dados['red']}")
    assert r.json()["codigo"] == "MSG-S02"
    c = r.json()["carrinho"]
    assert c["vazio"] is True and c["pode_finalizar"] is False and c["total"] == "0.00"


def test_remover_item_que_nao_esta_no_carrinho(anonimo, dados):
    assert anonimo.delete(f"/api/carrinho/itens/{dados['red']}").status_code == 404


def test_carrinho_continua_depois_do_login_us05_ca6(anonimo, dados):
    adicionar(anonimo, dados["red"], 2)
    anonimo.post("/api/auth/login", json={"email": "maria@example.com", "senha": "Cliente2026"})
    assert anonimo.get("/api/carrinho").json()["carrinho"]["quantidade_itens"] == 2


def test_item_que_ficou_indisponivel_bloqueia_finalizacao(anonimo, dados, db):
    from app.models import Produto
    adicionar(anonimo, dados["red"], 2)
    db.get(Produto, dados["red"]).quantidade_estoque = 0
    db.commit()
    c = anonimo.get("/api/carrinho").json()["carrinho"]
    assert c["itens"][0]["disponivel"] is False and c["pode_finalizar"] is False
    assert c["aviso"].startswith("Alguns itens do carrinho mudaram")


def test_mudanca_de_preco_e_avisada_msg_e07(anonimo, dados, db):
    from decimal import Decimal
    from app.models import Produto
    adicionar(anonimo, dados["red"])
    db.get(Produto, dados["red"]).preco = Decimal("13.00")
    db.commit()
    c = anonimo.get("/api/carrinho").json()["carrinho"]
    assert c["itens"][0]["preco_alterado"] is True and c["subtotal"] == "13.00" and c["aviso"]
    assert anonimo.get("/api/carrinho").json()["carrinho"]["aviso"] is None  # avisado uma vez


def test_cupom_sem_login_msg_e09(anonimo, dados):
    adicionar(anonimo, dados["red"])
    r = anonimo.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"})
    assert r.status_code == 401 and r.json()["codigo"] == "MSG-E09"


def test_cupom_valido_msg_s04(maria, dados):
    adicionar(maria, dados["red"], 2)
    adicionar(maria, dados["choc"], 1)
    r = maria.post("/api/carrinho/cupom", json={"codigo": " bemvindo10 "})
    assert r.json()["mensagem"] == "Cupom aplicado! Você economizou R$ 3,90."
    c = r.json()["carrinho"]
    assert (c["subtotal"], c["desconto"], c["taxa_entrega"], c["total"]) == ("39.00", "3.90", "8.00", "43.10")


def test_cupom_nao_desconta_a_taxa_de_entrega(maria, dados):
    adicionar(maria, dados["red"])
    c = maria.post("/api/carrinho/cupom", json={"codigo": "GRANDE50"}).json()["carrinho"]
    assert c["desconto"] == "12.50" and c["total"] == "8.00"


def test_cupons_invalidos_msg_e08_com_motivo(maria, dados):
    adicionar(maria, dados["red"])
    motivos = {codigo: maria.post("/api/carrinho/cupom", json={"codigo": codigo}).json()["detail"]
               for codigo in ["NAOEXISTE", "PAUSADO20", "NATAL2025"]}
    assert motivos == {"NAOEXISTE": "Cupom inválido: não encontrado.", "PAUSADO20": "Cupom inválido: inativo.",
                       "NATAL2025": "Cupom inválido: vencido."}


def test_cupom_valido_no_ultimo_dia(maria, dados):
    adicionar(maria, dados["red"])
    assert maria.post("/api/carrinho/cupom", json={"codigo": "DOCE5"}).status_code == 200


def test_outro_cupom_substitui_o_anterior(maria, dados):
    adicionar(maria, dados["red"], 2)
    maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"})
    c = maria.post("/api/carrinho/cupom", json={"codigo": "DOCE5"}).json()["carrinho"]
    assert c["cupom"]["codigo"] == "DOCE5" and c["desconto"] == "5.00"


def test_remover_cupom(maria, dados):
    adicionar(maria, dados["red"])
    maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"})
    c = maria.delete("/api/carrinho/cupom").json()["carrinho"]
    assert c["cupom"] is None and c["desconto"] == "0.00"


def test_cupom_com_carrinho_vazio(maria):
    assert maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"}).status_code == 422


def test_cupom_vazio_obrigatorio(maria):
    r = maria.post("/api/carrinho/cupom", json={"codigo": ""})
    assert r.status_code == 422 and r.json()["detail"] == "Preencha este campo."
