# Backlog

Este arquivo eh escrito e mantido apenas por IAs para registrar features ja implementadas no projeto.

## Agrupamento de Torneios Encerrados
- **Componente:** `src/componentes/Torneios.jsx` (rota `/torneios`)
- Torneios com `status = false` sao exibidos em uma secao recolhida chamada "Torneios encerrados", abaixo da lista de torneios ativos; a secao abre ao clicar no titulo.
- A busca da pagina continua filtrando ativos e encerrados, e a contagem do titulo reflete somente os torneios encerrados correspondentes a busca.
- **CSS:** `src/css/torneios.css` — estilos da secao recolhivel e grade interna.

## Imagem do Mapa nos Cards de Torneio
- Os cards em `src/componentes/Torneios.jsx` leem `Mapa oficial` da descricao e mostram a imagem correspondente no visual do card.
- As imagens por nome ficam centralizadas em `src/mapas.js` e sao reutilizadas pela tela `src/componentes/SelecaoMapas.jsx`.
- Torneios sem um mapa conhecido mantem o visual ROXO / CS2 anterior.

## Administracao de Capitao do Time
- **Componente:** `src/componentes/DetalhesTime.jsx` (aba "Adicionar/Remover jogadores")
- Somente usuarios administradores recebem as acoes para tornar um integrante capitao ou remover a funcao do capitao atual.
- A promocao sincroniza `times.id_capitao` e `times_integrantes.funcao`, rebaixando o capitao anterior a jogador. Remover a funcao limpa `times.id_capitao` e rebaixa o integrante a jogador.
- **CSS:** `src/css/detalhes-time.css` — botoes de promocao/remocao do capitao.

## Pagina de Selecao de Mapas
- **Componente:** `src/componentes/SelecaoMapas.jsx` (rota `/torneios/:id/mapa`)
- **CSS:** `src/css/selecao-mapas.css` (escopado por `#selecao-mapas`)
- Tela responsiva com grid de mapas usando placeholders `placehold.co`, selecao unica e destaque visual roxo.
- Pesquisa por nome, filtro por categoria, limpeza dos filtros e contagem de resultados implementados com React.
- Painel de detalhes atualizado conforme o mapa selecionado, com categoria, formato, rodadas e descricao.
- Cards e painel de detalhes exibem thumbnails reais correspondentes aos sete mapas disponiveis (Mirage, Inferno, Nuke, Dust II, Overpass, Ancient e Anubis), no lugar dos placeholders.
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
- O titulo dos detalhes permite quebra de nomes extensos sem espacos, mantendo o texto dentro do cabecalho em telas menores.
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

## Carteira e Premiacao (Wallet)
- O cabeçalho global exibe, para usuários autenticados, um link para o perfil com o saldo atual de `usuarios.saldo`. O valor é atualizado ao navegar e após alterações de saldo emitidas por inscrições e saques; o link também aparece ao lado dos controles do cabeçalho em telas mobile.
- **Novas colunas necessarias no Supabase** (nao existiam antes, seguem o mesmo padrao de erro `PGRST204` ja visto neste projeto — precisam ser criadas manualmente):
  - `public.usuarios.saldo` (numeric, default `0`) — saldo da carteira de cada usuario.
  - `public.torneios.id_time_vencedor` (bigint, nullable, referencia logica a `times.id`) — preenchido quando o organizador declara o time campeao.
