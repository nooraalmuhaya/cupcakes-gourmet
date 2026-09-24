// Verificações do acabamento visual (Situação 2): marca, fonte, imagens dos produtos,
// ícones de pagamento, ausência de símbolos provisórios e movimento reduzido.
// Uso: node visual.mjs [http://127.0.0.1:8000]   (back-end rodando com os dados iniciais)
// Precisa do Playwright (npm install playwright). Caminho alternativo: PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const B = process.argv[2] || 'http://127.0.0.1:8000';
const resultados = [];
const errosJs = [];
async function passo(nome, fn) {
  try { const extra = await fn(); resultados.push({ nome, ok: true, extra }); }
  catch (e) { resultados.push({ nome, ok: false, erro: String(e.message).split('\n')[0] }); }
}
const falha = (msg) => { throw new Error(msg); };

const browser = await chromium.launch();
async function contexto(opcoes = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', ...opcoes });
  ctx.on('page', (p) => {
    p.on('pageerror', (e) => errosJs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/status of 4\d\d/.test(m.text())) errosJs.push(m.text()); });
  });
  return ctx;
}
const pronto = (p) => p.waitForLoadState('networkidle');

// sessões de cliente e administrador
const cli = await contexto();
await cli.request.post(B + '/api/auth/login', { data: { email: 'cliente@example.com', senha: 'Cliente2026' } });
const adm = await contexto({ viewport: { width: 1366, height: 768 } });
await adm.request.post(B + '/api/auth/login', { data: { email: 'admin@example.com', senha: 'Admin2026' } });
const anon = await contexto();

const PAGINAS_CLIENTE = ['/', '/pages/produto.html?id=1', '/pages/carrinho.html', '/pages/checkout.html', '/pages/pagamento.html?endereco=1',
  '/pages/pedidos.html', '/pages/conta.html', '/pages/enderecos.html', '/pages/notificacoes.html', '/pages/ajuda.html'];
const PAGINAS_ANON = ['/pages/login.html', '/pages/cadastro.html', '/nao-existe.html'];
const PAGINAS_ADMIN = ['/pages/admin/pedidos.html', '/pages/admin/produtos.html', '/pages/admin/produto.html?id=1'];

// Símbolos que não devem aparecer como ícone/rótulo (o sinal de menos "−" dos descontos é tipografia, não ícone)
const PROIBIDOS = /[■-◿☀-➿⬀-⯿⊘↻←→✓✕★☆]|[\u{1F300}-\u{1FAFF}]/u;

await passo('Marca oficial "App de Cupcakes Gourmet" e nenhum "Cupcake Haven"', async () => {
  const vistos = [];
  for (const [ctx, lista] of [[cli, PAGINAS_CLIENTE], [anon, PAGINAS_ANON], [adm, PAGINAS_ADMIN]]) {
    const p = await ctx.newPage();
    for (const url of lista) {
      await p.goto(B + url); await pronto(p);
      const titulo = await p.title();
      const texto = await p.evaluate(() => document.body.innerText + ' ' + document.title);
      if (/cupcake ?haven/i.test(texto)) falha(`${url}: ainda contém "Cupcake Haven"`);
      if (url !== '/nao-existe.html' && !titulo.includes('App de Cupcakes Gourmet')) falha(`${url}: título "${titulo}"`);
      vistos.push(url);
    }
    await p.close();
  }
  const p = await cli.newPage(); await p.setViewportSize({ width: 1366, height: 768 }); await p.goto(B + '/'); await pronto(p);
  const marca = await p.locator('.barra-topo .marca').innerText();
  if (marca.replace(/\s+/g, ' ').trim() !== 'App de Cupcakes Gourmet') falha(`cabeçalho mostra "${marca}"`);
  await p.close();
  return `${vistos.length} telas`;
});

