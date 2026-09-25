# Backlog

Este arquivo eh escrito e mantido apenas por IAs para registrar features ja implementadas no projeto.

## Pagina de Selecao de Mapas
- **Componente:** `src/componentes/SelecaoMapas.jsx` (rota `/torneios/:id/mapa`)
- **CSS:** `src/css/selecao-mapas.css` (escopado por `#selecao-mapas`)
- Tela responsiva com grid de mapas usando placeholders `placehold.co`, selecao unica e destaque visual roxo.
- Pesquisa por nome, filtro por categoria, limpeza dos filtros e contagem de resultados implementados com React.
- Painel de detalhes atualizado conforme o mapa selecionado, com categoria, formato, rodadas e descricao.
- Confirmacao do mapa exibida em modal; link para a tela adicionado aos detalhes do torneio.

## Pagina de Criacao de Torneio
- **Componente:** `src/componentes/CriarTorneio.jsx` (rota `/torneios/criar`)
- **CSS:** `src/css/criar-torneio.css` (escopado por `#pagina-criar-torneio`)
- Formulario com campos: nome do torneio, data/hora e valor do premio e regras.
- Campo de data/hora substituiu o `input type="datetime-local"` unico por um input `date` + dois `select` (hora 00-23, minuto em passos de 5) para garantir formato 24h independente do idioma/locale do navegador. Os tres valores sao combinados em `${data}T${hora}:${minuto}` no `handleSubmit`, mantendo o mesmo formato usado antes.
- Regras sao adicionadas em uma lista via `<details>`/dropdown antes do envio; o formulario bloqueia o envio (`setErro`) se a lista de regras estiver vazia.
- **Tabela real (Supabase):** `public.torneios` — colunas `id`, `nome`, `descricao`, `jogo`, `formato`, `data_inicio` (timestamp sem timezone), `status` (boolean, `true` = aberto), `id_criador` (bigint, FK para o usuario logado), `registro` (timestamptz default now(), preenchido pelo banco), `dinheiro` (bigint, sem casas decimais). Nao existe mais a tabela/coluna antiga `tournaments`/`rules`/`prize`/`teams_count`.
- Mapeamento do formulario para a tabela: `nome` <- nome digitado; `descricao` <- lista de regras unida com `\n`; `jogo` e `formato` sao constantes fixas (`'CS2'` e `'Elimina\u00e7\u00e3o Simples'`, ainda sem campo proprio na UI); `data_inicio` <- `${data}T${hora}:${minuto}`; `status` <- sempre `true` na criacao; `id_criador` <- `usuario.id` do `usuarioLogado` no `localStorage`; `dinheiro` <- `Math.round(Number(premio))` (input de premio usa `step="1"`, sem centavos, pois a coluna e bigint).
- A pagina agora exige usuario logado (le `usuarioLogado` do `localStorage`, igual ao padrao do `CriarEquipe.jsx`) e bloqueia o envio com `setErro` se nao houver usuario, pois `id_criador` e obrigatorio.
- O envio nao insere direto no banco: monta o objeto e guarda em `localStorage` (`dadosTorneioEmCriacao`) e navega para `/selecao-mapas`; o insert real acontece em `SelecaoMapas.jsx` apos a escolha do mapa (ver secao "Pagina de Torneios").
- **Conexao com a pagina de Torneios:**
  - Botao "Criar Torneio" adicionado no cabecalho da listagem (`src/componentes/Torneios.jsx`, classe `.tournaments-criar-btn`) linkando para `/torneios/criar`.
  - Link "Criar Torneio" tambem adicionado no `Menu.jsx` (visivel apenas para usuario logado, ao lado do botao de Painel Admin).
  - A rota `/torneios/criar` foi registrada em `App.jsx` **antes** de `/torneios/:id` para nao ser capturada pela rota dinamica de detalhes.
- O navbar proprio pedido em `docs/pagina_criacao_torneio.md` nao foi recriado porque o projeto ja usa um `Menu` global (via `App.jsx`) compartilhado entre todas as paginas, seguindo o padrao ja usado por `Torneios.jsx`, `Regras.jsx`, etc.

