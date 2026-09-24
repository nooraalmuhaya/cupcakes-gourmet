# Arquitetura – Situação 2

Documento técnico da implementação do App de Cupcakes Gourmet (Cupcake Haven).
Descreve como o que foi planejado na Situação 1 virou código.

## 1. Visão geral

```
 Navegador (celular ou computador)
   HTML + CSS + JavaScript (View)
          │  Fetch API (JSON) + cookie de sessão
          ▼
 FastAPI / Uvicorn (Python)
   routers/   → Controllers (recebem a requisição, validam com schemas/)
   services/  → Regras de negócio (Model)
   models/    → Classes mapeadas para as tabelas (Model, SQLAlchemy)
          │  SQLAlchemy + PyMySQL (consultas parametrizadas)
          ▼
 MySQL 8 – banco cupcakes_gourmet (10 tabelas da Situação 1)
```

É uma aplicação monolítica simples: um único servidor Python entrega a API
(`/api/...`) e também os arquivos do front-end (mesma origem). Não há microsserviços,
fila, cache ou WebSocket.

## 2. Organização MVC

A seção 9.6 do relatório da Situação 1 previa MVC. Na implementação:

| Camada (MVC) | Pasta | O que tem |
|--------------|-------|-----------|
| **Model** | `backend/app/models/` | 10 classes SQLAlchemy, uma por tabela (`Usuario`, `Endereco`, `Categoria`, `Produto`, `Cupom`, `Pedido`, `ItemPedido`, `Pagamento`, `Avaliacao`, `Notificacao`) e as enumerações do `dc_enums`. Métodos do diagrama de classes: `Produto.esta_disponivel`, `Cupom.esta_valido`, `Cupom.calcular_desconto`, `Endereco.formatar_texto`, `Pedido.calcular_total`, `ItemPedido.calcular_subtotal`. |
| **Model (serviços)** | `backend/app/services/` | Regras de negócio: `auth_service`, `produto_service`, `carrinho_service`, `cupom_service`, `endereco_service`, `pedido_service`, `pagamento_service` (simulação), `notificacao_service`, `avaliacao_service`. |
| **Controller** | `backend/app/routers/` | Rotas REST: `auth` (Auth/ContaController), `produtos` (CardapioController), `carrinho` (CarrinhoController), `enderecos`, `pedidos` (PedidoController), `pagamentos`, `notificacoes` (NotificacaoController), `admin` (AdminProduto/AdminPedidoController), `sessao`, `saude`. |
| **View** | `frontend/` | 19 telas HTML (T01–T15, A01–A04), CSS e um script JavaScript por tela. |

Pastas de apoio: `schemas/` (validação de entrada/saída com Pydantic), `security/`
(hash de senha e controle de acesso), `database/` (conexão), `config/` (variáveis de
ambiente) e `utils/` (catálogo de mensagens, erros e formatação).

## 3. Front-end

- **HTML5, CSS3 e JavaScript puro** (módulos ES + Fetch API). Nenhum framework.
- **Mobile-first**: layout pensado para 360 px ou mais; a partir de 900 px a barra
  inferior vira menu no topo. A área do administrador é pensada para computador.
- Arquivos:
  - `css/base.css` (cores, tipografia, estrutura), `css/components.css` (cabeçalho,
    barra inferior, botões, formulários, selos, toast, modal, carregando),
    `css/pages.css` (estilos de cada tela).
  - `js/api.js` – chamadas à API e tratamento de erro (`ApiError`).
  - `js/layout.js` – monta cabeçalho/barra/menu, contadores do sino e do carrinho e o
    controle de acesso das telas (sem login → T04 com MSG-I06; perfil errado → MSG-E13).
  - `js/ui.js` – formatação (R$, datas, CEP, telefone), toast de 3 s, modal de
    confirmação, estados de carregando/vazio/erro, erros abaixo dos campos, escape de HTML.
  - `js/config.js` – nome da loja, WhatsApp, horário de atendimento, intervalo de 30 s.
  - `js/nomes.js` – textos dos enums (status, forma de pagamento).
  - `js/pages/*.js` – um script por tela.
