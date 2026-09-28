import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../css/perfil.css';
import { useAlerta } from './AlertaModal';

const AMIGOS_PADRAO = [
  {
    id: 'amg-1',
    nome: 'Lucas Silva',
    name: 'Lucas Silva',
    equipe: 'Vortex Gaming',
    status: 'online',
    imagem: 'https://placehold.co/96x96/291547/ffffff?text=LS'
  },
  {
    id: 'amg-2',
    nome: 'Ana Costa',
    name: 'Ana Costa',
    equipe: 'Nexus Five',
    status: 'offline',
    imagem: 'https://placehold.co/96x96/42206b/ffffff?text=AC'
  },
  {
    id: 'amg-3',
    nome: 'Rafael Lima',
    name: 'Rafael Lima',
    equipe: 'Sem equipe',
    status: 'offline',
    imagem: 'https://placehold.co/96x96/17121f/ffffff?text=RL'
  }
];

const POOL_JOGADORES_DISPONIVEIS = [
  {
    id: '1',
    nome: 'Gabriel Toledo',
    nome_usuario: 'FalleN',
    time_usuario: 'FURIA Esports',
    imagem: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=faces',
    status: 'online'
  },
  {
    id: '2',
    nome: 'Marcelo David',
    nome_usuario: 'coldzera',
    time_usuario: 'RED Canids',
    imagem: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces',
    status: 'offline'
  },
  {
    id: '3',
    nome: 'Fernando Alvarenga',
    nome_usuario: 'fer',
    time_usuario: 'O PLANO',
    imagem: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=faces',
    status: 'online'
  },
  {
    id: '4',
    nome: 'Epitácio de Melo',
    nome_usuario: 'TACO',
    time_usuario: 'Legacy',
    imagem: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    status: 'online'
  },
  {
    id: '5',
    nome: 'Lincoln Lau',
    nome_usuario: 'fnx',
    time_usuario: 'Imperial',
    imagem: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
    status: 'offline'
  },
  {
    id: '6',
    nome: 'Alexandre Borba',
    nome_usuario: 'gaules',
    time_usuario: 'Tribo Gaules',
    imagem: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
    status: 'online'
  },
  {
    id: 'usr-s1mple',
    nome: 'Oleksandr Kostyliev',
    nome_usuario: 's1mple',
    time_usuario: 'Natus Vincere',
    imagem: 'https://placehold.co/96x96/120d20/ffffff?text=S1',
    status: 'online'
  },
  {
    id: 'usr-zywoo',
    nome: 'Mathieu Herbaut',
    nome_usuario: 'ZywOo',
    time_usuario: 'Team Vitality',
    imagem: 'https://placehold.co/96x96/120d20/ffffff?text=ZY',
    status: 'online'
  },
  {
    id: 'usr-kscerato',
    nome: 'Kaike Cerato',
    nome_usuario: 'KSCERATO',
    time_usuario: 'FURIA Esports',
    imagem: 'https://placehold.co/96x96/120d20/ffffff?text=KS',
    status: 'online'
  },
  {
    id: 'usr-yuurih',
    nome: 'Yuri Santos',
    nome_usuario: 'yuurih',
    time_usuario: 'FURIA Esports',
    imagem: 'https://placehold.co/96x96/120d20/ffffff?text=YU',
    status: 'online'
  },
  {
    id: 'usr-chelo',
    nome: 'Marcelo Cespedes',
    nome_usuario: 'chelo',
    time_usuario: 'FURIA Esports',
    imagem: 'https://placehold.co/96x96/120d20/ffffff?text=CH',
    status: 'offline'
  },
  {
    id: 'usr-art',
    nome: 'Andrei Piovezan',
    nome_usuario: 'arT',
    time_usuario: 'Fluxo',
    imagem: 'https://placehold.co/96x96/120d20/ffffff?text=AR',
    status: 'online'
  },
  {
    id: 'usr-admin',
    nome: 'Administrador',
    nome_usuario: 'admin',
    time_usuario: 'Staff Antigravity',
    imagem: 'https://placehold.co/96x96/35176b/ffffff?text=AD',
    status: 'online'
  }
];

