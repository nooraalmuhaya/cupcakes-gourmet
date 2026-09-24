-- =====================================================================
-- App de Cupcakes Gourmet - Projeto Físico do Banco de Dados
-- Projeto Integrador Transdisciplinar em Engenharia de Software II
-- Situação-Problema 1 | SGBD: MySQL 8.0 (8.0.16 ou superior, por causa do CHECK)
-- Este script foi gerado a partir do mesmo modelo usado no Dicionário de Dados.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cupcakes_gourmet
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;  -- ai_ci: busca ignora acentos e maiúsculas

USE cupcakes_gourmet;

-- usuario: Guarda as contas de acesso ao sistema (clientes e administradores).
CREATE TABLE usuario (
  id_usuario          INT           NOT NULL AUTO_INCREMENT,
  nome                VARCHAR(100)  NOT NULL,
  email               VARCHAR(120)  NOT NULL,
  senha_hash          VARCHAR(255)  NOT NULL,
  telefone            VARCHAR(15)   NULL,
  perfil              VARCHAR(10)   NOT NULL DEFAULT 'CLIENTE',
  data_cadastro       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuario_email UNIQUE (email),
  CONSTRAINT ck_usuario_perfil CHECK (perfil IN ('CLIENTE', 'ADMIN'))
) ENGINE=InnoDB;

-- endereco: Guarda os endereços de entrega salvos pelo cliente (até 5 por cliente).
CREATE TABLE endereco (
  id_endereco         INT           NOT NULL AUTO_INCREMENT,
  id_usuario          INT           NOT NULL,
  apelido             VARCHAR(30)   NOT NULL,
  cep                 CHAR(8)       NOT NULL,
  logradouro          VARCHAR(120)  NOT NULL,
  numero              VARCHAR(10)   NOT NULL,
  complemento         VARCHAR(60)   NULL,
  bairro              VARCHAR(60)   NOT NULL,
  cidade              VARCHAR(60)   NOT NULL,
  uf                  CHAR(2)       NOT NULL,
  padrao              BOOLEAN       NOT NULL DEFAULT FALSE,
  CONSTRAINT pk_endereco PRIMARY KEY (id_endereco),
  CONSTRAINT fk_endereco_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_endereco_cep CHECK (CHAR_LENGTH(cep) = 8)
) ENGINE=InnoDB;

