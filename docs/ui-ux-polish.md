# Acabamento visual e de experiência (UI/UX) – Situação 2

Passe de refinamento **visual e de interação**. A estrutura das telas, a navegação e o
fluxo do protótipo da Situação 1 continuam os mesmos, e nenhuma regra de negócio, rota da
API ou tabela do banco foi alterada.

Capturas de tela reais depois do acabamento: `docs/imagens/` (fluxos, 390 px e 1280 px no
administrador) e `docs/imagens/responsivo/` (390, 768 e 1366 px).

## 1. Nome do projeto

A interface passou a usar o nome oficial exigido pelo trabalho: **App de Cupcakes Gourmet**.

| Onde | Como ficou |
|------|------------|
| Cabeçalho do cliente e do administrador | Logotipo (cupcake em traço) + "App de Cupcakes Gourmet". Em telas de até 400 px o prefixo "App de" é escondido para caber: "Cupcakes Gourmet". O rótulo acessível do link é sempre o nome completo. |
| Login (T04) | "App de Cupcakes Gourmet" |
| Títulos das abas | "Carrinho – App de Cupcakes Gourmet", "Cardápio – App de Cupcakes Gourmet" etc. |
| API (Swagger) | "API REST do App de Cupcakes Gourmet" |
| README, manual, arquitetura | Atualizados |

O nome antigo ("Cupcake Haven") foi mantido apenas onde é **registro histórico**: nos
documentos da Situação 1 (`docs/situacao-1/`, não alterados) e na auditoria inicial do
`DEVELOPMENT_NOTES.md`. O teste `tests/e2e/visual.mjs` confirma que ele não aparece em
nenhuma tela.

## 2. Paleta de cores

O tema marrom-escuro foi trocado por uma paleta de confeitaria: terracota suave, creme,
blush e verde-sálvia. Todas as cores ficam em variáveis no início de `frontend/css/base.css`
e são usadas em todos os arquivos CSS e JS (não há cor antiga ou valor solto de marca).

| Variável | Cor | Uso | Contraste |
|----------|-----|-----|-----------|
| `--color-primary` | `#B4533B` terracota suave | Botões, preços, destaques | branco sobre ela: 4,95:1 |
| `--color-primary-hover` / `--color-primary-strong` | `#9A4331` | Hover/pressionado; texto na cor da marca sobre fundos claros | sobre blush: 5,7:1 |
| `--color-primary-soft` | `#FBEDE6` blush | Item ativo, seleção, fundos de destaque | – |
| `--color-background` | `#FFF9F5` creme | Fundo das telas | – |
| `--color-surface` / `--color-surface-soft` | `#FFFFFF` / `#FDF4EF` | Cartões, barras / resumos | – |
| `--color-text` | `#3B302C` carvão quente | Texto principal | 12,2:1 |
| `--color-text-secondary` | `#6E5F58` | Texto de apoio | 5,9:1 |
| `--color-border` / `--color-border-strong` | `#EFE1D8` / `#9A7F72` | Divisórias / borda dos campos | campos 3,7:1 (mínimo 3:1 para componentes) |
| `--color-success` (+ `-soft`) | `#3D7550` sálvia | Sucesso, selos Vegano/Sem glúten, "Entregue" | 4,8:1 |
| `--color-error` (+ `-soft`) | `#B83A2E` | Erros, "Cancelado", remover | 5,0:1 |
| `--color-warning` (+ `-soft`) | `#8A5A0B` | Avisos, alérgenos, "Em preparo" | 5,4:1 |
| `--color-info` (+ `-soft`) | `#3A6488` | Informação, "Pedido recebido" | 5,5:1 |

Contrastes calculados pela fórmula da WCAG 2.1 (nível AA: 4,5:1 para texto, 3:1 para
bordas de componentes). Não há gradientes fortes, cores neon nem fundos escuros.

## 3. Tipografia

- **Poppins** em toda a interface (pesos 400, 500, 600 e 700), com arquivos **locais** em
  `frontend/assets/fonts/` (pacote `@fontsource/poppins`, licença SIL OFL 1.1). O sistema
  não depende de serviço externo para carregar a fonte; se ela falhar, usa a fonte do sistema.
- Não foi usada uma segunda fonte (não foi necessária).
- Hierarquia: títulos de tela 600 (1,45rem); títulos de seção 600; nomes de produto e
  preços 600 (preço na cor da marca); corpo 400 (15 px); rótulos de campo 500; botões 600;
  textos de ajuda e horários ≥ 12 px; mensagens de erro 13,4 px com ícone.
- Números de valores e quantidades com algarismos de largura fixa (`tabular-nums`), para
  alinhar as colunas de totais.

## 4. Ícones

