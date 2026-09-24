// T11 – Avaliar pedido (UC-13, RN-17)
import { api } from "../api.js";
import { iniciarPagina } from "../layout.js";
import { esc, data, htmlCarregando, mostrarErroCarregamento, comCarregamento, param, avisoProximaTela, icone } from "../ui.js";

const main = document.getElementById("conteudo");
const idPedido = Number(param("pedido"));
let nota = 0;

function desenharEstrelas() {
  main.querySelectorAll("[data-nota]").forEach((b) => {
    const valor = Number(b.dataset.nota);
    b.classList.toggle("acesa", valor <= nota);
    b.setAttribute("aria-pressed", String(valor === nota));
  });
  document.getElementById("texto-nota").textContent = nota ? `${nota} de 5 estrelas` : "Toque nas estrelas para dar sua nota";
}

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    const { pedido: p } = await api(`/api/pedidos/${idPedido}`);
    if (!p.pode_avaliar) {
      main.innerHTML = `<div class="estado"><div class="icone-estado" aria-hidden="true">${icone("alerta")}</div>
        <strong>Este pedido não pode ser avaliado.</strong>
        <p>${p.avaliacao ? "Você já avaliou este pedido." : "Só pedidos entregues podem ser avaliados."}</p>
        <a class="botao" href="/pages/pedidos.html">Voltar para Meus Pedidos</a></div>`; // MSG-E20
      return;
    }
    const entregue = p.linha_do_tempo.find((e) => e.status === "ENTREGUE");
    main.innerHTML = `
      <div class="cartao cartao-creme"><strong>${esc(p.numero_pedido)}</strong> · Entregue${entregue?.data ? ` em ${data(entregue.data)}` : ""}
        <p class="texto-suave texto-pequeno" style="margin:4px 0 0">${p.itens.map((i) => `${i.quantidade}x ${esc(i.nome)}`).join(" · ")}</p></div>
      <form id="form-avaliacao" novalidate>
        <fieldset class="estrelas" style="flex-wrap:wrap">
          <legend>Como foi seu pedido?</legend>
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-nota="${n}" aria-label="${n} estrela${n > 1 ? "s" : ""}" aria-pressed="false">${icone("estrela")}</button>`).join("")}
        </fieldset>
        <p id="texto-nota" class="centro texto-suave" aria-live="polite"></p>
        <div id="erro-nota" class="erro-campo centro" role="alert" style="justify-content:center"></div>
        <div class="campo">
          <label for="comentario">Comentário <span class="opcional">(opcional)</span></label>
          <textarea id="comentario" name="comentario" maxlength="500" aria-describedby="contador"></textarea>
          <div id="contador" class="contador-caracteres">0/500</div>
        </div>
        <p class="texto-suave texto-pequeno">A avaliação não pode ser editada depois de enviada.</p>
        <div class="acoes-rodape">
          <button class="botao botao-bloco" type="submit">Enviar avaliação</button>
          <a class="botao-link centro" href="/pages/pedidos.html">Cancelar</a>
        </div>
      </form>`;
    desenharEstrelas();
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

main.addEventListener("click", (e) => {
  const estrela = e.target.closest("[data-nota]");
  if (!estrela) return;
  nota = Number(estrela.dataset.nota);
  document.getElementById("erro-nota").textContent = "";
  desenharEstrelas();
});

// Prévia: ao passar o mouse (ou focar pelo teclado) acende as estrelas até aquela
function previa(ate) {
  main.querySelectorAll("[data-nota]").forEach((b) => b.classList.toggle("previa", Number(b.dataset.nota) <= ate));
}
main.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-nota]"); if (b) previa(Number(b.dataset.nota)); });
main.addEventListener("pointerout", (e) => { if (e.target.closest("[data-nota]")) previa(0); });
main.addEventListener("focusin", (e) => { const b = e.target.closest("[data-nota]"); if (b) previa(Number(b.dataset.nota)); });
main.addEventListener("focusout", (e) => { if (e.target.closest("[data-nota]")) previa(0); });

main.addEventListener("input", (e) => {
  if (e.target.id === "comentario") document.getElementById("contador").textContent = `${e.target.value.length}/500`;
});

main.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!nota) { document.getElementById("erro-nota").textContent = "Escolha uma nota de 1 a 5 estrelas."; return; } // MSG-E12
  await comCarregamento(e.target.querySelector("button[type=submit]"), async () => {
    try {
      const r = await api(`/api/pedidos/${idPedido}/avaliacao`, { method: "POST",
        body: { nota, comentario: e.target.comentario.value.trim() || null } });
      avisoProximaTela(r.mensagem); // MSG-S07
      window.location.href = "/pages/pedidos.html";
    } catch (erro) {
      document.getElementById("erro-nota").textContent = erro.message;
    }
  });
});

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Avaliar Pedido", voltar: "/pages/pedidos.html", nav: "pedidos" }))) return;
  carregar();
})();
