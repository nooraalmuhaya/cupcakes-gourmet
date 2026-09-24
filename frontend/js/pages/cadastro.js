// T05 – Cadastro (UC-05)
import { api } from "../api.js";
import { iniciarPagina, caminhoSeguro } from "../layout.js";
import { comCarregamento, limparErros, erroNoCampo, mostrarErrosApi, validarObrigatorios, emailValido, senhaValida, param, avisoProximaTela } from "../ui.js";

const form = document.getElementById("form-cadastro");
const alerta = document.getElementById("alerta");

function validar() {
  let ok = validarObrigatorios(form);
  const email = form.email.value.trim();
  if (email && !emailValido(email)) { erroNoCampo(form, "email", "Digite um e-mail válido, por exemplo: nome@email.com."); ok = false; }
  const telefone = form.telefone.value.replace(/\D/g, "");
  if (telefone && (telefone.length < 10 || telefone.length > 11)) {
    erroNoCampo(form, "telefone", "Telefone inválido. Informe o DDD e o número, ex.: (11) 98765-4321."); ok = false;
  }
  if (form.senha.value && !senhaValida(form.senha.value)) {
    erroNoCampo(form, "senha", "A senha deve ter pelo menos 8 caracteres, com letras e números."); ok = false; // MSG-E03
  }
  if (form.confirmacao_senha.value && form.senha.value !== form.confirmacao_senha.value) {
    erroNoCampo(form, "confirmacao_senha", "As senhas não são iguais."); ok = false; // MSG-E19
  }
  return ok;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErros(form);
  alerta.hidden = true;
  if (!validar()) { form.querySelector("[aria-invalid='true']").focus(); return; }
  const corpo = {
    nome: form.nome.value.trim(), email: form.email.value.trim(), telefone: form.telefone.value.trim() || null,
    senha: form.senha.value, confirmacao_senha: form.confirmacao_senha.value,
  };
  await comCarregamento(form.querySelector("button[type=submit]"), async () => {
    try {
      const r = await api("/api/auth/register", { method: "POST", body: corpo });
      avisoProximaTela(r.mensagem); // MSG-S05
      window.location.href = caminhoSeguro(param("voltar"), "/index.html");
    } catch (erro) {
      mostrarErrosApi(form, erro, alerta); // MSG-E02, MSG-E03, MSG-E19...
    }
  });
});

(async () => {
  const sessao = await iniciarPagina({ area: "publica", titulo: "Criar Conta", nav: "conta" });
  if (sessao && sessao.usuario) window.location.replace("/pages/conta.html");
  const voltar = param("voltar");
  if (voltar) document.getElementById("link-login").href = `/pages/login.html?voltar=${encodeURIComponent(caminhoSeguro(voltar))}`;
})();
