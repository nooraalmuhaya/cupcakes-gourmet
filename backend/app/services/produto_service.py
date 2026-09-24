"""Regras do cardápio (US01–US04) e da gestão de produtos (US16)."""
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import Categoria, Produto
from app.schemas.produto import ProdutoEntrada
from app.utils.erros import AppError


def para_dict(p: Produto, admin: bool = False) -> dict:
    dados = {
        "id_produto": p.id_produto, "nome": p.nome, "descricao": p.descricao,
        "ingredientes": p.ingredientes, "alergenos": p.alergenos, "preco": p.preco,
        "imagem_url": p.imagem_url, "vegano": p.vegano, "sem_gluten": p.sem_gluten,
        "quantidade_estoque": p.quantidade_estoque, "disponivel": p.esta_disponivel(1),
        "id_categoria": p.id_categoria, "categoria": p.categoria.nome,
    }
    if admin:
        dados["ativo"] = p.ativo
    return dados


def _escapar_like(termo: str) -> str:
    return termo.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def listar_cardapio(db: Session, busca: str | None = None, id_categoria: int | None = None,
                    vegano: bool = False, sem_gluten: bool = False) -> list[Produto]:
    """RN-01: só produtos ativos. Ordem: categoria e nome (agrupamento do T01).

    A busca usa LIKE com a collation utf8mb4_0900_ai_ci do banco, que já ignora
    maiúsculas e acentos (RN-05: "limao" encontra "Limão").
    """
    consulta = (select(Produto).join(Produto.categoria).options(joinedload(Produto.categoria))
                .where(Produto.ativo.is_(True)))
    if busca:
        termo = busca.strip()
        if len(termo) < 2:
            raise AppError(422, None, "Digite pelo menos 2 letras para buscar.", campo="busca")
        consulta = consulta.where(Produto.nome.like(f"%{_escapar_like(termo)}%", escape="\\"))
    if id_categoria is not None:
        consulta = consulta.where(Produto.id_categoria == id_categoria)
    if vegano:
        consulta = consulta.where(Produto.vegano.is_(True))
    if sem_gluten:
        consulta = consulta.where(Produto.sem_gluten.is_(True))
    return list(db.scalars(consulta.order_by(Categoria.nome, Produto.nome)))


def obter_produto_ativo(db: Session, id_produto: int) -> Produto:
    """US02 CA5: inexistente ou desativado → MSG-E15."""
    produto = db.get(Produto, id_produto, options=[joinedload(Produto.categoria)])
    if produto is None or not produto.ativo:
        raise AppError(404, "MSG-E15")
    return produto


def listar_categorias(db: Session) -> list[Categoria]:
    return list(db.scalars(select(Categoria).order_by(Categoria.nome)))


# ----------------------------------------------------------------- administração (US16)

def listar_todos(db: Session) -> list[Produto]:
    """US16 CA1: ativos e inativos."""
    consulta = select(Produto).join(Produto.categoria).options(joinedload(Produto.categoria))
    return list(db.scalars(consulta.order_by(Categoria.nome, Produto.nome)))


def obter_produto(db: Session, id_produto: int) -> Produto:
    produto = db.get(Produto, id_produto, options=[joinedload(Produto.categoria)])
    if produto is None:
        raise AppError(404, "MSG-E15")
    return produto


def _validar_nome_e_categoria(db: Session, dados: ProdutoEntrada, id_atual: int | None) -> None:
    if db.get(Categoria, dados.id_categoria) is None:
        raise AppError(422, None, "Escolha uma categoria válida.", campo="id_categoria")
    existente = db.scalar(select(Produto).where(Produto.nome == dados.nome))
    if existente is not None and existente.id_produto != id_atual:
        raise AppError(409, "MSG-E17", campo="nome")


def _salvar(db: Session, produto: Produto) -> Produto:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AppError(409, "MSG-E17", campo="nome") from exc
    db.refresh(produto)
    return obter_produto(db, produto.id_produto)


def criar_produto(db: Session, dados: ProdutoEntrada) -> Produto:
    _validar_nome_e_categoria(db, dados, None)
    produto = Produto(**dados.model_dump())
    db.add(produto)
    return _salvar(db, produto)


def atualizar_produto(db: Session, id_produto: int, dados: ProdutoEntrada) -> Produto:
    """US16 CA5: mudar o preço não altera pedidos antigos (item_pedido guarda o preço – RN-21)."""
    produto = obter_produto(db, id_produto)
    _validar_nome_e_categoria(db, dados, id_produto)
    for campo, valor in dados.model_dump().items():
        setattr(produto, campo, valor)
    return _salvar(db, produto)


def alterar_situacao(db: Session, id_produto: int, ativo: bool) -> Produto:
    """US16 CA4 / RN-23: desativar esconde do cardápio sem apagar."""
    produto = obter_produto(db, id_produto)
    produto.ativo = ativo
    return _salvar(db, produto)
