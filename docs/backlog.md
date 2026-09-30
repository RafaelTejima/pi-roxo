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
- Formulario com campos: nome do torneio, data/hora, formato da partida, valor do premio e regras.
- Campo de data/hora substituiu o `input type="datetime-local"` unico por um input `date` + dois `select` (hora 00-23, minuto em passos de 5) para garantir formato 24h independente do idioma/locale do navegador. Os tres valores sao combinados em `${data}T${hora}:${minuto}` no `handleSubmit`, mantendo o mesmo formato usado antes.
- Campo "Formato da partida" e um `select` com as opcoes `BO1`, `BO3`, `BO5` (constante `FORMATOS` em `CriarTorneio.jsx`); obrigatorio para enviar o formulario, substitui a constante fixa `FORMATO_PADRAO` usada antes.
- Regras sao adicionadas em uma lista via `<details>`/dropdown antes do envio; o formulario bloqueia o envio (`setErro`) se a lista de regras estiver vazia.
- **Tabela real (Supabase):** `public.torneios` — colunas `id`, `nome`, `descricao`, `formato`, `data_inicio` (timestamp sem timezone), `status` (boolean, `true` = aberto), `id_criador` (bigint, FK para o usuario logado), `registro` (timestamptz default now(), preenchido pelo banco), `dinheiro` (bigint, sem casas decimais). Nao existe mais a tabela/coluna antiga `tournaments`/`rules`/`prize`/`teams_count`. A coluna `jogo` foi removida do insert (e nao precisa existir no banco) pois a plataforma e exclusiva para CS2.
- Mapeamento do formulario para a tabela: `nome` <- nome digitado; `descricao` <- lista de regras unida com `\n`; `formato` <- valor escolhido no select (`Melhor de 1`/`Melhor de 3`/`Melhor de 5`); `data_inicio` <- `${data}T${hora}:${minuto}`; `status` <- sempre `true` na criacao; `id_criador` <- `usuario.id` do `usuarioLogado` no `localStorage`; `dinheiro` <- `Math.round(Number(premio))` (input de premio usa `step="1"`, sem centavos, pois a coluna e bigint).
- A pagina agora exige usuario logado (le `usuarioLogado` do `localStorage`, igual ao padrao do `CriarEquipe.jsx`) e bloqueia o envio com `setErro` se nao houver usuario, pois `id_criador` e obrigatorio.
- O envio nao insere direto no banco: monta o objeto e guarda em `localStorage` (`dadosTorneioEmCriacao`) e navega para `/selecao-mapas`; o insert real acontece em `SelecaoMapas.jsx` apos a escolha do mapa (ver secao "Pagina de Torneios").
- **Conexao com a pagina de Torneios:**
  - Botao "Criar Torneio" adicionado no cabecalho da listagem (`src/componentes/Torneios.jsx`, classe `.tournaments-criar-btn`) linkando para `/torneios/criar`.
  - Link "Criar Torneio" tambem adicionado no `Menu.jsx` (visivel apenas para usuario logado, ao lado do botao de Painel Admin).
  - A rota `/torneios/criar` foi registrada em `App.jsx` **antes** de `/torneios/:id` para nao ser capturada pela rota dinamica de detalhes.
- O navbar proprio pedido em `docs/pagina_criacao_torneio.md` nao foi recriado porque o projeto ja usa um `Menu` global (via `App.jsx`) compartilhado entre todas as paginas, seguindo o padrao ja usado por `Torneios.jsx`, `Regras.jsx`, etc.

