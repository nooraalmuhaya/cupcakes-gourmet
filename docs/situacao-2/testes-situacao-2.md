# Testes – Situação 2

Este documento registra **somente testes que foram executados de verdade**, com o
resultado obtido. Os testes com usuários (colegas) são da **Situação 3** e **não**
foram feitos nesta etapa.

## 1. Ambiente usado nos testes

| Item | Versão |
|------|--------|
| Sistema operacional | Ubuntu 24.04 (contêiner de desenvolvimento) |
| Python | 3.11.15 |
| MySQL | 8.0.46 (Community, pacote do Ubuntu) |
| Navegador dos testes funcionais | Chromium (Playwright 1.56.1, Node.js 22) em modo *headless* |
| Data da execução | 24/09/2026 |

> Os testes **não** foram executados no Windows nem no computador da aluna.
> Recomenda-se repetir o roteiro da seção 4 manualmente no ambiente dela antes da gravação do vídeo.

## 2. Verificação do banco de dados (script da Situação 1)

O relatório da Situação 1 deixou como pendente "Script testado no MySQL real" (seção 19).

| Verificação | Como | Resultado |
|-------------|------|-----------|
| `database/01_schema_mysql.sql` executa sem erro no MySQL 8 | `mysql -u root < database/01_schema_mysql.sql` | **PASS** – 10 tabelas criadas |
| Restrições CHECK existem | consulta em `information_schema.CHECK_CONSTRAINTS` | **PASS** – 16 CHECKs (`ck_usuario_perfil` ... `ck_avaliacao_nota`) |
| Collation do banco | `information_schema.SCHEMATA` | **PASS** – `utf8mb4_0900_ai_ci` |
| Busca ignora acento/maiúsculas | `SELECT nome FROM produto WHERE nome LIKE '%limao%'` | **PASS** – retorna "Limão Siciliano" |
| `database/02_dados_iniciais.sql` pode ser executado 2 vezes sem duplicar | executado duas vezes seguidas | **PASS** – 8 produtos, 4 cupons, 2 usuários |
| Conexão da API com o MySQL | `GET /api/saude` | **PASS** – `{"banco":"ok","mysql":"8.0.46...","tabelas_faltando":[]}` |

**Problema encontrado e corrigido:** na primeira carga dos dados iniciais, o cliente
`mysql` usou `latin1` por padrão e gravou "LimÃ£o" (texto com codificação dupla).
Foi adicionado `SET NAMES utf8mb4;` no início do `02_dados_iniciais.sql`; depois
disso os acentos foram gravados corretamente e a busca "limao" passou a funcionar.

## 3. Testes automatizados do back-end (pytest)

- Local: `backend/tests/`
- Banco: MySQL real, em um banco **separado** (`cupcakes_gourmet_test`) criado com o
  mesmo `01_schema_mysql.sql`. Nenhum teste usa SQLite. Os testes se recusam a rodar
  se `TEST_DB_NAME` for igual a `DB_NAME`.
- Comando: `cd backend && python -m pytest -q`

### Resultado da última execução

```
156 passed, 1 warning in 59.22s
```

O único aviso (*warning*) é um aviso de depreciação interno da biblioteca de testes
(`starlette.testclient` + `httpx`), sem relação com o código do projeto.

### O que cada arquivo testa

