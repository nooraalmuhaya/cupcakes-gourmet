"""Controller do pedido (PedidoController) – só para CLIENTE logado."""
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.schemas.pedido import (
    AvaliacaoEntrada, AvaliacaoSaida, PaginaPedidos, PedidoEntrada, RespostaPedido, RespostaRepetir, StatusSaida,
)
from app.security.auth import cliente_logado
from app.services import avaliacao_service, pedido_service
from app.utils.mensagens import TEXTO_STATUS, msg

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos do cliente"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RespostaPedido,
             summary="Cria o pedido a partir do carrinho (AGUARDANDO_PAGAMENTO) – UC-08, SD-01")
def criar(dados: PedidoEntrada, request: Request, usuario: Usuario = Depends(cliente_logado),
          db: Session = Depends(get_db)):
    pedido = pedido_service.criar_pedido(db, request.session, usuario, dados.id_endereco, dados.metodo)
    return {"pedido": pedido_service.detalhe(pedido)}


@router.get("", response_model=PaginaPedidos, summary="Histórico do cliente, 10 por página (UC-12)")
def listar(pagina: int = Query(1, ge=1), usuario: Usuario = Depends(cliente_logado),
           db: Session = Depends(get_db)):
    resultado = pedido_service.listar_do_cliente(db, usuario, pagina)
    resultado["pedidos"] = [
        pedido_service.resumo(p) | {
            "itens_texto": " · ".join(f"{i.quantidade}x {i.produto.nome}" for i in p.itens),
            "nota": p.avaliacao.nota if p.avaliacao else None,
            "pode_avaliar": p.status == "ENTREGUE" and p.avaliacao is None,
        } for p in resultado["pedidos"]]
    return resultado


@router.get("/{id_pedido}", response_model=RespostaPedido, summary="Detalhes e linha do tempo (UC-10)")
def obter(id_pedido: int, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return {"pedido": pedido_service.detalhe(pedido_service.obter_do_cliente(db, usuario, id_pedido))}


@router.get("/{id_pedido}/status", response_model=StatusSaida,
            summary="Status atual – consultado a cada 30 segundos pela tela de acompanhamento (SD-02)")
def consultar_status(id_pedido: int, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    pedido = pedido_service.obter_do_cliente(db, usuario, id_pedido)
    return {"id_pedido": pedido.id_pedido, "status": pedido.status,
            "status_texto": TEXTO_STATUS[pedido.status], "data_atualizacao": pedido.data_atualizacao}


@router.post("/{id_pedido}/cancelar", response_model=RespostaPedido,
             summary="Cliente cancela pedido que ainda aguarda pagamento (RF-19)")
def cancelar(id_pedido: int, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    pedido = pedido_service.cancelar_pelo_cliente(db, usuario, id_pedido)
    return {"mensagem": "Pedido cancelado. Os itens continuam no seu carrinho.",
            "pedido": pedido_service.detalhe(pedido)}


@router.post("/{id_pedido}/repetir", response_model=RespostaRepetir,
             summary="Coloca no carrinho os itens disponíveis de um pedido antigo (RF-24)")
def repetir(id_pedido: int, request: Request, usuario: Usuario = Depends(cliente_logado),
            db: Session = Depends(get_db)):
    return pedido_service.repetir(db, request.session, usuario, id_pedido)


@router.post("/{id_pedido}/avaliacao", status_code=status.HTTP_201_CREATED,
             summary="Avalia um pedido entregue (UC-13, RN-17)")
def avaliar(id_pedido: int, dados: AvaliacaoEntrada, usuario: Usuario = Depends(cliente_logado),
            db: Session = Depends(get_db)):
    avaliacao = avaliacao_service.avaliar(db, usuario, id_pedido, dados.nota, dados.comentario)
    return {"mensagem": msg("MSG-S07"), "codigo": "MSG-S07",
            "avaliacao": AvaliacaoSaida.model_validate(avaliacao, from_attributes=True)}


@router.get("/{id_pedido}/avaliacao", response_model=AvaliacaoSaida | None,
            summary="Avaliação do pedido (null se ainda não foi avaliado)")
def ver_avaliacao(id_pedido: int, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return pedido_service.obter_do_cliente(db, usuario, id_pedido).avaliacao
