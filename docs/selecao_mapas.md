# Especificacao da Pagina de Selecao de Mapa

## Objetivo da Pagina

A pagina deve permitir que o usuario escolha um mapa para utilizar em uma partida ou configuracao de campeonato.

A experiencia deve priorizar:

- Visualizacao dos mapas disponiveis.
- Identificacao rapida do mapa selecionado.
- Informacoes relevantes sobre cada mapa.
- Busca por nome.
- Filtros de mapas.
- Navegacao simples.
- Destaque visual para o mapa atualmente selecionado.
- Interface responsiva.
- Experiencia semelhante a uma tela de selecao de jogo competitivo.

A pagina deve parecer parte da mesma plataforma de e-sports, e nao uma pagina isolada.

---

## Estrutura Visual

A pagina deve utilizar uma estrutura semelhante a seguinte:

### 1. Header

O topo deve manter a identidade visual da plataforma.

Deve conter, quando aplicavel ao projeto:

- Logo/nome da plataforma.
- Navegacao principal.
- Area do usuario.
- Acesso as funcionalidades relacionadas a campeonatos.

O header deve seguir os padroes ja existentes no projeto.

### 2. Area Principal

A area principal deve apresentar o titulo da pagina e uma breve descricao.

**Exemplo conceitual:**
> **Selecao de mapa**  
> Escolha o mapa que sera utilizado na partida.

Abaixo do titulo devem existir os controles de pesquisa e filtragem.

---

## Pesquisa e Filtros

A pagina deve possuir uma area de controles para facilitar a localizacao dos mapas.

Deve conter:

- Campo de pesquisa por nome.
- Filtro por categoria.
- Possibilidade de limpar os filtros.
- Quantidade de mapas encontrados, quando fizer sentido.

**Regras Tecnicas:**

- Os filtros devem ser funcionais utilizando apenas JavaScript/React.
- Nao utilizar bibliotecas externas para implementar os filtros.

---

## Grid de Mapas

Os mapas devem ser apresentados em um grid responsivo.

Cada mapa deve possuir um card contendo:

- Imagem/thumbnail do mapa.
- Nome do mapa.
- Categoria ou tipo.
- Informacoes complementares quando disponiveis.
- Estado de selecao.

**Regras para Imagens:**

- As imagens devem utilizar placeholders quando nao houver imagens disponiveis.
- Utilizar a URL: `https://placehold.co/`
- Nao gerar imagens para este projeto.
- Os placeholders devem possuir proporcoes adequadas ao conteudo e a resolucao da tela.

---

## Estilo dos Cards

Os cards devem possuir aparencia inspirada em interfaces de jogos competitivos.

**Caracteristicas desejadas:**

- Fundo escuro.
- Bordas discretas.
- Contraste elevado.
- Imagem ocupando a maior parte do card.
- Informacoes posicionadas de maneira organizada.
- Hover visual.
- Estado selecionado claramente destacado.
- Transicoes suaves.

**Identidade Visual e Selecao:**

- O mapa selecionado deve apresentar um destaque utilizando a cor principal da plataforma: `#723EC3`.
- O estado selecionado deve ser facilmente identificado mesmo sem depender exclusivamente de cor.

---

## Area de Detalhes do Mapa

Ao selecionar um mapa, a interface deve apresentar uma area de informacoes detalhadas.

**Layout e Posicionamento:**
Essa area pode aparecer:

- Abaixo dos cards; ou
- Em um painel lateral; ou
- Em uma composicao responsiva que se adapte ao tamanho da tela.

**Conteudo da Area de Detalhes:**

- Nome do mapa.
- Imagem de destaque.
- Descricao.
- Categoria.
- Informacoes relevantes para a partida.
- Estado de selecao.

A implementacao deve seguir o padrao visual encontrado nas demais paginas do projeto.

---

## Selecao e Interatividade

A selecao deve funcionar de forma interativa.

**Comportamento:**

- Ao clicar em um mapa:
  - O card deve receber o estado de selecionado.
  - O painel de detalhes deve ser atualizado.
  - O mapa anteriormente selecionado deve perder o estado de selecao.
- A interface deve fornecer feedback visual.
- O estado selecionado deve ser mantido no estado do React.

**Tecnologia:**

- A implementacao deve utilizar React e JavaScript.
