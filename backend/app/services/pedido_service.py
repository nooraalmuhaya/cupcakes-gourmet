"""Regras do pedido: checkout, pagamento, acompanhamento e mudança de status.

Segue o SD-01 (finalizar pedido), o SD-02 (atualizar status) e o diagrama de
estados EST-01. Operações que gravam várias tabelas são feitas em uma única
transação (RNF-11): ou tudo é gravado, ou nada.
"""
import logging
import math
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Cupom, ItemPedido, Pagamento, Pedido, Produto, Usuario
from app.models.enums import StatusPagamento, StatusPedido
from app.services import carrinho_service, endereco_service, notificacao_service, pagamento_service
from app.utils.erros import AppError
from app.utils.formatos import agora
from app.utils.mensagens import NOTIFICACAO_STATUS, TEXTO_STATUS, msg

logger = logging.getLogger("cupcakes")

POR_PAGINA = 10  # RN-18

# EST-01: transições permitidas e quem pode fazer cada uma
TRANSICOES_ADMIN = {
    StatusPedido.RECEBIDO: {StatusPedido.EM_PREPARO, StatusPedido.CANCELADO},
    StatusPedido.EM_PREPARO: {StatusPedido.SAIU_PARA_ENTREGA, StatusPedido.CANCELADO},
    StatusPedido.SAIU_PARA_ENTREGA: {StatusPedido.ENTREGUE},
}
PROXIMO_STATUS = {
    StatusPedido.RECEBIDO: StatusPedido.EM_PREPARO,
    StatusPedido.EM_PREPARO: StatusPedido.SAIU_PARA_ENTREGA,
    StatusPedido.SAIU_PARA_ENTREGA: StatusPedido.ENTREGUE,
}
# Status em que o estoque já foi baixado (RN-12) e precisa voltar se cancelar (RN-15)
STATUS_COM_ESTOQUE_BAIXADO = {StatusPedido.RECEBIDO, StatusPedido.EM_PREPARO}
_STATUS_POR_MENSAGEM = {texto: status for status, texto in NOTIFICACAO_STATUS.items()}


def transicao_admin_permitida(atual: str, novo: str) -> bool:
    return novo in TRANSICOES_ADMIN.get(atual, set())


def _consulta_completa():
    return select(Pedido).options(
        selectinload(Pedido.itens).joinedload(ItemPedido.produto),
        joinedload(Pedido.pagamento), joinedload(Pedido.avaliacao),
        joinedload(Pedido.cupom), joinedload(Pedido.usuario),
        selectinload(Pedido.notificacoes),
    )


def obter(db: Session, id_pedido: int) -> Pedido:
    pedido = db.scalar(_consulta_completa().where(Pedido.id_pedido == id_pedido))
    if pedido is None:
        raise AppError(404, None, "Pedido não encontrado.")
    return pedido


def obter_do_cliente(db: Session, usuario: Usuario, id_pedido: int) -> Pedido:
    """RN-18 / US10 CA5: o cliente só vê os próprios pedidos (MSG-E13)."""
    pedido = obter(db, id_pedido)
    if pedido.id_usuario != usuario.id_usuario:
        raise AppError(403, "MSG-E13")
    return pedido


# ----------------------------------------------------------------- checkout (UC-08)

def _gerar_numero(db: Session, momento: datetime) -> str:
    """RN-13: CUP-AAAAMMDD-NNNN, sequencial dentro do dia."""
    prefixo = f"CUP-{momento:%Y%m%d}-"
    ultimo = db.scalar(select(func.max(Pedido.numero_pedido)).where(Pedido.numero_pedido.like(f"{prefixo}%")))
    sequencia = int(ultimo.rsplit("-", 1)[1]) + 1 if ultimo else 1
    return f"{prefixo}{sequencia:04d}"


