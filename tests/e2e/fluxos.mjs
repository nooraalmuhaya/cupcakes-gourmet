// Testes funcionais dos 6 fluxos pedidos (Chromium headless via Playwright).
// Precisa do Playwright (npm install playwright). Caminho alternativo: PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const B = process.argv[2] || 'http://127.0.0.1:8000';
const OUT = process.argv[3];
const resultados = [];
const errosJs = [];
let n = 0;
async function passo(fluxo, nome, fn) {
  try { await fn(); resultados.push({ fluxo, nome, ok: true }); }
  catch (e) { resultados.push({ fluxo, nome, ok: false, erro: String(e.message).split('\n')[0] }); }
}
function igual(a, b, msg) { if (a !== b) throw new Error(`${msg}: esperado ${JSON.stringify(b)}, obtido ${JSON.stringify(a)}`); }
async function texto(page, sel) { return (await page.locator(sel).first().innerText()).replace(/\u00a0/g, ' ').trim(); }
async function toast(page, t) { await page.locator('.toast', { hasText: t }).first().waitFor({ timeout: 5000 }); }
async function shot(page, nome) { if (OUT) await page.screenshot({ path: `${OUT}/${nome}.png`, fullPage: false }); }
const pronto = (page) => page.waitForLoadState('networkidle');

const browser = await chromium.launch();
const nova = async (w = 390, h = 844) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'pt-BR' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errosJs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/status of (4\d\d)/.test(m.text())) errosJs.push(m.text()); });
  return p;
};
const email = `cliente.${Date.now()}@example.com`;
const c = await nova();