-- categoria: Guarda as categorias usadas para organizar o cardápio.
CREATE TABLE categoria (
  id_categoria        INT           NOT NULL AUTO_INCREMENT,
  nome                VARCHAR(50)   NOT NULL,
  CONSTRAINT pk_categoria PRIMARY KEY (id_categoria),
  CONSTRAINT uq_categoria_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- produto: Guarda os cupcakes vendidos pela loja.
CREATE TABLE produto (
  id_produto          INT           NOT NULL AUTO_INCREMENT,
  id_categoria        INT           NOT NULL,
  nome                VARCHAR(80)   NOT NULL,
  descricao           VARCHAR(500)  NOT NULL,
  ingredientes        VARCHAR(500)  NOT NULL,
  alergenos           VARCHAR(255)  NOT NULL,
  preco               DECIMAL(8,2)  NOT NULL,
  imagem_url          VARCHAR(255)  NOT NULL,
  vegano              BOOLEAN       NOT NULL DEFAULT FALSE,
  sem_gluten          BOOLEAN       NOT NULL DEFAULT FALSE,
  quantidade_estoque  INT           NOT NULL DEFAULT 0,
  ativo               BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_produto PRIMARY KEY (id_produto),
  CONSTRAINT uq_produto_nome UNIQUE (nome),
  CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_produto_preco CHECK (preco > 0),
  CONSTRAINT ck_produto_estoque CHECK (quantidade_estoque >= 0)
) ENGINE=InnoDB;

-- cupom: Guarda os cupons de desconto cadastrados pela loja.
CREATE TABLE cupom (
  id_cupom            INT           NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(20)   NOT NULL,
  tipo                VARCHAR(12)   NOT NULL,
  valor               DECIMAL(8,2)  NOT NULL,
  data_validade       DATE          NOT NULL,
  ativo               BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_cupom PRIMARY KEY (id_cupom),
  CONSTRAINT uq_cupom_codigo UNIQUE (codigo),
  CONSTRAINT ck_cupom_tipo CHECK (tipo IN ('PERCENTUAL', 'VALOR_FIXO')),
  CONSTRAINT ck_cupom_valor CHECK (valor > 0),
  CONSTRAINT ck_cupom_percentual CHECK (tipo <> 'PERCENTUAL' OR valor <= 100)
) ENGINE=InnoDB;

-- pedido: Guarda os pedidos feitos pelos clientes.
CREATE TABLE pedido (
  id_pedido           INT           NOT NULL AUTO_INCREMENT,
  numero_pedido       VARCHAR(20)   NOT NULL,
  id_usuario          INT           NOT NULL,
  id_cupom            INT           NULL,
  endereco_entrega    VARCHAR(255)  NOT NULL,
  subtotal            DECIMAL(10,2) NOT NULL,
  valor_desconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  taxa_entrega        DECIMAL(8,2)  NOT NULL,
  valor_total         DECIMAL(10,2) NOT NULL,
  status              VARCHAR(25)   NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
  data_pedido         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_pedido PRIMARY KEY (id_pedido),
  CONSTRAINT uq_pedido_numero_pedido UNIQUE (numero_pedido),
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pedido_cupom FOREIGN KEY (id_cupom) REFERENCES cupom(id_cupom)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_pedido_status CHECK (status IN ('AGUARDANDO_PAGAMENTO', 'RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO')),
  CONSTRAINT ck_pedido_valores CHECK (subtotal >= 0 AND valor_desconto >= 0 AND taxa_entrega >= 0),
  CONSTRAINT ck_pedido_desconto CHECK (valor_desconto <= subtotal),
  CONSTRAINT ck_pedido_total CHECK (valor_total = subtotal - valor_desconto + taxa_entrega)
) ENGINE=InnoDB;

-- item_pedido: Guarda cada produto comprado em um pedido (resolve o N:M entre Pedido e Produto).
CREATE TABLE item_pedido (
  id_item_pedido      INT           NOT NULL AUTO_INCREMENT,
  id_pedido           INT           NOT NULL,
  id_produto          INT           NOT NULL,
  quantidade          INT           NOT NULL,
  preco_unitario      DECIMAL(8,2)  NOT NULL,
  CONSTRAINT pk_item_pedido PRIMARY KEY (id_item_pedido),
  CONSTRAINT uq_item_pedido_produto UNIQUE (id_pedido, id_produto),
  CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_item_produto FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_item_quantidade CHECK (quantidade >= 1),
  CONSTRAINT ck_item_preco CHECK (preco_unitario > 0)
) ENGINE=InnoDB;

-- pagamento: Guarda o pagamento (simulado) de cada pedido.
CREATE TABLE pagamento (
  id_pagamento        INT           NOT NULL AUTO_INCREMENT,
  id_pedido           INT           NOT NULL,
  metodo              VARCHAR(10)   NOT NULL,
  status              VARCHAR(10)   NOT NULL DEFAULT 'PENDENTE',
  data_pagamento      DATETIME      NULL,
  CONSTRAINT pk_pagamento PRIMARY KEY (id_pagamento),
  CONSTRAINT uq_pagamento_id_pedido UNIQUE (id_pedido),
  CONSTRAINT fk_pagamento_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_pagamento_metodo CHECK (metodo IN ('CREDITO', 'DEBITO', 'PIX')),
  CONSTRAINT ck_pagamento_status CHECK (status IN ('PENDENTE', 'APROVADO', 'RECUSADO'))
) ENGINE=InnoDB;

-- avaliacao: Guarda a avaliação que o cliente faz de um pedido entregue.
CREATE TABLE avaliacao (
  id_avaliacao        INT           NOT NULL AUTO_INCREMENT,
  id_pedido           INT           NOT NULL,
  nota                TINYINT       NOT NULL,
  comentario          VARCHAR(500)  NULL,
  data_avaliacao      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_avaliacao PRIMARY KEY (id_avaliacao),
  CONSTRAINT uq_avaliacao_id_pedido UNIQUE (id_pedido),
  CONSTRAINT fk_avaliacao_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_avaliacao_nota CHECK (nota BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- notificacao: Guarda os avisos exibidos ao cliente dentro do app quando o status do pedido muda.
CREATE TABLE notificacao (
  id_notificacao      INT           NOT NULL AUTO_INCREMENT,
  id_pedido           INT           NOT NULL,
  mensagem            VARCHAR(255)  NOT NULL,
  lida                BOOLEAN       NOT NULL DEFAULT FALSE,
  data_envio          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_notificacao PRIMARY KEY (id_notificacao),
  CONSTRAINT fk_notificacao_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Índices de apoio às consultas mais frequentes
-- (o MySQL já cria índice automaticamente para PK, UNIQUE e FK)
CREATE INDEX idx_pedido_usuario_data ON pedido (id_usuario, data_pedido);
CREATE INDEX idx_pedido_status ON pedido (status);
CREATE INDEX idx_notificacao_pedido_lida ON notificacao (id_pedido, lida);
