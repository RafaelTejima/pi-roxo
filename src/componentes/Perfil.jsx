import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../css/perfil.css';
import { useAlerta } from './AlertaModal';
import AuroraBackground from './AuroraBackground';

// ------------------------------------------------------------------
// MOCK — perfis públicos pré-configurados (jogadores famosos)
// ------------------------------------------------------------------
const MOCK_PERFIS_AMIGOS = {
  '1': {
    id: 1, nome: 'Gabriel Toledo', nome_usuario: 'FalleN', time_usuario: 'FURIA Esports',
    bio: 'Professor do CS brasileiro. Bi-campeão de Major. Capitão, AWP & líder lendário nos servidores.',
    imagem: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=faces',
    registro: '2016-01-15T00:00:00.000Z', status: 'online',
    discord: 'FalleN#0001', steam: 'https://steamcommunity.com/id/fallen', twitter: '@FalleNCS',
    stats: { partidas: 1420, torneios: 88, titulos: 24, ganhos: 'R$ 4.250.000,00' }
  },
  '2': {
    id: 2, nome: 'Marcelo David', nome_usuario: 'coldzera', time_usuario: 'RED Canids',
    bio: '2x Melhor Jogador do Mundo (2016/2017). Eternizado no grafite dos 4 abates saltando na Mirage.',
    imagem: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces',
    registro: '2016-03-20T00:00:00.000Z', status: 'offline',
    discord: 'coldzera#0002', steam: 'https://steamcommunity.com/id/coldzera', twitter: '@coldzera',
    stats: { partidas: 1290, torneios: 82, titulos: 22, ganhos: 'R$ 3.900.000,00' }
  },
  '3': {
    id: 3, nome: 'Fernando Alvarenga', nome_usuario: 'fer', time_usuario: 'O PLANO',
    bio: 'A dona morte! Campeão de 2 Majors de CS:GO, agressividade e mira afiada sem medo.',
    imagem: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=faces',
    registro: '2016-01-15T00:00:00.000Z', status: 'online',
    discord: 'fer#0003', steam: 'https://steamcommunity.com/id/fergod', twitter: '@fer',
    stats: { partidas: 1150, torneios: 75, titulos: 20, ganhos: 'R$ 3.400.000,00' }
  },
  '4': {
    id: 4, nome: 'Epitácio de Melo', nome_usuario: 'TACO', time_usuario: 'Legacy',
    bio: "Entry fragger histórico, 2x campeão de Major. 'Are you mad? Cuz I'm not'.",
    imagem: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    registro: '2016-04-10T00:00:00.000Z', status: 'online',
    discord: 'TACO#0004', steam: 'https://steamcommunity.com/id/tacocs', twitter: '@TACOCS',
    stats: { partidas: 1080, torneios: 70, titulos: 19, ganhos: 'R$ 3.100.000,00' }
  },
  '5': {
    id: 5, nome: 'Lincoln Lau', nome_usuario: 'fnx', time_usuario: 'Imperial',
    bio: 'Sem fnx sem Major! Lenda viva com títulos mundiais no 1.6 e bicampeonato no CS:GO.',
    imagem: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
    registro: '2015-11-05T00:00:00.000Z', status: 'offline',
    discord: 'fnx#0005', steam: 'https://steamcommunity.com/id/fnxforever', twitter: '@linfnx',
    stats: { partidas: 990, torneios: 65, titulos: 21, ganhos: 'R$ 2.800.000,00' }
  },
  '6': {
    id: 6, nome: 'Alexandre Borba', nome_usuario: 'gaules', time_usuario: 'Tribo Gaules',
    bio: 'A Tribo cuida da Tribo! Ex-jogador profissional, técnico e maior streamer gamer da América Latina.',
    imagem: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
    registro: '2015-08-01T00:00:00.000Z', status: 'online',
    discord: 'gaules#0006', steam: 'https://steamcommunity.com/id/gaules', twitter: '@Gaules',
    stats: { partidas: 850, torneios: 40, titulos: 10, ganhos: 'R$ 1.500.000,00' }
  }
};

