import { useState } from 'react';
import '../css/lista-amigos.css';

const MOCK_FRIENDS = [
  { id: 1, name: "FalleN", status: "online", game: "CS2" },
  { id: 2, name: "coldzera", status: "offline" },
  { id: 3, name: "fer", status: "online", game: "CS2" },
  { id: 4, name: "TACO", status: "online" },
  { id: 5, name: "fnx", status: "offline" },
  { id: 6, name: "gaules", status: "online", game: "Streaming" },
];

function ListaAmigos() {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => setIsOpen(!isOpen);

  const onlineFriends = MOCK_FRIENDS.filter(f => f.status === 'online').length;

  return (
    <div id="widget-amigos" className={isOpen ? 'open' : ''}>
      <button className="amigos-toggle" onClick={togglePanel}>
        <div className="amigos-toggle-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icone-amigos">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Amigos
        </div>
        <span className="amigos-badge">{onlineFriends} Online</span>
      </button>

      {isOpen && (
        <div className="amigos-panel">
          <div className="amigos-header">
            <h3>Lista de Amigos</h3>
            <button className="close-btn" onClick={togglePanel}>&times;</button>
          </div>
          <div className="amigos-lista">
            {MOCK_FRIENDS.map(friend => (
              <div key={friend.id} className="amigo-item">
                <div className="amigo-avatar">
                  <img src={`https://placehold.co/40x40/333/fff?text=${friend.name.charAt(0)}`} alt={friend.name} />
                  <span className={`status-dot ${friend.status}`}></span>
                </div>
                <div className="amigo-info">
                  <span className="amigo-nome">{friend.name}</span>
                  {friend.status === 'online' && friend.game && (
                    <span className="amigo-jogo">Jogando {friend.game}</span>
                  )}
                  {friend.status === 'offline' && (
                    <span className="amigo-offline">Offline</span>
                  )}
                </div>
                <button className="btn-convidar" title="Convidar para jogar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaAmigos;
