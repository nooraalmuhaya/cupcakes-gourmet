// T15 – Ajuda e suporte (UC-14, RN-20): conteúdo fixo no front-end (RF-26)
import { iniciarPagina } from "../layout.js";
import { CONFIG } from "../config.js";
import { esc } from "../ui.js";

const PERGUNTAS = [
  ["Quanto tempo demora a entrega?",
    "O tempo depende do preparo e da distância. Você acompanha cada etapa em Meus Pedidos → Ver detalhes e recebe uma notificação no app a cada mudança de status."],
  ["Posso cancelar meu pedido?",
    "Enquanto o pagamento não foi aprovado, você mesmo pode cancelar. Depois disso, fale com a loja: ela pode cancelar enquanto o pedido não saiu para entrega."],
  ["Quais formas de pagamento são aceitas?",
    "Cartão de crédito, cartão de débito e PIX. Esta é uma versão de demonstração: nenhum valor real é cobrado."],
  ["Como uso um cupom de desconto?",
    "No carrinho, digite o código no campo \"Cupom de desconto\" e toque em Aplicar. É preciso estar logado. Vale um cupom por pedido, e cada cupom pode ser usado uma vez por conta."],
  ["Onde vejo os alérgenos?",
    "Toque no cupcake no cardápio: a tela de detalhes mostra os ingredientes e os alérgenos em destaque."],
];

export function dentroDoHorario(agora = new Date(), cfg = CONFIG.atendimento) {
  const horaAtual = agora.getHours() + agora.getMinutes() / 60;
  return cfg.dias.includes(agora.getDay()) && horaAtual >= cfg.abre && horaAtual < cfg.fecha;
}

(async () => {
  if (!(await iniciarPagina({ area: "publica", titulo: "Ajuda e Suporte", nav: "conta" }))) return;
  const link = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensagemWhatsapp)}`;
  document.getElementById("conteudo").innerHTML = `
    <section class="cartao cartao-creme"><h2>Horário de atendimento</h2><p style="margin:0">${esc(CONFIG.atendimento.texto)}</p></section>
    ${dentroDoHorario() ? "" : `<div class="alerta alerta-aviso" style="margin-top:12px" role="status">
        <p>Estamos fora do horário de atendimento. Você pode mandar sua mensagem: a resposta virá no próximo horário.</p></div>`}
    <h2 style="margin-top:20px;color:var(--texto)">Perguntas frequentes</h2>
    <div class="faq">${PERGUNTAS.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</div>
    <div class="acoes-rodape">
      <a class="botao botao-whatsapp botao-bloco" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
      <p class="centro texto-suave texto-pequeno" style="margin:0">Abre a conversa com a loja no WhatsApp.</p>
    </div>`;
})();
