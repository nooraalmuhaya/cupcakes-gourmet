"""Controller de autenticação (AuthController) e conta (ContaController)."""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Usuario
from app.schemas.auth import LoginEntrada, PerfilEntrada, RegistroEntrada, RespostaUsuario, UsuarioSaida
from app.security.auth import login_na_sessao, logout_da_sessao, usuario_logado, usuario_opcional
from app.services import auth_service
from app.utils.mensagens import msg

router = APIRouter(prefix="/api", tags=["Autenticação e conta"])


@router.post("/auth/register", status_code=status.HTTP_201_CREATED, response_model=RespostaUsuario,
             summary="Cria conta de cliente e já faz o login (UC-05)")
def registrar(dados: RegistroEntrada, request: Request, db: Session = Depends(get_db)):
    usuario = auth_service.cadastrar_cliente(db, dados)
    login_na_sessao(request, usuario)  # o carrinho da sessão é mantido (US05 CA6)
    return {"mensagem": msg("MSG-S05"), "codigo": "MSG-S05", "usuario": usuario}


@router.post("/auth/login", response_model=RespostaUsuario, summary="Login de cliente ou administrador (UC-06)")
def login(dados: LoginEntrada, request: Request, db: Session = Depends(get_db)):
    usuario = auth_service.autenticar(db, dados.email, dados.senha)
    login_na_sessao(request, usuario)
    return {"usuario": usuario}


@router.post("/auth/logout", summary="Encerra a sessão (MSG-S06)")
def logout(request: Request):
    logout_da_sessao(request)
    return {"mensagem": msg("MSG-S06"), "codigo": "MSG-S06"}


@router.get("/auth/me", response_model=UsuarioSaida | None,
            summary="Usuário da sessão atual (null se não estiver logado)")
def eu(usuario: Usuario | None = Depends(usuario_opcional)):
    return usuario


@router.put("/conta", response_model=RespostaUsuario, summary="Edita nome e telefone (RF-12)")
def editar_perfil(dados: PerfilEntrada, usuario: Usuario = Depends(usuario_logado),
                  db: Session = Depends(get_db)):
    usuario = auth_service.atualizar_perfil(db, usuario, dados)
    return {"mensagem": "Dados salvos.", "usuario": usuario}
