import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAlerta } from './AlertaModal';
import { supabase } from '../supabase';

import './menu.css';

export default function Menu({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { mostrarAlerta } = useAlerta();
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const salvo = localStorage.getItem('usuarioLogado');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  // Estado do painel social: aberto via hover
  const [painelAberto, setPainelAberto] = useState(false);
  const painelRef = useRef(null);
  const triggerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const [buscaAmigo, setBuscaAmigo] = useState('');
  const [amigosDropdown, setAmigosDropdown] = useState([]);
  const [timesUsuario, setTimesUsuario] = useState([]);
  const [carregandoTimes, setCarregandoTimes] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [statusPedidos, setStatusPedidos] = useState({});
  const amigos = amigosDropdown;

  const isBuscandoAmigosRef = useRef(false);

  // Carrega o time do usuario logado
  const carregarTimeUsuario = useCallback(async (usuarioAtual) => {
    const salvo = localStorage.getItem('usuarioLogado');
    const user = usuarioAtual || (salvo ? JSON.parse(salvo) : null);
    if (!user?.id || !supabase) {
      setTimesUsuario([]);
      return;
    }
    setCarregandoTimes(true);
    try {
      const { data } = await supabase
        .from('times_integrantes')
        .select('funcao, times(id, nome, tag, logo)')
        .eq('id_usuario', user.id);

      if (data && data.length > 0) {
        const times = data.map((m) => {
          const t = Array.isArray(m.times) ? m.times[0] : m.times;
          return t ? { ...t, funcao: m.funcao } : null;
        }).filter(Boolean);
        setTimesUsuario(times);
      } else {
        setTimesUsuario([]);
      }
    } catch (e) {
      console.warn('Erro ao carregar time do usuario no painel social:', e);
      setTimesUsuario([]);
    } finally {
      setCarregandoTimes(false);
    }
  }, []);

  // Busca consolidada e validacao cruzada rigorosa contra a tabela 'usuarios' do Supabase
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
      const { data: aceitas, error: errAceitas } = await supabase
        .from('amizades')
        .select('id, status, id_usuario1, id_usuario2')
        .or(`id_usuario1.eq.${user.id},id_usuario2.eq.${user.id}`);

      if (errAceitas) throw errAceitas;

      const relacoesAceitas = (aceitas || []).filter(
        (a) => String(a.status).toUpperCase() === 'ACEITO'
      );

      const idsAmigosBanco = [
        ...new Set(
          relacoesAceitas.map((a) =>
            String(a.id_usuario1) === String(user.id) ? String(a.id_usuario2) : String(a.id_usuario1)
          )
        )
      ].filter(Boolean);

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

      if (idsParaValidar.length === 0 || idsAmigosBanco.length === 0) {
        setAmigosDropdown([]);
        localStorage.setItem('listaAmigosUsuario', JSON.stringify([]));
        localStorage.setItem('listaAmigosPerfil', JSON.stringify([]));
        return;
      }

      const { data: usuariosAtivos, error: errVal } = await supabase
        .from('usuarios')
        .select('id, nome, nome_usuario, imagem, status')
        .in('id', idsParaValidar);

      if (errVal) throw errVal;

      const mapaTimes = new Map();
      try {
        const { data: membrosTimes } = await supabase
          .from('times_integrantes')
          .select('id_usuario, funcao, times ( id, nome, tag )')
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
            status: u.status
          });
        } else if (!mapaAtivos.has(amigoId)) {
          if (rel.id) {
            supabase.from('amizades').delete().eq('id', rel.id).then(() => {}).catch(() => {});
          }
        }
      }

      setAmigosDropdown(amigosValidados);
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(amigosValidados));
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(amigosValidados));
    } catch (err) {
      console.warn('Erro ao carregar e validar amigos no Menu:', err);
      setAmigosDropdown([]);
    } finally {
      isBuscandoAmigosRef.current = false;
    }
  }, []);

  // Busca dados frescos do usuário logado no Supabase e atualiza estado + localStorage
  const atualizarUsuarioFresco = useCallback(async (userId) => {
    if (!userId || !supabase) return;
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, nome_usuario, email, imagem, admin, status')
        .eq('id', userId)
        .single();
      if (data) {
        setUsuarioLogado(data);
        localStorage.setItem('usuarioLogado', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Erro ao atualizar usuário fresco:', e);
    }
  }, []);

  const checarUsuario = useCallback(() => {
    try {
      const salvo = localStorage.getItem('usuarioLogado');
      const user = salvo ? JSON.parse(salvo) : null;
      setUsuarioLogado(user);
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
      return nome.includes(termo);
    });
  }, [amigosDropdown, buscaAmigo]);

  useEffect(() => {
    if (!painelAberto) {
      setBuscaAmigo('');
    } else {
      const salvo = localStorage.getItem('usuarioLogado');
      const user = salvo ? JSON.parse(salvo) : null;
      if (user?.id) {
        // Sempre busca dados frescos ao abrir o painel
        atualizarUsuarioFresco(user.id);
        carregarAmigosConsolidados(user);
        carregarTimeUsuario(user);
      }
    }
  }, [painelAberto, atualizarUsuarioFresco, carregarAmigosConsolidados, carregarTimeUsuario]);

  // Busca global de usuarios no Supabase com debounce
  useEffect(() => {
    const termo = buscaAmigo.trim();
    if (!termo || termo.length < 2) {
      setResultadosBusca([]);
      return;
    }
    const timer = setTimeout(async () => {
      if (!supabase || !usuarioLogado?.id) return;
      setBuscandoUsuarios(true);
      try {
        const { data } = await supabase
          .from('usuarios')
          .select('id, nome, nome_usuario, imagem, status')
          .or(`nome_usuario.ilike.%${termo}%,nome.ilike.%${termo}%`)
          .neq('id', usuarioLogado.id)
          .limit(8);

        const idsAmigos = new Set(amigosDropdown.map((a) => String(a.id)));
        const filtrados = (data || []).filter((u) => !idsAmigos.has(String(u.id)));
        setResultadosBusca(filtrados);
      } catch (e) {
        console.warn('Erro ao buscar usuarios:', e);
        setResultadosBusca([]);
      } finally {
        setBuscandoUsuarios(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [buscaAmigo, usuarioLogado, amigosDropdown]);

  const handleEnviarPedido = async (e, usuario) => {
    e.stopPropagation();
    e.preventDefault();
    if (!supabase || !usuarioLogado?.id) return;
    setStatusPedidos((prev) => ({ ...prev, [usuario.id]: 'enviando' }));
    try {
      const { data: existente } = await supabase
        .from('amizades')
        .select('id, status')
        .or(
          `and(id_usuario1.eq.${usuarioLogado.id},id_usuario2.eq.${usuario.id}),` +
          `and(id_usuario1.eq.${usuario.id},id_usuario2.eq.${usuarioLogado.id})`
        )
        .maybeSingle();

      if (existente) {
        setStatusPedidos((prev) => ({ ...prev, [usuario.id]: existente.status === 'ACEITO' ? 'amigos' : 'enviado' }));
        return;
      }
      const { error } = await supabase.from('amizades').insert({
        id_usuario1: usuarioLogado.id,
        id_usuario2: usuario.id,
        status: 'PENDENTE'
      });
      if (error) throw error;
      setStatusPedidos((prev) => ({ ...prev, [usuario.id]: 'enviado' }));
      mostrarAlerta({
        titulo: 'Pedido Enviado!',
        mensagem: `Pedido de amizade enviado para ${usuario.nome_usuario || usuario.nome}.`,
        tipo: 'sucesso'
      });
    } catch (err) {
      console.warn('Erro ao enviar pedido:', err);
      setStatusPedidos((prev) => ({ ...prev, [usuario.id]: null }));
      mostrarAlerta({ titulo: 'Erro', mensagem: 'Nao foi possivel enviar o pedido.', tipo: 'erro' });
    }
  };

  const handleBloquearBusca = async (e, usuario) => {
    e.stopPropagation();
    e.preventDefault();
    if (!supabase || !usuarioLogado?.id) return;
    setStatusPedidos((prev) => ({ ...prev, [usuario.id]: 'bloqueando' }));
    try {
      const { data: existente } = await supabase
        .from('amizades')
        .select('id')
        .or(
          `and(id_usuario1.eq.${usuarioLogado.id},id_usuario2.eq.${usuario.id}),` +
          `and(id_usuario1.eq.${usuario.id},id_usuario2.eq.${usuarioLogado.id})`
        )
        .maybeSingle();

      if (existente) {
        await supabase.from('amizades').update({ status: 'BLOQUEADO', id_usuario1: usuarioLogado.id, id_usuario2: usuario.id }).eq('id', existente.id);
      } else {
        await supabase.from('amizades').insert({ id_usuario1: usuarioLogado.id, id_usuario2: usuario.id, status: 'BLOQUEADO' });
      }
      setStatusPedidos((prev) => ({ ...prev, [usuario.id]: 'bloqueado' }));
      setResultadosBusca((prev) => prev.filter((u) => String(u.id) !== String(usuario.id)));
      mostrarAlerta({ titulo: 'Jogador Bloqueado', mensagem: `${usuario.nome_usuario || usuario.nome} foi bloqueado.`, tipo: 'erro' });
    } catch (err) {
      console.warn('Erro ao bloquear usuario:', err);
      setStatusPedidos((prev) => ({ ...prev, [usuario.id]: null }));
    }
  };

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

  useEffect(() => {
    // Carga inicial
    const user = checarUsuario();
    if (user?.id) {
      atualizarUsuarioFresco(user.id);
      carregarAmigosConsolidados(user);
      carregarTimeUsuario(user);
    }

    // Subscription ao Supabase Auth — reage a login/logout em tempo real
    let authSub;
    if (supabase?.auth?.onAuthStateChange) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          atualizarUsuarioFresco(session.user.id).then(() => {
            const salvo = localStorage.getItem('usuarioLogado');
            const u = salvo ? JSON.parse(salvo) : { id: session.user.id };
            carregarAmigosConsolidados(u);
            carregarTimeUsuario(u);
          });
        } else {
          setUsuarioLogado(null);
          setAmigosDropdown([]);
          setTimesUsuario([]);
        }
      });
      authSub = data?.subscription;
    }

    const sincronizarAuthEAmigos = () => {
      const u = checarUsuario();
      if (u?.id) {
        atualizarUsuarioFresco(u.id);
        carregarAmigosConsolidados(u);
        carregarTimeUsuario(u);
      } else {
        setAmigosDropdown([]);
        setTimesUsuario([]);
      }
    };

    const onAmigosAtualizados = () => {
      const salvo = localStorage.getItem('usuarioLogado');
      const u = salvo ? JSON.parse(salvo) : null;
      if (u?.id) carregarAmigosConsolidados(u);
      else setAmigosDropdown([]);
    };

    // Evento disparado pela tela de Perfil ao salvar alterações
    const onPerfilAtualizado = () => {
      const salvo = localStorage.getItem('usuarioLogado');
      const u = salvo ? JSON.parse(salvo) : null;
      if (u?.id) {
        atualizarUsuarioFresco(u.id);
        carregarAmigosConsolidados(u);
        carregarTimeUsuario(u);
      }
    };

    window.addEventListener('authAtualizada', sincronizarAuthEAmigos);
    window.addEventListener('storage', sincronizarAuthEAmigos);
    window.addEventListener('amigosAtualizados', onAmigosAtualizados);
    window.addEventListener('perfilAtualizado', onPerfilAtualizado);

    return () => {
      authSub?.unsubscribe();
      window.removeEventListener('authAtualizada', sincronizarAuthEAmigos);
      window.removeEventListener('storage', sincronizarAuthEAmigos);
      window.removeEventListener('amigosAtualizados', onAmigosAtualizados);
      window.removeEventListener('perfilAtualizado', onPerfilAtualizado);
    };
  }, [checarUsuario, atualizarUsuarioFresco, carregarAmigosConsolidados, carregarTimeUsuario]);

  const handleTriggerMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    setPainelAberto(true);
  };

  const handleTriggerMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setPainelAberto(false);
    }, 220);
  };

  const handlePainelMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    setPainelAberto(true);
  };

  const handlePainelMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setPainelAberto(false);
    }, 220);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('listaAmigosUsuario');
    localStorage.removeItem('listaAmigosPerfil');
    setUsuarioLogado(null);
    setAmigosDropdown([]);
    setTimesUsuario([]);
    setPainelAberto(false);
    window.dispatchEvent(new Event('authAtualizada'));
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
    navigate('/', { replace: true });
  };

  const iniciaisUsuario = usuarioLogado
    ? (usuarioLogado.nome_usuario || usuarioLogado.nome || 'U').substring(0, 2).toUpperCase()
    : 'U';

  const nomeExibicao = usuarioLogado
    ? (usuarioLogado.nome_usuario || usuarioLogado.nome || usuarioLogado.email || 'Usuario')
    : '';

  const amigosOnline = amigos.filter((a) => a.status === 'online').length;

  return (
    <div>
      {/* Cabecalho Fixo com Efeito Glass */}
      <header className="cabecalho">
        <div className="logo">
          <Link to="/" className="titulo-animado-container" style={{ color: 'inherit', textDecoration: 'none' }}>
            {"CS:GO Tournaments".split("").map((char, index) => (
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
            <span className="play-text">INICIO</span>
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
          {!usuarioLogado && (
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

      {/* Faixa compacta fixa — sempre visível no lado direito, abaixo da navbar */}
      {usuarioLogado && (
        <div
          className="social-compact-strip-fixed"
          onMouseEnter={handleTriggerMouseEnter}
          onMouseLeave={handleTriggerMouseLeave}
        >
          {/* Avatar do usuário logado */}
          <div className="social-compact-item social-compact-item--user">
            <div className="social-compact-avatar">
              {usuarioLogado.imagem
                ? <img src={usuarioLogado.imagem} alt={nomeExibicao} />
                : <span>{iniciaisUsuario}</span>}
            </div>
          </div>
          {timesUsuario.length > 0 && <hr className="social-line" />}
          {/* Ícones do time */}
          {timesUsuario.slice(0, 3).map((time) => (
            <div key={time.id} className="social-compact-item">
              <div className="social-compact-avatar social-compact-avatar--square">
                {time.logo
                  ? <img src={time.logo} alt={time.nome} />
                  : <span>{(time.tag || time.nome || 'T').substring(0, 2).toUpperCase()}</span>}
              </div>
            </div>
          ))}

          <hr className="social-line" />

          {/* Ícones dos amigos */}
          {amigosDropdown.slice(0, 8).map((amigo) => (
            <div key={amigo.id} className="social-compact-item">
              <div className="social-compact-avatar">
                {amigo.imagem
                  ? <img src={amigo.imagem} alt={amigo.nome_usuario || amigo.nome} />
                  : <span>{(amigo.nome_usuario || amigo.nome || 'A').substring(0, 2).toUpperCase()}</span>}
              </div>
              {amigo.status === 'online' && <span className="social-compact-online-dot" />}
            </div>
          ))}
        </div>
      )}

      {/* Painel Social completo — desliza por cima da faixa compacta */}
      {usuarioLogado && (
        <aside
          id="social-panel"
          className={`social-panel${painelAberto ? ' social-panel-aberto' : ''}`}
          ref={painelRef}
          onMouseEnter={handlePainelMouseEnter}
          onMouseLeave={handlePainelMouseLeave}
          aria-label="Painel Social"
        >
          {/* Header do painel — só visível quando expandido */}
          <div className="social-panel-header">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="social-panel-icone-header"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="social-panel-titulo">SOCIAL</span>
          </div>

          {/* Secao: Perfil do usuario */}
          <div className="social-panel-secao social-panel-perfil-secao">
            <Link
              to="/perfil"
              className="social-panel-perfil-link"
              onClick={() => setPainelAberto(false)}
              title="Ver meu perfil"
            >
              <div className="social-perfil-avatar-moldura">
                <div className="social-perfil-avatar">
                  {usuarioLogado.imagem ? (
                    <img src={usuarioLogado.imagem} alt={nomeExibicao} />
                  ) : (
                    <span>{iniciaisUsuario}</span>
                  )}
                </div>
              </div>
              <div className="social-perfil-info">
                <span className="social-perfil-nome">{nomeExibicao}</span>
                <span className="social-perfil-label">Meu Perfil</span>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="social-perfil-seta"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
          </div>

          {/* Secao: Time afiliado */}
          <div className="social-panel-secao social-panel-time-secao">
            <div className="social-secao-titulo">
              <span>TIME AFILIADO</span>
            </div>
            {carregandoTimes ? (
              <div className="social-time-carregando">Carregando...</div>
            ) : timesUsuario.length > 0 ? (
              timesUsuario.map((time) => (
                <Link
                  key={time.id}
                  to={`/equipes/${time.id}`}
                  className="social-time-item"
                  onClick={() => setPainelAberto(false)}
                  title={`Ver detalhes de ${time.nome}`}
                >
                  <div className="social-time-logo-moldura">
                    <div className="social-time-logo">
                      {time.logo ? (
                        <img src={time.logo} alt={time.nome} />
                      ) : (
                        <span>{(time.tag || time.nome || 'T').substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div className="social-time-info">
                    <span className="social-time-nome">
                      {time.tag ? `[${time.tag}] ` : ''}{time.nome}
                    </span>
                    <span className="social-time-funcao">
                      {time.funcao === 'capitao' ? 'Capitao' : 'Jogador'}
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="social-time-seta"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Link>
              ))
            ) : (
              <div className="social-time-vazio">
                <span>Sem equipe</span>
                <Link
                  to="/equipes/criar"
                  className="social-time-criar-link"
                  onClick={() => setPainelAberto(false)}
                >
                  Criar time
                </Link>
              </div>
            )}
          </div>

          {/* Secao: Lista de amigos */}
          <div className="social-panel-secao social-panel-amigos-secao">
            <div className="social-secao-titulo">
              <span>AMIGOS</span>
              <span className="social-amigos-online-badge">{amigosOnline} online</span>
            </div>

            <div className="social-amigos-busca-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="social-amigos-busca-icone"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="social-amigos-busca-input"
                value={buscaAmigo}
                onChange={(e) => setBuscaAmigo(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Buscar amigo..."
                aria-label="Buscar amigo"
              />
              {buscaAmigo && (
                <button
                  type="button"
                  className="social-amigos-busca-limpar"
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

            <div className="social-amigos-lista">
              {buscaAmigo.trim().length >= 2 ? (
                /* ---- Modo busca global ---- */
                buscandoUsuarios ? (
                  <div className="social-amigos-vazio">Buscando...</div>
                ) : resultadosBusca.length === 0 ? (
                  <div className="social-amigos-vazio">Nenhum usuário encontrado</div>
                ) : (
                  resultadosBusca.map((usuario) => {
                    const st = statusPedidos[usuario.id];
                    const jaEnviado = st === 'enviado' || st === 'amigos';
                    const bloqueado = st === 'bloqueado';
                    const carregando = st === 'enviando' || st === 'bloqueando';
                    return (
                      <div key={usuario.id} className="social-amigo-item">
                        <Link
                          to={`/perfil/${usuario.nome_usuario}`}
                          className="social-amigo-link"
                          onClick={() => setPainelAberto(false)}
                          title={`Ver perfil de ${usuario.nome_usuario || usuario.nome}`}
                        >
                          <div className="social-amigo-avatar-moldura">
                            <div className="social-amigo-avatar">
                              {usuario.imagem ? (
                                <img src={usuario.imagem} alt={usuario.nome_usuario || usuario.nome} />
                              ) : (
                                <span>{(usuario.nome_usuario || usuario.nome || 'U').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                          <div className="social-amigo-info">
                            <span className="social-amigo-nome">{usuario.nome_usuario || usuario.nome}</span>
                            <span className="social-amigo-time">
                              {bloqueado ? 'Bloqueado' : jaEnviado ? (st === 'amigos' ? 'Já são amigos' : 'Pedido enviado ✓') : 'Jogador'}
                            </span>
                          </div>
                        </Link>
                        {!bloqueado && (
                          <div className="social-amigo-acoes">
                            <button
                              type="button"
                              className={`social-btn-acao ${jaEnviado ? 'social-btn-enviado' : 'social-btn-adicionar'}`}
                              disabled={carregando || jaEnviado}
                              title={jaEnviado ? 'Pedido já enviado' : `Adicionar ${usuario.nome_usuario || usuario.nome}`}
                              onClick={(e) => handleEnviarPedido(e, usuario)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                              </svg>
                              <span>{carregando && st === 'enviando' ? '...' : jaEnviado ? 'Enviado' : 'Adicionar'}</span>
                            </button>
                            <button
                              type="button"
                              className="social-btn-acao social-btn-bloquear"
                              disabled={carregando}
                              title={`Bloquear ${usuario.nome_usuario || usuario.nome}`}
                              onClick={(e) => handleBloquearBusca(e, usuario)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                              </svg>
                              <span>{carregando && st === 'bloqueando' ? '...' : 'Bloquear'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : (
                /* ---- Modo lista de amigos ---- */
                amigosFiltrados.length === 0 ? (
                  <div className="social-amigos-vazio">
                    {buscaAmigo.trim() ? 'Nenhum amigo encontrado' : 'Nenhum amigo na lista'}
                  </div>
                ) : (
                  amigosFiltrados.map((amigo) => (
                    <div key={amigo.id} className="social-amigo-item">
                      <Link
                        to={`/perfil/${amigo.nome_usuario}`}
                        className="social-amigo-link"
                        onClick={() => setPainelAberto(false)}
                        title={`Ver perfil de ${amigo.name}`}
                      >
                        <div className="social-amigo-avatar-moldura">
                          <div className="social-amigo-avatar">
                            {amigo.imagem ? (
                              <img src={amigo.imagem} alt={amigo.name} />
                            ) : (
                              <span>{(amigo.name || 'J').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {(amigo.status === 'online' || amigo.status === 'offline') && (
                            <span className={`social-status-dot ${amigo.status}`}></span>
                          )}
                        </div>
                        <div className="social-amigo-info">
                          <span className="social-amigo-nome">{amigo.name}</span>
                          <span className="social-amigo-time">{amigo.time_usuario || 'Sem equipe'}</span>
                        </div>
                      </Link>
                      <div className="social-amigo-acoes">
                        <button
                          type="button"
                          className="social-btn-acao social-btn-remover"
                          title={`Remover amizade com ${amigo.name}`}
                          onClick={(e) => handleRemoverAmigo(e, amigo)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="23" y1="18" x2="17" y2="18"></line>
                          </svg>
                          <span>Remover</span>
                        </button>
                        <button
                          type="button"
                          className="social-btn-acao social-btn-bloquear"
                          title={`Bloquear ${amigo.name}`}
                          onClick={(e) => handleBloquearAmigo(e, amigo)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                          </svg>
                          <span>Bloquear</span>
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>


          {/* Rodape do painel: acoes */}
          <div className="social-panel-footer">
            <Link
              to="/perfil#editar"
              className="social-footer-btn social-footer-btn-config"
              onClick={() => setPainelAberto(false)}
              title="Configuracoes do perfil"
              aria-label="Configuracoes do perfil"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Config</span>
            </Link>

            {usuarioLogado?.admin === true && (
              <Link
                to="/admin"
                className="social-footer-btn social-footer-btn-admin"
                onClick={() => setPainelAberto(false)}
                title="Painel do Administrador"
                aria-label="Painel do Administrador"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Admin</span>
              </Link>
            )}

            <button
              type="button"
              className="social-footer-btn social-footer-btn-logout"
              onClick={handleLogout}
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </aside>
      )}

      {/* Conteudo Principal */}
      {children}

      {/* Rodape Global */}
      <footer className="rodape-global">
        <div className="rodape-container">
          <div className="rodape-coluna rodape-marca">
            <h3 className="rodape-logo">CS:GO <span>TOURNAMENTS</span></h3>
            <p className="rodape-descricao">
              Plataforma competitiva dedicada a torneios e campeonatos de CS. Conectamos equipes, criamos disputas justas e impulsionamos o cenario de esports.
            </p>
          </div>

          <div className="rodape-coluna">
            <h4 className="rodape-titulo">Navegacao</h4>
            <ul className="rodape-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/equipes">Times</Link></li>
              <li><Link to="/torneios">Competir</Link></li>
              <li><Link to="/regras">Regras &amp; Diretrizes</Link></li>
              <li><Link to="/faq">Perguntas Frequentes (FAQ)</Link></li>
            </ul>
          </div>

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

          <div className="rodape-coluna">
            <h4 className="rodape-titulo">Comunidade</h4>
            <p className="rodape-comunidade-texto">Junte-se a nossa comunidade para atualizacoes de partidas e suporte em tempo real.</p>
            <div className="rodape-redes">
              <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord">Discord</a>
              <a href="https://steamcommunity.com" target="_blank" rel="noreferrer" aria-label="Steam">Steam</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="Twitter/X">X (Twitter)</a>
            </div>
          </div>
        </div>

        <div className="rodape-bottom">
          <p>2026 CS:GO Tournaments. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
