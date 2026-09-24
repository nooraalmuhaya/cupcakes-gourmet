/**
 * Conjunto único de ícones do sistema (SVG em linha, desenhados para o projeto).
 *
 * Regras do conjunto: grade de 24 x 24, traço de 2 px com pontas e junções
 * arredondadas, sem preenchimento (exceto quando indicado). Todos herdam a cor
 * do texto (currentColor), então funcionam em botões, selos e alertas.
 */
const T = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const DESENHOS = {
  // navegação e cabeçalho
  voltar: `<path ${T} d="M15 5l-7 7 7 7"/>`,
  seta: `<path ${T} d="M9 5l7 7-7 7"/>`,
  inicio: `<path ${T} d="M3.5 10.5 12 4l8.5 6.5"/><path ${T} d="M5.5 9v10.5h13V9"/><path ${T} d="M10 19.5V14h4v5.5"/>`,
  carrinho: `<path ${T} d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 7.5H6.1"/><circle ${T} cx="9.5" cy="19.5" r="1.2"/><circle ${T} cx="17" cy="19.5" r="1.2"/>`,
  pedidos: `<path ${T} d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path ${T} d="M9 8h6M9 11.5h6M9 15h3.5"/>`,
  conta: `<circle ${T} cx="12" cy="8" r="3.8"/><path ${T} d="M4.5 20.5c1.1-4 4-5.8 7.5-5.8s6.4 1.8 7.5 5.8"/>`,
  sino: `<path ${T} d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path ${T} d="M10 20.5a2.2 2.2 0 0 0 4 0"/>`,
  lupa: `<circle ${T} cx="10.5" cy="10.5" r="6.5"/><path ${T} d="m15.5 15.5 5 5"/>`,
  sair: `<path ${T} d="M9.5 20.5H5.5a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5h4"/><path ${T} d="M16 16.5 20.5 12 16 7.5M20.5 12H9.5"/>`,
  ajuda: `<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7"/><path ${T} d="M12 17h.01"/>`,
  mapa: `<path ${T} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle ${T} cx="12" cy="10" r="2.3"/>`,

  // ações
  mais: `<path ${T} d="M12 5v14M5 12h14"/>`,
  menos: `<path ${T} d="M5 12h14"/>`,
  lixeira: `<path ${T} d="M4 7h16M9.5 7V4.5h5V7"/><path ${T} d="M6.5 7l.9 12.2a1.5 1.5 0 0 0 1.5 1.3h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7"/><path ${T} d="M10.3 11v5.5M13.7 11v5.5"/>`,
  fechar: `<path ${T} d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>`,
  editar: `<path ${T} d="M4.5 19.5 5.2 16 15.8 5.4a2 2 0 0 1 2.8 2.8L8 18.8z"/><path ${T} d="M14 7.2l2.8 2.8"/>`,
  atualizar: `<path ${T} d="M19.5 12a7.5 7.5 0 0 1-13.1 5"/><path ${T} d="M4.5 12a7.5 7.5 0 0 1 13.1-5"/><path ${T} d="M17.8 3.5v3.7h-3.7M6.2 20.5v-3.7h3.7"/>`,
  check: `<path ${T} d="m5 12.5 4.5 4.5L19 7.5"/>`,

  // estados e avisos
  sucesso: `<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="m8.3 12.3 2.6 2.6 4.9-5.3"/>`,
  erro: `<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"/>`,
  alerta: `<path ${T} d="M10.3 4.5 3 17.5a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0z"/><path ${T} d="M12 10v3.5M12 17h.01"/>`,
  info: `<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="M12 11v5M12 8h.01"/>`,
  bloqueado: `<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="m6 6 12 12"/>`,
  cadeado: `<rect ${T} x="5" y="10.5" width="14" height="10" rx="2"/><path ${T} d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>`,
  relogio: `<circle ${T} cx="12" cy="12" r="8.5"/><path ${T} d="M12 7.5V12l3 2"/>`,

  // restrições alimentares
  folha: `<path ${T} d="M5 19c0-8 5-13.5 14-14-.5 9-6 14-14 14z"/><path ${T} d="M5 19l7-7"/>`,
  sem_gluten: `<path ${T} d="M12 21V11"/><path ${T} d="M12 11c-2.5 0-4-1.6-4-4 2.4 0 4 1.5 4 4zM12 11c2.5 0 4-1.6 4-4-2.4 0-4 1.5-4 4zM12 15.5c-2.5 0-4-1.6-4-4 2.4 0 4 1.5 4 4zM12 15.5c2.5 0 4-1.6 4-4-2.4 0-4 1.5-4 4z"/><path ${T} d="M4 4l16 16"/>`,

  // etapas do pedido
  recebido: `<path ${T} d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path ${T} d="m9 11 2 2 4-4"/>`,
  preparo: `<path ${T} d="M7 11.5V19a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 19v-7.5"/><path ${T} d="M7 14.5h10"/><path ${T} d="M7.5 11.5a3.5 3.5 0 1 1 1.6-6.6 3.5 3.5 0 0 1 5.8 0 3.5 3.5 0 1 1 1.6 6.6z"/>`,
  entrega: `<path ${T} d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7"/><circle ${T} cx="6.5" cy="17.5" r="1.8"/><circle ${T} cx="17" cy="17.5" r="1.8"/>`,
  entregue: `<path ${T} d="M3.5 10.5 12 4l8.5 6.5"/><path ${T} d="M5.5 9v10.5h13V9"/><path ${T} d="m9.2 14 2 2 3.6-3.8"/>`,

  // pagamento
  credito: `<rect ${T} x="2.5" y="5" width="19" height="14" rx="2.5"/><path ${T} d="M2.5 9.5h19"/><path ${T} d="M6 15h4"/>`,
  debito: `<rect ${T} x="2.5" y="5" width="19" height="14" rx="2.5"/><rect ${T} x="5.5" y="9" width="4.5" height="3.5" rx=".8"/><path ${T} d="M15 11.5a2.5 2.5 0 0 1 0 3M17.5 10a4.8 4.8 0 0 1 0 6"/><path ${T} d="M5.5 15.5h4"/>`,
  // Símbolo estilizado no estilo do PIX (losango formado por dois "V" arredondados).
  // Não é o logotipo oficial do Banco Central.
  pix: `<g fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><polygon points="13.27,4.53 19.47,10.73 13.27,10.73"/><polygon points="19.47,13.27 13.27,19.47 13.27,13.27"/><polygon points="10.73,19.47 4.53,13.27 10.73,13.27"/><polygon points="4.53,10.73 10.73,4.53 10.73,10.73"/></g>`,
  whatsapp: `<path ${T} d="M4 20l1.2-3.8A8.5 8.5 0 1 1 8 19z"/><path ${T} d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.9-1-.9.8a4 4 0 0 1-2.3-2.3l.8-.9-1-1.9z"/>`,

  // avaliação (preenchida)
  estrela: `<path fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" d="m12 3.2 2.6 5.5 6 .7-4.5 4.1 1.2 5.9L12 16.4l-5.3 3 1.2-5.9-4.5-4.1 6-.7z"/>`,
  // marca (cupcake)
  cupcake: `<path ${T} d="M6.5 12.5h11l-1.4 7.2a1 1 0 0 1-1 .8H8.9a1 1 0 0 1-1-.8z"/><path ${T} d="M10 12.5l.5 8M14 12.5l-.5 8"/><path ${T} d="M5.5 12.5a2.5 2.5 0 0 1 .8-4.8 4 4 0 0 1 3.5-3.4A3 3 0 0 1 12 3a3 3 0 0 1 2.2 1.3 4 4 0 0 1 3.5 3.4 2.5 2.5 0 0 1 .8 4.8z"/>`,
};

/** Devolve o SVG do ícone. Com `rotulo`, o ícone é anunciado por leitores de tela. */
export function icone(nome, rotulo = "", classe = "") {
  const aria = rotulo ? `role="img" aria-label="${rotulo.replace(/"/g, "&quot;")}"` : 'aria-hidden="true"';
  return `<svg class="icone ${classe}" viewBox="0 0 24 24" ${aria} focusable="false">${DESENHOS[nome] || ""}</svg>`;
}

export const ICONES_DISPONIVEIS = Object.keys(DESENHOS);
