"""Controller dos endereços (parte do ContaController) – só para CLIENTE logado."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.schemas.endereco import EnderecoEntrada, EnderecoSaida, RespostaEndereco
from app.security.auth import cliente_logado
from app.services import endereco_service
from app.utils.mensagens import msg

router = APIRouter(prefix="/api/enderecos", tags=["Endereços"])


@router.get("", response_model=list[EnderecoSaida], summary="Lista os endereços do cliente (padrão primeiro)")
def listar(usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return endereco_service.listar(db, usuario)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RespostaEndereco,
             summary="Cadastra endereço (máximo 5 – RN-08)")
def criar(dados: EnderecoEntrada, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return {"mensagem": msg("MSG-S03"), "codigo": "MSG-S03",
            "endereco": endereco_service.criar(db, usuario, dados)}


@router.put("/{id_endereco}", response_model=RespostaEndereco, summary="Edita um endereço")
def atualizar(id_endereco: int, dados: EnderecoEntrada, usuario: Usuario = Depends(cliente_logado),
              db: Session = Depends(get_db)):
    return {"mensagem": msg("MSG-S03"), "codigo": "MSG-S03",
            "endereco": endereco_service.atualizar(db, usuario, id_endereco, dados)}


@router.put("/{id_endereco}/padrao", response_model=RespostaEndereco, summary="Marca como endereço padrão")
def tornar_padrao(id_endereco: int, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    return {"mensagem": "Endereço padrão atualizado.",
            "endereco": endereco_service.tornar_padrao(db, usuario, id_endereco)}


@router.delete("/{id_endereco}", summary="Exclui um endereço")
def excluir(id_endereco: int, usuario: Usuario = Depends(cliente_logado), db: Session = Depends(get_db)):
    endereco_service.excluir(db, usuario, id_endereco)
    return {"mensagem": "Endereço excluído."}
