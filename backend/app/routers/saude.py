from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.utils.erros import AppError

router = APIRouter(prefix="/api", tags=["Sistema"])

TABELAS = {"usuario", "endereco", "categoria", "produto", "cupom", "pedido",
           "item_pedido", "pagamento", "avaliacao", "notificacao"}


@router.get("/saude", summary="Verifica a API e a conexão com o MySQL")
def saude(db: Session = Depends(get_db)):
    try:
        versao = db.execute(text("SELECT VERSION()")).scalar()
        tabelas = {r[0] for r in db.execute(text("SHOW TABLES"))}
    except Exception as exc:  # noqa: BLE001
        raise AppError(503, "MSG-E18", "Banco de dados indisponível.") from exc
    faltando = sorted(TABELAS - tabelas)
    return {"api": "ok", "banco": "ok" if not faltando else "incompleto",
            "mysql": versao, "tabelas_faltando": faltando}
