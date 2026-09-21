import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import Regras from './Regras';
import Torneios from './Torneios';
import Faq from './Faq';
import Entrar from './Entrar';
import Cadastrar from './Cadastrar';

function App() {
  const location = useLocation();

  return (
    <div>
      {/* Cabeçalho Fixo com Efeito Glass */}
      <header className="cabecalho">
        <div className="logo">
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            CS:GO <span className="roxo">TOURNAMENTS</span>
          </Link>
        </div>
        <nav className="links">
          <Link to="/" className={location.pathname === '/' ? 'ativo' : ''}>
            Início
          </Link>
          <Link to="/torneios" className={location.pathname === '/torneios' ? 'ativo' : ''}>
            Torneios
          </Link>
          <Link to="/regras" className={location.pathname === '/regras' ? 'ativo' : ''}>
            Regras
          </Link>
          <Link to="/faq" className={location.pathname === '/faq' ? 'ativo' : ''}>
            FAQ
          </Link>
        </nav>
        <div className="user-area">
          <Link to="/login" className="botao-login">
            Entrar
          </Link>
          <Link to="/cadastro" className="botao-cadastrar">
            Cadastrar
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal com Rotas */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/regras" element={<Regras />} />
        <Route path="/torneios" element={<Torneios />} />
          <Route path="/torneios/:id" element={<Torneios />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/login" element={<Entrar />} />
        <Route path="/cadastro" element={<Cadastrar />} />
      </Routes>

      {/* Rodapé Simples */}
      <footer className="rodape">
        <p>&copy; 2026 CS:GO Tournaments. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default App;