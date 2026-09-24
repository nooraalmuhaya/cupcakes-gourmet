# Front-end – Cupcakes Gourmet

HTML5, CSS3 e JavaScript puro (módulos ES + Fetch API), sem framework.

- `index.html` – T01 Cardápio; `pages/` – T02 a T15; `pages/admin/` – A01 a A04
- `css/` – `base.css`, `components.css`, `pages.css`
- `js/api.js` (chamadas à API), `js/layout.js` (cabeçalho, menu e controle de acesso),
  `js/ui.js` (formatação, avisos, modal, erros), `js/config.js` (WhatsApp, horário),
  `js/pages/` (um script por tela)
- `assets/images/produtos/` – ilustrações SVG dos produtos

Precisa ser aberto por um servidor HTTP (não por `file://`):

- pelo back-end: http://127.0.0.1:8000 (recomendado), ou
- `python -m http.server 5500` nesta pasta, com o back-end rodando na porta 8000.

Antes de publicar, troque o número fictício do WhatsApp em `js/config.js`.
