// T06 – Finalizar pedido: endereço de entrega (UC-08)
import { api } from "../api.js";
import { iniciarPagina } from "../layout.js";
import { esc, moeda, formatarCep, htmlCarregando, mostrarErroCarregamento, avisoProximaTela, icone } from "../ui.js";

const main = document.getElementById("conteudo");

function textoEndereco(e) {
  return `${esc(e.logradouro)}, ${esc(e.numero)}${e.complemento ? `, ${esc(e.complemento)}` : ""}<br>
    <span class="texto-suave texto-pequeno">${esc(e.bairro)} · ${esc(e.cidade)} – ${esc(e.uf)} · ${formatarCep(e.cep)}</span>`;
}

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    const [{ carrinho }, enderecos] = await Promise.all([api("/api/carrinho"), api("/api/enderecos")]);
    if (carrinho.vazio) { window.location.replace("/pages/carrinho.html"); return; }
    if (!enderecos.length) {
      // Sem endereço: o formulário de endereço abre direto e depois volta para cá
      avisoProximaTela("Cadastre um endereço de entrega para continuar.", "aviso");
      window.location.replace("/pages/enderecos.html?novo=1&voltar=/pages/checkout.html");
      return;
    }
    let escolhido = null;
    try { escolhido = Number(sessionStorage.getItem("checkout_endereco")) || null; } catch (e) { /* ignora */ }
    if (!enderecos.some((e) => e.id_endereco === escolhido)) escolhido = (enderecos.find((e) => e.padrao) || enderecos[0]).id_endereco;

    const podeSeguir = carrinho.pode_finalizar && !carrinho.aviso && !carrinho.aviso_cupom;
    main.innerHTML = `
      <div class="etapas" aria-label="Etapa 1 de 2"><div class="etapa ativa"><span>1</span>Endereço</div><div class="etapa"><span>2</span>Pagamento</div></div>
      ${!podeSeguir ? `<div class="alerta alerta-erro" role="alert"><p>${esc(carrinho.aviso || carrinho.aviso_cupom || "Alguns itens do carrinho mudaram de preço ou ficaram indisponíveis. Revise antes de continuar.")}</p></div>` : ""}
      <form id="form-endereco" class="pilha">
        <fieldset style="border:0;padding:0;margin:0" class="pilha">
          <legend><h2>Onde vamos entregar?</h2></legend>
          ${enderecos.map((e) => `
            <label class="opcao-endereco">
              <input type="radio" name="endereco" value="${e.id_endereco}" ${e.id_endereco === escolhido ? "checked" : ""}>
              <span><strong>${esc(e.apelido)}</strong> ${e.padrao ? '<span class="selo selo-padrao">Padrão</span>' : ""}<br>${textoEndereco(e)}</span>
            </label>`).join("")}
        </fieldset>
        ${enderecos.length < 5 ? `<a class="botao botao-secundario" href="/pages/enderecos.html?novo=1&voltar=/pages/checkout.html">${icone("mais")}Cadastrar novo endereço</a>` : ""}
        <p class="texto-suave texto-pequeno">Nome e telefone vêm da sua conta – não é preciso digitar de novo.</p>
        <section class="cartao cartao-creme" aria-label="Resumo do pedido">
          <h2>Resumo do pedido</h2>
          <p style="margin:0 0 6px">${carrinho.itens.map((i) => `${i.quantidade}x ${esc(i.nome)}`).join(" · ")}</p>
          <div class="resumo-valores">
            <div class="linha-entre"><span>Subtotal</span><span>${moeda(carrinho.subtotal)}</span></div>
            ${carrinho.cupom ? `<div class="linha-entre"><span>Desconto (${esc(carrinho.cupom.codigo)})</span><span class="desconto">− ${moeda(carrinho.desconto)}</span></div>` : ""}
            <div class="linha-entre"><span>Taxa de entrega</span><span>${moeda(carrinho.taxa_entrega)}</span></div>
            <div class="linha-entre total"><span>Total</span><span>${moeda(carrinho.total)}</span></div>
          </div>
        </section>
        <div class="acoes-rodape">
          <button class="botao botao-bloco" type="submit" ${podeSeguir ? "" : "disabled"}>Continuar para pagamento ${icone("seta")}</button>
          <a class="botao-link centro" href="/pages/carrinho.html">Voltar ao carrinho</a>
        </div>
      </form>`;

    document.getElementById("form-endereco").addEventListener("submit", (e) => {
      e.preventDefault();
      const marcado = e.target.querySelector("input[name=endereco]:checked");
      if (!marcado) return;
      try {
        sessionStorage.setItem("checkout_endereco", marcado.value);
        sessionStorage.removeItem("checkout_pedido");
      } catch (erro) { /* ignora */ }
      window.location.href = `/pages/pagamento.html?endereco=${marcado.value}`;
    });
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Finalizar Pedido", voltar: "/pages/carrinho.html", nav: "carrinho" }))) return;
  carregar();
})();
