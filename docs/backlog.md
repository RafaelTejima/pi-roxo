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
