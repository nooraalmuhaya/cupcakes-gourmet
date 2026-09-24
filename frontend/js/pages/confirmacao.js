// T08 – Confirmação do pedido
import { api } from "../api.js";
import { iniciarPagina } from "../layout.js";
import { esc, moeda, htmlCarregando, mostrarErroCarregamento, param, icone } from "../ui.js";
import { NOME_METODO, NOME_STATUS_PAGAMENTO } from "../nomes.js";

const main = document.getElementById("conteudo");

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    const { pedido: p } = await api(`/api/pedidos/${Number(param("pedido"))}`);
    main.innerHTML = `<div class="pilha centro">
        <div class="sucesso-icone" aria-hidden="true">${icone("check")}</div>
        <h1>Pedido realizado com sucesso!</h1>
        <p class="texto-suave">A loja já recebeu seu pedido.</p>
      </div>
      <div class="numero-pedido" style="margin:16px 0"><span class="texto-suave texto-pequeno">Número do pedido</span>
        <strong>${esc(p.numero_pedido)}</strong></div>
      <dl class="lista-dados">
        <dt>Itens</dt><dd>${p.itens.map((i) => `${i.quantidade}x ${esc(i.nome)}`).join(", ")}</dd>
        <dt>Entrega</dt><dd>${esc(p.endereco_entrega)}</dd>
        <dt>Pagamento</dt><dd>${NOME_METODO[p.pagamento.metodo]} · ${NOME_STATUS_PAGAMENTO[p.pagamento.status]}</dd>
        ${p.cupom ? `<dt>Cupom</dt><dd>${esc(p.cupom)} (− ${moeda(p.valor_desconto)})</dd>` : ""}
        <dt>Total</dt><dd>${moeda(p.valor_total)}</dd>
      </dl>
      <p class="texto-suave texto-pequeno" style="margin-top:14px">Você vai receber uma notificação a cada mudança de status.</p>
      <div class="acoes-rodape">
        <a class="botao botao-bloco" href="/pages/acompanhar.html?pedido=${p.id_pedido}">${icone("entrega")}Acompanhar pedido</a>
        <a class="botao botao-secundario botao-bloco" href="/index.html">Voltar ao início</a>
      </div>`;
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Pedido Confirmado", voltar: "/index.html", nav: "pedidos" }))) return;
  carregar();
})();
