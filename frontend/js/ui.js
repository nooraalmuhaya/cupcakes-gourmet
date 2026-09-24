import { icone } from "./icones.js";

export { icone };

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

export const IMG_PADRAO = "/assets/images/produtos/sem-imagem.svg";

export function imagem(url) {
  if (!url) return IMG_PADRAO;
  return /^(https?:)?\//.test(url) ? url : `/${url}`;
}

/** Miniatura (arquivo "-thumb.jpg" ao lado da foto). Usada em cards, carrinho e tabelas. */
export function miniatura(url) {
  const completa = imagem(url);
  return /\.jpe?g$/i.test(completa) ? completa.replace(/\.(jpe?g)$/i, "-thumb.$1") : completa;
}

/** Se a miniatura faltar, tenta a foto completa; se ela também faltar, usa a imagem padrão. */
export function atributosImagem(url, { thumb = false } = {}) {
  const completa = imagem(url);
  const src = thumb ? miniatura(url) : completa;
  const reserva = src !== completa ? completa : IMG_PADRAO;
  return `src="${esc(src)}" data-reserva="${esc(reserva)}" onerror="${IMG_FALLBACK}"`;
}
export const IMG_FALLBACK =
  "if(this.dataset.reserva&&this.src.indexOf(this.dataset.reserva)<0){this.src=this.dataset.reserva;this.dataset.reserva='';}" +
  "else{this.onerror=null;this.src='/assets/images/produtos/sem-imagem.svg';}";

export const param = (nome) => new URLSearchParams(window.location.search).get(nome);

// ---------------------------------------------------------------- status do pedido
// Selo com cor + marcador + texto (o texto garante que a informação não depende só da cor – RNF-15)
export function seloStatus(status, texto) {
  return `<span class="status status-${esc(status)}">${esc(texto)}</span>`;
}

/** Estrelas somente leitura (nota de 1 a 5). */
export function estrelasLeitura(nota) {
  return `<span class="estrelas-leitura" role="img" aria-label="${nota} de 5 estrelas">${[1, 2, 3, 4, 5]
    .map((n) => icone("estrela", "", n <= nota ? "" : "apagada")).join("")}</span>`;
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
  setTimeout(() => {
    item.classList.add("saindo");
    setTimeout(() => item.remove(), 220);
  }, 3000);
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

export function htmlVazio({ icone: nomeIcone = "cupcake", titulo, texto = "", acao = "" }) {
  return `<div class="estado"><div class="icone-estado" aria-hidden="true">${icone(nomeIcone)}</div>
    <strong>${esc(titulo)}</strong>${texto ? `<p>${esc(texto)}</p>` : ""}${acao}</div>`;
}

/** Mostra MSG-E18 com botão "Tentar novamente" (UC-01 E3). */
export function mostrarErroCarregamento(container, erro, tentarDeNovo) {
  container.innerHTML = `<div class="estado"><div class="icone-estado" aria-hidden="true">${icone("alerta")}</div>
    <strong>${esc(erro?.message || "Algo deu errado. Tente novamente em instantes.")}</strong>
    ${tentarDeNovo ? `<button type="button" class="botao botao-secundario" data-tentar>${icone("atualizar")}Tentar novamente</button>` : ""}
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
  // Campos que tinham erro e foram corrigidos ficam com a borda de "válido"
  form.querySelectorAll(".campo[data-corrigido]").forEach((c) => { c.classList.add("valido"); delete c.dataset.corrigido; });
  form.querySelectorAll(".campo.com-erro").forEach((c) => c.classList.remove("com-erro"));
  form.querySelectorAll(".erro-campo").forEach((e) => { e.textContent = ""; });
  form.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
}

export function erroNoCampo(form, nome, mensagem) {
  const entrada = form.querySelector(`[name="${nome}"]`);
  const caixa = entrada ? entrada.closest(".campo") : null;
  if (!caixa) return false;
  caixa.classList.remove("valido");
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

// Ao digitar em um campo com erro, a mensagem some (o usuário está corrigindo).
document.addEventListener("input", (e) => {
  const caixa = e.target.closest && e.target.closest(".campo.com-erro");
  if (!caixa) return;
  caixa.classList.remove("com-erro");
  caixa.dataset.corrigido = "1";
  const msg = caixa.querySelector(".erro-campo");
  if (msg) msg.textContent = "";
  e.target.removeAttribute("aria-invalid");
});
