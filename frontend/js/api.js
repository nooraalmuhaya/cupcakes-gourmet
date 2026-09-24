/**
 * Comunicação com a API (Fetch API).
 *
 * - Quando o front-end é servido pelo próprio back-end (porta 8000), usa a mesma origem.
 * - Quando é servido por "python -m http.server 5500", chama a API na porta 8000
 *   do mesmo host (CORS configurado no back-end).
 */
const PORTA_API = "8000";
export const API_BASE =
  window.location.port && window.location.port !== PORTA_API
    ? `${window.location.protocol}//${window.location.hostname}:${PORTA_API}`
    : "";

export const MSG_FALHA = "Algo deu errado. Tente novamente em instantes."; // MSG-E18

export class ApiError extends Error {
  constructor(status, dados) {
    super((dados && dados.detail) || MSG_FALHA);
    this.status = status;
    this.dados = dados || {};
    this.codigo = this.dados.codigo || null;
    this.campo = this.dados.campo || null;
    this.erros = this.dados.erros || [];
  }
}

export async function api(caminho, { method = "GET", body, params } = {}) {
  let url = API_BASE + caminho;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== false) qs.append(k, v);
    });
    const texto = qs.toString();
    if (texto) url += `?${texto}`;
  }
  let resposta;
  try {
    resposta = await fetch(url, {
      method,
      credentials: "include", // envia o cookie de sessão
      headers: body !== undefined ? { "Content-Type": "application/json" } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, { detail: MSG_FALHA, codigo: "MSG-E18" }); // sem conexão
  }
  let dados = null;
  try {
    dados = await resposta.json();
  } catch (e) {
    dados = null;
  }
  if (!resposta.ok) {
    if (resposta.status >= 500) throw new ApiError(resposta.status, { detail: MSG_FALHA, codigo: "MSG-E18" });
    throw new ApiError(resposta.status, dados);
  }
  return dados;
}
