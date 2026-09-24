// A03 – Produtos (UC-15): ativos e inativos; desativar/reativar (RN-23)
import { api } from "../../api.js";
import { iniciarPagina } from "../../layout.js";
import { esc, moeda, htmlCarregando, htmlVazio, mostrarErroCarregamento, comCarregamento, confirmar, toast, icone, atributosImagem } from "../../ui.js";

const main = document.getElementById("conteudo");
let produtos = [];

function situacao(p) {
  if (!p.ativo) return '<span class="situacao-inativo">Inativo</span>';
  return p.quantidade_estoque > 0 ? '<span class="situacao-ativo">Ativo</span>'
    : '<span class="situacao-ativo">Ativo</span> <span class="selo selo-indisponivel">sem estoque</span>';
}

function desenhar() {
  const cabecalho = `<div class="cabecalho-pagina"><h1 style="margin:0">Produtos</h1>
    <a class="botao botao-pequeno" href="/pages/admin/produto.html">${icone("mais")}Novo produto</a></div>`;
  if (!produtos.length) {
    main.innerHTML = cabecalho + htmlVazio({ titulo: "Nenhum produto cadastrado.",
      acao: '<a class="botao" href="/pages/admin/produto.html">Novo produto</a>' });
    return;
  }
  main.innerHTML = `${cabecalho}
    <div class="tabela-rolagem"><table class="tabela">
      <thead><tr><th scope="col">Nome</th><th scope="col">Categoria</th><th scope="col" class="num">Preço</th>
        <th scope="col" class="num">Estoque</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
      <tbody>${produtos.map((p) => `<tr>
          <td><span class="celula-produto"><img class="miniatura" ${atributosImagem(p.imagem_url, { thumb: true })} alt="" width="44" height="44" loading="lazy"><strong>${esc(p.nome)}</strong></span></td><td>${esc(p.categoria)}</td><td class="num">${moeda(p.preco)}</td>
          <td class="num">${p.quantidade_estoque}</td><td>${situacao(p)}</td>
          <td><div class="linha" style="gap:4px">
            <a class="botao-link" href="/pages/admin/produto.html?id=${p.id_produto}" aria-label="Editar ${esc(p.nome)}">${icone("editar")}Editar</a>
            <button type="button" class="botao-link ${p.ativo ? "perigo" : ""}" data-situacao="${p.id_produto}" data-ativo="${!p.ativo}">
              ${p.ativo ? "Desativar" : "Reativar"}</button></div></td></tr>`).join("")}</tbody>
    </table></div>
    <p class="texto-suave texto-pequeno" style="margin-top:10px">Produto inativo não aparece no cardápio. Estoque 0 aparece como "Indisponível" para o cliente.</p>`;
}

main.addEventListener("click", async (e) => {
  const botao = e.target.closest("[data-situacao]");
  if (!botao) return;
  const ativar = botao.dataset.ativo === "true";
  const produto = produtos.find((p) => p.id_produto === Number(botao.dataset.situacao));
  if (!ativar) {
    const ok = await confirmar({ titulo: `Desativar "${produto.nome}"?`,
      texto: "O produto deixa de aparecer no cardápio, mas continua nos pedidos antigos. Você pode reativá-lo depois.",
      confirmar: "Sim, desativar", perigo: true });
    if (!ok) return;
  }
  await comCarregamento(botao, async () => {
    try {
      const r = await api(`/api/admin/produtos/${produto.id_produto}/situacao`, { method: "PATCH", body: { ativo: ativar } });
      Object.assign(produto, r.produto);
      desenhar();
      toast(r.mensagem);
    } catch (erro) { toast(erro.message, "erro"); }
  });
});

async function carregar() {
  main.innerHTML = htmlCarregando();
  try { produtos = await api("/api/admin/produtos"); desenhar(); }
  catch (erro) { mostrarErroCarregamento(main, erro, carregar); }
}

(async () => {
  if (!(await iniciarPagina({ area: "admin", nav: "produtos" }))) return;
  carregar();
})();