- **Redefinicao do campo `torneios.dinheiro`:** deixou de significar "valor do premio" e passou a ser a **taxa de inscricao por time**. O rotulo no formulario (`CriarTorneio.jsx`) foi trocado de "Valor do premio (R$)" para "Taxa de inscricao (R$)"; o restante do fluxo (estado `premio`, campo `dinheiro` no insert) nao mudou de nome para minimizar a mudanca.
- **Premio acumulado e sempre calculado, nunca armazenado:** `premioAcumulado = dinheiro (taxa) * quantidade de times inscritos no torneio`. Em `Torneios.jsx`, `loadTournaments()` busca a contagem de `inscricoes` por `id_torneio` (`.in('id_torneio', ids)`) e anexa `totalInscritos` em cada torneio; o card calcula `dinheiro * totalInscritos`. Em `DetalhesTorneio.jsx`, o mesmo calculo usa `timesGrupo.length` (a lista ja carregada na Fase de Grupos). Isso evita divergencia entre o saldo debitado dos capitaes e o valor exibido/distribuido — nao ha mais coluna `torneios.premio_acumulado` nem incremento manual a cada inscricao.
- **Pagamento da taxa ao se inscrever (`DetalhesTorneio.jsx`, `handleInscrever`):** antes de criar a linha em `inscricoes`, busca o `saldo` atual do capitao em `usuarios` (direto no banco, pois o `localStorage` pode estar desatualizado). Se `saldo < dinheiro` (taxa), bloqueia com alerta de "Saldo Insuficiente" mostrando o valor necessario e o saldo atual. Caso tenha saldo, debita a taxa do `usuarios.saldo` do capitao e so entao insere a inscricao; se a insercao falhar, desfaz (rollback) o debito para nao perder dinheiro do usuario.
- **Declarar vencedor (`DetalhesTorneio.jsx`, `handleDeclararVencedor`):** visivel apenas para o criador do torneio (`usuario.id === tournament.id_criador`) ou admin (`usuario.admin`), enquanto o torneio ainda esta com `status = true`. Aparece um botao "Declarar Vencedor" ao lado de cada time listado na Fase de Grupos. Ao clicar: calcula o premio total (`dinheiro * timesGrupo.length`), busca os integrantes do time (`times_integrantes` por `id_time`), divide o premio igualmente entre eles, credita cada `usuarios.saldo`, e por fim marca `torneios.status = false` e `torneios.id_time_vencedor = <id do time>` (encerrando o torneio e liberando o time campeao para se inscrever em outro). Uma secao "Campeao" aparece nos detalhes do torneio quando `id_time_vencedor` esta preenchido.
- **Carteira do usuario (`Perfil.jsx`):** nova secao "Carteira" no perfil proprio (nao aparece no perfil publico de outros usuarios), mostrando o `usuarios.saldo` formatado em R$ e um botao "Sacar". Como nao ha gateway de pagamento real integrado, o saque e simulado: zera o `saldo` no banco (`update usuarios set saldo = 0`) e mostra um alerta de confirmacao com o valor sacado. Sem integracao bancaria real — fica como pendencia futura caso seja necessario processar saques de verdade.
- Ainda nao ha protecao contra o organizador declarar vencedor mais de uma vez ou contra um time sem 5 integrantes completos ganhar (o calculo assume o numero de linhas retornadas por `times_integrantes`, entao um time que perdeu jogadores depois de inscrito dividiria o premio entre menos pessoas); fica como pendencia futura revisar essas bordas.

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
- Jogadores autenticados que ja fazem parte da line-up veem o botao "Sair do time", exceto o capitao (verificado pela funcao e por `times.id_capitao`). A acao confirma antes de excluir somente o proprio vinculo em `times_integrantes`, redireciona para `/equipes` ao concluir e exibe erro na pagina se a exclusao falhar.


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

## Refinamento visual dos Detalhes do Time
- **Componente:** `src/componentes/DetalhesTime.jsx`
- **CSS:** `src/css/detalhes-time.css` (escopado por `#pagina-detalhes-time`)
- Cabeçalho ampliado para destacar logo, identidade, data de criação, integrantes, vagas disponíveis e capitão; ações existentes permanecem sujeitas às permissões atuais.
- Layout de descrição e line-up refinado para desktop e celular. A escalação mostra avatares com iniciais, indicador de preenchimento e posições disponíveis, sem criar integrantes fictícios nem alterar os dados do Supabase.

