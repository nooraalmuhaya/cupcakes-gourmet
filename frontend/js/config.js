/**
 * Configurações do front-end que a loja pode alterar.
 */
export const CONFIG = {
  nomeLoja: "Cupcake Haven",

  // Número do WhatsApp da loja no formato internacional, só números (link wa.me).
  // ATENÇÃO: número FICTÍCIO de demonstração. Troque pelo número real da loja.
  whatsapp: "5500000000000",
  mensagemWhatsapp: "Olá! Preciso de ajuda com um pedido no Cupcake Haven.",

  // RN-20: horário de atendimento (0 = domingo ... 6 = sábado)
  atendimento: { texto: "Segunda a sábado, das 9h às 19h", dias: [1, 2, 3, 4, 5, 6], abre: 9, fecha: 19 },

  // RF-20 / RNF-17: intervalo da consulta automática do status do pedido
  intervaloAtualizacaoMs: 30000,
};