- Componentes comuns da seção 10.1 implementados: cabeçalho com sino e carrinho com
  contador, barra inferior com ícone + texto, toast, erro no campo, carregando (e botão
  desabilitado enquanto processa), modal de confirmação e página "não encontrada" (`404.html`).
- Todo texto vindo do banco é escapado antes de ir para o HTML (evita injeção de HTML).

### Mapa de telas

| Código | Arquivo | Script |
|--------|---------|--------|
| T01 Cardápio | `index.html` | `cardapio.js` |
| T02 Detalhes | `pages/produto.html` | `produto.js` |
| T03 Carrinho | `pages/carrinho.html` | `carrinho.js` |
| T04 Login | `pages/login.html` | `login.js` |
| T05 Cadastro | `pages/cadastro.html` | `cadastro.js` |
| T06 Checkout – Endereço | `pages/checkout.html` | `checkout.js` |
| T07 Pagamento | `pages/pagamento.html` | `pagamento.js` |
| T08 Confirmação | `pages/confirmacao.html` | `confirmacao.js` |
| T09 Acompanhar | `pages/acompanhar.html` | `acompanhar.js` |
| T10 Meus Pedidos | `pages/pedidos.html` | `pedidos.js` |
| T11 Avaliar | `pages/avaliar.html` | `avaliar.js` |
| T12 Minha Conta | `pages/conta.html` | `conta.js` |
| T13 Meus Endereços | `pages/enderecos.html` | `enderecos.js` |
| T14 Notificações | `pages/notificacoes.html` | `notificacoes.js` |
| T15 Ajuda e Suporte | `pages/ajuda.html` | `ajuda.js` |
| A01 Painel de Pedidos | `pages/admin/pedidos.html` | `admin/pedidos.js` |
| A02 Detalhe do Pedido | `pages/admin/pedido.html` | `admin/pedido.js` |
| A03 Produtos | `pages/admin/produtos.html` | `admin/produtos.js` |
| A04 Formulário de Produto | `pages/admin/produto.html` | `admin/produto-form.js` |

## 4. API

Todas as rotas ficam em `/api`. A documentação interativa (Swagger) fica em
`/api/docs` e o ReDoc em `/api/redoc`.

