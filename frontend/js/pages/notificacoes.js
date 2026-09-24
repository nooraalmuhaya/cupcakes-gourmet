// T14 – Notificações (UC-11, US13)
import { api } from "../api.js";
import { iniciarPagina, recarregarContadores } from "../layout.js";
import { esc, dataRelativa, htmlCarregando, htmlVazio, mostrarErroCarregamento, toast, comCarregamento, icone } from "../ui.js";

const main = document.getElementById("conteudo");

// Ícone e cor de cada aviso conforme a etapa do pedido (as mensagens vêm do catálogo – RN-16)
const STATUS_POR_MENSAGEM = {
  "Recebemos seu pedido.": "RECEBIDO", "Seu pedido está em preparo.": "EM_PREPARO",
  "Seu pedido saiu para entrega.": "SAIU_PARA_ENTREGA", "Seu pedido foi entregue.": "ENTREGUE",
  "Seu pedido foi cancelado.": "CANCELADO",
};
const ICONE_STATUS = { RECEBIDO: "recebido", EM_PREPARO: "preparo", SAIU_PARA_ENTREGA: "entrega", ENTREGUE: "entregue", CANCELADO: "erro" };
const statusDaMensagem = (m) => STATUS_POR_MENSAGEM[m] || "OUTRO";

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    const lista = await api("/api/notificacoes");
    if (!lista.length) {
      main.innerHTML = htmlVazio({ icone: "sino", titulo: "Você não tem notificações." }); // MSG-I05
      return;
    }
    const naoLidas = lista.filter((n) => !n.lida).length;
    main.innerHTML = `
      <div class="linha" style="justify-content:flex-end;margin-bottom:8px">
        <button type="button" class="botao-link" data-todas ${naoLidas ? "" : "disabled"}>Marcar todas como lidas</button></div>
      <ul class="lista-notificacoes">
        ${lista.map((n) => `<li><button type="button" class="notificacao ${n.lida ? "" : "nao-lida"}" data-id="${n.id_notificacao}" data-pedido="${n.id_pedido}">
            <span class="icone-notificacao tom-${statusDaMensagem(n.mensagem)}" aria-hidden="true">${icone(ICONE_STATUS[statusDaMensagem(n.mensagem)] || "sino")}</span>
            <span><span class="mensagem">${esc(n.mensagem)}</span><br><span class="texto-suave texto-pequeno">Pedido ${esc(n.numero_pedido)}</span>
              ${n.lida ? "" : '<span class="visualmente-oculto">(não lida)</span>'}</span>
            <span class="quando">${esc(dataRelativa(n.data_envio))}</span>
          </button></li>`).join("")}
      </ul>`;
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

main.addEventListener("click", async (e) => {
  const todas = e.target.closest("[data-todas]");
  if (todas) {
    await comCarregamento(todas, async () => {
      try { const r = await api("/api/notificacoes/lidas", { method: "PUT" }); toast(r.mensagem); await carregar(); recarregarContadores(); }
      catch (erro) { toast(erro.message, "erro"); }
    });
    return;
  }
  const item = e.target.closest("[data-id]");
  if (item) {
    // Tocar marca como lida e abre o acompanhamento do pedido (T09)
    try { await api(`/api/notificacoes/${item.dataset.id}/lida`, { method: "PUT" }); } catch (erro) { /* abre mesmo assim */ }
    window.location.href = `/pages/acompanhar.html?pedido=${item.dataset.pedido}`;
  }
});

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Notificações", voltar: "/pages/conta.html", nav: "conta" }))) return;
  carregar();
})();
