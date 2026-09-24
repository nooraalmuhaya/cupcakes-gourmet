// T03 – Carrinho (UC-03) e cupom (UC-04)
import { api } from "../api.js";
import { iniciarPagina, atualizarContadorCarrinho } from "../layout.js";
import { esc, moeda, imagem, IMG_FALLBACK, htmlCarregando, htmlVazio, mostrarErroCarregamento, toast, comCarregamento, icone } from "../ui.js";

const main = document.getElementById("conteudo");
let carrinho = null;
let logado = false;
let erroCupom = "";

function desenhar() {
  const c = carrinho;
  atualizarContadorCarrinho(c.quantidade_itens);
  const contagem = document.querySelector("[data-itens]");
  if (contagem) contagem.textContent = c.quantidade_itens ? `${c.quantidade_itens} ${c.quantidade_itens === 1 ? "item" : "itens"}` : "";

  if (c.vazio) {
    main.innerHTML = htmlVazio({ icone: "🛒", titulo: "Seu carrinho está vazio.", texto: "Que tal escolher um cupcake?",
      acao: '<a class="botao" href="/index.html">Ver cardápio</a>' }) + // MSG-I03
      '<button type="button" class="botao botao-bloco" disabled>Finalizar compra</button>';
    return;
  }

  const itens = c.itens.map((i) => `
    <li class="item-carrinho ${i.disponivel ? "" : "indisponivel"}">
      <img src="${esc(imagem(i.imagem_url))}" alt="" onerror="${IMG_FALLBACK}">
      <div class="pilha" style="gap:4px">
        <span class="nome">${esc(i.nome)}</span>
        <span class="texto-suave texto-pequeno">${moeda(i.preco)} cada${i.preco_alterado ? " · <strong>preço atualizado</strong>" : ""}</span>
        ${i.disponivel ? `<div class="quantidade" role="group" aria-label="Quantidade de ${esc(i.nome)}">
            <button type="button" data-alterar="${i.id_produto}" data-nova="${i.quantidade - 1}" aria-label="Diminuir" ${i.quantidade <= 1 ? "disabled" : ""}>−</button>
            <span>${i.quantidade}</span>
            <button type="button" data-alterar="${i.id_produto}" data-nova="${i.quantidade + 1}" aria-label="Aumentar" ${i.quantidade >= i.quantidade_estoque ? "disabled" : ""}>+</button>
          </div>`
          : `<span class="erro-campo">${i.quantidade_estoque > 0
              ? `Só temos ${i.quantidade_estoque} unidades deste cupcake no momento.`
              : "Este cupcake ficou indisponível. Remova-o para continuar."}</span>
             ${i.quantidade_estoque > 0 ? `<button type="button" class="botao-link" data-alterar="${i.id_produto}" data-nova="${i.quantidade_estoque}">Ajustar para ${i.quantidade_estoque}</button>` : ""}`}
      </div>
      <div class="direita">
        <button type="button" class="botao-icone" style="color:var(--erro)" data-remover="${i.id_produto}" aria-label="Remover ${esc(i.nome)}">${icone("lixeira")}</button>
        <strong>${moeda(i.subtotal)}</strong>
      </div>
    </li>`).join("");

  const cupom = c.cupom
    ? `<div class="cupom-aplicado"><span>✓ ${esc(c.cupom.codigo)} aplicado</span>
         <button type="button" class="botao-link perigo" data-remover-cupom>Remover</button></div>`
    : `<form class="form-cupom" id="form-cupom" novalidate>
         <div class="campo ${erroCupom ? "com-erro" : ""}">
           <label class="visualmente-oculto" for="codigo">Código do cupom</label>
           <input id="codigo" name="codigo" maxlength="20" autocomplete="off" placeholder="Digite o código" style="text-transform:uppercase">
           <div class="erro-campo" role="alert">${esc(erroCupom)}</div>
         </div>
         <button class="botao" type="submit">Aplicar</button>
       </form>
       ${logado ? "" : '<p class="texto-suave texto-pequeno"><a href="/pages/login.html?voltar=/pages/carrinho.html">Entre na sua conta</a> para usar um cupom.</p>'}`;

  main.innerHTML = `
    ${c.aviso ? `<div class="alerta alerta-aviso" role="alert"><p>${esc(c.aviso)}</p></div>` : ""}
    ${c.aviso_cupom ? `<div class="alerta alerta-aviso" role="alert"><p>${esc(c.aviso_cupom)} O cupom foi removido.</p></div>` : ""}
    <ul style="list-style:none;margin:0;padding:0">${itens}</ul>
    <section class="pilha" style="margin-top:16px" aria-labelledby="titulo-cupom">
      <h2 id="titulo-cupom" style="color:var(--texto)">Cupom de desconto</h2>
      ${cupom}
    </section>
    <section class="cartao cartao-creme resumo-valores" style="margin-top:16px" aria-label="Resumo dos valores">
      <div class="linha-entre"><span>Subtotal</span><span>${moeda(c.subtotal)}</span></div>
      ${c.cupom ? `<div class="linha-entre"><span>Desconto (${esc(c.cupom.codigo)})</span><span class="desconto">− ${moeda(c.desconto)}</span></div>` : ""}
      <div class="linha-entre"><span>Taxa de entrega</span><span>${moeda(c.taxa_entrega)}</span></div>
      <div class="linha-entre total"><span>Total</span><span>${moeda(c.total)}</span></div>
    </section>
    <div class="acoes-rodape">
      <button type="button" class="botao botao-bloco" id="finalizar" ${c.pode_finalizar ? "" : "disabled"}>Finalizar compra</button>
      <a class="botao botao-secundario botao-bloco" href="/index.html">Continuar comprando</a>
    </div>`;
}

