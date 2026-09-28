# Página de detalhes do time

Esta é a página que mostra as informações completas de um time cadastrado, acessada a partir de um clique no card do time na página `Equipes.jsx`. Essa página deve ser feita em `DetalhesTime.jsx`.

## Contexto

- A listagem de times (`src/componentes/Equipes.jsx`, rota `/equipes`) já busca os times reais da tabela `times` no Supabase (ver `docs/backlog.md`, seção "Integração da Criação de Equipe com o banco").
- A criação de time (`src/componentes/CriarEquipe.jsx`, rota `/equipes/criar`) insere o time em `times` e a line-up (capitão + jogadores) em `times_integrantes`.
- Esta página de detalhes consome essas mesmas tabelas, sem necessidade de criar tabelas novas.

## Rota

- Rota sugerida: `/equipes/:id`, onde `:id` é o `id` (bigint) do time na tabela `times`.
- Cada card em `Equipes.jsx` deve virar um link (`<Link>`) para `/equipes/:id`.
- O CSS deve ser escopado pelo ID único `#pagina-detalhes-time` e ficar em `src/css/detalhes-time.css`.
- A página deve usar o menu global existente do projeto.

## Dados exibidos

### Cabeçalho do time

- Logo/avatar do time (`times.logo`); usar placeholder do `placehold.co` quando `logo` for nulo.
- Nome do time (`times.nome`) e sigla/tag (`times.tag`).
- Descrição do time (`times.descricao`), quando preenchida.
- Data de criação/registro do time (`times.registro`), formatada em pt-BR.

### Capitão

- Buscar em `usuarios` pelo `id` igual a `times.id_capitao`.
- Exibir nome (`nome_usuario` ou `nome`) e destacar visualmente como capitão (mesmo padrão usado em `CriarEquipe.jsx`).

### Line-up / integrantes

- Buscar em `times_integrantes` todos os registros com `id_time` igual ao time atual.
- Para cada integrante, buscar o nome correspondente em `usuarios` pelo `id_usuario`.
- Separar visualmente quem tem `funcao = 'capitao'` de quem tem `funcao = 'jogador'`.
- Exibir contagem total de integrantes (ex.: `4/5`).
- Caso o time não tenha jogadores além do capitão, exibir uma mensagem informando que a line-up está incompleta.

## Estados da tela

- Carregando dados do time.
- Time não encontrado (`id` inválido ou inexistente) — exibir mensagem e link de volta para `/equipes`.
- Erro de comunicação com o Supabase.
- Dados carregados com sucesso.

## Ações da página

- Botão/link para voltar à listagem de times (`/equipes`).
- Caso o usuário autenticado (`localStorage.usuarioLogado`) seja o capitão do time (`usuario.id === times.id_capitao`), exibir opção de editar o time (nome, sigla, descrição, logo) — a edição em si pode ser implementada em uma tarefa futura, mas o botão/link já deve aparecer condicionalmente.
- Não exibir nenhuma ação de edição para usuários que não sejam o capitão.

## Requisitos visuais

- Tema escuro por padrão, com suporte ao tema claro do projeto.
- Cor principal roxa `#723EC3`.
- Layout responsivo para celular, tablet e desktop.
- Não usar emojis na interface.
- Não gerar imagens; utilizar placeholders do `placehold.co` quando necessário.
- Seguir o mesmo padrão visual de cards e seções já usado em `Equipes.jsx` e `CriarEquipe.jsx`.
