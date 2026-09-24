"""US07, US08, US10, US11, US12, US13 – checkout, pagamento, acompanhamento, histórico, avaliação, notificações."""
import re

from sqlalchemy import select

from tests.conftest import CARTAO_OK, CARTAO_RECUSADO
from app.models import Pagamento, Pedido, Produto


def preparar(client, dados, endereco, metodo="CREDITO"):
    client.post("/api/carrinho/itens", json={"id_produto": dados["red"], "quantidade": 2})
    client.post("/api/carrinho/itens", json={"id_produto": dados["choc"], "quantidade": 1})
    r = client.post("/api/pedidos", json={"id_endereco": endereco, "metodo": metodo})
    assert r.status_code == 201, r.text
    return r.json()["pedido"]


def estoque(db, id_produto):
    db.rollback()
    return db.get(Produto, id_produto).quantidade_estoque


# ----------------------------------------------------------------- criação do pedido

def test_criar_pedido_aguardando_pagamento(maria, dados, endereco_maria, db):
    maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"})  # sem itens: ignorado
    p = preparar(maria, dados, endereco_maria)
    assert re.fullmatch(r"CUP-\d{8}-0001", p["numero_pedido"])
    assert p["status"] == "AGUARDANDO_PAGAMENTO" and p["pagamento"]["status"] == "PENDENTE"
    assert p["valor_total"] == "47.00" and p["endereco_entrega"].startswith("Casa – Rua das Flores, 123")
    assert estoque(db, dados["red"]) == 8  # RN-12: estoque só baixa na aprovação


def test_pedido_com_cupom_grava_valores(maria, dados, endereco_maria, db):
    maria.post("/api/carrinho/itens", json={"id_produto": dados["red"], "quantidade": 2})
    maria.post("/api/carrinho/itens", json={"id_produto": dados["choc"], "quantidade": 1})
    maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"})
    p = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).json()["pedido"]
    assert (p["subtotal"], p["valor_desconto"], p["taxa_entrega"], p["valor_total"], p["cupom"]) == \
        ("39.00", "3.90", "8.00", "43.10", "BEMVINDO10")


def test_numero_sequencial_no_mesmo_dia(maria, dados, endereco_maria):
    p1 = preparar(maria, dados, endereco_maria)
    maria.post(f"/api/pedidos/{p1['id_pedido']}/cancelar")
    p2 = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).json()["pedido"]
    assert p2["numero_pedido"].endswith("-0002")


def test_checkout_com_carrinho_vazio(maria, endereco_maria):
    r = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"})
    assert r.status_code == 422 and r.json()["codigo"] == "MSG-I03"


def test_checkout_sem_endereco(maria, dados):
    maria.post("/api/carrinho/itens", json={"id_produto": dados["red"]})
    r = maria.post("/api/pedidos", json={"metodo": "PIX"})
    assert r.status_code == 422 and r.json()["detail"] == "Escolha um endereço de entrega."


def test_checkout_com_endereco_de_outro_cliente(joao, dados, endereco_maria):
    joao.post("/api/carrinho/itens", json={"id_produto": dados["red"]})
    assert joao.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).status_code == 403


def test_checkout_sem_login(anonimo, dados):
    anonimo.post("/api/carrinho/itens", json={"id_produto": dados["red"]})
    assert anonimo.post("/api/pedidos", json={"id_endereco": 1, "metodo": "PIX"}).status_code == 401


def test_checkout_metodo_invalido(maria, endereco_maria):
    r = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "BOLETO"})
    assert r.status_code == 422 and r.json()["campo"] == "metodo"


def test_checkout_revalida_estoque_msg_e07(maria, dados, endereco_maria, db):
    maria.post("/api/carrinho/itens", json={"id_produto": dados["red"], "quantidade": 3})
    db.get(Produto, dados["red"]).quantidade_estoque = 1
    db.commit()
    r = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"})
    assert r.status_code == 409 and r.json()["codigo"] == "MSG-E07"
    assert db.scalar(select(Pedido)) is None