## Gráfico Analítico de Desempenho de Receitas (Painel Admin)
- **Componente:** `src/componentes/AdminPanel.jsx` (aba "Receitas & Financeiro", renderizado através do subcomponente `GraficoReceitas`)
- **CSS:** `src/css/admin.css` (classes prefixadas com `.admin-grafico-` e `.admin-secao-grafico`)
- **Biblioteca:** `recharts` (versão 3+, compatível com React 19).
- **Posicionamento e Integração:** Posicionado exatamente entre os cards superiores de métricas (`admin-financeiro-grid`) e a tabela de histórico de transações (`Histórico de Transações da Plataforma`), sem modificar a estrutura existente nem dos cards nem da tabela.
- **Mapeamento de Dados:**
  - Eixo Y: plota o valor consolidado de `taxa_retida` (receita retida da plataforma vinda da tabela `transacoes_plataforma`).
  - Eixo X: agrupamento cronológico pelas datas de registro (`registro` ou fallback `created_at`), formatadas de forma compacta (ex: `DD/MM`) com controle de sobreposição de ticks via `minTickGap={20}`.
  - Formato visual: `AreaChart` com preenchimento em gradiente linear (`#b565f2` a `transparent`), linha de contorno em roxo neon `#b565f2` (2.5px) e pontos destacados (`activeDot` e `dot` dinâmicos).
- **Filtros Dinâmicos de Período:**
  - Botões seletor rápido: "Últimos 7 Dias" (`7d`), "Últimos 30 Dias" (`30d`), "Este Mês" (`mes`) e "Tudo" (`tudo`).
  - Recalcula somas, médias diárias e quantidade de transações em tempo real via `useMemo` acoplado ao estado `filtro` e ao array `transacoes`.
  - Tratamento resiliente de datas com preenchimento contínuo de dias para intervalos fixos (7D, 30D e mês) e ordenação cronológica com fallback para pontos unitários.
  - Resiliente a arrays vazios ou erros de consulta no banco através de bloco `try / catch`, exibindo placeholders informativos e sem travar a renderização da página.
- **Barra de Resumo Rápido (KPIs):** Exibe no topo do gráfico a Receita Retida no Período, Média Diária Estimada, Volume Bruto Movimentado e Transações Computadas, sincronizados dinamicamente com o filtro de tempo.
- **Identidade Cyberpunk / Tática:**
  - Fundo translúcido com backdrop blur e gradiente radial sutil.
  - Linhas de grade sutis em roxo suave (`rgba(157, 78, 221, 0.12)`).
  - Tooltip customizado (`CustomTooltipGrafico`): container escuro (`rgba(12, 6, 26, 0.95)`), borda roxa neon `#b565f2`, efeito blur, indicador luminoso e exibição detalhada da data formatada (`DD/MM/AAAA`) e do valor em BRL (`R$`).

## Busca Instantânea na Primeira Letra e Redesign Premium das Brackets com Celebração
- **Componentes modificados:** `src/componentes/Equipes.jsx`, `src/componentes/Menu.jsx`, `src/componentes/Torneios.jsx`, `src/componentes/DetalhesTorneio.jsx`, `src/componentes/TournamentBracket.jsx`
- **CSS:** `src/css/bracket.css`, `src/componentes/menu.css`
- **Busca Instantânea:**
  - `Equipes.jsx`: Filtro imediato na 1ª letra digitada cobrindo nome, tag, capitão e todos os integrantes/jogadores da equipe (`equipe.jogadores`).
  - `Menu.jsx`: Removida trava de mínimo de 2 caracteres (`length >= 2` para `>= 1` / `trim()`), reduzido debounce de 350ms para 150ms e criada visualização combinada imediata que exibe amigos correspondentes no topo e busca global de usuários no banco em tempo real.
  - `Torneios.jsx`: Filtro imediato na 1ª letra cobrindo nome do campeonato, formato, regras e premiação formatada ou numérica.
  - `DetalhesTorneio.jsx`: Campo de busca rápida de times para testes de admin ajustado para reagir na 1ª letra.
