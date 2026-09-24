# App de Cupcakes Gourmet

Projeto Integrador Transdisciplinar em Engenharia de Software II – Cruzeiro do Sul Virtual
Aluna: Noora Gamil Al Muhaya

> **Situação 2 – Desenvolvimento.** Este repositório contém a implementação do que foi
> planejado na Situação 1 (documentação em [`docs/situacao-1/`](docs/situacao-1/)).
> Os testes com colegas/usuários são da Situação 3 e **ainda não foram feitos**.

![Cardápio no celular](docs/imagens/T01_cardapio.png)

## 1. Descrição

Aplicação web responsiva (pensada primeiro para o celular) de uma loja de cupcakes
gourmet. O cliente vê o cardápio, monta o carrinho, paga (pagamento **simulado**) e
acompanha o pedido. O administrador da loja cadastra produtos, controla o estoque e
atualiza o status dos pedidos.

## 2. Objetivo

Implementar o sistema especificado na Situação 1 (17 User Stories, 29 requisitos
funcionais, 23 regras de negócio, 19 telas e o banco MySQL com 10 tabelas), usando
HTML, CSS e JavaScript no front-end, Python com organização MVC no back-end e MySQL
como banco de dados.

## 3. Funcionalidades implementadas

**Cliente**
- Cardápio agrupado por categoria, com selo "Indisponível" (US01)
- Detalhes do produto com ingredientes e alérgenos (US02)
- Filtros por categoria, vegano e sem glúten, combináveis (US03)
- Busca por nome sem diferenciar maiúsculas e acentos (US04)
- Carrinho: adicionar, alterar quantidade, remover, totais e taxa de entrega (US05)
- Cadastro, login, logout e edição de nome/telefone (US06)
- Pagamento **simulado** com crédito, débito ou PIX (US07)
- Checkout com endereço e número do pedido `CUP-AAAAMMDD-NNNN` (US08)
- Cupom de desconto (US09)
- Acompanhamento do pedido com linha do tempo, atualizado a cada 30 segundos (US10)
- Histórico de pedidos (10 por página) e "Repetir pedido" (US11)
- Avaliação do pedido entregue (US12)
- Notificações dentro do app com contador no sino (US13)
- Até 5 endereços, com endereço padrão (US14)
- Ajuda e suporte: perguntas frequentes, horário e link do WhatsApp (US15)

**Administrador**
- Gerenciar produtos: cadastrar, editar, ajustar estoque, desativar/reativar (US16)
- Gerenciar pedidos: painel com filtro por status, detalhe e mudança de status (US17)

Veja o que ficou fora do escopo na seção 17 (Observações).

## 4. Tecnologias utilizadas

| Camada | Tecnologia |
|--------|------------|
| Front-end (View) | HTML5, CSS3, JavaScript puro (módulos ES e Fetch API) – sem framework; fonte Poppins (arquivos locais, licença OFL); ícones SVG próprios |
| Back-end (Controller + Model) | Python 3.11, FastAPI, SQLAlchemy 2, Pydantic 2, Uvicorn |
| Banco de dados | MySQL 8.0 (8.0.16 ou superior), driver PyMySQL |
| Segurança | bcrypt (hash de senha), cookie de sessão assinado (itsdangerous) |
| Testes | pytest + httpx (back-end); Playwright/Chromium (fluxos no navegador, opcional) |

Lista completa de bibliotecas com versões: [`backend/requirements.txt`](backend/requirements.txt).

## 5. Estrutura do projeto