| Arquivo | Testes | Conteúdo |
|---------|-------:|----------|
| `test_regras.py` | 31 | Regras puras, sem banco: regra de senha (RN-06), hash bcrypt, cálculo do cupom e limite no subtotal (RN-09), validade do cupom, disponibilidade do produto, transições de status permitidas (EST-01), simulação de pagamento (RN-11), validação do cartão (MSG-E11), formatação do endereço e da moeda |
| `test_auth.py` | 16 | Cadastro com sucesso, senha gravada como hash, cadastro público nunca cria ADMIN (RN-22), e-mail duplicado (MSG-E02), senha fraca (MSG-E03), senhas diferentes (MSG-E19), campos obrigatórios, login com sucesso, senha errada e conta inexistente com a mesma mensagem (MSG-E01), logout (MSG-S06), rota protegida sem login (MSG-I06), edição de nome/telefone, cookie adulterado |
| `test_produtos.py` | 12 | Só ativos no cardápio (RN-01), agrupamento por categoria, selo indisponível (RN-02), busca sem acento (RN-05), mínimo de 2 letras, busca sem resultado, filtros combinados (US03), detalhes, produto inexistente/inativo (MSG-E15) |
| `test_carrinho.py` | 22 | Adicionar sem login (RN-07), somar quantidade, limite do estoque (MSG-E06), produto sem estoque/inativo, quantidade inválida, recalcular totais, remover (MSG-S02), carrinho continua após login (US05 CA6), item que ficou indisponível e mudança de preço (MSG-E07), cupom sem login (MSG-E09), cupom válido R$ 3,90 (MSG-S04), desconto não passa do subtotal, motivos do MSG-E08, troca e remoção do cupom |
| `test_enderecos.py` | 10 | Primeiro vira padrão (MSG-S03), CEP inválido (MSG-E04), UF inválida, limite de 5 (MSG-E16), só um padrão, excluir o padrão passa para o mais antigo, editar, cliente não mexe no endereço de outro (MSG-E13), exige login, admin não tem endereços |
| `test_pedidos.py` | 35 | Criação AGUARDANDO_PAGAMENTO, valores com cupom, número CUP-AAAAMMDD-NNNN sequencial, carrinho vazio, sem endereço, endereço de outro cliente, método inválido, revalidação de estoque e preço (MSG-E07), pagamento aprovado (baixa estoque, notificação, esvazia carrinho), recusado final 0000 (MSG-E10), nova tentativa com PIX, cartão inválido (MSG-E11), cartão não é gravado, pedido de outro cliente, pagar duas vezes, estoque que acabou antes do pagamento (transação desfeita), cancelamento pelo cliente, cupom liberado após cancelamento, histórico 10 por página, linha do tempo, consulta de status, acesso a pedido de outro (MSG-E13), repetir pedido (MSG-S09/W01), avaliação (MSG-S07, MSG-E20, MSG-E12, limite de 500), notificações |
| `test_admin.py` | 19 | Cliente e visitante não acessam o admin (MSG-E13), lista ativos e inativos, criar produto (MSG-S10) com texto padrão de alérgenos (RN-03), validações (MSG-E05/E21), nome repetido (MSG-E17), editar preço sem mudar pedido antigo (RN-21), desativar/reativar sem apagar (RN-23), não existe exclusão, painel com filtro, detalhe, avançar status (MSG-S08) com notificação, transição inválida e "outra aba" (MSG-E14), cancelamento devolve estoque (RN-15), não cancela após "saiu para entrega", campos omitidos viram erro 422 |
| `test_banco.py` | 11 | `/api/saude`, collation sem acento, CHECKs do MySQL (estoque negativo, preço zero, perfil inválido, percentual > 100, total inconsistente, status inválido), e-mail único, produto vendido não pode ser apagado, uma avaliação por pedido |

### Defeitos encontrados pelos testes automatizados (e corrigidos)

| Defeito | Correção |
|---------|----------|
| Campos com valor padrão ausentes do JSON (ex.: `nota`, `preco`, `id_endereco`) não passavam pelos validadores; faltar a nota gerava erro do banco e aparecia a mensagem errada (MSG-E20) | `validate_default=True` nos campos; teste de regressão `test_campos_omitidos_viram_erro_de_validacao_e_nao_erro_500` |
| Respostas de produto do admin devolviam o preço como número (`11.9`) e não como texto (`"11.90"`) | `response_model` nas rotas de produto do admin |
| `database_url("")` usava o banco principal em vez de nenhum banco | condição `is None` em `settings.py` |
| Teste lia o estoque "antigo" por causa do isolamento REPEATABLE READ do MySQL | o teste passou a encerrar a transação (`rollback`) antes de ler de novo (era um problema do teste, não da aplicação) |

