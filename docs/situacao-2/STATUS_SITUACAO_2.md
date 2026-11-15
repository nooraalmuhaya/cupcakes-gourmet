# Status da Situação 2

Situação real em 24/09/2026, atualizada em 15/11/2026. Só marquei como **IMPLEMENTADO**
o que implementei **e** testei, com a evidência indicada. Legenda: IMPLEMENTADO, EM TESTE, PENDENTE,
NÃO APLICÁVEL.

## Resumo

| Item | Status | Evidência |
|------|--------|-----------|
| Git | IMPLEMENTADO | Commits com mensagens descritivas (`git log`); `.gitignore` exclui `.env`, ambientes virtuais e caches; nenhum `.env` no histórico |
| GitHub | IMPLEMENTADO (branch `main`) | <https://github.com/nooraalmuhaya/cupcakes-gourmet> – todo o trabalho está no branch `main` |
| Front-end | IMPLEMENTADO | 19 telas (T01–T15, A01–A04) em HTML/CSS/JS puro seguindo o protótipo (barra inferior em todas as larguras); 48/48 passos no navegador, 0 erros de JavaScript; auditoria de responsividade 63/63 em 390, 768 e 1366 px ([testes](testes-situacao-2.md#4-testes-funcionais-do-front-end-6-fluxos)) |
| Back-end | IMPLEMENTADO | FastAPI em MVC (`models/`, `services/`, `routers/`, `schemas/`); 42 rotas documentadas em `/api/docs` |
| Database | IMPLEMENTADO | Script da Situação 1 executado sem alterações no MySQL 8.0.46 (10 tabelas, 16 CHECKs); `test_banco.py` confirma as restrições; dados iniciais idempotentes |
| Authentication | IMPLEMENTADO | bcrypt, cookie de sessão assinado e HttpOnly, perfis CLIENTE/ADMIN; `test_auth.py` (16), `test_admin.py` (acesso negado) e fluxo 1 no navegador |
| Products | IMPLEMENTADO | Cardápio, detalhes, busca sem acento, filtros e administração de produtos; `test_produtos.py` (12), `test_admin.py`, fluxos 1 e 5 |
| Cart | IMPLEMENTADO | Carrinho na sessão, cupom, taxa de entrega; `test_carrinho.py` (22), fluxo 2 |
| Checkout | IMPLEMENTADO | Endereços, criação do pedido em transação, pagamento simulado (aprovado/recusado/PIX); `test_enderecos.py`, `test_pedidos.py`, fluxo 2 |
| Orders | IMPLEMENTADO | Histórico, acompanhamento com consulta a cada 30 s, notificações, avaliação, repetir pedido; `test_pedidos.py` (35), fluxos 3 e 6 |
| Admin | IMPLEMENTADO | Produtos (A03/A04) e pedidos (A01/A02) com transições do EST-01 e devolução de estoque; `test_admin.py` (19), fluxos 5 e 6 |
| Tests | IMPLEMENTADO | 156 testes pytest passando; 48 passos funcionais passando em dois modos de execução |
| Documentation | IMPLEMENTADO | README, manual do usuário com capturas reais, arquitetura, rastreabilidade, testes, registro de mudanças, notas de desenvolvimento |

## Auditoria final (checklist)

| Verificação | Resultado |
|-------------|-----------|
| Estrutura do repositório (`frontend/`, `backend/`, `database/`, `docs/`, `tests/`) | OK |
| Conexão com o MySQL | OK (`/api/saude`) |
| Banco igual ao da Situação 1 | OK (script sem alterações; modelos só mapeiam) |
| Autenticação / autorização | OK |
| Fluxo do cliente (cardápio → confirmação → acompanhamento) | OK |
| Busca, filtros, detalhes | OK |
| Carrinho, endereço, checkout, pagamento simulado | OK |
| Criação e confirmação do pedido | OK |
| Histórico, acompanhamento, avaliação, notificações | OK |
| Perfil / configurações, ajuda e suporte | OK |
| Administração de produtos e pedidos, mudança de status | OK |
| Tratamento de erros e estados vazios | OK (mensagens do catálogo 10.4 conferidas nos testes) |
| Interface responsiva | OK em Chromium (360, 390, 768 e 1366 px) – adaptação do desenho mobile, sem desenho novo |
| Testes existem e foram executados | OK |
| README, manual, documentação técnica, rastreabilidade | OK |
| `.env.example` e `.gitignore` | OK |
| Nenhum segredo versionado | OK |
| Nenhum resultado de teste inventado | OK – falhas da primeira execução registradas em `testes-situacao-2.md` |
| Nenhum feedback de usuário inventado / nada da Situação 3 | OK – `docs/situacao-1/feedback-colegas/` continua vazio |

## Pendências e limitações conhecidas

| Item | Status | Observação |
|------|--------|------------|
| Repetir os fluxos no navegador em Firefox e Edge | PENDENTE | Os fluxos automatizados usaram só o Chromium; vou repetir o roteiro manualmente |
| Número real do WhatsApp da loja | PENDENTE | `frontend/js/config.js` tem número fictício |
| Busca automática de CEP | NÃO APLICÁVEL | Opcional na Situação 1; não implementada (endereço digitado) |
| Recuperação de senha, e-mails reais, tela de cupons, upload de imagem | NÃO APLICÁVEL | Fora do escopo (seção 3.3 da Situação 1) |
| Vídeo de demonstração | PENDENTE | Vou gravar o vídeo depois. |
| Relatório da Situação 1 | Não alterado | Vou revisar depois |
| Testes com colegas | NÃO APLICÁVEL nesta etapa | Situação 3 |

Limitações técnicas:
- O carrinho fica no cookie de sessão (limite de ~4 KB do navegador); suficiente para
  o cardápio da loja, mas não para centenas de itens diferentes.
- A sessão é assinada, não criptografada: guarda só id do usuário, carrinho e código do cupom.
- Pedido cancelado pelo administrador mantém o pagamento como APROVADO (não há estorno simulado).
- Se o cliente abandonar o pagamento, o pedido fica "Aguardando pagamento" até ele
  pagar ou cancelar (pela tela de acompanhamento).
