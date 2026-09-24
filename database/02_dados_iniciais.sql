-- =====================================================================
-- App de Cupcakes Gourmet - Dados iniciais (Situação 2)
-- Categorias, produtos, cupons e contas de DESENVOLVIMENTO.
--
-- Pode ser executado mais de uma vez: registros que já existem
-- (mesmo nome / código / e-mail) não são duplicados nem apagados.
-- Execute DEPOIS do 01_schema_mysql.sql:
--   mysql -u root -p < database/02_dados_iniciais.sql
-- =====================================================================

-- Garante UTF-8 mesmo se o cliente mysql usar latin1 por padrão (evita "LimÃ£o")
SET NAMES utf8mb4;

USE cupcakes_gourmet;

-- ---------------------------------------------------------------------
-- Categorias (nomes usados no protótipo T01)
-- ---------------------------------------------------------------------
INSERT INTO categoria (nome) VALUES ('Clássicos'), ('Especiais'), ('Frutados')
  ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- ---------------------------------------------------------------------
-- Produtos (dados de exemplo do protótipo; fotos em frontend/assets/images/produtos).
-- Chocolate Belga, Baunilha Clássico e Pistache Especial ainda não têm foto:
-- usam a imagem padrão sem-imagem.svg (ver docs/product-images-map.md).
-- ---------------------------------------------------------------------
INSERT INTO produto (id_categoria, nome, descricao, ingredientes, alergenos, preco, imagem_url,
                     vegano, sem_gluten, quantidade_estoque, ativo)
VALUES
  ((SELECT id_categoria FROM categoria WHERE nome = 'Clássicos'), 'Red Velvet',
   'Massa aveludada com cobertura de cream cheese. Feito diariamente com ingredientes selecionados.',
   'Farinha de trigo, açúcar, ovos, manteiga, cacau, cream cheese, corante natural de beterraba.',
   'Leite, ovos e trigo.', 12.50, 'assets/images/produtos/red-velvet.jpg', FALSE, FALSE, 8, TRUE),

  ((SELECT id_categoria FROM categoria WHERE nome = 'Clássicos'), 'Chocolate Belga',
   'Massa de cacau com ganache de chocolate belga.',
   'Farinha de trigo, açúcar, ovos, manteiga, cacau, chocolate belga 54%, creme de leite.',
   'Leite, ovos, trigo e soja.', 14.00, 'assets/images/produtos/sem-imagem.svg', FALSE, FALSE, 12, TRUE),

  ((SELECT id_categoria FROM categoria WHERE nome = 'Clássicos'), 'Baunilha Clássico',
   'Massa de baunilha com buttercream suave. Feito diariamente com ingredientes selecionados.',
   'Farinha de arroz, açúcar, ovos, manteiga, fava de baunilha.',
   'Leite e ovos.', 10.00, 'assets/images/produtos/sem-imagem.svg', FALSE, TRUE, 0, TRUE),

  ((SELECT id_categoria FROM categoria WHERE nome = 'Frutados'), 'Limão Siciliano',
   'Massa cítrica com cobertura de merengue.',
   'Farinha de trigo, açúcar, suco e raspas de limão siciliano, óleo vegetal, aquafaba.',
   'Trigo.', 13.00, 'assets/images/produtos/limao-siciliano.jpg', TRUE, FALSE, 5, TRUE),

  ((SELECT id_categoria FROM categoria WHERE nome = 'Frutados'), 'Frutas Vermelhas',
   'Recheio de geleia de frutas vermelhas.',
   'Farinha de arroz, açúcar, frutas vermelhas, óleo de coco, bebida vegetal de aveia sem glúten.',
   'Não contém alérgenos declarados', 13.50, 'assets/images/produtos/frutas-vermelhas.jpg', TRUE, TRUE, 9, TRUE),

  ((SELECT id_categoria FROM categoria WHERE nome = 'Especiais'), 'Doce de Leite com Nozes',
   'Massa amanteigada recheada com doce de leite e cobertura de nozes caramelizadas.',
   'Farinha de trigo, açúcar, ovos, manteiga, doce de leite, nozes.',
   'Leite, ovos, trigo e nozes.', 15.00, 'assets/images/produtos/doce-de-leite-nozes.jpg', FALSE, FALSE, 10, TRUE),

  ((SELECT id_categoria FROM categoria WHERE nome = 'Especiais'), 'Café Cremoso',
   'Massa de café com cobertura de creme de mascarpone.',
   'Farinha de trigo, açúcar, ovos, manteiga, café espresso, mascarpone.',
   'Leite, ovos e trigo.', 14.50, 'assets/images/produtos/cafe-cremoso.jpg', FALSE, FALSE, 7, TRUE),

  -- Produto inativo (não aparece no cardápio – RN-01), como no protótipo A03
  ((SELECT id_categoria FROM categoria WHERE nome = 'Especiais'), 'Pistache Especial',
   'Massa de pistache com cobertura de ganache branca e pistache triturado.',
   'Farinha de trigo, açúcar, ovos, manteiga, pistache, chocolate branco.',
   'Leite, ovos, trigo e pistache.', 16.00, 'assets/images/produtos/sem-imagem.svg', FALSE, FALSE, 0, FALSE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- ---------------------------------------------------------------------
-- Cupons (seção 3.3: cadastrados por script SQL, sem tela de administração)
-- ---------------------------------------------------------------------
INSERT INTO cupom (codigo, tipo, valor, data_validade, ativo) VALUES
  ('BEMVINDO10', 'PERCENTUAL', 10.00, '2027-12-31', TRUE),   -- 10% (exemplo do protótipo T03)
  ('DOCE5',      'VALOR_FIXO',  5.00, '2027-12-31', TRUE),   -- R$ 5,00 de desconto
  ('NATAL2025',  'PERCENTUAL', 15.00, '2025-12-25', TRUE),   -- vencido (exemplo do protótipo T03b)
  ('PAUSADO20',  'PERCENTUAL', 20.00, '2027-12-31', FALSE)   -- inativo
ON DUPLICATE KEY UPDATE codigo = VALUES(codigo);

-- ---------------------------------------------------------------------
-- Contas de DESENVOLVIMENTO / TESTE (RN-22: administrador é criado por script)
-- Senhas guardadas somente como hash bcrypt. NÃO use estas contas em produção.
--   admin@example.com   / Admin2026    (perfil ADMIN)
--   cliente@example.com / Cliente2026  (perfil CLIENTE)
-- ---------------------------------------------------------------------
INSERT INTO usuario (nome, email, senha_hash, telefone, perfil) VALUES
  ('Administrador', 'admin@example.com',
   '$2b$12$G6ljSg2vBH3mMXIGZuc8Q.D/tO7a/y8Bl/0VfDil5ysyeCbGPxkp.', NULL, 'ADMIN'),
  ('Cliente de Teste', 'cliente@example.com',
   '$2b$12$OzzPF4AN1/RvWtAbK0yBTO15sQqCVdsu9q9utIT.ERpmSpC1afbc6', '11900000000', 'CLIENTE')
ON DUPLICATE KEY UPDATE email = VALUES(email);
