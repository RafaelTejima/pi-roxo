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
- No envio, insere um registro na tabela `tournaments` do Supabase (`name`, `tournament_date`, `prize`, `rules`, `status: 'open'`, `teams_count: 0`) usando o client em `src/supabase.js`.
- Apos sucesso, redireciona para `/torneios`.
- **Conexao com a pagina de Torneios:**
  - Botao "Criar Torneio" adicionado no cabecalho da listagem (`src/componentes/Torneios.jsx`, classe `.tournaments-criar-btn`) linkando para `/torneios/criar`.
  - Link "Criar Torneio" tambem adicionado no `Menu.jsx` (visivel apenas para usuario logado, ao lado do botao de Painel Admin).
  - A rota `/torneios/criar` foi registrada em `App.jsx` **antes** de `/torneios/:id` para nao ser capturada pela rota dinamica de detalhes.
- O navbar proprio pedido em `docs/pagina_criacao_torneio.md` nao foi recriado porque o projeto ja usa um `Menu` global (via `App.jsx`) compartilhado entre todas as paginas, seguindo o padrao ja usado por `Torneios.jsx`, `Regras.jsx`, etc.

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

## Pagina de Perfil do Usuario
- **Componente:** `src/componentes/Perfil.jsx` (rota `/perfil`)
- **CSS:** `src/css/perfil.css` (escopado por `#perfil-page`)
- **Atualizacao:** A pagina de perfil foi completamente refeita para exibir apenas as informacoes que o usuario registrou no banco de dados, removendo visualizacoes estaticas.
- **Edicao de Perfil:** Adicionada opcao para o usuario editar seu perfil (foto/imagem via URL, biografia, nome de usuario). Esses dados sao salvos diretamente no Supabase (`tabela usuarios`).
- **Conexoes e Privacidade:** Adicionados campos no formulario para vincular Discord, Steam, Twitter e configuracoes de privacidade (visibilidade do nome de perfil, lista de amigos e ganhos). Como esses campos ainda nao existem no schema atual da tabela `usuarios`, os dados dessas configuracoes adicionais estao sendo provisoriamente salvos e recuperados no `localStorage` ate a atualizacao do banco.