## Pagina de Torneios (listagem + detalhes)
- **Componente (listagem):** `src/componentes/Torneios.jsx` (rota `/torneios`)
- **Componente (detalhes):** `src/componentes/DetalhesTorneio.jsx` (rota `/torneios/:id`) — antes vivia dentro de `Torneios.jsx` como `TournamentDetails` (reaproveitando o `Torneios` via checagem de `useParams`); foi extraido para um arquivo proprio, seguindo o mesmo padrao de `DetalhesTime.jsx` (busca o proprio torneio no Supabase por `id` via `useEffect`, em vez de depender da lista carregada pela pagina pai).
- **CSS:** `src/css/torneios.css` (compartilhado pelos dois componentes)
- `loadTournaments()` busca os dados diretamente da tabela `public.torneios` usando o client compartilhado `src/supabase.js`; nao combina registros locais ou de demonstracao.
- Removidos os dados ficticios (`TORNEIOS_FICTICIOS`) usados como fallback; a tela agora reflete somente o banco real, com estados separados de carregamento, erro (`erro`, mensagem amigavel) e lista vazia ("Nenhum torneio disponivel no momento.").
- Campos exibidos seguem a tabela `torneios`: `nome`, `data_inicio`, `dinheiro` (premio), `formato` e `descricao` (dropdown "Ver descricao"). O status (boolean) mapeia para "INSCRICOES ABERTAS" (`true`) ou "ENCERRADO" (`false`). Coluna `jogo` removida (plataforma e exclusiva para CS2; o card/detalhes mostram `"CS2"` fixo).
- O stat "TIMES INSCRITOS" foi removido do card e da tela de detalhes porque a tabela `torneios` nao tem essa coluna; nao ha relacao com uma tabela de inscricoes ainda ligada a esse `id` (bigint). Se for necessario no futuro, criar uma consulta agregada em uma tabela de inscricoes que referencie `torneios.id`.
- O bracket de demonstracao foi removido. `DetalhesTorneio` informa que partidas ainda nao estao disponiveis, sem criar equipes ou resultados; `src/css/bracket.css` foi removido.
- Descricao do torneio usa `white-space: pre-line` (em `.tournament-rules p` e `.details-rules p`) para preservar quebras de linha das regras, igual ao padrao ja usado em `.detalhes-time-secao p` na tela de time.
- **Fluxo completo de criacao (CriarTorneio -> SelecaoMapas):** o `handleFinalizar` em `SelecaoMapas.jsx` insere em `torneios` (`nome`, `descricao` com o mapa escolhido anexado, `formato`, `data_inicio`, `status`, `id_criador`, `dinheiro`) e so navega para `/torneios` se nao houver erro. Em caso de falha no insert, exibe mensagem de erro no modal de confirmacao (`.selecao-mapas-mensagem-erro`) e mantem o usuario na tela para tentar novamente, em vez de navegar silenciosamente. O botao "Continuar" fica desabilitado ("Salvando...") durante o insert para evitar duplo envio.
- **Botao de inscricao (`DetalhesTorneio.jsx`):** adicionado botao "Inscrever-se" na secao `.details-inscricao`. Regras de elegibilidade: usuario precisa estar logado (`localStorage.usuarioLogado`) e ser capitao (`times.id_capitao === usuario.id`) de um time cuja line-up em `times_integrantes` tenha exatamente 5 linhas (capitao + 4 jogadores, mesma regra de `DetalhesTime.jsx`). Se o usuario capitanear varios times, usa o primeiro time completo encontrado. Botao fica desabilitado e mostra mensagem explicativa quando: torneio com `status = false` (inscricoes encerradas), usuario nao logado, usuario logado mas sem time completo, time ja inscrito neste torneio, ou time inscrito em outro torneio ainda em andamento.
- **Regra "um torneio ativo por vez":** ao carregar a elegibilidade, busca todas as `inscricoes` do time (`eq('id_time', ...)`, sem filtrar por torneio) com embed `torneio:id_torneio(id, nome, status)`. Se existir uma inscricao em outro torneio (`id_torneio` diferente do `id` da rota) cujo `torneio.status` seja `true` (inscricoes/torneio ainda aberto/em andamento), o botao fica bloqueado e mostra a mensagem `Seu time ja esta inscrito no torneio "X". Aguarde ele terminar para se inscrever em outro.` (estado `torneioConflito`). Um time so pode se inscrever em um novo torneio depois que o torneio anterior for marcado como encerrado (`status = false`) pelo admin.
- Usa a tabela real `public.inscricoes` (ja existente e usada em `AdminPanel.jsx`) com as colunas `id_torneio` (bigint, referencia logica a `torneios.id`), `id_time` (bigint, referencia logica a `times.id`) e `id_usuario_inscritor` (bigint, referencia logica a `usuarios.id`). O insert do botao de inscricao usa somente essas tres colunas. Antes de inserir, verifica se ja existe uma linha com o mesmo `id_torneio` + `id_time` para nao duplicar a inscricao (`jaInscrito`).
- Nao ha ainda tela de listagem de times inscritos por torneio nem cancelamento de inscricao; fica como pendencia futura.
- **Fase de Grupos (`DetalhesTorneio.jsx`):** a secao que antes mostrava "Chaveamento" (placeholder) agora exibe "Fase de Grupos" com a lista de times inscritos no torneio (`carregarTimesGrupo`, busca `inscricoes` filtrado por `id_torneio` com embed `time:id_time(id, nome, tag)`). Assim que uma inscricao e concluida com sucesso, `carregarTimesGrupo()` e chamado novamente para o time aparecer na lista sem precisar recarregar a pagina. Por enquanto todos os times inscritos aparecem em um unico "Grupo A" (`.details-grupo`); nao ha divisao automatica em multiplos grupos, gerador de confrontos/partidas ou tabela de classificacao — fica como pendencia futura (ver `docs/bracket.md` para a especificacao completa de chaveamento ainda nao implementada).

