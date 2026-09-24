// T01 – Cardápio (UC-01): lista, busca (RN-05) e filtros combinados (US03)
import { api } from "../api.js";
import { iniciarPagina, atualizarContadorCarrinho } from "../layout.js";
import { esc, moeda, atributosImagem, icone, htmlCarregando, htmlVazio, mostrarErroCarregamento, toast, comCarregamento } from "../ui.js";

const estado = { busca: "", categoria: null, vegano: false, sem_gluten: false };
let categorias = [];
let temporizador = null;
let requisicaoAtual = 0;

const lista = document.getElementById("lista");
const campoBusca = document.getElementById("busca");
const botaoLimparBusca = document.getElementById("limpar-busca");
const resumo = document.getElementById("resumo-filtro");

function filtrosAtivos() {
  return estado.busca.length >= 2 || estado.categoria !== null || estado.vegano || estado.sem_gluten;
}

function desenharChips() {
  const chipsCategoria = [{ id_categoria: null, nome: "Todos" }, ...categorias].map((c) =>
    `<button type="button" class="chip" data-categoria="${c.id_categoria ?? ""}"
       aria-pressed="${estado.categoria === c.id_categoria}">${esc(c.nome)}</button>`).join("");
  document.getElementById("chips-categoria").innerHTML = chipsCategoria;
  document.getElementById("chips-restricao").innerHTML = [["vegano", "Vegano"], ["sem_gluten", "Sem glúten"]]
    .map(([chave, texto]) => `<button type="button" class="chip" data-restricao="${chave}" aria-pressed="${estado[chave]}">
        <span class="marcador" aria-hidden="true">${estado[chave] ? icone("check") : ""}</span>${texto}</button>`).join("");
}

function card(p) {
  const selos = [
    p.vegano ? `<span class="selo selo-vegano">${icone("folha")}Vegano</span>` : "",
    p.sem_gluten ? `<span class="selo selo-sem-gluten">${icone("sem_gluten")}Sem glúten</span>` : "",
    !p.disponivel ? `<span class="selo selo-indisponivel">${icone("bloqueado")}Indisponível</span>` : "",
  ].join("");
  return `<article class="card-produto ${p.disponivel ? "" : "esgotado"}">
      <div class="foto"><img ${atributosImagem(p.imagem_url, { thumb: true })} alt="Cupcake ${esc(p.nome)}" loading="lazy" width="104" height="104"></div>
      <div class="info">
        <div class="topo"><h3><a class="cobre" href="/pages/produto.html?id=${p.id_produto}"></a>${esc(p.nome)}</h3>
          <span class="preco">${moeda(p.preco)}</span></div>
        <p>${esc(p.descricao)}</p>
        <div class="rodape-card"><div class="selos">${selos}</div>
          ${p.disponivel ? `<button type="button" class="botao botao-pequeno" data-adicionar="${p.id_produto}"
              aria-label="Adicionar ${esc(p.nome)} ao carrinho">${icone("mais")}Adicionar</button>` : ""}
        </div>
      </div>
    </article>`;
}

function desenharResumo(quantidade) {
  if (!filtrosAtivos()) { resumo.hidden = true; return; }
  const partes = [];
  if (estado.categoria !== null) partes.push(categorias.find((c) => c.id_categoria === estado.categoria)?.nome);
  if (estado.vegano) partes.push("Vegano");
  if (estado.sem_gluten) partes.push("Sem glúten");
  const termo = estado.busca.length >= 2 ? ` para "${esc(estado.busca)}"` : "";
  resumo.hidden = false;
  resumo.innerHTML = `<span>${quantidade} resultado${quantidade === 1 ? "" : "s"}${termo}${partes.length ? " · " + partes.map(esc).join(" · ") : ""}</span>
    <button type="button" class="botao-link" data-limpar>Limpar filtros</button>`;
}