await passo('Fonte Poppins carregada e aplicada', async () => {
  const p = await anon.newPage(); await p.goto(B + '/'); await pronto(p);
  const r = await p.evaluate(async () => {
    await document.fonts.ready;
    const carregadas = [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Poppins' && f.status === 'loaded').map((f) => f.weight);
    return { familia: getComputedStyle(document.body).fontFamily, carregadas: [...new Set(carregadas)].sort() };
  });
  if (!r.familia.startsWith('Poppins') && !r.familia.startsWith('"Poppins"')) falha(`font-family = ${r.familia}`);
  if (!r.carregadas.length) falha('nenhum arquivo da Poppins carregado');
  await p.close();
  return `pesos carregados: ${r.carregadas.join(', ')}`;
});

await passo('Imagens de todos os produtos carregam (cardápio, detalhes e admin)', async () => {
  const p = await anon.newPage(); await p.goto(B + '/'); await pronto(p);
  await p.evaluate(async () => { for (const img of document.images) { img.loading = 'eager'; if (!img.complete) await new Promise((r) => { img.onload = img.onerror = r; }); } });
  const cards = await p.$$eval('.card-produto', (cs) => cs.map((c) => {
    const img = c.querySelector('img');
    return { nome: c.querySelector('h3').innerText.trim(), src: img.currentSrc || img.src, ok: img.complete && img.naturalWidth > 0, alt: img.alt };
  }));
  const quebradas = cards.filter((c) => !c.ok);
  if (quebradas.length) falha('não carregaram: ' + quebradas.map((c) => c.nome).join(', '));
  const semAlt = cards.filter((c) => !c.alt); if (semAlt.length) falha('sem texto alternativo: ' + semAlt.map((c) => c.nome));
  const produtos = await (await anon.request.get(B + '/api/produtos')).json();
  for (const prod of produtos) {
    await p.goto(`${B}/pages/produto.html?id=${prod.id_produto}`); await pronto(p);
    const ok = await p.$eval('.foto-produto', (i) => i.complete && i.naturalWidth > 0);
    if (!ok) falha(`detalhe sem imagem: ${prod.nome}`);
  }
  const pa = await adm.newPage(); await pa.goto(B + '/pages/admin/produtos.html'); await pronto(pa);
  const miniaturas = await pa.$$eval('img.miniatura', (is) => is.map((i) => i.complete && i.naturalWidth > 0));
  if (!miniaturas.length || miniaturas.includes(false)) falha('miniatura do admin não carregou');
  await pa.close(); await p.close();
  const comFoto = cards.filter((c) => /\.jpg/.test(c.src)).map((c) => c.nome);
  const padrao = cards.filter((c) => /sem-imagem\.svg/.test(c.src)).map((c) => c.nome);
  return `${cards.length} cards | com foto: ${comFoto.join(', ')} | imagem padrão: ${padrao.join(', ') || 'nenhum'}`;
});

await passo('Ícones de pagamento (Crédito, Débito, PIX) são SVG visíveis', async () => {
  await cli.request.post(B + '/api/carrinho/itens', { data: { id_produto: 2, quantidade: 1 } });
  const ends = await (await cli.request.get(B + '/api/enderecos')).json();
  if (!ends.length) await cli.request.post(B + '/api/enderecos', { data: { apelido: 'Casa', cep: '01415000', logradouro: 'Rua das Flores', numero: '123', bairro: 'Jardim Paulista', cidade: 'São Paulo', uf: 'SP' } });
  const id = (await (await cli.request.get(B + '/api/enderecos')).json())[0].id_endereco;
  const p = await cli.newPage(); await p.goto(`${B}/pages/pagamento.html?endereco=${id}`); await pronto(p);
  const metodos = await p.$$eval('.metodo', (ms) => ms.map((m) => {
    const svg = m.querySelector('svg.icone:not(.marca-selecao svg)') || m.querySelectorAll('svg.icone')[1];
    const icones = [...m.querySelectorAll(':scope > svg.icone')];
    const r = icones[0] ? icones[0].getBoundingClientRect() : { width: 0, height: 0 };
    return { texto: m.innerText.trim(), svgs: icones.length, largura: Math.round(r.width), formas: icones[0] ? icones[0].querySelectorAll('path,polygon,rect,circle').length : 0 };
  }));
  if (metodos.map((m) => m.texto).join('|') !== 'Crédito|Débito|PIX') falha(JSON.stringify(metodos));
  for (const m of metodos) if (m.svgs !== 1 || m.largura < 20 || m.formas < 1) falha(`ícone de ${m.texto}: ${JSON.stringify(m)}`);
  const selecionado = await p.$eval('.metodo[aria-pressed="true"]', (m) => getComputedStyle(m).borderColor);
  await p.click('[data-metodo=PIX]');
  const pix = await p.$eval('.metodo[aria-pressed="true"]', (m) => m.innerText.trim());
  if (pix !== 'PIX') falha('seleção do PIX não mudou');
  await p.close();
  return metodos.map((m) => `${m.texto}: ${m.largura}px, ${m.formas} formas`).join(' | ') + ` | borda selecionada ${selecionado}`;
});

await passo('Nenhum símbolo provisório (Unicode/emoji) nas telas', async () => {
  const achados = [];
  for (const [ctx, lista] of [[cli, PAGINAS_CLIENTE.concat(['/pages/acompanhar.html?pedido=1'])], [anon, PAGINAS_ANON], [adm, PAGINAS_ADMIN.concat(['/pages/admin/pedido.html?id=1'])]]) {
    const p = await ctx.newPage();
    for (const url of lista) {
      await p.goto(B + url); await pronto(p);
      const texto = await p.evaluate(() => document.body.innerText);
      const m = texto.match(PROIBIDOS); if (m) achados.push(`${url}: "${m[0]}"`);
    }
    await p.close();
  }
  if (achados.length) falha(achados.join('; '));
});

await passo('Transições: View Transitions ativas e barras fixas durante a troca', async () => {
  const p = await anon.newPage(); await p.goto(B + '/'); await pronto(p);
  const r = await p.evaluate(() => ({
    suporta: CSS.supports('view-transition-name: none'),
    topo: getComputedStyle(document.querySelector('.barra-topo')).viewTransitionName,
    barra: getComputedStyle(document.querySelector('.barra-inferior')).viewTransitionName,
    botao: getComputedStyle(document.querySelector('.chip')).transitionDuration,
  }));
  if (!r.suporta || r.topo !== 'cabecalho' || r.barra !== 'barra-inferior') falha(JSON.stringify(r));
  const inicio = Date.now(); await p.click('.card-produto a.cobre'); await p.waitForURL(/produto\.html/); await pronto(p);
  await p.close();
  return `navegação cardápio → detalhes em ${Date.now() - inicio} ms; transição dos chips ${r.botao}`;
});

await passo('Movimento reduzido (prefers-reduced-motion) desliga as animações', async () => {
  const red = await contexto({ reducedMotion: 'reduce' });
  const p = await red.newPage(); await p.goto(B + '/'); await pronto(p);
  const r = await p.evaluate(() => ({
    media: matchMedia('(prefers-reduced-motion: reduce)').matches,
    chip: getComputedStyle(document.querySelector('.chip')).transitionDuration,
    girando: (() => { const d = document.createElement('div'); d.className = 'girando'; document.body.appendChild(d); const v = getComputedStyle(d).animationIterationCount; d.remove(); return v; })(),
  }));
  await p.close(); await red.close();
  const ms = parseFloat(r.chip) * (r.chip.endsWith('ms') ? 1 : 1000);
  if (!r.media || ms > 1 || r.girando !== '1') falha(JSON.stringify(r));
  return `transições ${r.chip}; animação contínua: ${r.girando} vez`;
});

await passo('Barra inferior: item ativo com indicador e foco visível', async () => {
  const p = await anon.newPage(); await p.goto(B + '/'); await pronto(p);
  const r = await p.evaluate(() => {
    const ativo = document.querySelector('.barra-inferior a[aria-current="page"] .indicador');
    const outro = document.querySelector('.barra-inferior a:not([aria-current]) .indicador');
    return { ativo: getComputedStyle(ativo).backgroundColor, outro: getComputedStyle(outro).backgroundColor,
      rotulo: document.querySelector('.barra-inferior a[aria-current="page"]').innerText.trim() };
  });
  if (r.ativo === r.outro || r.rotulo !== 'Início') falha(JSON.stringify(r));
  await p.keyboard.press('Tab');
  await p.close();
  return `ativo ${r.ativo} / inativo ${r.outro}`;
});

await browser.close();
for (const r of resultados) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.nome}${r.ok ? (r.extra ? ' | ' + r.extra : '') : ' | ' + r.erro}`);
console.log(`TOTAL ${resultados.length} | PASS ${resultados.filter((r) => r.ok).length} | FAIL ${resultados.filter((r) => !r.ok).length}`);
console.log('ERROS_JS', JSON.stringify(errosJs));
