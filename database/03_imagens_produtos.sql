-- =====================================================================
-- App de Cupcakes Gourmet - Atualização das imagens dos produtos
-- (Situação 2 - acabamento visual)
--
-- Para bancos que já receberam o 02_dados_iniciais.sql antes desta versão.
-- Só atualiza a coluna produto.imagem_url pelo nome do produto; não altera
-- tabelas, colunas, preços, estoque nem outros dados. Pode ser executado
-- mais de uma vez.
--   mysql -u root -p < database/03_imagens_produtos.sql
-- =====================================================================

SET NAMES utf8mb4;
USE cupcakes_gourmet;

UPDATE produto SET imagem_url = 'assets/images/produtos/red-velvet.jpg'          WHERE nome = 'Red Velvet';
UPDATE produto SET imagem_url = 'assets/images/produtos/limao-siciliano.jpg'     WHERE nome = 'Limão Siciliano';
UPDATE produto SET imagem_url = 'assets/images/produtos/frutas-vermelhas.jpg'    WHERE nome = 'Frutas Vermelhas';
UPDATE produto SET imagem_url = 'assets/images/produtos/doce-de-leite-nozes.jpg' WHERE nome = 'Doce de Leite com Nozes';
UPDATE produto SET imagem_url = 'assets/images/produtos/cafe-cremoso.jpg'        WHERE nome = 'Café Cremoso';

-- Ainda sem foto (a ilustração antiga foi retirada): imagem padrão.
-- Quando a foto existir, coloque o arquivo na pasta e altere o caminho pelo
-- painel do administrador (Produtos > Editar > Caminho da imagem).
UPDATE produto SET imagem_url = 'assets/images/produtos/sem-imagem.svg'
 WHERE nome IN ('Chocolate Belga', 'Baunilha Clássico', 'Pistache Especial')
   AND imagem_url LIKE '%.svg';
