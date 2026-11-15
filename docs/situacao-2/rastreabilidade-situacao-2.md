# Rastreabilidade – Situação 2

Continua a matriz da seção 16 do relatório da Situação 1, ligando cada User Story
ao que foi implementado: **tela → endpoint → serviço → tabela → teste**.

Legenda dos testes: arquivos em `backend/tests/` (pytest) e passos do
`tests/e2e/fluxos.mjs` (navegador, "F1" = fluxo 1). Todos os testes listados
passaram na última execução (ver [`testes-situacao-2.md`](testes-situacao-2.md)).

## 1. Matriz por User Story

| US | RF / UC | Tela(s) | Endpoint(s) | Serviço | Tabela(s) | Testes | Status |
|----|---------|---------|-------------|---------|-----------|--------|--------|
| US01 Visualizar cardápio | RF-01, RF-02 / UC-01 | T01 | `GET /api/produtos`, `GET /api/categorias` | `produto_service.listar_cardapio` | produto, categoria | `test_lista_so_produtos_ativos_rn01`, `test_lista_agrupada_por_categoria`, `test_produto_sem_estoque_aparece_indisponivel_rn02`; F1 "Cardápio lista produtos agrupados e selo Indisponível" | Implementada |
| US02 Detalhes do cupcake | RF-03, RF-06 / UC-02 | T02 | `GET /api/produtos/{id}`, `POST /api/carrinho/itens` | `produto_service.obter_produto_ativo`, `carrinho_service.adicionar` | produto | `test_detalhe_do_produto_us02`, `test_produto_inexistente_msg_e15`, `test_produto_inativo_msg_e15`; F1 "Detalhes...", "Adicionar ao carrinho...", "Produto inexistente..." | Implementada |
| US03 Filtrar produtos | RF-04 / UC-01 | T01 | `GET /api/produtos?categoria=&vegano=&sem_gluten=` | `produto_service.listar_cardapio` | produto, categoria | `test_filtros_combinados_us03`; F1 "Filtros Vegano + Sem glúten..." | Implementada |
| US04 Pesquisar por nome | RF-05 / UC-01 | T01 | `GET /api/produtos?busca=` | `produto_service.listar_cardapio` | produto (collation `ai_ci`) | `test_busca_ignora_acentos_e_maiusculas_rn05`, `test_busca_exige_dois_caracteres`, `test_busca_sem_resultado_lista_vazia`, `test_collation_ignora_acentos`; F1 "Busca limao..." | Implementada |
| US05 Gerenciar carrinho | RF-06, RF-07, RF-08 / UC-03 | T03 | `GET /api/carrinho`, `POST/PUT/DELETE /api/carrinho/itens` | `carrinho_service` | — (sessão); produto (consulta) | `test_carrinho.py` (14 testes de itens), F2 "Alterar quantidade recalcula...", F7 "Carrinho vazio..." | Implementada |
| US06 Cadastro e login | RF-09, RF-10, RF-11, RF-12 / UC-05, UC-06, UC-07 | T04, T05, T12 | `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`, `GET /api/sessao`, `PUT /api/conta` | `auth_service`, `security/auth.py`, `security/password.py` | usuario | `test_auth.py` (16 testes); F1 (cadastro, login, logout); F4 "Minha Conta: editar nome e telefone" | Implementada |
| US07 Forma de pagamento | RF-17, RF-19 / UC-09 | T07 | `POST /api/pagamentos`, `POST /api/pedidos/{id}/cancelar` | `pagamento_service`, `pedido_service.pagar`, `pedido_service.cancelar_pelo_cliente` | pagamento, pedido | `test_pagamento_aprovado_confirma_pedido`, `test_pagamento_recusado_final_0000_msg_e10`, `test_nova_tentativa_trocando_para_pix`, `test_dados_de_cartao_invalidos_msg_e11`, `test_cartao_nao_e_gravado_rnf07`, `test_cliente_cancela_pedido_nao_pago_rf19`, testes de cartão em `test_regras.py`; F2 "Cartão final 0000...", "Trocar para PIX..." | Implementada |
| US08 Finalizar pedido | RF-15, RF-16, RF-18 / UC-08 | T06, T08 | `POST /api/pedidos`, `POST /api/pagamentos`, `GET /api/pedidos/{id}` | `pedido_service.criar_pedido`, `pedido_service.pagar` | pedido, item_pedido, pagamento, produto, notificacao | `test_criar_pedido_aguardando_pagamento`, `test_pedido_com_cupom_grava_valores`, `test_numero_sequencial_no_mesmo_dia`, `test_checkout_*` (7), `test_estoque_acabou_antes_do_pagamento`, `test_total_do_pedido_consistente`; F2 (endereço → pagamento → confirmação) | Implementada |
| US09 Cupom de desconto | RF-14, RF-08 / UC-04 | T03 | `POST /api/carrinho/cupom`, `DELETE /api/carrinho/cupom` | `cupom_service.validar`, `carrinho_service.aplicar_cupom` | cupom, pedido | `test_cupom_*` em `test_carrinho.py` (8), `test_cupom_de_pedido_cancelado_pode_ser_usado_de_novo`, `test_cupom_percentual_calcula_10_por_cento`, `test_desconto_nunca_passa_do_subtotal_rn09`; F2 "Cupom vencido...", "Cupom BEMVINDO10..." | Implementada |
| US10 Acompanhar pedido | RF-20 / UC-10 | T09 | `GET /api/pedidos/{id}`, `GET /api/pedidos/{id}/status` (a cada 30 s) | `pedido_service.obter_do_cliente`, `pedido_service.linha_do_tempo` | pedido, item_pedido, notificacao | `test_ver_meu_pedido_com_linha_do_tempo`, `test_consulta_de_status_para_polling`, `test_cliente_nao_ve_pedido_de_outro_msg_e13`; F3 "Acompanhar pedido...", F6 "Cliente com T09 aberto recebe a mudança sozinho", "Cliente vê o pedido cancelado" | Implementada |
| US11 Histórico de pedidos | RF-23, RF-24 / UC-12 | T10 | `GET /api/pedidos?pagina=`, `POST /api/pedidos/{id}/repetir` | `pedido_service.listar_do_cliente`, `pedido_service.repetir` | pedido, item_pedido, produto | `test_listar_meus_pedidos`, `test_historico_paginado_10_por_pagina_rn18`, `test_repetir_pedido_rn19`; F3 "Meus Pedidos lista...", F7 "sem pedidos (MSG-I04)" | Implementada |
| US12 Avaliar pedido | RF-25 / UC-13 | T11, A02 | `POST/GET /api/pedidos/{id}/avaliacao`, `GET /api/admin/pedidos/{id}` | `avaliacao_service.avaliar` | avaliacao, pedido | `test_avaliar_pedido_entregue_msg_s07`, `test_nao_avalia_pedido_nao_entregue_msg_e20`, `test_avaliacao_unica_e_nao_editavel_rn17`, `test_nota_obrigatoria_msg_e12_e_comentario_limite`, `test_uma_avaliacao_por_pedido`; F6 "Cliente avalia...", "Administrador vê a avaliação..." | Implementada |
| US13 Notificações no app | RF-21, RF-22 / UC-11, UC-16 | T14, cabeçalho | `GET /api/notificacoes`, `GET /api/notificacoes/nao-lidas`, `PUT /api/notificacoes/{id}/lida`, `PUT /api/notificacoes/lidas`, `GET /api/sessao` | `notificacao_service` | notificacao, pedido | `test_notificacoes_contador_e_marcar_lida`, `test_notificacao_de_outro_cliente`, `test_admin_avanca_status_e_notifica_msg_s08`; F3 "Sino mostra 1 notificação...", "Notificação: tocar marca como lida..." | Implementada |
| US14 Gestão de endereços | RF-13 / UC-07 | T06, T13 | `GET/POST/PUT/DELETE /api/enderecos`, `PUT /api/enderecos/{id}/padrao` | `endereco_service` | endereco; `pedido.endereco_entrega` (cópia) | `test_enderecos.py` (10 testes), `test_endereco_formatado_para_o_pedido`; F2 "CEP inválido...", "Endereço válido é salvo..."; F4 "Adicionar segundo endereço..." | Implementada (busca automática de CEP **não** – era opcional, ver seção 2) |
| US15 Ajuda e suporte | RF-26 / UC-14 | T15 | — (conteúdo fixo no front-end) | — | — | F4 "Ajuda e Suporte: FAQ abre/fecha e link do WhatsApp" | Implementada |
| US16 Gerenciar produtos | RF-27, RF-11 / UC-15 | A03, A04 | `GET/POST /api/admin/produtos`, `GET/PUT /api/admin/produtos/{id}`, `PATCH /api/admin/produtos/{id}/situacao` | `produto_service` (funções de administração) | produto, categoria | `test_admin.py` (produtos: 9 testes + 2 de acesso); F5 (todos os passos) | Implementada |
| US17 Gerenciar pedidos | RF-28, RF-29, RF-21 / UC-16 | A01, A02 | `GET /api/admin/pedidos`, `GET /api/admin/pedidos/{id}`, `PUT /api/admin/pedidos/{id}/status` | `pedido_service.listar_admin`, `pedido_service.alterar_status_admin` | pedido, notificacao, produto | `test_admin.py` (pedidos: 8 testes + 2 de acesso), `test_transicoes_de_status_do_admin_est01`; F6 (todos os passos) | Implementada |

