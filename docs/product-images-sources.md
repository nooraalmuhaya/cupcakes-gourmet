# Fontes das imagens dos produtos

| Produto | Arquivo | Fonte | Referência original | Licença / uso |
|---------|---------|-------|---------------------|---------------|
| Red Velvet | `red-velvet.jpg`, `red-velvet-thumb.jpg` | Imagem fornecida pelo usuário | Foto 5 enviada na conversa de desenvolvimento | Fornecida pela aluna para o projeto |
| Café Cremoso | `cafe-cremoso.jpg`, `cafe-cremoso-thumb.jpg` | Imagem fornecida pelo usuário | Foto 4 enviada | Fornecida pela aluna para o projeto |
| Doce de Leite com Nozes | `doce-de-leite-nozes.jpg`, `doce-de-leite-nozes-thumb.jpg` | Imagem fornecida pelo usuário | Foto 3 enviada | Fornecida pela aluna para o projeto |
| Frutas Vermelhas | `frutas-vermelhas.jpg`, `frutas-vermelhas-thumb.jpg` | Imagem fornecida pelo usuário | Foto 2 enviada | Fornecida pela aluna para o projeto |
| Limão Siciliano | `limao-siciliano.jpg`, `limao-siciliano-thumb.jpg` | Imagem fornecida pelo usuário | Foto 1 enviada | Fornecida pela aluna para o projeto |
| Chocolate Belga | – | **Não obtida** | – | – |
| Baunilha Clássico | – | **Não obtida** | – | – |
| Pistache Especial | – | **Não obtida** | – | – |

> Observação: as fotos enviadas pela aluna não trazem informação de autoria ou licença.
> Se alguma delas foi tirada da internet, é responsabilidade da aluna confirmar que o
> uso é permitido (ou trocar por uma foto própria ou de banco de imagens livre) antes
> de publicar o repositório.

## Por que três produtos ficaram sem foto

O pedido era buscar fotos de uso livre na internet para os produtos sem foto enviada.
Neste ambiente de desenvolvimento, a política de rede **bloqueou** os sites de imagens
(resposta 403 do proxy, conferida em 24/09/2026):

- `commons.wikimedia.org` (Wikimedia Commons)
- `api.openverse.org` (Openverse)
- `images.pexels.com` (Pexels)
- `images.unsplash.com` (Unsplash)

Sem acesso a essas fontes não foi possível escolher uma foto **e** verificar a licença.
Por isso nenhuma foto foi usada para esses produtos (nenhuma imagem foi inventada,
gerada por IA ou copiada sem licença). Eles mostram a imagem padrão `sem-imagem.svg`,
criada para o projeto. O passo a passo para completar está em
[`product-images-map.md`](product-images-map.md#o-que-falta-ação-da-aluna).

## Outros recursos visuais

| Recurso | Arquivo | Fonte | Licença |
|---------|---------|-------|---------|
| Fonte Poppins (400, 500, 600, 700) | `frontend/assets/fonts/*.woff2` | Pacote npm `@fontsource/poppins` 5.3.0 (The Poppins Project Authors) | SIL Open Font License 1.1 – texto em `frontend/assets/fonts/OFL-Poppins.txt` |
| Ícones | `frontend/js/icones.js` | Desenhados para o projeto (SVG) | Parte do projeto |
| Imagem padrão e ícone do site | `sem-imagem.svg`, `assets/icons/favicon.svg` | Desenhados para o projeto (SVG) | Parte do projeto |
| Símbolo do PIX | `frontend/js/icones.js` (`pix`) | Desenho simplificado **no estilo** do PIX, feito para o projeto | Não é o logotipo oficial do Banco Central |