```
cupcakes-gourmet/
├── backend/                  Back-end Python (API REST + regras de negócio)
│   ├── app/
│   │   ├── main.py           Cria a aplicação, middlewares e rotas
│   │   ├── config/           Leitura do .env
│   │   ├── database/         Conexão com o MySQL
│   │   ├── models/           Model: 10 classes mapeadas para as tabelas
│   │   ├── schemas/          Validação de entrada e saída (Pydantic)
│   │   ├── routers/          Controllers (rotas /api/...)
│   │   ├── services/         Regras de negócio (carrinho, cupom, pedido, pagamento...)
│   │   ├── security/         Hash de senha, sessão e controle de acesso
│   │   └── utils/            Catálogo de mensagens, erros e formatação
│   ├── tests/                Testes automatizados (pytest)
│   └── requirements.txt
├── frontend/                 View: HTML, CSS e JavaScript
│   ├── index.html            T01 – Cardápio
│   ├── pages/                T02–T15 e pages/admin/ (A01–A04)
│   ├── css/                  base.css, components.css, pages.css
│   ├── js/                   api.js, ui.js, layout.js, config.js e js/pages/*
│   └── assets/               Fotos dos produtos, fonte Poppins e ícone
├── database/
│   ├── 01_schema_mysql.sql   Script da Situação 1 (sem alterações)
│   ├── 02_dados_iniciais.sql Categorias, produtos, cupons e contas de teste
│   └── 03_imagens_produtos.sql Atualiza os caminhos das fotos (bancos já populados)
├── docs/                     Documentação (Situação 1 e Situação 2)
├── tests/e2e/                Testes no navegador: fluxos.mjs, responsivo.mjs, visual.mjs (opcional)
├── .env.example
└── README.md
```

## 6. Pré-requisitos

- Python 3.10 ou superior (testado com 3.11)
- MySQL Server 8.0.16 ou superior (testado com 8.0.46)
- Um navegador atualizado (Chrome, Edge ou Firefox)

## 7. Configuração do MySQL

1. Crie o banco e as tabelas com o script da Situação 1:
   ```bash
   mysql -u root -p < database/01_schema_mysql.sql
   ```
   > Se o banco `cupcakes_gourmet` já foi criado antes, **não** rode esse script de novo
   > (ele usaria `CREATE TABLE` em tabelas que já existem). Pule para o passo 2.
2. Insira os dados iniciais (pode rodar mais de uma vez sem duplicar nada):
   ```bash
   mysql -u root -p < database/02_dados_iniciais.sql
   ```
   Se o banco já tinha recebido o `02_dados_iniciais.sql` de uma versão anterior,
   rode também o `03_imagens_produtos.sql` (só atualiza o caminho das fotos):
   ```bash
   mysql -u root -p < database/03_imagens_produtos.sql
   ```
3. (Opcional, recomendado) Crie um usuário só para a aplicação:
   ```sql
   CREATE USER 'cupcakes_app'@'localhost' IDENTIFIED BY 'escolha_uma_senha';
   GRANT ALL PRIVILEGES ON cupcakes_gourmet.* TO 'cupcakes_app'@'localhost';
   GRANT ALL PRIVILEGES ON cupcakes_gourmet_test.* TO 'cupcakes_app'@'localhost';
   ```

No Windows, os comandos acima podem ser executados no "MySQL Command Line Client" com
`SOURCE C:/caminho/para/database/01_schema_mysql.sql;` ou pelo MySQL Workbench
(File → Open SQL Script → Execute).

## 8. Configuração do `.env`

Copie o arquivo de exemplo para a pasta `backend` e preencha os valores:

```bash
cp .env.example backend/.env          # Windows: copy .env.example backend\.env
```

| Variável | Para que serve |
|----------|----------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexão com o MySQL |
| `TEST_DB_NAME` | Banco usado **só** pelos testes (precisa ser diferente de `DB_NAME`) |
| `SECRET_KEY` | Chave que assina o cookie de sessão. Gere com `python -c "import secrets; print(secrets.token_hex(32))"` |
| `SESSION_HTTPS_ONLY` | `true` só quando publicado com HTTPS |
| `TAXA_ENTREGA` | Taxa de entrega fixa em reais (RN-10). Padrão `8.00` |
| `CORS_ORIGINS` | Origens liberadas quando o front-end roda em outra porta |

O arquivo `.env` **não** vai para o Git (está no `.gitignore`).

## 9. Instalação do back-end

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

## 10. Execução do back-end

Dentro da pasta `backend`, com o ambiente virtual ativo:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Confira: <http://127.0.0.1:8000/api/saude> deve mostrar `"banco": "ok"`.

## 11. Execução do front-end

**Opção A (recomendada):** o próprio back-end já entrega o front-end. Abra
<http://127.0.0.1:8000> no navegador.

**Opção B:** servidor HTTP separado (com o back-end rodando na porta 8000):

```bash
cd frontend
python -m http.server 5500
```