- Todos os símbolos provisórios (▭ ◆ ✓ ✕ ⚠ ★ ☆ ↻ › ○ ● ⊘) e os emojis (🧁 🛒 🔍 🔔 📍 🧾 📋 🔒)
  foram trocados por **um único conjunto de ícones SVG** desenhados para o projeto, em
  `frontend/js/icones.js`: grade 24 × 24, traço de 2 px, pontas arredondadas, herdando a
  cor do texto. Nenhuma biblioteca externa foi adicionada.
- Ícones: navegação (voltar, seta, início, carrinho, pedidos, conta, sino, busca, sair,
  ajuda, mapa), ações (mais, menos, lixeira, fechar, editar, atualizar, check), estados
  (sucesso, erro, alerta, informação, bloqueado, cadeado, relógio), restrições (folha =
  Vegano, trigo cortado = Sem glúten), etapas do pedido (recebido, preparo, entrega,
  entregue), pagamento (crédito, débito, PIX, WhatsApp), estrela e o cupcake da marca.
- **Pagamento:** Crédito = cartão com tarja; Débito = cartão com chip e sinal de
  aproximação; PIX = losango dividido em quatro partes, **no estilo** do símbolo do PIX
  (desenho próprio, não é o logotipo oficial). A forma escolhida tem borda na cor da
  marca, fundo claro e um pequeno selo de "check".
- Os ícones de avisos, erros de campo e toasts são aplicados por CSS (máscara), com o
  mesmo desenho.
- O sinal "−" nos descontos (ex.: "− R$ 3,90") continua como tipografia, não como ícone.

## 5. Imagens dos produtos

Detalhes em [`product-images-map.md`](product-images-map.md) e fontes em
[`product-images-sources.md`](product-images-sources.md).

- 5 fotos fornecidas pela aluna foram associadas aos produtos correspondentes e
  recortadas em quadrado, centralizadas no cupcake principal, sem distorção e sem filtro.
- Cards (T01), carrinho (T03) e tabela do admin usam uma miniatura 320 × 320
  (`object-fit: cover` em moldura quadrada de cantos arredondados); a tela de detalhes usa
  a foto maior na mesma proporção.
- **Chocolate Belga, Baunilha Clássico e Pistache Especial ficaram sem foto**: os sites
  de imagens livres estavam bloqueados neste ambiente, e nenhuma imagem foi inventada.
  Eles mostram a imagem padrão (cupcake em traço sobre fundo blush, sem texto), e a
  pendência está documentada.
- Textos alternativos em português ("Cupcake Red Velvet").
- As ilustrações SVG antigas dos produtos foram removidas.

## 6. Navegação (barra inferior do protótipo)

A barra inferior **continua igual ao protótipo T01** (Início, Carrinho, Pedidos, Conta),
embaixo, em todas as larguras. Só a interação foi refinada:

- item ativo: ícone dentro de uma "pílula" blush e texto na cor da marca (semibold);
- hover (computador): fundo creme suave; pressionado (celular): leve redução do indicador;
- foco pelo teclado: contorno visível no indicador;
- transições de 120–200 ms; ícone e texto continuam juntos.

## 7. Transições entre telas

- **View Transitions entre documentos** (`@view-transition { navigation: auto; }`):
  nos navegadores que suportam (Chrome/Edge 126+), a troca de página faz um esmaecimento
  de 180 ms com um deslocamento de 6 px. O cabeçalho e a barra inferior têm
  `view-transition-name` próprio e ficam **parados**, o que dá a sensação de um aplicativo
  único.
- Nos outros navegadores, só o conteúdo entra com o mesmo esmaecimento (200 ms).
- A navegação **não é atrasada**: nenhuma espera artificial foi adicionada; a nova página
  carrega normalmente.
- **Movimento reduzido:** com `prefers-reduced-motion: reduce`, as transições entre telas
  são desligadas e as animações/transições dos componentes passam a durar 0,01 ms
  (verificado em `tests/e2e/visual.mjs`).

## 8. Micro-interações e estados

- **Botões:** hover (tom mais escuro + sombra leve), pressionado (desce 1 px e reduz 1,5%),
  foco visível, desabilitado (fundo neutro), carregando (indicador girando **só enquanto a
  requisição real acontece**, com o botão bloqueado). Já existia em "Adicionar",
  "Aplicar", "Confirmar pagamento", "Salvar dados", "Atualizar" etc.
- **"Salvar dados" (T12):** depois da resposta da API, o botão mostra "Dados salvos" com
  ícone por 1,6 s, além do toast.
- **Cards de produto:** leve elevação e zoom de 3% na foto ao passar o mouse; pressionado no toque.
- **Estrelas (T11):** estrelas em SVG de 52 px de área de toque; prévia ao passar o mouse
  ou focar pelo teclado; animação de escala curta; regra de 1 a 5 inalterada.