// ============ FLUXO 1: cadastro → login → cardápio → detalhes → carrinho
await passo(1, 'Tela protegida sem login leva ao T04 com MSG-I06', async () => {
  await c.goto(B + '/pages/pedidos.html'); await c.waitForURL(/login\.html/); await pronto(c);
  igual(await texto(c, '#alerta'), 'Faça login para continuar.', 'MSG-I06');
});
await passo(1, 'Cadastro inválido mostra MSG-E05/E03/E19 nos campos', async () => {
  await c.goto(B + '/pages/cadastro.html'); await pronto(c);
  await c.fill('#email', 'maria.errado'); await c.fill('#senha', 'abc123'); await c.fill('#confirmacao_senha', 'abc1234');
  await c.click('button[type=submit]');
  igual(await texto(c, '#nome ~ .erro-campo, .campo:has(#nome) .erro-campo'), 'Preencha este campo.', 'nome');
  igual(await texto(c, '.campo:has(#senha) .erro-campo'), 'A senha deve ter pelo menos 8 caracteres, com letras e números.', 'senha');
  igual(await texto(c, '.campo:has(#confirmacao_senha) .erro-campo'), 'As senhas não são iguais.', 'confirmação');
  await shot(c, 'T05b_cadastro_validacao');
});
await passo(1, 'E-mail já cadastrado mostra MSG-E02', async () => {
  await c.fill('#nome', 'Cliente Teste'); await c.fill('#email', 'cliente@example.com');
  await c.fill('#senha', 'Teste2026'); await c.fill('#confirmacao_senha', 'Teste2026');
  await c.click('button[type=submit]');
  await c.locator('.campo:has(#email) .erro-campo', { hasText: 'Este e-mail já está cadastrado' }).waitFor();
});
await passo(1, 'Cadastro válido cria conta, faz login e mostra MSG-S05', async () => {
  await c.fill('#email', email); await c.fill('#telefone', '(11) 98765-4321');
  await c.click('button[type=submit]'); await c.waitForURL(/index\.html$/); await toast(c, 'Conta criada! Bem-vindo(a).');
});
await passo(1, 'Sair mostra MSG-S06; login com senha errada mostra MSG-E01', async () => {
  await c.goto(B + '/pages/conta.html'); await pronto(c); await c.click('[data-sair]');
  await toast(c, 'Você saiu da sua conta.');
  await c.goto(B + '/pages/login.html'); await c.fill('#email', email); await c.fill('#senha', 'Errada2026');
  await c.click('button[type=submit]'); await c.locator('#alerta', { hasText: 'E-mail ou senha incorretos.' }).waitFor();
  await shot(c, 'T04b_login_dados_incorretos');
});
await passo(1, 'Login correto volta ao início', async () => {
  await c.fill('#senha', 'Teste2026'); await c.click('button[type=submit]'); await c.waitForURL(/index\.html$/);
});
await passo(1, 'Cardápio lista produtos agrupados e selo Indisponível', async () => {
  await pronto(c);
  const grupos = await c.locator('.grupo-categoria h2').allInnerTexts();
  igual(grupos.join(','), 'Clássicos,Especiais,Frutados', 'categorias');
  await c.locator('.card-produto', { hasText: 'Baunilha Clássico' }).locator('.selo-indisponivel').waitFor();
  igual(await c.locator('.card-produto', { hasText: 'Baunilha Clássico' }).locator('[data-adicionar]').count(), 0, 'sem botão');
  await shot(c, 'T01_cardapio');
});
await passo(1, 'Busca "limao" encontra Limão Siciliano (sem acento)', async () => {
  await c.fill('#busca', 'limao'); await c.locator('#resumo-filtro', { hasText: '1 resultado para "limao"' }).waitFor();
  igual(await c.locator('.card-produto h3').allInnerTexts().then((a) => a.join()), 'Limão Siciliano', 'resultado');
});
await passo(1, 'Filtros Vegano + Sem glúten combinados e MSG-I01 sem resultado', async () => {
  await c.click('#limpar-busca'); await c.click('[data-restricao=vegano]'); await c.click('[data-restricao=sem_gluten]');
  await c.locator('#resumo-filtro', { hasText: 'Vegano · Sem glúten' }).waitFor();
  igual(await c.locator('.card-produto h3').allInnerTexts().then((a) => a.join()), 'Frutas Vermelhas', 'filtro');
  await shot(c, 'T01b_busca_e_filtros');
  await c.fill('#busca', 'morango'); await c.locator('.estado', { hasText: 'Nenhum cupcake encontrado.' }).waitFor();
  await shot(c, 'T01c_nenhum_resultado');
  await c.locator('.estado [data-limpar]').click(); await c.locator('.grupo-categoria').first().waitFor();
});
await passo(1, 'Detalhes do produto mostram ingredientes e alérgenos', async () => {
  await c.locator('.card-produto', { hasText: 'Red Velvet' }).locator('a.cobre').click(); await c.waitForURL(/produto\.html\?id=/); await pronto(c);
  await c.locator('.alergenos', { hasText: 'Leite, ovos e trigo.' }).waitFor();
  await c.click('[data-qtd="1"]'); igual(await texto(c, '.quantidade output'), '2', 'quantidade');
  await shot(c, 'T02_detalhes');
});
await passo(1, 'Adicionar ao carrinho mostra MSG-S01 e contador 2', async () => {
  await c.click('#adicionar'); await toast(c, 'Cupcake adicionado ao carrinho.');
  igual(await texto(c, '[data-contador=carrinho]'), '2', 'contador');
});
await passo(1, 'Produto inexistente volta ao cardápio com MSG-E15', async () => {
  await c.goto(B + '/pages/produto.html?id=99999'); await c.waitForURL(/index\.html$/); await toast(c, 'Produto não encontrado.');
});