def test_checkout_revalida_preco_msg_e07(maria, dados, endereco_maria, db):
    from decimal import Decimal
    maria.post("/api/carrinho/itens", json={"id_produto": dados["red"]})
    db.get(Produto, dados["red"]).preco = Decimal("15.00")
    db.commit()
    assert maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).status_code == 409
    # depois de revisar (o preço novo passa a ser o visto), o pedido é criado com o preço atual
    p = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).json()["pedido"]
    assert p["itens"][0]["preco_unitario"] == "15.00"


# ----------------------------------------------------------------- pagamento simulado

def test_pagamento_aprovado_confirma_pedido(maria, dados, endereco_maria, db):
    p = preparar(maria, dados, endereco_maria)
    r = maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "CREDITO", "cartao": CARTAO_OK})
    assert r.status_code == 200
    pedido = r.json()["pedido"]
    assert pedido["status"] == "RECEBIDO" and pedido["pagamento"]["status"] == "APROVADO"
    assert pedido["pagamento"]["data_pagamento"] is not None
    assert estoque(db, dados["red"]) == 6 and estoque(db, dados["choc"]) == 11      # RN-12
    assert maria.get("/api/sessao").json()["carrinho_quantidade"] == 0                # RF-18
    assert maria.get("/api/notificacoes").json()[0]["mensagem"] == "Recebemos seu pedido."  # RN-16


def test_pagamento_recusado_final_0000_msg_e10(maria, dados, endereco_maria, db):
    p = preparar(maria, dados, endereco_maria)
    r = maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "DEBITO",
                                            "cartao": CARTAO_RECUSADO})
    assert r.status_code == 402 and r.json()["codigo"] == "MSG-E10"
    db.rollback()
    assert db.scalar(select(Pagamento)).status == "RECUSADO"
    assert db.get(Pedido, p["id_pedido"]).status == "AGUARDANDO_PAGAMENTO"
    assert estoque(db, dados["red"]) == 8
    assert maria.get("/api/sessao").json()["carrinho_quantidade"] == 3  # carrinho mantido


def test_nova_tentativa_trocando_para_pix(maria, dados, endereco_maria):
    p = preparar(maria, dados, endereco_maria)
    maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "CREDITO", "cartao": CARTAO_RECUSADO})
    r = maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "PIX"})
    assert r.status_code == 200 and r.json()["pedido"]["pagamento"]["metodo"] == "PIX"


def test_dados_de_cartao_invalidos_msg_e11(maria, dados, endereco_maria):
    p = preparar(maria, dados, endereco_maria)
    r = maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "CREDITO",
                                            "cartao": {**CARTAO_OK, "cvv": "1"}})
    assert r.status_code == 422 and r.json()["detail"] == "Confira os dados do cartão: CVV (3 dígitos)."
    r = maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "CREDITO"})
    assert r.status_code == 422 and r.json()["campo"] == "numero"


def test_cartao_nao_e_gravado_rnf07(maria, dados, endereco_maria, db):
    from sqlalchemy import text
    p = preparar(maria, dados, endereco_maria)
    maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "CREDITO", "cartao": CARTAO_OK})
    colunas = [r[0] for r in db.execute(text("SHOW COLUMNS FROM pagamento"))]
    assert colunas == ["id_pagamento", "id_pedido", "metodo", "status", "data_pagamento"]


def test_pagamento_de_pedido_de_outro_cliente(maria, joao, dados, endereco_maria):
    p = preparar(maria, dados, endereco_maria)
    r = joao.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "PIX"})
    assert r.status_code == 403 and r.json()["codigo"] == "MSG-E13"


def test_pagar_pedido_ja_pago(maria, pedido_pago):
    assert maria.post("/api/pagamentos", json={"id_pedido": pedido_pago["id_pedido"], "metodo": "PIX"}).status_code == 409


def test_pagamento_sem_campos_obrigatorios(maria):
    r = maria.post("/api/pagamentos", json={})
    assert r.status_code == 422 and {e["campo"] for e in r.json()["erros"]} == {"id_pedido", "metodo"}


