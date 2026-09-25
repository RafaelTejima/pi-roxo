# Contexto da pagina de suporte

## Objetivo

Criar uma pagina para que jogadores e equipes entrem em contato com o suporte da plataforma de campeonatos de CS2. O formulario deve ajudar a equipe a entender o problema, localizar o torneio ou a partida relacionada e responder pelo e-mail informado.

Esta pagina complementa a FAQ. Ela nao substitui as respostas da FAQ nem implementa, por si so, o envio ou o acompanhamento de chamados.

## Acesso e navegacao

- Rota sugerida: `/suporte`.
- A FAQ deve oferecer um link ou botao para abrir o formulario quando a pessoa nao encontrar uma resposta.
- O formulario pode ser acessado sem login para que problemas de acesso a conta tambem possam ser reportados.
- Quando houver usuario autenticado, preencher nome e e-mail com os dados disponiveis. Permitir que a pessoa confirme ou corrija esses dados antes do envio.
- A pagina deve usar o menu global existente e manter o tema escuro como padrao, com suporte ao tema claro e destaque roxo `#723EC3`.

## Campos do formulario

| Campo | Obrigatorio | Comportamento |
| --- | --- | --- |
| Nome | Sim | Preencher com o nome do usuario autenticado, quando disponivel. |
| E-mail para resposta | Sim | Preencher com o e-mail da conta quando disponivel; validar formato. |
| Categoria | Sim | Seletor: Conta e acesso, Torneios e inscricoes, Partidas e bracket, Denuncia de trapaça, Premiacao e pagamentos, Problema tecnico ou Outro. |
| Assunto | Sim | Resumo curto do pedido. |
| Descricao | Sim | Explicar o que aconteceu, incluindo passos para reproduzir quando for um erro. |
| Torneio relacionado | Nao | Identificador ou selecao de torneio, quando o pedido envolver um campeonato. |
| Partida relacionada | Nao | Identificador ou selecao de partida, quando disponivel e relevante. |
| Evidencias | Nao | Permitir informar links ou anexar arquivos, se o armazenamento de arquivos estiver configurado. |

Para denuncias de trapaça, orientar a pessoa a incluir a partida, o horario aproximado e evidencias relevantes, como demo, captura de tela ou video. Nao solicitar senha, codigo de autenticacao ou dados completos de pagamento.

## Validacao e estados da interface

- Validar os campos obrigatorios e o formato do e-mail antes de enviar.
- Exibir mensagens de erro junto ao campo correspondente, sem apagar os dados preenchidos.
- Durante o envio, indicar carregamento e impedir envios duplicados.
- Em caso de sucesso, confirmar que o pedido foi recebido e apresentar um numero de protocolo somente quando esse identificador existir no backend.
- Em caso de falha, explicar que o pedido nao foi enviado e permitir tentar novamente.
- Usar `label` associado a cada campo, indicar campos obrigatorios e manter navegacao por teclado e foco visivel.
- Em telas pequenas, organizar os campos em uma coluna e impedir que botoes ou textos ultrapassem a largura da tela.

## Fluxo esperado

1. A pessoa abre o formulario pela FAQ ou por outro link visivel na plataforma.
2. Seleciona a categoria e descreve o problema; informa dados do torneio ou da partida se forem pertinentes.
3. A interface valida os dados e mostra os estados de envio, sucesso ou erro.
4. Na etapa de integracao, o chamado e persistido e fica disponivel para a equipe de suporte.
5. A resposta e enviada ao e-mail informado. O acompanhamento dentro do site pode ser adicionado depois, caso exista uma area de chamados.

## Integracao e dados

A arquitetura do projeto usa React, CSS puro e Supabase. A primeira etapa pode montar a pagina e validar a experiencia visualmente; o envio real depende da definicao da tabela, das permissoes e do destino de evidencias.

Como proposta inicial, um chamado pode guardar: identificador, usuario relacionado quando autenticado, nome, e-mail de resposta, categoria, assunto, descricao, identificadores opcionais do torneio e da partida, estado, data de criacao e resposta da equipe. Os nomes finais das colunas devem seguir o schema real do Supabase.

Antes de colocar dados reais em producao, definir politicas de acesso para que usuarios so possam criar e consultar os proprios chamados e a equipe autorizada possa responde-los. O projeto informa que o RLS das tabelas esta desligado; nao expor chamados ou evidencias por consultas publicas. Upload de arquivos exige definir armazenamento, tipos e limites aceitos, e validacao de acesso.

## Consistencia com a FAQ

A FAQ atual informa atendimento 24 horas por dia e resposta em ate 24 horas para denuncias de trapaça enviadas em ate 2 horas apos a partida. A pagina de suporte deve usar a mesma orientacao, mas esses prazos precisam ser confirmados como compromisso operacional antes de serem apresentados como garantia.

## Decisoes pendentes

- Definir se o envio de evidencias sera por upload ou por links.
- Definir tabela, estados do chamado, regras RLS e quem pode acessar o painel de suporte.
- Definir se a resposta sera feita apenas por e-mail ou tambem dentro da plataforma.
- Confirmar os prazos de atendimento apresentados atualmente na FAQ.
