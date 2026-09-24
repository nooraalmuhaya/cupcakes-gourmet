# Situação do Git e do GitHub – Situação 2

Informações conferidas em 24/09/2026, depois do envio (push) para o GitHub.

| Item | Situação |
|------|----------|
| Nome do repositório | `cupcakes-gourmet` |
| Repositório no GitHub | https://github.com/nooraalmuhaya/cupcakes-gourmet |
| Branch de desenvolvimento | `claude/situacao-2-cupcakes-app-p46qpy` |
| Remoto configurado | `origin` → `https://github.com/nooraalmuhaya/cupcakes-gourmet` |
| Envio (push) | **Feito com sucesso.** Conferido pela API do GitHub: o branch existe no remoto e a raiz mostra `.env.example`, `.gitignore`, `DEVELOPMENT_NOTES.md`, `README.md`, `backend/`, `database/`, `docs/`, `frontend/`, `tests/` |
| Último commit antes deste documento | `06330af` – docs: add architecture, traceability and changelog documents |
| Branch `main` | **Não existe ainda.** O repositório estava vazio e o único branch no GitHub é o de desenvolvimento |
| Arquivos versionados | 267 |
| `.env` no repositório | Não (só `.env.example`, sem senhas reais) |
| Ambiente virtual, `__pycache__`, `.pyc` | Não versionados (`.gitignore`) |
| Senhas no repositório | Nenhuma em texto puro. O `02_dados_iniciais.sql` tem só **hashes bcrypt** das contas de teste; as senhas dessas contas de teste estão documentadas no README de propósito |

## Commits (em ordem)

| Commit | Tipo | Descrição |
|--------|------|-----------|
| `054083e` | chore | Estrutura inicial, documentação da Situação 1 preservada, script SQL |
| `d81f653` | feat | Conexão com o MySQL e modelos das 10 tabelas |
| `428400c` | feat | Autenticação (cadastro, login, logout, perfil) |
| `ebf334b` | feat | Cardápio, detalhes, busca, filtros e dados iniciais |
| `a33b2b3` | feat | Carrinho e cupom |
| `3aca43e` | feat | Endereços |
| `0420dd9` | feat | Checkout, pagamento simulado, pedidos, acompanhamento, notificações e avaliação |
| `aeebda3` | feat | Administração de produtos e pedidos |
| `85e0263` | test | Testes automatizados do back-end (pytest + MySQL) |
| `2181c22` | feat | Front-end responsivo (HTML, CSS, JavaScript) |
| `a0e1dff` | test | Testes funcionais dos 6 fluxos no navegador + capturas de tela |
| `18604fe` | docs | README e manual do usuário |
| `06330af` | docs | Arquitetura, rastreabilidade e registro de mudanças |
| (seguinte) | docs | Este arquivo e `STATUS_SITUACAO_2.md` |

Total: 14 commits com mensagens no padrão `tipo: descrição` (feat, test, docs, chore).

## O que a aluna precisa fazer

1. **Criar o branch principal (`main`) a partir do branch de desenvolvimento.** Opções:
   - No GitHub: abrir um *Pull Request* do branch `claude/situacao-2-cupcakes-app-p46qpy`
     (depois de criar o `main`), revisar e fazer o *merge*; ou
   - Na linha de comando (no computador dela):
     ```bash
     git clone https://github.com/nooraalmuhaya/cupcakes-gourmet.git
     cd cupcakes-gourmet
     git checkout claude/situacao-2-cupcakes-app-p46qpy
     git checkout -b main
     git push -u origin main
     ```
   - Em seguida, em *Settings → General → Default branch*, escolher `main`.
2. Conferir se o repositório está **público** (ou se os tutores têm acesso), para a
   correção. A visibilidade não foi verificada neste ambiente.
3. Se quiser, apagar o branch de desenvolvimento depois do merge.