def criar_pedido(db: Session, session: dict, usuario: Usuario, id_endereco: int, metodo: str) -> Pedido:
    """Cria o pedido AGUARDANDO_PAGAMENTO com itens e pagamento PENDENTE (RF-15, RF-16)."""
    carrinho = carrinho_service.montar(db, session, usuario, confirmar_precos=False)
    if carrinho["vazio"]:
        raise AppError(422, "MSG-I03")
    # UC-08 E3: preço, estoque ou cupom mudou → volta ao carrinho com os valores atualizados
    if carrinho["aviso"] or carrinho["aviso_cupom"] or not carrinho["pode_finalizar"]:
        carrinho_service.montar(db, session, usuario, confirmar_precos=True)
        raise AppError(409, "MSG-E07")

    endereco = endereco_service.obter(db, usuario, id_endereco)
    cupom = None
    if carrinho["cupom"]:
        cupom = db.scalar(select(Cupom).where(Cupom.codigo == carrinho["cupom"]["codigo"]))

    for tentativa in range(5):
        momento = agora()
        pedido = Pedido(
            numero_pedido=_gerar_numero(db, momento),
            id_usuario=usuario.id_usuario,
            id_cupom=cupom.id_cupom if cupom else None,
            endereco_entrega=endereco.formatar_texto(),  # cópia histórica
            subtotal=carrinho["subtotal"],
            valor_desconto=carrinho["desconto"],
            taxa_entrega=carrinho["taxa_entrega"],
            valor_total=carrinho["total"],
            status=StatusPedido.AGUARDANDO_PAGAMENTO,
            data_pedido=momento,
            data_atualizacao=momento,
        )
        # RN-21: o item guarda o preço do momento da compra
        pedido.itens = [ItemPedido(id_produto=i["id_produto"], quantidade=i["quantidade"],
                                   preco_unitario=i["preco"]) for i in carrinho["itens"]]
        pedido.pagamento = Pagamento(metodo=metodo, status=StatusPagamento.PENDENTE)
        db.add(pedido)
        try:
            db.commit()
            return obter(db, pedido.id_pedido)
        except IntegrityError as exc:
            db.rollback()
            if "numero_pedido" not in str(exc.orig) or tentativa == 4:
                raise
    raise AppError(500, "MSG-E18")  # pragma: no cover


# ----------------------------------------------------------------- pagamento (UC-09)

def pagar(db: Session, session: dict, usuario: Usuario, id_pedido: int, metodo: str,
          cartao: dict | None) -> Pedido:
    pedido = obter_do_cliente(db, usuario, id_pedido)
    if pedido.status != StatusPedido.AGUARDANDO_PAGAMENTO:
        raise AppError(409, None, "Este pedido não está aguardando pagamento.")

    final_cartao = None
    if metodo != "PIX":
        cartao = cartao or {}
        final_cartao = pagamento_service.validar_cartao(
            cartao.get("numero"), cartao.get("nome"), cartao.get("validade"), cartao.get("cvv"))

    pagamento = pedido.pagamento
    pagamento.metodo = metodo  # "Trocar forma de pagamento" reaproveita o mesmo registro
    resultado = pagamento_service.simular(metodo, final_cartao)

    if resultado == StatusPagamento.RECUSADO:
        pagamento.status = StatusPagamento.RECUSADO
        db.commit()
        raise AppError(402, "MSG-E10", dados={"id_pedido": pedido.id_pedido, "status_pagamento": "RECUSADO"})

    # Aprovado: baixa o estoque com as linhas travadas (evita vender mais do que existe)
    ids = [item.id_produto for item in pedido.itens]
    produtos = {p.id_produto: p for p in db.scalars(
        select(Produto).where(Produto.id_produto.in_(ids)).with_for_update())}
    for item in pedido.itens:
        produto = produtos[item.id_produto]
        if not produto.esta_disponivel(item.quantidade):
            db.rollback()
            raise AppError(409, "MSG-E07", dados={"id_pedido": pedido.id_pedido})
    for item in pedido.itens:
        produtos[item.id_produto].quantidade_estoque -= item.quantidade

    momento = agora()
    pagamento.status = StatusPagamento.APROVADO
    pagamento.data_pagamento = momento
    pedido.status = StatusPedido.RECEBIDO
    pedido.data_atualizacao = momento
    notificacao_service.gerar(db, pedido, StatusPedido.RECEBIDO)
    db.commit()

    carrinho_service.esvaziar(session)  # RF-18
    # Seção 3.4: o e-mail de confirmação é simulado (só registrado no log)
    logger.info("E-mail de confirmação (simulado) enviado para o cliente %s – pedido %s",
                usuario.id_usuario, pedido.numero_pedido)
    return obter(db, pedido.id_pedido)