| Método | Rota | Grupo | Finalidade |
|--------|------|-------|------------|
| GET | `/api/saude` | Sistema | Verifica a API e a conexão com o MySQL |
| POST | `/api/auth/register` | Autenticação e conta | Cria conta de cliente e já faz o login (UC-05) |
| POST | `/api/auth/login` | Autenticação e conta | Login de cliente ou administrador (UC-06) |
| POST | `/api/auth/logout` | Autenticação e conta | Encerra a sessão (MSG-S06) |
| GET | `/api/auth/me` | Autenticação e conta | Usuário da sessão atual (null se não estiver logado) |
| PUT | `/api/conta` | Autenticação e conta | Edita nome e telefone (RF-12) |
| GET | `/api/sessao` | Autenticação e conta | Usuário logado, itens no carrinho e notificações não lidas |
| GET | `/api/produtos` | Cardápio | Lista o cardápio com busca e filtros (`busca`, `categoria`, `vegano`, `sem_gluten`) |
| GET | `/api/produtos/{id_produto}` | Cardápio | Detalhes de um produto ativo (UC-02) |
| GET | `/api/categorias` | Cardápio | Categorias do cardápio |
| GET | `/api/carrinho` | Carrinho e cupom | Itens, cupom e totais do carrinho (UC-03) |
| POST | `/api/carrinho/itens` | Carrinho e cupom | Adiciona produto (soma se já existir) |
| PUT | `/api/carrinho/itens/{id_produto}` | Carrinho e cupom | Altera a quantidade de um item |
| DELETE | `/api/carrinho/itens/{id_produto}` | Carrinho e cupom | Remove um item (MSG-S02) |
| POST | `/api/carrinho/cupom` | Carrinho e cupom | Aplica cupom – exige login (UC-04, SD-03) |
| DELETE | `/api/carrinho/cupom` | Carrinho e cupom | Remove o cupom aplicado |
| GET | `/api/enderecos` | Endereços | Lista os endereços do cliente (padrão primeiro) |
| POST | `/api/enderecos` | Endereços | Cadastra endereço (máximo 5 – RN-08) |
| PUT | `/api/enderecos/{id_endereco}` | Endereços | Edita um endereço |
| DELETE | `/api/enderecos/{id_endereco}` | Endereços | Exclui um endereço |
| PUT | `/api/enderecos/{id_endereco}/padrao` | Endereços | Marca como endereço padrão |
| POST | `/api/pedidos` | Pedidos do cliente | Cria o pedido a partir do carrinho (AGUARDANDO_PAGAMENTO) – UC-08, SD-01 |
| GET | `/api/pedidos` | Pedidos do cliente | Histórico do cliente, 10 por página (UC-12) |
| GET | `/api/pedidos/{id_pedido}` | Pedidos do cliente | Detalhes e linha do tempo (UC-10) |
| GET | `/api/pedidos/{id_pedido}/status` | Pedidos do cliente | Status atual – consultado a cada 30 segundos (SD-02) |
| POST | `/api/pedidos/{id_pedido}/cancelar` | Pedidos do cliente | Cliente cancela pedido que ainda aguarda pagamento (RF-19) |
| POST | `/api/pedidos/{id_pedido}/repetir` | Pedidos do cliente | Coloca no carrinho os itens disponíveis de um pedido antigo (RF-24) |
| POST | `/api/pedidos/{id_pedido}/avaliacao` | Pedidos do cliente | Avalia um pedido entregue (UC-13, RN-17) |
| GET | `/api/pedidos/{id_pedido}/avaliacao` | Pedidos do cliente | Avaliação do pedido (null se ainda não foi avaliado) |
| POST | `/api/pagamentos` | Pagamento (simulado) | Processa o pagamento simulado do pedido (RN-11) |
| GET | `/api/notificacoes` | Notificações | Notificações do cliente, mais recentes primeiro |
| GET | `/api/notificacoes/nao-lidas` | Notificações | Quantidade de não lidas (contador do sino) |
| PUT | `/api/notificacoes/lidas` | Notificações | Marca todas como lidas |
| PUT | `/api/notificacoes/{id_notificacao}/lida` | Notificações | Marca uma notificação como lida |
| GET | `/api/admin/produtos` | Administração | Todos os produtos, ativos e inativos (A03) |
| POST | `/api/admin/produtos` | Administração | Cadastra produto (A04) |
| GET | `/api/admin/produtos/{id_produto}` | Administração | Dados de um produto para edição |
| PUT | `/api/admin/produtos/{id_produto}` | Administração | Edita produto, inclusive preço e estoque (A04) |
| PATCH | `/api/admin/produtos/{id_produto}/situacao` | Administração | Desativa ou reativa produto (RN-23: não há exclusão) |
| GET | `/api/admin/pedidos` | Administração | Painel de pedidos com filtro por status (A01) |
| GET | `/api/admin/pedidos/{id_pedido}` | Administração | Detalhe do pedido com cliente, pagamento, cupom e avaliação (A02) |
| PUT | `/api/admin/pedidos/{id_pedido}/status` | Administração | Muda para o próximo status permitido ou cancela (UC-16, SD-02, RN-14, RN-15) |

Diferenças em relação à lista de exemplo do enunciado, seguindo a Situação 1:
cupom em `/api/carrinho/cupom` (nome do SD-03); **não existe** `DELETE` de produto
(RN-23 – só desativar); o pagamento fica em `/api/pagamentos` e recebe o `id_pedido`.

### Formato das respostas de erro

```json
{ "detail": "Só temos 8 unidades deste cupcake no momento.",
  "codigo": "MSG-E06", "campo": "quantidade" }
```

Em erros de validação (HTTP 422) vem também `erros: [{campo, mensagem}]`, para o
front-end mostrar cada mensagem abaixo do campo certo.