// ============ FLUXO 2: carrinho → endereço → pagamento → confirmação
await passo(2, 'Adicionar pelo cardápio (Chocolate Belga) e abrir carrinho', async () => {
  await pronto(c);
  await c.locator('.card-produto', { hasText: 'Chocolate Belga' }).locator('[data-adicionar]').click(); await toast(c, 'Cupcake adicionado');
  await c.goto(B + '/pages/carrinho.html'); await pronto(c);
  igual(await texto(c, '.resumo-valores .total span:last-child'), 'R$ 47,00', 'total sem cupom (39 + 8)');
});
await passo(2, 'Alterar quantidade recalcula; MSG-E06 respeita o estoque', async () => {
  await c.locator('.item-carrinho', { hasText: 'Red Velvet' }).locator('[aria-label=Aumentar]').click();
  await c.locator('.resumo-valores .total', { hasText: 'R$ 59,50' }).waitFor();
  await c.locator('.item-carrinho', { hasText: 'Red Velvet' }).locator('[aria-label=Diminuir]').click();
  await c.locator('.resumo-valores .total', { hasText: 'R$ 47,00' }).waitFor();
});
await passo(2, 'Cupom vencido mostra MSG-E08 com o motivo', async () => {
  await c.fill('#codigo', 'NATAL2025'); await c.click('#form-cupom button');
  await c.locator('.form-cupom .erro-campo', { hasText: 'Cupom inválido: vencido.' }).waitFor();
  await shot(c, 'T03b_cupom_invalido');
});
await passo(2, 'Cupom BEMVINDO10 aplica desconto R$ 3,90 (MSG-S04) → total R$ 43,10', async () => {
  await c.fill('#codigo', 'bemvindo10'); await c.click('#form-cupom button');
  await toast(c, 'Cupom aplicado! Você economizou R$ 3,90.');
  igual(await texto(c, '.resumo-valores .total span:last-child'), 'R$ 43,10', 'total');
  await shot(c, 'T03_carrinho');
});
await passo(2, 'Finalizar sem endereço abre o formulário de endereço direto', async () => {
  await c.click('#finalizar'); await c.waitForURL(/enderecos\.html\?novo=1/); await c.locator('#form-endereco').waitFor();
});
await passo(2, 'CEP inválido (MSG-E04) e campo vazio (MSG-E05)', async () => {
  await c.fill('#apelido', 'Casa'); await c.fill('#cep', '012345'); await c.click('#form-endereco button[type=submit]');
  await c.locator('.campo:has(#cep) .erro-campo', { hasText: 'CEP inválido. Digite os 8 números do CEP.' }).waitFor();
  await c.locator('.campo:has(#logradouro) .erro-campo', { hasText: 'Preencha este campo.' }).waitFor();
  await shot(c, 'T13b_cep_invalido');
});
await passo(2, 'Endereço válido é salvo (MSG-S03) e volta ao checkout com ele selecionado', async () => {
  await c.fill('#cep', '01415000'); await c.fill('#logradouro', 'Rua das Flores'); await c.fill('#numero', '123');
  await c.fill('#complemento', 'apto 12'); await c.fill('#bairro', 'Jardim Paulista'); await c.fill('#cidade', 'São Paulo');
  await c.selectOption('#uf', 'SP'); await c.click('#form-endereco button[type=submit]');
  await c.waitForURL(/checkout\.html/); await toast(c, 'Endereço salvo com sucesso.');
  await c.locator('.opcao-endereco', { hasText: 'Casa' }).locator('input:checked').waitFor();
  await shot(c, 'T06_checkout_endereco');
});
await passo(2, 'Pagamento: aviso de demonstração e validação do cartão (MSG-E11)', async () => {
  await c.click('#form-endereco button[type=submit]'); await c.waitForURL(/pagamento\.html/); await pronto(c);
  await c.locator('.alerta-aviso', { hasText: 'Ambiente de demonstração: nenhum valor real é cobrado.' }).waitFor();
  igual(await texto(c, '.total-destaque strong'), 'R$ 43,10', 'total a pagar');
  await c.click('#confirmar');
  await c.locator('.campo:has(#numero) .erro-campo', { hasText: 'Confira os dados do cartão: número do cartão (16 dígitos).' }).waitFor();
  await shot(c, 'T07_pagamento_validacao');
});
await passo(2, 'Cartão final 0000 é recusado (MSG-E10) com as 3 opções', async () => {
  await c.fill('#numero', '4111111111110000'); await c.fill('#nome', 'CLIENTE TESTE'); await c.fill('#validade', '1230'); await c.fill('#cvv', '123');
  await c.click('#confirmar'); await c.locator('.recusa', { hasText: 'Pagamento recusado.' }).waitFor();
  for (const t of ['Tentar novamente', 'Trocar forma de pagamento', 'Cancelar pedido']) await c.locator('.recusa button', { hasText: t }).waitFor();
  await shot(c, 'T07c_pagamento_recusado');
});
await passo(2, 'Trocar para PIX mostra QR ilustrativo e aprova (T08 com número CUP-AAAAMMDD-NNNN)', async () => {
  await c.click('[data-trocar]'); await c.click('[data-metodo=PIX]');
  await c.locator('#area-pix .qr-code').waitFor(); igual(await c.locator('#campos-cartao').isHidden(), true, 'campos de cartão escondidos');
  await shot(c, 'T07b_pagamento_pix');
  await c.click('#confirmar'); await c.waitForURL(/confirmacao\.html\?pedido=/); await pronto(c);
  const numero = await texto(c, '.numero-pedido strong');
  if (!/^CUP-\d{8}-\d{4}$/.test(numero)) throw new Error('número inválido ' + numero);
  await c.locator('.lista-dados', { hasText: 'PIX · Aprovado' }).waitFor();
  igual(await c.locator('[data-contador=carrinho]').isHidden(), true, 'carrinho esvaziado');
  await shot(c, 'T08_confirmacao');
});