def cancelar_pelo_cliente(db: Session, usuario: Usuario, id_pedido: int) -> Pedido:
    """RF-19 / RN-14: o cliente só cancela enquanto aguarda pagamento. O carrinho não muda."""
    pedido = obter_do_cliente(db, usuario, id_pedido)
    if pedido.status != StatusPedido.AGUARDANDO_PAGAMENTO:
        raise AppError(409, None, "Este pedido não pode mais ser cancelado por aqui. "
                                  "Fale com a loja em Ajuda e Suporte.")
    _mudar_status(db, pedido, StatusPedido.CANCELADO)
    db.commit()
    return obter(db, pedido.id_pedido)


def _mudar_status(db: Session, pedido: Pedido, novo: str) -> None:
    pedido.status = novo
    pedido.data_atualizacao = agora()
    notificacao_service.gerar(db, pedido, novo)  # RN-16


# ----------------------------------------------------------------- administração (UC-16)

def alterar_status_admin(db: Session, id_pedido: int, novo: str, status_esperado: str | None) -> Pedido:
    # Trava a linha do pedido: duas abas mudando ao mesmo tempo não passam juntas
    pedido = db.scalar(select(Pedido).where(Pedido.id_pedido == id_pedido).with_for_update())
    if pedido is None:
        raise AppError(404, None, "Pedido não encontrado.")
    atual = pedido.status
    # UC-16 E1: o pedido mudou em outra aba ou a transição não é permitida → MSG-E14
    if (status_esperado and status_esperado != atual) or not transicao_admin_permitida(atual, novo):
        db.rollback()
        raise AppError(409, "MSG-E14", dados={"status_atual": atual})

    if novo == StatusPedido.CANCELADO and atual in STATUS_COM_ESTOQUE_BAIXADO:
        itens = list(db.scalars(select(ItemPedido).where(ItemPedido.id_pedido == id_pedido)))
        produtos = {p.id_produto: p for p in db.scalars(
            select(Produto).where(Produto.id_produto.in_([i.id_produto for i in itens])).with_for_update())}
        for item in itens:  # RN-15: devolve ao estoque
            produtos[item.id_produto].quantidade_estoque += item.quantidade

    _mudar_status(db, pedido, novo)
    db.commit()
    return obter(db, id_pedido)


def listar_admin(db: Session, status: str | None, pagina: int, por_pagina: int = 20) -> dict:
    filtro = [Pedido.status == status] if status else []
    total = db.scalar(select(func.count()).select_from(Pedido).where(*filtro)) or 0
    consulta = (select(Pedido).options(joinedload(Pedido.usuario)).where(*filtro)
                .order_by(Pedido.data_pedido.desc(), Pedido.id_pedido.desc())
                .offset((pagina - 1) * por_pagina).limit(por_pagina))
    return {"pedidos": list(db.scalars(consulta)), "pagina": pagina, "total": total,
            "total_paginas": max(1, math.ceil(total / por_pagina))}


# ----------------------------------------------------------------- histórico (UC-12)

def listar_do_cliente(db: Session, usuario: Usuario, pagina: int) -> dict:
    """RN-18: mais recente primeiro, 10 por página."""
    filtro = Pedido.id_usuario == usuario.id_usuario
    total = db.scalar(select(func.count()).select_from(Pedido).where(filtro)) or 0
    consulta = (select(Pedido).options(selectinload(Pedido.itens).joinedload(ItemPedido.produto),
                                       joinedload(Pedido.avaliacao))
                .where(filtro).order_by(Pedido.data_pedido.desc(), Pedido.id_pedido.desc())
                .offset((pagina - 1) * POR_PAGINA).limit(POR_PAGINA))
    return {"pedidos": list(db.scalars(consulta)), "pagina": pagina, "total": total,
            "total_paginas": max(1, math.ceil(total / POR_PAGINA))}


