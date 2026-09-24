# Registro de mudanças – Situação 2

Registro do que foi realmente feito na implementação, na ordem em que aconteceu.
Cada item corresponde a um commit do Git (`git log` mostra o histórico completo).
Data de todo o trabalho: 24/09/2026.

## 1. Estrutura do projeto
- Criada a estrutura `backend/`, `frontend/`, `database/`, `docs/`.
- Documentação da Situação 1 preservada sem alterações em `docs/situacao-1/`.
- `database/01_schema_mysql.sql` extraído da seção 14.5 do relatório (o arquivo separado
  não estava no pacote da Situação 1). Conteúdo idêntico ao relatório.
- `.gitignore`, `.env.example` e `DEVELOPMENT_NOTES.md` (auditoria inicial e decisões).

## 2. Banco de dados MySQL
- Script da Situação 1 executado pela primeira vez em MySQL real (8.0.46): sem erros,
  10 tabelas, 16 CHECKs. Resolve a pendência "Script testado no MySQL real".
- Conexão via SQLAlchemy + PyMySQL, com credenciais só no `.env`.
- Modelos SQLAlchemy mapeando as 10 tabelas existentes (sem criar nem alterar tabelas).
- `GET /api/saude` para conferir a conexão.
- `database/02_dados_iniciais.sql` (nome previsto na seção 20): categorias, produtos do
  protótipo, cupons e contas de teste. Corrigido problema de acentuação com `SET NAMES utf8mb4`.

## 3. Autenticação e autorização
- Cadastro (sempre CLIENTE), login, logout, `me`, edição de nome/telefone.
- Senha com bcrypt e regra RN-06; cookie de sessão assinado.
- Dependências de acesso: visitante, logado, só CLIENTE, só ADMIN.

## 4. Cardápio
- Listagem de ativos agrupados por categoria, busca sem acento (collation do MySQL),
  filtros combinados, detalhes com MSG-E15.

## 5. Carrinho e cupom
- Carrinho na sessão (classe transiente do diagrama), totais recalculados no servidor,
  limite de estoque, aviso de mudança de preço/indisponibilidade.
- Cupom na ordem do SD-03, com motivo da recusa.
- Corrigido: a sessão não era salva quando só um item interno do carrinho mudava.

## 6. Endereços
- CRUD com limite de 5, padrão único, CEP de 8 dígitos e UF válida.

## 7. Checkout, pagamento simulado e pedidos
- Criação do pedido AGUARDANDO_PAGAMENTO em transação; pagamento simulado (final 0000
  recusado); aprovação com trava de linhas, baixa de estoque, notificação e esvaziamento
  do carrinho; nova tentativa e troca de forma de pagamento no mesmo pedido.
- Cancelamento pelo cliente, histórico paginado, detalhe com linha do tempo, consulta
  de status para atualização a cada 30 s, repetir pedido, avaliação e notificações.

## 8. Administração
- Produtos: lista, cadastro, edição, desativar/reativar (sem exclusão).
- Pedidos: painel com filtro, detalhe e mudança de status pelo EST-01, detecção de
  alteração em outra aba (MSG-E14), devolução de estoque no cancelamento.

## 9. Testes automatizados (pytest)
- 156 testes contra banco MySQL de teste separado.
- Defeitos encontrados e corrigidos: validadores não rodavam em campos omitidos;
  preço do admin saía como número; `database_url("")` apontava para o banco principal.

## 10. Front-end
- 19 telas em HTML/CSS/JavaScript puro, mobile-first, seguindo o protótipo revisado.
- Componentes comuns da seção 10.1, mensagens do catálogo 10.4, estados de
  carregando/vazio/erro, confirmação em modal.
- O próprio back-end serve o front-end; rotas `/api` inexistentes respondem em JSON.
- Corrigido: o botão de limpar a busca aparecia mesmo com o campo vazio (regra global `[hidden]`).

## 11. Testes funcionais no navegador
- Script `tests/e2e/fluxos.mjs` com os 6 fluxos pedidos (48 passos) em Chromium:
  48/48 nos dois modos de execução. Capturas de tela reais em `docs/imagens/`.

## 12. Responsividade conforme o protótipo
- A barra inferior do protótipo (Início, Carrinho, Pedidos, Conta) deixou de virar menu
  no topo em telas largas: fica embaixo em todas as larguras (decisão D31).
- Auditoria em 390, 768 e 1366 px (`tests/e2e/responsivo.mjs`). Ajustes só de CSS:
  itens do cabeçalho e da barra alinhados à coluna de conteúdo em telas largas; item do
  carrinho sempre empilhado; área de toque de 44 px nos links do cabeçalho; cabeçalho do
  administrador sem rolagem lateral no celular. Resultado: 63/63 verificações OK.

## 13. Documentação
- README, manual do usuário, arquitetura, rastreabilidade, testes, status e situação do Git.

## 14. Acabamento visual (UI/UX) e nome oficial
- Nome oficial em todas as telas e títulos: **App de Cupcakes Gourmet** ("Cupcakes Gourmet"
  no cabeçalho de celulares com até 400 px). Documentos históricos não foram alterados.
- Paleta suave (terracota, creme, blush, sálvia) em variáveis `--color-*`; fonte Poppins
  guardada no projeto (`frontend/assets/fonts/`, licença OFL 1.1).
- Conjunto único de ícones SVG (`frontend/js/icones.js`), incluindo Crédito, Débito e PIX;
  nenhum símbolo Unicode ou emoji como ícone.
- Fotos reais para 5 produtos (enviadas pela aluna, recortadas 1:1, com miniaturas 320 px);
  imagem padrão `sem-imagem.svg` e troca automática quando uma imagem não carrega.
  Script opcional `database/03_imagens_produtos.sql` atualiza só `imagem_url` de bancos
  já criados (sem mudar tabelas).
- Barra inferior mantida (mesmos 4 itens, embaixo em todas as larguras), com indicador do
  item ativo e estados de toque, passar o mouse e foco.
- Transições rápidas entre páginas (View Transitions, 180 ms) e animações desligadas com
  `prefers-reduced-motion`. Sem atrasos artificiais.
- Refinos em cards, detalhes, carrinho, checkout, pagamento, linha do tempo, notificações,
  avisos, formulários, estrelas da avaliação e telas do administrador.
- Novo teste `tests/e2e/visual.mjs` (8 verificações). Documentação em
  [`ui-ux-polish.md`](ui-ux-polish.md), [`product-images-map.md`](product-images-map.md) e
  [`product-images-sources.md`](product-images-sources.md).
- Pendente: fotos de Chocolate Belga, Baunilha Clássico e Pistache Especial (os sites de
  imagens livres foram bloqueados neste ambiente; usam a imagem padrão).
