"""US16 e US17 – administração de produtos e pedidos."""
from sqlalchemy import select

from app.models import Notificacao, Produto

PRODUTO = {"nome": "Coco Queimado", "id_categoria": None, "descricao": "Massa de coco.",
           "ingredientes": "Farinha, coco.", "alergenos": "", "preco": "11,90",
           "imagem_url": "assets/images/produtos/coco.svg", "vegano": False, "sem_gluten": False,
           "quantidade_estoque": 10, "ativo": True}


def test_cliente_nao_acessa_admin_msg_e13(maria):
    for rota in ["/api/admin/produtos", "/api/admin/pedidos"]:
        r = maria.get(rota)
        assert r.status_code == 403 and r.json()["codigo"] == "MSG-E13"


def test_anonimo_nao_acessa_admin(anonimo):
    assert anonimo.get("/api/admin/pedidos").status_code == 401


def test_admin_lista_ativos_e_inativos(admin):
    produtos = admin.get("/api/admin/produtos").json()
    assert len(produtos) == 6 and any(p["ativo"] is False for p in produtos)


def test_admin_cria_produto_msg_s10(admin, anonimo, dados):
    r = admin.post("/api/admin/produtos", json={**PRODUTO, "id_categoria": dados["cat_classicos"]})
    assert r.status_code == 201 and r.json()["codigo"] == "MSG-S10"
    p = r.json()["produto"]
    assert p["preco"] == "11.90" and p["alergenos"] == "Não contém alérgenos declarados"  # RN-03
    assert "Coco Queimado" in [x["nome"] for x in anonimo.get("/api/produtos").json()]


def test_admin_validacoes_do_formulario(admin, dados):
    r = admin.post("/api/admin/produtos", json={**PRODUTO, "nome": "", "preco": "0", "quantidade_estoque": -1})
    erros = {e["campo"]: e["mensagem"] for e in r.json()["erros"]}
    assert r.status_code == 422
    assert erros["nome"] == "Preencha este campo." and erros["id_categoria"] == "Preencha este campo."
    assert erros["preco"] == "O preço deve ser maior que zero."
    assert "maior ou igual a zero" in erros["quantidade_estoque"]


def test_admin_nome_repetido_msg_e17(admin, dados):
    r = admin.post("/api/admin/produtos", json={**PRODUTO, "nome": "Red Velvet", "id_categoria": dados["cat_classicos"]})
    assert r.status_code == 409 and r.json()["codigo"] == "MSG-E17"


def test_admin_categoria_inexistente(admin):
    assert admin.post("/api/admin/produtos", json={**PRODUTO, "id_categoria": 999}).status_code == 422


def test_admin_edita_preco_sem_mudar_pedido_antigo_rn21(admin, maria, pedido_pago, dados):
    atual = admin.get(f"/api/admin/produtos/{dados['red']}").json()
    r = admin.put(f"/api/admin/produtos/{dados['red']}", json={**atual, "preco": "20.00", "quantidade_estoque": 30})
    assert r.status_code == 200 and r.json()["produto"]["quantidade_estoque"] == 30
    item = maria.get(f"/api/pedidos/{pedido_pago['id_pedido']}").json()["pedido"]["itens"][0]
    assert item["preco_unitario"] == "12.50"


def test_admin_desativa_e_reativa_rn23(admin, anonimo, dados, db):
    admin.patch(f"/api/admin/produtos/{dados['red']}/situacao", json={"ativo": False})
    assert anonimo.get(f"/api/produtos/{dados['red']}").status_code == 404
    assert db.get(Produto, dados["red"]) is not None  # não foi apagado
    admin.patch(f"/api/admin/produtos/{dados['red']}/situacao", json={"ativo": True})
    assert anonimo.get(f"/api/produtos/{dados['red']}").status_code == 200


def test_nao_existe_exclusao_de_produto(admin, dados):
    assert admin.delete(f"/api/admin/produtos/{dados['red']}").status_code == 405


