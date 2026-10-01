# Bracket + Integração com Supabase

Você é um desenvolvedor eSports Fullstack junior e especialista em Supabase e React/Next.js. Preciso que você implemente todo o sistema de Brackets (Chaveamento Dinâmico em Árvore) e Integração de Premiação em Dinheiro para uma plataforma de torneios.

Eu JÁ rodei todas as migrations SQL, triggers de avanço automático, Row Level Security (RLS) e stored procedures no Supabase. O seu foco será implementar a lógica de código (Frontend e serviços do Supabase Client).

---

### 1. Contexto do Banco de Dados no Supabase (PostgreSQL)

O banco já possui as seguintes tabelas estruturadas e configuradas:

- `torneios` (id, nome, status, registro, data_inicio, descricao, dinheiro, formato, id_criador, premio_acumulado, id_time_vencedor)
- `partidas` (id, id_torneio, fase, id_jogador1, id_jogador2, id_vencedor, status, rodada, posicao, proxima_partida_id, proxima_partida_slot, registro)
- `inscricoes` (id, nome_torneio, torneio_status, times, id_times, numero_times, id_usuarios, nome_usuarios, registro)
- `times` (id, nome, tag, logo, descricao, id_capitao, registro)
- `usuarios` (id, nome, email, id_time, admin, ...)
- `historico_jogadores` (id, id_usuario, id_torneio, id_time, posicao_final, ganhos_obtidos)

> **Nota:** Existe uma trigger SQL ativa na tabela `partidas` que, quando uma partida é atualizada para `status = 'Finalizada'` e possui um `id_vencedor`, ela AUTOMATICAMENTE copia esse vencedor para o slot correto da `proxima_partida_id`.

---

### 2. O que você (Antigravity) deve criar

#### A. Algoritmo de Geração do Bracket (`BracketGeneratorService`)
Crie uma função helper/serviço no backend ou lib do projeto responsável por gerar os registros da tabela `partidas` quando um torneio for iniciado (formato Eliminação Simples / Mata-Mata):

1. **Entrada:** `id_torneio` e a lista de times inscritos buscados da tabela `inscricoes`.
2. **Cálculo da Árvore:**
   - Obter o número total de participantes $N$ (ex: 8, 16 ou 32).
   - Calcular o total de rodadas: $\log_2(N)$ (Ex: 8 times = 3 rodadas: Quartas, Semis, Final).
3. **Criação Encadeada de Partidas:**
   - O algoritmo deve gerar primeiro as partidas das rodadas finais (ex: Final [Rodada 3], Semis [Rodada 2]) para obter os `id`s gerados.
   - Em seguida, deve criar as partidas das rodadas anteriores (Quartas [Rodada 1]) já vinculando `proxima_partida_id` ao `id` da partida correspondente na rodada seguinte.
   - Definir `proxima_partida_slot` (1 para o primeiro participante do confronto e 2 para o segundo).
   - Fazer o insert em lote na tabela `partidas` via Supabase Client (`supabase.from('partidas').insert(...)`).

---

#### B. Componente Visual e Interativo do Bracket (React Component)
Crie um componente responsivo e moderno `TournamentBracket.jsx` (ou `.tsx`):

1. **Busca de Dados e Realtime:**
   - Buscar as partidas do torneio (`supabase.from('partidas').select('*, jogador1:times!id_jogador1(*), jogador2:times!id_jogador2(*)').eq('id_torneio', torneioId)`).
   - Assinar as mudanças em tempo real com `supabase.channel()` para que o bracket atualize automaticamente na tela quando uma partida for atualizada no banco.
2. **Layout Visual (CSS Grid / Flexbox):**
   - Renderizar as partidas agrupadas por `rodada` em colunas paralelas (Quartas, Semifinais, Final).
   - Desenhar os cards de partida mostrando:
     - Logo, TAG e nome dos dois times.
     - Destaque visual/cor para o time vencedor se a partida estiver `Finalizada`.
     - Indicadores de status (`Pendente`, `Agendada`, `Em Andamento`, `Finalizada`).
   - Linhas de conexão ou alinhamento conectando as partidas de uma rodada com a próxima.

---

#### C. Painel do Administrador (Atualização de Resultado)
1. **Controle de Acesso (Via Frontend):**
   - **Frontend:** A edição do bracket (como declarar vencedores) deve validar se o usuário autenticado é o criador do torneio (`usuario.id === torneio.id_criador`) ou um administrador geral (`usuario.admin === true`). Sem essas condições, os botões de ação e modais não devem ser sequer renderizados (exibição apenas em modo leitura).
   - **Backend:** O banco está intencionalmente configurado sem regras de Row Level Security (RLS) restritivas, delegando toda a validação visual e lógica para o client-side/frontend.
2. Permita que administradores/organizadores cliquem em uma partida no bracket para abrir um modal ou acionar um botão "Declarar Vencedor".
3. Ao selecionar o vencedor, o Supabase Client deve rodar:
   ```javascript
   await supabase
     .from('partidas')
     .update({ id_vencedor: teamId, status: 'Finalizada' })
     .eq('id', partidaId);