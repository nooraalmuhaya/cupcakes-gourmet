"""US01–US04 – cardápio, detalhes, busca e filtros."""


def nomes(resposta):
    return [p["nome"] for p in resposta.json()]


def test_lista_so_produtos_ativos_rn01(anonimo):
    r = anonimo.get("/api/produtos")
    assert r.status_code == 200
    assert "Pistache Especial" not in nomes(r)
    assert len(r.json()) == 5


def test_lista_agrupada_por_categoria(anonimo):
    categorias = [p["categoria"] for p in anonimo.get("/api/produtos").json()]
    assert categorias == sorted(categorias)


def test_produto_sem_estoque_aparece_indisponivel_rn02(anonimo):
    baunilha = next(p for p in anonimo.get("/api/produtos").json() if p["nome"] == "Baunilha Clássico")
    assert baunilha["disponivel"] is False and baunilha["quantidade_estoque"] == 0


def test_busca_ignora_acentos_e_maiusculas_rn05(anonimo):
    assert nomes(anonimo.get("/api/produtos", params={"busca": "limao"})) == ["Limão Siciliano"]
    assert nomes(anonimo.get("/api/produtos", params={"busca": "CHOC"})) == ["Chocolate Belga"]


def test_busca_exige_dois_caracteres(anonimo):
    r = anonimo.get("/api/produtos", params={"busca": "l"})
    assert r.status_code == 422 and "2 letras" in r.json()["detail"]


def test_busca_sem_resultado_lista_vazia(anonimo):
    assert anonimo.get("/api/produtos", params={"busca": "morango"}).json() == []


def test_busca_com_caracteres_especiais_nao_quebra(anonimo):
    assert anonimo.get("/api/produtos", params={"busca": "%_"}).json() == []


def test_filtros_combinados_us03(anonimo, dados):
    assert nomes(anonimo.get("/api/produtos", params={"vegano": True, "sem_gluten": True})) == ["Frutas Vermelhas"]
    assert set(nomes(anonimo.get("/api/produtos", params={"categoria": dados["cat_frutados"]}))) == \
        {"Limão Siciliano", "Frutas Vermelhas"}
    assert nomes(anonimo.get("/api/produtos", params={"categoria": dados["cat_frutados"], "vegano": True,
                                                       "busca": "lim"})) == ["Limão Siciliano"]


def test_detalhe_do_produto_us02(anonimo, dados):
    p = anonimo.get(f"/api/produtos/{dados['red']}").json()
    assert p["ingredientes"] and p["alergenos"] == "Leite, ovos e trigo."
    assert p["preco"] == "12.50" and p["disponivel"] is True


def test_produto_inexistente_msg_e15(anonimo):
    r = anonimo.get("/api/produtos/99999")
    assert r.status_code == 404 and r.json()["codigo"] == "MSG-E15"


def test_produto_inativo_msg_e15(anonimo, dados):
    assert anonimo.get(f"/api/produtos/{dados['pistache']}").json()["detail"] == "Produto não encontrado."


def test_categorias(anonimo):
    assert [c["nome"] for c in anonimo.get("/api/categorias").json()] == ["Clássicos", "Frutados"]
