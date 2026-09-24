"""Catálogo de mensagens da seção 10.4 do relatório da Situação 1.

Os códigos (MSG-xxx) são devolvidos pela API junto com o texto, para o front-end
e os testes poderem identificar cada situação.
"""

MSG = {
    "MSG-S01": "Cupcake adicionado ao carrinho.",
    "MSG-S02": "Item removido do carrinho.",
    "MSG-S03": "Endereço salvo com sucesso.",
    "MSG-S04": "Cupom aplicado! Você economizou R$ {valor}.",
    "MSG-S05": "Conta criada! Bem-vindo(a).",
    "MSG-S06": "Você saiu da sua conta.",
    "MSG-S07": "Obrigado pela avaliação!",
    "MSG-S08": "Status do pedido atualizado para {status}.",
    "MSG-S09": "Itens do pedido adicionados ao carrinho.",
    "MSG-S10": "Produto salvo com sucesso.",
    "MSG-I01": "Nenhum cupcake encontrado. Tente outro nome ou limpe os filtros.",
    "MSG-I02": "Nenhum cupcake disponível no momento. Volte mais tarde!",
    "MSG-I03": "Seu carrinho está vazio.",
    "MSG-I04": "Você ainda não fez nenhum pedido.",
    "MSG-I05": "Você não tem notificações.",
    "MSG-I06": "Faça login para continuar.",
    "MSG-W01": "Alguns itens não estão disponíveis e não foram adicionados: {lista}.",
    "MSG-W02": "Não conseguimos buscar o CEP. Preencha o endereço manualmente.",
    "MSG-W03": "Não foi possível atualizar agora. Mostrando o último status.",
    "MSG-E01": "E-mail ou senha incorretos.",
    "MSG-E02": "Este e-mail já está cadastrado. Tente fazer login.",
    "MSG-E03": "A senha deve ter pelo menos 8 caracteres, com letras e números.",
    "MSG-E04": "CEP inválido. Digite os 8 números do CEP.",
    "MSG-E05": "Preencha este campo.",
    "MSG-E06": "Só temos {n} unidades deste cupcake no momento.",
    "MSG-E07": "Alguns itens do carrinho mudaram de preço ou ficaram indisponíveis. Revise antes de continuar.",
    "MSG-E08": "Cupom inválido: {motivo}.",
    "MSG-E09": "Faça login para usar um cupom.",
    "MSG-E10": "Pagamento recusado. Tente novamente ou escolha outra forma de pagamento.",
    "MSG-E11": "Confira os dados do cartão: {campo}.",
    "MSG-E12": "Escolha uma nota de 1 a 5 estrelas.",
    "MSG-E13": "Você não tem permissão para acessar esta página.",
    "MSG-E14": "Não foi possível mudar o status. O pedido pode ter sido atualizado. Recarregue a página.",
    "MSG-E15": "Produto não encontrado.",
    "MSG-E16": "Você já tem 5 endereços salvos. Exclua um para adicionar outro.",
    "MSG-E17": "Já existe um produto com este nome.",
    "MSG-E18": "Algo deu errado. Tente novamente em instantes.",
    "MSG-E19": "As senhas não são iguais.",
    "MSG-E20": "Este pedido não pode ser avaliado.",
    "MSG-E21": "O preço deve ser maior que zero.",
}

# Textos de status mostrados ao cliente (tabela da seção 9.5)
TEXTO_STATUS = {
    "AGUARDANDO_PAGAMENTO": "Aguardando pagamento",
    "RECEBIDO": "Pedido recebido",
    "EM_PREPARO": "Em preparo",
    "SAIU_PARA_ENTREGA": "Saiu para entrega",
    "ENTREGUE": "Entregue",
    "CANCELADO": "Cancelado",
}

# Mensagens das notificações (protótipo T14) – RN-16
NOTIFICACAO_STATUS = {
    "RECEBIDO": "Recebemos seu pedido.",
    "EM_PREPARO": "Seu pedido está em preparo.",
    "SAIU_PARA_ENTREGA": "Seu pedido saiu para entrega.",
    "ENTREGUE": "Seu pedido foi entregue.",
    "CANCELADO": "Seu pedido foi cancelado.",
}


def msg(codigo: str, **kwargs) -> str:
    texto = MSG[codigo]
    return texto.format(**kwargs) if kwargs else texto
