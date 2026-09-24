"""Controller das notificações (NotificacaoController) – US13."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.schemas.pedido import NotificacaoSaida
from app.security.auth import cliente_logado
from app.services import notificacao_service

router = APIRouter(prefix="/api/notificacoes", tags=["Notificações"])


def _saida(n) -> dict:
    return {"id_notificacao": n.id_notificacao, "id_pedido": n.id_pedido,
            "numero_pedido": n.pedido.numero_pedido, "mensagem": n.mensagem,
            "lida": n.lida, "data_envio": n.data_envio}


@router.get("", response_model=list[NotificacaoSaida], summary="Notificações do cliente, mais recentes primeiro")
def listar(usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return [_saida(n) for n in notificacao_service.listar(db, usuario)]


@router.get("/nao-lidas", summary="Quantidade de notificações não lidas (contador do sino)")
def nao_lidas(usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return {"nao_lidas": notificacao_service.contar_nao_lidas(db, usuario)}


@router.put("/lidas", summary="Marca todas como lidas")
def marcar_todas(usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    notificacao_service.marcar_todas(db, usuario)
    return {"mensagem": "Todas as notificações foram marcadas como lidas."}


@router.put("/{id_notificacao}/lida", response_model=NotificacaoSaida, summary="Marca uma notificação como lida")
def marcar_lida(id_notificacao: int, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return _saida(notificacao_service.marcar_lida(db, usuario, id_notificacao))
