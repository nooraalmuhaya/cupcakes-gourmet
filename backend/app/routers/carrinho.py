"""Controller do carrinho (CarrinhoController) – funciona sem login (RN-07)."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.schemas.carrinho import CupomEntrada, ItemEntrada, QuantidadeEntrada, RespostaCarrinho
from app.security.auth import usuario_opcional
from app.services import carrinho_service
from app.utils.formatos import reais
from app.utils.mensagens import msg

router = APIRouter(prefix="/api/carrinho", tags=["Carrinho e cupom"])


def _resposta(db, request, usuario, mensagem=None, codigo=None):
    return {"mensagem": mensagem, "codigo": codigo,
            "carrinho": carrinho_service.montar(db, request.session, usuario)}


@router.get("", response_model=RespostaCarrinho, summary="Itens, cupom e totais do carrinho (UC-03)")
def ver_carrinho(request: Request, usuario: Usuario | None = Depends(usuario_opcional),
                 db: Session = Depends(get_db)):
    return _resposta(db, request, usuario)


@router.post("/itens", response_model=RespostaCarrinho, summary="Adiciona produto (soma se já existir)")
def adicionar_item(dados: ItemEntrada, request: Request, usuario: Usuario | None = Depends(usuario_opcional),
                   db: Session = Depends(get_db)):
    carrinho_service.adicionar(db, request.session, dados.id_produto, dados.quantidade)
    return _resposta(db, request, usuario, msg("MSG-S01"), "MSG-S01")


@router.put("/itens/{id_produto}", response_model=RespostaCarrinho, summary="Altera a quantidade de um item")
def alterar_item(id_produto: int, dados: QuantidadeEntrada, request: Request,
                 usuario: Usuario | None = Depends(usuario_opcional), db: Session = Depends(get_db)):
    carrinho_service.alterar_quantidade(db, request.session, id_produto, dados.quantidade)
    return _resposta(db, request, usuario)


@router.delete("/itens/{id_produto}", response_model=RespostaCarrinho, summary="Remove um item (MSG-S02)")
def remover_item(id_produto: int, request: Request, usuario: Usuario | None = Depends(usuario_opcional),
                 db: Session = Depends(get_db)):
    carrinho_service.remover(request.session, id_produto)
    return _resposta(db, request, usuario, msg("MSG-S02"), "MSG-S02")


@router.post("/cupom", response_model=RespostaCarrinho, summary="Aplica cupom – exige login (UC-04, SD-03)")
def aplicar_cupom(dados: CupomEntrada, request: Request, usuario: Usuario | None = Depends(usuario_opcional),
                  db: Session = Depends(get_db)):
    desconto = carrinho_service.aplicar_cupom(db, request.session, usuario, dados.codigo)
    return _resposta(db, request, usuario, msg("MSG-S04", valor=reais(desconto)), "MSG-S04")


@router.delete("/cupom", response_model=RespostaCarrinho, summary="Remove o cupom aplicado")
def remover_cupom(request: Request, usuario: Usuario | None = Depends(usuario_opcional),
                  db: Session = Depends(get_db)):
    carrinho_service.remover_cupom(request.session)
    return _resposta(db, request, usuario, "Cupom removido.")
