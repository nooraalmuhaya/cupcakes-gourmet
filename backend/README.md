# Back-end – Cupcakes Gourmet

API REST em Python (FastAPI + SQLAlchemy + MySQL), organizada em MVC:
`models/` (Model), `services/` (regras de negócio), `routers/` (Controllers),
`schemas/` (validação), `security/` (senha e acesso), `database/`, `config/`, `utils/`.

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows  (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
cp ../.env.example .env            # e preencha
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
python -m pytest -q                # testes (usa o banco TEST_DB_NAME)
```

Documentação da API: http://127.0.0.1:8000/api/docs
Detalhes: [`../README.md`](../README.md) e [`../docs/arquitetura-situacao-2.md`](../docs/arquitetura-situacao-2.md).
