// T13 – Meus endereços (UC-07, US14, RN-08)
import { api } from "../api.js";
import { iniciarPagina, caminhoSeguro } from "../layout.js";
import { esc, formatarCep, htmlCarregando, htmlVazio, mostrarErroCarregamento, comCarregamento, confirmar, toast,
  limparErros, erroNoCampo, mostrarErrosApi, validarObrigatorios, param, avisoProximaTela, icone } from "../ui.js";

const main = document.getElementById("conteudo");
const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const voltarPara = param("voltar") ? caminhoSeguro(param("voltar"), "") : "";
let enderecos = [];
let editando = null; // null = lista; {} = novo; objeto = edição

function htmlLista() {
  const cheio = enderecos.length >= 5;
  const cards = enderecos.map((e) => `
    <li class="cartao card-endereco"><span class="icone-endereco" aria-hidden="true">${icone("mapa")}</span><div>
      <div class="linha" style="flex-wrap:wrap"><strong>${esc(e.apelido)}</strong>${e.padrao ? '<span class="selo selo-padrao">Padrão</span>' : ""}</div>
      <p style="margin:4px 0 0">${esc(e.logradouro)}, ${esc(e.numero)}${e.complemento ? `, ${esc(e.complemento)}` : ""}</p>
      <p class="texto-suave texto-pequeno" style="margin:0">${esc(e.bairro)} · ${esc(e.cidade)} – ${esc(e.uf)} · ${formatarCep(e.cep)}</p>
      <div class="acoes-endereco">
        <button type="button" class="botao-link" data-editar="${e.id_endereco}">Editar</button>
        <button type="button" class="botao-link perigo" data-excluir="${e.id_endereco}">Excluir</button>
        ${e.padrao ? "" : `<button type="button" class="botao-link" data-padrao="${e.id_endereco}">Tornar padrão</button>`}
      </div>
    </div></li>`).join("");
  return `
    ${enderecos.length ? `<ul class="pilha" style="list-style:none;margin:0;padding:0">${cards}</ul>`
      : htmlVazio({ icone: "mapa", titulo: "Você ainda não tem endereços." })}
    <div class="acoes-rodape">
      <button type="button" class="botao botao-bloco" data-novo ${cheio ? 'disabled aria-describedby="msg-limite"' : ""}>${icone("mais")}Adicionar endereço</button>
      ${cheio ? '<p id="msg-limite" class="erro-campo">Você já tem 5 endereços salvos. Exclua um para adicionar outro.</p>' : ""}
      <p class="centro texto-suave texto-pequeno" style="margin:0">${enderecos.length} de 5 endereços salvos</p>
      <p class="centro texto-suave texto-pequeno" style="margin:0">Excluir um endereço não altera pedidos já feitos.</p>
      ${voltarPara && enderecos.length ? `<a class="botao botao-secundario botao-bloco" href="${esc(voltarPara)}">Voltar ao checkout</a>` : ""}
    </div>`;
}

function htmlFormulario(e) {
  const v = (campo) => esc(e[campo] ?? "");
  return `<form id="form-endereco" novalidate>
      <h2>${e.id_endereco ? "Editar endereço" : "Novo endereço"}</h2>
      <div id="alerta-endereco" class="alerta alerta-erro" hidden></div>
      <div class="campo"><label for="apelido">Apelido</label>
        <input id="apelido" name="apelido" required maxlength="30" placeholder="Casa, Trabalho..." value="${v("apelido")}"></div>
      <div class="campo"><label for="cep">CEP</label>
        <input id="cep" name="cep" required inputmode="numeric" maxlength="9" placeholder="00000-000" value="${esc(formatarCep(e.cep || ""))}"></div>
      <div class="campo"><label for="logradouro">Logradouro</label>
        <input id="logradouro" name="logradouro" required maxlength="120" placeholder="Rua, avenida..." value="${v("logradouro")}"></div>
      <div class="coluna-dupla">
        <div class="campo"><label for="numero">Número</label>
          <input id="numero" name="numero" required maxlength="10" placeholder="123 ou S/N" value="${v("numero")}"></div>
        <div class="campo"><label for="complemento">Complemento <span class="opcional">(opcional)</span></label>
          <input id="complemento" name="complemento" maxlength="60" placeholder="Apto, bloco..." value="${v("complemento")}"></div>
      </div>
      <div class="campo"><label for="bairro">Bairro</label>
        <input id="bairro" name="bairro" required maxlength="60" value="${v("bairro")}"></div>
      <div class="coluna-dupla">
        <div class="campo"><label for="cidade">Cidade</label>
          <input id="cidade" name="cidade" required maxlength="60" value="${v("cidade")}"></div>
        <div class="campo"><label for="uf">UF</label>
          <select id="uf" name="uf" required><option value="">Selecione</option>
            ${UFS.map((uf) => `<option ${e.uf === uf ? "selected" : ""}>${uf}</option>`).join("")}</select></div>
      </div>
      ${e.padrao ? "" : `<label class="caixa-selecao"><input type="checkbox" name="padrao" ${enderecos.length === 0 ? "checked disabled" : ""}> Usar como endereço padrão</label>`}
      <div class="acoes-rodape">
        <button class="botao botao-bloco" type="submit">Salvar endereço</button>
        <button type="button" class="botao-link centro" data-cancelar-form>Cancelar</button>
      </div>
    </form>`;
}

