import { useState } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
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
  const [abaAtiva, setAbaAtiva] = useState('amigos'); // 'amigos' | 'pendentes'
  const [amigos, setAmigos] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const togglePanel = () => setIsOpen(!isOpen);

  const onlineFriends = MOCK_FRIENDS.filter(f => f.status === 'online').length;
  // Carrega e sincroniza o usuário logado
  useEffect(() => {
    const lerUsuarioStorage = () => {
      const salvo = localStorage.getItem('usuarioLogado');
      if (salvo) {
        try {
          return JSON.parse(salvo);
        } catch (err) {
          console.error('Erro ao interpretar usuarioLogado:', err);
          return null;
        }
      }
      return null;
    };

    setUsuarioLogado(lerUsuarioStorage());

    const handler = () => setUsuarioLogado(lerUsuarioStorage());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Busca lista de amigos e pendências no Supabase
  const carregarAmizades = useCallback(async () => {
    if (!usuarioLogado?.id) return;
    setCarregando(true);

    try {
      // 1. Amizades aceitas
      const { data: aceitas, error: errAceitas } = await supabase
        .from('amizades')
        .select(`
          id, status, registro,
          usuario1:id_usuario1 ( id, nome, nome_usuario, imagem, time_usuario ),
          usuario2:id_usuario2 ( id, nome, nome_usuario, imagem, time_usuario )
        `)
        .eq('status', 'ACEITO')
        .or(`id_usuario1.eq.${usuarioLogado.id},id_usuario2.eq.${usuarioLogado.id}`);

      if (errAceitas) throw errAceitas;

      if (aceitas) {
        const lista = aceitas
          .map((a) => {
            const u1 = Array.isArray(a.usuario1) ? a.usuario1[0] : a.usuario1;
            const u2 = Array.isArray(a.usuario2) ? a.usuario2[0] : a.usuario2;
            
            const amigo = String(u1?.id) === String(usuarioLogado.id) ? u2 : u1;
            if (!amigo) return null;
            return { ...amigo, amizade_id: a.id };
          })
          .filter(Boolean);

        setAmigos(lista);
      }

      // 2. Pedidos pendentes recebidos
      const { data: recebidos, error: errRecebidos } = await supabase
        .from('amizades')
        .select(`
          id, status, registro,
          remetente:id_usuario1 ( id, nome, nome_usuario, imagem, time_usuario )
        `)
        .eq('id_usuario2', usuarioLogado.id)
        .eq('status', 'PENDENTE');

      if (errRecebidos) throw errRecebidos;

      const pendentesTratados = (recebidos || []).map(p => ({
        ...p,
        remetente: Array.isArray(p.remetente) ? p.remetente[0] : p.remetente
      }));

      setPendentes(pendentesTratados);
    } catch (err) {
      console.error('Erro ao carregar amizades:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuarioLogado?.id]);

  useEffect(() => {
    if (isOpen && usuarioLogado?.id) {
      carregarAmizades();
    }
  }, [isOpen, carregarAmizades, usuarioLogado?.id]);

  async function aceitarPedido(amizade_id) {
    try {
      const { error } = await supabase
        .from('amizades')
        .update({ status: 'ACEITO' })
        .eq('id', amizade_id);

      if (error) throw error;
      carregarAmizades();
    } catch (err) {
      console.error('Erro ao aceitar pedido:', err);
    }
  }

  async function rejeitarPedido(amizade_id) {
    try {
      const { error } = await supabase
        .from('amizades')
        .delete()
        .eq('id', amizade_id);

      if (error) throw error;
      setPendentes((prev) => prev.filter((p) => p.id !== amizade_id));
    } catch (err) {
      console.error('Erro ao rejeitar pedido:', err);
    }
  }

  async function removerAmigo(amizade_id) {
    try {
      const { error } = await supabase
        .from('amizades')
        .delete()
        .eq('id', amizade_id);

      if (error) throw error;
      setAmigos((prev) => prev.filter((a) => a.amizade_id !== amizade_id));
    } catch (err) {
      console.error('Erro ao remover amigo:', err);
    }
  }

  const totalPendentes = pendentes.length;

  if (!usuarioLogado) return null;

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
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span className="amigos-badge">{amigos.length} amigos</span>
          {totalPendentes > 0 && (
            <span className="amigos-badge-alerta">{totalPendentes}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="amigos-panel">
          <div className="amigos-header">
            <h3>Lista de Amigos</h3>
            <h3>Amigos</h3>
            <button className="close-btn" onClick={togglePanel}>&times;</button>
          </div>

          <div className="amigos-abas">
            <button
              className={`amigos-aba ${abaAtiva === 'amigos' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('amigos')}
            >
              Lista ({amigos.length})
            </button>
            <button
              className={`amigos-aba ${abaAtiva === 'pendentes' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('pendentes')}
            >
              Pedidos
              {totalPendentes > 0 && <span className="aba-badge">{totalPendentes}</span>}
            </button>
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
            {carregando ? (
              <div className="amigos-carregando">Carregando...</div>
            ) : abaAtiva === 'amigos' ? (
              amigos.length === 0 ? (
                <div className="amigos-vazio">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                  <p>Nenhum amigo ainda.<br/>Adicione pelo seu perfil!</p>
                </div>
                <button className="btn-convidar" title="Convidar para jogar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
              ) : (
                amigos.map((amigo) => (
                  <div key={amigo.amizade_id} className="amigo-item">
                    <div className="amigo-avatar">
                      <img
                        src={amigo.imagem || `https://placehold.co/40x40/291547/ffffff?text=${(amigo.nome_usuario || amigo.nome || 'J').substring(0, 2).toUpperCase()}`}
                        alt={amigo.nome || amigo.nome_usuario}
                      />
                    </div>
                    <div className="amigo-info">
                      <span className="amigo-nome">{amigo.nome_usuario ? `@${amigo.nome_usuario}` : amigo.nome}</span>
                      <span className="amigo-equipe">{amigo.time_usuario || 'Sem equipe'}</span>
                    </div>
                    <button
                      className="btn-amigo-acao btn-remover"
                      onClick={() => removerAmigo(amigo.amizade_id)}
                      title="Remover amigo"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))
              )
            ) : (
              pendentes.length === 0 ? (
                <div className="amigos-vazio">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </button>
              </div>
            ))}
                  <p>Nenhum pedido pendente!</p>
                </div>
              ) : (
                pendentes.map((p) => (
                  <div key={p.id} className="amigo-item amigo-pedido">
                    <div className="amigo-avatar">
                      <img
                        src={p.remetente?.imagem || `https://placehold.co/40x40/291547/ffffff?text=${(p.remetente?.nome_usuario || 'J').substring(0, 2).toUpperCase()}`}
                        alt={p.remetente?.nome || p.remetente?.nome_usuario}
                      />
                    </div>
                    <div className="amigo-info">
                      <span className="amigo-nome">{p.remetente?.nome_usuario ? `@${p.remetente.nome_usuario}` : p.remetente?.nome}</span>
                      <span className="amigo-equipe">{p.remetente?.time_usuario || 'Sem equipe'}</span>
                    </div>
                    <div className="pedido-acoes">
                      <button
                        className="btn-amigo-acao btn-aceitar"
                        onClick={() => aceitarPedido(p.id)}
                        title="Aceitar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                      <button
                        className="btn-amigo-acao btn-rejeitar"
                        onClick={() => rejeitarPedido(p.id)}
                        title="Rejeitar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaAmigos;
export default ListaAmigos;