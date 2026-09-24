// T07 – Pagamento simulado (UC-09, RN-11). Os dados do cartão não são salvos.
import { api } from "../api.js";
import { iniciarPagina } from "../layout.js";
import { NOME_METODO } from "../nomes.js";
import { esc, moeda, htmlCarregando, mostrarErroCarregamento, comCarregamento, limparErros, erroNoCampo, confirmar, param, avisoProximaTela, toast, icone } from "../ui.js";

const main = document.getElementById("conteudo");
let metodo = "CREDITO";
let pedido = null;          // pedido já criado (AGUARDANDO_PAGAMENTO)
let idEndereco = null;
let total = 0;

const NOMES = { CREDITO: "Crédito", DEBITO: "Débito", PIX: "PIX" };
const ICONE_METODO = { CREDITO: "credito", DEBITO: "debito", PIX: "pix" };

function qrIlustrativo() {
  // Desenho fixo só para ilustrar (não é um QR Code de verdade)
  const celulas = [];
  let semente = 7;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    semente = (semente * 73 + 41) % 101;
    const canto = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    const borda = canto && (x % 6 === 0 || y % 6 === 0 || (x > 13 && (x - 14) % 6 === 0) || (y > 13 && (y - 14) % 6 === 0));
    const miolo = canto && ((x % 14 >= 2 && x % 14 <= 4) && (y % 14 >= 2 && y % 14 <= 4));
    if (borda || miolo || (!canto && semente % 2 === 0)) celulas.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  return `<svg class="qr-code" viewBox="0 0 21 21" role="img" aria-label="QR Code ilustrativo (demonstração)" shape-rendering="crispEdges">${celulas.join("")}</svg>`;
}

function desenhar() {
  main.innerHTML = `
    <div class="etapas etapa-2" aria-label="Etapa 2 de 2"><div class="etapa feita"><span>${icone("check")}</span>Endereço</div><div class="etapa ativa"><span>2</span>Pagamento</div></div>
    <div class="total-destaque"><span class="texto-suave">Total a pagar</span><strong>${moeda(total)}</strong></div>
    <div class="alerta alerta-info" style="margin-top:12px"><p>Ambiente de demonstração: nenhum valor real é cobrado.</p></div>
    <div id="area-resultado"></div>
    <form id="form-pagamento" novalidate>
      <fieldset style="border:0;padding:0;margin:0 0 16px">
        <legend class="rotulo" style="margin-bottom:8px">Forma de pagamento</legend>
        <div class="metodos">
          ${["CREDITO", "DEBITO", "PIX"].map((m) => `<button type="button" class="metodo" data-metodo="${m}" aria-pressed="${m === metodo}">
              <span class="marca-selecao" aria-hidden="true">${icone("check")}</span>
              ${icone(ICONE_METODO[m])}${NOMES[m]}</button>`).join("")}
        </div>
      </fieldset>
      <div id="campos-cartao" ${metodo === "PIX" ? "hidden" : ""}>
        <div class="campo"><label for="numero">Número do cartão</label>
          <input id="numero" name="numero" inputmode="numeric" autocomplete="off" maxlength="19" placeholder="Somente números (16 dígitos)"></div>
        <div class="campo"><label for="nome">Nome impresso no cartão</label>
          <input id="nome" name="nome" autocomplete="off" maxlength="60" placeholder="Como aparece no cartão"></div>
        <div class="coluna-dupla">
          <div class="campo"><label for="validade">Validade</label>
            <input id="validade" name="validade" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="MM/AA"></div>
          <div class="campo"><label for="cvv">CVV</label>
            <input id="cvv" name="cvv" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="3 dígitos"></div>
        </div>
        <p class="nota-segura">${icone("cadeado")}Os dados do cartão não são salvos. Cartão de teste: final 0000 é sempre recusado.</p>
      </div>
      <div id="area-pix" class="centro" ${metodo === "PIX" ? "" : "hidden"}>
        ${qrIlustrativo()}
        <p class="texto-suave texto-pequeno">QR Code ilustrativo (demonstração)</p>
      </div>
      <div class="acoes-rodape">
        <button class="botao botao-bloco" type="submit" id="confirmar">${metodo === "PIX" ? "Simular pagamento PIX" : "Confirmar pagamento"}</button>
        ${pedido ? '<button type="button" class="botao botao-perigo botao-bloco" data-cancelar>Cancelar pedido</button>'
                 : '<a class="botao-link centro" href="/pages/checkout.html">Voltar</a>'}
      </div>
    </form>`;
}