## 2. Itens do planejamento que não foram implementados

| Item | Origem | Motivo |
|------|--------|--------|
| Preenchimento automático do endereço pelo CEP (API pública) | US14 CA6 (opcional), UC-07 A5, seção 3.4 | Marcado como **opcional** na Situação 1. Não foi implementado para o checkout não depender de serviço externo. O CEP é validado pelo formato (8 dígitos) e o endereço é digitado. A MSG-W02 não é usada. |
| Registro no log de "e-mail enviado" | Seção 3.4 (opcional) | **Implementado** como linha de log no servidor (simulação). Nenhum e-mail real é enviado. |

Nenhuma User Story ficou sem implementação.

## 3. Regras de negócio

| RN | Onde está | Teste principal |
|----|-----------|-----------------|
| RN-01 só ativos no cardápio | `produto_service.listar_cardapio` | `test_lista_so_produtos_ativos_rn01` |
| RN-02 estoque 0 = Indisponível, não vai ao carrinho | `Produto.esta_disponivel`, `carrinho_service.adicionar`, T01/T02 | `test_produto_sem_estoque_nao_entra_rn02` |
| RN-03 texto padrão de alérgenos | `schemas/produto.py` | `test_admin_cria_produto_msg_s10` |
| RN-04 quantidade 1 até o estoque | `carrinho_service`, `schemas/carrinho.py` | `test_nao_passa_do_estoque_msg_e06`, `test_quantidade_invalida` |
| RN-05 busca 2+ letras, parcial, sem acento | `produto_service` + collation | `test_busca_ignora_acentos_e_maiusculas_rn05` |
| RN-06 e-mail único, senha 8+ com letra e número | `schemas/auth.py`, `password.py`, UNIQUE no banco | `test_regra_de_senha_rn06`, `test_email_duplicado_msg_e02` |
| RN-07 o que exige login | dependências em `security/auth.py` | `test_adicionar_item_sem_login_rn07`, `test_rota_protegida_sem_login_msg_i06` |
| RN-08 até 5 endereços, um padrão, CEP 8 dígitos | `endereco_service`, `schemas/endereco.py` | `test_limite_de_cinco_enderecos_msg_e16`, `test_tornar_padrao_deixa_so_um` |
| RN-09 regras do cupom | `cupom_service`, `Cupom.calcular_desconto` | `test_cupons_invalidos_msg_e08_com_motivo`, `test_cupom_nao_desconta_a_taxa_de_entrega` |
| RN-10 taxa de entrega fixa configurável | `settings.taxa_entrega` (`TAXA_ENTREGA`) | `test_adicionar_item_sem_login_rn07` (total = subtotal + 8,00) |
| RN-11 pagamento simulado | `pagamento_service.simular` | `test_pagamento_simulado_rn11` |
| RN-12 RECEBIDO só com pagamento aprovado; baixa de estoque nesse momento | `pedido_service.pagar` | `test_criar_pedido_aguardando_pagamento`, `test_pagamento_aprovado_confirma_pedido` |
| RN-13 número CUP-AAAAMMDD-NNNN | `pedido_service._gerar_numero` | `test_numero_sequencial_no_mesmo_dia` |
| RN-14 transições do EST-01 | `pedido_service.TRANSICOES_ADMIN`, `cancelar_pelo_cliente` | `test_transicoes_de_status_do_admin_est01`, `test_transicao_invalida_msg_e14` |
| RN-15 admin cancela até EM_PREPARO e devolve estoque | `pedido_service.alterar_status_admin` | `test_admin_cancela_e_devolve_estoque_rn15` |
| RN-16 toda mudança de status gera notificação | `pedido_service._mudar_status`, `pagar` | `test_notificacoes_contador_e_marcar_lida` |
| RN-17 avaliação só de ENTREGUE, uma vez, 1–5, até 500 | `avaliacao_service`, `schemas/pedido.py` | `test_avaliacao_unica_e_nao_editavel_rn17` |
| RN-18 cliente só vê os próprios pedidos; 10 por página | `pedido_service.obter_do_cliente`, `listar_do_cliente` | `test_cliente_nao_ve_pedido_de_outro_msg_e13`, `test_historico_paginado_10_por_pagina_rn18` |
| RN-19 repetir pedido com preço atual e só itens disponíveis | `pedido_service.repetir` | `test_repetir_pedido_rn19` |
| RN-20 horário de atendimento e aviso | `frontend/js/pages/ajuda.js` | F4 "Ajuda e Suporte..." (o aviso depende da hora do navegador) |
| RN-21 preço do momento da compra | `ItemPedido.preco_unitario` | `test_admin_edita_preco_sem_mudar_pedido_antigo_rn21` |
| RN-22 cadastro público = CLIENTE; admin sem compras | `auth_service.cadastrar_cliente`, `cliente_logado` | `test_cadastro_publico_nunca_cria_admin_rn22`, `test_admin_nao_tem_enderecos_rn22` |
| RN-23 produto não é excluído, só desativado | sem rota DELETE; FK RESTRICT no banco | `test_nao_existe_exclusao_de_produto`, `test_produto_vendido_nao_pode_ser_apagado_rn23` |

## 4. Verificação reversa

- **Telas:** as 19 telas da seção 10.2 existem em `frontend/` (tabela na
  [arquitetura](arquitetura-situacao-2.md#mapa-de-telas)).
- **Tabelas:** as 10 tabelas são usadas pelos modelos em `backend/app/models/`.
- **Mensagens:** o catálogo da seção 10.4 está em `backend/app/utils/mensagens.py`;
  só a MSG-W02 (falha na API de CEP) não é usada, porque a busca de CEP não foi implementada.
- **Casos de uso:** UC-01 a UC-16 estão cobertos pelas linhas da tabela da seção 1.
