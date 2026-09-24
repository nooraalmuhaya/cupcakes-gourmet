"""Pagamento simulado (UC-09). Nenhum valor real é cobrado."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.schemas.pedido import PagamentoEntrada, RespostaPedido
from app.security.auth import cliente_logado
from app.services import pedido_service

router = APIRouter(prefix="/api/pagamentos", tags=["Pagamento (simulado)"])


@router.post("", response_model=RespostaPedido,
             summary="Processa o pagamento simulado do pedido (RN-11)",
             description="Cartão com final **0000** é recusado (HTTP 402, MSG-E10); os demais cartões e o PIX "
                         "são aprovados. Com a aprovação o pedido vira RECEBIDO, o estoque é baixado, a "
                         "notificação é criada e o carrinho é esvaziado. Os dados do cartão não são gravados.")
def pagar(dados: PagamentoEntrada, request: Request, usuario: Usuario = Depends(cliente_logado),
          db: Session = Depends(get_db)):
    cartao = dados.cartao.model_dump() if dados.cartao else None
    pedido = pedido_service.pagar(db, request.session, usuario, dados.id_pedido, dados.metodo, cartao)
    return {"mensagem": "Pedido realizado com sucesso!", "pedido": pedido_service.detalhe(pedido)}