function desenhar() {
  main.innerHTML = editando ? htmlFormulario(editando) : htmlLista();
  if (editando) main.querySelector("#apelido").focus();
}

async function carregar() {
  main.innerHTML = htmlCarregando();
  try {
    enderecos = await api("/api/enderecos");
    if (param("novo") && enderecos.length < 5 && editando === null) editando = {};
    desenhar();
  } catch (erro) {
    mostrarErroCarregamento(main, erro, carregar);
  }
}

main.addEventListener("click", async (ev) => {
  if (ev.target.closest("[data-novo]")) { editando = {}; desenhar(); return; }
  if (ev.target.closest("[data-cancelar-form]")) {
    if (voltarPara && enderecos.length) { window.location.href = voltarPara; return; }
    editando = null; desenhar(); return;
  }
  const editar = ev.target.closest("[data-editar]");
  if (editar) { editando = enderecos.find((e) => e.id_endereco === Number(editar.dataset.editar)); desenhar(); return; }
  const padrao = ev.target.closest("[data-padrao]");
  if (padrao) {
    await comCarregamento(padrao, async () => {
      try { await api(`/api/enderecos/${padrao.dataset.padrao}/padrao`, { method: "PUT" }); toast("Endereço padrão atualizado."); await carregar(); }
      catch (erro) { toast(erro.message, "erro"); }
    });
    return;
  }
  const excluir = ev.target.closest("[data-excluir]");
  if (excluir) {
    const alvo = enderecos.find((e) => e.id_endereco === Number(excluir.dataset.excluir));
    const ok = await confirmar({ titulo: `Excluir o endereço "${alvo.apelido}"?`,
      texto: "Excluir um endereço não altera pedidos já feitos.", confirmar: "Sim, excluir", perigo: true });
    if (!ok) return;
    try { await api(`/api/enderecos/${alvo.id_endereco}`, { method: "DELETE" }); toast("Endereço excluído."); await carregar(); }
    catch (erro) { toast(erro.message, "erro"); }
  }
});

main.addEventListener("input", (ev) => {
  if (ev.target.name === "cep") {
    const d = ev.target.value.replace(/\D/g, "").slice(0, 8);
    ev.target.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }
});

main.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  limparErros(form);
  let ok = validarObrigatorios(form);
  const cep = form.cep.value.replace(/\D/g, "");
  if (form.cep.value.trim() && cep.length !== 8) { erroNoCampo(form, "cep", "CEP inválido. Digite os 8 números do CEP."); ok = false; } // MSG-E04
  if (!ok) { form.querySelector("[aria-invalid='true']").focus(); return; }
  const corpo = {
    apelido: form.apelido.value, cep, logradouro: form.logradouro.value, numero: form.numero.value,
    complemento: form.complemento.value || null, bairro: form.bairro.value, cidade: form.cidade.value, uf: form.uf.value,
    padrao: form.padrao ? form.padrao.checked : true,
  };
  await comCarregamento(form.querySelector("button[type=submit]"), async () => {
    try {
      const r = editando.id_endereco
        ? await api(`/api/enderecos/${editando.id_endereco}`, { method: "PUT", body: corpo })
        : await api("/api/enderecos", { method: "POST", body: corpo });
      if (voltarPara) {
        // Veio do checkout: volta com o endereço novo escolhido
        try { sessionStorage.setItem("checkout_endereco", String(r.endereco.id_endereco)); } catch (e) { /* ignora */ }
        avisoProximaTela(r.mensagem);
        window.location.href = voltarPara;
        return;
      }
      toast(r.mensagem); // MSG-S03
      editando = null;
      await carregar();
    } catch (erro) {
      mostrarErrosApi(form, erro, document.getElementById("alerta-endereco")); // MSG-E04, MSG-E05, MSG-E16
    }
  });
});

(async () => {
  if (!(await iniciarPagina({ area: "cliente", titulo: "Meus Endereços", voltar: voltarPara || "/pages/conta.html", nav: "conta" }))) return;
  carregar();
})();