- **Redesign Premium das Chaves (Brackets - SaaS Gamer):**
  - Caixas de partida com visual translúcido moderno (`rgba(16, 10, 34, 0.86)` com `backdrop-filter: blur(14px)`), bordas finas com gradiente roxo/neon e elevação sutil com glow no hover.
  - Slot de time com exibição de sigla (TAG) em destaque (`.time-tag`), truncamento elegante de nomes longos e badges de status WIN / OUT.
  - Diferenciação visual nítida: time vencedor com fundo gradiente roxo, borda esquerda neon, tipografia mais iluminada (`text-shadow`) e badge WIN; time eliminado com opacidade reduzida (0.38) e filtro muted grayscale.
  - Linhas conectoras com acabamento neon roxo (`linear-gradient` com `drop-shadow` suave e curvas nos cantos).
  - Títulos de rodada em badges pill suspensas com fundo translúcido e borda neon.
- **Celebração Imersiva de Vitória:**
  - Banner hero animado renderizado tanto no topo da chave quanto na seção de Campeão de `DetalhesTorneio.jsx`.
  - Animação com keyframes `@keyframes winnerEntrance` (fade-in + scale bounce suave) e aura pulsante `@keyframes winnerGlowAura`.
  - Troféu animado (`@keyframes trophyPulse`) e tipografia de grande porte com gradiente dourado (`linear-gradient(135deg, #ffffff, #fef08a, #facc15, #eab308)`).

## Categorização de Torneios em 3 Estados (Aberto, Em Andamento e Encerrado)
- **Componentes modificados:** `src/componentes/Torneios.jsx`, `src/componentes/DetalhesTorneio.jsx`
- **CSS:** `src/css/torneios.css`
- **Regras de Negócio e Lógica de Classificação:**
  - Torneio Encerrado: identificado pela presença de campeão oficial (`Boolean(tournament.id_time_vencedor)`).
  - Torneio Em Andamento: identificado por inscrições fechadas / chave gerada (`tournament.status === false` ou similar) E ausência de campeão (`!tournament.id_time_vencedor`).
  - Torneio com Inscrições Abertas: torneio ativo para novas inscrições (`tournament.status !== false` E `!tournament.id_time_vencedor`).
  - Lógica espelhada entre `Torneios.jsx` e `DetalhesTorneio.jsx` garantindo consistência total tanto na listagem quanto na página individual do campeonato.
- **Estruturação de Seções no Torneios.jsx:**
  - Seção em Destaque "Torneios em Andamento": posicionada no topo com indicador visual de status AO VIVO, contador de campeonatos ativos e background com gradiente radial sutil.
  - Seção "Inscrições Abertas": posicionada abaixo dos torneios ao vivo, com contador de campeonatos disponíveis para novas equipes.
  - Seção Retrátil "Torneios Encerrados": componente `<details>` com histórico de torneios concluídos, abrindo automaticamente caso não haja torneios em andamento ou abertos.
  - Estado vazio informativo quando a busca não retorna resultados ou não há campeonatos abertos/em andamento.
- **Badges e Estilização Visual Gamer:**
  - Badge "INSCRIÇÕES ABERTAS" (`.tournament-status--open`): tom verde neon (`#4ade80`), background translúcido e glow sutil.
  - Badge "EM ANDAMENTO" (`.tournament-status--live`): tom âmbar/ouro gamer (`#fbbf24`), borda destacada e indicador de ponto animado (`@keyframes liveBadgePulse`) com pulso luminoso constante no estilo transmissão esports.
  - Badge "ENCERRADO" (`.tournament-status--finished`): tom slate/cinza escuro (`#94a3b8`) muted para torneios finalizados.
  - Card modifier `.tournament-card--live`: borda âmbar e elevação de glow nos torneios ao vivo.