## Pagina de Criacao de Equipe
- **Componente:** `src/componentes/CriarEquipe.jsx` (rota `/equipes/criar`)
- **CSS:** `src/css/criar-equipe.css` (escopado por `#pagina-criar-equipe`)
- Formulario responsivo com nome, sigla, descricao e busca de jogadores por nome ou e-mail.
- Usuario autenticado pelo `localStorage` `usuarioLogado` entra automaticamente como capitao; usuarios nao autenticados sao direcionados para `/login`.
- **Atualizado:** nao busca mais torneios (a selecao de torneio na criacao de equipe foi removida/nunca foi finalizada); ver secao "Integracao da Criacao de Equipe com o banco (tabela `times`)" para o fluxo real e atual de persistencia.
- **Regra "um time por usuario":** ao montar a pagina, consulta `times_integrantes` filtrando `id_usuario === usuario.id`; se encontrar qualquer linha (usuario ja e capitao ou jogador de algum time), bloqueia a criacao e exibe uma tela informando que o usuario ja faz parte de uma equipe (com link para `/equipes`), alem de um alerta com atalho para `/equipes/:id` do time atual. Antes de inserir no banco, `enviarEquipe` refaz essa mesma checagem (evita corrida caso o usuario entre em outro time enquanto preenchia o formulario).
- A busca de jogadores para adicionar na nova equipe (`buscaJogador`) tambem exclui quem ja pertence a qualquer time: apos filtrar por nome/usuario/e-mail, consulta `times_integrantes` com `.in('id_usuario', ids)` e remove da lista de resultados quem ja tiver vinculo. O mesmo filtro foi aplicado em `DetalhesTime.jsx` (secao "Adicionar/Remover jogadores"), incluindo uma revalidacao no banco dentro de `adicionarJogador` antes do insert, para impedir que um jogador seja colocado em dois times.

