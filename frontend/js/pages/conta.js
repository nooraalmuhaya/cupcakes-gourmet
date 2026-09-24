// T12 – Minha conta (US06 CA7, RF-12)
import { api } from "../api.js";
import { iniciarPagina, sair } from "../layout.js";
import { esc, formatarTelefone, comCarregamento, limparErros, mostrarErrosApi, validarObrigatorios, toast, icone } from "../ui.js";

const main = document.getElementById("conteudo");

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function desenhar(usuario, quantidadeEnderecos, naoLidas) {
  main.innerHTML = `
    <div class="perfil-topo"><div class="avatar" aria-hidden="true">${esc(iniciais(usuario.nome))}</div>
      <div><strong id="nome-topo">${esc(usuario.nome)}</strong><br><span class="texto-suave texto-pequeno">${esc(usuario.email)}</span></div></div>
    <form id="form-perfil" class="cartao" style="margin:16px 0" novalidate>
      <div id="alerta-perfil" class="alerta alerta-erro" hidden></div>
      <div class="campo"><label for="nome">Nome</label>
        <input id="nome" name="nome" required maxlength="100" autocomplete="name" value="${esc(usuario.nome)}"></div>
      <div class="campo"><label for="telefone">Telefone <span class="opcional">(opcional)</span></label>
        <input id="telefone" name="telefone" inputmode="tel" maxlength="15" autocomplete="tel" value="${esc(formatarTelefone(usuario.telefone))}"></div>
      <p class="texto-suave texto-pequeno">O e-mail não pode ser alterado nesta versão.</p>
      <div class="linha" style="justify-content:flex-end"><button class="botao botao-secundario botao-pequeno" type="submit">Salvar dados</button></div>
    </form>
    <ul class="menu-conta">
      <li><a href="/pages/pedidos.html"><span>Meus Pedidos</span><span class="detalhe">${icone("seta")}</span></a></li>
      <li><a href="/pages/enderecos.html"><span>Meus Endereços</span><span class="detalhe">${quantidadeEnderecos} de 5 ${icone("seta")}</span></a></li>
      <li><a href="/pages/notificacoes.html"><span>Notificações</span><span class="detalhe">${naoLidas ? `<span class="selo selo-indisponivel">${naoLidas} não lida${naoLidas > 1 ? "s" : ""}</span>` : ""} ${icone("seta")}</span></a></li>
      <li><a href="/pages/ajuda.html"><span>Ajuda e Suporte</span><span class="detalhe">${icone("seta")}</span></a></li>
    </ul>
    <div class="acoes-rodape"><button type="button" class="botao botao-perigo botao-bloco" data-sair>Sair</button></div>`;
}

main.addEventListener("click", (e) => { if (e.target.closest("[data-sair]")) sair(); });

main.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  limparErros(form);
  if (!validarObrigatorios(form)) { form.nome.focus(); return; }
  await comCarregamento(form.querySelector("button[type=submit]"), async () => {
    try {
      const r = await api("/api/conta", { method: "PUT", body: { nome: form.nome.value.trim(), telefone: form.telefone.value.trim() || null } });
      document.getElementById("nome-topo").textContent = r.usuario.nome;
      form.telefone.value = formatarTelefone(r.usuario.telefone);
      toast("Dados salvos.");
    } catch (erro) {
      mostrarErrosApi(form, erro, document.getElementById("alerta-perfil"));
    }
  });
});

(async () => {
  const sessao = await iniciarPagina({ area: "cliente", titulo: "Minha Conta", voltar: "/index.html", nav: "conta" });
  if (!sessao) return;
  let quantidade = 0;
  try { quantidade = (await api("/api/enderecos")).length; } catch (e) { /* mostra 0 */ }
  desenhar(sessao.usuario, quantidade, sessao.notificacoes_nao_lidas);
})();