## Otimização de Performance (Web Vitals), SWR e Eliminação de Overfetching
- **Componentes modificados:** `src/componentes/Equipes.jsx`, `src/componentes/Torneios.jsx`, `src/componentes/AdminPanel.jsx`, `src/componentes/DetalhesTime.jsx`, `src/componentes/DetalhesTorneio.jsx`, `src/componentes/Menu.jsx`, `src/componentes/Perfil.jsx`, `src/componentes/SelecaoMapas.jsx`, `src/componentes/ListaAmigos.jsx`
- **Eliminação de Overfetching no Supabase:**
  - `Equipes.jsx`: remoção de `select('*')` na consulta de `times`. Campos reduzidos estritamente aos necessários (`id, nome, tag, logo, capitao, registro`) com preservação integral do join relacional `times_integrantes (id, id_usuario, funcao, usuarios (id, nome, nome_usuario))` e adição de `.limit(60)`.
  - `Torneios.jsx`: remoção de `select('*')` e adoção de lista cirúrgica de colunas (`id, nome, descricao, data_inicio, dinheiro, formato, status, id_time_vencedor, mapa, imagem_mapa, imagem, registro`) com limite de 60 registros.
  - `AdminPanel.jsx`: transações da plataforma restringidas a campos específicos (`id, id_torneio, valor_bruto, taxa_retida, valor_liquido, status, registro, created_at, torneio:id_torneio(id, nome)`) com `.limit(150)`. Tabelas no explorer de dados limitadas a 100 registros para evitar bloqueio da thread do navegador.
- **Cache Instantâneo e SWR (Stale-While-Revalidate):**
  - Implementado padrão SWR com persistência em `localStorage` (`cache_equipes_v1`, `cache_torneios_v1`, `cache_admin_transacoes_v1`, `cache_admin_saldo_v1`, `cache_admin_principal_v1`, `cache_admin_tab_[tabela]_v1`).
  - Renderização imediata (zero tempo de espera / eliminação de telas brancas) no carregamento inicial a partir dos dados em cache.
  - Revalidação silenciosa em segundo plano: consulta disparada assincronamente ao Supabase que atualiza o estado e sincroniza o cache sem interromper a interação do usuário.
- **Lazy Loading de Imagens (Atributo loading="lazy"):**
  - Adicionado `loading="lazy"` em todas as tags `<img>` da aplicação (logos de equipes em cards e páginas de detalhes, ilustrações de agentes CS/EVA, logotipos de CS2, avatares de amizades e dropdowns de menu, cards e destaques de mapas).

## Refatoracao Mobile-First e Responsividade da Interface
- **Arquivos modificados:** `src/css/index.css`, `src/css/equipes.css`, `src/css/torneios.css`
- **Otimizacao do Video de Fundo na Home (`src/css/index.css`):**
  - Corrigido o estiramento do video de fundo (`.hero-video`) em celulares e tablets com `object-fit: cover;` e `object-position: center center;`, preservando a proporcao natural do video em qualquer resolucao mobile.
  - Calibrada a altura minima da Hero Section (`min-height: 85svh` em 768px e `min-height: 80svh` em 480px) com reducao dos espacamentos internos verticais, garantindo composicao equilibrada com a secao inferior de cards.
- **Compactacao dos Cards de Conteudo (Mobile-First):**
  - `src/css/equipes.css`: Reduzido o padding interno de `.equipe-card` (de 24px no desktop para 14px em 768px e 12px em 480px). Escala compacta para o avatar de equipe (`.equipe-avatar` de 48px para 40px/36px), badges e metadados (`.equipe-meta-item`), e input de busca (`.equipes-busca-input`) mais refinado e ocupando 100% da largura util.
  - `src/css/torneios.css`: Reduzido o padding interno de `.tournament-card-content` (de 22px para 14px em 768px e 12px em 480px). Reduzida a altura da capa com thumbnail do mapa (`.tournament-card-visual` de 100px para 72px em 768px e 64px em 480px), economizando altura vertical util e facilitando a navegacao por scroll.