- **Toasts:** cartão branco com borda lateral colorida e ícone (sucesso/erro/aviso), acima
  da barra inferior, 3 s e saída suave; anunciados por leitor de tela (`role="status"`).
- **Formulários:** normal, foco (borda terracota + halo), inválido (borda vermelha +
  mensagem com ícone abaixo do campo), **válido** (borda verde quando um campo com erro é
  corrigido e o formulário é enviado de novo), desabilitado (fundo claro, cursor
  bloqueado). Ao digitar num campo com erro, a mensagem some. Nenhuma validação foi removida.

## 9. Telas revisadas (o que mudou visualmente)

| Tela | Refinamento |
|------|-------------|
| Cardápio | Busca com sombra suave, chips com estados, título de categoria com linha, cards com foto, nome/preço em destaque, descrição em 2 linhas, selos com ícone, botão "Adicionar" com ícone |
| Detalhes | Foto grande quadrada, selos, seções com rótulo discreto, alérgenos com ícone, quantidade com botões circulares, botão "Adicionar ao carrinho · R$ total" |
| Carrinho | Miniaturas, seletor − quantidade + com área de toque de 40 px, lixeira consistente, cupom aplicado com ícone, total em destaque na cor da marca |
| Checkout / Pagamento | Indicador de etapas (etapa feita com check), endereço selecionado com borda e halo, formas de pagamento com ícones, aviso de demonstração em estilo informativo, nota de segurança com cadeado |
| Confirmação | Ícone de sucesso animado uma vez, número do pedido em destaque |
| Acompanhar | Linha do tempo com ícone próprio em cada etapa (recebido, preparo, entrega, entregue), etapa atual preenchida com halo, concluídas com check, pendentes em cinza, horários alinhados |
| Meus pedidos | Estrelas em SVG, ações com ícones |
| Notificações | Ícone e cor conforme a etapa, ponto de "não lida", horário alinhado, hover/pressionado |
| Conta / Endereços / Ajuda | Menu com ícones, endereço com ícone de mapa, horário com relógio, FAQ com "+" que gira, botão do WhatsApp com ícone |
| Administração | Mesmo sistema de design, mais denso: menu com estado ativo, tabelas com cabeçalho discreto, miniatura do produto, situação com ponto colorido, botões de status com ícone da etapa |

## 10. Responsividade

- Continua sendo uma **adaptação do desenho mobile** (não há desenho separado para
  computador). Conteúdo em coluna central de até 760 px; cabeçalho e barra inferior com
  largura total e itens alinhados a essa coluna; cardápio com 2 colunas a partir de 700 px;
  detalhes com foto e texto lado a lado a partir de 900 px; administração até 1180 px.
- Verificado em 360, 390, 768 e 1366 px (ver [`testes-situacao-2.md`](testes-situacao-2.md)).

## 11. Acessibilidade

- Contraste AA conferido para todas as combinações de texto (seção 2).
- Foco visível em todos os controles (contorno terracota de 3 px).
- Área de toque ≥ 40 px nos controles do conteúdo (44 px nos do cabeçalho e da barra).
- Ícones decorativos com `aria-hidden`; ícones com significado com rótulo; status do
  pedido sempre com texto (não só cor); textos alternativos nas fotos.
- `prefers-reduced-motion` respeitado.
- Menor texto visível no conteúdo: 12 px.

## 12. O que foi mantido de propósito (não mudou)

- Estrutura e ordem das 19 telas, textos e mensagens do catálogo da Situação 1.
- Barra inferior do cliente (itens, ordem, posição embaixo).
- Fluxo de compra, regras de negócio, validações, API, banco de dados (nenhuma tabela ou
  coluna alterada; só os valores de `produto.imagem_url`).
- Área administrativa com tabelas (não virou cópia da tela do cliente).
- Nenhuma dependência nova no back-end; nenhum framework no front-end.

## 13. Verificação feita depois do acabamento

| Verificação | Resultado |
|-------------|-----------|
| Testes automatizados do back-end (pytest, MySQL) | 156 passaram |
| 6 fluxos no navegador (`fluxos.mjs`) – porta 8000 | 48/48 PASS, 0 erros de JavaScript |
| 6 fluxos no navegador – `http.server` 5500 | 48/48 PASS, 0 erros de JavaScript |
| Auditoria responsiva (`responsivo.mjs`) em 390, 768 e 1366 px | 63/63 OK |
| Checagens visuais (`visual.mjs`) | 8/8 PASS: marca, fonte, imagens, ícones de pagamento, sem símbolos provisórios, transições, movimento reduzido, barra inferior |

Detalhes, incluindo as falhas encontradas durante o trabalho e as correções, em
[`testes-situacao-2.md`](testes-situacao-2.md#7-acabamento-visual-uiux).
