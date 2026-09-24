# Criação de Equipe para Torneios

Esta página permite que um usuário crie uma equipe e inscreva seus jogadores em um torneio disponível. A equipe deve ficar vinculada ao usuário responsável pela criação e ao torneio escolhido.

## Objetivo

- Criar uma equipe para competir em um torneio.
- Definir nome, abreviação e identidade visual da equipe.
- Adicionar jogadores por nome de usuário ou e-mail.
- Selecionar o torneio em que a equipe participará.
- Impedir o envio enquanto os dados obrigatórios estiverem incompletos.
- Exibir uma confirmação após a inscrição da equipe.

## Página

- **Componente:** `src/componentes/CriarEquipe.jsx`
- **CSS:** `src/css/criar-equipe.css`
- **Rota sugerida:** `/equipes/criar`
- O CSS deve ser escopado pelo ID único `#pagina-criar-equipe`.
- A rota deve exigir que o usuário esteja autenticado.
- A página deve usar o menu global existente do projeto.

## Formulário

### Dados da equipe

- Nome da equipe.
- Sigla da equipe, com no máximo cinco caracteres.
- Imagem ou avatar da equipe usando placeholder do `placehold.co` quando não houver imagem definida.
- Descrição opcional da equipe.

### Participantes

- Jogador responsável pela equipe, definido automaticamente como o usuário autenticado.
- Lista de jogadores convidados ou adicionados.
- Quantidade mínima e máxima de jogadores de acordo com o formato do torneio.
- Campo para adicionar jogador por nome de usuário ou e-mail.
- A lista deve permitir remover um jogador antes do envio.
- Um jogador não pode ser adicionado duas vezes à mesma equipe.

### Torneio

- Lista de torneios com inscrições abertas, carregada pela API do Supabase.
- Cada opção deve mostrar nome, data, premiação e quantidade atual de equipes.
- O torneio deve ser obrigatório.
- Torneios encerrados, cheios ou que já começaram não podem ser selecionados.

## Validações

- Nome da equipe é obrigatório.
- Sigla é obrigatória e deve ter entre 2 e 5 caracteres.
- Torneio é obrigatório.
- A equipe deve ter o número mínimo de jogadores exigido pelo torneio.
- O usuário autenticado não pode criar uma equipe sem ser o capitão.
- Jogadores repetidos devem ser bloqueados.
- Jogadores inexistentes devem gerar uma mensagem de erro clara.
- O envio deve ficar desabilitado enquanto a requisição estiver sendo processada.
- Erros da API devem aparecer na própria página, sem apagar os dados preenchidos.

## Persistência no Supabase

O envio deve criar ou atualizar os registros relacionados usando o client existente em `src/supabase.js`.

### Tabela `teams`

- `name`: nome da equipe.
- `tag`: sigla da equipe.
- `avatar_url`: URL do placeholder ou imagem da equipe.
- `description`: descrição opcional.
- `captain_id`: ID do usuário autenticado.
- `created_at`: data de criação.

### Tabela de relação `team_members`

- `team_id`: ID da equipe.
- `user_id`: ID do jogador.
- `role`: função do jogador, como `captain` ou `player`.
- `created_at`: data de entrada na equipe.

### Tabela de relação `tournament_teams`

- `tournament_id`: ID do torneio selecionado.
- `team_id`: ID da equipe criada.
- `status`: estado da inscrição, inicialmente `pending` ou `confirmed` conforme a regra do torneio.
- `created_at`: data da inscrição.

As inserções relacionadas devem evitar equipes duplicadas no mesmo torneio e manter a consistência entre equipe, jogadores e torneio. Caso uma etapa falhe, a interface deve informar o erro e evitar apresentar a inscrição como concluída.

## Fluxo de sucesso

1. O usuário preenche os dados da equipe.
2. O usuário escolhe um torneio com inscrições abertas.
3. O usuário adiciona os jogadores necessários.
4. O sistema valida os dados.
5. A equipe e seus vínculos são salvos no Supabase.
6. A quantidade de equipes inscritas no torneio é atualizada pela relação criada ou pela regra definida no banco.
7. O usuário vê uma confirmação e é direcionado para `/torneios` ou para os detalhes do torneio.

## Estados da tela

- Formulário vazio.
- Carregando torneios.
- Carregando jogadores.
- Enviando equipe.
- Equipe criada com sucesso.
- Erro de validação.
- Erro de comunicação com o Supabase.
- Nenhum torneio aberto para inscrição.

## Requisitos visuais

- Tema escuro por padrão, com suporte ao tema claro do projeto.
- Cor principal roxa `#723EC3`.
- Layout responsivo para celular, tablet e desktop.
- Não usar emojis na interface.
- Não gerar imagens; utilizar placeholders do `placehold.co` quando necessário.
- Utilizar campos, botões e mensagens compatíveis com o padrão visual existente.
