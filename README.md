# PI Roxo — Plataforma de E-Sports

Plataforma web para organização de campeonatos de e-sports, com foco no jogo **Counter-Strike 2 (CS2)**. Desenvolvida como Projeto Integrador por dois grupos colaborativos do SENAC.

---

## Grupos

### Grupo Vermelho (desenvolvimento principal)

| Integrante | Responsabilidade |
|---|---|
| Rafael | Cadastro, login, bracket, seleção de mapas |
| Fellipe | Página de criação de torneio |
| Gabriel | Página inicial, Regras e FAQ |
| Marianne | Perfil do usuário |

### Grupo Roxo (colaboração)

- Pedro
- Guilherme
- Henrique
- Caynan

---

## Sobre o Projeto

O PI Roxo é uma aplicação web que oferece:

- **Sistema de autenticação** — cadastro e login de usuários
- **Criação de torneios** — com sistema de bracket para organização de confrontos
- **Seleção de mapas** — para configuração das partidas
- **Perfil do usuário** — gerenciamento de dados pessoais
- **Página inicial** — apresentação da plataforma
- **Regras e FAQ** — informações e perguntas frequentes
- **Painel administrativo** — gestão geral da plataforma

O site adota **tema escuro** com cor principal **roxo (#723EC3)** e é totalmente responsivo.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| [React 19](https://react.dev/) | Biblioteca de interface |
| [Vite 8](https://vite.dev/) | Bundler e servidor de desenvolvimento |
| [React Router DOM 7](https://reactrouter.com/) | Roteamento com rotas protegidas |
| [Supabase](https://supabase.com/) | Banco de dados e autenticação via API |
| CSS puro | Estilização sem frameworks externos |

---

## Estrutura de Pastas

```
pi-roxo/
├── docs/                # Documentação do projeto (contexto, arquitetura, backlog)
├── public/              # Arquivos estáticos públicos
├── src/
│   ├── index.css        # CSS global
│   ├── main.jsx         # Ponto de entrada da aplicação
│   ├── App.jsx          # Roteamento principal
│   ├── supabase.js      # Configuração do cliente Supabase
│   ├── Home.jsx         # Página inicial
│   ├── Entrar.jsx       # Login
│   ├── Cadastrar.jsx    # Cadastro
│   ├── EsqueciSenha.jsx # Recuperação de senha
│   ├── Torneios.jsx     # Listagem e criação de torneios
│   ├── Faq.jsx          # Perguntas frequentes
│   ├── Regras.jsx       # Regras da plataforma
│   └── AdminPanel.jsx   # Painel administrativo
├── index.html
├── package.json
└── vite.config.js
```

---

## Como Rodar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- npm

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd pi-roxo

# Instale as dependências
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### Executando

```bash
npm run dev
```

Acesse em: `http://localhost:5173`

### Scripts disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Gera o build de produção
npm run preview  # Visualiza o build de produção localmente
npm run lint     # Verifica erros de lint
```

---

## Etapas de Desenvolvimento

1. **Front-end e design** — estrutura HTML/CSS com React, sem lógica de negócio
2. **Busca na API** — conexão com Supabase para leitura e exibição de dados; autenticação funcional
3. **Inserção e relação de dados** — inputs, validações e chaves estrangeiras
4. **Testes e validação** — ajustes finais, build e publicação

---

## Documentação Interna

Consulte a pasta [`docs/`](./docs) para entender a arquitetura, o backlog de features e as decisões de design do projeto.

