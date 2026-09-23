import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './componentes/Home';
import Regras from './componentes/Regras';
import Torneios from './componentes/Torneios';
import Faq from './componentes/Faq';
import Entrar from './componentes/Entrar';
import Cadastrar from './componentes/Cadastrar';
import EsqueciSenha from './componentes/EsqueciSenha';
import AdminPanel from './componentes/AdminPanel';
import Perfil from './componentes/Perfil';

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
          <Link to="/torneios" className={location.pathname.startsWith('/torneios') ? 'ativo' : ''}>
            Torneios
          </Link>
          <Link to="/regras" className={location.pathname === '/regras' ? 'ativo' : ''}>
            Regras
          </Link>
          <Link to="/faq" className={location.pathname === '/faq' ? 'ativo' : ''}>
            FAQ
          </Link>
          <Link to="/perfil" className={location.pathname === '/perfil' ? 'ativo' : ''}>
            Perfil
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
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>

      {/* Rodapé Simples */}
      <footer className="rodape">
        <p>&copy; 2026 CS:GO Tournaments. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default App;