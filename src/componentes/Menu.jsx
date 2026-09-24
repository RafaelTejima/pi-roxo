import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './menu.css';

export default function Menu({ children }) {
  const location = useLocation();
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    const checarUsuario = () => {
      try {
        const salvo = localStorage.getItem('usuarioLogado');
        setUsuarioLogado(salvo ? JSON.parse(salvo) : null);
      } catch (error) {
        console.error('Erro ao fazer parse do usuarioLogado:', error);
        setUsuarioLogado(null);
      }
    };

    checarUsuario();

    window.addEventListener('storage', checarUsuario);
    return () => window.removeEventListener('storage', checarUsuario);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    setUsuarioLogado(null);
  };

  return (
    <div>
      {/* Cabeçalho Fixo com Efeito Glass */}
      <header className="cabecalho">
        <div className="logo">
          <Link to="/" className="titulo-animado-container" style={{ color: 'inherit', textDecoration: 'none' }}>
            {"CS:GO TOURNAMENTS".split("").map((char, index) => (
              <span
                key={index}
                className={`letra-animada${index >= 6 ? ' roxo' : ''}`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
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
          {usuarioLogado ? (
            <div className="menu-usuario-container">
              <button className="botao-perfil-trigger usuario-nome" type="button" title={usuarioLogado.email || usuarioLogado.nome}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-usuario"><path fill="#450fe5" d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/></svg> {usuarioLogado.nome || usuarioLogado.email || 'Usuário'}
              </button>

              <div className="dropdown-usuario">
                <Link className="item-dropdown" to="/perfil">
                  Perfil do Usuário
                </Link>
                {usuarioLogado.admin && (
                  <Link className="item-dropdown" to="/admin">
                    Painel Admin
                  </Link>
                )}
                <button 
                  type="button" 
                  onClick={handleLogout} 
                  className="item-dropdown item-sair"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="botao-login">
                Entrar
              </Link>
              <Link to="/cadastro" className="botao-cadastrar">
                Cadastrar
              </Link>
            </>
          )}
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
