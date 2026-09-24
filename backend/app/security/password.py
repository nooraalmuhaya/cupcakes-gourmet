"""Hash de senha com bcrypt (RNF-06). A senha em texto puro nunca é gravada."""
import re

import bcrypt

_REGRA_SENHA = re.compile(r"^(?=.*[A-Za-zÀ-ÿ])(?=.*\d).{8,}$")


def senha_valida(senha: str) -> bool:
    """RN-06: mínimo 8 caracteres, com pelo menos 1 letra e 1 número."""
    return bool(_REGRA_SENHA.match(senha or ""))


def gerar_hash(senha: str) -> str:
    # bcrypt considera no máximo 72 bytes da senha
    return bcrypt.hashpw(senha.encode("utf-8")[:72], bcrypt.gensalt()).decode("ascii")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        return bcrypt.checkpw(senha.encode("utf-8")[:72], senha_hash.encode("ascii"))
    except ValueError:
        return False
