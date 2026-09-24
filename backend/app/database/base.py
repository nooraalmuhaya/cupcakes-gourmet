from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Classe base dos modelos. As tabelas já existem no MySQL (01_schema_mysql.sql);
    os modelos apenas mapeiam essas tabelas, não as criam."""