Durante o desenvolvimento também foi encontrado (antes dos testes automatizados) que o
carrinho não era salvo na sessão quando só um item interno mudava; a versão do
Starlette usada só salva a sessão quando uma chave de primeiro nível é atribuída.
Corrigido em `carrinho_service.py` (`_ler` / `_gravar`).

## 4. Testes funcionais do front-end (6 fluxos)

### Como foram executados

Os fluxos foram executados em um **navegador real (Chromium)**, controlado por um
**script automatizado** (`tests/e2e/fluxos.mjs`), e **não por uma pessoa**. O script
clica, digita e confere na tela as mensagens, contadores, redirecionamentos e
valores. Ele foi rodado nos dois modos de execução documentados no README:

| Modo | Endereço | Resultado |
|------|----------|-----------|
| Front-end servido pelo próprio back-end | `http://127.0.0.1:8000` | **48 PASS / 0 FAIL**, 0 erros de JavaScript |
| Front-end em `python -m http.server 5500` + API na porta 8000 (CORS) | `http://127.0.0.1:5500` | **48 PASS / 0 FAIL**, 0 erros de JavaScript |

**Primeira execução:** 45 PASS e 3 FAIL. As 3 falhas eram do próprio script de teste:
o valor em reais formatado pelo navegador usa um espaço não separável
("R$&nbsp;47,00"), e o script comparava com um espaço comum. A tela estava certa. O
script foi corrigido (normaliza o espaço) e todas as execuções seguintes passaram.
As capturas de tela em `docs/imagens/` são da última execução.

Tela de celular usada: 390 × 844 px. Administração: 1280 × 860 px.

### Resultado por passo

| Fluxo | Passo verificado | Resultado |
|------|-------------------|-----------|
| 1 | Tela protegida sem login leva ao T04 com MSG-I06 | PASS |
| 1 | Cadastro inválido mostra MSG-E05/E03/E19 nos campos | PASS |
| 1 | E-mail já cadastrado mostra MSG-E02 | PASS |
| 1 | Cadastro válido cria conta, faz login e mostra MSG-S05 | PASS |
| 1 | Sair mostra MSG-S06; login com senha errada mostra MSG-E01 | PASS |
| 1 | Login correto volta ao início | PASS |
| 1 | Cardápio lista produtos agrupados e selo Indisponível | PASS |
| 1 | Busca "limao" encontra Limão Siciliano (sem acento) | PASS |
| 1 | Filtros Vegano + Sem glúten combinados e MSG-I01 sem resultado | PASS |
| 1 | Detalhes do produto mostram ingredientes e alérgenos | PASS |
| 1 | Adicionar ao carrinho mostra MSG-S01 e contador 2 | PASS |
| 1 | Produto inexistente volta ao cardápio com MSG-E15 | PASS |
| 2 | Adicionar pelo cardápio (Chocolate Belga) e abrir carrinho (total R$ 47,00) | PASS |
| 2 | Alterar quantidade recalcula os totais | PASS |
| 2 | Cupom vencido mostra MSG-E08 com o motivo | PASS |
| 2 | Cupom BEMVINDO10 aplica desconto R$ 3,90 (MSG-S04) → total R$ 43,10 | PASS |
| 2 | Finalizar sem endereço abre o formulário de endereço direto | PASS |
| 2 | CEP inválido (MSG-E04) e campo vazio (MSG-E05) | PASS |
| 2 | Endereço válido é salvo (MSG-S03) e volta ao checkout com ele selecionado | PASS |
| 2 | Pagamento: aviso de demonstração e validação do cartão (MSG-E11) | PASS |
| 2 | Cartão final 0000 é recusado (MSG-E10) com as 3 opções | PASS |
| 2 | Trocar para PIX mostra QR ilustrativo e aprova (T08 com número CUP-AAAAMMDD-NNNN) | PASS |
| 3 | Acompanhar pedido mostra a linha do tempo com "Pedido recebido" atual | PASS |
| 3 | Sino mostra 1 notificação não lida | PASS |
| 3 | Meus Pedidos lista o pedido e "Ver detalhes" abre o acompanhamento | PASS |
| 3 | Notificação: tocar marca como lida e abre o acompanhamento | PASS |
| 3 | Outro cliente não vê o pedido (MSG-E13) | PASS |
| 4 | Minha Conta: editar nome e telefone (e nome vazio → MSG-E05) | PASS |
| 4 | Adicionar segundo endereço, tornar padrão e excluir com confirmação | PASS |
| 4 | Ajuda e Suporte: FAQ abre/fecha e link do WhatsApp | PASS |
| 4 | Cliente não acessa o painel do administrador (MSG-E13) | PASS |
| 5 | Login com perfil ADMIN vai para o Painel de Pedidos (A01) | PASS |
| 5 | Produtos (A03) lista ativos e inativos | PASS |
| 5 | Formulário (A04): preço zero (MSG-E21) e nome repetido (MSG-E17) | PASS |
| 5 | Salvar produto novo (MSG-S10) e ele aparece no cardápio | PASS |
| 5 | Editar preço/estoque do produto | PASS |
| 5 | Desativar pede confirmação e some do cardápio; reativar volta | PASS |
| 6 | Painel filtra por "Pedido recebido" e abre o pedido (A02) | PASS |
| 6 | Cliente com o T09 aberto recebe a mudança sozinho (consulta a cada 30 s) | PASS |
| 6 | Pedido alterado em outra aba mostra MSG-E14 | PASS |
| 6 | Marcar como Entregue; "Cancelar" não aparece mais | PASS |
| 6 | Cliente avalia: sem nota (MSG-E12), depois 4 estrelas (MSG-S07) | PASS |
| 6 | Administrador vê a avaliação no detalhe do pedido | PASS |
| 6 | Cancelamento pelo admin com confirmação devolve o estoque (RN-15) | PASS |
| 6 | Cliente vê o pedido cancelado (cor + ícone + texto) | PASS |
| Extra | Carrinho vazio mostra MSG-I03 e "Finalizar compra" desabilitado | PASS |
| Extra | Cliente novo sem pedidos (MSG-I04) e sem notificações (MSG-I05) | PASS |
| Extra | Sem rolagem horizontal e barra inferior do protótipo em 360, 390, 768 e 1366 px (cardápio, detalhes, carrinho, ajuda, login) | PASS |