async function carregar() {
  const numero = ++requisicaoAtual;
  lista.innerHTML = htmlCarregando("Carregando cupcakes...");
  lista.setAttribute("aria-busy", "true");
  try {
    const produtos = await api("/api/produtos", {
      params: {
        busca: estado.busca.length >= 2 ? estado.busca : "",
        categoria: estado.categoria, vegano: estado.vegano, sem_gluten: estado.sem_gluten,
      },
    });
    if (numero !== requisicaoAtual) return; // chegou uma resposta mais nova
    desenharResumo(produtos.length);
    if (!produtos.length) {
      lista.innerHTML = filtrosAtivos()
        ? htmlVazio({ icone: "lupa", titulo: "Nenhum cupcake encontrado.", texto: "Tente outro nome ou limpe os filtros.",
            acao: '<button type="button" class="botao botao-secundario" data-limpar>Limpar filtros</button>' }) // MSG-I01
        : htmlVazio({ titulo: "Nenhum cupcake disponível no momento. Volte mais tarde!" }); // MSG-I02
      return;
    }
    // CA2 (US01): agrupados por categoria
    const grupos = new Map();
    produtos.forEach((p) => {
      if (!grupos.has(p.categoria)) grupos.set(p.categoria, []);
      grupos.get(p.categoria).push(p);
    });
    lista.innerHTML = [...grupos.entries()].map(([nome, itens]) =>
      `<section class="grupo-categoria" aria-label="${esc(nome)}"><h2>${esc(nome)}</h2>
         <div class="lista-produtos">${itens.map(card).join("")}</div></section>`).join("");
  } catch (erro) {
    if (numero !== requisicaoAtual) return;
    mostrarErroCarregamento(lista, erro, carregar);
  } finally {
    lista.removeAttribute("aria-busy");
  }
}

function limparFiltros() {
  Object.assign(estado, { busca: "", categoria: null, vegano: false, sem_gluten: false });
  campoBusca.value = "";
  botaoLimparBusca.hidden = true;
  desenharChips();
  carregar();
}

document.addEventListener("click", async (e) => {
  const chipCategoria = e.target.closest("[data-categoria]");
  if (chipCategoria) {
    estado.categoria = chipCategoria.dataset.categoria ? Number(chipCategoria.dataset.categoria) : null;
    desenharChips();
    carregar();
    return;
  }
  const chipRestricao = e.target.closest("[data-restricao]");
  if (chipRestricao) {
    const chave = chipRestricao.dataset.restricao;
    estado[chave] = !estado[chave];
    desenharChips();
    carregar();
    return;
  }
  if (e.target.closest("[data-limpar]")) { limparFiltros(); return; }
  const botaoAdicionar = e.target.closest("[data-adicionar]");
  if (botaoAdicionar) {
    await comCarregamento(botaoAdicionar, async () => {
      try {
        const r = await api("/api/carrinho/itens", { method: "POST", body: { id_produto: Number(botaoAdicionar.dataset.adicionar), quantidade: 1 } });
        toast(r.mensagem); // MSG-S01
        atualizarContadorCarrinho(r.carrinho.quantidade_itens);
      } catch (erro) {
        toast(erro.message, "erro"); // ex.: MSG-E06
      }
    });
  }
});

campoBusca.addEventListener("input", () => {
  botaoLimparBusca.hidden = !campoBusca.value;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    const termo = campoBusca.value.trim();
    // RN-05: a busca começa com 2 caracteres
    if (termo.length === 1) return;
    if (termo === estado.busca) return;
    estado.busca = termo;
    carregar();
  }, 300);
});
botaoLimparBusca.addEventListener("click", () => {
  campoBusca.value = "";
  botaoLimparBusca.hidden = true;
  estado.busca = "";
  campoBusca.focus();
  carregar();
});
document.getElementById("form-busca").addEventListener("submit", (e) => e.preventDefault());

(async () => {
  if (!(await iniciarPagina({ area: "publica", nav: "inicio" }))) return;
  try {
    categorias = await api("/api/categorias");
  } catch (e) {
    categorias = [];
  }
  desenharChips();
  carregar();
})();
