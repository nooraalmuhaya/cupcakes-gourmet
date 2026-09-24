"""Configuração da aplicação lida de variáveis de ambiente (arquivo backend/.env).

Nenhuma credencial fica no código: veja o arquivo .env.example na raiz do projeto.
"""
import os
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent

# backend/.env tem prioridade; a raiz do projeto é aceita como alternativa.
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_DIR / ".env")


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "sim", "yes"}


class Settings:
    def __init__(self) -> None:
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = int(os.getenv("DB_PORT", "3306"))
        self.db_name = os.getenv("DB_NAME", "cupcakes_gourmet")
        self.db_user = os.getenv("DB_USER", "root")
        self.db_password = os.getenv("DB_PASSWORD", "")
        self.test_db_name = os.getenv("TEST_DB_NAME", "cupcakes_gourmet_test")

        self.secret_key = os.getenv("SECRET_KEY", "")
        self.session_https_only = _bool(os.getenv("SESSION_HTTPS_ONLY"), False)

        # RN-10: taxa de entrega fixa, definida pela loja na configuração
        self.taxa_entrega = Decimal(os.getenv("TAXA_ENTREGA", "8.00")).quantize(Decimal("0.01"))

        origins = os.getenv("CORS_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500")
        self.cors_origins = [o.strip() for o in origins.split(",") if o.strip()]

        self.frontend_dir = PROJECT_DIR / "frontend"
        self.schema_sql = PROJECT_DIR / "database" / "01_schema_mysql.sql"

    def database_url(self, db_name: str | None = None) -> str:
        from urllib.parse import quote_plus

        name = self.db_name if db_name is None else db_name
        return (
            f"mysql+pymysql://{quote_plus(self.db_user)}:{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{name}?charset=utf8mb4"
        )


settings = Settings()
