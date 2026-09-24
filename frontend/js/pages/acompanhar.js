// T09 – Acompanhar pedido (UC-10): linha do tempo + consulta a cada 30 s (RF-20, RNF-17)
import { api } from "../api.js";
import { iniciarPagina, recarregarContadores } from "../layout.js";
import { CONFIG } from "../config.js";
import { esc, moeda, hora, dataRelativa, seloStatus, htmlCarregando, mostrarErroCarregamento, param, toast, confirmar, comCarregamento, avisoProximaTela } from "../ui.js";
import { NOME_METODO, NOME_STATUS_PAGAMENTO } from "../nomes.js";

const main = document.getElementById("conteudo");
const idPedido = Number(param("pedido"));
let pedido = null;
let ultimaConsulta = null;
let falhouAgora = false;
let timer = null;

function desenhar() {
  const p = pedido;
  const cancelado = p.status === "CANCELADO";
  const aguardando = p.status === "AGUARDANDO_PAGAMENTO";
  const etapas = p.linha_do_tempo.map((e) => `
    <li class="${e.concluida ? "concluida" : ""} ${e.atual ? "atual" : ""}">
      <span class="bolinha" aria-hidden="true">${e.concluida ? "✓" : ""}</span>
      <span class="texto-etapa"><strong>${esc(e.texto)}</strong>${e.atual ? '<br><span class="texto-pequeno" style="color:var(--marrom)">Etapa atual</span>' : ""}
        <span class="visualmente-oculto">${e.concluida ? "(concluída)" : "(pendente)"}</span></span>
      <span class="texto-suave texto-pequeno">${e.data && !cancelado ? hora(e.data) : ""}</span>
    </li>`).join("");

  main.innerHTML = `
    <div class="linha-entre" style="flex-wrap:wrap"><h1 style="margin:0">${esc(p.numero_pedido)}</h1>${seloStatus(p.status, p.status_texto)}</div>
    <p class="texto-suave">Feito ${esc(dataRelativa(p.data_pedido).replace("Hoje,", "hoje às"))} · ${moeda(p.valor_total)}</p>
    ${falhouAgora ? '<div class="alerta alerta-aviso" role="alert"><p>Não foi possível atualizar agora. Mostrando o último status.</p></div>' : ""}
    ${cancelado ? `<div class="caixa-cancelado pilha" role="status"><strong>✕ Pedido cancelado</strong>
        <p style="margin:0">Este pedido foi cancelado. Se tiver alguma dúvida, fale com a gente em Ajuda e Suporte.</p></div>` : ""}
    ${aguardando ? `<div class="alerta alerta-aviso"><p>Este pedido está aguardando pagamento.</p></div>
        <div class="pilha" style="margin-bottom:12px">
          <a class="botao" href="/pages/pagamento.html?pedido=${p.id_pedido}">Pagar agora</a>
          <button type="button" class="botao botao-perigo" data-cancelar>Cancelar pedido</button></div>` : ""}
    <ol class="linha-tempo ${cancelado ? "cancelado" : ""}" aria-label="Etapas do pedido">${etapas}</ol>
    <p class="cartao cartao-creme texto-pequeno texto-suave" style="padding:10px 14px">
      Última atualização: ${hora(p.data_atualizacao)} · atualiza a cada 30 s</p>
    <section class="pilha" style="margin-top:12px">
      <div><h2>Itens</h2><p style="margin:0">${p.itens.map((i) => `${i.quantidade}x ${esc(i.nome)}`).join(" · ")}</p></div>
      <div><h2>Entrega</h2><p style="margin:0">${esc(p.endereco_entrega)}</p></div>
      <div><h2>Pagamento</h2><p style="margin:0">${p.pagamento ? `${NOME_METODO[p.pagamento.metodo]} · ${NOME_STATUS_PAGAMENTO[p.pagamento.status]}` : "—"}</p></div>
      ${p.avaliacao ? `<div><h2>Sua avaliação</h2><p style="margin:0"><span class="estrelas-leitura" aria-label="${p.avaliacao.nota} de 5 estrelas">${"★".repeat(p.avaliacao.nota)}${"☆".repeat(5 - p.avaliacao.nota)}</span> ${esc(p.avaliacao.comentario || "")}</p></div>` : ""}
    </section>
    <div class="acoes-rodape">
      ${p.pode_avaliar ? `<a class="botao" href="/pages/avaliar.html?pedido=${p.id_pedido}">Avaliar pedido</a>` : ""}
      ${!cancelado && p.status !== "ENTREGUE" ? '<button type="button" class="botao botao-secundario" data-atualizar>↻ Atualizar</button>' : ""}
      <a class="botao-link centro" href="/pages/ajuda.html">Precisa de ajuda?</a>
    </div>`;
}

async function carregarDetalhe() {
  const r = await api(`/api/pedidos/${idPedido}`);
  pedido = r.pedido;
  ultimaConsulta = pedido.status;
  desenhar();
}

async function consultarStatus(manual = false) {
  try {
    const s = await api(`/api/pedidos/${idPedido}/status`);
    falhouAgora = false;
    if (s.status !== ultimaConsulta) {
      await carregarDetalhe();
      toast(`Status atualizado: ${s.status_texto}.`);
      recarregarContadores();
    } else {
      pedido.data_atualizacao = s.data_atualizacao;
      desenhar();
      if (manual) toast("O pedido continua na mesma etapa.");
    }
  } catch (erro) {
    falhouAgora = true; // UC-10 E2: mantém o último status (MSG-W03)
    desenhar();
  }
  const finalizado = ["ENTREGUE", "CANCELADO"].includes(pedido.status);
  if (finalizado) clearInterval(timer);
}

main.addEventListener("click", async (e) => {
  const atualizar = e.target.closest("[data-atualizar]");
  if (atualizar) { await comCarregamento(atualizar, () => consultarStatus(true)); return; }
  const cancelar = e.target.closest("[data-cancelar]");
  if (cancelar) {
    const ok = await confirmar({ titulo: "Cancelar este pedido?", texto: "O pedido ainda não foi pago. Esta ação não pode ser desfeita.",
      confirmar: "Sim, cancelar", perigo: true });
    if (!ok) return;
    await comCarregamento(cancelar, async () => {
      try {
        const r = await api(`/api/pedidos/${idPedido}/cancelar`, { method: "POST" });
        pedido = r.pedido;
        ultimaConsulta = pedido.status;
        desenhar();
        toast("Pedido cancelado.");
      } catch (erro) { toast(erro.message, "erro"); }
    });
  }
});

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Acompanhar Pedido", voltar: "/pages/pedidos.html", nav: "pedidos" }))) return;
  main.innerHTML = htmlCarregando();
  try {
    if (!idPedido) throw Object.assign(new Error("Pedido não encontrado."), { status: 404 });
    await carregarDetalhe();
    if (!["ENTREGUE", "CANCELADO"].includes(pedido.status)) {
      timer = setInterval(() => consultarStatus(false), CONFIG.intervaloAtualizacaoMs);
    }
  } catch (erro) {
    if (erro.status === 403 || erro.status === 404) {
      avisoProximaTela(erro.message, "erro"); // MSG-E13
      window.location.replace("/pages/pedidos.html");
      return;
    }
    mostrarErroCarregamento(main, erro, () => window.location.reload());
  }
})();