def test_admin_painel_com_filtro(admin, pedido_pago):
    todos = admin.get("/api/admin/pedidos").json()
    assert todos["total"] == 1 and todos["pedidos"][0]["cliente"] == "Maria Oliveira"
    assert admin.get("/api/admin/pedidos", params={"status": "ENTREGUE"}).json()["total"] == 0
    assert admin.get("/api/admin/pedidos", params={"status": "INVALIDO"}).status_code == 422


def test_admin_detalhe_do_pedido(admin, pedido_pago):
    p = admin.get(f"/api/admin/pedidos/{pedido_pago['id_pedido']}").json()["pedido"]
    assert p["cliente"]["email"] == "maria@example.com"
    assert p["proximo_status"] == "EM_PREPARO" and p["admin_pode_cancelar"] is True


def test_admin_avanca_status_e_notifica_msg_s08(admin, pedido_pago, db):
    r = admin.put(f"/api/admin/pedidos/{pedido_pago['id_pedido']}/status",
                  json={"novo_status": "EM_PREPARO", "status_atual": "RECEBIDO"})
    assert r.json()["mensagem"] == "Status do pedido atualizado para Em preparo."
    assert len(db.scalars(select(Notificacao)).all()) == 2


def test_transicao_invalida_msg_e14(admin, pedido_pago):
    r = admin.put(f"/api/admin/pedidos/{pedido_pago['id_pedido']}/status", json={"novo_status": "ENTREGUE"})
    assert r.status_code == 409 and r.json()["codigo"] == "MSG-E14"


def test_pedido_alterado_em_outra_aba_msg_e14(admin, pedido_pago):
    url = f"/api/admin/pedidos/{pedido_pago['id_pedido']}/status"
    admin.put(url, json={"novo_status": "EM_PREPARO", "status_atual": "RECEBIDO"})
    r = admin.put(url, json={"novo_status": "EM_PREPARO", "status_atual": "RECEBIDO"})
    assert r.status_code == 409 and r.json()["status_atual"] == "EM_PREPARO"


def test_admin_cancela_e_devolve_estoque_rn15(admin, maria, pedido_pago, dados, db):
    db.rollback()
    assert db.get(Produto, dados["red"]).quantidade_estoque == 6
    admin.put(f"/api/admin/pedidos/{pedido_pago['id_pedido']}/status", json={"novo_status": "EM_PREPARO"})
    r = admin.put(f"/api/admin/pedidos/{pedido_pago['id_pedido']}/status", json={"novo_status": "CANCELADO"})
    assert r.json()["pedido"]["status"] == "CANCELADO"
    db.rollback()
    assert db.get(Produto, dados["red"]).quantidade_estoque == 8
    assert db.get(Produto, dados["choc"]).quantidade_estoque == 12
    assert maria.get("/api/notificacoes").json()[0]["mensagem"] == "Seu pedido foi cancelado."


def test_admin_nao_cancela_depois_que_saiu_para_entrega(admin, pedido_pago):
    url = f"/api/admin/pedidos/{pedido_pago['id_pedido']}/status"
    admin.put(url, json={"novo_status": "EM_PREPARO"})
    admin.put(url, json={"novo_status": "SAIU_PARA_ENTREGA"})
    assert admin.put(url, json={"novo_status": "CANCELADO"}).status_code == 409


def test_admin_nao_muda_pedido_aguardando_pagamento(admin, maria, dados, endereco_maria):
    maria.post("/api/carrinho/itens", json={"id_produto": dados["red"]})
    p = maria.post("/api/pedidos", json={"id_endereco": endereco_maria, "metodo": "PIX"}).json()["pedido"]
    assert admin.put(f"/api/admin/pedidos/{p['id_pedido']}/status",
                     json={"novo_status": "RECEBIDO"}).status_code == 409


def test_campos_omitidos_viram_erro_de_validacao_e_nao_erro_500(admin, dados):
    """Regressão: campos com valor padrão ausentes do JSON também precisam ser validados."""
    enviado = {k: v for k, v in PRODUTO.items() if k not in {"preco", "quantidade_estoque", "alergenos"}}
    r = admin.post("/api/admin/produtos", json={**enviado, "id_categoria": dados["cat_classicos"]})
    assert r.status_code == 422
    assert {e["campo"] for e in r.json()["erros"]} == {"preco", "quantidade_estoque"}
