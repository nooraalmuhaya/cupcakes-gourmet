"""Carrinho transiente guardado na sessão (classe Carrinho do diagrama de classes).

Formato na sessão:
    session["carrinho"] = {"<id_produto>": {"q": quantidade, "p": "preço visto pelo cliente"}}
    session["cupom"] = "CODIGO" (opcional)

Os valores são sempre recalculados com os dados do banco (RNF-12). O preço guardado
serve só para perceber que o preço mudou depois que o item foi adicionado (MSG-E07).
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.config.settings import settings
from app.models import Produto, Usuario
from app.services import cupom_service
from app.utils.erros import AppError
from app.utils.mensagens import msg

ZERO = Decimal("0.00")


def _ler(session: dict) -> dict:
    """Cópia dos itens. A sessão só é salva quando uma chave de primeiro nível é
    atribuída, por isso toda alteração termina com _gravar()."""
    return {k: dict(v) for k, v in session.get("carrinho", {}).items()}


def _gravar(session: dict, itens: dict) -> None:
    session["carrinho"] = itens


def quantidade_total(session: dict) -> int:
    return sum(item["q"] for item in session.get("carrinho", {}).values())


def esvaziar(session: dict) -> None:
    session["carrinho"] = {}
    session.pop("cupom", None)


def _produtos(db: Session, ids: list[int]) -> dict[int, Produto]:
    if not ids:
        return {}
    consulta = select(Produto).options(joinedload(Produto.categoria)).where(Produto.id_produto.in_(ids))
    return {p.id_produto: p for p in db.scalars(consulta)}


def montar(db: Session, session: dict, usuario: Usuario | None, confirmar_precos: bool = True) -> dict:
    """Monta o carrinho com os dados atuais do banco e calcula os totais (RF-08).

    Com confirmar_precos=True (o cliente está vendo o carrinho/checkout), os preços
    novos passam a ser os "vistos"; a mudança é avisada uma vez com a MSG-E07.
    """
    itens_sessao = _ler(session)
    produtos = _produtos(db, [int(i) for i in itens_sessao])
    itens, subtotal, houve_mudanca, pode_finalizar = [], ZERO, False, True

    for chave, item in list(itens_sessao.items()):
        produto = produtos.get(int(chave))
        if produto is None:  # produto apagado manualmente do banco
            del itens_sessao[chave]
            houve_mudanca = True
            continue
        preco_atual = Decimal(produto.preco)
        preco_alterado = Decimal(item["p"]) != preco_atual
        disponivel = produto.esta_disponivel(item["q"])
        if preco_alterado:
            houve_mudanca = True
            if confirmar_precos:
                item["p"] = str(preco_atual)
        if not disponivel:
            houve_mudanca = True
            pode_finalizar = False
        item_subtotal = preco_atual * item["q"]
        subtotal += item_subtotal
        itens.append({
            "id_produto": produto.id_produto, "nome": produto.nome, "imagem_url": produto.imagem_url,
            "preco": preco_atual, "quantidade": item["q"], "subtotal": item_subtotal,
            "quantidade_estoque": produto.quantidade_estoque if produto.ativo else 0,
            "disponivel": disponivel, "preco_alterado": preco_alterado,
        })

    if itens_sessao != session.get("carrinho", {}):
        _gravar(session, itens_sessao)

    cupom_info, desconto, aviso_cupom = None, ZERO, None
    codigo = session.get("cupom")
    if codigo and itens:
        if usuario is None:
            session.pop("cupom", None)
        else:
            try:
                cupom, desconto = cupom_service.validar(db, codigo, usuario.id_usuario, subtotal)
                cupom_info = {"codigo": cupom.codigo, "tipo": cupom.tipo, "valor": cupom.valor}
            except AppError as erro:  # ficou inválido depois de aplicado: retira e avisa
                session.pop("cupom", None)
                aviso_cupom = erro.mensagem
    elif codigo:
        session.pop("cupom", None)

    taxa = settings.taxa_entrega if itens else ZERO
    return {
        "itens": itens,
        "quantidade_itens": sum(i["quantidade"] for i in itens),
        "subtotal": subtotal,
        "cupom": cupom_info,
        "desconto": desconto,
        "taxa_entrega": taxa,
        "total": subtotal - desconto + taxa,
        "vazio": not itens,
        "pode_finalizar": bool(itens) and pode_finalizar,
        "aviso": msg("MSG-E07") if houve_mudanca else None,
        "aviso_cupom": aviso_cupom,
    }


def adicionar(db: Session, session: dict, id_produto: int, quantidade: int) -> None:
    """RF-06: soma se o produto já estiver no carrinho; limite = estoque (RN-04)."""
    produto = db.get(Produto, id_produto)
    if produto is None or not produto.ativo:
        raise AppError(404, "MSG-E15")
    if produto.quantidade_estoque <= 0:  # RN-02
        raise AppError(409, None, "Este cupcake está indisponível no momento.", campo="quantidade")
    itens = _ler(session)
    atual = itens.get(str(id_produto), {}).get("q", 0)
    nova = atual + quantidade
    if nova > produto.quantidade_estoque:
        raise AppError(409, "MSG-E06", msg("MSG-E06", n=produto.quantidade_estoque), campo="quantidade",
                       dados={"estoque": produto.quantidade_estoque, "no_carrinho": atual})
    itens[str(id_produto)] = {"q": nova, "p": str(produto.preco)}
    _gravar(session, itens)


def alterar_quantidade(db: Session, session: dict, id_produto: int, quantidade: int) -> None:
    """RF-07: mínimo 1, máximo o estoque; se passar, mantém a quantidade anterior (UC-03 E1)."""
    itens = _ler(session)
    item = itens.get(str(id_produto))
    if item is None:
        raise AppError(404, None, "Este item não está no carrinho.")
    produto = db.get(Produto, id_produto)
    estoque = produto.quantidade_estoque if produto is not None and produto.ativo else 0
    if quantidade > estoque:
        raise AppError(409, "MSG-E06", msg("MSG-E06", n=estoque), campo="quantidade",
                       dados={"estoque": estoque})
    item["q"] = quantidade
    _gravar(session, itens)


def remover(session: dict, id_produto: int) -> None:
    itens = _ler(session)
    if str(id_produto) not in itens:
        raise AppError(404, None, "Este item não está no carrinho.")
    del itens[str(id_produto)]
    _gravar(session, itens)
    if not itens:
        session.pop("cupom", None)


def aplicar_cupom(db: Session, session: dict, usuario: Usuario | None, codigo: str) -> Decimal:
    """UC-04 / SD-03. Um cupom por pedido: aplicar outro substitui o anterior."""
    if usuario is None:
        raise AppError(401, "MSG-E09")
    carrinho = montar(db, session, usuario, confirmar_precos=False)
    if carrinho["vazio"]:
        raise AppError(422, "MSG-I03", "Adicione itens ao carrinho antes de usar um cupom.")
    cupom, desconto = cupom_service.validar(db, codigo, usuario.id_usuario, carrinho["subtotal"])
    session["cupom"] = cupom.codigo
    return desconto


def remover_cupom(session: dict) -> None:
    session.pop("cupom", None)