| HTTP | Quando |
|------|--------|
| 401 | Precisa de login (MSG-I06), login inválido (MSG-E01), cupom sem login (MSG-E09) |
| 402 | Pagamento recusado (MSG-E10) |
| 403 | Sem permissão (MSG-E13): outro perfil ou dado de outro cliente |
| 404 | Não encontrado (ex.: MSG-E15) |
| 405 | Método não permitido |
| 409 | Conflito de regra: estoque (MSG-E06), carrinho mudou (MSG-E07), limite de endereços (MSG-E16), nome repetido (MSG-E17), transição inválida (MSG-E14), avaliação não permitida (MSG-E20), e-mail já cadastrado (MSG-E02) |
| 422 | Dados inválidos (MSG-E03, E04, E05, E08, E11, E12, E19, E21...) |
| 500 | Erro inesperado: só a MSG-E18 vai para o usuário; o detalhe fica no log do servidor |

## 5. Banco de dados

- **MySQL 8.0** (testado com 8.0.46), banco `cupcakes_gourmet`, `utf8mb4_0900_ai_ci`, InnoDB.
- Script `database/01_schema_mysql.sql` = seção 14.5 do relatório da Situação 1,
  **sem alterações** de tabelas, colunas, chaves, CHECKs ou índices.
- Os modelos SQLAlchemy **não criam** tabelas; eles apenas mapeiam as existentes.
- `database/02_dados_iniciais.sql`: categorias, produtos, cupons e as contas de teste
  (senhas só em hash bcrypt). Pode ser executado mais de uma vez.
- Carrinho e ItemCarrinho continuam **fora do banco** (classes transientes da seção
  9.2): ficam na sessão.
- Regras que o relatório (seção 14.4) deixou para a aplicação foram implementadas nos
  serviços: limite de 5 endereços e um padrão, cupom uma vez por conta, transições de
  status, devolução de estoque no cancelamento, avaliação só de pedido entregue e
  administrador sem endereços/pedidos.

## 6. Autenticação

- Cadastro público sempre cria perfil **CLIENTE** (RN-22). O administrador é criado por script.
- Senha: regra RN-06 (8+ caracteres, letra e número) e hash **bcrypt** (RNF-06).
- Sessão: cookie `cupcakes_sessao`, **assinado** com a `SECRET_KEY` do `.env`
  (`SessionMiddleware`), `HttpOnly`, `SameSite=Lax`, validade de 1 dia, e `Secure`
  quando `SESSION_HTTPS_ONLY=true`. A sessão guarda só o id do usuário, o carrinho e o
  código do cupom. Um cookie alterado é recusado.
- Login inválido sempre responde MSG-E01, sem dizer se o erro foi no e-mail ou na senha.

## 7. Autorização (RF-11, RNF-08)

Dependências em `security/auth.py`:

| Dependência | Uso |
|-------------|-----|
| `usuario_opcional` | Cardápio e carrinho (funcionam sem login – RN-07) |
| `usuario_logado` | Perfil (`PUT /api/conta`) |
| `cliente_logado` | Endereços, pedidos, pagamento, avaliação e notificações – só perfil CLIENTE |
| `admin_logado` | Todas as rotas `/api/admin/...` – só perfil ADMIN |

Além do perfil, os serviços conferem se o pedido, endereço ou notificação pertence ao
usuário logado; se não pertencer, respondem 403 com MSG-E13.

## 8. Principais fluxos

### 8.1 Finalizar pedido (SD-01, UC-08, UC-09)

1. T06: o cliente escolhe o endereço (o padrão já vem marcado).
2. T07: ao clicar em "Confirmar pagamento" pela primeira vez, o front-end chama
   `POST /api/pedidos` (endereço + forma de pagamento). O serviço recalcula o carrinho
   com os dados do banco, revalida estoque, preço e cupom (MSG-E07 se algo mudou) e
   grava **em uma transação** o pedido `AGUARDANDO_PAGAMENTO`, os itens com o preço do
   momento e o pagamento `PENDENTE`.
