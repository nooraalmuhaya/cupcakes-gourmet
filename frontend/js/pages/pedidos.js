// T10 – Meus pedidos (UC-12): 10 por página, repetir pedido e avaliar
import { api } from "../api.js";
import { iniciarPagina } from "../layout.js";
import { esc, moeda, data, seloStatus, htmlCarregando, htmlVazio, mostrarErroCarregamento, toast, comCarregamento, avisoProximaTela } from "../ui.js";

const main = document.getElementById("conteudo");
let pagina = 1;

function estrelas(nota) {
  return `<span class="texto-suave texto-pequeno">Sua nota:</span>
    <span class="estrelas-leitura" role="img" aria-label="${nota} de 5 estrelas">${"★".repeat(nota)}${"☆".repeat(5 - nota)}</span>`;
}

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    const r = await api("/api/pedidos", { params: { pagina } });
    if (!r.total) {
      main.innerHTML = htmlVazio({ icone: "🧾", titulo: "Você ainda não fez nenhum pedido.", texto: "Seus pedidos aparecem aqui.",
        acao: '<a class="botao" href="/index.html">Ver cardápio</a>' }); // MSG-I04
      return;
    }
    main.innerHTML = `<ul class="pilha" style="list-style:none;margin:0;padding:0">
      ${r.pedidos.map((p) => `<li class="cartao card-pedido">
          <div class="linha-entre" style="flex-wrap:wrap"><strong>${esc(p.numero_pedido)}</strong>${seloStatus(p.status, p.status_texto)}</div>
          <span class="texto-suave texto-pequeno">${data(p.data_pedido)} · ${moeda(p.valor_total)}</span>
          <span class="texto-pequeno">${esc(p.itens_texto)}</span>
          <div class="acoes-pedido">
            <a class="botao-link" href="/pages/acompanhar.html?pedido=${p.id_pedido}">Ver detalhes ›</a>
            ${p.status === "ENTREGUE" ? `<button type="button" class="botao-link" data-repetir="${p.id_pedido}">Repetir pedido</button>` : ""}
            ${p.pode_avaliar ? `<a class="botao botao-pequeno" href="/pages/avaliar.html?pedido=${p.id_pedido}">Avaliar</a>` : ""}
            ${p.nota ? estrelas(p.nota) : ""}
          </div>
        </li>`).join("")}
      </ul>
      <nav class="paginacao" aria-label="Paginação">
        <button type="button" class="botao botao-secundario botao-pequeno" data-pagina="${pagina - 1}" ${pagina <= 1 ? "disabled" : ""}>Anterior</button>
        <span>Página ${r.pagina} de ${r.total_paginas}</span>
        <button type="button" class="botao botao-secundario botao-pequeno" data-pagina="${pagina + 1}" ${pagina >= r.total_paginas ? "disabled" : ""}>Próxima página</button>
      </nav>`;
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

main.addEventListener("click", async (e) => {
  const botaoPagina = e.target.closest("[data-pagina]");
  if (botaoPagina) { pagina = Number(botaoPagina.dataset.pagina); carregar(); window.scrollTo(0, 0); return; }
  const repetir = e.target.closest("[data-repetir]");
  if (repetir) {
    await comCarregamento(repetir, async () => {
      try {
        const r = await api(`/api/pedidos/${repetir.dataset.repetir}/repetir`, { method: "POST" });
        if (r.aviso) avisoProximaTela(r.aviso, "aviso"); // MSG-W01
        if (r.mensagem) {
          if (!r.aviso) avisoProximaTela(r.mensagem); // MSG-S09
          window.location.href = "/pages/carrinho.html";
        } else {
          toast(r.aviso, "aviso");
        }
      } catch (erro) {
        toast(erro.message, "erro");
      }
    });
  }
});

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Meus Pedidos", voltar: "/pages/conta.html", nav: "pedidos" }))) return;
  carregar();
})();