function validarCartao(form) {
  // CA2 (US07): validado antes do envio (MSG-E11)
  let ok = true;
  const numero = form.numero.value.replace(/[\s.-]/g, "");
  if (!/^\d{16}$/.test(numero)) { erroNoCampo(form, "numero", "Confira os dados do cartão: número do cartão (16 dígitos)."); ok = false; }
  if (!form.nome.value.trim()) { erroNoCampo(form, "nome", "Confira os dados do cartão: nome impresso no cartão."); ok = false; }
  const m = /^(\d{2})\/(\d{2})$/.exec(form.validade.value.trim());
  const hoje = new Date();
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) { erroNoCampo(form, "validade", "Confira os dados do cartão: validade (MM/AA)."); ok = false; }
  else if (2000 + Number(m[2]) < hoje.getFullYear() || (2000 + Number(m[2]) === hoje.getFullYear() && Number(m[1]) < hoje.getMonth() + 1)) {
    erroNoCampo(form, "validade", "Confira os dados do cartão: validade (cartão vencido)."); ok = false;
  }
  if (!/^\d{3}$/.test(form.cvv.value.trim())) { erroNoCampo(form, "cvv", "Confira os dados do cartão: CVV (3 dígitos)."); ok = false; }
  return ok ? { numero, nome: form.nome.value.trim(), validade: form.validade.value.trim(), cvv: form.cvv.value.trim() } : null;
}