// ============ FLUXO 3: histórico → detalhes → acompanhamento
let urlPedido = '';
await passo(3, 'Acompanhar pedido mostra a linha do tempo com "Pedido recebido" atual', async () => {
  await c.click('text=Acompanhar pedido'); await c.waitForURL(/acompanhar\.html/); await pronto(c);
  urlPedido = c.url();
  await c.locator('.linha-tempo li.atual', { hasText: 'Pedido recebido' }).waitFor();
  await c.locator('text=atualiza a cada 30 s').waitFor();
  await shot(c, 'T09_acompanhar');
});
await passo(3, 'Sino mostra 1 notificação não lida', async () => { igual(await texto(c, '[data-contador=notificacoes]'), '1', 'contador'); });
await passo(3, 'Meus Pedidos lista o pedido e "Ver detalhes" abre o acompanhamento', async () => {
  await c.goto(B + '/pages/pedidos.html'); await pronto(c);
  await c.locator('.card-pedido .status', { hasText: 'Pedido recebido' }).waitFor();
  await c.locator('.card-pedido', { hasText: '2x Red Velvet · 1x Chocolate Belga' }).waitFor();
  await shot(c, 'T10_meus_pedidos');
  await c.click('text=Ver detalhes ›'); await c.waitForURL(/acompanhar\.html/);
});
await passo(3, 'Notificação: tocar marca como lida e abre o acompanhamento', async () => {
  await c.goto(B + '/pages/notificacoes.html'); await pronto(c);
  await c.locator('.notificacao.nao-lida', { hasText: 'Recebemos seu pedido.' }).waitFor();
  await shot(c, 'T14_notificacoes');
  await c.click('.notificacao'); await c.waitForURL(/acompanhar\.html/); await pronto(c);
  igual(await c.locator('[data-contador=notificacoes]').isHidden(), true, 'contador zerado');
});
await passo(3, 'Outro cliente não vê o pedido (MSG-E13)', async () => {
  const o = await nova(); await o.goto(B + '/pages/login.html');
  await o.fill('#email', 'cliente@example.com'); await o.fill('#senha', 'Cliente2026'); await o.click('button[type=submit]'); await o.waitForURL(/index/);
  await o.goto(urlPedido); await o.waitForURL(/pedidos\.html/); await toast(o, 'Você não tem permissão para acessar esta página.');
  await o.context().close();
});

