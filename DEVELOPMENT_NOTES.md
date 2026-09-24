# Notas de desenvolvimento – Situação 2

Este arquivo registra a auditoria feita antes de começar a implementação e as
decisões tomadas quando os artefatos da Situação 1 não definiam um detalhe
técnico. A fonte da verdade continua sendo o relatório
`docs/situacao-1/Situacao1_Revisao_Planejamento.docx` (e o PDF equivalente).

## 1. Auditoria inicial (antes de programar)

### A. Arquivos existentes
- Repositório Git vazio (sem commits), branch `claude/situacao-2-cupcakes-app-p46qpy`,
  remoto `origin` → `github.com/nooraalmuhaya/cupcakes-gourmet`.
- Arquivo `situacao-1.zip` enviado pela aluna com:
  - `Situacao1_Revisao_Planejamento.docx` / `.pdf` (relatório completo);
  - `pi-1/Projeto_Integrador_I.docx` (documento original do PI I);
  - `uml/` (casos de uso, classes, enums, SD-01, SD-02, SD-03, AD-01, EST-01, mapa de navegação – `.mmd` e `.png`);
  - `banco/` (DER conceitual e lógico – `.mmd` e `.png`);
  - `prototipo/` (PDF de 18 páginas, 33 telas PNG + fontes SVG, mapa navegacional);
  - `feedback-colegas/` (vazio – pendente, é da Situação 3).

### B. Tecnologias existentes
Nenhum código. O relatório define: web responsiva mobile-first, MVC, MySQL 8.0.16+,
HTML/CSS/JS no front-end, back-end "Java/Spring recomendado, PHP ou Python também atendem"
(seção 3.5 – "confirmar no início da Situação 2"). **Decisão: Python (FastAPI)**, conforme
pedido da aluna para a Situação 2.

### C. Front-end existente
Nenhum. Só o protótipo de média fidelidade (imagens). Nome da loja no protótipo: **Cupcake Haven**.

### D. Back-end existente
Nenhum.

### E. Banco existente
O script SQL está no relatório (seção 14.5) e foi citado como `01_schema_mysql.sql`,
mas o arquivo separado **não estava no zip**. Ele foi extraído do relatório sem
alterações para `database/01_schema_mysql.sql`. O relatório marcava como pendente
"Script testado no MySQL real" (seção 19): nesta etapa ele foi executado no
MySQL 8.0.46 sem nenhum erro (10 tabelas, 16 CHECKs, collation `utf8mb4_0900_ai_ci`).

### F. Documentação existente
Toda a documentação da Situação 1 foi copiada para `docs/situacao-1/` sem alterações.

### G. Requisitos da Situação 1 (resumo)
- 17 User Stories (US01–US17), 29 RF, 17 RNF, 23 regras de negócio (RN-01 a RN-23),
  16 casos de uso, 19 telas (T01–T15, A01–A04) + estados, catálogo de 40 mensagens
  (MSG-S/I/W/E), 6 status de pedido, 10 tabelas.

### H. O que faltava para a Situação 2
Tudo o que é implementação: back-end, front-end, integração com o MySQL,
dados iniciais (`02_dados_iniciais.sql`, previsto na seção 20), testes e documentação
de uso.

### I. Ordem de implementação
Seguiu as fases pedidas: estrutura → conexão MySQL → modelos e autenticação →
cardápio → carrinho → endereços/checkout → pagamento/pedido → acompanhamento,
histórico, notificações e avaliação → conta e ajuda → administração →
acabamento do front-end → testes → documentação → auditoria final.

## 2. Decisões tomadas (onde a Situação 1 não detalhava)