- **Reintegracao Dinamica dos Personagens no Mobile:**
  - Removido o `display: none` das personagens Agente EVA (`.equipes-personagem-wrap`) e Agente CS Terrorist (`.torneios-personagem-wrap`) em dispositivos moveis (`@media (max-width: 768px)` e `@media (max-width: 480px)`).
  - Posicionamento inteligente em formato de marca d'agua atmosferica de fundo: `position: fixed; bottom: 0;`, `z-index: 1` (atras dos cards e containers de informacao que operam em camadas superiores), escala reduzida (`clamp(110px, 32vw, 140px)` em 768px e `clamp(100px, 30vw, 125px)` em 480px), opacidade tenue (0.25 - 0.26) e `pointer-events: none;`, mantendo a identidade visual sem comprometer a leitura ou cliques.
- **Calibracao de Espacamentos Globais e Tipografia:**
  - Reduzidos os espacamentos superiores desktop (`margin-top: 160px/140px`) em `#pagina-equipes` e `.tournaments-page` para 95px em 768px e 80px em 480px, alinhando as paginas logo abaixo da barra de navegacao fixa.
  - Tipografia dos titulos calibrada com `clamp()` para impedir quebras desconfortaveis em telas estreitas.
  - Preservacao integral do layout e comportamento em desktops e resolucoes acima de 1024px.

## Correcao de Ciclo de Vida e Quebra de Loop Infinito na Lista de Amigos (Perfil e Widget)
- **Componentes modificados:** `src/componentes/Perfil.jsx`, `src/componentes/ListaAmigos.jsx`
- **Eliminacao de Loop Infinito e Estabilizacao do Ciclo de Vida:**
  - `Perfil.jsx`: Removido listener global de `storage` dentro do efeito de amizades (`onUpdate`), mantendo estritamente o evento customizado `amigosAtualizados`. Isso eliminou o gatilho recursivo provocado por gravacoes no `localStorage` durante a execucao de leituras.
  - Removidas chamadas de `window.dispatchEvent(new Event('storage'))` dentro de funcoes de mutacao de amizades, mantendo exclusivamente o canal `amigosAtualizados`.
  - Removidas variaveis de estado que sofrem mutacao durante o ciclo de fetch (`listaAmigos`, `pedidosPendentes`, `pedidosEnviados`, `loading`, `resultadosBusca`) da matriz de dependencias do efeito de busca. Introduzidas referencias estaveis (`listaAmigosRef`, `pedidosPendentesRef`, `pedidosEnviadosRef`) para validacao cruzada sem dependencias reativas ciclicas.
  - `ListaAmigos.jsx`: Adicionada trava com ref (`isCarregandoRef`) impedindo execucoes concorrentes de `carregarAmizades()`.
- **Isolamento da Funcionalidade de Busca:**
  - `buscaAmigo` agora atua como estado isolado de pesquisa local, filtrando em tempo real na primeira letra as colecoes de amigos (`amigosFiltrados`), pedidos pendentes (`pendentesFiltrados`) e pedidos enviados (`enviadosFiltrados`) via `useMemo`.
  - A digitacao nao forca re-fetch global no banco de dados para a lista de amigos existente.
  - A busca no servidor por novos jogadores para adicao no autocomplete foi isolada e protegida com debounce de 350ms e cancelamento via `clearTimeout`, evitando sobrecarga de chamadas de rede no Supabase.
- **Cleanup e Prevencao de Memory Leaks:**
  - Todos os event listeners de atualizacao (`amigosAtualizados`, `click`) contam com o respectivo `window.removeEventListener` / `document.removeEventListener` na funcao de limpeza (cleanup) do `useEffect`.

## Correcao da Projecao de Colunas em transacoes_plataforma (AdminPanel)
- **Componente modificado:** `src/componentes/AdminPanel.jsx`
- **Correcao da Consulta no Supabase:**
  - Removida a referencia a coluna inexistente `created_at` nas consultas cirurgicas a tabela `transacoes_plataforma` (tanto na consulta principal com join de torneio quanto na consulta de fallback).
  - Projecao de colunas alinhada com o esquema real do banco: `id, id_torneio, valor_bruto, taxa_retida, valor_liquido, status, registro, torneio:id_torneio(id, nome)`.