// ============ FLUXO 4: conta → endereços
await passo(4, 'Minha Conta: editar nome e telefone', async () => {
  await c.goto(B + '/pages/conta.html'); await pronto(c);
  await c.fill('#nome', 'Cliente Teste Silva'); await c.click('#form-perfil button[type=submit]'); await toast(c, 'Dados salvos.');
  igual(await texto(c, '#nome-topo'), 'Cliente Teste Silva', 'nome atualizado');
  await c.fill('#nome', ''); await c.click('#form-perfil button[type=submit]');
  await c.locator('.campo:has(#nome) .erro-campo', { hasText: 'Preencha este campo.' }).waitFor();
  await c.fill('#nome', 'Cliente Teste Silva');
  await shot(c, 'T12_minha_conta');
});
await passo(4, 'Adicionar segundo endereço, tornar padrão e excluir com confirmação', async () => {
  await c.goto(B + '/pages/enderecos.html'); await pronto(c);
  await c.click('[data-novo]'); await c.fill('#apelido', 'Trabalho'); await c.fill('#cep', '01310-100');
  await c.fill('#logradouro', 'Av. Paulista'); await c.fill('#numero', '1000'); await c.fill('#bairro', 'Bela Vista');
  await c.fill('#cidade', 'São Paulo'); await c.selectOption('#uf', 'SP'); await c.click('#form-endereco button[type=submit]');
  await toast(c, 'Endereço salvo com sucesso.'); await c.locator('text=2 de 5 endereços salvos').waitFor();
  await c.locator('.card-endereco', { hasText: 'Trabalho' }).locator('[data-padrao]').click(); await toast(c, 'Endereço padrão atualizado.');
  await c.locator('.card-endereco').first().locator('.selo-padrao').waitFor();
  igual(await c.locator('.card-endereco').first().locator('strong').innerText(), 'Trabalho', 'padrão primeiro');
  await shot(c, 'T13_meus_enderecos');
  await c.locator('.card-endereco', { hasText: 'Trabalho' }).locator('[data-excluir]').click();
  await c.locator('.modal', { hasText: 'Excluir um endereço não altera pedidos já feitos.' }).waitFor();
  await c.click('.modal [data-r=sim]'); await toast(c, 'Endereço excluído.');
  await c.locator('.card-endereco', { hasText: 'Casa' }).locator('.selo-padrao').waitFor();
});
await passo(4, 'Ajuda e Suporte: FAQ abre/fecha e link do WhatsApp', async () => {
  await c.goto(B + '/pages/ajuda.html'); await pronto(c);
  await c.click('summary:has-text("Posso cancelar meu pedido?")');
  await c.locator('details[open] p', { hasText: 'Enquanto o pagamento não foi aprovado' }).waitFor();
  const href = await c.locator('.botao-whatsapp').getAttribute('href'); if (!href.startsWith('https://wa.me/')) throw new Error(href);
  await shot(c, 'T15_ajuda');
});
await passo(4, 'Cliente não acessa o painel do administrador (MSG-E13)', async () => {
  await c.goto(B + '/pages/admin/pedidos.html'); await pronto(c);
  await c.locator('.estado', { hasText: 'Você não tem permissão para acessar esta página.' }).waitFor();
});