| # | Tema | Decisão | Justificativa |
|---|------|---------|---------------|
| D01 | Linguagem do back-end | Python 3 + FastAPI + SQLAlchemy + Pydantic + Uvicorn, driver PyMySQL. | Seção 3.5 deixava a escolha em aberto e cita Python como opção válida. |
| D02 | Organização MVC | Model = `models/` (SQLAlchemy) + `services/` (regras); Controller = `routers/`; View = `frontend/` (HTML/CSS/JS). `schemas/` valida entrada/saída. | Segue a seção 9.6 (MVC previsto). |
| D03 | Sessão / autenticação | Cookie de sessão assinado (`SessionMiddleware` do Starlette), guardando só o id do usuário, o carrinho e o cupom. Senha com **bcrypt**. | O relatório fala em "sessão" e em "carrinho da sessão" (classe transiente, sem tabela). Um cookie assinado atende as duas coisas sem criar tabelas novas. |
| D04 | Carrinho | Fica na sessão do servidor (não vai para o banco), funciona sem login e continua depois do login (US05 CA6). O preço do momento em que o item foi adicionado é guardado na sessão só para detectar mudança de preço (MSG-E07). | Seção 9.2 (Carrinho «transiente») e UC-08 E3. |
| D05 | Momento de criação do pedido | O pedido é criado (AGUARDANDO_PAGAMENTO + pagamento PENDENTE) quando o cliente clica pela primeira vez em "Confirmar pagamento" na T07, e o pagamento é processado logo em seguida. Novas tentativas usam o mesmo pedido. | É o que o SD-01 mostra (`POST /pedidos (idEndereco, metodo)`), e a coluna `pagamento.metodo` é NOT NULL, então o método precisa ser conhecido ao criar o pedido. Mantém o EST-01 (pedido existe antes do pagamento, P20). |
| D06 | Endpoint do cupom | `POST /api/carrinho/cupom` e `DELETE /api/carrinho/cupom`. | Nome usado no SD-03. |
| D07 | Exclusão de produto | Não existe endpoint DELETE de produto; só desativar/reativar. | RN-23 e US16 CA4. |
| D08 | Número do pedido | `CUP-AAAAMMDD-NNNN`, com NNNN sequencial dentro do dia (conta os pedidos do dia + 1; se houver colisão no UNIQUE, tenta de novo). | RN-13 define só o formato. |
| D09 | MSG-E14 (mudança não permitida / pedido alterado em outra aba) | O painel envia o status que está vendo (`status_atual`). Se no banco estiver diferente, ou a transição não for permitida pelo EST-01, a API responde 409 com MSG-E14. | UC-16 E1. |
| D10 | Cancelamento pelo cliente | `POST /api/pedidos/{id}/cancelar`, só em AGUARDANDO_PAGAMENTO; o carrinho não é alterado. | RN-14, RF-19, UC-09 E3. |
| D11 | Notificação no cancelamento pelo cliente | Também gera notificação. | RN-16: "toda mudança de status gera uma notificação". |
| D12 | Taxa de entrega | Variável `TAXA_ENTREGA` no `.env` (padrão R$ 8,00, valor do protótipo). | RN-10: "definida pela loja na configuração do sistema". |
| D13 | Validação do cartão | Validada no front-end **e** no back-end (16 dígitos, nome, MM/AA não vencida, CVV 3 dígitos). O número nunca é gravado nem registrado em log; o back-end só usa os 4 últimos dígitos para a regra "final 0000 = recusado". | RN-11, RNF-07, RNF-09. |
| D14 | Busca sem acento | Feita pelo próprio MySQL com `LIKE`, aproveitando a collation `utf8mb4_0900_ai_ci`. | Seção 14.1 do relatório. |
| D15 | Busca de CEP por API | **Não implementada** (era opcional – US14 CA6, seção 3.4). O CEP é validado pelo formato e o endereço é digitado. | Evita dependência externa. |
| D16 | Número do WhatsApp | Configurado em `frontend/js/config.js`. O valor do repositório é um **número fictício de demonstração** e precisa ser trocado pelo número real da loja. | Não inventar dados reais. |
| D17 | Horário de atendimento | Segunda a sábado, 9h às 19h (texto do protótipo T15), conferido pelo relógio do navegador. | RN-20. |
| D18 | Imagens dos produtos | Primeira versão: ilustrações SVG simples. Substituída pela D34. `imagem_url` guarda o caminho relativo. | Seção 3.3: sem upload; o admin informa o caminho. |
| D19 | Contas de administrador | Criadas pelo script `database/02_dados_iniciais.sql` (hash bcrypt de uma senha de desenvolvimento documentada no README). | RN-22. |
| D20 | Servidor do front-end | O próprio FastAPI serve a pasta `frontend/` (mesma origem, recomendado). Também funciona com `python -m http.server 5500`, com CORS liberado só para `localhost:5500` e `127.0.0.1:5500`. | Pedido da aluna + simplicidade. |
| D21 | Testes automatizados | pytest contra um banco MySQL separado (`cupcakes_gourmet_test`), criado com o mesmo `01_schema_mysql.sql`. **Não** se usa SQLite. | RNF-14 e pedido de usar o MySQL real. |
| D22 | Relógio | Datas gravadas com o horário local do servidor. | Projeto local, sem fuso configurável. |
| D23 | Rótulos dos botões de status (A02) | RECEBIDO → "Iniciar preparo"; EM_PREPARO → 'Marcar como "Saiu para entrega"'; SAIU_PARA_ENTREGA → 'Marcar como "Entregue"'. | Exemplos da seção 10.3 (A02) e do protótipo. |
| D24 | Horário de cada etapa na linha do tempo (T09) | Vem da data da notificação gerada naquela mudança de status. | O banco não tem tabela de histórico de status e o esquema não deveria ser alterado; RN-16 garante uma notificação por mudança. |
| D25 | Pagamento de pedido cancelado pelo administrador | O registro de pagamento continua APROVADO (não há estorno simulado). | Estorno não aparece em nenhum artefato da Situação 1; o pagamento é só uma simulação. |
| D26 | "Repetir pedido" | Aparece nos pedidos ENTREGUE (como no protótipo T10); adiciona até a quantidade disponível. | Protótipo T10 e RN-19. |
| D27 | "Esqueci minha senha" | Não implementado; a tela de login explica e aponta para Ajuda e Suporte. | Seção 3.3: recuperação de senha por e-mail está fora do escopo. |
| D28 | Administrador que abre telas de compra | Recebe MSG-E13 (não pode ter carrinho finalizado, endereços ou pedidos). | RN-22 e seção 9.2 ("administrador não tem endereços nem pedidos"). |
| D29 | Rota de sessão para o cabeçalho | `GET /api/sessao` devolve usuário, itens no carrinho e notificações não lidas em uma chamada. | RNF-17: contador atualizado ao abrir cada tela. |
| D30 | Testes funcionais no navegador | Executados por script (Playwright/Chromium), não por uma pessoa; o script está em `tests/e2e/`. | Deixa o resultado reproduzível. A aluna deve repetir o roteiro manualmente no ambiente dela. |
| D31 | Barra inferior em telas largas | Fica **embaixo em todas as larguras**, igual ao protótipo T01 (Início, Carrinho, Pedidos, Conta). Em telas largas só os itens se alinham à coluna central de conteúdo; não há desenho separado para computador. | Decisão da aluna após revisar o protótipo aprovado da Situação 1. Substitui a primeira versão, que transformava a barra em menu no topo a partir de 900 px (leitura do texto da seção 10.1). |
| D32 | Nome oficial | "App de Cupcakes Gourmet" em telas, títulos e documentação atual; "Cupcakes Gourmet" no cabeçalho de celulares com até 400 px. Documentos históricos e a Situação 1 não foram alterados. | Pedido da aluna no acabamento visual. |
| D33 | Paleta, fonte e ícones | Tokens `--color-*` (terracota, creme, blush, sálvia); Poppins guardada no projeto (sem CDN); ícones SVG próprios em `js/icones.js`; PIX é um desenho no estilo do símbolo, não o logotipo oficial. | Funciona sem internet e evita símbolos Unicode/emoji. |
| D34 | Fotos dos produtos | 5 fotos enviadas pela aluna, recortadas 1:1 + miniaturas; demais produtos com `sem-imagem.svg`. Os sites de imagens livres (Wikimedia, Openverse, Pexels, Unsplash) responderam 403 neste ambiente, então nenhuma foto foi usada sem licença verificada. Script `03_imagens_produtos.sql` atualiza só `imagem_url`. | Não inventar licenças nem imagens; não alterar o esquema. |
| D35 | Transições entre telas | View Transitions do navegador (180 ms) com animação de entrada como alternativa; desligadas com `prefers-reduced-motion`. Sem atrasos artificiais. | Pedido de transições rápidas mantendo o site multipágina. |
