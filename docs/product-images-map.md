# Mapa das imagens dos produtos

Pasta: `frontend/assets/images/produtos/`. O caminho gravado no banco é a coluna
`produto.imagem_url` (nenhuma tabela ou coluna foi alterada).

Cada foto tem dois arquivos, recortados em formato **quadrado (1:1)** e centralizados
no cupcake principal, sem distorção e sem filtros:

- `nome.jpg` – foto completa (tamanho original do recorte, sem ampliar): tela de detalhes (T02);
- `nome-thumb.jpg` – miniatura 320 × 320: cards do cardápio (T01), carrinho (T03) e tabela do administrador (A03).

Se a miniatura não existir, a tela usa a foto completa; se a foto também não existir,
mostra a imagem padrão `sem-imagem.svg` (desenho de cupcake em traço, sem texto).

## Produtos

| Produto | Arquivo (imagem_url) | Tamanho | Telas onde aparece | Fonte | Status |
|---------|----------------------|---------|--------------------|-------|--------|
| Red Velvet | `assets/images/produtos/red-velvet.jpg` (+ `red-velvet-thumb.jpg`) | 960 × 960 | T01, T02, T03, A03, A04 (prévia) | Imagem fornecida pelo usuário | OK |
| Café Cremoso | `assets/images/produtos/cafe-cremoso.jpg` (+ `-thumb`) | 560 × 560 | T01, T02, T03, A03, A04 | Imagem fornecida pelo usuário | OK |
| Doce de Leite com Nozes | `assets/images/produtos/doce-de-leite-nozes.jpg` (+ `-thumb`) | 415 × 415 | T01, T02, T03, A03, A04 | Imagem fornecida pelo usuário | OK |
| Frutas Vermelhas | `assets/images/produtos/frutas-vermelhas.jpg` (+ `-thumb`) | 452 × 452 | T01, T02, T03, A03, A04 | Imagem fornecida pelo usuário | OK |
| Limão Siciliano | `assets/images/produtos/limao-siciliano.jpg` (+ `-thumb`) | 400 × 400 | T01, T02, T03, A03, A04 | Imagem fornecida pelo usuário | OK |
| Chocolate Belga | `assets/images/produtos/sem-imagem.svg` (imagem padrão) | – | T01, T02, T03, A03, A04 | – | **PENDENTE – sem foto** |
| Baunilha Clássico | `assets/images/produtos/sem-imagem.svg` (imagem padrão) | – | T01, T02, T03, A03, A04 | – | **PENDENTE – sem foto** |
| Pistache Especial (inativo) | `assets/images/produtos/sem-imagem.svg` (imagem padrão) | – | A03, A04 (não aparece no cardápio) | – | **PENDENTE – sem foto** |

## Como cada foto enviada foi associada ao produto

Foram enviadas 5 fotos (as imagens 6 a 10 são cópias idênticas das imagens 1 a 5 – mesmo conteúdo).

| Foto enviada | O que mostra | Produto escolhido | Motivo |
|--------------|--------------|-------------------|--------|
| 1 (766 × 400) | Cupcake de massa clara, cobertura branca, raspas e fatias de limão | Limão Siciliano | Único produto cítrico do cardápio ("massa cítrica com cobertura de merengue"). A fruta da foto parece limão tahiti; é a opção mais próxima. |
| 2 (452 × 678) | Cupcake coberto com morango, framboesa, mirtilo e amora | Frutas Vermelhas | Frutas vermelhas visíveis. |
| 3 (739 × 415) | Cupcakes marrons com nozes picadas e fio de calda | Doce de Leite com Nozes | Nozes + calda caramelo/chocolate combinam com "cobertura de nozes caramelizadas". |
| 4 (735 × 1102) | Cupcake de chocolate com creme de café e grão de café | Café Cremoso | Creme de café e grão de café. |
| 5 (960 × 1200) | Cupcake red velvet com creme de cream cheese | Red Velvet | Massa vermelha e cream cheese. |

Recorte usado (esquerda, topo, lado – em pixels da foto original): foto 1 (170, 0, 400);
foto 2 (0, 160, 452); foto 3 (183, 0, 415); foto 4 (88, 500, 560); foto 5 (0, 150, 960).
Nenhum nome, preço, categoria, selo ou estoque foi alterado por causa das fotos.

## O que falta (ação da aluna)

As fotos de **Chocolate Belga**, **Baunilha Clássico** e **Pistache Especial** não
puderam ser obtidas neste ambiente (ver [`product-images-sources.md`](product-images-sources.md)).
Nenhuma imagem foi inventada. Para completar:

1. Escolha uma foto de uso livre (por exemplo Unsplash, Pexels, Pixabay ou Wikimedia
   Commons) que mostre o sabor correto, sem marca d'água.
2. Salve em `frontend/assets/images/produtos/` com os nomes `chocolate-belga.jpg`,
   `baunilha-classico.jpg` e `pistache-especial.jpg` (de preferência quadrada, ~800 × 800;
   opcional: miniatura 320 × 320 com o final `-thumb.jpg`).
3. No painel do administrador: **Produtos → Editar → Caminho da imagem** →
   `assets/images/produtos/chocolate-belga.jpg` (e assim por diante) → **Salvar produto**.
4. Registre a fonte e a licença em `docs/product-images-sources.md`.