def repetir(db: Session, session: dict, usuario: Usuario, id_pedido: int) -> dict:
    """RN-19: adiciona os itens disponíveis com o preço atual; avisa os indisponíveis (MSG-W01)."""
    pedido = obter_do_cliente(db, usuario, id_pedido)
    adicionados, indisponiveis = 0, []
    carrinho_atual = session.get("carrinho", {})
    for item in pedido.itens:
        produto = item.produto
        no_carrinho = carrinho_atual.get(str(produto.id_produto), {}).get("q", 0)
        possivel = min(item.quantidade, produto.quantidade_estoque - no_carrinho) if produto.ativo else 0
        if possivel <= 0:
            indisponiveis.append(produto.nome)
            continue
        carrinho_service.adicionar(db, session, produto.id_produto, possivel)
        carrinho_atual = session.get("carrinho", {})
        adicionados += 1
    return {
        "mensagem": msg("MSG-S09") if adicionados else None,
        "aviso": msg("MSG-W01", lista=", ".join(indisponiveis)) if indisponiveis else None,
        "indisponiveis": indisponiveis,
    }


# ----------------------------------------------------------------- formatação das respostas

def linha_do_tempo(pedido: Pedido) -> list[dict]:
    """Etapas do T09 com o horário de cada uma.

    O banco não tem tabela de histórico de status; o horário de cada etapa vem
    da notificação gerada naquela mudança (RN-16 garante uma por mudança).
    """
    horarios = {}
    for n in pedido.notificacoes:
        status = _STATUS_POR_MENSAGEM.get(n.mensagem)
        if status:
            horarios[status] = n.data_envio
    etapas = [StatusPedido.RECEBIDO, StatusPedido.EM_PREPARO, StatusPedido.SAIU_PARA_ENTREGA, StatusPedido.ENTREGUE]
    ordem = {s: i for i, s in enumerate(etapas)}
    posicao_atual = ordem.get(pedido.status, -1)
    return [{"status": s, "texto": TEXTO_STATUS[s], "data": horarios.get(s),
             "concluida": ordem[s] <= posicao_atual, "atual": s == pedido.status} for s in etapas]


def resumo(pedido: Pedido) -> dict:
    return {
        "id_pedido": pedido.id_pedido, "numero_pedido": pedido.numero_pedido,
        "data_pedido": pedido.data_pedido, "data_atualizacao": pedido.data_atualizacao,
        "status": pedido.status, "status_texto": TEXTO_STATUS[pedido.status],
        "valor_total": pedido.valor_total,
    }


def detalhe(pedido: Pedido, admin: bool = False) -> dict:
    dados = resumo(pedido) | {
        "itens": [{"id_produto": i.id_produto, "nome": i.produto.nome, "quantidade": i.quantidade,
                   "preco_unitario": i.preco_unitario, "subtotal": i.calcular_subtotal(),
                   "imagem_url": i.produto.imagem_url} for i in pedido.itens],
        "endereco_entrega": pedido.endereco_entrega,
        "subtotal": pedido.subtotal, "valor_desconto": pedido.valor_desconto,
        "taxa_entrega": pedido.taxa_entrega,
        "cupom": pedido.cupom.codigo if pedido.cupom else None,
        "pagamento": ({"metodo": pedido.pagamento.metodo, "status": pedido.pagamento.status,
                       "data_pagamento": pedido.pagamento.data_pagamento} if pedido.pagamento else None),
        "avaliacao": ({"nota": pedido.avaliacao.nota, "comentario": pedido.avaliacao.comentario,
                       "data_avaliacao": pedido.avaliacao.data_avaliacao} if pedido.avaliacao else None),
        "pode_avaliar": pedido.status == StatusPedido.ENTREGUE and pedido.avaliacao is None,
        "pode_cancelar": pedido.status == StatusPedido.AGUARDANDO_PAGAMENTO,
        "linha_do_tempo": linha_do_tempo(pedido),
    }
    if admin:
        dados["cliente"] = {"nome": pedido.usuario.nome, "email": pedido.usuario.email,
                            "telefone": pedido.usuario.telefone}
        proximo = PROXIMO_STATUS.get(pedido.status)
        dados["proximo_status"] = proximo
        dados["proximo_status_texto"] = TEXTO_STATUS[proximo] if proximo else None
        dados["admin_pode_cancelar"] = pedido.status in TRANSICOES_ADMIN and \
            StatusPedido.CANCELADO in TRANSICOES_ADMIN[pedido.status]
    return dados
