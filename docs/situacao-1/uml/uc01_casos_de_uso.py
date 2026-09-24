# Diagrama de Casos de Uso desenhado com layout fixo (matplotlib)
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyBboxPatch, FancyArrowPatch
W,H=1400,1150
fig,ax=plt.subplots(figsize=(14,11.5),dpi=130); ax.set_xlim(0,W); ax.set_ylim(H,0); ax.axis("off")
ax.add_patch(FancyBboxPatch((250,40),900,1080,boxstyle="round,pad=0,rounding_size=20",fill=False,lw=1.5))
ax.text(700,70,"Sistema: App de Cupcakes Gourmet",ha="center",fontsize=14,weight="bold")
def ator(x,y,n):
    ax.add_patch(plt.Circle((x,y-55),14,fill=False,lw=2)); ax.plot([x,x],[y-41,y+5],c="k",lw=2)
    ax.plot([x-25,x+25],[y-25,y-25],c="k",lw=2); ax.plot([x,x-20],[y+5,y+40],c="k",lw=2); ax.plot([x,x+20],[y+5,y+40],c="k",lw=2)
    ax.text(x,y+62,n,ha="center",fontsize=12,weight="bold")
P={}
def uc(k,x,y,t):
    ax.add_patch(Ellipse((x,y),285,64,fc="#FFF4E6",ec="#A0522D",lw=1.4)); ax.text(x,y,t,ha="center",va="center",fontsize=9.5); P[k]=(x,y)
colA=[("06","UC-06 Fazer Login / Logout"),("05","UC-05 Cadastrar Conta"),("01","UC-01 Consultar Cardápio\n(filtrar e pesquisar)"),
("02","UC-02 Visualizar Detalhes\ndo Produto"),("03","UC-03 Gerenciar Carrinho"),("07","UC-07 Gerenciar Perfil\ne Endereços"),
("08","UC-08 Finalizar Pedido"),("10","UC-10 Acompanhar Pedido"),("11","UC-11 Consultar Notificações"),
("12","UC-12 Consultar Histórico\nde Pedidos"),("13","UC-13 Avaliar Pedido"),("14","UC-14 Acessar Suporte")]
for i,(k,t) in enumerate(colA): uc(k,440,125+i*85,t)
uc("04",810,P["03"][1],"UC-04 Aplicar Cupom\nde Desconto")
uc("09",810,P["08"][1],"UC-09 Efetuar Pagamento\n(simulado)")
uc("15",1000,760,"UC-15 Gerenciar Produtos")
uc("16",1000,880,"UC-16 Gerenciar Pedidos\n(atualizar status)")
ator(110,560,"Cliente"); ator(1300,560,"Administrador")
for k,_ in colA: ax.plot([135,P[k][0]-142],[545,P[k][1]],c="k",lw=1)
for k in ["06","15","16"]: ax.plot([1275,P[k][0]+142],[545,P[k][1]],c="k",lw=1)
def dep(a,b,lbl,sa,sb):
    ax.add_patch(FancyArrowPatch(sa,sb,arrowstyle="->",mutation_scale=16,ls="--",lw=1.2,color="#333"))
    ax.text((sa[0]+sb[0])/2,(sa[1]+sb[1])/2-8,lbl,ha="center",fontsize=9,color="#333",style="italic")
dep("08","09","«include»",(592,P["08"][1]),(658,P["09"][1]))
dep("04","03","«extend»",(658,P["04"][1]),(592,P["03"][1]))
ax.add_patch(FancyArrowPatch((560,P["08"][1]-22),(560,P["07"][1]+22),arrowstyle="->",mutation_scale=16,ls="--",lw=1.2,color="#333"))
ax.text(548,(P["08"][1]+P["07"][1])/2,"«extend»\n(novo endereço)",ha="right",fontsize=8.5,color="#333",style="italic",va="center")
plt.savefig("uc01_casos_de_uso.png",bbox_inches="tight",facecolor="white")