// ------------------------------------------------------------------
// POOL LOCAL para busca dinâmica de jogadores (fallback/demo)
// ------------------------------------------------------------------
const POOL_LOCAL = [
  { id: '1', nome: 'Gabriel Toledo', nome_usuario: 'FalleN', time_usuario: 'FURIA Esports', imagem: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=faces', status: 'online' },
  { id: '2', nome: 'Marcelo David', nome_usuario: 'coldzera', time_usuario: 'RED Canids', imagem: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces', status: 'offline' },
  { id: '3', nome: 'Fernando Alvarenga', nome_usuario: 'fer', time_usuario: 'O PLANO', imagem: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=faces', status: 'online' },
  { id: '4', nome: 'Epitácio de Melo', nome_usuario: 'TACO', time_usuario: 'Legacy', imagem: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces', status: 'online' },
  { id: '5', nome: 'Lincoln Lau', nome_usuario: 'fnx', time_usuario: 'Imperial', imagem: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces', status: 'offline' },
  { id: '6', nome: 'Alexandre Borba', nome_usuario: 'gaules', time_usuario: 'Tribo Gaules', imagem: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces', status: 'online' },
];

// ------------------------------------------------------------------
// STATUS AMIZADE: PENDENTE | ACEITO | BLOQUEADO
// ------------------------------------------------------------------

export default function Perfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mostrarAlerta } = useAlerta();

  const [usuario, setUsuario] = useState(null);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPublico, setIsPublico] = useState(false);

  // ---- Edição ----
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

  // ---- Amizades (Supabase) ----
  const [listaAmigos, setListaAmigos] = useState([]);
  const [pedidosPendentes, setPedidosPendentes] = useState([]); // recebidos
  const [pedidosEnviados, setPedidosEnviados] = useState([]);   // enviados
  const [carregandoAmigos, setCarregandoAmigos] = useState(false);

  // ---- Status amizade (perfil público) ----
  const [statusAmizade, setStatusAmizade] = useState(null); // null | 'PENDENTE_ENVIADO' | 'PENDENTE_RECEBIDO' | 'ACEITO' | 'BLOQUEADO'
  const [amizadeId, setAmizadeId] = useState(null);

  // ---- Aba da seção amigos ----
  const [abaAmigos, setAbaAmigos] = useState('amigos'); // 'amigos' | 'pendentes' | 'enviados'

  // ---- Busca de Jogadores ----
  const [buscaAmigo, setBuscaAmigo] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [dropdownAmigoAberto, setDropdownAmigoAberto] = useState(false);
  const [buscandoAmigos, setBuscandoAmigos] = useState(false);
  const buscarAmigoRef = useRef(null);

  // ------------------------------------------------------------------
  // CARREGAMENTO DO PERFIL
  // ------------------------------------------------------------------
  useEffect(() => {
    async function carregarPerfil() {
      const salvo = localStorage.getItem('usuarioLogado');
      const userLocal = salvo ? JSON.parse(salvo) : null;
      setUsuarioLogado(userLocal);

      if (id && (!userLocal || String(userLocal.id) !== String(id))) {
        // Perfil público de outro usuário
        setIsPublico(true);

        // 1. Mock pré-configurado
        if (MOCK_PERFIS_AMIGOS[String(id)]) {
          setUsuario(MOCK_PERFIS_AMIGOS[String(id)]);
          setLoading(false);
          return;
        }

        // 2. Busca no Supabase
        const { data } = await supabase
          .from('usuarios')
          .select('id, nome, nome_usuario, time_usuario, bio, imagem, registro')
          .eq('id', id)
          .single();

        setUsuario(data || {
          id,
          nome: `Jogador #${id}`,
          nome_usuario: `jogador_${id}`,
          time_usuario: 'Sem equipe',
          bio: 'Perfil público de jogador na plataforma.',
          imagem: '',
          registro: new Date().toISOString(),
          status: 'offline'
        });
        setLoading(false);
        return;
      }

      // Perfil próprio
      setIsPublico(false);
      if (!userLocal?.id) { navigate('/login'); return; }

      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, nome_usuario, time_usuario, bio, imagem, registro, admin, conexao_discord, conexao_steam, conexao_twitter, conexao_youtube, conexao_twitch, conexao_bluesky')
        .eq('id', userLocal.id)
        .single();

      setUsuario(data || userLocal);
      setLoading(false);
    }
    carregarPerfil();
  }, [id, navigate]);

  // ------------------------------------------------------------------
  // CARREGAR AMIZADES DO SUPABASE (perfil próprio)
  // ------------------------------------------------------------------
  const carregarAmizades = useCallback(async () => {
    if (!usuarioLogado?.id) return;
    setCarregandoAmigos(true);
    try {
      // Amizades aceitas
      const { data: aceitas } = await supabase
        .from('amizades')
        .select(`
          id, status, registro,
          usuario1:id_usuario1 ( id, nome, nome_usuario, imagem, time_usuario ),
          usuario2:id_usuario2 ( id, nome, nome_usuario, imagem, time_usuario )
        `)
        .eq('status', 'ACEITO')
        .or(`id_usuario1.eq.${usuarioLogado.id},id_usuario2.eq.${usuarioLogado.id}`);

      if (aceitas) {
        const lista = aceitas.map((a) => {
          const u1 = Array.isArray(a.usuario1) ? a.usuario1[0] : a.usuario1;
          const u2 = Array.isArray(a.usuario2) ? a.usuario2[0] : a.usuario2;
          const amigo = String(u1?.id) === String(usuarioLogado.id) ? u2 : u1;
          if (!amigo) return null;
          return { ...amigo, amizade_id: a.id };
        }).filter(Boolean);
        setListaAmigos(lista);
      }

      // Pedidos recebidos (eu = usuario2)
      const { data: recebidos } = await supabase
        .from('amizades')
        .select(`id, registro, remetente:id_usuario1 ( id, nome, nome_usuario, imagem, time_usuario )`)
        .eq('id_usuario2', usuarioLogado.id)
        .eq('status', 'PENDENTE');

      setPedidosPendentes((recebidos || []).map(p => ({
        ...p,
        remetente: Array.isArray(p.remetente) ? p.remetente[0] : p.remetente
      })));

      // Pedidos enviados (eu = usuario1)
      const { data: enviados } = await supabase
        .from('amizades')
        .select(`id, registro, destinatario:id_usuario2 ( id, nome, nome_usuario, imagem, time_usuario )`)
        .eq('id_usuario1', usuarioLogado.id)
        .eq('status', 'PENDENTE');

      setPedidosEnviados((enviados || []).map(e => ({
        ...e,
        destinatario: Array.isArray(e.destinatario) ? e.destinatario[0] : e.destinatario
      })));

    } catch (err) {
      console.error('Erro ao carregar amizades:', err);
    }
    setCarregandoAmigos(false);
  }, [usuarioLogado?.id]);

  useEffect(() => {
    if (usuarioLogado?.id && !isPublico) carregarAmizades();
  }, [usuarioLogado?.id, isPublico, carregarAmizades]);

  // ------------------------------------------------------------------
  // STATUS AMIZADE (perfil público)
  // ------------------------------------------------------------------
  useEffect(() => {
    async function verificarAmizade() {
      if (!isPublico || !usuarioLogado?.id || !id) return;
      const { data } = await supabase
        .from('amizades')
        .select('id, status, id_usuario1, id_usuario2')
        .or(`and(id_usuario1.eq.${usuarioLogado.id},id_usuario2.eq.${id}),and(id_usuario1.eq.${id},id_usuario2.eq.${usuarioLogado.id})`)
        .maybeSingle();

      if (!data) { setStatusAmizade(null); setAmizadeId(null); return; }
      setAmizadeId(data.id);
      if (data.status === 'ACEITO') setStatusAmizade('ACEITO');
      else if (data.status === 'BLOQUEADO') setStatusAmizade('BLOQUEADO');
      else if (data.status === 'PENDENTE') {
        setStatusAmizade(String(data.id_usuario1) === String(usuarioLogado.id) ? 'PENDENTE_ENVIADO' : 'PENDENTE_RECEBIDO');
      }
    }
    verificarAmizade();
  }, [isPublico, usuarioLogado?.id, id]);

  // ------------------------------------------------------------------
  // AÇÕES DE AMIZADE — PERFIL PÚBLICO
  // ------------------------------------------------------------------
  async function enviarPedidoAmizade() {
    if (!usuarioLogado?.id || !id) return;
    const { error } = await supabase.from('amizades').insert({
      id_usuario1: usuarioLogado.id,
      id_usuario2: id,
      status: 'PENDENTE'
    });
    if (error) {
      mostrarAlerta({ titulo: 'Erro', mensagem: error.message, tipo: 'erro' });
    } else {
      setStatusAmizade('PENDENTE_ENVIADO');
      mostrarAlerta({ titulo: 'Pedido enviado!', mensagem: `Seu pedido foi enviado para ${usuario?.nome_usuario || usuario?.nome}.`, tipo: 'sucesso' });
    }
  }

  async function aceitarPedidoPublico() {
    if (!amizadeId) return;
    await supabase.from('amizades').update({ status: 'ACEITO' }).eq('id', amizadeId);
    setStatusAmizade('ACEITO');
    mostrarAlerta({ titulo: 'Amizade aceita!', mensagem: 'Vocês agora são amigos.', tipo: 'sucesso' });
  }

  async function removerAmizadePublica() {
    if (!amizadeId) return;
    await supabase.from('amizades').delete().eq('id', amizadeId);
    setStatusAmizade(null); setAmizadeId(null);
    mostrarAlerta({ titulo: 'Amizade removida', mensagem: 'Amizade removida com sucesso.', tipo: 'aviso' });
  }

  async function bloquearUsuario() {
    if (!usuarioLogado?.id || !id) return;
    if (amizadeId) {
      await supabase.from('amizades').update({ status: 'BLOQUEADO', id_usuario1: usuarioLogado.id, id_usuario2: id }).eq('id', amizadeId);
    } else {
      await supabase.from('amizades').insert({ id_usuario1: usuarioLogado.id, id_usuario2: id, status: 'BLOQUEADO' });
    }
    setStatusAmizade('BLOQUEADO');
    mostrarAlerta({ titulo: 'Usuário bloqueado', mensagem: `${usuario?.nome_usuario || usuario?.nome} foi bloqueado.`, tipo: 'aviso' });
  }

  async function desbloquearUsuario() {
    if (!amizadeId) return;
    await supabase.from('amizades').delete().eq('id', amizadeId);
    setStatusAmizade(null); setAmizadeId(null);
    mostrarAlerta({ titulo: 'Desbloqueado', mensagem: 'Usuário desbloqueado com sucesso.', tipo: 'sucesso' });
  }

  // ------------------------------------------------------------------
  // AÇÕES DE AMIZADE — LISTA PRÓPRIA
  // ------------------------------------------------------------------
  async function aceitarPedido(amizade_id) {
    const { error } = await supabase.from('amizades').update({ status: 'ACEITO' }).eq('id', amizade_id);
    if (!error) {
      mostrarAlerta({ titulo: 'Amizade aceita!', mensagem: 'Pedido de amizade aceito com sucesso.', tipo: 'sucesso' });
      carregarAmizades();
    }
  }

  async function rejeitarPedido(amizade_id) {
    await supabase.from('amizades').delete().eq('id', amizade_id);
    setPedidosPendentes(prev => prev.filter(p => p.id !== amizade_id));
    mostrarAlerta({ titulo: 'Pedido rejeitado', mensagem: 'Pedido de amizade rejeitado.', tipo: 'aviso' });
  }

  async function cancelarPedidoEnviado(amizade_id) {
    await supabase.from('amizades').delete().eq('id', amizade_id);
    setPedidosEnviados(prev => prev.filter(e => e.id !== amizade_id));
    mostrarAlerta({ titulo: 'Pedido cancelado', mensagem: 'Seu pedido de amizade foi cancelado.', tipo: 'aviso' });
  }

  async function removerAmigo(amizade_id, nome) {
    await supabase.from('amizades').delete().eq('id', amizade_id);
    setListaAmigos(prev => prev.filter(a => a.amizade_id !== amizade_id));
    mostrarAlerta({ titulo: 'Amizade Removida', mensagem: `${nome} foi removido da sua lista de amigos.`, tipo: 'aviso' });
  }

  async function bloquearAmigo(amizade_id, amigo_id, nome) {
    await supabase.from('amizades')
      .update({ status: 'BLOQUEADO', id_usuario1: usuarioLogado.id, id_usuario2: amigo_id })
      .eq('id', amizade_id);
    setListaAmigos(prev => prev.filter(a => a.amizade_id !== amizade_id));
    mostrarAlerta({ titulo: 'Usuário bloqueado', mensagem: `${nome} foi bloqueado.`, tipo: 'aviso' });
  }

  // ------------------------------------------------------------------
  // BUSCA DINÂMICA DE JOGADORES
  // ------------------------------------------------------------------
  useEffect(() => {
    const fecharAoClicarFora = (e) => {
      if (buscarAmigoRef.current && !buscarAmigoRef.current.contains(e.target)) {
        setDropdownAmigoAberto(false);
      }
    };
    document.addEventListener('click', fecharAoClicarFora);
    return () => document.removeEventListener('click', fecharAoClicarFora);
  }, []);

  useEffect(() => {
    const termo = buscaAmigo.trim().toLowerCase();
    if (!termo) { setResultadosBusca([]); setDropdownAmigoAberto(false); return; }

    setBuscandoAmigos(true);
    let ativo = true;

    const idsRelacionados = new Set([
      ...listaAmigos.map(a => String(a.id)),
      ...pedidosPendentes.map(p => String(p.remetente?.id)),
      ...pedidosEnviados.map(e => String(e.destinatario?.id)),
      String(usuarioLogado?.id)
    ]);

    // 1. Filtro local
    const locais = POOL_LOCAL.filter(j => {
      if (idsRelacionados.has(String(j.id))) return false;
      return (j.nome && j.nome.toLowerCase().includes(termo)) ||
             (j.nome_usuario && j.nome_usuario.toLowerCase().includes(termo)) ||
             (j.time_usuario && j.time_usuario.toLowerCase().includes(termo));
    });

    setResultadosBusca(locais);
    setDropdownAmigoAberto(true);

    // 2. Busca Supabase
    supabase
      .from('usuarios')
      .select('id, nome, nome_usuario, time_usuario, imagem')
      .or(`nome.ilike.%${termo}%,nome_usuario.ilike.%${termo}%`)
      .limit(8)
      .then(({ data, error }) => {
        if (!ativo || error) { if (ativo) setBuscandoAmigos(false); return; }
        const combinados = [...locais];
        (data || []).forEach((jDb) => {
          if (idsRelacionados.has(String(jDb.id))) return;
          const jaPresente = combinados.some(item =>
            String(item.id) === String(jDb.id) ||
            (item.nome_usuario && jDb.nome_usuario && item.nome_usuario.toLowerCase() === jDb.nome_usuario.toLowerCase())
          );
          if (!jaPresente) {
            combinados.push({
              id: jDb.id,
              nome: jDb.nome || jDb.nome_usuario,
              nome_usuario: jDb.nome_usuario || jDb.nome,
              time_usuario: jDb.time_usuario || 'Sem equipe',
              imagem: jDb.imagem || '',
              status: 'offline'
            });
          }
        });
        if (ativo) {
          setResultadosBusca(combinados);
          setBuscandoAmigos(false);
        }
      })
      .catch(() => { if (ativo) setBuscandoAmigos(false); });

    return () => { ativo = false; };
  }, [buscaAmigo, listaAmigos, pedidosPendentes, pedidosEnviados, usuarioLogado?.id]);

  async function handleEnviarPedido(jogador) {
    if (!usuarioLogado?.id || String(jogador.id) === String(usuarioLogado?.id)) return;

    const { error } = await supabase.from('amizades').insert({
      id_usuario1: usuarioLogado.id,
      id_usuario2: jogador.id,
      status: 'PENDENTE'
    });

    if (error) {
      mostrarAlerta({ titulo: 'Erro', mensagem: error.message, tipo: 'erro' });
      return;
    }

    setBuscaAmigo('');
    setResultadosBusca([]);
    setDropdownAmigoAberto(false);
    mostrarAlerta({
      titulo: 'Pedido enviado!',
      mensagem: `Pedido enviado para ${jogador.nome_usuario || jogador.nome}.`,
      tipo: 'sucesso'
    });
    carregarAmizades();
  }

  // ------------------------------------------------------------------
  // EDIÇÃO DE PERFIL
  // ------------------------------------------------------------------
  function iniciarEdicao() {
    setForm({
      nome_usuario: usuario.nome_usuario || '',
      imagem: usuario.imagem || '',
      bio: usuario.bio || '',
      discord: usuario.conexao_discord || '',
      steam: usuario.conexao_steam || '',
      twitter: usuario.conexao_twitter || '',
      youtube: usuario.conexao_youtube || '',
      twitch: usuario.conexao_twitch || '',
      bluesky: usuario.conexao_bluesky || '',
      privacidade_amigos: localStorage.getItem(`priv_amigos_${usuario.id}`) || 'publico',
      privacidade_nome: localStorage.getItem(`priv_nome_${usuario.id}`) || 'publico',
      privacidade_ganhos: localStorage.getItem(`priv_ganhos_${usuario.id}`) || 'publico',
    });
    setEditando(true);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setSalvando(true);
    const payload = {
      nome_usuario: form.nome_usuario,
      imagem: form.imagem,
      bio: form.bio,
      conexao_discord: form.discord,
      conexao_steam: form.steam,
      conexao_twitter: form.twitter,
      conexao_youtube: form.youtube,
      conexao_twitch: form.twitch,
      conexao_bluesky: form.bluesky,
    };
    const { error } = await supabase.from('usuarios').update(payload).eq('id', usuario.id);
    if (error) {
      mostrarAlerta({ titulo: 'Erro ao Salvar', mensagem: error.message, tipo: 'erro' });
      setSalvando(false);
      return;
    }
    localStorage.setItem(`priv_amigos_${usuario.id}`, form.privacidade_amigos);
    localStorage.setItem(`priv_nome_${usuario.id}`, form.privacidade_nome);
    localStorage.setItem(`priv_ganhos_${usuario.id}`, form.privacidade_ganhos);
    setUsuario(prev => ({ ...prev, ...payload }));
    setSalvando(false);
    setEditando(false);
    mostrarAlerta({ titulo: 'Perfil Atualizado!', mensagem: 'Suas informações foram salvas com sucesso.', tipo: 'sucesso' });
  }

  function sair() {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      localStorage.removeItem('usuarioLogado');
      navigate('/');
      window.dispatchEvent(new Event('storage'));
    }
  }

  // ------------------------------------------------------------------
  // LOADING / GUARD
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <main id="perfil-page" className="perfil-page fundo-aurora-motion">
        <AuroraBackground />
        <div className="perfil-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2 style={{ color: 'var(--roxo-claro)' }}>Carregando perfil...</h2>
        </div>
      </main>
    );
  }
  if (!usuario) return null;

  // ------------------------------------------------------------------
  // DERIVAÇÕES
  // ------------------------------------------------------------------
  const dataRegistro = new Date(usuario.registro).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const avatarUrl = usuario.imagem || `https://placehold.co/180x180/35176b/ffffff?text=${(usuario.nome || usuario.nome_usuario || 'U').substring(0, 2).toUpperCase()}`;

  const discord = isPublico ? (usuario.discord || null) : usuario.conexao_discord;
  const steam   = isPublico ? (usuario.steam   || null) : usuario.conexao_steam;
  const twitter = isPublico ? (usuario.twitter  || null) : usuario.conexao_twitter;
  const youtube = isPublico ? null : usuario.conexao_youtube;
  const twitch  = isPublico ? null : usuario.conexao_twitch;
  const bluesky = isPublico ? null : usuario.conexao_bluesky;

  const privNome   = isPublico ? 'publico' : (localStorage.getItem(`priv_nome_${usuario.id}`)   || 'publico');
  const privGanhos = isPublico ? (usuario.stats ? 'publico' : 'privado') : (localStorage.getItem(`priv_ganhos_${usuario.id}`) || 'publico');
  const privAmigos = isPublico ? 'publico' : (localStorage.getItem(`priv_amigos_${usuario.id}`) || 'publico');

  const statsPartidas = usuario.stats?.partidas ?? 0;
  const statsTorneios = usuario.stats?.torneios ?? 0;
  const statsTitulos  = usuario.stats?.titulos  ?? 0;
  const statsGanhos   = usuario.stats?.ganhos   ?? (privGanhos === 'privado' ? '🔒 Oculto' : 'R$ 0,00');

  const totalPendentes = pedidosPendentes.length;

  // ------------------------------------------------------------------
  // RENDER — BOTÃO DE AMIZADE (perfil público)
  // ------------------------------------------------------------------
  function renderBotaoAmizade() {
    if (!usuarioLogado) return null;
    if (String(usuarioLogado.id) === String(id)) return null;

    if (statusAmizade === 'ACEITO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ padding: '8px 14px', background: 'rgba(80,200,120,0.15)', border: '1px solid rgba(80,200,120,0.3)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>
            ✓ Amigos
          </div>
          <button onClick={removerAmizadePublica} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(233,85,85,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Remover
          </button>
          <button onClick={bloquearUsuario} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Bloquear
          </button>
        </div>
      );
    }
    if (statusAmizade === 'PENDENTE_ENVIADO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ padding: '8px 14px', background: 'rgba(181,101,242,0.12)', border: '1px solid rgba(181,101,242,0.3)', borderRadius: '8px', color: '#c084fc', fontSize: '13px', fontWeight: '700' }}>
            ⏳ Aguardando resposta
          </div>
        </div>
      );
    }
    if (statusAmizade === 'PENDENTE_RECEBIDO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button onClick={aceitarPedidoPublico} style={{ padding: '8px 14px', background: 'rgba(80,200,120,0.2)', border: '1px solid rgba(80,200,120,0.4)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            ✓ Aceitar pedido
          </button>
          <button onClick={removerAmizadePublica} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(233,85,85,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Rejeitar
          </button>
        </div>
      );
    }
    if (statusAmizade === 'BLOQUEADO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ padding: '8px 14px', background: 'rgba(233,85,85,0.1)', border: '1px solid rgba(233,85,85,0.25)', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: '700' }}>
            🚫 Bloqueado
          </div>
          <button onClick={desbloquearUsuario} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Desbloquear
          </button>
        </div>
      );
    }
    return (
      <button onClick={enviarPedidoAmizade} className="perfil-botao perfil-botao-principal" style={{ marginTop: '12px' }}>
        + Adicionar Amigo
      </button>
    );
  }

  // ------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ------------------------------------------------------------------
  return (
    <main id="perfil-page" className="perfil-page fundo-aurora-motion">
      <AuroraBackground />
      <div className="perfil-container">
        {/* Cabeçalho */}
        <div className="perfil-cabecalho">
          <div>
            <span className="perfil-kicker">{isPublico ? 'Perfil de jogador' : 'Conta de jogador'}</span>
            <h1>{isPublico ? (usuario.nome || usuario.nome_usuario || 'Perfil') : 'Meu perfil'}</h1>
            <p>{isPublico ? 'Visualizando perfil público do jogador.' : 'Gerencie suas informações, conexões e privacidade.'}</p>
          </div>
          {isPublico ? (
            <button type="button" className="perfil-link-voltar" onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid rgba(181, 101, 242, 0.4)', cursor: 'pointer' }}>
              Voltar
            </button>
          ) : (
            <Link to="/torneios" className="perfil-link-voltar">Ver torneios</Link>
          )}
        </div>

        <section className="perfil-grid">
          {/* ---- Sidebar ---- */}
          <aside className="perfil-resumo">
            <div className="perfil-avatar-wrap">
              <img src={avatarUrl} alt={`Avatar de ${usuario.nome || usuario.nome_usuario}`} />
              <span
                className={`perfil-status-dot ${usuario.status === 'offline' ? 'offline' : ''}`}
                style={usuario.status === 'offline' ? { backgroundColor: '#64748b', boxShadow: 'none' } : {}}
                aria-label={usuario.status === 'offline' ? 'Offline' : 'Online'}
              ></span>
            </div>

            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              {privNome === 'privado' ? 'Nome Privado' : (usuario.nome || usuario.nome_usuario || 'Jogador')}
              {usuario.admin && (
                <span style={{ fontSize: '10px', background: '#8c52ff', padding: '2px 7px', borderRadius: '4px', fontWeight: '800', color: '#fff', letterSpacing: '1.2px', textTransform: 'uppercase', flexShrink: 0 }}>ADM</span>
              )}
            </h2>

            <p className="perfil-cargo">{usuario.nome_usuario ? `@${usuario.nome_usuario}` : 'Sem usuário'}</p>

            <div className="perfil-dados">
              <div><span>Time atual</span><strong>{usuario.time_usuario || 'Nenhum'}</strong></div>
              <div>
                <span>Status</span>
                {usuario.status === 'offline'
                  ? <strong style={{ color: '#94a3b8' }}>Offline</strong>
                  : <strong className="perfil-online">Online agora</strong>
                }
              </div>
              <div><span>Membro desde</span><strong style={{ textTransform: 'capitalize' }}>{dataRegistro}</strong></div>
            </div>

            {/* Botões de amizade (perfil público) */}
            {isPublico && renderBotaoAmizade()}
            {isPublico && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(181, 101, 242, 0.08)', border: '1px solid rgba(181, 101, 242, 0.22)', color: '#c084fc', fontSize: '0.82rem', textAlign: 'center', fontWeight: '600', letterSpacing: '0.5px' }}>
                PERFIL PÚBLICO
              </div>
            )}

            {/* Botões do próprio perfil */}
            {!isPublico && (
              <>
                {!editando && (
                  <button className="perfil-botao perfil-botao-principal" type="button" onClick={iniciarEdicao} style={{ marginBottom: '10px' }}>
                    Editar perfil
                  </button>
                )}
                <button className="perfil-botao perfil-botao-perigo" type="button" onClick={sair}>Sair da conta</button>
              </>
            )}
          </aside>

          {/* ---- Conteúdo principal ---- */}
          <div className="perfil-conteudo">
            {editando ? (
              /* ---- FORMULÁRIO DE EDIÇÃO ---- */
              <section className="perfil-secao">
                <div className="perfil-secao-titulo">
                  <div><span className="perfil-kicker">Configurações</span><h2>Editar Perfil</h2></div>
                </div>
                <form onSubmit={salvarEdicao} style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Dados Básicos</h3>
                    <div className="perfil-detalhes-grid">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>URL da Imagem</label>
                        <input type="url" value={form.imagem} onChange={e => setForm({ ...form, imagem: e.target.value })} placeholder="https://..." style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Nome de usuário (@)</label>
                        <input type="text" value={form.nome_usuario} onChange={e => setForm({ ...form, nome_usuario: e.target.value })} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Biografia</label>
                    <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows="3" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%', resize: 'vertical' }}></textarea>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Conexões (Redes)</h3>
                    <div className="perfil-detalhes-grid">
                      {[
                        { key: 'discord', label: 'Discord', placeholder: 'Usuário#0000' },
                        { key: 'steam', label: 'Steam URL', placeholder: 'https://steamcommunity.com/id/...' },
                        { key: 'twitter', label: 'Twitter / X', placeholder: '@seu_twitter' },
                        { key: 'youtube', label: 'YouTube', placeholder: '@seucanal' },
                        { key: 'twitch', label: 'Twitch', placeholder: 'seucanal' },
                        { key: 'bluesky', label: 'Bluesky', placeholder: '@usuario.bsky.social' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>{label}</label>
                          <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Privacidade</h3>
                    <div className="perfil-detalhes-grid">
                      {[
                        { key: 'privacidade_nome', label: 'Nome de Perfil', opts: [['publico','Público'],['amigos','Apenas Amigos'],['privado','Privado']] },
                        { key: 'privacidade_amigos', label: 'Lista de Amigos', opts: [['publico','Mostrar'],['privado','Privar']] },
                        { key: 'privacidade_ganhos', label: 'Meus Ganhos', opts: [['publico','Mostrar'],['privado','Privar']] },
                      ].map(({ key, label, opts }) => (
                        <div key={key}>
                          <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>{label}</label>
                          <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button type="submit" className="perfil-botao perfil-botao-principal" disabled={salvando} style={{ maxWidth: '200px' }}>
                      {salvando ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button type="button" onClick={() => setEditando(false)} className="perfil-botao perfil-botao-perigo" style={{ margin: 0, maxWidth: '150px' }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <>
                {/* ---- DETALHES DA CONTA ---- */}
                <section className="perfil-secao" id="detalhes-conta">
                  <div className="perfil-secao-titulo">
                    <div><span className="perfil-kicker">Sobre</span><h2>Biografia</h2></div>
                  </div>
                  <p style={{ color: 'var(--texto-secundario)', lineHeight: '1.6' }}>
                    {usuario.bio || 'Este jogador ainda não escreveu nenhuma biografia.'}
                  </p>

                  <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', margin: '32px 0 14px' }}>Desempenho</h3>
                  <div className="perfil-detalhes-grid" style={{ gap: '16px' }}>
                    {[
                      { label: 'Partidas Jogadas', valor: statsPartidas, cor: '#e8e0f0' },
                      { label: 'Torneios Participados', valor: statsTorneios, cor: '#e8e0f0' },
                      { label: 'Torneios Vencidos', valor: statsTitulos, cor: '#e8e0f0' },
                      { label: 'Ganhos Totais', valor: statsGanhos, cor: privGanhos === 'privado' ? 'var(--texto-terciario)' : '#5ce390' },
                    ].map(({ label, valor, cor }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>{label}</span>
                        <strong style={{ fontSize: '28px', color: cor }}>{valor}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ---- BIOGRAFIA + DESEMPENHO ---- */}
            

                {/* ---- CONEXÕES VINCULADAS ---- */}
                <section className="perfil-secao" style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', margin: '0 0 16px' }}>Conexões Vinculadas</h3>
                  <div className="perfil-contas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {[
                      { label: 'Discord', val: discord, bg: '#5865f2', icon: '/svg/discord.svg' },
                      { label: 'Steam', val: steam, bg: '#1b2838', icon: '/svg/steam.svg' },
                      { label: 'Twitter / X', val: twitter, bg: '#1DA1F2', icon: '/svg/twitter.svg' },
                      { label: 'YouTube', val: youtube, bg: '#FF0000', icon: '/svg/youtube.svg' },
                      { label: 'Twitch', val: twitch, bg: '#9146FF', icon: '/svg/twitch.svg' },
                      { label: 'Bluesky', val: bluesky, bg: '#0085FF', icon: '/svg/bluesky.svg' },
                    ].map(({ label, val, bg, icon }) => (
                      <div key={label} className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                        <span className="perfil-conta-icone" style={{ background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={icon} alt={label} style={{ width: '20px', height: '20px' }} />
                        </span>
                        <div><strong>{label}</strong><span>{val || 'Não conectado'}</span></div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ---- LISTA DE AMIGOS (perfil próprio) ---- */}
                {!isPublico && (
                  <section className="perfil-secao perfil-secao-amigos" style={{ marginTop: '24px' }}>
                    <div className="perfil-amigos-header">
                      <div>
                        <span className="perfil-kicker">Comunidade</span>
                        <h2>
                          Lista de Amigos <small>({listaAmigos.length})</small>
                          {totalPendentes > 0 && (
                            <span style={{ marginLeft: '8px', background: '#e95555', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                              {totalPendentes} pendente{totalPendentes > 1 ? 's' : ''}
                            </span>
                          )}
                        </h2>
                      </div>

                      {/* Barra de busca */}
                      <div className="perfil-buscar-amigo-wrap" ref={buscarAmigoRef}>
                        <div className="perfil-buscar-input-container">
                          <svg className="perfil-buscar-icone" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                          <input
                            type="text"
                            className="perfil-buscar-input"
                            value={buscaAmigo}
                            onChange={(e) => setBuscaAmigo(e.target.value)}
                            onFocus={() => buscaAmigo.trim() && setDropdownAmigoAberto(true)}
                            placeholder="Buscar jogadores para adicionar..."
                          />
                          {buscaAmigo && (
                            <button type="button" className="perfil-buscar-limpar" onClick={() => { setBuscaAmigo(''); setResultadosBusca([]); setDropdownAmigoAberto(false); }} aria-label="Limpar busca">
                              &times;
                            </button>
                          )}
                        </div>

                        {dropdownAmigoAberto && buscaAmigo.trim().length > 0 && (
                          <div className="perfil-autocomplete-dropdown">
                            {buscandoAmigos ? (
                              <div className="perfil-autocomplete-loading">Buscando jogadores...</div>
                            ) : resultadosBusca.length > 0 ? (
                              resultadosBusca.map((j) => (
                                <div key={j.id} className="perfil-autocomplete-item">
                                  <div className="perfil-autocomplete-user">
                                    <img
                                      src={j.imagem || `https://placehold.co/96x96/35176b/ffffff?text=${(j.nome_usuario || j.nome || 'J').substring(0, 2).toUpperCase()}`}
                                      alt={j.nome || j.nome_usuario}
                                      className="perfil-autocomplete-avatar"
                                    />
                                    <div className="perfil-autocomplete-info">
                                      <strong>{j.nome || j.nome_usuario}</strong>
                                      <span>{j.nome_usuario ? `@${j.nome_usuario}` : ''}{j.time_usuario ? ` • ${j.time_usuario}` : ''}</span>
                                    </div>
                                  </div>
                                  <button type="button" className="perfil-autocomplete-add-btn" onClick={() => handleEnviarPedido(j)} title="Enviar pedido de amizade">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <line x1="12" y1="5" x2="12" y2="19"></line>
                                      <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    <span>Adicionar</span>
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="perfil-autocomplete-empty">Nenhum jogador encontrado</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Abas */}
                    <div className="perfil-amigos-abas">
                      {[
                        { key: 'amigos',   label: `Amigos (${listaAmigos.length})` },
                        { key: 'pendentes', label: 'Pendentes', badge: totalPendentes },
                        { key: 'enviados',  label: `Enviados (${pedidosEnviados.length})` },
                      ].map(({ key, label, badge }) => (
                        <button key={key} className={`perfil-aba-amigos ${abaAmigos === key ? 'ativa' : ''}`} onClick={() => setAbaAmigos(key)} type="button">
                          {label}
                          {badge > 0 && <span className="perfil-aba-badge">{badge}</span>}
                        </button>
                      ))}
                    </div>

                    {/* Conteúdo das abas */}
                    {privAmigos === 'privado' ? (
                      <p className="perfil-vazio">Sua lista de amigos está definida como privada nas configurações.</p>
                    ) : carregandoAmigos ? (
                      <div className="perfil-amigos-loading">
                        <div className="perfil-spinner"></div>
                        Carregando amizades...
                      </div>
                    ) : (
                      <>
                        {/* ABA: Amigos aceitos */}
                        {abaAmigos === 'amigos' && (
                          <div className="perfil-amigos">
                            {listaAmigos.length === 0 ? (
                              <p className="perfil-vazio">Nenhum amigo na sua lista. Use o campo de busca para encontrar e adicionar jogadores!</p>
                            ) : listaAmigos.map((amigo) => (
                              <article className="perfil-amigo" key={amigo.amizade_id}>
                                <img
                                  src={amigo.imagem || `https://placehold.co/96x96/291547/ffffff?text=${(amigo.nome_usuario || amigo.nome || 'J').substring(0, 2).toUpperCase()}`}
                                  alt={amigo.nome || amigo.nome_usuario}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate(`/perfil/${amigo.id}`)}
                                />
                                <div className="perfil-amigo-info">
                                  <strong style={{ cursor: 'pointer', color: '#e8e0f0' }} onClick={() => navigate(`/perfil/${amigo.id}`)}>
                                    {amigo.nome_usuario ? `@${amigo.nome_usuario}` : amigo.nome}
                                  </strong>
                                  <span>{amigo.time_usuario || 'Sem equipe'}</span>
                                  <em style={{ color: 'var(--texto-terciario)' }}>{amigo.nome || ''}</em>
                                </div>
                                <div className="perfil-amigo-acoes">
                                  <button type="button" onClick={() => removerAmigo(amigo.amizade_id, amigo.nome_usuario || amigo.nome)} title="Remover amigo">Remover</button>
                                  <button type="button" onClick={() => bloquearAmigo(amigo.amizade_id, amigo.id, amigo.nome_usuario || amigo.nome)} title="Bloquear" style={{ color: '#f87171' }}>Bloquear</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}

                        {/* ABA: Pedidos recebidos */}
                        {abaAmigos === 'pendentes' && (
                          <div className="perfil-amigos">
                            {pedidosPendentes.length === 0 ? (
                              <p className="perfil-vazio">Nenhum pedido de amizade pendente.</p>
                            ) : pedidosPendentes.map((p) => (
                              <article className="perfil-amigo perfil-amigo-pendente" key={p.id}>
                                <img
                                  src={p.remetente?.imagem || `https://placehold.co/96x96/291547/ffffff?text=${(p.remetente?.nome_usuario || 'J').substring(0, 2).toUpperCase()}`}
                                  alt={p.remetente?.nome || p.remetente?.nome_usuario}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate(`/perfil/${p.remetente?.id}`)}
                                />
                                <div className="perfil-amigo-info">
                                  <strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/perfil/${p.remetente?.id}`)}>
                                    {p.remetente?.nome_usuario ? `@${p.remetente.nome_usuario}` : p.remetente?.nome}
                                  </strong>
                                  <span>{p.remetente?.time_usuario || 'Sem equipe'}</span>
                                  <em style={{ color: '#c084fc', fontStyle: 'normal', fontSize: '11px' }}>Pedido recebido</em>
                                </div>
                                <div className="perfil-amigo-acoes">
                                  <button type="button" onClick={() => aceitarPedido(p.id)} style={{ color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '6px 12px', borderRadius: '6px', background: 'rgba(74,222,128,0.08)' }}>
                                    ✓ Aceitar
                                  </button>
                                  <button type="button" onClick={() => rejeitarPedido(p.id)} style={{ color: '#f87171' }}>Rejeitar</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}

                        {/* ABA: Pedidos enviados */}
                        {abaAmigos === 'enviados' && (
                          <div className="perfil-amigos">
                            {pedidosEnviados.length === 0 ? (
                              <p className="perfil-vazio">Nenhum pedido de amizade enviado aguardando resposta.</p>
                            ) : pedidosEnviados.map((e) => (
                              <article className="perfil-amigo" key={e.id} style={{ opacity: 0.8 }}>
                                <img
                                  src={e.destinatario?.imagem || `https://placehold.co/96x96/291547/ffffff?text=${(e.destinatario?.nome_usuario || 'J').substring(0, 2).toUpperCase()}`}
                                  alt={e.destinatario?.nome || e.destinatario?.nome_usuario}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate(`/perfil/${e.destinatario?.id}`)}
                                />
                                <div className="perfil-amigo-info">
                                  <strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/perfil/${e.destinatario?.id}`)}>
                                    {e.destinatario?.nome_usuario ? `@${e.destinatario.nome_usuario}` : e.destinatario?.nome}
                                  </strong>
                                  <span>{e.destinatario?.time_usuario || 'Sem equipe'}</span>
                                  <em style={{ color: '#a78bfa', fontStyle: 'normal', fontSize: '11px' }}>⏳ Aguardando resposta</em>
                                </div>
                                <div className="perfil-amigo-acoes">
                                  <button type="button" onClick={() => cancelarPedidoEnviado(e.id)} title="Cancelar pedido">Cancelar</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}

                {/* ---- AMIGOS em perfil público (exibe contagem) ---- */}
                {isPublico && privAmigos === 'publico' && (
                  <section className="perfil-secao" style={{ marginTop: '24px' }}>
                    <div className="perfil-secao-titulo">
                      <div><span className="perfil-kicker">Comunidade</span><h2>Amigos</h2></div>
                    </div>
                    <p style={{ color: 'var(--texto-secundario)', fontSize: '14px' }}>
                      Lista de amigos não exibida publicamente neste perfil.
                    </p>
                  </section>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}