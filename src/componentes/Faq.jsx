import { useState } from 'react';
import '../css/faq.css';

const faqCategories = [
  {
    id: 'conta',
    title: 'Conta e Cadastro',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-usuario"><path fill="#450fe5" d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/></svg>,
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
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-trofeu"><path fill="rgb(255, 212, 59)" d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/></svg>,
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
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-dinheiro"><path fill="rgb(241, 191, 14)" d="M392 176L248 176L210.7 101.5C208.9 97.9 208 93.9 208 89.9C208 75.6 219.6 64 233.9 64L406.1 64C420.4 64 432 75.6 432 89.9C432 93.9 431.1 97.9 429.3 101.5L392 176zM233.6 224L406.4 224L455.1 264.6C521.6 320 560 402 560 488.5C560 536.8 520.8 576 472.5 576L167.4 576C119.2 576 80 536.8 80 488.5C80 402 118.4 320 184.9 264.6L233.6 224zM324 288C313 288 304 297 304 308L304 312C275.2 312.3 252 335.7 252 364.5C252 390.2 270.5 412.1 295.9 416.3L337.6 423.3C343.6 424.3 348 429.5 348 435.6C348 442.5 342.4 448.1 335.5 448.1L280 448C269 448 260 457 260 468C260 479 269 488 280 488L304 488L304 492C304 503 313 512 324 512C335 512 344 503 344 492L344 487.3C369 483.2 388 461.6 388 435.5C388 409.8 369.5 387.9 344.1 383.7L302.4 376.7C296.4 375.7 292 370.5 292 364.4C292 357.5 297.6 351.9 304.5 351.9L352 351.9C363 351.9 372 342.9 372 331.9C372 320.9 363 311.9 352 311.9L344 311.9L344 307.9C344 296.9 335 287.9 324 287.9z"/></svg>,
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
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-ferramentas"><path fill="rgb(255, 212, 59)" d="M102.8 57.3C108.2 51.9 116.6 51.1 123 55.3L241.9 134.5C250.8 140.4 256.1 150.4 256.1 161.1L256.1 210.7L346.9 301.5C380.2 286.5 420.8 292.6 448.1 320L574.2 446.1C592.9 464.8 592.9 495.2 574.2 514L514.1 574.1C495.4 592.8 465 592.8 446.2 574.1L320.1 448C292.7 420.6 286.6 380.1 301.6 346.8L210.8 256L161.2 256C150.5 256 140.5 250.7 134.6 241.8L55.4 122.9C51.2 116.6 52 108.1 57.4 102.7L102.8 57.3zM247.8 360.8C241.5 397.7 250.1 436.7 274 468L179.1 563C151 591.1 105.4 591.1 77.3 563C49.2 534.9 49.2 489.3 77.3 461.2L212.7 325.7L247.9 360.8zM416.1 64C436.2 64 455.5 67.7 473.2 74.5C483.2 78.3 485 91 477.5 98.6L420.8 155.3C417.8 158.3 416.1 166.6 416.1 166.6L416.1 208C416.1 216.8 423.3 224 432.1 224L473.5 224C477.7 224 481.8 222.3 484.8 219.3L541.5 162.6C549.1 155.1 561.8 156.9 565.6 166.9C572.4 184.6 576.1 203.9 576.1 224C576.1 267.2 558.9 306.3 531.1 335.1L482 286C448.9 253 403.5 240.3 360.9 247.6L304.1 190.8L304.1 161.1L303.9 156.1C303.1 143.7 299.5 131.8 293.4 121.2C322.8 86.2 366.8 64 416.1 63.9z" /></svg>,
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
