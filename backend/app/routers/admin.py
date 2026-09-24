"""Área administrativa: AdminProdutoController e AdminPedidoController (US16, US17).

Todas as rotas exigem perfil ADMIN; outros perfis recebem MSG-E13 (RNF-08).
"""
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.schemas.pedido import PaginaPedidosAdmin, RespostaPedidoAdmin, StatusEntrada
from app.schemas.produto import ProdutoAdmin, ProdutoEntrada, SituacaoEntrada
from app.security.auth import admin_logado
from app.services import pedido_service, produto_service
from app.utils.mensagens import TEXTO_STATUS, msg

router = APIRouter(prefix="/api/admin", tags=["Administração"], dependencies=[Depends(admin_logado)])

StatusFiltro = Literal["AGUARDANDO_PAGAMENTO", "RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "ENTREGUE", "CANCELADO"]


# ----------------------------------------------------------------- produtos (A03, A04)

@router.get("/produtos", response_model=list[ProdutoAdmin], summary="Todos os produtos, ativos e inativos (A03)")
def listar_produtos(db: Session = Depends(get_db)):
    return [produto_service.para_dict(p, admin=True) for p in produto_service.listar_todos(db)]


@router.get("/produtos/{id_produto}", response_model=ProdutoAdmin, summary="Dados de um produto para edição")
def obter_produto(id_produto: int, db: Session = Depends(get_db)):
    return produto_service.para_dict(produto_service.obter_produto(db, id_produto), admin=True)


@router.post("/produtos", status_code=status.HTTP_201_CREATED, summary="Cadastra produto (A04)")
def criar_produto(dados: ProdutoEntrada, db: Session = Depends(get_db)):
    produto = produto_service.criar_produto(db, dados)
    return {"mensagem": msg("MSG-S10"), "codigo": "MSG-S10", "produto": produto_service.para_dict(produto, True)}


@router.put("/produtos/{id_produto}", summary="Edita produto, inclusive preço e estoque (A04)")
def atualizar_produto(id_produto: int, dados: ProdutoEntrada, db: Session = Depends(get_db)):
    produto = produto_service.atualizar_produto(db, id_produto, dados)
    return {"mensagem": msg("MSG-S10"), "codigo": "MSG-S10", "produto": produto_service.para_dict(produto, True)}


@router.patch("/produtos/{id_produto}/situacao", summary="Desativa ou reativa produto (RN-23: não há exclusão)")
def alterar_situacao(id_produto: int, dados: SituacaoEntrada, db: Session = Depends(get_db)):
    produto = produto_service.alterar_situacao(db, id_produto, dados.ativo)
    texto = "Produto reativado." if produto.ativo else "Produto desativado. Ele não aparece mais no cardápio."
    return {"mensagem": texto, "produto": produto_service.para_dict(produto, True)}


# ----------------------------------------------------------------- pedidos (A01, A02)

@router.get("/pedidos", response_model=PaginaPedidosAdmin, summary="Painel de pedidos com filtro por status (A01)")
def listar_pedidos(status_pedido: StatusFiltro | None = Query(None, alias="status"),
                   pagina: int = Query(1, ge=1), db: Session = Depends(get_db)):
    resultado = pedido_service.listar_admin(db, status_pedido, pagina)
    resultado["pedidos"] = [pedido_service.resumo(p) | {"cliente": p.usuario.nome} for p in resultado["pedidos"]]
    return resultado


@router.get("/pedidos/{id_pedido}", response_model=RespostaPedidoAdmin,
            summary="Detalhe do pedido com cliente, pagamento, cupom e avaliação (A02)")
def obter_pedido(id_pedido: int, db: Session = Depends(get_db)):
    return {"pedido": pedido_service.detalhe(pedido_service.obter(db, id_pedido), admin=True)}


@router.put("/pedidos/{id_pedido}/status", response_model=RespostaPedidoAdmin,
            summary="Muda para o próximo status permitido ou cancela (UC-16, SD-02, RN-14, RN-15)")
def alterar_status(id_pedido: int, dados: StatusEntrada, _: Usuario = Depends(admin_logado),
                   db: Session = Depends(get_db)):
    pedido = pedido_service.alterar_status_admin(db, id_pedido, dados.novo_status, dados.status_atual)
    return {"mensagem": msg("MSG-S08", status=TEXTO_STATUS[pedido.status]), "codigo": "MSG-S08",
            "pedido": pedido_service.detalhe(pedido, admin=True)}