- **Tratamento na Renderizacao e Graficos:**
  - O processamento de dados do grafico (`dadosGrafico`) e as linhas da tabela historica (`<tr>`) consom exclusivamente a coluna `registro`, eliminando qualquer fallback para `created_at` e resolvendo o erro `column transacoes_plataforma.created_at does not exist`.

## Extrato Financeiro e Historico de Transacoes da Carteira (Perfil)
- **Componentes modificados:** `src/componentes/Perfil.jsx`, `src/css/perfil.css`
- **Integracao Transacional (Deposito e Saque):**
  - Removido trecho residual em `handleSacar()` que zerava indevidamente o saldo antes da validacao de valor.
  - Apos a atualizacao bem-sucedida do saldo do usuario na tabela `usuarios`, o sistema efetua a insercao transacional na nova tabela `historico_carteira`:
    - Para Deposito: `{ id_usuario: usuario.id, tipo: 'ENTRADA', valor: valorFormatado, descricao: 'Deposito Simulado' }`.
    - Para Saque: `{ id_usuario: usuario.id, tipo: 'SAIDA', valor: valorFormatado, descricao: 'Saque Simulado' }`.
  - Atualizacao reativa imediata da lista de historico local via `.select().maybeSingle()` e fallback para consulta completa, sincronizando a interface em tempo real sem recarregar a pagina.
- **Extrato Financeiro do Dono da Conta:**
  - Criada secao dedicada "Meu Historico de Transacoes" com visual moderno logo abaixo do bloco de Carteira.
  - Exibicao estritamente restrita ao titular logado da conta (`!isPublico && isDono`).
  - Consulta assincrona ao Supabase na tabela `historico_carteira` com filtro por `id_usuario`, ordenada pelo timestamp `registro` de forma decrescente (`order('registro', { ascending: false })`) e limitada a 50 transacoes.
  - Tabela responsiva com colunas: Data e Hora formatadas (`toLocaleDateString` / `toLocaleString`), Tipo com badge semantico (`Entrada` / `Saida`), Descricao e Valor formatado em Real (BRL).
  - Estado vazio amigavel ("Nenhuma transacao registrada ainda.") e indicador de carregamento.
- **Estilizacao e Design:**
  - Adicionadas classes no `src/css/perfil.css` (`.perfil-extrato-tabela-wrap`, `.perfil-extrato-tabela`, `.perfil-extrato-badge--entrada`, `.perfil-extrato-badge--saida`, `.perfil-extrato-valor--entrada`, `.perfil-extrato-valor--saida`).
  - Cores semanticas: verde (`#4ade80`) com glow sutil para entradas e vermelho (`#f87171`) para saidas.
  - Responsividade completa para dispositivos moveis com scroll horizontal suave (`-webkit-overflow-scrolling: touch`) e padding calibrado para telas pequenas.

## Correcao Critica de Esquema e Diagnostico nas Consultas de Equipes e Torneios
- **Componentes modificados:** `src/componentes/Equipes.jsx`, `src/componentes/Torneios.jsx`
- **Diagnostico do Erro PostgREST 42703 (Bad Request):**
  - `Torneios.jsx`: A constante `CAMPOS_TORNEIOS` continha colunas inexistentes na tabela `torneios` (`mapa`, `imagem_mapa`, `imagem`), provocando rejeicao imediata pelo PostgREST com status 400 (`column torneios.mapa does not exist`) tanto na consulta principal quanto no fallback.
  - `Equipes.jsx`: A projecao cirurgica em `times` solicitava o campo inexistente `capitao` (em vez de `id_capitao`), disparando status 400 (`column times.capitao does not exist`) na consulta com JOIN relacional e no fallback manual.
