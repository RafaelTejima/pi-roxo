# Especificação Técnica: Sistema de Bracket e Gerenciamento de Partidas de CS2

## 1. Visão Geral do Sistema

O módulo de chaveamento é responsável pelo gerenciamento em tempo real do fluxo do campeonato, controle do progresso das partidas e avanço automatizado das equipes na tabela:

* **Entrada:** Lista de equipes inscritas, total de participantes ($4, 8, 16, 32$) e modo de definição de resultados (Manual pelo Administrador ou Automático por Algoritmo de Resolução).

* **Processamento:** Cruzamento dinâmico de *seeds*, cálculo exato de avanço de vaga e validação dos placares dos confrontos.

* **Saída:** Tabela (*bracket*) interativa atualizada instantaneamente e definição da equipe campeã.

## 2. Estrutura do Estado (State Management)

Todo o estado de um torneio ativo é mantido em uma estrutura relacional leve em formato JSON, garantindo alta performance de leitura e atualização imediata no frontend:

```json
{
  "tournament": {
    "id": "trn-2026-001",
    "name": "CS2 Major Championship",
    "team_count": 8,
    "format": "SINGLE_ELIMINATION"
  },
  "teams": [
    { "id": "t1", "name": "FURIA", "seed": 1 },
    { "id": "t2", "name": "MIBR", "seed": 2 },
    { "id": "t3", "name": "Imperial", "seed": 3 },
    { "id": "t4", "name": "paIN", "seed": 4 },
    { "id": "t5", "name": "RED Canids", "seed": 5 },
    { "id": "t6", "name": "Bestia", "seed": 6 },
    { "id": "t7", "name": "Fluxo", "seed": 7 },
    { "id": "t8", "name": "ODDIK", "seed": 8 }
  ],
  "matches": [
    {
      "id": "m_r1_p0",
      "round": 1,
      "position": 0,
      "team1_id": "t1",
      "team2_id": "t8",
      "team1_score": 13,
      "team2_score": 9,
      "winner_id": "t1",
      "next_match_id": "m_r2_p0",
      "status": "FINISHED"
    }
  ]
}
```

## 3. Algoritmos de Chaveamento e Progressão

### A. Cruzamento Inicial por *Seeding* (First Round Bracket Seed)

Para garantir o equilíbrio competitivo da tabela, o sistema aplica o cruzamento oficial do circuito profissional: o 1º colocado enfrenta o último, o 2º enfrenta o penúltimo, e assim sucessivamente.

**Estrutura de Confrontos da 1ª Rodada (Exemplo com 8 equipes):**

* **Partida 0:** `Seed 1` vs `Seed 8`
* **Partida 1:** `Seed 4` vs `Seed 5`
* **Partida 2:** `Seed 2` vs `Seed 7`
* **Partida 3:** `Seed 3` vs `Seed 6`

### B. Cálculo da Próxima Partida (Avanço no Bracket)

Assim que uma partida tem o seu resultado confirmado em uma chave de Eliminação Simples, o motor da plataforma calcula a partida e a vaga exata para onde a equipe vencedora é transferida:

* **Índice da Próxima Rodada:** $Rodada_{próxima} = Rodada_{atual} + 1$

* **Posição da Próxima Partida:** $Posição_{próxima} = \lfloor \frac{Posição_{atual}}{2} \rfloor$

* **Lado do Confronto (Slot Time 1 ou Time 2):**
  * Se $Posição_{atual}$ for **par** $\rightarrow$ A equipe assume a vaga de **Time 1** no confronto seguinte.
  * Se $Posição_{atual}$ for **ímpar** $\rightarrow$ A equipe assume a vaga de **Time 2** no confronto seguinte.

## 4. Modos de Resolução e Operação do Bracket

A plataforma disponibiliza três métodos para progressão e preenchimento dos resultados na chave:

### 1. Resolução Manual / Ação do Usuário
* O administrador ou operador do torneio clica sobre o card da equipe vencedora para declarar o resultado da partida.
* O sistema atribui a pontuação do confronto dentro das regras oficiais (ex: `13 x 11` em MR12 ou `2 x 1` em séries BO3) e avança a equipe automaticamente na tabela.

### 2. Algoritmo de Resolução Rápida (Botão "Resolver Partida")
* Calcula e aplica o resultado exato de uma partida respeitando a pontuação oficial do CS2 em MR12:
  * O vencedor obrigatoriamente atinge 13 rounds (ou 16 em caso de *overtime*).
  * O perdedor recebe uma pontuação entre 0 e 11 rounds (ou 12 a 14 no *overtime*).

### 3. Resolução Total do Torneio (Botão "Processar Torneio")
* O motor percorre em cascata todas as partidas, desde as rodadas iniciais até a grande final, calculando e inserindo os placares de cada fase até coroar a equipe campeã.

## 5. Arquitetura do Frontend e Renderização

Para a construção da interface do chaveamento:

1. **Estrutura Visual:** Layout em colunas dinâmicas (Grid/Flexbox) representando as fases da competição (Quartas de Final, Semifinais, Final).
2. **Conectores de Tabela:** Linhas SVG ou CSS conectam a partida $P$ da Rodada $R$ às partidas de origem da Rodada $R-1$.
3. **Reatividade do Estado:** Qualquer alteração no atributo `winner_id` atualiza imediatamente o slot da próxima fase com animação de progressão.