import { useState } from 'react';
import './faq.css';

const faqCategories = [
  {
    id: 'conta',
    title: 'Conta e Cadastro',
    icon: '👤',
    questions: [
      {
        id: 'c1',
        question: 'Como faço para criar minha conta na plataforma?',
        answer: 'Clique em "Cadastrar" no menu superior, preencha seus dados e vincule sua SteamID. Após confirmar seu e-mail, sua conta já estará pronta para se inscrever em torneios.'
      },
      {
        id: 'c2',
        question: 'Preciso ter a Steam vinculada para jogar?',
        answer: 'Sim. A vinculação da sua SteamID é obrigatória para validar identidade, checar nível de conta e liberar a participação em campeonatos oficiais.'
      },
      {
        id: 'c3',
        question: 'Esqueci minha senha, como recupero o acesso?',
        answer: 'Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas para o e-mail cadastrado para criar uma nova senha de acesso.'
      }
    ]
  },
  {
    id: 'torneios',
    title: 'Torneios',
    icon: '🏆',
    questions: [
      {
        id: 't1',
        question: 'Como faço para inscrever minha equipe em um torneio?',
        answer: 'Acesse a aba "Torneios", escolha o campeonato desejado e clique em "Inscrever Equipe". É necessário ter uma line-up completa cadastrada previamente no seu perfil.'
      },
      {
        id: 't2',
        question: 'Qual o formato dos campeonatos (MD1, MD3)?',
        answer: 'Depende do torneio: fases de grupos costumam ser MD1 (melhor de 1 mapa), enquanto fases eliminatórias e finais geralmente são disputadas em MD3 (melhor de 3 mapas).'
      },
      {
        id: 't3',
        question: 'Como funciona o sistema de bracket?',
        answer: 'O bracket é gerado automaticamente após o fechamento das inscrições, definindo os confrontos de cada fase. Você acompanha sua chave em tempo real na página do torneio.'
      },
      {
        id: 't4',
        question: 'Posso trocar um jogador da minha equipe após a inscrição?',
        answer: 'Substituições só são permitidas antes do início do campeonato, utilizando jogadores reservas já cadastrados no roster oficial da equipe.'
      }
    ]
  },
  {
    id: 'premiacoes',
    title: 'Premiações e Pagamentos',
    icon: '💰',
    questions: [
      {
        id: 'p1',
        question: 'Como recebo minha premiação em dinheiro?',
        answer: 'As premiações são pagas via PIX diretamente para a conta do capitão cadastrado, em até 7 dias úteis após o encerramento do torneio e a verificação anti-cheat.'
      },
      {
        id: 'p2',
        question: 'As premiações em skins são enviadas automaticamente?',
        answer: 'Sim, as skins são transferidas via Steam Trade para o perfil vinculado do vencedor assim que o resultado final do torneio é validado pela administração.'
      }
    ]
  },
  {
    id: 'suporte',
    title: 'Suporte',
    icon: '🛠️',
    questions: [
      {
        id: 's1',
        question: 'Suspeitei de cheat no adversário, o que eu faço?',
        answer: 'Abra um ticket de suporte com provas anexadas (demo, print ou vídeo) em até 2 horas após o fim da partida. Nossa equipe analisa e responde em até 24 horas.'
      },
      {
        id: 's2',
        question: 'Qual o horário de atendimento do suporte?',
        answer: 'Nosso suporte funciona 24 horas por dia, 7 dias por semana, com prioridade máxima durante partidas ao vivo de torneios oficiais.'
      },
      {
        id: 's3',
        question: 'Não encontrei minha dúvida aqui, como falo com vocês?',
        answer: 'Você pode abrir um chamado pela central de suporte no seu painel de usuário, informando o assunto e os detalhes da sua dúvida.'
      }
    ]
  }
];

export default function Faq() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <main className="conteudo-principal">
      <div className="container-faq">
        <div className="secao-titulo">
          <span className="badge-faq">💬 Central de Ajuda</span>
          <h1>PERGUNTAS FREQUENTES</h1>
          <p>
            Reunimos as dúvidas mais comuns sobre cadastro, torneios, premiações e suporte. Não encontrou o que precisava? Fale com a nossa equipe.
          </p>
        </div>

        {faqCategories.map((cat) => (
          <div key={cat.id} className="categoria-faq">
            <h2 className="categoria-titulo">
              <span className="categoria-icone">{cat.icon}</span> {cat.title}
            </h2>

            <div className="accordion">
              {cat.questions.map((q) => {
                const isOpen = !!openItems[q.id];
                return (
                  <div
                    key={q.id}
                    className={`accordion-item ${isOpen ? 'ativo' : ''}`}
                  >
                    <button
                      type="button"
                      className="accordion-header"
                      onClick={() => toggleItem(q.id)}
                    >
                      <span>{q.question}</span>
                      <span className="icone-toggle">+</span>
                    </button>
                    <div className="accordion-body">
                      <p>{q.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