def test_estoque_acabou_antes_do_pagamento(maria, dados, endereco_maria, db):
    p = preparar(maria, dados, endereco_maria)
    db.get(Produto, dados["red"]).quantidade_estoque = 1
    db.commit()
    r = maria.post("/api/pagamentos", json={"id_pedido": p["id_pedido"], "metodo": "PIX"})
    assert r.status_code == 409 and r.json()["codigo"] == "MSG-E07"
    db.rollback()
    assert db.get(Pedido, p["id_pedido"]).status == "AGUARDANDO_PAGAMENTO"
    assert estoque(db, dados["choc"]) == 12  # transação desfeita: nada foi baixado


# ----------------------------------------------------------------- cancelamento pelo cliente

def test_cliente_cancela_pedido_nao_pago_rf19(maria, dados, endereco_maria):
    p = preparar(maria, dados, endereco_maria)
    r = maria.post(f"/api/pedidos/{p['id_pedido']}/cancelar")
    assert r.json()["pedido"]["status"] == "CANCELADO"
    assert maria.get("/api/sessao").json()["carrinho_quantidade"] == 3  # itens continuam no carrinho


def test_cliente_nao_cancela_pedido_pago(maria, pedido_pago):
    assert maria.post(f"/api/pedidos/{pedido_pago['id_pedido']}/cancelar").status_code == 409


def test_cupom_de_pedido_cancelado_pode_ser_usado_de_novo(maria, dados, endereco_maria):
    maria.post("/api/carrinho/itens", json={"id_produto": dados["red"]})
    maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"})
    p = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).json()["pedido"]
    assert maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"}).json()["detail"] == \
        "Cupom inválido: já utilizado."
    maria.post(f"/api/pedidos/{p['id_pedido']}/cancelar")
    assert maria.post("/api/carrinho/cupom", json={"codigo": "BEMVINDO10"}).status_code == 200


# ----------------------------------------------------------------- consulta, histórico e acompanhamento

def test_listar_meus_pedidos(maria, pedido_pago):
    r = maria.get("/api/pedidos").json()
    assert r["total"] == 1 and r["pedidos"][0]["numero_pedido"] == pedido_pago["numero_pedido"]
    assert r["pedidos"][0]["itens_texto"] == "2x Red Velvet · 1x Chocolate Belga"


def test_historico_paginado_10_por_pagina_rn18(maria, dados, endereco_maria):
    for _ in range(11):
        maria.post("/api/carrinho/itens", json={"id_produto": dados["choc"]})
        p = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).json()["pedido"]
        maria.post(f"/api/pedidos/{p['id_pedido']}/cancelar")
        maria.delete(f"/api/carrinho/itens/{dados['choc']}")
    pagina1 = maria.get("/api/pedidos").json()
    assert len(pagina1["pedidos"]) == 10 and pagina1["total_paginas"] == 2
    assert pagina1["pedidos"][0]["numero_pedido"].endswith("-0011")  # mais recente primeiro
    assert len(maria.get("/api/pedidos", params={"pagina": 2}).json()["pedidos"]) == 1


def test_ver_meu_pedido_com_linha_do_tempo(maria, pedido_pago):
    p = maria.get(f"/api/pedidos/{pedido_pago['id_pedido']}").json()["pedido"]
    etapas = [(e["texto"], e["concluida"], e["atual"]) for e in p["linha_do_tempo"]]
    assert etapas[0] == ("Pedido recebido", True, True) and etapas[1] == ("Em preparo", False, False)
    assert p["linha_do_tempo"][0]["data"] is not None


def test_consulta_de_status_para_polling(maria, pedido_pago):
    r = maria.get(f"/api/pedidos/{pedido_pago['id_pedido']}/status").json()
    assert r["status"] == "RECEBIDO" and r["status_texto"] == "Pedido recebido"


def test_cliente_nao_ve_pedido_de_outro_msg_e13(joao, pedido_pago):
    for rota in ["", "/status", "/avaliacao"]:
        r = joao.get(f"/api/pedidos/{pedido_pago['id_pedido']}{rota}")
        assert r.status_code == 403 and r.json()["codigo"] == "MSG-E13"
    assert joao.get("/api/pedidos").json()["total"] == 0


def test_pedido_inexistente(maria):
    assert maria.get("/api/pedidos/99999").status_code == 404


