# Backlog e Histórico de Funcionalidades

## [2026-09-23] Unificação do Cabeçalho e Rodapé (Menu Global)
- **Componente:** `Menu.jsx` em `src/componentes/Menu.jsx`
- **Estilos:** `menu.css` em `src/componentes/menu.css`
- **Descrição:** Cabeçalho e rodapé unificados em um componente exclusivo `<Menu />` que envolve as rotas no `App.jsx`, fornecendo navegação dinâmica (com rotas ativas) e layout global padronizado em todas as telas da aplicação.

## [2026-09-23] Renderização Condicional de Autenticação no Cabeçalho
- **Componente:** `Menu.jsx` em `src/componentes/Menu.jsx`
- **Estilos:** `menu.css` em `src/componentes/menu.css`
- **Descrição:** Adicionada verificação reativa do `localStorage` (`usuarioLogado`) via `useState` e `useEffect`. Se o usuário estiver autenticado, exibe as informações/avatar do usuário, atalho para o painel de administração (se for admin) e botão de Logout que limpa a sessão; caso contrário, exibe os botões habituais de "Entrar" e "Cadastrar".