function mostrarRecusa(finalCartao) {
  const area = document.getElementById("area-resultado");
  area.innerHTML = `<section class="recusa pilha" role="alert">
      <h2>${icone("erro")}Não foi possível pagar</h2>
      <p style="margin:0">Pagamento recusado. Tente novamente ou escolha outra forma de pagamento.</p>
      ${finalCartao ? `<p class="texto-suave texto-pequeno" style="margin:0">${NOME_METODO[metodo]} •••• ${esc(finalCartao)}</p>` : ""}
      <div class="pilha">
        <button type="button" class="botao" data-tentar>Tentar novamente</button>
        <button type="button" class="botao botao-secundario" data-trocar>Trocar forma de pagamento</button>
        <button type="button" class="botao botao-perigo" data-cancelar>Cancelar pedido</button>
        <p class="texto-suave texto-pequeno centro" style="margin:0">Se cancelar, os itens continuam no seu carrinho.</p>
      </div>
    </section>`;
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function pagar(botao) {
  const form = document.getElementById("form-pagamento");
  limparErros(form);
  document.getElementById("area-resultado").innerHTML = "";
  let cartao = null;
  if (metodo !== "PIX") {
    cartao = validarCartao(form);
    if (!cartao) { form.querySelector("[aria-invalid='true']").focus(); return; }
  }
  await comCarregamento(botao, async () => {
    try {
      if (!pedido) {
        // SD-01: o pedido é criado (AGUARDANDO_PAGAMENTO) e em seguida o pagamento é processado
        const r = await api("/api/pedidos", { method: "POST", body: { id_endereco: idEndereco, metodo } });
        pedido = r.pedido;
        try { sessionStorage.setItem("checkout_pedido", String(pedido.id_pedido)); } catch (e) { /* ignora */ }
        const voltar = form.querySelector('a[href="/pages/checkout.html"]');
        if (voltar) voltar.outerHTML = '<button type="button" class="botao botao-perigo botao-bloco" data-cancelar>Cancelar pedido</button>';
      }
      const r = await api("/api/pagamentos", { method: "POST", body: { id_pedido: pedido.id_pedido, metodo, cartao } });
      try { sessionStorage.removeItem("checkout_pedido"); sessionStorage.removeItem("checkout_endereco"); } catch (e) { /* ignora */ }
      window.location.href = `/pages/confirmacao.html?pedido=${r.pedido.id_pedido}`;
    } catch (erro) {
      if (erro.status === 402) { mostrarRecusa(cartao ? cartao.numero.slice(-4) : ""); return; } // MSG-E10
      if (erro.codigo === "MSG-E07" && !pedido) { // UC-08 E3: volta ao carrinho com valores atualizados
        avisoProximaTela(erro.message, "erro");
        window.location.href = "/pages/carrinho.html";
        return;
      }
      if (erro.codigo === "MSG-E11" && erro.campo) { erroNoCampo(form, erro.campo, erro.message); return; }
      document.getElementById("area-resultado").innerHTML =
        `<div class="alerta alerta-erro" role="alert"><p>${esc(erro.message)}</p></div>`;
    }
  });
}

async function cancelarPedido(botao) {
  const ok = await confirmar({ titulo: "Cancelar este pedido?", texto: "Os itens continuam no seu carrinho.",
    confirmar: "Sim, cancelar", cancelar: "Voltar", perigo: true });
  if (!ok) return;
  await comCarregamento(botao, async () => {
    try {
      const r = await api(`/api/pedidos/${pedido.id_pedido}/cancelar`, { method: "POST" });
      try { sessionStorage.removeItem("checkout_pedido"); } catch (e) { /* ignora */ }
      avisoProximaTela(r.mensagem);
      window.location.href = "/pages/carrinho.html";
    } catch (erro) {
      toast(erro.message, "erro");
    }
  });
}

main.addEventListener("click", (e) => {
  const botaoMetodo = e.target.closest("[data-metodo]");
  if (botaoMetodo) {
    metodo = botaoMetodo.dataset.metodo;
    main.querySelectorAll("[data-metodo]").forEach((b) => b.setAttribute("aria-pressed", String(b === botaoMetodo)));
    document.getElementById("campos-cartao").hidden = metodo === "PIX";
    document.getElementById("area-pix").hidden = metodo !== "PIX";
    document.getElementById("confirmar").textContent = metodo === "PIX" ? "Simular pagamento PIX" : "Confirmar pagamento";
    return;
  }
  if (e.target.closest("[data-tentar]")) { pagar(e.target.closest("[data-tentar]")); return; }
  if (e.target.closest("[data-trocar]")) {
    document.getElementById("area-resultado").innerHTML = "";
    main.querySelector("[data-metodo]").focus();
    return;
  }
  const cancelar = e.target.closest("[data-cancelar]");
  if (cancelar) cancelarPedido(cancelar);
});

main.addEventListener("submit", (e) => {
  e.preventDefault();
  pagar(document.getElementById("confirmar"));
});

main.addEventListener("input", (e) => {
  if (e.target.name === "validade") {
    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }
  if (e.target.name === "cvv") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
});

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    // Pedido que ainda aguarda pagamento (voltou de uma recusa ou veio de "Pagar agora")
    let idPedido = Number(param("pedido")) || null;
    if (!idPedido) { try { idPedido = Number(sessionStorage.getItem("checkout_pedido")) || null; } catch (e) { /* ignora */ } }
    if (idPedido) {
      try {
        const r = await api(`/api/pedidos/${idPedido}`);
        if (r.pedido.status === "AGUARDANDO_PAGAMENTO") {
          pedido = r.pedido;
          total = pedido.valor_total;
          metodo = pedido.pagamento?.metodo || "CREDITO";
        }
      } catch (e) { /* segue como pedido novo */ }
    }
    if (!pedido) {
      idEndereco = Number(param("endereco")) || null;
      if (!idEndereco) { try { idEndereco = Number(sessionStorage.getItem("checkout_endereco")) || null; } catch (e) { /* ignora */ } }
      if (!idEndereco) { window.location.replace("/pages/checkout.html"); return; }
      const { carrinho } = await api("/api/carrinho");
      if (carrinho.vazio) { window.location.replace("/pages/carrinho.html"); return; }
      total = carrinho.total;
    }
    desenhar();
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Pagamento", voltar: "/pages/checkout.html", nav: "carrinho" }))) return;
  carregar();
})();
