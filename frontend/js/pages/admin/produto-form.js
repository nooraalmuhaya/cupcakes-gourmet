// A04 – Formulário de produto (UC-15, US16 CA2/CA3)
import { api } from "../../api.js";
import { iniciarPagina } from "../../layout.js";
import { esc, imagem, htmlCarregando, mostrarErroCarregamento, comCarregamento, limparErros, erroNoCampo,
  mostrarErrosApi, validarObrigatorios, param, avisoProximaTela } from "../../ui.js";

const main = document.getElementById("conteudo");
const idProduto = Number(param("id")) || null;

function desenhar(p, categorias) {
  const v = (c) => esc(p[c] ?? "");
  const precoTexto = p.preco ? String(p.preco).replace(".", ",") : "";
  main.innerHTML = `
    <nav class="migalhas" aria-label="Você está em"><a href="/pages/admin/produtos.html">Produtos</a> › ${idProduto ? "Editar produto" : "Novo produto"}</nav>
    <h1>${idProduto ? "Editar produto" : "Novo produto"}</h1>
    <form id="form-produto" class="cartao" novalidate>
      <div id="alerta" class="alerta alerta-erro" hidden></div>
      <div class="form-produto">
        <div>
          <div class="campo"><label for="nome">Nome</label><input id="nome" name="nome" required maxlength="80" value="${v("nome")}"></div>
          <div class="campo"><label for="id_categoria">Categoria</label>
            <select id="id_categoria" name="id_categoria" required><option value="">Selecione</option>
              ${categorias.map((c) => `<option value="${c.id_categoria}" ${c.id_categoria === p.id_categoria ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}
            </select></div>
          <div class="campo"><label for="descricao">Descrição</label><textarea id="descricao" name="descricao" required maxlength="500">${v("descricao")}</textarea></div>
          <div class="campo"><label for="ingredientes">Ingredientes</label><textarea id="ingredientes" name="ingredientes" required maxlength="500">${v("ingredientes")}</textarea></div>
          <div class="campo"><label for="alergenos">Alérgenos</label><input id="alergenos" name="alergenos" maxlength="255" value="${v("alergenos")}">
            <span class="dica">Obrigatório. Sem alérgenos: "Não contém alérgenos declarados" (preenchido automaticamente se ficar vazio).</span></div>
        </div>
        <div>
          <div class="coluna-dupla">
            <div class="campo"><label for="preco">Preço (R$)</label><input id="preco" name="preco" required inputmode="decimal" placeholder="0,00" value="${esc(precoTexto)}"></div>
            <div class="campo"><label for="quantidade_estoque">Estoque</label><input id="quantidade_estoque" name="quantidade_estoque" required inputmode="numeric" value="${p.quantidade_estoque ?? 0}">
              <span class="dica">Zero = Indisponível</span></div>
          </div>
          <div class="campo"><label for="imagem_url">Caminho da imagem</label>
            <input id="imagem_url" name="imagem_url" required maxlength="255" placeholder="assets/images/produtos/nome.svg" value="${v("imagem_url")}">
            <span class="dica">Coloque o arquivo na pasta frontend/assets/images/produtos e informe o caminho.</span></div>
          <img id="previa" class="previa-imagem" src="${esc(imagem(p.imagem_url))}" alt="Prévia da imagem"
               onerror="this.onerror=null;this.src='/assets/images/produtos/sem-imagem.svg'">
          <label class="caixa-selecao"><input type="checkbox" name="vegano" ${p.vegano ? "checked" : ""}> Vegano</label>
          <label class="caixa-selecao"><input type="checkbox" name="sem_gluten" ${p.sem_gluten ? "checked" : ""}> Sem glúten</label>
          <label class="caixa-selecao"><input type="checkbox" name="ativo" ${p.ativo !== false ? "checked" : ""}> Ativo (aparece no cardápio)</label>
        </div>
      </div>
      <div class="linha" style="justify-content:flex-end;margin-top:16px;flex-wrap:wrap">
        <a class="botao botao-secundario" href="/pages/admin/produtos.html">Cancelar</a>
        <button class="botao" type="submit">Salvar produto</button>
      </div>
    </form>`;
}

main.addEventListener("input", (e) => {
  if (e.target.name === "imagem_url") {
    const previa = document.getElementById("previa");
    previa.onerror = () => { previa.onerror = null; previa.src = "/assets/images/produtos/sem-imagem.svg"; };
    previa.src = imagem(e.target.value.trim());
  }
});

main.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  limparErros(form);
  let ok = validarObrigatorios(form);
  // Aceita "12,50", "1.234,50" e "12.50"
  const textoPreco = form.preco.value.trim();
  const preco = Number(textoPreco.includes(",") ? textoPreco.replace(/\./g, "").replace(",", ".") : textoPreco);
  if (form.preco.value.trim() && !(preco > 0)) { erroNoCampo(form, "preco", "O preço deve ser maior que zero."); ok = false; } // MSG-E21
  const estoque = form.quantidade_estoque.value.trim();
  if (estoque && !/^\d+$/.test(estoque)) { erroNoCampo(form, "quantidade_estoque", "O estoque deve ser um número inteiro maior ou igual a zero."); ok = false; }
  if (!ok) { form.querySelector("[aria-invalid='true']").focus(); return; }
  const corpo = {
    nome: form.nome.value, id_categoria: Number(form.id_categoria.value), descricao: form.descricao.value,
    ingredientes: form.ingredientes.value, alergenos: form.alergenos.value, preco: String(preco),
    imagem_url: form.imagem_url.value, quantidade_estoque: Number(estoque),
    vegano: form.vegano.checked, sem_gluten: form.sem_gluten.checked, ativo: form.ativo.checked,
  };
  await comCarregamento(form.querySelector("button[type=submit]"), async () => {
    try {
      const r = idProduto
        ? await api(`/api/admin/produtos/${idProduto}`, { method: "PUT", body: corpo })
        : await api("/api/admin/produtos", { method: "POST", body: corpo });
      avisoProximaTela(r.mensagem); // MSG-S10
      window.location.href = "/pages/admin/produtos.html";
    } catch (erro) {
      mostrarErrosApi(form, erro, document.getElementById("alerta")); // MSG-E17, MSG-E21, MSG-E05
    }
  });
});

(async () => {
  if (!(await iniciarPagina({ area: "admin", nav: "produtos" }))) return;
  main.innerHTML = htmlCarregando();
  try {
    const categorias = await api("/api/categorias");
    const produto = idProduto ? await api(`/api/admin/produtos/${idProduto}`) : { ativo: true, quantidade_estoque: 0 };
    desenhar(produto, categorias);
  } catch (erro) {
    mostrarErroCarregamento(main, erro, () => window.location.reload());
  }
})();
