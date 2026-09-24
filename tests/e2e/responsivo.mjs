// Auditoria de responsividade (390, 768 e 1366 px). Precisa do Playwright (npm install playwright).
// Uso: node responsivo.mjs <pasta-das-capturas>   (back-end rodando em http://127.0.0.1:8000 com os dados iniciais)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const B = 'http://127.0.0.1:8000', OUT = process.argv[2], LARGURAS = [[390, 844], [768, 1024], [1366, 768]];
const browser = await chromium.launch();

// ---------- preparação de dados (cliente com pedido entregue, admin)
const cli = await browser.newContext(); const adm = await browser.newContext();
const post = (ctx, url, data, method = 'POST') => ctx.request.fetch(B + url, { method, data });
await post(cli, '/api/auth/login', { email: 'cliente@example.com', senha: 'Cliente2026' });
await post(adm, '/api/auth/login', { email: 'admin@example.com', senha: 'Admin2026' });
let ends = await (await cli.request.get(B + '/api/enderecos')).json();
if (!ends.length) {
  await post(cli, '/api/enderecos', { apelido: 'Casa', cep: '01415000', logradouro: 'Rua das Flores', numero: '123', complemento: 'apto 12', bairro: 'Jardim Paulista', cidade: 'São Paulo', uf: 'SP' });
  await post(cli, '/api/enderecos', { apelido: 'Trabalho', cep: '01310100', logradouro: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' });
  ends = await (await cli.request.get(B + '/api/enderecos')).json();
}
async function pedido(itens) {
  for (const [id, q] of itens) await post(cli, '/api/carrinho/itens', { id_produto: id, quantidade: q });
  const p = (await (await post(cli, '/api/pedidos', { id_endereco: ends[0].id_endereco, metodo: 'PIX' })).json()).pedido;
  await post(cli, '/api/pagamentos', { id_pedido: p.id_pedido, metodo: 'PIX' });
  return p.id_pedido;
}
const entregue = await pedido([[1, 1], [5, 2]]);
for (const s of ['EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']) await post(adm, `/api/admin/pedidos/${entregue}/status`, { novo_status: s }, 'PUT');
const emPreparo = await pedido([[2, 2]]);
await post(adm, `/api/admin/pedidos/${emPreparo}/status`, { novo_status: 'EM_PREPARO' }, 'PUT');
await post(cli, '/api/carrinho/itens', { id_produto: 1, quantidade: 2 });
await post(cli, '/api/carrinho/itens', { id_produto: 6, quantidade: 1 });
await post(cli, '/api/carrinho/cupom', { codigo: 'DOCE5' });
const cookiesCli = await cli.cookies(), cookiesAdm = await adm.cookies();

const PAGINAS = [
  ['T01', '/', 'anon'], ['T02', '/pages/produto.html?id=1', 'anon'], ['T04', '/pages/login.html', 'anon'], ['T05', '/pages/cadastro.html', 'anon'],
  ['T03', '/pages/carrinho.html', 'cli'], ['T06', '/pages/checkout.html', 'cli'], ['T07', `/pages/pagamento.html?endereco=${ends[0].id_endereco}`, 'cli'],
  ['T08', `/pages/confirmacao.html?pedido=${emPreparo}`, 'cli'], ['T09', `/pages/acompanhar.html?pedido=${emPreparo}`, 'cli'],
  ['T10', '/pages/pedidos.html', 'cli'], ['T11', `/pages/avaliar.html?pedido=${entregue}`, 'cli'], ['T12', '/pages/conta.html', 'cli'],
  ['T13', '/pages/enderecos.html', 'cli'], ['T13-form', '/pages/enderecos.html?novo=1', 'cli'], ['T14', '/pages/notificacoes.html', 'cli'], ['T15', '/pages/ajuda.html', 'cli'],
  ['A01', '/pages/admin/pedidos.html', 'adm'], ['A02', `/pages/admin/pedido.html?id=${emPreparo}`, 'adm'], ['A03', '/pages/admin/produtos.html', 'adm'], ['A04', '/pages/admin/produto.html?id=1', 'adm'],
  ['404', '/nao-existe.html', 'anon'],
];

const linhas = [];
for (const [w, h] of LARGURAS) {
  for (const [cod, url, quem] of PAGINAS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'pt-BR' });
    if (quem === 'cli') await ctx.addCookies(cookiesCli);
    if (quem === 'adm') await ctx.addCookies(cookiesAdm);
    const page = await ctx.newPage(); const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto(B + url); await page.waitForLoadState('networkidle'); await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}/${cod}_${w}.png` });
    const m = await page.evaluate(() => {
      const vw = innerWidth, vh = innerHeight, vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const r = { scrollW: document.documentElement.scrollWidth, vw };
      const dentroDeRolagem = (e) => { for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
      r.foraDaTela = [...document.querySelectorAll('body *')].filter((e) => vis(e) && !e.closest('.visualmente-oculto,.pular-conteudo') && !dentroDeRolagem(e) && e.getBoundingClientRect().right > vw + 1).map((e) => e.tagName + '.' + e.className).slice(0, 5);
      const nav = document.querySelector('.barra-inferior');
      if (nav) { const n = nav.getBoundingClientRect(); r.nav = { top: Math.round(n.top), bottom: Math.round(n.bottom), vh, textos: [...nav.querySelectorAll('a span')].map((s) => s.textContent).join('|'), itemLarg: Math.round(nav.querySelector('a').getBoundingClientRect().width), x1: Math.round(nav.querySelector('a').getBoundingClientRect().left), x4: Math.round(nav.querySelector('a:last-child').getBoundingClientRect().right) }; }
      const main = document.getElementById('conteudo') || document.querySelector('main');
      const cont = main.firstElementChild ? [...main.querySelectorAll(':scope > *')].filter(vis) : [];
      const minX = Math.min(...cont.map((e) => e.getBoundingClientRect().left)), maxX = Math.max(...cont.map((e) => e.getBoundingClientRect().right));
      r.larguraConteudo = Math.round(maxX - minX); r.ocupacao = Math.round(100 * (maxX - minX) / vw);
      r.fonteMin = Math.min(...[...main.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize)));
      r.alvosPequenos = [...document.querySelectorAll('button, a, input, select, textarea, [role=button]')].filter((e) => vis(e) && !e.closest('.visualmente-oculto,.pular-conteudo') && !(e.tagName === 'A' && e.closest('p, .migalhas, td, .lista-dados')) && e.getBoundingClientRect().height < 40 && !['checkbox', 'radio'].includes(e.type))
        .map((e) => `${e.tagName}:${(e.innerText || e.placeholder || e.getAttribute('aria-label') || '').trim().slice(0, 25)}(${Math.round(e.getBoundingClientRect().height)})`).slice(0, 6);
      return r;
    });
    // sobreposição: rola até o fim e confere se o último conteúdo fica acima da barra inferior
    const sobre = await page.evaluate(async () => {
      scrollTo(0, document.documentElement.scrollHeight); await new Promise((r) => setTimeout(r, 100));
      const nav = document.querySelector('.barra-inferior'); if (!nav) return null;
      const main = document.getElementById('conteudo'); const filhos = [...main.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().height > 0);
      const fim = Math.max(...filhos.map((e) => e.getBoundingClientRect().bottom));
      return Math.round(nav.getBoundingClientRect().top - fim);
    });
    await page.screenshot({ path: `${OUT}/${cod}_${w}_fim.png` });
    linhas.push({ w, cod, ...m, folgaAcimaDaBarra: sobre, erros: erros.length });
    await ctx.close();
  }
}
await browser.close();
for (const l of linhas) {
  const prob = [];
  if (l.scrollW > l.vw) prob.push(`ROLAGEM-H ${l.scrollW}>${l.vw}`);
  if (l.foraDaTela.length) prob.push('FORA:' + l.foraDaTela.join(','));
  if (l.nav && (l.nav.bottom !== l.nav.vh || l.nav.textos !== 'Início|Carrinho|Pedidos|Conta')) prob.push('NAV ' + JSON.stringify(l.nav));
  if (l.folgaAcimaDaBarra !== null && l.folgaAcimaDaBarra < 0) prob.push(`ESCONDIDO-SOB-A-BARRA ${l.folgaAcimaDaBarra}px`);
  if (l.fonteMin < 12) prob.push(`FONTE ${l.fonteMin}px`);
  if (l.erros) prob.push(`JS ${l.erros}`);
  console.log(`${String(l.w).padStart(4)} ${l.cod.padEnd(8)} conteudo=${String(l.larguraConteudo).padStart(4)}px (${String(l.ocupacao).padStart(3)}%) nav=${l.nav ? l.nav.x1 + '-' + l.nav.x4 : '-'} folga=${l.folgaAcimaDaBarra} fonteMin=${l.fonteMin} ${prob.length ? '<< ' + prob.join(' ; ') : 'ok'}${l.alvosPequenos.length ? '  alvos<40px: ' + l.alvosPequenos.join(' ') : ''}`);
}
