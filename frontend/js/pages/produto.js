// T02 – Detalhes do produto (UC-02, US02)
import { api } from "../api.js";
import { iniciarPagina, atualizarContadorCarrinho } from "../layout.js";
import { esc, moeda, imagem, IMG_FALLBACK, htmlCarregando, mostrarErroCarregamento, toast, comCarregamento, param, avisoProximaTela } from "../ui.js";

const main = document.getElementById("conteudo");
let produto = null;
let quantidade = 1;

function desenhar() {
  const p = produto;
  const selos = [
    `<span class="selo selo-categoria">${esc(p.categoria)}</span>`,
    p.vegano ? '<span class="selo selo-vegano">Vegano</span>' : "",
    p.sem_gluten ? '<span class="selo selo-sem-gluten">Sem glúten</span>' : "",
    !p.disponivel ? '<span class="selo selo-indisponivel"><span aria-hidden="true">⊘</span> Indisponível</span>' : "",
  ].join(" ");
  main.innerHTML = `<div class="detalhe-grade">
      <img class="foto-produto" src="${esc(imagem(p.imagem_url))}" alt="Foto do cupcake ${esc(p.nome)}" onerror="${IMG_FALLBACK}">
      <div class="pilha">
        <div class="titulo-preco"><h1>${esc(p.nome)}</h1><span class="preco">${moeda(p.preco)}</span></div>
        <div class="linha" style="flex-wrap:wrap">${selos}</div>
        <section><h2>Descrição</h2><p>${esc(p.descricao)}</p></section>
        <section><h2>Ingredientes</h2><p>${esc(p.ingredientes)}</p></section>
        <section class="alergenos" aria-label="Alérgenos"><strong>⚠ Alérgenos</strong><p style="margin:4px 0 0">${esc(p.alergenos)}</p></section>
        <div class="linha-entre">
          <span class="rotulo" id="rotulo-qtd">Quantidade</span>
          <div class="pilha" style="justify-items:end">
            <div class="quantidade" role="group" aria-labelledby="rotulo-qtd">
              <button type="button" data-qtd="-1" aria-label="Diminuir quantidade" ${!p.disponivel || quantidade <= 1 ? "disabled" : ""}>−</button>
              <output aria-live="polite">${quantidade}</output>
              <button type="button" data-qtd="1" aria-label="Aumentar quantidade" ${!p.disponivel || quantidade >= p.quantidade_estoque ? "disabled" : ""}>+</button>
            </div>
            <span class="texto-suave texto-pequeno">${p.disponivel ? `${p.quantidade_estoque} disponíveis` : "Sem estoque"}</span>
          </div>
        </div>
        <div id="erro-qtd" class="erro-campo" role="alert"></div>
        <button type="button" class="botao botao-bloco" id="adicionar" ${p.disponivel ? "" : "disabled"}>
          ${p.disponivel ? "Adicionar ao carrinho" : "Indisponível"}</button>
        <a class="botao botao-secundario botao-bloco" href="/index.html">Voltar ao cardápio</a>
      </div>
    </div>`;
}

main.addEventListener("click", async (e) => {
  const botaoQtd = e.target.closest("[data-qtd]");
  if (botaoQtd) {
    // CA2: começa em 1 e não passa do estoque
    quantidade = Math.min(Math.max(1, quantidade + Number(botaoQtd.dataset.qtd)), produto.quantidade_estoque);
    desenhar();
    main.querySelector(`[data-qtd="${botaoQtd.dataset.qtd}"]`)?.focus();
    return;
  }
  const adicionar = e.target.closest("#adicionar");
  if (adicionar) {
    await comCarregamento(adicionar, async () => {
      try {
        const r = await api("/api/carrinho/itens", { method: "POST", body: { id_produto: produto.id_produto, quantidade } });
        toast(r.mensagem); // MSG-S01
        atualizarContadorCarrinho(r.carrinho.quantidade_itens);
        document.getElementById("erro-qtd").textContent = "";
      } catch (erro) {
        document.getElementById("erro-qtd").textContent = erro.message; // MSG-E06
      }
    });
  }
});

async function carregar() {
  const id = Number(param("id"));
  main.innerHTML = htmlCarregando();
  try {
    if (!id) throw Object.assign(new Error("Produto não encontrado."), { status: 404 });
    produto = await api(`/api/produtos/${id}`);
    document.title = `${produto.nome} – Cupcake Haven`;
    desenhar();
  } catch (erro) {
    if (erro.status === 404) {
      // CA5 (US02): MSG-E15 e volta ao cardápio
      avisoProximaTela("Produto não encontrado.", "erro");
      window.location.replace("/index.html");
      return;
    }
    mostrarErroCarregamento(main, erro, carregar);
  }
}

(async () => {
  if (!(await iniciarPagina({ area: "publica", titulo: "Detalhes do Produto", nav: "inicio" }))) return;
  carregar();
})();