def test_repetir_pedido_rn19(maria, pedido_pago, dados, db):
    db.get(Produto, dados["choc"]).quantidade_estoque = 0
    db.commit()
    r = maria.post(f"/api/pedidos/{pedido_pago['id_pedido']}/repetir").json()
    assert r["mensagem"] == "Itens do pedido adicionados ao carrinho."
    assert r["aviso"] == "Alguns itens não estão disponíveis e não foram adicionados: Chocolate Belga."
    itens = maria.get("/api/carrinho").json()["carrinho"]["itens"]
    assert [(i["nome"], i["quantidade"]) for i in itens] == [("Red Velvet", 2)]


# ----------------------------------------------------------------- avaliação (US12)

def entregar(admin, id_pedido):
    for novo, atual in [("EM_PREPARO", "RECEBIDO"), ("SAIU_PARA_ENTREGA", "EM_PREPARO"),
                        ("ENTREGUE", "SAIU_PARA_ENTREGA")]:
        assert admin.put(f"/api/admin/pedidos/{id_pedido}/status",
                         json={"novo_status": novo, "status_atual": atual}).status_code == 200


def test_avaliar_pedido_entregue_msg_s07(maria, admin, pedido_pago):
    entregar(admin, pedido_pago["id_pedido"])
    r = maria.post(f"/api/pedidos/{pedido_pago['id_pedido']}/avaliacao", json={"nota": 4, "comentario": "Ótimo!"})
    assert r.status_code == 201 and r.json()["codigo"] == "MSG-S07"
    assert maria.get(f"/api/pedidos/{pedido_pago['id_pedido']}/avaliacao").json()["nota"] == 4
    assert admin.get(f"/api/admin/pedidos/{pedido_pago['id_pedido']}").json()["pedido"]["avaliacao"]["comentario"] == "Ótimo!"


def test_nao_avalia_pedido_nao_entregue_msg_e20(maria, pedido_pago):
    r = maria.post(f"/api/pedidos/{pedido_pago['id_pedido']}/avaliacao", json={"nota": 5})
    assert r.status_code == 409 and r.json()["codigo"] == "MSG-E20"


def test_avaliacao_unica_e_nao_editavel_rn17(maria, admin, pedido_pago):
    entregar(admin, pedido_pago["id_pedido"])
    maria.post(f"/api/pedidos/{pedido_pago['id_pedido']}/avaliacao", json={"nota": 5})
    assert maria.post(f"/api/pedidos/{pedido_pago['id_pedido']}/avaliacao", json={"nota": 1}).json()["codigo"] == "MSG-E20"


def test_nota_obrigatoria_msg_e12_e_comentario_limite(maria, admin, pedido_pago):
    entregar(admin, pedido_pago["id_pedido"])
    rota = f"/api/pedidos/{pedido_pago['id_pedido']}/avaliacao"
    assert maria.post(rota, json={}).json()["detail"] == "Escolha uma nota de 1 a 5 estrelas."
    assert maria.post(rota, json={"nota": 6}).status_code == 422
    assert maria.post(rota, json={"nota": 5, "comentario": "x" * 501}).status_code == 422
    assert maria.post(rota, json={"nota": 5, "comentario": "x" * 500}).status_code == 201


# ----------------------------------------------------------------- notificações (US13)

def test_notificacoes_contador_e_marcar_lida(maria, admin, pedido_pago):
    admin.put(f"/api/admin/pedidos/{pedido_pago['id_pedido']}/status", json={"novo_status": "EM_PREPARO"})
    lista = maria.get("/api/notificacoes").json()
    assert [n["mensagem"] for n in lista] == ["Seu pedido está em preparo.", "Recebemos seu pedido."]
    assert maria.get("/api/notificacoes/nao-lidas").json()["nao_lidas"] == 2
    maria.put(f"/api/notificacoes/{lista[0]['id_notificacao']}/lida")
    assert maria.get("/api/sessao").json()["notificacoes_nao_lidas"] == 1
    maria.put("/api/notificacoes/lidas")
    assert maria.get("/api/notificacoes/nao-lidas").json()["nao_lidas"] == 0


def test_notificacao_de_outro_cliente(maria, joao, pedido_pago):
    id_n = maria.get("/api/notificacoes").json()[0]["id_notificacao"]
    assert joao.put(f"/api/notificacoes/{id_n}/lida").status_code == 403
    assert joao.get("/api/notificacoes").json() == []