3. Em seguida chama `POST /api/pagamentos`. A simulação aprova, exceto cartão com
   final 0000.
   - **Recusado:** pagamento `RECUSADO`, resposta 402 (MSG-E10). O cliente pode tentar
     de novo, trocar a forma de pagamento (o mesmo pedido é reaproveitado) ou cancelar.
   - **Aprovado:** em uma transação, trava as linhas dos produtos (`SELECT ... FOR UPDATE`),
     confere o estoque, baixa o estoque, marca o pagamento `APROVADO`, o pedido `RECEBIDO`
     e cria a notificação. Depois esvazia o carrinho.
4. T08 mostra o número `CUP-AAAAMMDD-NNNN`.

### 8.2 Atualizar status (SD-02, UC-16)

1. A02 mostra só o botão do próximo status permitido (EST-01) e "Cancelar" quando permitido.
2. `PUT /api/admin/pedidos/{id}/status` envia o novo status e o status que a tela
   mostrava. O serviço trava a linha do pedido; se o status mudou em outra aba ou a
   transição não é permitida, responde MSG-E14.
3. Cancelamento em RECEBIDO/EM_PREPARO devolve as quantidades ao estoque (RN-15).
4. Toda mudança cria uma notificação (RN-16).
5. A tela T09 do cliente consulta `GET /api/pedidos/{id}/status` a cada 30 s e recarrega
   a linha do tempo quando o status muda.

### 8.3 Aplicar cupom (SD-03, UC-04)

Exige login (MSG-E09). Ordem das verificações: existe → ativo → dentro da validade →
não usado por esta conta em pedido não cancelado. O desconto é limitado ao subtotal e
não vale para a taxa de entrega. O cupom fica na sessão e só é gravado quando o pedido é criado.

### Transições de status implementadas (EST-01)

| De | Para | Quem |
|----|------|------|
| AGUARDANDO_PAGAMENTO | RECEBIDO | Sistema (pagamento aprovado) |
| AGUARDANDO_PAGAMENTO | CANCELADO | Cliente |
| RECEBIDO | EM_PREPARO ou CANCELADO | Administrador |
| EM_PREPARO | SAIU_PARA_ENTREGA ou CANCELADO | Administrador |
| SAIU_PARA_ENTREGA | ENTREGUE | Administrador |

## 9. Tratamento de erros

- **Back-end:** `utils/erros.py` tem a classe `AppError` (erro de regra de negócio com
  código do catálogo) e tratadores para validação (422 em português, campo a campo),
  HTTP e erro inesperado (500 com MSG-E18, sem stack trace; o detalhe vai só para o log).
- **Front-end:** `api.js` transforma qualquer falha em `ApiError`; falta de conexão
  vira MSG-E18. As telas mostram: erro abaixo do campo, alerta no topo do formulário,
  toast, ou estado de erro com "Tentar novamente". Na T09, falha na consulta automática
  mantém o último status e mostra MSG-W03.
- Validação em **dois lugares**: no navegador (resposta rápida) e no servidor (RNF-09).

## 10. Segurança (resumo)

| Item | Como |
|------|------|
| Senhas | bcrypt; nunca em texto puro |
| SQL Injection | Só SQLAlchemy com parâmetros; o termo de busca tem `%` e `_` escapados |
| Dados de cartão | Validados e descartados; não vão para o banco nem para o log (só o final é usado na simulação) |
| Segredos | `.env` fora do Git; `.env.example` sem valores reais |
| Controle de acesso | No back-end (não depende do front-end) |
| XSS | Textos escapados antes de ir para o HTML |
| CORS | Liberado só para `localhost:5500` e `127.0.0.1:5500` (configurável) |
| HTTPS | Recomendado ao publicar (`SESSION_HTTPS_ONLY=true`); em ambiente local, HTTP (RNF-10) |

## 11. Testes

- 156 testes automatizados (pytest) contra um banco MySQL de teste separado.
- 48 passos dos 6 fluxos principais executados em navegador (Chromium) por script.
- Resultados completos: [`testes-situacao-2.md`](testes-situacao-2.md).

## 12. Execução local

Veja o [`README.md`](../README.md) (seções 7 a 11). Resumo:

```bash
mysql -u root -p < database/01_schema_mysql.sql
mysql -u root -p < database/02_dados_iniciais.sql
cp .env.example backend/.env      # e editar
cd backend && python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# abrir http://127.0.0.1:8000
```
