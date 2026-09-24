// A01 – Painel de pedidos (UC-16): lista com filtro por status
import { api } from "../../api.js";
import { iniciarPagina } from "../../layout.js";
import { esc, moeda, dataHora, seloStatus, htmlCarregando, htmlVazio, mostrarErroCarregamento, icone } from "../../ui.js";
import { NOME_STATUS } from "../../nomes.js";

const main = document.getElementById("conteudo");
const lista = () => document.getElementById("lista-pedidos");
let filtro = "";
let pagina = 1;

function desenharFiltros() {
  const opcoes = [["", "Todos"], ...Object.entries(NOME_STATUS)];
  document.getElementById("filtros").innerHTML = opcoes.map(([valor, texto]) =>
    `<button type="button" class="chip" data-status="${valor}" aria-pressed="${filtro === valor}">${esc(texto)}</button>`).join("");
}

async function carregar() {
  lista().innerHTML = htmlCarregando();
  try {
    const r = await api("/api/admin/pedidos", { params: { status: filtro, pagina } });
    if (!r.pedidos.length) {
      lista().innerHTML = htmlVazio({ icone: "pedidos", titulo: filtro ? "Nenhum pedido com este status." : "Nenhum pedido ainda." });
      return;
    }
    lista().innerHTML = `<div class="tabela-rolagem"><table class="tabela">
        <thead><tr><th scope="col">Número</th><th scope="col">Cliente</th><th scope="col">Data</th>
          <th scope="col" class="num">Total</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead>
        <tbody>${r.pedidos.map((p) => `<tr>
            <td><strong>${esc(p.numero_pedido)}</strong></td><td>${esc(p.cliente)}</td><td>${dataHora(p.data_pedido)}</td>
            <td class="num">${moeda(p.valor_total)}</td><td>${seloStatus(p.status, p.status_texto)}</td>
            <td><a class="botao botao-secundario botao-pequeno" href="/pages/admin/pedido.html?id=${p.id_pedido}"
                   aria-label="Abrir pedido ${esc(p.numero_pedido)}">Abrir</a></td></tr>`).join("")}</tbody>
      </table></div>
      <p class="texto-suave texto-pequeno">Mais recentes primeiro · ${r.total} pedido${r.total === 1 ? "" : "s"}</p>
      ${r.total_paginas > 1 ? `<nav class="paginacao" aria-label="Paginação">
        <button type="button" class="botao botao-secundario botao-pequeno" data-pagina="${pagina - 1}" ${pagina <= 1 ? "disabled" : ""}>Anterior</button>
        <span>Página ${r.pagina} de ${r.total_paginas}</span>
        <button type="button" class="botao botao-secundario botao-pequeno" data-pagina="${pagina + 1}" ${pagina >= r.total_paginas ? "disabled" : ""}>Próxima</button></nav>` : ""}`;
  } catch (erro) {
    mostrarErroCarregamento(lista(), erro, carregar);
  }
}

main.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-status]");
  if (chip) { filtro = chip.dataset.status; pagina = 1; desenharFiltros(); carregar(); return; }
  const botaoPagina = e.target.closest("[data-pagina]");
  if (botaoPagina) { pagina = Number(botaoPagina.dataset.pagina); carregar(); return; }
  if (e.target.closest("[data-recarregar]")) carregar();
});

(async () => {
  if (!(await iniciarPagina({ area: "admin", nav: "pedidos" }))) return;
  main.innerHTML = `<div class="cabecalho-pagina"><h1 style="margin:0">Pedidos</h1>
      <button type="button" class="botao botao-secundario botao-pequeno" data-recarregar>${icone("atualizar")}Atualizar</button></div>
    <p class="rotulo" style="margin-bottom:6px">Filtrar por status:</p>
    <div class="chips" id="filtros" style="margin-bottom:16px"></div>
    <div id="lista-pedidos"></div>`;
  desenharFiltros();
  carregar();
})();