const MOCK_PERFIS_AMIGOS = {
  '1': {
    id: 1,
    nome: "Gabriel Toledo",
    nome_usuario: "FalleN",
    time_usuario: "FURIA Esports",
    bio: "Professor do CS brasileiro. Bi-campeão de Major. Capitão, AWP & líder lendário nos servidores.",
    imagem: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=faces",
    registro: "2016-01-15T00:00:00.000Z",
    status: "online",
    discord: "FalleN#0001",
    steam: "https://steamcommunity.com/id/fallen",
    twitter: "@FalleNCS",
    stats: { partidas: 1420, torneios: 88, titulos: 24, ganhos: "R$ 4.250.000,00" }
  },
  '2': {
    id: 2,
    nome: "Marcelo David",
    nome_usuario: "coldzera",
    time_usuario: "RED Canids",
    bio: "2x Melhor Jogador do Mundo (2016/2017). Eternizado no grafite dos 4 abates saltando na Mirage.",
    imagem: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces",
    registro: "2016-03-20T00:00:00.000Z",
    status: "offline",
    discord: "coldzera#0002",
    steam: "https://steamcommunity.com/id/coldzera",
    twitter: "@coldzera",
    stats: { partidas: 1290, torneios: 82, titulos: 22, ganhos: "R$ 3.900.000,00" }
  },
  '3': {
    id: 3,
    nome: "Fernando Alvarenga",
    nome_usuario: "fer",
    time_usuario: "O PLANO",
    bio: "A dona morte! Campeão de 2 Majors de CS:GO, agressividade e mira afiada sem medo.",
    imagem: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=faces",
    registro: "2016-01-15T00:00:00.000Z",
    status: "online",
    discord: "fer#0003",
    steam: "https://steamcommunity.com/id/fergod",
    twitter: "@fer",
    stats: { partidas: 1150, torneios: 75, titulos: 20, ganhos: "R$ 3.400.000,00" }
  },
  '4': {
    id: 4,
    nome: "Epitácio de Melo",
    nome_usuario: "TACO",
    time_usuario: "Legacy",
    bio: "Entry fragger histórico, 2x campeão de Major. 'Are you mad? Cuz I'm not'.",
    imagem: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
    registro: "2016-04-10T00:00:00.000Z",
    status: "online",
    discord: "TACO#0004",
    steam: "https://steamcommunity.com/id/tacocs",
    twitter: "@TACOCS",
    stats: { partidas: 1080, torneios: 70, titulos: 19, ganhos: "R$ 3.100.000,00" }
  },
  '5': {
    id: 5,
    nome: "Lincoln Lau",
    nome_usuario: "fnx",
    time_usuario: "Imperial",
    bio: "Sem fnx sem Major! Lenda viva com títulos mundiais no 1.6 e bicampeonato no CS:GO.",
    imagem: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
    registro: "2015-11-05T00:00:00.000Z",
    status: "offline",
    discord: "fnx#0005",
    steam: "https://steamcommunity.com/id/fnxforever",
    twitter: "@linfnx",
    stats: { partidas: 990, torneios: 65, titulos: 21, ganhos: "R$ 2.800.000,00" }
  },
  '6': {
    id: 6,
    nome: "Alexandre Borba",
    nome_usuario: "gaules",
    time_usuario: "Tribo Gaules",
    bio: "A Tribo cuida da Tribo! Ex-jogador profissional, técnico e maior streamer gamer da América Latina.",
    imagem: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces",
    registro: "2015-08-01T00:00:00.000Z",
    status: "online",
    discord: "gaules#0006",
    steam: "https://steamcommunity.com/id/gaules",
    twitter: "@Gaules",
    stats: { partidas: 850, torneios: 40, titulos: 10, ganhos: "R$ 1.500.000,00" }
  }
};

