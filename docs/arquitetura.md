# Arquitetura
Este projeto é feito em React + Vite, usando o Vite na versão 5.

## Tecnologias
- **Componentização:**
    - Este projeto usa pouca ou nenhuma componentização 
    - Considere que todas as páginas podem ser monoblocos
    - Crie componentes apenas quando necessário ou pedido, e deixe isso claro no plano de implementação
- **Estilização:**
    - Este projeto não usa nenhuma biblioteca ou framework de estilos
    - Este projeto usa CSS puro
    - Deve haver o arquivo `src/index.css` para estilização geral da página
    - Cada página/componente deve ter seu próprio CSS
    - Não use style-components
    - Cada tela deve ter um ID único que contém o CSS dentro dela e não deixa vazar para próxima tela
- **Rotas:**
    - Este projeto usa o `React Router Dom` para rotas
    - As rotas devem ser protegidas pela autenticação do usuário
- **Banco de dados e API:**
    - Este projeto usa **Supabase**
    - Este projeto usa uma API do Supabase para comunicação com o banco de dados

### RLS
Todas as tabelas do banco do supabase, por enquanto, estão com RLS desligados.

## Etapas do desenvolvimento
Este projeto é separado em três etapas de desenvolvimento:
1. **Front-end e design:** apenas HTML e CSS com auxílio do React para estruturas. Não há códigos, não há conexão com API, não há lógica de programação em geral
2. **Busca na API:** as telas se conectam com a API apenas para buscas e exibição do conteúdo na tela de forma simples, usando `map` e poucos `useState` e `useEffect`. A autenticação deve funcionar neste momento.
3. **Inserção e relação de dados:** as telas podem inserir dados na tabela. Devem ser feito as conexões com os inputs e validação de dados em geral. Também deve ser feito o tratamento de chaves estrangeiras.
4. **Testes e validação:** o sistema está finalizado e este é o momento de testes e pequenos ajustes gerais, build final e publicação do projeto.

## Referências
- Explore a minha pasta `docs/referencias`
- Entenda como eu programo
- Entenda as tags que eu conheço
- Entenda o meu nível de conhecimento em programação
- Você deve fazer parecido para que eu possa compreender o seu código
- Você pode usar tags e estilos novos se necessário, mas faça isso de forma contida

## O que NUNCA não fazer
- Não instale pacotes sem a minha permissão
- Se necessário instalar pacotes, deixe bem claro e evidente no plano de implementação

## O que SEMPRE fazer
- Crie planos de implementação para features maiores do sistema
- Não precisa criar planos de implementação para pequenas correções ou ajustes
- Sempre me dê opções e formas diferentes de fazer algo no plano de implementação
- Sempre eu enviar comandos ou pedir tarefas que pareçam mal pensadas ou ruins, me indage e ajude-me a pensar em uma saída melhor