// ============ FLUXO 5: admin → produtos
const a = await nova(1280, 860);
const nomeProduto = `Coco Queimado ${Date.now() % 10000}`;
await passo(5, 'Login com perfil ADMIN vai para o Painel de Pedidos (A01)', async () => {
  await a.goto(B + '/pages/login.html'); await a.fill('#email', 'admin@example.com'); await a.fill('#senha', 'Admin2026');
  await a.click('button[type=submit]'); await a.waitForURL(/admin\/pedidos\.html/); await pronto(a);
  await a.locator('h1', { hasText: 'Pedidos' }).waitFor();
});
await passo(5, 'Produtos (A03) lista ativos e inativos', async () => {
  await a.click('.menu-admin >> text=Produtos'); await a.waitForURL(/admin\/produtos\.html/); await pronto(a);
  await a.locator('tr', { hasText: 'Pistache Especial' }).locator('text=Inativo').waitFor();
  await shot(a, 'A03_produtos');
});
await passo(5, 'Formulário (A04): preço zero (MSG-E21) e nome repetido (MSG-E17)', async () => {
  await a.click('text=+ Novo produto'); await a.waitForURL(/admin\/produto\.html/); await pronto(a);
  await a.fill('#nome', 'Red Velvet'); await a.selectOption('#id_categoria', { label: 'Especiais' });
  await a.fill('#descricao', 'Massa de coco com calda queimada.'); await a.fill('#ingredientes', 'Farinha, coco, açúcar.');
  await a.fill('#preco', '0'); await a.fill('#quantidade_estoque', '6'); await a.fill('#imagem_url', 'assets/images/produtos/doce-de-leite.svg');
  await a.click('button[type=submit]');
  await a.locator('.campo:has(#preco) .erro-campo', { hasText: 'O preço deve ser maior que zero.' }).waitFor();
  await shot(a, 'A04_formulario_preco_invalido');
  await a.fill('#preco', '11,90'); await a.click('button[type=submit]');
  await a.locator('.campo:has(#nome) .erro-campo', { hasText: 'Já existe um produto com este nome.' }).waitFor();
});
await passo(5, 'Salvar produto novo (MSG-S10) e ele aparece no cardápio', async () => {
  await a.fill('#nome', nomeProduto); await a.click('button[type=submit]');
  await a.waitForURL(/admin\/produtos\.html/); await toast(a, 'Produto salvo com sucesso.');
  await a.locator('tr', { hasText: nomeProduto }).waitFor();
  await c.goto(B + '/'); await pronto(c); await c.locator('.card-produto', { hasText: nomeProduto }).waitFor();
});
await passo(5, 'Editar preço/estoque do produto', async () => {
  await a.locator('tr', { hasText: nomeProduto }).locator('text=Editar').click(); await a.waitForURL(/produto\.html\?id=/); await pronto(a);
  igual(await a.inputValue('#preco'), '11,90', 'preço carregado'); await a.fill('#preco', '12.40'); await a.fill('#quantidade_estoque', '20');
  await a.click('button[type=submit]'); await a.waitForURL(/admin\/produtos\.html/);
  await a.locator('tr', { hasText: nomeProduto }).locator('text=R$ 12,40').waitFor();
});
await passo(5, 'Desativar pede confirmação e some do cardápio; reativar volta', async () => {
  await a.locator('tr', { hasText: nomeProduto }).locator('[data-situacao]').click();
  await a.locator('.modal').waitFor(); await a.click('.modal [data-r=sim]');
  await a.locator('tr', { hasText: nomeProduto }).locator('text=Inativo').waitFor();
  await c.reload(); await pronto(c); igual(await c.locator('.card-produto', { hasText: nomeProduto }).count(), 0, 'escondido');
  await a.locator('tr', { hasText: nomeProduto }).locator('[data-situacao]').click(); await toast(a, 'Produto reativado.');
});

