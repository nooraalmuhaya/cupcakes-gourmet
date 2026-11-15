# Roteiro do vídeo de demonstração – Situação 2

Duração prevista: **cerca de 5 minutos**. Este é só o roteiro; vou gravar o vídeo depois.

## Antes de gravar (preparação)

- MySQL rodando (serviço `MySQL267`) e banco com os dados iniciais
  (`database/02_dados_iniciais.sql`).
- Back-end rodando: `cd backend`, `.venv\Scripts\activate`,
  `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
- Duas janelas do navegador em <http://127.0.0.1:8000>:
  - janela 1 (modo celular, 390 px, pelas ferramentas do desenvolvedor) para o **cliente**;
  - janela 2 (anônima, tamanho normal) para o **administrador**.
- Um terminal aberto na pasta `backend` com o ambiente virtual ativo, para rodar os testes.
- O VS Code aberto na pasta do projeto, para mostrar as pastas.
- Contas de teste (README, seção 12): cliente `cliente@example.com` / `Cliente2026`
  e administrador `admin@example.com` / `Admin2026`.
- Se a conta de cliente já usou o cupom `BEMVINDO10` em um pedido, crio uma conta nova
  na hora da gravação (cada conta usa o cupom uma vez).

---

## 0:00 – Apresentação (≈ 30 s)

**Na tela:** README do repositório no GitHub.

> Olá! Meu nome é Noora Gamil Al Muhaya e este é o meu Projeto Integrador
> Transdisciplinar em Engenharia de Software II, da Cruzeiro do Sul Virtual.
> O projeto é o App de Cupcakes Gourmet, da loja Cupcake Haven: uma aplicação web
> responsiva em que o cliente escolhe os cupcakes, monta o carrinho, paga e acompanha
> o pedido, e o administrador cuida dos produtos e dos pedidos.
> No front-end eu usei HTML, CSS e JavaScript puro. No back-end usei Python com
> FastAPI, organizado no padrão MVC, e o banco de dados é o MySQL.

## 0:30 – Estrutura do repositório e MVC (≈ 45 s)

**Na tela:** VS Code, abrindo as pastas uma por uma.

> Esta é a estrutura do repositório. Na pasta `frontend` fica a camada de **View**:
> as páginas HTML, os estilos CSS e um script JavaScript para cada tela.
> Na pasta `backend/app` fica o restante do MVC: em `models` estão as classes que
> mapeiam as dez tabelas do banco, em `services` eu coloquei as regras de negócio,
> como carrinho, cupom, pedido e pagamento, e em `routers` ficam os controllers,
> que recebem as requisições da API. A pasta `schemas` valida os dados de entrada.
> Em `database` estão os scripts SQL e em `backend/tests` os testes automatizados.
> A documentação está em `docs`, com uma pasta para cada situação do projeto.

## 1:15 – Fluxo do cliente (≈ 1 min 45 s)

**Na tela:** janela 1 (celular).

1. **Cardápio** – mostrar as categorias e o selo "Indisponível".
   > Esta é a tela inicial, o cardápio, com os cupcakes agrupados por categoria.
2. **Busca e filtros** – digitar `limao`, depois limpar e marcar **Vegano** + **Sem glúten**.
   > A busca não diferencia acentos: digitando "limao" sem til, ele encontra o
   > Limão Siciliano. Os filtros também podem ser combinados.
3. **Detalhes** – abrir o Chocolate Belga, mostrar ingredientes e alérgenos, aumentar
   a quantidade e tocar em **Adicionar ao carrinho**.
   > Nos detalhes aparecem os ingredientes e os alérgenos em destaque.
4. **Login** – tocar em **Conta** e entrar como cliente.
   > Para usar cupom e finalizar a compra é preciso entrar na conta.
5. **Carrinho com cupom** – abrir o carrinho, alterar a quantidade, aplicar `BEMVINDO10`.
   > Os totais são recalculados no servidor. Aplicando o cupom BEMVINDO10, aparece
   > o desconto de dez por cento, que não vale para a taxa de entrega.
6. **Endereço** – **Finalizar compra**, escolher ou cadastrar o endereço e continuar.
7. **Pagamento simulado – recusado** – crédito com um número de 16 dígitos terminado
   em **0000**.
   > O pagamento é simulado. Um cartão que termina em 0000 é sempre recusado, e o
   > sistema oferece tentar de novo, trocar a forma de pagamento ou cancelar.
8. **Pagamento simulado – aprovado** – **Trocar forma de pagamento** → **PIX** →
   **Simular pagamento PIX**.
9. **Confirmação** – mostrar o número `CUP-AAAAMMDD-NNNN`.
   > O pedido foi confirmado e recebeu um número no formato CUP, data e sequência.
10. **Acompanhamento** – **Acompanhar pedido**: linha do tempo em "Pedido recebido" e
    sino com 1 notificação. Deixar esta tela aberta.
    > Esta tela se atualiza sozinha a cada 30 segundos. Vou deixar ela aberta e
    > mudar o status pelo administrador.

## 3:00 – Área do administrador (≈ 1 min)

**Na tela:** janela 2 (computador).

1. Entrar como administrador → **Painel de Pedidos** (A01).
   > O administrador entra direto no painel de pedidos, que pode ser filtrado por status.
2. **Produtos** → **+ Novo produto** → preencher com **preço 0** e salvar.
   > Se eu tentar salvar um produto com preço zero, o formulário mostra o erro de
   > validação embaixo do campo. Corrigindo o preço, o produto é salvo.
   Corrigir o preço e salvar (mensagem de sucesso).
3. **Pedidos** → abrir o pedido que acabei de fazer → **Iniciar preparo**.
   > No detalhe do pedido aparece só o botão do próximo status permitido.
4. Voltar à janela 1: esperar a atualização (ou tocar em **↻ Atualizar**) e mostrar
   "Em preparo" e o sino com a nova notificação.
   > Do lado do cliente, o status mudou para "Em preparo" e chegou uma nova notificação.

## 4:00 – Tratamento de erros (≈ 20 s)

**Na tela:** janela 1.

- No carrinho, tentar o cupom `NATAL2025` → mensagem de cupom inválido com o motivo (vencido).
- Lembrar o cartão final 0000 mostrado antes.
  > O sistema trata os erros com mensagens claras: aqui o cupom NATAL2025 é recusado
  > porque está vencido, e antes vimos o pagamento recusado do cartão final 0000.
  > Os dados também são validados no navegador e no servidor.

## 4:20 – Testes automatizados (≈ 25 s)

**Na tela:** terminal na pasta `backend`.

```
python -m pytest -q
```

> Agora vou rodar os testes automatizados com o pytest. Eles usam um banco MySQL
> separado, só para testes, e cobrem cadastro e login, cardápio, carrinho, cupom,
> endereços, pedidos, pagamento e administração.

Mostrar a linha final com o total de testes que passaram (falar o número que aparecer
na tela no momento da gravação).

## 4:45 – Encerramento (≈ 15 s)

**Na tela:** página do repositório no GitHub.

> Todo o código e a documentação, incluindo o manual de uso e o registro dos testes,
> estão no GitHub, em github.com/nooraalmuhaya/cupcakes-gourmet, no branch main.
> Na Situação 3 eu vou fazer os testes com colegas e registrar o que eles avaliarem.
> Obrigada!

---

## Depois de gravar

- Conferir se o vídeo ficou com cerca de 5 minutos e se o áudio está claro.
- Publicar o vídeo e colocar o link na seção "Vídeo de demonstração" do `README.md`.
