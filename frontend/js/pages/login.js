// T04 – Login (UC-06): mesmo login para cliente e administrador
import { api } from "../api.js";
import { iniciarPagina, caminhoSeguro } from "../layout.js";
import { comCarregamento, limparErros, erroNoCampo, emailValido, param, esc } from "../ui.js";

const form = document.getElementById("form-login");
const alerta = document.getElementById("alerta");

document.getElementById("mostrar-senha").addEventListener("click", (e) => {
  const campo = form.senha;
  const mostrar = campo.type === "password";
  campo.type = mostrar ? "text" : "password";
  e.currentTarget.textContent = mostrar ? "Ocultar" : "Mostrar";
  e.currentTarget.setAttribute("aria-pressed", String(mostrar));
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErros(form);
  alerta.hidden = true;
  const email = form.email.value.trim();
  const senha = form.senha.value;
  let ok = true;
  if (!email) { erroNoCampo(form, "email", "Preencha este campo."); ok = false; }
  else if (!emailValido(email)) { erroNoCampo(form, "email", "Digite um e-mail válido, por exemplo: nome@email.com."); ok = false; }
  if (!senha) { erroNoCampo(form, "senha", "Preencha este campo."); ok = false; }
  if (!ok) { form.querySelector("[aria-invalid='true']").focus(); return; }

  await comCarregamento(form.querySelector("button[type=submit]"), async () => {
    try {
      const { usuario } = await api("/api/auth/login", { method: "POST", body: { email, senha } });
      // Cliente volta para a tela de origem; administrador vai para o A01
      const destino = usuario.perfil === "ADMIN"
        ? "/pages/admin/pedidos.html"
        : caminhoSeguro(param("voltar"), "/index.html");
      window.location.href = destino;
    } catch (erro) {
      alerta.hidden = false;
      alerta.className = "alerta alerta-erro";
      alerta.innerHTML = `<p>${esc(erro.message)}</p>`; // MSG-E01
      form.senha.value = "";
      form.senha.focus();
    }
  });
});

(async () => {
  const sessao = await iniciarPagina({ area: "publica", titulo: "Entrar", nav: "conta" });
  if (!sessao) return;
  if (sessao.usuario) {
    window.location.replace(sessao.usuario.perfil === "ADMIN" ? "/pages/admin/pedidos.html" : caminhoSeguro(param("voltar"), "/pages/conta.html"));
    return;
  }
  if (param("motivo") === "protegida") {
    alerta.hidden = false;
    alerta.className = "alerta alerta-info";
    alerta.innerHTML = "<p>Faça login para continuar.</p>"; // MSG-I06
  }
  const voltar = param("voltar");
  if (voltar) document.getElementById("link-cadastro").href = `/pages/cadastro.html?voltar=${encodeURIComponent(caminhoSeguro(voltar))}`;
})();