// ============ FLUXO 6: admin → pedidos → status (+ polling do cliente, avaliação)
await passo(6, 'Painel filtra por "Pedido recebido" e abre o pedido (A02)', async () => {
  await a.goto(B + '/pages/admin/pedidos.html'); await pronto(a);
  await a.click('[data-status=RECEBIDO]'); await a.locator('tbody tr').first().waitFor();
  await shot(a, 'A01_painel_de_pedidos');
  await a.locator('tr', { hasText: 'Cliente Teste Silva' }).first().locator('text=Abrir').click();
  await a.waitForURL(/admin\/pedido\.html\?id=/); await pronto(a);
  await a.locator('text=Desconto (cupom BEMVINDO10)').waitFor();
});
await passo(6, 'Cliente com T09 aberto recebe a mudança sozinho (consulta a cada 30 s)', async () => {
  await c.goto(urlPedido); await pronto(c);
  await a.click('[data-proximo=EM_PREPARO]'); await toast(a, 'Status do pedido atualizado para Em preparo.');
  await shot(a, 'A02_detalhe_status_atualizado');
  await c.locator('.linha-tempo li.atual', { hasText: 'Em preparo' }).waitFor({ timeout: 40000 });
  await toast(c, 'Status atualizado: Em preparo.');
});
await passo(6, 'Pedido alterado em outra aba mostra MSG-E14', async () => {
  const outra = await a.context().newPage(); await outra.goto(a.url()); await pronto(outra);
  await a.click('[data-proximo=SAIU_PARA_ENTREGA]'); await toast(a, 'Saiu para entrega');
  await outra.click('[data-proximo=SAIU_PARA_ENTREGA]');
  await toast(outra, 'Não foi possível mudar o status. O pedido pode ter sido atualizado. Recarregue a página.');
  await outra.close();
});
await passo(6, 'Marcar como Entregue; cancelar não aparece mais', async () => {
  await a.click('[data-proximo=ENTREGUE]'); await toast(a, 'Entregue');
  igual(await a.locator('[data-cancelar]').count(), 0, 'sem cancelar');
});
await passo(6, 'Cliente avalia: sem nota (MSG-E12), depois 4 estrelas (MSG-S07)', async () => {
  await c.goto(B + '/pages/pedidos.html'); await pronto(c); await c.click('.card-pedido >> text=Avaliar');
  await c.waitForURL(/avaliar\.html/); await pronto(c);
  await c.click('button[type=submit]'); await c.locator('#erro-nota', { hasText: 'Escolha uma nota de 1 a 5 estrelas.' }).waitFor();
  await c.click('[data-nota="4"]'); await c.fill('#comentario', 'Chegaram bonitos e fresquinhos.');
  igual(await texto(c, '#contador'), '31/500', 'contador'); await shot(c, 'T11_avaliar');
  await c.click('button[type=submit]'); await c.waitForURL(/pedidos\.html/); await toast(c, 'Obrigado pela avaliação!');
  await c.locator('.card-pedido [aria-label="4 de 5 estrelas"]').waitFor(); await shot(c, 'T11b_avaliacao_enviada');
});
await passo(6, 'Administrador vê a avaliação no detalhe do pedido', async () => {
  await a.reload(); await pronto(a); await a.locator('text=Chegaram bonitos e fresquinhos.').waitFor();
});
await passo(6, 'Cancelamento pelo admin com confirmação devolve o estoque (RN-15)', async () => {
  // novo pedido do cliente de teste
  await c.goto(B + '/pages/produto.html?id=4'); await pronto(c); const antes = Number((await texto(c, '.pilha .texto-pequeno')).split(' ')[0]);
  await c.click('#adicionar'); await toast(c, 'adicionado');
  await c.goto(B + '/pages/checkout.html'); await pronto(c); await c.click('#form-endereco button[type=submit]');
  await c.waitForURL(/pagamento/); await pronto(c); await c.click('[data-metodo=PIX]'); await c.click('#confirmar'); await c.waitForURL(/confirmacao/);
  await c.goto(B + '/pages/produto.html?id=4'); await pronto(c);
  igual(Number((await texto(c, '.pilha .texto-pequeno')).split(' ')[0]), antes - 1, 'estoque baixado');
  await a.goto(B + '/pages/admin/pedidos.html'); await pronto(a); await a.locator('tbody tr').first().locator('text=Abrir').click(); await pronto(a);
  await a.click('[data-cancelar]'); await a.locator('.modal', { hasText: 'As quantidades voltam para o estoque' }).waitFor();
  await shot(a, 'A02b_confirmar_cancelamento');
  await a.click('.modal [data-r=sim]'); await toast(a, 'Status do pedido atualizado para Cancelado.');
  await c.reload(); await pronto(c); igual(Number((await texto(c, '.pilha .texto-pequeno')).split(' ')[0]), antes, 'estoque devolvido');
});
await passo(6, 'Cliente vê o pedido cancelado (cor + ícone + texto)', async () => {
  await c.goto(B + '/pages/pedidos.html'); await pronto(c); await c.locator('.card-pedido').first().locator('text=Ver detalhes ›').click();
  await pronto(c); await c.locator('.caixa-cancelado', { hasText: 'Pedido cancelado' }).waitFor(); await shot(c, 'T09b_pedido_cancelado');
});

