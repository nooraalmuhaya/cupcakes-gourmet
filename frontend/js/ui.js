/**
 * Utilitários de interface usados por todas as telas (seção 10.1 do relatório):
 * formatação, ícones, aviso rápido (toast), confirmação em modal, carregando,
 * estados vazios e erros de formulário.
 */

// ---------------------------------------------------------------- texto seguro
export function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// ---------------------------------------------------------------- formatação
const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const moeda = (valor) => formatoMoeda.format(Number(valor || 0));

export function dataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
export const data = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");
export const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

export function dataRelativa(iso) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia ? `Hoje, ${hora(iso)}` : `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${hora(iso)}`;
}

export const formatarCep = (cep) => (cep && cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep || "");
export function formatarTelefone(t) {
  if (!t) return "";
  if (t.length === 11) return `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}`;
  if (t.length === 10) return `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`;
  return t;
}

export function imagem(url) {
  if (!url) return "/assets/images/produtos/sem-imagem.svg";
  return /^(https?:)?\//.test(url) ? url : `/${url}`;
}
export const IMG_FALLBACK = "this.onerror=null;this.src='/assets/images/produtos/sem-imagem.svg'";

export const param = (nome) => new URLSearchParams(window.location.search).get(nome);

// ---------------------------------------------------------------- ícones (SVG em linha)
const ICONES = {
  voltar: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  sino: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  carrinho: '<path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19" r="1.6" fill="currentColor"/><circle cx="17" cy="19" r="1.6" fill="currentColor"/>',
  inicio: '<path d="M3 11l9-7 9 7M6 9.5V20h12V9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  pedidos: '<rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  conta: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-4.5 4.5-6 8-6s7 1.5 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  lupa: '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  lixeira: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  seta: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};
export function icone(nome, rotulo = "") {
  const aria = rotulo ? `role="img" aria-label="${esc(rotulo)}"` : 'aria-hidden="true"';
  return `<svg viewBox="0 0 24 24" ${aria} focusable="false">${ICONES[nome] || ""}</svg>`;
}

// ---------------------------------------------------------------- status do pedido
const ICONE_STATUS = {
  AGUARDANDO_PAGAMENTO: "○", RECEBIDO: "●", EM_PREPARO: "●", SAIU_PARA_ENTREGA: "●", ENTREGUE: "✓", CANCELADO: "✕",
};
export function seloStatus(status, texto) {
  return `<span class="status status-${esc(status)}"><span aria-hidden="true">${ICONE_STATUS[status] || "●"}</span>${esc(texto)}</span>`;
}

// ---------------------------------------------------------------- toast (3 segundos)
function areaToast() {
  let area = document.querySelector(".toast-area");
  if (!area) {
    area = document.createElement("div");
    area.className = "toast-area";
    area.setAttribute("role", "status");
    area.setAttribute("aria-live", "polite");
    document.body.appendChild(area);
  }
  return area;
}
export function toast(mensagem, tipo = "sucesso") {
  if (!mensagem) return;
  const item = document.createElement("div");
  item.className = `toast toast-${tipo}`;
  item.textContent = mensagem;
  areaToast().appendChild(item);
  setTimeout(() => item.remove(), 3000);
}

/** Guarda um aviso para aparecer na próxima tela (ex.: depois de um redirecionamento). */
export function avisoProximaTela(mensagem, tipo = "sucesso") {
  try { sessionStorage.setItem("aviso", JSON.stringify({ mensagem, tipo })); } catch (e) { /* sem armazenamento */ }
}
export function mostrarAvisoPendente() {
  try {
    const salvo = sessionStorage.getItem("aviso");
    if (salvo) {
      sessionStorage.removeItem("aviso");
      const { mensagem, tipo } = JSON.parse(salvo);
      toast(mensagem, tipo);
    }
  } catch (e) { /* sem armazenamento */ }
}

// ---------------------------------------------------------------- confirmação (modal)
export function confirmar({ titulo, texto, confirmar: rotuloOk = "Confirmar", cancelar = "Voltar", perigo = false }) {
  return new Promise((resolver) => {
    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";
    fundo.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <h2 id="modal-titulo">${esc(titulo)}</h2>
        <p class="texto-suave">${esc(texto)}</p>
        <div class="acoes-modal">
          <button type="button" class="botao botao-secundario" data-r="nao">${esc(cancelar)}</button>
          <button type="button" class="botao ${perigo ? "botao-perigo-cheio" : ""}" data-r="sim">${esc(rotuloOk)}</button>
        </div>
      </div>`;
    const anterior = document.activeElement;
    const fechar = (resposta) => {
      fundo.remove();
      document.removeEventListener("keydown", tecla);
      if (anterior) anterior.focus();
      resolver(resposta);
    };
    const tecla = (e) => { if (e.key === "Escape") fechar(false); };
    fundo.addEventListener("click", (e) => {
      if (e.target === fundo) fechar(false);
      const botao = e.target.closest("[data-r]");
      if (botao) fechar(botao.dataset.r === "sim");
    });
    document.addEventListener("keydown", tecla);
    document.body.appendChild(fundo);
    fundo.querySelector('[data-r="nao"]').focus();
  });
}

// ---------------------------------------------------------------- carregando / vazio / erro
export const htmlCarregando = (texto = "Carregando...") =>
  `<div class="carregando" role="status"><div class="girando" aria-hidden="true"></div><span>${esc(texto)}</span></div>`;

export function htmlVazio({ icone: simbolo = "🧁", titulo, texto = "", acao = "" }) {
  return `<div class="estado"><div class="icone-estado" aria-hidden="true">${simbolo}</div>
    <strong>${esc(titulo)}</strong>${texto ? `<p>${esc(texto)}</p>` : ""}${acao}</div>`;
}

/** Mostra MSG-E18 com botão "Tentar novamente" (UC-01 E3). */
export function mostrarErroCarregamento(container, erro, tentarDeNovo) {
  container.innerHTML = `<div class="estado"><div class="icone-estado" aria-hidden="true">⚠️</div>
    <strong>${esc(erro?.message || "Algo deu errado. Tente novamente em instantes.")}</strong>
    ${tentarDeNovo ? '<button type="button" class="botao botao-secundario" data-tentar>Tentar novamente</button>' : ""}
    <a href="/index.html" class="botao-link">Voltar ao início</a></div>`;
  const botao = container.querySelector("[data-tentar]");
  if (botao) botao.addEventListener("click", tentarDeNovo);
}

/** Desabilita o botão e mostra o indicador enquanto processa (evita pedido em dobro). */
export async function comCarregamento(botao, acao) {
  if (!botao || botao.disabled) return undefined;
  const html = botao.innerHTML;
  botao.disabled = true;
  botao.setAttribute("aria-busy", "true");
  botao.innerHTML = `<span class="girando" aria-hidden="true"></span>${html}`;
  try {
    return await acao();
  } finally {
    botao.disabled = false;
    botao.removeAttribute("aria-busy");
    botao.innerHTML = html;
  }
}

// ---------------------------------------------------------------- erros de formulário
export function limparErros(form) {
  form.querySelectorAll(".campo.com-erro").forEach((c) => c.classList.remove("com-erro"));
  form.querySelectorAll(".erro-campo").forEach((e) => { e.textContent = ""; });
  form.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
}

export function erroNoCampo(form, nome, mensagem) {
  const entrada = form.querySelector(`[name="${nome}"]`);
  const caixa = entrada ? entrada.closest(".campo") : null;
  if (!caixa) return false;
  caixa.classList.add("com-erro");
  let alvo = caixa.querySelector(".erro-campo");
  if (!alvo) {
    alvo = document.createElement("div");
    alvo.className = "erro-campo";
    caixa.appendChild(alvo);
  }
  alvo.id = alvo.id || `erro-${nome}`;
  alvo.textContent = mensagem;
  entrada.setAttribute("aria-invalid", "true");
  entrada.setAttribute("aria-describedby", alvo.id);
  return true;
}

/** Coloca os erros vindos da API abaixo dos campos. Devolve true se algum campo foi marcado. */
export function mostrarErrosApi(form, erro, alertaGeral) {
  let marcou = false;
  const lista = erro.erros && erro.erros.length ? erro.erros : [{ campo: erro.campo, mensagem: erro.message }];
  lista.forEach((e) => {
    if (e.campo && erroNoCampo(form, e.campo.split(".").pop(), e.mensagem)) marcou = true;
  });
  if (!marcou && alertaGeral) {
    alertaGeral.hidden = false;
    alertaGeral.innerHTML = `<p>${esc(erro.message)}</p>`;
  }
  const primeiro = form.querySelector("[aria-invalid='true']");
  if (primeiro) primeiro.focus();
  return marcou;
}

export const MSG_OBRIGATORIO = "Preencha este campo."; // MSG-E05

/** Valida campos "required" no navegador antes de enviar (mensagens do catálogo). */
export function validarObrigatorios(form) {
  let ok = true;
  form.querySelectorAll("[required]").forEach((entrada) => {
    if (!String(entrada.value || "").trim()) {
      erroNoCampo(form, entrada.name, MSG_OBRIGATORIO);
      ok = false;
    }
  });
  return ok;
}

export const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const senhaValida = (senha) => /^(?=.*[A-Za-zÀ-ÿ])(?=.*\d).{8,}$/.test(senha); // RN-06
