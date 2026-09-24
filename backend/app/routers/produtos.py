"""Controller do cardápio (CardapioController) – área pública."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.produto import CategoriaSaida, ProdutoDetalhe, ProdutoResumo
from app.services import produto_service

router = APIRouter(prefix="/api", tags=["Cardápio"])


@router.get("/produtos", response_model=list[ProdutoResumo],
            summary="Lista o cardápio com busca e filtros (UC-01, US01, US03, US04)")
def listar_produtos(
    busca: str | None = Query(None, max_length=80, description="Parte do nome (mínimo 2 letras)"),
    categoria: int | None = Query(None, description="id_categoria"),
    vegano: bool = False,
    sem_gluten: bool = False,
    db: Session = Depends(get_db),
):
    produtos = produto_service.listar_cardapio(db, busca, categoria, vegano, sem_gluten)
    return [produto_service.para_dict(p) for p in produtos]


@router.get("/produtos/{id_produto}", response_model=ProdutoDetalhe,
            summary="Detalhes de um produto ativo (UC-02)")
def obter_produto(id_produto: int, db: Session = Depends(get_db)):
    return produto_service.para_dict(produto_service.obter_produto_ativo(db, id_produto))


@router.get("/categorias", response_model=list[CategoriaSaida], summary="Categorias do cardápio")
def listar_categorias(db: Session = Depends(get_db)):
    return produto_service.listar_categorias(db)