// ============ extras: estados vazios e responsividade
await passo(7, 'Carrinho vazio mostra MSG-I03 e Finalizar desabilitado', async () => {
  await c.goto(B + '/pages/carrinho.html'); await pronto(c); await c.locator('text=Seu carrinho está vazio.').waitFor();
  igual(await c.locator('button:has-text("Finalizar compra")').isDisabled(), true, 'desabilitado'); await shot(c, 'T03c_carrinho_vazio');
});
await passo(7, 'Cliente novo sem pedidos (MSG-I04) e sem notificações (MSG-I05)', async () => {
  const d = await nova(); await d.goto(B + '/pages/cadastro.html');
  await d.fill('#nome', 'Sem Pedidos'); await d.fill('#email', `vazio.${Date.now()}@example.com`); await d.fill('#senha', 'Vazio2026'); await d.fill('#confirmacao_senha', 'Vazio2026');
  await d.click('button[type=submit]'); await d.waitForURL(/index/);
  await d.goto(B + '/pages/pedidos.html'); await d.locator('text=Você ainda não fez nenhum pedido.').waitFor(); await shot(d, 'T10b_sem_pedidos');
  await d.goto(B + '/pages/notificacoes.html'); await d.locator('text=Você não tem notificações.').waitFor();
  await d.context().close();
});
await passo(7, 'Sem rolagem horizontal e barra inferior do protótipo em 360, 390, 768 e 1366 px', async () => {
  for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1366, 768]]) {
    const p = await nova(w, h);
    for (const url of ['/', '/pages/produto.html?id=1', '/pages/carrinho.html', '/pages/ajuda.html', '/pages/login.html']) {
      await p.goto(B + url); await pronto(p);
      const m = await p.evaluate(() => {
        const nav = document.querySelector('.barra-inferior').getBoundingClientRect();
        return { larg: document.documentElement.scrollWidth, navFundo: Math.round(nav.bottom) === innerHeight,
          textos: [...document.querySelectorAll('.barra-inferior a span')].map((s) => s.textContent).join('|') };
      });
      if (m.larg > w) throw new Error(`${url} em ${w}px tem largura ${m.larg}`);
      if (!m.navFundo || m.textos !== 'Início|Carrinho|Pedidos|Conta') throw new Error(`${url} em ${w}px: barra inferior ${JSON.stringify(m)}`);
    }
    if (w === 768) { await p.goto(B + '/'); await pronto(p); await shot(p, 'tablet_cardapio'); }
    if (w === 1366) { await p.goto(B + '/'); await pronto(p); await shot(p, 'desktop_cardapio'); }
    await p.context().close();
  }
});

await browser.close();
const falhas = resultados.filter((r) => !r.ok);
for (const r of resultados) console.log(`${r.ok ? 'PASS' : 'FAIL'} | F${r.fluxo} | ${r.nome}${r.ok ? '' : ' | ' + r.erro}`);
console.log(`TOTAL ${resultados.length} | PASS ${resultados.length - falhas.length} | FAIL ${falhas.length}`);
console.log('ERROS_JS', JSON.stringify(errosJs));
