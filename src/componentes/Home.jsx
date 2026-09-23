import { Link } from 'react-router-dom';
import armaazul from '../../imagens/armaazul.png';
import tiroem2 from '../../imagens/tiroem2.jpg';
import dandotiro from '../../imagens/dandotiro.jpg';

export default function Home() {
  return (
    <>
      {/* Seção Principal (Hero com Carrossel Automático) */}
      <main className="hero">
        <div className="carousel">
          <img src={armaazul} alt="CS:GO Banner 1" />
          <img src={tiroem2} alt="CS:GO Banner 2" />
          <img src={dandotiro} alt="CS:GO Banner 3" />
        </div>

        <div className="overlay"></div>

        <div className="hero-content">
          <span className="badge-temporada">🔥 TEMPORADA 2026 OFICIAL</span>
          <h1 className="titulo">DOMINE O SERVIDOR</h1>
          <p className="subtitulo">
            Participe dos melhores campeonatos de CS:GO, dispute premiações em dinheiro e leve sua equipe ao topo do cenário competitivo.
          </p>
          <div className="hero-botoes">
            <Link to="/torneios" className="botao-principal">
              VER TORNEIOS ATIVOS
            </Link>
            <Link to="/cadastro" className="botao-secundario">
              CRIAR SUA EQUIPE
            </Link>
          </div>
        </div>
      </main>

      {/* Estatísticas Rápidas da Plataforma */}
      <section className="stats-bar">
        <div className="stat-item">
          <h3>+R$ 150.000</h3>
          <p>Em Premiações</p>
        </div>
        <div className="stat-item">
          <h3>1.240</h3>
          <p>Times Registrados</p>
        </div>
        <div className="stat-item">
          <h3>540+</h3>
          <p>Torneios Realizados</p>
        </div>
        <div className="stat-item">
          <h3>24/7</h3>
          <p>Suporte Dedicado</p>
        </div>
      </section>

      {/* Seção de Informações / Recursos do Site */}
      <section className="sobre-site">
        <div className="secao-titulo">
          <h2>POR QUE JOGAR CONOSCO?</h2>
          <p>Estrutura profissional voltada para elevar o nível do competitivo nacional.</p>
        </div>

        <div className="container-cards">
          <div className="card-info">
            <div className="icone-card">🏆</div>
            <h2>Torneios Diários</h2>
            <p>Campeonatos frequentes divididos por elos e formatos (MD1 e MD3), garantindo partidas equilibradas e aprendizado constante.</p>
          </div>

          <div className="card-info">
            <div className="icone-card">💰</div>
            <h2>Premiações Reais</h2>
            <p>Dispute prize pools em dinheiro via PIX e premiações em skins exclusivas de alto valor para coroar os campeões.</p>
          </div>

          <div className="card-info">
            <div className="icone-card">📊</div>
            <h2>Ranking e Stats</h2>
            <p>Acompanhe o desempenho individual e da sua line-up através de placares automatizados, histórico e estatísticas detalhadas.</p>
          </div>
        </div>
      </section>
    </>
  );
}