async function executar(acao, botao) {
  const tarefa = async () => {
    try {
      const r = await acao();
      carrinho = r.carrinho;
      desenhar();
      if (r.mensagem) toast(r.mensagem);
      return true;
    } catch (erro) {
      toast(erro.message, "erro");
      return false;
    }
  };
  return botao ? comCarregamento(botao, tarefa) : tarefa();
}

main.addEventListener("click", async (e) => {
  const alterar = e.target.closest("[data-alterar]");
  if (alterar) {
    await executar(() => api(`/api/carrinho/itens/${alterar.dataset.alterar}`, { method: "PUT", body: { quantidade: Number(alterar.dataset.nova) } }), alterar);
    return;
  }
  const remover = e.target.closest("[data-remover]");
  if (remover) {
    await executar(() => api(`/api/carrinho/itens/${remover.dataset.remover}`, { method: "DELETE" }), remover); // MSG-S02
    return;
  }
  const removerCupom = e.target.closest("[data-remover-cupom]");
  if (removerCupom) {
    await executar(() => api("/api/carrinho/cupom", { method: "DELETE" }), removerCupom);
    return;
  }
  if (e.target.closest("#finalizar")) {
    // T03 → T06, ou T04 se não estiver logado
    window.location.href = logado ? "/pages/checkout.html" : "/pages/login.html?voltar=/pages/checkout.html&motivo=protegida";
  }
});

main.addEventListener("submit", async (e) => {
  if (e.target.id !== "form-cupom") return;
  e.preventDefault();
  const codigo = e.target.codigo.value.trim();
  const botao = e.target.querySelector("button");
  if (!codigo) { erroCupom = "Preencha este campo."; desenhar(); document.getElementById("codigo")?.focus(); return; }
  if (!logado) { erroCupom = "Faça login para usar um cupom."; desenhar(); return; } // MSG-E09
  await comCarregamento(botao, async () => {
    try {
      const r = await api("/api/carrinho/cupom", { method: "POST", body: { codigo } });
      erroCupom = "";
      carrinho = r.carrinho;
      desenhar();
      toast(r.mensagem); // MSG-S04
    } catch (erro) {
      erroCupom = erro.message; // MSG-E08 com o motivo
      desenhar();
      const campo = document.getElementById("codigo");
      if (campo) { campo.value = codigo; campo.focus(); }
    }
  });
});

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    carrinho = (await api("/api/carrinho")).carrinho;
    desenhar();
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

(async () => {
  const sessao = await iniciarPagina({ area: "publica", titulo: "Carrinho", nav: "carrinho", voltar: "/index.html",
    direita: '<span class="texto-pequeno" data-itens></span>' });
  if (!sessao) return;
  logado = Boolean(sessao.usuario);
  carregar();
})();
