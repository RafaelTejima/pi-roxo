# Backlog e Histórico de Funcionalidades

## [2026-09-23] Unificação do Cabeçalho e Rodapé (Menu Global)
- **Componente:** `Menu.jsx` em `src/componentes/Menu.jsx`
- **Estilos:** `menu.css` em `src/componentes/menu.css`
- **Descrição:** Cabeçalho e rodapé unificados em um componente exclusivo `<Menu />` que envolve as rotas no `App.jsx`, fornecendo navegação dinâmica (com rotas ativas) e layout global padronizado em todas as telas da aplicação.

## [2026-09-23] Renderização Condicional de Autenticação no Cabeçalho
- **Componente:** `Menu.jsx` em `src/componentes/Menu.jsx`
- **Estilos:** `menu.css` em `src/componentes/menu.css`
- **Descrição:** Adicionada verificação reativa do `localStorage` (`usuarioLogado`) via `useState` e `useEffect`. Se o usuário estiver autenticado, exibe as informações/avatar do usuário, atalho para o painel de administração (se for admin) e botão de Logout que limpa a sessão; caso contrário, exibe os botões habituais de "Entrar" e "Cadastrar".

## [2026-09-23] Sistema de Bracket de Torneios CS2
- **Arquivo principal:** `Torneios.jsx` em `src/componentes/Torneios.jsx`
- **Estilos:** `bracket.css` em `src/css/bracket.css`
- **Descrição:** Implementado sistema de chaveamento (Single Elimination, 8 equipes) exibido na tela de detalhes do torneio (`/torneios/:id`). Os dados são 100% simulados em estado React (sem banco de dados), usando os times FURIA, MIBR, Imperial, paIN, RED Canids, Bestia, Fluxo e ODDIK com cruzamento oficial por seeding (1x8, 4x5, 2x7, 3x6). Funcionalidades implementadas:
  - **Resolução Manual:** clicar no nome de um time o declara vencedor da partida.
  - **Botão "Resolver":** resolve uma partida individual com placar aleatório válido CS2 MR12 (vencedor: 13, perdedor: 0–11).
  - **Botão "Processar Torneio":** resolve em cascata todas as partidas pendentes até coroar o campeão.
  - **Botão "Reiniciar Bracket":** reseta o estado para o chaveamento inicial.
  - Progressão automática: vencedor avança com `floor(posicao/2)` para o slot correto (Time 1 ou Time 2) da próxima rodada.
  - Animação de destaque ao resolver partidas e painel do campeão ao final.
  - Conectores SVG entre fases (Quartas → Semis → Final).
