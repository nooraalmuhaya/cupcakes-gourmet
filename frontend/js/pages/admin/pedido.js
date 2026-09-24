// A02 – Detalhe do pedido e atualização de status (UC-16, SD-02, RN-14, RN-15)
import { api } from "../../api.js";
import { iniciarPagina } from "../../layout.js";
import { esc, moeda, dataHora, formatarTelefone, seloStatus, htmlCarregando, mostrarErroCarregamento, comCarregamento, confirmar, toast, param } from "../../ui.js";
import { NOME_METODO, NOME_STATUS_PAGAMENTO } from "../../nomes.js";

const main = document.getElementById("conteudo");
const idPedido = Number(param("id"));
let pedido = null;

const ROTULO_ACAO = {
  EM_PREPARO: "Iniciar preparo",
  SAIU_PARA_ENTREGA: 'Marcar como "Saiu para entrega"',
  ENTREGUE: 'Marcar como "Entregue"',
};
const ETAPAS = ["RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "ENTREGUE"];

function caixaStatus(p) {
  const posicao = ETAPAS.indexOf(p.status);
  const passos = p.linha_do_tempo.map((e, i) => `<li class="${i <= posicao ? "feito" : ""} ${e.atual ? "atual" : ""}">
      <span class="bolinha" aria-hidden="true"></span>${esc(e.texto)}${e.atual ? ' <span class="texto-pequeno" style="margin-left:auto;color:var(--marrom)">atual</span>' : ""}</li>`).join("");
  let acoes = "";
  if (p.proximo_status) {
    acoes += `<button type="button" class="botao botao-bloco" data-proximo="${p.proximo_status}">${esc(ROTULO_ACAO[p.proximo_status])}</button>`;
  }
  if (p.admin_pode_cancelar) acoes += '<button type="button" class="botao botao-perigo botao-bloco" data-cancelar>Cancelar pedido</button>';
  let nota = "Só o próximo status permitido aparece (RN-14).";
  if (p.status === "AGUARDANDO_PAGAMENTO") nota = "Aguardando o pagamento do cliente. Nenhuma ação disponível.";
  if (p.status === "ENTREGUE") nota = "Pedido entregue. Não há próximas etapas.";
  if (p.status === "CANCELADO") nota = "Pedido cancelado. Não há próximas etapas.";
  return `<section class="cartao cartao-creme"><h2>Atualizar status</h2>
      ${p.status === "CANCELADO" ? '<p class="status status-CANCELADO" style="margin-bottom:12px">✕ Cancelado</p>' : `<ol class="passos-status">${passos}</ol>`}
      <div class="pilha">${acoes}</div>
      <p class="texto-suave texto-pequeno" style="margin:10px 0 0">${nota}</p></section>`;
}

function desenhar() {
  const p = pedido;
  const aval = p.avaliacao;
  main.innerHTML = `
    <nav class="migalhas" aria-label="Você está em"><a href="/pages/admin/pedidos.html">Pedidos</a> › ${esc(p.numero_pedido)}</nav>
    <div class="linha" style="flex-wrap:wrap;margin-bottom:16px"><h1 style="margin:0">Pedido ${esc(p.numero_pedido)}</h1>${seloStatus(p.status, p.status_texto)}</div>
    <div class="grade-admin">
      <section class="cartao pilha">
        <div><h2>Cliente</h2><p style="margin:0">${esc(p.cliente.nome)} · ${esc(p.cliente.email)}${p.cliente.telefone ? ` · ${esc(formatarTelefone(p.cliente.telefone))}` : ""}</p></div>
        <div><h2>Endereço de entrega</h2><p style="margin:0">${esc(p.endereco_entrega)}</p></div>
        <div><h2>Itens</h2>
          <div class="tabela-rolagem"><table class="tabela" style="min-width:420px">
            <thead><tr><th scope="col">Produto</th><th scope="col" class="num">Qtd.</th><th scope="col" class="num">Preço unit.</th><th scope="col" class="num">Subtotal</th></tr></thead>
            <tbody>${p.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td class="num">${i.quantidade}</td><td class="num">${moeda(i.preco_unitario)}</td><td class="num">${moeda(i.subtotal)}</td></tr>`).join("")}</tbody>
          </table></div></div>
        <div class="coluna-dupla" style="align-items:start">
          <div><h2>Pagamento</h2><p style="margin:0 0 6px">${NOME_METODO[p.pagamento.metodo]}</p>
            <span class="status status-${p.pagamento.status === "APROVADO" ? "ENTREGUE" : p.pagamento.status === "RECUSADO" ? "CANCELADO" : "AGUARDANDO_PAGAMENTO"}">
              ${p.pagamento.status === "APROVADO" ? "✓" : p.pagamento.status === "RECUSADO" ? "✕" : "○"} ${NOME_STATUS_PAGAMENTO[p.pagamento.status]}</span></div>
          <div class="resumo-valores">
            <div class="linha-entre"><span>Subtotal</span><span>${moeda(p.subtotal)}</span></div>
            ${p.cupom ? `<div class="linha-entre"><span>Desconto (cupom ${esc(p.cupom)})</span><span class="desconto">− ${moeda(p.valor_desconto)}</span></div>` : ""}
            <div class="linha-entre"><span>Taxa de entrega</span><span>${moeda(p.taxa_entrega)}</span></div>
            <div class="linha-entre total"><span>Total</span><span>${moeda(p.valor_total)}</span></div>
          </div>
        </div>
        <p class="texto-suave texto-pequeno" style="margin:0">Feito em ${dataHora(p.data_pedido)} · última atualização ${dataHora(p.data_atualizacao)}</p>
      </section>
      <div class="pilha">
        ${caixaStatus(p)}
        <section class="cartao"><h2>Avaliação do cliente</h2>
          ${aval ? `<p style="margin:0"><span class="estrelas-leitura" role="img" aria-label="${aval.nota} de 5 estrelas">${"★".repeat(aval.nota)}${"☆".repeat(5 - aval.nota)}</span>
              <span class="texto-suave texto-pequeno">${dataHora(aval.data_avaliacao)}</span></p>
              <p style="margin:6px 0 0">${aval.comentario ? esc(aval.comentario) : '<span class="texto-suave">Sem comentário.</span>'}</p>`
            : '<p class="texto-suave" style="margin:0">Ainda não avaliado. A avaliação aparece aqui depois que o pedido for entregue e o cliente avaliar.</p>'}
        </section>
      </div>
    </div>`;
}

async function mudarStatus(novo, botao) {
  await comCarregamento(botao, async () => {
    try {
      const r = await api(`/api/admin/pedidos/${idPedido}/status`, { method: "PUT",
        body: { novo_status: novo, status_atual: pedido.status } });
      pedido = r.pedido;
      desenhar();
      toast(r.mensagem); // MSG-S08
    } catch (erro) {
      toast(erro.message, "erro"); // MSG-E14: recarrega a tela
      if (erro.codigo === "MSG-E14") await carregar();
    }
  });
}

main.addEventListener("click", async (e) => {
  const proximo = e.target.closest("[data-proximo]");
  if (proximo) { await mudarStatus(proximo.dataset.proximo, proximo); return; }
  const cancelar = e.target.closest("[data-cancelar]");
  if (cancelar) {
    const ok = await confirmar({ titulo: `Cancelar o pedido ${pedido.numero_pedido}?`,
      texto: "As quantidades voltam para o estoque e o cliente recebe uma notificação. Essa ação não pode ser desfeita.",
      confirmar: "Sim, cancelar", cancelar: "Voltar", perigo: true });
    if (ok) await mudarStatus("CANCELADO", cancelar);
  }
});

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    pedido = (await api(`/api/admin/pedidos/${idPedido}`)).pedido;
    document.title = `Pedido ${pedido.numero_pedido} – Painel`;
    desenhar();
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

(async () => {
  if (!(await iniciarPagina({ area: "admin", nav: "pedidos" }))) return;
  carregar();
})();