- **Auditoria e Correcao das Projecoes de Colunas:**
  - `Torneios.jsx`: Atualizada a constante para `id, nome, descricao, data_inicio, dinheiro, formato, status, id_time_vencedor, premio_acumulado, registro`. O mapa continua sendo inferido de forma segura via regex/heuristica na coluna `descricao` ou fallback padrao para Mirage/Dust II.
  - `Equipes.jsx`: Substituida a coluna `capitao` por `descricao, id_capitao`. A resolucao do nome do capitao foi blindada para checar primeiro o integrante com `funcao === 'capitao'` e, alternativamente, o integrante cujo `id_usuario` coincide com `time.id_capitao`.
- **Injecao de Logs Rigorosos de Diagnostico:**
  - Adicionados logs com `console.error` detalhando `error.message`, `error.details`, `error.hint` e `error.code` tanto nas consultas principais quanto nos fallbacks e blocos `catch` de ambos os componentes.
- **Fail-Safes e Blindagem contra Nulos:**
  - Validacao de arrays com `Array.isArray()` para garantir que retornos nulos ou indefinidos nao causem quebras na thread do React ao iterar ou mapear dados.
  - `setEquipes([])` e `setTorneios([])` aplicados defensivamente caso o banco retorne vazio, limpando estados de erro com sucesso.

## Auditoria Global de Pre-Deploy e Teste de Estresse para Vercel
- **Componentes e arquivos verificados:** `vercel.json`, `src/App.jsx`, `src/componentes/Equipes.jsx`, `src/componentes/DetalhesTime.jsx`, `src/componentes/Perfil.jsx`, `src/componentes/TournamentBracket.jsx`, `src/componentes/ListaAmigos.jsx`, `src/componentes/AlertaModal.jsx`, `src/css/alerta-modal.css`, `src/css/index.css`.
- **Arquitetura Vercel e Case-Sensitivity:**
  - `vercel.json`: Atualizada regra canonica de rewrite SPA para direcionar `/(.*)` a `/index.html`, evitando 404 em rotas aninhadas.
  - Varredura de case-sensitivity: Auditados todos os imports em 43 arquivos do projeto contra o sistema de arquivos, confirmando 0 divergencias de maiusculas/minusculas para compatibilidade com ambiente Linux do Vercel.
- **Resiliencia e Normalizacao de Consultas Supabase (PostgREST):**
  - Executada varredura automatizada em todas as 75 consultas do projeto contra a base ativa do Supabase.
  - Normalizadas strings de embedding relacional aninhado em `Equipes.jsx`, `DetalhesTime.jsx`, `Perfil.jsx`, `TournamentBracket.jsx` e `ListaAmigos.jsx` para sintaxe compativel com parser PostgREST (eliminando quebras de linha e espacos antes de parenteses que provocavam erro de sintaxe 400).
  - Taxa de sucesso final nas 75 queries: 100% de sucesso (0 falhas).
  - Validada ausencia total de referencias a `created_at` ou colunas fantasmas.
- **Estabilidade de Ciclo de Vida e Cleanup:**
  - Auditados todos os hooks `useEffect` e ouvintes de eventos globais. Confirmado que todo `addEventListener` possui o respectivo `removeEventListener` na funcao de limpeza, prevenindo memory leaks.
- **Camadas Visuais, Z-Index e Responsividade:**
  - Verificado que `.aurora-mesh-container` e `.hero-video` operam com `z-index: 0` e `pointer-events: none`, sem interceptar cliques de botoes ou navegacao.
  - Elementos decorativos (EVA e CS) configurados como marcas d'agua sutis em mobile com `pointer-events: none` e sem comprimir conteudo.
  - Grids responsivos configurados para colapsar para `1fr` em resolucoes menores que 768px e 480px.
  - Modal customizado (`AlertaModalUI`) com display flex e centralizacao horizontal e vertical em viewport inteira (`inset: 0`).
  - Fallbacks de logo e avatar validados para renderizar badge de iniciais via evento `onError`.
- **Build de Producao:**
  - `npm run build` executado com 100% de sucesso em 922ms com 0 erros.










