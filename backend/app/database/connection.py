"""Conexão com o MySQL via SQLAlchemy (driver PyMySQL)."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config.settings import settings

engine = create_engine(settings.database_url(), pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Dependência do FastAPI: abre uma sessão por requisição e sempre fecha."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
