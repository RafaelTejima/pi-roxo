import { Link, useLocation } from 'react-router-dom';
import './menu.css';

export default function Menu({ children }) {
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

      {/* Conteúdo Principal */}
      {children}

      {/* Rodapé Simples */}
      <footer className="rodape">
        <p>&copy; 2026 CS:GO Tournaments. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
