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
- Formulario com campos: nome do torneio, data/hora (`datetime-local`), valor do premio e regras.
- Regras sao adicionadas em uma lista via `<details>`/dropdown antes do envio; o formulario bloqueia o envio (`setErro`) se a lista de regras estiver vazia.
- No envio, insere um registro na tabela `tournaments` do Supabase (`name`, `tournament_date`, `prize`, `rules`, `status: 'open'`, `teams_count: 0`) usando o client em `src/supabase.js`.
- Apos sucesso, redireciona para `/torneios`.
- **Conexao com a pagina de Torneios:**
  - Botao "Criar Torneio" adicionado no cabecalho da listagem (`src/componentes/Torneios.jsx`, classe `.tournaments-criar-btn`) linkando para `/torneios/criar`.
  - Link "Criar Torneio" tambem adicionado no `Menu.jsx` (visivel apenas para usuario logado, ao lado do botao de Painel Admin).
  - A rota `/torneios/criar` foi registrada em `App.jsx` **antes** de `/torneios/:id` para nao ser capturada pela rota dinamica de detalhes.
- O navbar proprio pedido em `docs/pagina_criacao_torneio.md` nao foi recriado porque o projeto ja usa um `Menu` global (via `App.jsx`) compartilhado entre todas as paginas, seguindo o padrao ja usado por `Torneios.jsx`, `Regras.jsx`, etc.