## Pagina de Torneios (listagem + detalhes)
- **Componente:** `src/componentes/Torneios.jsx` (rotas `/torneios`, `/torneios/:id`)
- **CSS:** `src/css/torneios.css` e `src/css/bracket.css`
- `loadTournaments()` busca os dados reais da tabela `public.torneios` usando o client compartilhado `src/supabase.js` (`supabase.from('torneios').select('*').order('data_inicio')`).
- Removidos os dados ficticios (`TORNEIOS_FICTICIOS`) usados como fallback; a tela agora reflete somente o banco real, com estados separados de carregamento, erro (`erro`, mensagem amigavel) e lista vazia ("Nenhum torneio disponivel no momento.").
- Campos exibidos seguem a tabela `torneios`: `nome`, `data_inicio`, `dinheiro` (premio), `formato` e `descricao` (dropdown "Ver descricao"). O status (boolean) mapeia para "INSCRICOES ABERTAS" (`true`) ou "ENCERRADO" (`false`).
- O stat "TIMES INSCRITOS" foi removido do card e da tela de detalhes porque a tabela `torneios` nao tem essa coluna; nao ha relacao com uma tabela de inscricoes ainda ligada a esse `id` (bigint). Se for necessario no futuro, criar uma consulta agregada em uma tabela de inscricoes que referencie `torneios.id`.
- Detalhes do torneio (`TournamentDetails`) incluem bracket de chaveamento simulado (times e resultados aleatorios, apenas para demonstracao visual — nao vem do banco).
- **Fluxo completo de criacao (CriarTorneio -> SelecaoMapas):** o `handleFinalizar` em `SelecaoMapas.jsx` insere em `torneios` (`nome`, `descricao` com o mapa escolhido anexado, `jogo`, `formato`, `data_inicio`, `status`, `id_criador`, `dinheiro`) e so navega para `/torneios` se nao houver erro. Em caso de falha no insert, exibe mensagem de erro no modal de confirmacao (`.selecao-mapas-mensagem-erro`) e mantem o usuario na tela para tentar novamente, em vez de navegar silenciosamente. O botao "Continuar" fica desabilitado ("Salvando...") durante o insert para evitar duplo envio.
- **Pendencia conhecida:** `src/componentes/CriarEquipe.jsx` ainda busca torneios abertos na tabela antiga `tournaments` (`status: 'open'`, `tournament_date`) e nao foi migrado para `torneios` nesta tarefa, pois o pedido foi restrito a tela de Torneios/criacao. Precisa de atualizacao futura para `torneios` (`status` boolean, `data_inicio`) e para o vinculo com `tournament_teams`/`torneios.id` (bigint).

## Pagina de Criacao de Equipe
- **Componente:** `src/componentes/CriarEquipe.jsx` (rota `/equipes/criar`)
- **CSS:** `src/css/criar-equipe.css` (escopado por `#pagina-criar-equipe`)
- Formulario responsivo com nome, sigla, descricao, torneio aberto e busca de jogadores por nome ou e-mail.
- Usuario autenticado pelo `localStorage` `usuarioLogado` entra automaticamente como capitao; usuarios nao autenticados sao direcionados para `/login`.
- Torneios abertos sao buscados na tabela `tournaments`; jogadores sao buscados na tabela `usuarios`.
- No envio, insere a equipe em `teams`, seus membros em `team_members` e a inscricao em `tournament_teams` usando `src/supabase.js`.
- Possui validacao de campos obrigatorios, sigla, quantidade minima de jogadores, duplicidade de jogadores e estados de carregamento, erro e sucesso.

<<<<<<< Updated upstream
## Lista de Amigos
- **Componente:** `src/componentes/ListaAmigos.jsx`
- **CSS:** `src/css/lista-amigos.css` (escopado por `#widget-amigos`)
- Um painel (widget) flutuante fixado no canto inferior direito, disponível em todas as rotas da aplicação através do `App.jsx`.
- Inclui um botão toggle que exibe a quantidade de amigos online.
- Funcionalidade com dados mockados (não conectada ao banco de dados por enquanto), exibindo jogadores online/offline, status de jogo e placeholder para convite.
- Interface escura com tema roxo (#723EC3) em destaque, utilizando animações CSS simples e placeholders visuais do `placehold.co` para avatares, de acordo com as restrições do projeto.
=======
## Documentacao da Pagina de Suporte
- Criado `docs/pagina_suporte.md` com o contexto e os requisitos propostos para um formulario de contato do suporte de CS2, incluindo campos, validacao, estados da interface e integracao futura com Supabase.

## Pagina de Suporte
- **Componente:** `src/componentes/Suporte.jsx` (rota `/suporte`)
- **CSS:** `src/css/suporte.css` (escopado por `#pagina-suporte`)
- Formulario responsivo com campos de contato, categoria, assunto, descricao, torneio, partida e link de evidencia; nome e e-mail sao preenchidos a partir de `localStorage` quando existe usuario autenticado.
- Validacao nativa de obrigatoriedade, e-mail e URL. O envio monta uma mensagem para `suporte@csgotournaments.com` e abre o aplicativo de e-mail configurado; a pessoa precisa concluir o envio por esse aplicativo.
- Adicionado acesso pelo ultimo botao da categoria Suporte na FAQ e pelo rodape global.
- O formulario ainda nao persiste chamados no Supabase nem aceita upload de arquivos; schema, permissoes e armazenamento continuam pendentes conforme `docs/pagina_suporte.md`.
>>>>>>> Stashed changes