### Estado do banco depois da última execução (conferido no MySQL)

```
numero_pedido      status     subtotal valor_desconto taxa_entrega valor_total id_cupom
CUP-20260924-0001  ENTREGUE   39.00    3.90           8.00         43.10       1
CUP-20260924-0002  CANCELADO  13.00    0.00           8.00         21.00       NULL

notificações do pedido 1: Recebemos seu pedido. / Seu pedido está em preparo. /
                          Seu pedido saiu para entrega. / Seu pedido foi entregue.
notificações do pedido 2: Recebemos seu pedido. / Seu pedido foi cancelado.
avaliação do pedido 1: nota 4, "Chegaram bonitos e fresquinhos."
usuários: 4 (1 ADMIN), 4 com senha em hash bcrypt ($2b$)
```

### Como repetir

```bash
# com o back-end rodando na porta 8000
cd tests/e2e
npm install playwright          # uma vez
npx playwright install chromium # uma vez
node fluxos.mjs http://127.0.0.1:8000 ../../docs/imagens
```

## 5. Responsividade (390, 768 e 1366 px)

Objetivo: conferir que o desenho **mobile-first do protótipo** se adapta a tablet e
computador **sem criar um novo desenho** – a barra inferior (Início, Carrinho, Pedidos,
Conta) continua embaixo em todas as larguras.

Executado com `tests/e2e/responsivo.mjs` (Chromium). O script cria dados reais (pedido
entregue, pedido em preparo, carrinho com cupom) e abre as **21 telas** (T01–T15, o
formulário do T13, A01–A04 e a página 404) em **390 × 844**, **768 × 1024** e
**1366 × 768**, medindo em cada uma:

- rolagem horizontal da página e elementos saindo da tela (fora de áreas de rolagem próprias, como tabelas);
- posição da barra inferior (encostada no fim da tela) e seus 4 textos;
- se o fim do conteúdo fica escondido atrás da barra inferior (rolando até o fim);
- menor fonte de texto visível (mínimo aceito: 12 px);
- controles com menos de 40 px de altura;
- largura ocupada pelo conteúdo.

