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
          <span className="badge-temporada">
            <svg viewBox="-33 0 255 255" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000" className="icone-svg icone-fogo">
              <defs>
                <linearGradient id="linear-gradient-1" gradientUnits="userSpaceOnUse" x1="94.141" y1="255" x2="94.141" y2="0.188">
                  <stop offset="0" stopColor="#ff4400" />
                  <stop offset="1" stopColor="#fc9502" />
                </linearGradient>
              </defs>
              <g id="fire">
                <path d="M187.899,164.809 C185.803,214.868 144.574,254.812 94.000,254.812 C42.085,254.812 -0.000,211.312 -0.000,160.812 C-0.000,154.062 -0.121,140.572 10.000,117.812 C16.057,104.191 19.856,95.634 22.000,87.812 C23.178,83.513 25.469,76.683 32.000,87.812 C35.851,94.374 36.000,103.812 36.000,103.812 C36.000,103.812 50.328,92.817 60.000,71.812 C74.179,41.019 62.866,22.612 59.000,9.812 C57.662,5.384 56.822,-2.574 66.000,0.812 C75.352,4.263 100.076,21.570 113.000,39.812 C131.445,65.847 138.000,90.812 138.000,90.812 C138.000,90.812 143.906,83.482 146.000,75.812 C148.365,67.151 148.400,58.573 155.999,67.813 C163.226,76.600 173.959,93.113 180.000,108.812 C190.969,137.321 187.899,164.809 187.899,164.809 Z" fill="url(#linear-gradient-1)" fillRule="evenodd" />
                <path d="M94.000,254.812 C58.101,254.812 29.000,225.711 29.000,189.812 C29.000,168.151 37.729,155.000 55.896,137.166 C67.528,125.747 78.415,111.722 83.042,102.172 C83.953,100.292 86.026,90.495 94.019,101.966 C98.212,107.982 104.785,118.681 109.000,127.812 C116.266,143.555 118.000,158.812 118.000,158.812 C118.000,158.812 125.121,154.616 130.000,143.812 C131.573,140.330 134.753,127.148 143.643,140.328 C150.166,150.000 159.127,167.390 159.000,189.812 C159.000,225.711 129.898,254.812 94.000,254.812 Z" fill="#fc9502" fillRule="evenodd" />
                <path d="M95.000,183.812 C104.250,183.812 104.250,200.941 116.000,223.812 C123.824,239.041 112.121,254.812 95.000,254.812 C77.879,254.812 69.000,240.933 69.000,223.812 C69.000,206.692 85.750,183.812 95.000,183.812 Z" fill="#fce202" fillRule="evenodd" />
              </g>
            </svg>
            TEMPORADA 2026 OFICIAL
          </span>
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
            <div className="icone-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-trofeu"><path fill="rgb(255, 212, 59)" d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/></svg>
            </div>
            <h2>Torneios Diários</h2>
            <p>Campeonatos frequentes divididos por elos e formatos (MD1 e MD3), garantindo partidas equilibradas e aprendizado constante.</p>
          </div>

          <div className="card-info">
            <div className="icone-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-dinheiro"><path fill="rgb(241, 191, 14)" d="M392 176L248 176L210.7 101.5C208.9 97.9 208 93.9 208 89.9C208 75.6 219.6 64 233.9 64L406.1 64C420.4 64 432 75.6 432 89.9C432 93.9 431.1 97.9 429.3 101.5L392 176zM233.6 224L406.4 224L455.1 264.6C521.6 320 560 402 560 488.5C560 536.8 520.8 576 472.5 576L167.4 576C119.2 576 80 536.8 80 488.5C80 402 118.4 320 184.9 264.6L233.6 224zM324 288C313 288 304 297 304 308L304 312C275.2 312.3 252 335.7 252 364.5C252 390.2 270.5 412.1 295.9 416.3L337.6 423.3C343.6 424.3 348 429.5 348 435.6C348 442.5 342.4 448.1 335.5 448.1L280 448C269 448 260 457 260 468C260 479 269 488 280 488L304 488L304 492C304 503 313 512 324 512C335 512 344 503 344 492L344 487.3C369 483.2 388 461.6 388 435.5C388 409.8 369.5 387.9 344.1 383.7L302.4 376.7C296.4 375.7 292 370.5 292 364.4C292 357.5 297.6 351.9 304.5 351.9L352 351.9C363 351.9 372 342.9 372 331.9C372 320.9 363 311.9 352 311.9L344 311.9L344 307.9C344 296.9 335 287.9 324 287.9z"/></svg>
            </div>
            <h2>Premiações Reais</h2>
            <p>Dispute prize pools em dinheiro via PIX e premiações em skins exclusivas de alto valor para coroar os campeões.</p>
          </div>

          <div className="card-info">
            <div className="icone-card">
              <i className="fa-solid fa-square-poll-vertical icone-grafico" style={{ color: "rgb(255, 212, 59)" }}></i>
            </div>
            <h2>Ranking e Stats</h2>
            <p>Acompanhe o desempenho individual e da sua line-up através de placares automatizados, histórico e estatísticas detalhadas.</p>
          </div>
        </div>
      </section>
    </>
  );
}