Abra <http://localhost:5500> (ou <http://127.0.0.1:5500>). O front-end chama a API na
porta 8000 do mesmo endereço; o CORS está liberado só para essas duas origens.

> Não abra o `index.html` com duplo clique (`file://`): os módulos JavaScript e o
> cookie de sessão precisam de um servidor HTTP.

## 12. Usuários de teste

Criados pelo `02_dados_iniciais.sql`. **São contas de desenvolvimento/teste**, com
e-mails do domínio reservado `example.com`; troque ou remova antes de publicar.

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | `admin@example.com` | `Admin2026` |
| Cliente | `cliente@example.com` | `Cliente2026` |

Cupons de exemplo: `BEMVINDO10` (10%), `DOCE5` (R$ 5,00), `NATAL2025` (vencido),
`PAUSADO20` (inativo). Cartão de teste: qualquer número de 16 dígitos é aprovado;
final **0000** é sempre recusado (RN-11). PIX é aprovado ao clicar em "Simular pagamento PIX".

## 13. Documentação da API

Com o back-end rodando:

- Swagger UI: <http://127.0.0.1:8000/api/docs>
- ReDoc: <http://127.0.0.1:8000/api/redoc>
- OpenAPI (JSON): <http://127.0.0.1:8000/api/openapi.json>

Lista das rotas em [`docs/arquitetura-situacao-2.md`](docs/arquitetura-situacao-2.md#4-api).

## 14. Manual do usuário

[`docs/manual-do-usuario.md`](docs/manual-do-usuario.md) – passo a passo com capturas
de tela reais do sistema.

## 15. Execução dos testes

```bash
cd backend
python -m pytest -q
```

Os testes usam um banco MySQL separado (`TEST_DB_NAME`, padrão `cupcakes_gourmet_test`),
criado automaticamente a partir do `01_schema_mysql.sql`. O usuário do `.env` precisa
de permissão nesse banco. **Não use o nome do banco principal** – os testes apagam os
dados do banco de teste.

Resultado da última execução: **156 testes, todos passando**. Detalhes e testes
funcionais no navegador: [`docs/testes-situacao-2.md`](docs/testes-situacao-2.md).

## 16. Estrutura do banco

10 tabelas (projeto físico da Situação 1, seção 14): `usuario`, `endereco`,
`categoria`, `produto`, `cupom`, `pedido`, `item_pedido`, `pagamento`, `avaliacao`,
`notificacao`. O banco não foi alterado na Situação 2. O dicionário de dados e os
diagramas estão em [`docs/situacao-1/`](docs/situacao-1/).

## 17. Observações

- **Pagamento simulado**: nenhum valor real é cobrado e nenhum dado de cartão é gravado.
- **Fora do escopo** (decidido na Situação 1, seção 3.3): app nativo e push, gateway
  real, login social, entregador/GPS, chat em tempo real, **recuperação de senha por
  e-mail** e envio real de e-mails, tela de cupons para o admin (cupons são inseridos
  por SQL), upload de imagens (o admin informa o caminho da imagem) e exclusão da conta.
- **Busca de CEP por API**: era opcional e não foi implementada; o endereço é digitado.
- O número do WhatsApp em `frontend/js/config.js` é **fictício** e deve ser trocado pelo
  número real da loja.
- Fotos dos produtos: 5 produtos usam fotos fornecidas pela aluna; **Chocolate Belga, Baunilha Clássico e
  Pistache Especial ainda não têm foto** e mostram a imagem padrão (ver
  [`docs/product-images-map.md`](docs/product-images-map.md)).
- Identidade visual (cores, fonte, ícones, transições): [`docs/ui-ux-polish.md`](docs/ui-ux-polish.md).
- Decisões de implementação: [`DEVELOPMENT_NOTES.md`](DEVELOPMENT_NOTES.md).
- Status de cada item: [`docs/STATUS_SITUACAO_2.md`](docs/STATUS_SITUACAO_2.md).

## 18. Repositório

GitHub: <https://github.com/nooraalmuhaya/cupcakes-gourmet>
(o desenvolvimento da Situação 2 está no branch `claude/situacao-2-cupcakes-app-p46qpy`;
veja [`docs/git-status-situacao-2.md`](docs/git-status-situacao-2.md)).