## Lista de Amigos
- **Componente:** `src/componentes/ListaAmigos.jsx`
- **CSS:** `src/css/lista-amigos.css` (escopado por `#widget-amigos`)
- Um painel (widget) flutuante fixado no canto inferior direito, disponível em todas as rotas da aplicação através do `App.jsx`.
- Inclui um botão toggle que exibe a quantidade de amigos online.
- A lista consulta amizades e usuarios no Supabase; a contagem online usa somente o status informado pelo banco. Status de jogo e dados de demonstracao nao sao exibidos.
- Interface escura com tema roxo (#723EC3) em destaque, utilizando animações CSS simples e placeholders visuais do `placehold.co` para avatares, de acordo com as restrições do projeto.

## Documentacao da Pagina de Suporte
- Criado `docs/pagina_suporte.md` com o contexto e os requisitos propostos para um formulario de contato do suporte de CS2, incluindo campos, validacao, estados da interface e integracao futura com Supabase.

## Pagina de Suporte
- **Componente:** `src/componentes/Suporte.jsx` (rota `/suporte`)
- **CSS:** `src/css/suporte.css` (escopado por `#pagina-suporte`)
- Formulario responsivo com campos de contato, categoria, assunto, descricao, torneio, partida e link de evidencia; nome e e-mail sao preenchidos a partir de `localStorage` quando existe usuario autenticado.
- Validacao nativa de obrigatoriedade, e-mail e URL. O envio monta uma mensagem para `suporte@csgotournaments.com` e abre o aplicativo de e-mail configurado; a pessoa precisa concluir o envio por esse aplicativo.
- Adicionado o formulario ao final da FAQ, com atalho de navegacao na categoria Suporte; a rota `/suporte` e o link do rodape continuam disponiveis.
- O formulario ainda nao persiste chamados no Supabase nem aceita upload de arquivos; schema, permissoes e armazenamento continuam pendentes conforme `docs/pagina_suporte.md`.
## Pagina de Perfil do Usuario
- **Componente:** `src/componentes/Perfil.jsx` (rota `/perfil`)
- **CSS:** `src/css/perfil.css` (escopado por `#perfil-page`)
- **Atualizacao:** A pagina de perfil foi completamente refeita para exibir apenas as informacoes que o usuario registrou no banco de dados, removendo visualizacoes estaticas.
- **Edicao de Perfil:** Adicionada opcao para o usuario editar seu perfil (foto/imagem via URL, biografia, nome de usuario). Esses dados sao salvos diretamente no Supabase (`tabela usuarios`).
- **Conexoes:** Discord, Steam e Twitter sao editados no perfil e salvos na tabela `usuarios`. Os controles de privacidade que eram persistidos somente no `localStorage` foram removidos enquanto nao houver suporte no schema.

## Integracao da Criacao de Equipe com o banco (tabela `times`)
- **Componentes:** `src/componentes/CriarEquipe.jsx` (rota `/equipes/criar`) e `src/componentes/Equipes.jsx` (rota `/equipes`)
- **Tabela real (Supabase):** `public.times` — colunas `id` (bigint identity), `nome`, `tag` (varchar 5), `logo`, `descricao`, `id_capitao` (bigint, sem FK declarada no schema, referencia logica a `usuarios.id`), `registro` (timestamptz default now()). Substitui completamente as tabelas antigas `teams`/`team_members` usadas anteriormente.
- **Nova tabela `times_integrantes`** (criada nesta tarefa para guardar a line-up, ja que `times` so tem `id_capitao`): `id` (bigint identity), `id_time` (bigint, FK -> `times.id`), `id_usuario` (bigint, FK -> `usuarios.id`), `funcao` (varchar, `'capitao'` ou `'jogador'`), `registro` (timestamptz default now()).
- `CriarEquipe.jsx`: o envio insere primeiro em `times` (`nome`, `tag`, `logo` com placeholder `placehold.co`, `descricao`, `id_capitao` <- `usuario.id` do `usuarioLogado`), depois insere em `times_integrantes` uma linha para o capitao e uma para cada jogador adicionado na busca. Se qualquer insert falhar, exibe erro (`setErro`) e nao navega.
- A busca de jogadores (`buscaJogador`) agora consulta somente a tabela real `usuarios` (`select('id, nome, nome_usuario, email')` com `.or(ilike)` em `nome`, `nome_usuario` e `email`); os `MOCK_JOGADORES` locais e o fallback que criava um "convidado" fake (com id nao numerico) foram removidos, pois `times_integrantes.id_usuario` e bigint com FK para `usuarios.id` e nao aceitaria ids inventados.
- `equipesCadastradas` no `localStorage` foi removido; `Equipes.jsx` agora busca a listagem direto do Supabase: `times` ordenado por `registro` desc, depois busca em paralelo os nomes dos capitaes (`usuarios` filtrado por `id_capitao` via `.in`) e a contagem de integrantes (`times_integrantes` filtrado por `id_time` via `.in`), montando `capitaoNome` e `totalIntegrantes` em memoria (sem embed do PostgREST, pois nao ha FK declarada em `times.id_capitao`). Estados de carregamento e erro adicionados na tela.

## Pagina de Detalhes do Time
- **Documentacao:** `docs/detalhes_time.md`
- **Componente:** `src/componentes/DetalhesTime.jsx` (rota `/equipes/:id`, registrada em `App.jsx` apos `/equipes/criar` para nao ser capturada por engano)
- **CSS:** `src/css/detalhes-time.css` (escopado por `#pagina-detalhes-time`)
- Cada card em `Equipes.jsx` virou um `Link` para `/equipes/:id` (a `div` do card foi trocada por `Link`; CSS de `.equipe-card` ajustado para `display: block` e `text-decoration: none`).
- `DetalhesTime.jsx` busca o time em `times` pelo `id` da rota (`.eq('id', id).single()`), depois busca a line-up em `times_integrantes` (`id_time` igual ao `id` da rota) e os nomes correspondentes em `usuarios` (`.in('id', idsUsuarios)`), sem usar embed do PostgREST (mesma limitacao de `Equipes.jsx`, pois nao ha FK declarada).
- Exibe cabecalho (logo/placeholder, nome, tag, data de registro formatada em pt-BR), descricao (quando existir) e a line-up separada em capitao (`funcao = 'capitao'`) e jogadores (`funcao = 'jogador'`), com contagem `X/5` e aviso quando so houver o capitao.
- Estados tratados: carregando, time nao encontrado/erro (com link de volta para `/equipes`) e sucesso.
- Se o usuario logado (`localStorage.usuarioLogado`) for o capitao (`usuario.id === time.id_capitao`), aparece um botao "Editar time" — **apenas visual por enquanto**, sem funcionalidade de edicao implementada ainda (fica como pendencia futura, conforme `docs/detalhes_time.md`).
- **Atualizado:** o botao "Editar time" agora e funcional. Fica visivel para o capitao (`usuario.id === time.id_capitao`) ou para um usuario admin (`usuario.admin`, coluna boolean da tabela `usuarios` ja usada em `Cadastrar.jsx`). Ao clicar, abre um formulario inline (nome, sigla, logo/URL, descricao) que executa `supabase.from('times').update(...).eq('id', id)` e atualiza o estado local com o retorno do update. Possui validacao (nome e sigla obrigatorios, sigla minimo 2 caracteres), estado de salvando e mensagem de erro sem fechar o formulario em caso de falha.
- **Atualizado:** adicionado o botao "Adicionar/Remover jogadores" na secao de Line-up, visivel apenas para quem `podeEditar` (mesmo capitao/admin do botao de editar time). Ao ativar, mostra um campo de busca (mesma logica de autocomplete usada em `CriarEquipe.jsx`, consultando `usuarios` por `nome`/`nome_usuario`/`email`, excluindo quem ja esta no time) para inserir novas linhas em `times_integrantes` (`funcao: 'jogador'`), respeitando o limite de 5 integrantes. Cada jogador (exceto o capitao) ganha um botao "Remover" que executa `delete` na linha correspondente de `times_integrantes`. Erros de insercao/remocao aparecem como mensagem na propria secao, sem recarregar a pagina.


=======
=======
- **Conexoes:** Discord, Steam, Twitter, YouTube, Twitch e Bluesky usam as colunas existentes da tabela `usuarios`. Opcoes de fundo e privacidade nao estao disponiveis no perfil atual.
>>>>>>> Stashed changes
>>>>>>> Stashed changes

## Remocao de dados simulados
- Removidos times e jogadores de demonstracao, convidados com IDs inventados e fallbacks de listagem/detalhes de equipe em `localStorage`; equipes e integrantes exibidos agora dependem dos registros do Supabase.
- Removido o bracket com times e placares aleatorios. Detalhes de torneio informam quando os dados de partidas ainda nao estao disponiveis; o CSS exclusivo do bracket demonstrativo foi removido.
- Torneios sao lidos somente do Supabase e a publicacao grava os campos preenchidos no banco, incluindo descricao/regras e mapa escolhido; foram removidos valores presumidos e o fallback de mapa Mirage.
- A lista de amigos e os perfis nao presumem status online/offline ou jogo atual. Perfis inexistentes exibem estado de nao encontrado.
- Removidos contadores, promessas promocionais, estatisticas zeradas e configuracoes de privacidade que eram salvas apenas no navegador, sem persistencia no schema.
- Mantidos placeholders de formularios e o catalogo estatico de mapas, pois sao elementos de entrada/representacao visual e nao registros de usuarios, equipes ou torneios.

## Correcao: Logout nao redirecionava (usuario continuava acessando perfil/admin/criacao)
- **Bug:** o botao "Sair" do dropdown do menu (`handleLogout` em `src/componentes/Menu.jsx`) apenas limpava o `localStorage`/estado do usuario, mas nao navegava para nenhuma rota. Como as paginas restritas (`Perfil.jsx`, `AdminPanel.jsx`, `CriarEquipe.jsx`, `CriarTorneio.jsx`) so checam `usuarioLogado` no `localStorage` uma unica vez ao montar (em `useState`/`useEffect` de montagem), o componente continuava montado com os dados ja carregados em memoria e a pessoa seguia vendo/usando a tela como se ainda estivesse logada, incluindo o Painel Admin.
- **Correcao:** `handleLogout` agora chama `navigate('/', { replace: true })` (via `useNavigate` do `react-router-dom`) logo apos limpar o `localStorage` e os estados locais, forcando o desmonte das paginas restritas e o retorno para a Home.
- O botao "Sair da conta" dentro do proprio `Perfil.jsx` (`sair()`) ja fazia `navigate('/')` corretamente e nao precisou de alteracao.
- Nao foi criado um sistema central de rotas protegidas (`ProtectedRoute`) porque cada pagina restrita ja possui sua propria checagem de `usuarioLogado` ao montar e redireciona corretamente quando acessada diretamente sem sessao; o problema era exclusivamente a falta de navegacao apos o logout.

## Painel Social estilo Valorant (Menu do Usuario)
- **Componente:** `src/componentes/Menu.jsx` (componente global, renderizado em todas as rotas via App.jsx)
- **CSS:** `src/componentes/menu.css` (classes prefixadas com `social-`)
- O antigo dropdown de usuario foi completamente substituido por um painel lateral fixo inspirado no menu Social do Valorant.
- **Trigger na navbar:** pilula com avatar circular com moldura roxa gradiente, nome do usuario e seta indicadora. O painel abre/fecha via onMouseEnter/onMouseLeave com delay de 220ms.
- **Painel:** fixo na lateral direita, comecando abaixo da navbar (top: 80px). Anima com translateX(100%) para translateX(0). Nao sobrepoe a navbar (z-index 999).
- **Estrutura do painel:** Header SOCIAL > Perfil do usuario > Time afiliado > Lista de amigos > Rodape com botoes.
- **Perfil:** avatar grande com moldura roxa animada (pulsarMoldura keyframe), nome e label Meu Perfil. Navega para /perfil.
- **Time afiliado:** busca via times_integrantes + times no Supabase. Exibe logo/iniciais com moldura roxa, nome, tag e funcao. Se sem equipe, exibe link Criar time.
- **Lista de amigos:** carregamento consolidado (amizades ACEITO + validacao cruzada em usuarios). Campo de busca por nome. Lista scrollavel. Avatares com moldura roxa, nome, time e status online/offline.
- **Acoes no hover do amigo:** botoes Remover (vermelho) e Bloquear (amarelo) com animacao de entrada.
- **Rodape do painel:** botoes Config (engrenagem, /perfil), Admin (escudo, /admin, apenas para admin=true) e Sair (logout).
- **Molduras roxas:** todos os avatares usam ::before com gradient roxo (inset: -2px) para borda gradiente.
- **CSS obsoleto removido:** dropdown-usuario, item-dropdown, dropdown-amigo-*, btn-acao-amigo, botao-admin, botao-logout, usuario-nome, botao-perfil-trigger.
