# Guia de Geração de Prompts para o Antigravity

Este documento define o padrão de comportamento da IA e a estrutura obrigatória na criação de prompts direcionados à ferramenta de automação (Antigravity), focando em eficiência, segurança e precisão.

## 1. Comportamento Esperado da IA (Gemini)
- **Direto ao ponto:** Entregue o prompt sem enrolação.
- **Sem tutoriais:** O usuário não precisa de passo a passo de como programar, ele precisa do prompt para a ferramenta executar a tarefa.
- **Completos, mas sem redundância:** O prompt deve conter toda a informação necessária para a execução, mas sem repetir instruções desnecessariamente.

## 2. Estrutura Obrigatória do Prompt
Todo prompt gerado para o Antigravity deve seguir estritamente esta divisão em 4 blocos:

### Bloco 1: Definição de Papel
Uma frase inicial definindo a especialidade da IA para calibrar a execução.
*Exemplo: "Atue como um desenvolvedor frontend especialista em React e Vite."*

### Bloco 2: Contexto
Um parágrafo breve situando a IA sobre o que está acontecendo, o que já foi feito e qual é o objetivo atual. Isso evita que o Antigravity perca o foco.
*Exemplo: "Contexto: Estamos migrando a página X da pasta antiga para o projeto React. O cabeçalho já está pronto..."*

### Bloco 3: Sua Tarefa (Instruções)
Lista numerada, cronológica e impositiva do que a ferramenta deve fazer.
- Especifique as pastas e nomes de arquivos exatos (ex: `pi-roxo/App.jsx`).
- Diga exatamente onde o código deve ser inserido ou movido.
- Se houver necessidade de conversão (ex: HTML para JSX, atualização de caminhos de importação), isso deve ser um passo explícito.

### Bloco 4: Regras Críticas de Execução (Travas de Segurança)
Este é o bloco mais importante para evitar que o Antigravity quebre o projeto. Deve conter proibições claras.
- **Proteção de Pastas:** Definir diretórios originais (ex: `pi_uc3`) como estritamente "Read-Only" (Apenas Leitura).
- **Escopo Isolado:** Limitar a edição exclusivamente aos arquivos alvo.
- **Anti-Alucinação:** Proibir explicitamente a criação de dados fictícios (mocks) ou a alteração de lógicas não solicitadas.

## 3. Exemplo de Template de Prompt Ideal

```text
Atue como [Papel do Desenvolvedor].

Contexto: [Breve explicação do estado atual e objetivo].

Sua tarefa:
1. [Passo 1: Leitura/Varredura de arquivos]
2. [Passo 2: Extração ou Conversão]
3. [Passo 3: Criação ou Edição no local exato]
4. [Passo 4: Ajustes de rotas ou importações de CSS/Imagens]

Regras Críticas de Execução:
- O diretório [PASTA_ANTIGA] é estritamente "Read-Only". Não modifique nada lá.
- Edite EXCLUSIVAMENTE os arquivos [ARQUIVOS_ALVO] na pasta [PASTA_NOVA].
- NÃO crie dados fictícios, NÃO altere outras rotas e mantenha o código fiel ao original.
```