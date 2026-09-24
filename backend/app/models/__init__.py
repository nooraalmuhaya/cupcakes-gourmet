"""Model (MVC): mapeamento das 10 tabelas do banco cupcakes_gourmet."""
from app.models.avaliacao import Avaliacao
from app.models.categoria import Categoria
from app.models.cupom import Cupom
from app.models.endereco import Endereco
from app.models.item_pedido import ItemPedido
from app.models.notificacao import Notificacao
from app.models.pagamento import Pagamento
from app.models.pedido import Pedido
from app.models.produto import Produto
from app.models.usuario import Usuario

__all__ = [
    "Avaliacao", "Categoria", "Cupom", "Endereco", "ItemPedido",
    "Notificacao", "Pagamento", "Pedido", "Produto", "Usuario",
]