### Primeira auditoria (antes dos ajustes)

| Largura | Resultado | Problema encontrado |
|---------|-----------|---------------------|
| 390 px | Telas do cliente OK; **A01–A04 com rolagem horizontal** (427–472 px) | O botão "Sair" do cabeçalho do administrador saía da tela; no A02 a tabela de itens alargava o cartão |
| 768 px | OK | – |
| 1366 px | Sem erros medidos, mas, olhando as capturas: os 4 itens da barra inferior ficavam espalhados por 1366 px (Início em x≈170, Conta em x≈1195), longe da coluna de conteúdo de 728 px; no carrinho, nome, preço e quantidade do item ficavam na mesma linha (no protótipo ficam empilhados) | – |
| Todas | Link da marca (34 px) e links do menu do admin (39 px) abaixo de 44 px de altura (plano de melhoria do protótipo pede 44 × 44) | – |

Além disso, a primeira versão movia a barra inferior para o topo a partir de 900 px.
Isso foi **retirado**: a barra fica embaixo em todas as larguras, como no protótipo T01.

### Ajustes feitos (somente CSS, sem mudar o desenho)

1. Barra inferior e cabeçalho do cliente: continuam com a largura total da tela, mas os
   itens ficam alinhados à coluna de conteúdo em telas largas.
2. Item do carrinho: nome / preço / quantidade sempre empilhados, como no T03.
3. Links do cabeçalho com área de toque mínima de 44 px.
4. Cabeçalho do administrador quebra a linha em telas estreitas; número do pedido não
   quebra; a tabela do A02 rola dentro do cartão.

### Resultado final

| Largura | Telas verificadas | Rolagem horizontal | Barra inferior no fim da tela, 4 itens | Conteúdo escondido pela barra | Menor fonte | Resultado |
|---------|------------------:|--------------------|----------------------------------------|-------------------------------|-------------|-----------|
| 390 px | 21 | nenhuma | sim (16 telas do cliente) | nenhum (folga mínima de 88 px) | 12,8 px | **21/21 OK** |
| 768 px | 21 | nenhuma | sim | nenhum (folga mínima de 88 px) | 12,8 px | **21/21 OK** |
| 1366 px | 21 | nenhuma | sim, itens de x=303 a x=1063 (alinhados ao conteúdo) | nenhum (folga mínima de 88 px) | 12,8 px | **21/21 OK** |

Total: **63/63 verificações OK**, 0 erros de JavaScript. Largura do conteúdo: 358 px em
390 px, 728 px em 768 px e 728 px (coluna central) em 1366 px; área do administrador
1148 px em 1366 px. Nenhum controle das telas ficou abaixo de 40 px de altura depois
dos ajustes. Capturas em `docs/imagens/responsivo/`
(ex.: `T01_390.png`, `T01_768.png`, `T01_1366.png`, `T03_1366.png`, `A02_390.png`).

Depois dos ajustes, os 6 fluxos foram executados de novo: **48/48 PASS** nos dois modos
(porta 8000 e `http.server` 5500), 0 erros de JavaScript.

Como repetir:

```bash
cd tests/e2e
node responsivo.mjs ../../docs/imagens/responsivo
```

## 6. O que não foi testado / não foi possível executar neste ambiente

| Item | Situação |
|------|----------|
| Execução no Windows (ambiente da aluna) | Não foi possível executar neste ambiente. |
| Navegadores Firefox e Edge (RNF-03) | Não foi possível executar neste ambiente (só Chromium). |
| Abrir o WhatsApp de verdade | Não testado: só foi conferido que o link começa com `https://wa.me/`. O número configurado é fictício. |
| Medição formal de desempenho (RNF-04/RNF-05) | Não foi feita medição formal. |
| Leitor de tela (acessibilidade) | Não testado com leitor de tela; só foram usados rótulos, textos alternativos e selos com texto. |
| Testes com colegas/usuários | **Não fazem parte da Situação 2** (Situação 3). |
