import { useState } from 'react';
import './regras.css';

const regrasList = [
  {
    id: 1,
    title: '01. Uso de Programas Ilegais (Cheats / Hacks)',
    content: 'É estritamente proibido o uso de qualquer software de terceiros que conceda vantagem injusta (aimbots, wallhacks, triggers, scripts modificados, etc.). O sistema realiza checagens automáticas e qualquer infração resultará em banimento permanente da plataforma e perda de premiações.'
  },
  {
    id: 2,
    title: '02. Check-in e Horário das Partidas',
    content: 'As equipes devem realizar o check-in na página da partida dentro do prazo limite estipulado (geralmente 30 minutos antes do início do confronto). O não comparecimento da line-up completa no horário acarreta W.O. automático.'
  },
  {
    id: 3,
    title: '03. Comportamento e Conduta (Fair Play)',
    content: 'Ofensas graves, racismo, xenofobia, assédio ou qualquer tipo de toxicidade direcionada a adversários, staffs ou membros da própria equipe no chat de texto ou voz serão punidas com advertências, suspensões temporárias ou banimento definitivo.'
  },
  {
    id: 4,
    title: '04. Configuração das Contas e Smurfs',
    content: 'Cada jogador deve utilizar sua conta principal vinculada corretamente à plataforma (com SteamID verificada e nível mínimo exigido). O uso de contas secundárias (smurfs) para burlar restrições de elo ou banimentos é proibido e gera desclassificação imediata.'
  },
  {
    id: 5,
    title: '05. Substituições (Line-up e Reservas)',
    content: 'As equipes devidamente inscritas podem utilizar jogadores reservas cadastrados previamente no roster oficial do torneio. Substituições de última hora não cadastradas resultam em desclassificação sumária da equipe.'
  },
  {
    id: 6,
    title: '06. Pausas Técnicas e Táticas (Timeouts)',
    content: 'Cada equipe tem direito a pausas táticas conforme as regras padrão do jogo competitivo. Pausas técnicas (problemas de conexão, queda de energia ou hardware) devem ser comunicadas imediatamente aos administradores da sala.'
  },
  {
    id: 7,
    title: '07. Conexão, Quedas e Reconexão',
    content: 'Caso um jogador caia da partida, a equipe deve aguardar o limite de tempo estipulado pelo servidor para a reconexão. O jogo não será reiniciado por quedas individuais recorrentes após o pistol round inicial.'
  },
  {
    id: 8,
    title: '08. Divulgação de Resultados e Print Screen',
    content: 'Ao término de cada mapa/partida, o capitão da equipe vencedora é responsável por enviar o print screen (ou log oficial) comprovando o placar final no painel da plataforma para validação da chave.'
  },
  {
    id: 9,
    title: '09. Abertura de Protestos e Contestação (Tickets)',
    content: 'Qualquer acusação de irregularidade (suspeita de cheat, comportamento antidesportivo ou erro de configuração) deve ser aberta via ticket de suporte com provas anexadas (demos, prints ou vídeos) em até 2 horas após o fim da partida.'
  },
  {
    id: 10,
    title: '10. Uso de Bugs e Exploits de Mapas',
    content: 'É proibido explorar falhas estruturais dos mapas oficiais (pixels ilegais, bugs de bomba, visões através de paredes texturizadas ou saltos não intencionais). A infração invalida o round correspondente e pode desclassificar o time.'
  },
  {
    id: 11,
    title: '11. Transmissões (Streams) e Delay Obrigatório',
    content: 'Streamers e criadores de conteúdo que transmitirem suas partidas oficiais devem obrigatoriamente utilizar um delay mínimo de 90 segundos para evitar práticas de ghosting por parte dos adversários.'
  },
  {
    id: 12,
    title: '12. Premiações, Prazos e Pagamentos via PIX',
    content: 'As premiações em dinheiro serão pagas via PIX exclusivamente para a conta bancária em titularidade do capitão ou responsável legal cadastrado, em um prazo útil de até 7 dias após o encerramento do torneio e verificação anti-cheat.'
  },
  {
    id: 13,
    title: '13. Alterações de Line-up Durante o Torneio',
    content: 'Uma vez iniciado o campeonato, não é permitida a inclusão de novos jogadores na escalação titular ou reserva. Apenas os atletas inscritos na fase de grupos/início poderão atuar até o término do evento.'
  },
  {
    id: 14,
    title: '14. Decisões da Administração (Palavra Final)',
    content: 'Os administradores e árbitros da plataforma possuem soberania para tomar decisões em casos omissos neste regulamento. As deliberações da staff durante os campeonatos são definitivas e irrevogáveis.'
  },
  {
    id: 15,
    title: '15. Conexão com Servidores e Anti-Cheat Obrigatório',
    content: 'Todos os participantes devem possuir e manter ativo o software anti-cheat oficial exigido pela plataforma durante todas as partidas. A recusa ou falha na inicialização impede a entrada no servidor de jogo.'
  }
];

export default function Regras() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <main className="conteudo-principal">
      <div className="container-regras">
        <div className="secao-titulo">
          <span className="badge-regras">⚖️ Regulamento Oficial</span>
          <h1>REGRAS DO COMPETITIVO</h1>
          <p>
            Consulte abaixo todas as diretrizes, termos de conduta e padrões exigidos para participar dos nossos campeonatos de CS:GO. Clique em uma regra para expandir os detalhes.
          </p>
        </div>

        <div className="accordion">
          {regrasList.map((regra) => {
            const isOpen = !!openItems[regra.id];
            return (
              <div
                key={regra.id}
                className={`accordion-item ${isOpen ? 'ativo' : ''}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleItem(regra.id)}
                >
                  <span>{regra.title}</span>
                  <span className="icone-toggle">+</span>
                </button>
                <div className="accordion-body">
                  <p>{regra.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
