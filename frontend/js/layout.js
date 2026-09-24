/**
 * Monta o cabeçalho, a barra inferior (cliente) ou o menu (administrador)
 * e faz o controle de acesso das telas (RF-11): cliente sem login vai para
 * o T04 com a MSG-I06; perfil errado vê a MSG-E13.
 */
import { api } from "./api.js";
import { esc, icone, mostrarAvisoPendente, avisoProximaTela, toast } from "./ui.js";
import { CONFIG } from "./config.js";

let sessaoAtual = null;

export async function carregarSessao() {
  try {
    sessaoAtual = await api("/api/sessao");
  } catch (e) {
    sessaoAtual = { usuario: null, carrinho_quantidade: 0, notificacoes_nao_lidas: 0, falhou: true };
  }
  return sessaoAtual;
}

export function irParaLogin() {
  const voltar = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/pages/login.html?voltar=${voltar}&motivo=protegida`;
}

/** Só aceita caminhos internos (evita redirecionar para outro site). */
export function caminhoSeguro(caminho, padrao = "/index.html") {
  if (!caminho || !caminho.startsWith("/") || caminho.startsWith("//") || caminho.includes("\\")) return padrao;
  return caminho;
}

export async function sair() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch (e) { /* segue mesmo assim */ }
  avisoProximaTela("Você saiu da sua conta."); // MSG-S06
  window.location.href = "/index.html";
}

function cabecalhoCliente({ titulo, voltar, direita }) {
  const esquerda = titulo
    ? `<a class="botao-icone" href="${esc(voltar || "/index.html")}" data-voltar aria-label="Voltar">${icone("voltar")}</a>
       <h1 class="titulo">${esc(titulo)}</h1>`
    : `<a class="marca" href="/index.html"><span class="marca-logo" aria-hidden="true">C</span>${esc(CONFIG.nomeLoja)}</a>
       <span class="espacador"></span>`;
  return `<header class="barra-topo">
      ${esquerda}
      <div class="acoes">
        ${direita || ""}
        <a class="botao-icone" href="/pages/notificacoes.html" aria-label="Notificações">
          ${icone("sino")}<span class="contador" data-contador="notificacoes" hidden></span></a>
        <a class="botao-icone" href="/pages/carrinho.html" aria-label="Carrinho">
          ${icone("carrinho")}<span class="contador" data-contador="carrinho" hidden></span></a>
      </div>
    </header>`;
}

function barraInferior(ativo) {
  const itens = [
    ["inicio", "/index.html", "Início"],
    ["carrinho", "/pages/carrinho.html", "Carrinho"],
    ["pedidos", "/pages/pedidos.html", "Pedidos"],
    ["conta", "/pages/conta.html", "Conta"],
  ];
  return `<nav class="barra-inferior" aria-label="Navegação principal">
    ${itens.map(([id, href, texto]) =>
      `<a href="${href}" ${id === ativo ? 'aria-current="page"' : ""}>${icone(id)}<span>${texto}</span></a>`).join("")}
  </nav>`;
}

function cabecalhoAdmin(ativo, usuario) {
  return `<header class="barra-topo">
      <a class="marca" href="/pages/admin/pedidos.html"><span class="marca-logo" aria-hidden="true">C</span>
        <span>${esc(CONFIG.nomeLoja)}<small>Painel do Administrador</small></span></a>
      <nav class="menu-admin" aria-label="Menu do administrador">
        <a href="/pages/admin/pedidos.html" ${ativo === "pedidos" ? 'aria-current="page"' : ""}>Pedidos</a>
        <a href="/pages/admin/produtos.html" ${ativo === "produtos" ? 'aria-current="page"' : ""}>Produtos</a>
      </nav>
      <span class="espacador"></span>
      <span class="saudacao-admin">Olá, ${esc((usuario?.nome || "").split(" ")[0])}</span>
      <button type="button" class="botao botao-secundario botao-pequeno" data-sair>Sair</button>
    </header>`;
}

export function atualizarContadores(sessao = sessaoAtual) {
  if (!sessao) return;
  const mapa = { carrinho: sessao.carrinho_quantidade, notificacoes: sessao.notificacoes_nao_lidas };
  Object.entries(mapa).forEach(([chave, valor]) => {
    document.querySelectorAll(`[data-contador="${chave}"]`).forEach((el) => {
      el.textContent = valor > 99 ? "99+" : String(valor || "");
      el.hidden = !valor;
      const link = el.closest("a");
      if (link) link.setAttribute("aria-label", `${chave === "carrinho" ? "Carrinho" : "Notificações"}${valor ? ` (${valor})` : ""}`);
    });
  });
}

/** Atualiza só o contador do carrinho (depois de adicionar/remover itens). */
export function atualizarContadorCarrinho(quantidade) {
  if (sessaoAtual) sessaoAtual.carrinho_quantidade = quantidade;
  atualizarContadores(sessaoAtual || { carrinho_quantidade: quantidade, notificacoes_nao_lidas: 0 });
}

export async function recarregarContadores() {
  atualizarContadores(await carregarSessao());
}

function paginaSemPermissao(main) {
  main.innerHTML = `<div class="estado"><div class="icone-estado" aria-hidden="true">🔒</div>
    <strong>Você não tem permissão para acessar esta página.</strong>
    <a class="botao" href="/index.html">Voltar ao início</a></div>`; // MSG-E13
}

/**
 * Prepara a tela. area: "publica" | "cliente" | "admin".
 * Devolve a sessão, ou null quando a tela não deve continuar.
 */
export async function iniciarPagina({ area = "publica", titulo = "", voltar = "", nav = null, direita = "" } = {}) {
  const main = document.getElementById("conteudo");
  const sessao = await carregarSessao();
  const usuario = sessao.usuario;
  document.body.classList.add(area === "admin" ? "area-admin" : "area-cliente");

  if (area === "admin") {
    if (!usuario) { irParaLogin(); return null; }
    main.insertAdjacentHTML("beforebegin", cabecalhoAdmin(nav, usuario));
    document.querySelector("[data-sair]").addEventListener("click", sair);
    if (usuario.perfil !== "ADMIN") { paginaSemPermissao(main); return null; }
  } else {
    // Administrador que abre a área de compras volta para o painel (RN-22: admin não compra)
    if (usuario && usuario.perfil === "ADMIN" && area === "cliente") {
      main.insertAdjacentHTML("beforebegin", cabecalhoAdmin(null, usuario));
      document.querySelector("[data-sair]").addEventListener("click", sair);
      paginaSemPermissao(main);
      return null;
    }
    main.insertAdjacentHTML("beforebegin", cabecalhoCliente({ titulo, voltar, direita }));
    main.insertAdjacentHTML("afterend", barraInferior(nav));
    const botaoVoltar = document.querySelector("[data-voltar]");
    if (botaoVoltar && !voltar) {
      botaoVoltar.addEventListener("click", (e) => {
        if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
          e.preventDefault();
          window.history.back();
        }
      });
    }
    if (area === "cliente" && !usuario) { irParaLogin(); return null; }
    atualizarContadores(sessao);
  }

  if (sessao.falhou) toast("Algo deu errado. Tente novamente em instantes.", "erro");
  mostrarAvisoPendente();
  return sessao;
}
