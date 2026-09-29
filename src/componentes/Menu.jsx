import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAlerta } from './AlertaModal';
import { supabase } from '../supabase';

import './menu.css';

export default function Menu({ children }) {
  const location = useLocation();
  const { mostrarAlerta } = useAlerta();
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const salvo = localStorage.getItem('usuarioLogado');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });
  const [menuAberto, setMenuAberto] = useState(false);
  const [buscaAmigo, setBuscaAmigo] = useState('');
  const [amigosDropdown, setAmigosDropdown] = useState(() => {
    try {
      const salvas = localStorage.getItem('listaAmigosUsuario');
      return salvas ? JSON.parse(salvas) : [];
    } catch {
      return [];
    }
  });
  const amigos = amigosDropdown;
  const setAmigos = setAmigosDropdown;

  const isBuscandoAmigosRef = useRef(false);

  // Busca consolidada e validação cruzada rigorosa contra a tabela 'usuarios' do Supabase
  const carregarAmigosConsolidados = useCallback(async (usuarioAtual) => {
    const salvo = localStorage.getItem('usuarioLogado');
    const user = usuarioAtual || (salvo ? JSON.parse(salvo) : null);
    if (!user?.id || !supabase) {
      setAmigosDropdown([]);
      return;
    }

    if (isBuscandoAmigosRef.current) return;
    isBuscandoAmigosRef.current = true;

    try {
      // 1. Buscar todas as amizades do usuário no Supabase
      const { data: aceitas, error: errAceitas } = await supabase
        .from('amizades')
        .select('id, status, id_usuario1, id_usuario2')
        .or(`id_usuario1.eq.${user.id},id_usuario2.eq.${user.id}`);

      if (errAceitas) throw errAceitas;

      const relacoesAceitas = (aceitas || []).filter(
        (a) => String(a.status).toUpperCase() === 'ACEITO'
      );

      // Extrair IDs de amigos reais confirmados na tabela amizades
      const idsAmigosBanco = [
        ...new Set(
          relacoesAceitas.map((a) =>
            String(a.id_usuario1) === String(user.id) ? String(a.id_usuario2) : String(a.id_usuario1)
          )
        )
      ].filter(Boolean);

      // Ler cache local existente para validação cruzada
      let amigosStorage = [];
      try {
        const salvas = localStorage.getItem('listaAmigosUsuario');
        if (salvas) amigosStorage = JSON.parse(salvas);
      } catch {}

      const idsParaValidar = [
        ...new Set([
          ...idsAmigosBanco,
          ...amigosStorage.map((a) => String(a.id))
        ])
      ].filter(Boolean);

      // Se não há nenhum amigo válido no banco nem no cache
      if (idsParaValidar.length === 0 || idsAmigosBanco.length === 0) {
        setAmigosDropdown([]);
        localStorage.setItem('listaAmigosUsuario', JSON.stringify([]));
        localStorage.setItem('listaAmigosPerfil', JSON.stringify([]));
        return;
      }

      // 2. Validação cruzada estrita na tabela 'usuarios' (sem time_usuario)
      const { data: usuariosAtivos, error: errVal } = await supabase
        .from('usuarios')
        .select('id, nome, nome_usuario, imagem, status')
        .in('id', idsParaValidar);

      if (errVal) throw errVal;

      // Buscar equipes dos amigos via times_integrantes
      const mapaTimes = new Map();
      try {
        const { data: membrosTimes } = await supabase
          .from('times_integrantes')
          .select(`
            id_usuario,
            funcao,
            times ( id, nome, tag )
          `)
          .in('id_usuario', idsParaValidar);

        (membrosTimes || []).forEach((m) => {
          const t = Array.isArray(m.times) ? m.times[0] : m.times;
          if (t) {
            const rotulo = t.tag ? `[${t.tag}] ${t.nome}` : t.nome;
            mapaTimes.set(String(m.id_usuario), rotulo);
          }
        });
      } catch (eTimes) {
        console.warn('Erro ao carregar times dos amigos no Menu:', eTimes);
      }

      const mapaAtivos = new Map((usuariosAtivos || []).map((u) => [String(u.id), u]));
      const amigosValidados = [];
      const idsVistos = new Set();

      for (const rel of relacoesAceitas) {
        const amigoId = String(rel.id_usuario1) === String(user.id)
          ? String(rel.id_usuario2)
          : String(rel.id_usuario1);

        if (mapaAtivos.has(amigoId) && !idsVistos.has(amigoId)) {
          idsVistos.add(amigoId);
          const u = mapaAtivos.get(amigoId);
          amigosValidados.push({
            id: u.id,
            amizade_id: rel.id,
            name: u.nome_usuario || u.nome || 'Jogador',
            nome: u.nome || u.nome_usuario,
            nome_usuario: u.nome_usuario || u.nome,
            time_usuario: mapaTimes.get(amigoId) || 'Sem equipe',
            imagem: u.imagem || '',
            status: u.status || 'online',
            game: 'CS2'
          });
        } else if (!mapaAtivos.has(amigoId)) {
          // Amigo foi deletado da tabela usuarios: expurga imediatamente o registro órfão
          if (rel.id) {
            supabase.from('amizades').delete().eq('id', rel.id).catch(() => {});
          }
        }
      }

      // 3. Forçar imediatamente a atualização do estado local do dropdown e sobrescrever o localStorage
      setAmigosDropdown(amigosValidados);
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(amigosValidados));
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(amigosValidados));
    } catch (err) {
      console.warn('Erro ao carregar e validar amigos no Menu:', err);
    } finally {
      isBuscandoAmigosRef.current = false;
    }
  }, []);

  const checarUsuario = useCallback(() => {
    try {
      const salvo = localStorage.getItem('usuarioLogado');
      const user = salvo ? JSON.parse(salvo) : null;
      setUsuarioLogado((prev) => {
        if (!user && !prev) return null;
        if (
          user &&
          prev &&
          String(user.id) === String(prev.id) &&
          user.nome === prev.nome &&
          user.email === prev.email &&
          user.imagem === prev.imagem &&
          user.admin === prev.admin
        ) {
          return prev;
        }
        return user;
      });
      return user;
    } catch {
      setUsuarioLogado(null);
      return null;
    }
  }, []);

  const amigosFiltrados = useMemo(() => {
    const termo = buscaAmigo.trim().toLowerCase();
    if (!termo) return amigosDropdown;

    return amigosDropdown.filter((amigo) => {
      const nome = (amigo.name || amigo.nome || amigo.nome_usuario || '').toLowerCase();
      const jogo = (amigo.game || '').toLowerCase();
      return nome.includes(termo) || jogo.includes(termo);
    });
  }, [amigosDropdown, buscaAmigo]);

  // Revalidação sob demanda ao abrir o dropdown
  useEffect(() => {
    if (!menuAberto) {
      setBuscaAmigo('');
    } else {
      const salvo = localStorage.getItem('usuarioLogado');
      const user = salvo ? JSON.parse(salvo) : null;
      if (user?.id) {
        carregarAmigosConsolidados(user);
      }
    }
  }, [menuAberto, carregarAmigosConsolidados]);

  const handleRemoverAmigo = async (e, amigo) => {
    e.stopPropagation();
    e.preventDefault();

    const novaLista = amigosDropdown.filter((a) => a.id !== amigo.id);
    setAmigosDropdown(novaLista);
    try {
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(novaLista));
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(novaLista));
      window.dispatchEvent(new Event('amigosAtualizados'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }

    if (amigo.amizade_id && supabase) {
      try {
        await supabase.from('amizades').delete().eq('id', amigo.amizade_id);
      } catch (err) {
        console.warn('Erro ao remover amizade do Supabase:', err);
      }
    }

    mostrarAlerta({
      titulo: 'Amizade Removida',
      mensagem: `${amigo.name || amigo.nome || 'Jogador'} foi removido da sua lista de amigos.`,
      tipo: 'aviso'
    });
  };

  const handleBloquearAmigo = async (e, amigo) => {
    e.stopPropagation();
    e.preventDefault();

    const novaLista = amigosDropdown.filter((a) => a.id !== amigo.id);
    setAmigosDropdown(novaLista);
    try {
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(novaLista));
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(novaLista));
      const bloqueados = JSON.parse(localStorage.getItem('amigosBloqueados') || '[]');
      if (!bloqueados.includes(amigo.id)) {
        bloqueados.push(amigo.id);
        localStorage.setItem('amigosBloqueados', JSON.stringify(bloqueados));
      }
      window.dispatchEvent(new Event('amigosAtualizados'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }

    if (amigo.amizade_id && supabase) {
      try {
        const salvo = localStorage.getItem('usuarioLogado');
        const user = salvo ? JSON.parse(salvo) : null;
        await supabase
          .from('amizades')
          .update({ status: 'BLOQUEADO', id_usuario1: user?.id, id_usuario2: amigo.id })
          .eq('id', amigo.amizade_id);
      } catch (err) {
        console.warn('Erro ao bloquear amigo no Supabase:', err);
      }
    }

    mostrarAlerta({
      titulo: 'Jogador Bloqueado',
      mensagem: `${amigo.name || amigo.nome || 'Jogador'} foi bloqueado com sucesso.`,
      tipo: 'erro'
    });
  };

  // Ciclo de vida global: montagem única com listeners protegidos e sem dependência de location.pathname
  useEffect(() => {
    const user = checarUsuario();
    if (user?.id) {
      carregarAmigosConsolidados(user);
    }

    const sincronizarAuthEAmigos = () => {
      const u = checarUsuario();
      if (u?.id) {
        carregarAmigosConsolidados(u);
      } else {
        setAmigosDropdown([]);
      }
    };

    const onAmigosAtualizados = () => {
      const salvo = localStorage.getItem('usuarioLogado');
      const u = salvo ? JSON.parse(salvo) : null;
      if (u?.id) {
        carregarAmigosConsolidados(u);
      } else {
        setAmigosDropdown([]);
      }
    };

    window.addEventListener('authAtualizada', sincronizarAuthEAmigos);
    window.addEventListener('storage', sincronizarAuthEAmigos);
    window.addEventListener('amigosAtualizados', onAmigosAtualizados);
    return () => {
      window.removeEventListener('authAtualizada', sincronizarAuthEAmigos);
      window.removeEventListener('storage', sincronizarAuthEAmigos);
      window.removeEventListener('amigosAtualizados', onAmigosAtualizados);
    };
  }, [checarUsuario, carregarAmigosConsolidados]);

  // Fechar o menu dropdown ao clicar fora com cleanup obrigatório
  useEffect(() => {
    const fecharAoClicarFora = (e) => {
      if (!e.target.closest('.menu-usuario-container')) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('click', fecharAoClicarFora);
    return () => document.removeEventListener('click', fecharAoClicarFora);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('listaAmigosUsuario');
    localStorage.removeItem('listaAmigosPerfil');
    setUsuarioLogado(null);
    setAmigosDropdown([]);
    setMenuAberto(false);
    window.dispatchEvent(new Event('authAtualizada'));
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
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
        <nav className="val-nav">
          <div className="nav-line-container">
            <div className="nav-line"></div>
          </div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'ativo nav-item-ativo' : ''}`}
          >
            <div className="play-bg"></div>
            <span className="play-text">INÍCIO</span>
            <span className="diamond indicador-losango" aria-hidden="true"></span>
          </NavLink>
          <NavLink
            to="/equipes"
            className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/equipes') ? 'ativo nav-item-ativo' : ''}`}
          >
            <div className="play-bg"></div>
            <span className="play-text">TIMES</span>
            <span className="diamond indicador-losango" aria-hidden="true"></span>
          </NavLink>
          <NavLink
            to="/torneios"
            className={({ isActive }) => `nav-link nav-link-torneios ${isActive || location.pathname.startsWith('/torneios') ? 'ativo nav-item-ativo' : ''}`}
          >
            <div className="play-bg"></div>
            <span className="play-text">COMPETIR</span>
            <span className="diamond indicador-losango" aria-hidden="true"></span>
          </NavLink>
          <NavLink
            to="/regras"
            className={({ isActive }) => `nav-link ${isActive ? 'ativo nav-item-ativo' : ''}`}
          >
            <div className="play-bg"></div>
            <span className="play-text">REGRAS</span>
            <span className="diamond indicador-losango" aria-hidden="true"></span>
          </NavLink>
          <NavLink
            to="/faq"
            className={({ isActive }) => `nav-link ${isActive ? 'ativo nav-item-ativo' : ''}`}
          >
            <div className="play-bg"></div>
            <span className="play-text">FAQ</span>
            <span className="diamond indicador-losango" aria-hidden="true"></span>
          </NavLink>
        </nav>


        <div className="user-area">
          {usuarioLogado ? (
            <div className={`menu-usuario-container ${menuAberto ? 'menu-aberto' : ''}`}>
              <button 
                className="botao-perfil-trigger usuario-nome" 
                type="button"
                onClick={() => setMenuAberto((prev) => !prev)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="icone-svg icone-usuario"><path fill="#450fe5" d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/></svg> {usuarioLogado.nome || usuarioLogado.email || 'Usuário'}
              </button>

              <div className="dropdown-usuario">
                <Link className="item-dropdown" to="/perfil" onClick={() => setMenuAberto(false)}>
                  Perfil do Usuário
                </Link>
                {usuarioLogado?.admin === true && (
                  <Link className="item-dropdown" to="/admin" onClick={() => setMenuAberto(false)}>
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

                <div className="dropdown-divisor"></div>

                {/* Seção de Amigos Integrada */}
                <div className="dropdown-secao-amigos">
                  <div className="dropdown-amigos-header">
                    <div className="dropdown-amigos-titulo">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icone-amigos-header">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span>AMIGOS</span>
                    </div>
                    <span className="dropdown-amigos-badge">
                      {amigos.filter((a) => a.status === 'online').length} Online
                    </span>
                  </div>

                  {/* Mini Campo de Busca de Amigos */}
                  <div className="dropdown-amigos-busca-wrap">
                    <div className="dropdown-amigos-busca-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="icone-busca-amigos" aria-hidden="true">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        className="dropdown-amigos-busca-input"
                        value={buscaAmigo}
                        onChange={(e) => setBuscaAmigo(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Buscar amigo..."
                        aria-label="Buscar amigo"
                      />
                      {buscaAmigo && (
                        <button
                          type="button"
                          className="dropdown-amigos-busca-limpar"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBuscaAmigo('');
                          }}
                          title="Limpar pesquisa"
                          aria-label="Limpar pesquisa"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="dropdown-amigos-lista">
                    {amigosFiltrados.length === 0 ? (
                      <div className="dropdown-amigos-vazio">
                        {buscaAmigo.trim() ? 'Nenhum amigo encontrado' : 'Nenhum amigo na lista'}
                      </div>
                    ) : (
                      amigosFiltrados.map((amigo) => (
                        <div key={amigo.id} className="dropdown-amigo-item">
                          <Link 
                            to={`/perfil/${amigo.nome_usuario}`} 
                            className="dropdown-amigo-perfil-link"
                            onClick={() => setMenuAberto(false)}
                            title={`Ver perfil de ${amigo.name}`}
                          >
                            <div className="dropdown-amigo-avatar-wrap">
                              <div className="dropdown-amigo-avatar">
                                {amigo.name.charAt(0).toUpperCase()}
                              </div>
                              <span className={`dropdown-status-dot ${amigo.status}`}></span>
                            </div>
                            <div className="dropdown-amigo-info">
                              <span className="dropdown-amigo-nome">{amigo.name}</span>
                              <span className="dropdown-amigo-status-texto">
                                {amigo.status === 'online'
                                  ? (amigo.game ? `Jogando ${amigo.game}` : 'Disponível')
                                  : 'Offline'}
                              </span>
                            </div>
                          </Link>

                          <div className="dropdown-amigo-acoes">
                            <button
                              type="button"
                              className="btn-acao-amigo btn-bloquear"
                              title={`Bloquear ${amigo.name}`}
                              aria-label={`Bloquear ${amigo.name}`}
                              onClick={(e) => handleBloquearAmigo(e, amigo)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-acao-amigo btn-remover"
                              title={`Remover amizade com ${amigo.name}`}
                              aria-label={`Remover amizade com ${amigo.name}`}
                              onClick={(e) => handleRemoverAmigo(e, amigo)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/perfil"
                    className="dropdown-amigos-gerenciar"
                    onClick={() => setMenuAberto(false)}
                  >
                    <span>Gerenciar Amigos</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icone-seta-amigos">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </Link>
                </div>
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

      {/* Rodapé Global */}
      <footer className="rodape-global">
        <div className="rodape-container">
          {/* Coluna 1: Marca e Quem Somos */}
          <div className="rodape-coluna rodape-marca">
            <h3 className="rodape-logo">CS:GO <span>TOURNAMENTS</span></h3>
            <p className="rodape-descricao">
              Plataforma competitiva dedicada a torneios e campeonatos de CS. Conectamos equipes, criamos disputas justas e impulsionamos o cenário de esports.
            </p>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div className="rodape-coluna">
            <h4 className="rodape-titulo">Navegação</h4>
            <ul className="rodape-links">
              <li><Link to="/">Início</Link></li>
              <li><Link to="/equipes">Times</Link></li>
              <li><Link to="/torneios">Competir</Link></li>
              <li><Link to="/regras">Regras &amp; Diretrizes</Link></li>
              <li><Link to="/faq">Perguntas Frequentes (FAQ)</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Suporte & Ajuda */}
          <div className="rodape-coluna">
            <h4 className="rodape-titulo">Suporte</h4>
            <ul className="rodape-links">
              <li><Link to="/suporte">Entrar em contato</Link></li>
              <li><Link to="/faq">Central de Ajuda</Link></li>
              <li><Link to="/regras">Regulamento Oficial</Link></li>
              <li><a href="mailto:suporte@csgotournaments.com">suporte@csgotournaments.com</a></li>
              <li><span>Atendimento: 24/7 via Discord</span></li>
            </ul>
          </div>

          {/* Coluna 4: Comunidade e Redes */}
          <div className="rodape-coluna">
            <h4 className="rodape-titulo">Comunidade</h4>
            <p className="rodape-comunidade-texto">Junte-se à nossa comunidade para atualizações de partidas e suporte em tempo real.</p>
            <div className="rodape-redes">
              <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord">Discord</a>
              <a href="https://steamcommunity.com" target="_blank" rel="noreferrer" aria-label="Steam">Steam</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="Twitter/X">X (Twitter)</a>
            </div>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="rodape-bottom">
          <p>© 2026 CS:GO Tournaments. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