export default function Perfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mostrarAlerta } = useAlerta();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPublico, setIsPublico] = useState(false);
  
  // Estados para edição
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Estados para Lista de Amigos e Busca Dinâmica
  const [listaAmigos, setListaAmigos] = useState(() => {
    try {
      const salvasPerfil = localStorage.getItem('listaAmigosPerfil');
      if (salvasPerfil) return JSON.parse(salvasPerfil);
      const salvasMenu = localStorage.getItem('listaAmigosUsuario');
      if (salvasMenu) {
        const parsed = JSON.parse(salvasMenu);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a, idx) => ({
            id: a.id || `amg-${idx}`,
            nome: a.nome || a.name || 'Jogador',
            name: a.name || a.nome || 'Jogador',
            equipe: a.equipe || a.time_usuario || (a.game ? `Game: ${a.game}` : 'Sem equipe'),
            status: a.status || 'offline',
            imagem:
              a.imagem ||
              a.avatar ||
              `https://placehold.co/96x96/291547/ffffff?text=${encodeURIComponent(
                (a.nome || a.name || 'J').substring(0, 2).toUpperCase()
              )}`
          }));
        }
      }
      return AMIGOS_PADRAO;
    } catch {
      return AMIGOS_PADRAO;
    }
  });

  const [buscaAmigo, setBuscaAmigo] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [dropdownAmigoAberto, setDropdownAmigoAberto] = useState(false);
  const [buscandoAmigos, setBuscandoAmigos] = useState(false);
  const buscarAmigoRef = useRef(null);

  useEffect(() => {
    async function carregarPerfil() {
      const salvo = localStorage.getItem('usuarioLogado');
      const userLocal = salvo ? JSON.parse(salvo) : null;

      // Se temos um ID na URL e não é o ID do usuário logado -> visualização pública
      if (id && (!userLocal || String(userLocal.id) !== String(id))) {
        setIsPublico(true);

        // 1. Amigo mockado pré-configurado
        if (MOCK_PERFIS_AMIGOS[String(id)]) {
          setUsuario(MOCK_PERFIS_AMIGOS[String(id)]);
          setLoading(false);
          return;
        }

        // 2. Busca usuário no Supabase
        const { data } = await supabase
          .from('usuarios')
          .select('id, nome, nome_usuario, time_usuario, bio, imagem, registro')
          .eq('id', id)
          .single();

        if (data) {
          setUsuario(data);
        } else {
          setUsuario({
            id,
            nome: `Jogador #${id}`,
            nome_usuario: `jogador_${id}`,
            time_usuario: 'Sem equipe',
            bio: 'Perfil público de jogador na plataforma.',
            imagem: '',
            registro: new Date().toISOString(),
            status: 'offline'
          });
        }
        setLoading(false);
        return;
      }

      // Perfil do próprio usuário logado
      setIsPublico(false);
      if (!salvo) {
        navigate('/login');
        return;
      }
      
      const userParsed = JSON.parse(salvo);
      if (!userParsed.id) {
        navigate('/login');
        return;
      }

      // Busca dados atualizados do banco
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, nome_usuario, time_usuario, bio, imagem, registro, admin, conexao_discord, conexao_steam, conexao_twitter, conexao_youtube, conexao_twitch, conexao_bluesky')
        .eq('id', userParsed.id)
        .single();

      if (data) {
        setUsuario(data);
      } else {
        setUsuario(userParsed);
      }
      setLoading(false);
    }
    carregarPerfil();
  }, [id, navigate]);

  // Fechar dropdown de busca ao clicar fora
  useEffect(() => {
    const fecharAoClicarFora = (e) => {
      if (buscarAmigoRef.current && !buscarAmigoRef.current.contains(e.target)) {
        setDropdownAmigoAberto(false);
      }
    };
    document.addEventListener('click', fecharAoClicarFora);
    return () => document.removeEventListener('click', fecharAoClicarFora);
  }, []);

  // Filtro dinâmico em tempo real de busca de jogadores
  useEffect(() => {
    const termo = buscaAmigo.trim().toLowerCase();
    if (!termo) {
      setResultadosBusca([]);
      setDropdownAmigoAberto(false);
      setBuscandoAmigos(false);
      return;
    }

    setBuscandoAmigos(true);
    let ativo = true;

    // 1. Filtrar nos jogadores do pool local
    const locais = POOL_JOGADORES_DISPONIVEIS.filter((j) => {
      const matchNome = j.nome && j.nome.toLowerCase().includes(termo);
      const matchNick = j.nome_usuario && j.nome_usuario.toLowerCase().includes(termo);
      const matchTime = j.time_usuario && j.time_usuario.toLowerCase().includes(termo);

      if (!matchNome && !matchNick && !matchTime) return false;

      // Não permitir o próprio usuário
      if (
        String(j.id) === String(usuario?.id) ||
        (j.nome_usuario && usuario?.nome_usuario && j.nome_usuario.toLowerCase() === usuario.nome_usuario.toLowerCase()) ||
        (j.nome && usuario?.nome && j.nome.toLowerCase() === usuario.nome.toLowerCase())
      ) {
        return false;
      }

      // Não permitir quem já é amigo
      const jaAmigo = listaAmigos.some(
        (a) =>
          String(a.id) === String(j.id) ||
          (a.nome || a.name || '').toLowerCase() === (j.nome || j.nome_usuario || '').toLowerCase() ||
          (j.nome_usuario && (a.nome || a.name || '').toLowerCase() === j.nome_usuario.toLowerCase())
      );

      return !jaAmigo;
    });

    setResultadosBusca(locais);
    setDropdownAmigoAberto(true);

    // 2. Buscar no Supabase se houver conexão
    if (supabase) {
      supabase
        .from('usuarios')
        .select('id, nome, nome_usuario, time_usuario, imagem')
        .or(`nome.ilike.%${termo}%,nome_usuario.ilike.%${termo}%`)
        .limit(8)
        .then(({ data, error }) => {
          if (ativo && !error && data) {
            const combinados = [...locais];
            data.forEach((jDb) => {
              const ehProprioUsuario =
                String(jDb.id) === String(usuario?.id) ||
                (jDb.nome_usuario && usuario?.nome_usuario && jDb.nome_usuario.toLowerCase() === usuario.nome_usuario.toLowerCase()) ||
                (jDb.nome && usuario?.nome && jDb.nome.toLowerCase() === usuario.nome.toLowerCase());

              const jaAmigo = listaAmigos.some(
                (a) =>
                  String(a.id) === String(jDb.id) ||
                  (a.nome || a.name || '').toLowerCase() === (jDb.nome || jDb.nome_usuario || '').toLowerCase() ||
                  (jDb.nome_usuario && (a.nome || a.name || '').toLowerCase() === jDb.nome_usuario.toLowerCase())
              );

              const jaPresente = combinados.some(
                (item) =>
                  String(item.id) === String(jDb.id) ||
                  (item.nome_usuario && jDb.nome_usuario && item.nome_usuario.toLowerCase() === jDb.nome_usuario.toLowerCase())
              );

              if (!ehProprioUsuario && !jaAmigo && !jaPresente) {
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
            setResultadosBusca(combinados);
          }
          if (ativo) setBuscandoAmigos(false);
        })
        .catch(() => {
          if (ativo) setBuscandoAmigos(false);
        });
    } else {
      setBuscandoAmigos(false);
    }

    return () => {
      ativo = false;
    };
  }, [buscaAmigo, listaAmigos, usuario]);

  function handleKeyDownBusca(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (resultadosBusca.length > 0) {
        handleAdicionarAmigo(resultadosBusca[0]);
      }
    }
  }

  function handleAdicionarAmigo(jogador) {
    if (
      String(jogador.id) === String(usuario?.id) ||
      (jogador.nome_usuario && usuario?.nome_usuario && jogador.nome_usuario.toLowerCase() === usuario.nome_usuario.toLowerCase()) ||
      (jogador.nome && usuario?.nome && jogador.nome.toLowerCase() === usuario.nome.toLowerCase())
    ) {
      mostrarAlerta({
        titulo: 'Ação não permitida',
        mensagem: 'Você não pode adicionar a si mesmo como amigo.',
        tipo: 'aviso'
      });
      return;
    }

    const jaAdicionado = listaAmigos.some(
      (a) =>
        String(a.id) === String(jogador.id) ||
        (a.nome || a.name || '').toLowerCase() === (jogador.nome || jogador.nome_usuario || '').toLowerCase() ||
        (jogador.nome_usuario && (a.nome || a.name || '').toLowerCase() === jogador.nome_usuario.toLowerCase())
    );

    if (jaAdicionado) {
      mostrarAlerta({
        titulo: 'Jogador já adicionado',
        mensagem: `${jogador.nome || jogador.nome_usuario} já está na sua lista de amigos.`,
        tipo: 'aviso'
      });
      return;
    }

    const novoAmigo = {
      id: jogador.id || `amg-${Date.now()}`,
      nome: jogador.nome || jogador.nome_usuario || 'Jogador',
      name: jogador.nome_usuario || jogador.nome || 'Jogador',
      equipe: jogador.time_usuario || jogador.equipe || 'Sem equipe',
      status: jogador.status || 'online',
      imagem:
        jogador.imagem ||
        `https://placehold.co/96x96/291547/ffffff?text=${encodeURIComponent(
          (jogador.nome_usuario || jogador.nome || 'J').substring(0, 2).toUpperCase()
        )}`
    };

    const novaLista = [novoAmigo, ...listaAmigos];
    setListaAmigos(novaLista);

    try {
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(novaLista));
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(novaLista));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Erro ao salvar amigos:', err);
    }

    if (supabase && usuario?.id && jogador.id) {
      try {
        supabase
          .from('amizades')
          .insert({
            id_usuario: usuario.id,
            id_amigo: jogador.id,
            status: 'aceito'
          })
          .then(() => {})
          .catch(() => {});
      } catch {
        // Fallback caso tabela não exista
      }
    }

    setBuscaAmigo('');
    setResultadosBusca([]);
    setDropdownAmigoAberto(false);

    mostrarAlerta({
      titulo: 'Amigo Adicionado!',
      mensagem: `${novoAmigo.nome} foi adicionado à sua lista de amigos com sucesso.`,
      tipo: 'sucesso'
    });
  }

  function handleRemoverAmigo(amigo) {
    const novaLista = listaAmigos.filter((a) => String(a.id) !== String(amigo.id));
    setListaAmigos(novaLista);
    try {
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(novaLista));
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(novaLista));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
    mostrarAlerta({
      titulo: 'Amizade Removida',
      mensagem: `${amigo.nome || amigo.name} foi removido da sua lista de amigos.`,
      tipo: 'aviso'
    });
  }

  function sair() {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      localStorage.removeItem('usuarioLogado');
      navigate('/');
      window.dispatchEvent(new Event('storage'));
    }
  }

  function iniciarEdicao() {
    setForm({
      nome_usuario: usuario.nome_usuario || '',
      imagem: usuario.imagem || '',
      bio: usuario.bio || '',
      // Conexões agora vêm do banco
      discord: usuario.conexao_discord || '',
      steam: usuario.conexao_steam || '',
      twitter: usuario.conexao_twitter || '',
      youtube: usuario.conexao_youtube || '',
      twitch: usuario.conexao_twitch || '',
      bluesky: usuario.conexao_bluesky || '',
      privacidade_amigos: localStorage.getItem(`priv_amigos_${usuario.id}`) || 'publico',
      privacidade_nome: localStorage.getItem(`priv_nome_${usuario.id}`) || 'publico',
      privacidade_ganhos: localStorage.getItem(`priv_ganhos_${usuario.id}`) || 'publico'
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
      conexao_bluesky: form.bluesky
    };

    const { error } = await supabase
      .from('usuarios')
      .update(payload)
      .eq('id', usuario.id);

    if (error) {
      mostrarAlerta({
        titulo: 'Erro ao Salvar',
        mensagem: 'Erro ao salvar no banco de dados: ' + error.message,
        tipo: 'erro'
      });
      setSalvando(false);
      return;
    }

    // Salva configs locais de privacidade
    localStorage.removeItem(`fundo_${usuario.id}`);
    localStorage.setItem(`priv_amigos_${usuario.id}`, form.privacidade_amigos);
    localStorage.setItem(`priv_nome_${usuario.id}`, form.privacidade_nome);
    localStorage.setItem(`priv_ganhos_${usuario.id}`, form.privacidade_ganhos);

    setUsuario(prev => ({ ...prev, ...payload }));
    setSalvando(false);
    setEditando(false);
    mostrarAlerta({
      titulo: 'Perfil Atualizado!',
      mensagem: 'Suas informações de perfil foram salvas com sucesso.',
      tipo: 'sucesso'
    });
  }

  if (loading) {
    return (
      <main id="perfil-page" className="perfil-page">
        <div className="perfil-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2 style={{ color: 'var(--roxo-claro)' }}>Carregando perfil...</h2>
        </div>
      </main>
    );
  }

  if (!usuario) return null;

  const dataRegistro = new Date(usuario.registro).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const avatarUrl = usuario.imagem || `https://placehold.co/180x180/35176b/ffffff?text=${(usuario.nome || usuario.nome_usuario || 'U').substring(0, 2).toUpperCase()}`;

  // Conexões — agora vêm do banco para o usuário logado, ou do mock para perfis públicos
  const discord = isPublico ? (usuario.discord || null) : usuario.conexao_discord;
  const steam = isPublico ? (usuario.steam || null) : usuario.conexao_steam;
  const twitter = isPublico ? (usuario.twitter || null) : usuario.conexao_twitter;
  const youtube = isPublico ? null : usuario.conexao_youtube;
  const twitch = isPublico ? null : usuario.conexao_twitch;
  const bluesky = isPublico ? null : usuario.conexao_bluesky;
  const privNome = isPublico ? 'publico' : (localStorage.getItem(`priv_nome_${usuario.id}`) || 'publico');
  const privGanhos = isPublico ? (usuario.stats ? 'publico' : 'privado') : (localStorage.getItem(`priv_ganhos_${usuario.id}`) || 'publico');
  const privAmigos = isPublico ? 'publico' : (localStorage.getItem(`priv_amigos_${usuario.id}`) || 'publico');

  const statsPartidas = usuario.stats ? usuario.stats.partidas : 0;
  const statsTorneios = usuario.stats ? usuario.stats.torneios : 0;
  const statsTitulos = usuario.stats ? usuario.stats.titulos : 0;
  const statsGanhos = usuario.stats ? usuario.stats.ganhos : (privGanhos === 'privado' ? 'Oculto' : 'R$ 0,00');

  return (
    <main id="perfil-page" className="perfil-page">
      <div className="perfil-container">
        <div className="perfil-cabecalho">
          <div>
            <span className="perfil-kicker">{isPublico ? 'Perfil de jogador' : 'Conta de jogador'}</span>
            <h1>{isPublico ? (usuario.nome || usuario.nome_usuario || 'Perfil') : 'Meu perfil'}</h1>
            <p>{isPublico ? 'Visualizando perfil público do jogador.' : 'Gerencie suas informações, conexões e privacidade.'}</p>
          </div>
          {isPublico ? (
            <button
              type="button"
              className="perfil-link-voltar"
              onClick={() => navigate(-1)}
              style={{ background: 'transparent', border: '1px solid rgba(181, 101, 242, 0.4)', cursor: 'pointer' }}
            >
              Voltar
            </button>
          ) : (
            <Link to="/torneios" className="perfil-link-voltar">Ver torneios</Link>
          )}
        </div>

        <section className="perfil-grid">
          <aside className="perfil-resumo">
            <div className="perfil-avatar-wrap">
              <img src={avatarUrl} alt={`Avatar de ${usuario.nome || usuario.nome_usuario}`} />
              <span
                className={`perfil-status-dot ${usuario.status === 'offline' ? 'offline' : ''}`}
                style={usuario.status === 'offline' ? { backgroundColor: '#64748b', boxShadow: 'none' } : {}}
                aria-label={usuario.status === 'offline' ? 'Offline' : 'Online'}
              ></span>
            </div>
            
            {/* Nome + tag ADM */}
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
                {usuario.status === 'offline' ? (
                  <strong style={{ color: '#94a3b8' }}>Offline</strong>
                ) : (
                  <strong className="perfil-online">Online agora</strong>
                )}
              </div>
              <div><span>Membro desde</span><strong style={{textTransform: 'capitalize'}}>{dataRegistro}</strong></div>
            </div>
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
            {isPublico && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(181, 101, 242, 0.08)', border: '1px solid rgba(181, 101, 242, 0.22)', color: '#c084fc', fontSize: '0.82rem', textAlign: 'center', fontWeight: '600', letterSpacing: '0.5px' }}>
                PERFIL PÚBLICO
              </div>
            )}
          </aside>

          <div className="perfil-conteudo">
            {editando ? (
              <section className="perfil-secao">
                <div className="perfil-secao-titulo">
                  <div><span className="perfil-kicker">Configurações</span><h2>Editar Perfil</h2></div>
                </div>
                <form onSubmit={salvarEdicao} style={{ display: 'grid', gap: '20px' }}>
                  
                  {/* DADOS BÁSICOS */}
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Dados Básicos</h3>
                    <div className="perfil-detalhes-grid">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>URL da Imagem</label>
                        <input type="url" value={form.imagem} onChange={e => setForm({...form, imagem: e.target.value})} placeholder="https://..." style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Nome de usuário (@)</label>
                        <input type="text" value={form.nome_usuario} onChange={e => setForm({...form, nome_usuario: e.target.value})} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Biografia</label>
                    <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows="3" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%', resize: 'vertical' }}></textarea>
                  </div>

                  {/* REDES SOCIAIS */}
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Conexões (Redes)</h3>
                    <div className="perfil-detalhes-grid">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Discord</label>
                        <input type="text" value={form.discord} onChange={e => setForm({...form, discord: e.target.value})} placeholder="Usuário#0000" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Steam URL</label>
                        <input type="text" value={form.steam} onChange={e => setForm({...form, steam: e.target.value})} placeholder="https://steamcommunity.com/id/..." style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Twitter / X</label>
                        <input type="text" value={form.twitter} onChange={e => setForm({...form, twitter: e.target.value})} placeholder="@seu_twitter" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>YouTube</label>
                        <input type="text" value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})} placeholder="@seucanal" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Twitch</label>
                        <input type="text" value={form.twitch} onChange={e => setForm({...form, twitch: e.target.value})} placeholder="seucanal" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Bluesky</label>
                        <input type="text" value={form.bluesky} onChange={e => setForm({...form, bluesky: e.target.value})} placeholder="@usuario.bsky.social" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  {/* PRIVACIDADE */}
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Privacidade</h3>
                    <div className="perfil-detalhes-grid">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Nome de Perfil</label>
                        <select value={form.privacidade_nome} onChange={e => setForm({...form, privacidade_nome: e.target.value})} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                          <option value="publico">Público</option>
                          <option value="amigos">Apenas Amigos</option>
                          <option value="privado">Privado</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Lista de Amigos</label>
                        <select value={form.privacidade_amigos} onChange={e => setForm({...form, privacidade_amigos: e.target.value})} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                          <option value="publico">Mostrar</option>
                          <option value="privado">Privar</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Meus Ganhos</label>
                        <select value={form.privacidade_ganhos} onChange={e => setForm({...form, privacidade_ganhos: e.target.value})} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                          <option value="publico">Mostrar</option>
                          <option value="privado">Privar</option>
                        </select>
                      </div>
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
                {/* DETALHES DA CONTA */}
                <section className="perfil-secao" id="detalhes-conta">
                  <div className="perfil-secao-titulo">
                    <div><span className="perfil-kicker">Informações</span><h2>Detalhes da conta</h2></div>
                  </div>
                  <div className="perfil-detalhes-grid">
                    <div><span>Nome de exibição</span><strong>{privNome === 'privado' ? 'Privado' : (usuario.nome || 'Não informado')}</strong></div>
                    <div><span>Username</span><strong>{usuario.nome_usuario ? `@${usuario.nome_usuario}` : 'Não informado'}</strong></div>
                  </div>
                  
                  <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', margin: '40px 0 16px' }}>Conexões Vinculadas</h3>
                  <div className="perfil-contas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone perfil-conta-discord" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/discord.svg" alt="Discord" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Discord</strong><span>{discord || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone perfil-conta-steam" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/steam.svg" alt="Steam" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Steam</strong><span>{steam || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#1DA1F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/twitter.svg" alt="Twitter" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Twitter / X</strong><span>{twitter || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#FF0000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/youtube.svg" alt="YouTube" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>YouTube</strong><span>{youtube || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#9146FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/twitch.svg" alt="Twitch" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Twitch</strong><span>{twitch || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#0085FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/bluesky.svg" alt="Bluesky" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Bluesky</strong><span>{bluesky || 'Não conectado'}</span></div>
                    </div>
                  </div>
                </section>
                
                {/* SOBRE / BIOGRAFIA */}
                <section className="perfil-secao" style={{ marginTop: '24px' }}>
                  <div className="perfil-secao-titulo">
                    <div><span className="perfil-kicker">Sobre</span><h2>Biografia</h2></div>
                  </div>
                  <div>
                    <p style={{ color: 'var(--texto-secundario)', lineHeight: '1.6' }}>
                      {usuario.bio || 'Este jogador ainda não escreveu nenhuma biografia.'}
                    </p>
                  </div>
                </section>

                {/* HISTÓRICO & ESTATÍSTICAS */}
                <section className="perfil-secao" style={{ marginTop: '24px' }}>
                  <div className="perfil-secao-titulo">
                    <div><span className="perfil-kicker">Desempenho</span><h2>Estatísticas e Histórico</h2></div>
                  </div>
                  <div className="perfil-detalhes-grid">
                    <div><span>Partidas Jogadas</span><strong style={{ fontSize: '20px' }}>{statsPartidas}</strong></div>
                    <div><span>Torneios Participados</span><strong style={{ fontSize: '20px' }}>{statsTorneios}</strong></div>
                    <div><span>Torneios Vencidos</span><strong style={{ fontSize: '20px' }}>{statsTitulos}</strong></div>
                    <div>
                      <span>Ganhos Totais</span>
                      <strong style={{ fontSize: '20px', color: privGanhos === 'privado' ? 'var(--texto-terciario)' : '#5ce390' }}>
                        {statsGanhos}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* LISTA DE AMIGOS */}
                <section className="perfil-secao perfil-secao-amigos" style={{ marginTop: '24px' }}>
                  <div className="perfil-secao-titulo perfil-amigos-header">
                    <div>
                      <span className="perfil-kicker">Comunidade</span>
                      <h2>Lista de Amigos <small>({listaAmigos.length})</small></h2>
                    </div>

                    {!isPublico && (
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
                            onKeyDown={handleKeyDownBusca}
                            onFocus={() => buscaAmigo.trim() && setDropdownAmigoAberto(true)}
                            placeholder="Buscar jogadores para adicionar..."
                          />
                          {buscaAmigo && (
                            <button
                              type="button"
                              className="perfil-buscar-limpar"
                              onClick={() => {
                                setBuscaAmigo('');
                                setResultadosBusca([]);
                                setDropdownAmigoAberto(false);
                              }}
                              aria-label="Limpar busca"
                            >
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
                                      src={
                                        j.imagem ||
                                        `https://placehold.co/96x96/35176b/ffffff?text=${encodeURIComponent(
                                          (j.nome_usuario || j.nome || 'J').substring(0, 2).toUpperCase()
                                        )}`
                                      }
                                      alt={j.nome || j.nome_usuario}
                                      className="perfil-autocomplete-avatar"
                                    />
                                    <div className="perfil-autocomplete-info">
                                      <strong>{j.nome || j.nome_usuario}</strong>
                                      <span>
                                        {j.nome_usuario ? `@${j.nome_usuario}` : ''}
                                        {j.time_usuario ? ` • ${j.time_usuario}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="perfil-autocomplete-add-btn"
                                    onClick={() => handleAdicionarAmigo(j)}
                                    title="Adicionar amigo"
                                  >
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
                    )}
                  </div>

                  {privAmigos === 'privado' ? (
                    <p className="perfil-vazio">Sua lista de amigos está definida como privada nas configurações.</p>
                  ) : (
                    <div className="perfil-amigos">
                      {listaAmigos.map((amigo) => (
                        <article className="perfil-amigo" key={amigo.id}>
                          <img
                            src={
                              amigo.imagem ||
                              `https://placehold.co/96x96/291547/ffffff?text=${encodeURIComponent(
                                (amigo.nome || amigo.name || 'J').substring(0, 2).toUpperCase()
                              )}`
                            }
                            alt={amigo.nome || amigo.name}
                          />
                          <div className="perfil-amigo-info">
                            <strong>{amigo.nome || amigo.name}</strong>
                            <span>{amigo.equipe || amigo.time_usuario || 'Sem equipe'}</span>
                            <em
                              className={amigo.status === 'online' ? 'online' : ''}
                              style={amigo.status === 'online' ? { color: '#5ce390' } : { color: 'var(--texto-terciario)' }}
                            >
                              {amigo.status === 'online' ? 'Online' : 'Offline'}
                            </em>
                          </div>
                          {!isPublico && (
                            <div className="perfil-amigo-acoes">
                              <button
                                type="button"
                                onClick={() => handleRemoverAmigo(amigo)}
                                title="Remover amigo"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
                      {listaAmigos.length === 0 && (
                        <p className="perfil-vazio">Nenhum amigo na sua lista no momento. Use o campo de busca acima para encontrar e adicionar jogadores!</p>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}