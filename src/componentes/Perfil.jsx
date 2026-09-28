import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../css/perfil.css';
import { useAlerta } from './AlertaModal';

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
  
  // Estados para edição
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

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
      
      const userLocal = JSON.parse(salvo);
      if (!userLocal.id) {
        navigate('/login');
        return;
      }

      // Busca dados atualizados do banco
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, nome_usuario, time_usuario, bio, imagem, registro')
        .eq('id', userLocal.id)
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
      // Simulando campos que ainda não existem no DB
      discord: localStorage.getItem(`discord_${usuario.id}`) || '',
      steam: localStorage.getItem(`steam_${usuario.id}`) || '',
      twitter: localStorage.getItem(`twitter_${usuario.id}`) || '',
      youtube: localStorage.getItem(`youtube_${usuario.id}`) || '',
      twitch: localStorage.getItem(`twitch_${usuario.id}`) || '',
      bluesky: localStorage.getItem(`bluesky_${usuario.id}`) || '',
      fundo: localStorage.getItem(`fundo_${usuario.id}`) || 'https://placehold.co/1920x1080/1a1a2e/ffffff?text=Fundo+1',
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
      bio: form.bio
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

    // Salva configs extras locais (pendente update no schema)
    localStorage.setItem(`discord_${usuario.id}`, form.discord);
    localStorage.setItem(`steam_${usuario.id}`, form.steam);
    localStorage.setItem(`twitter_${usuario.id}`, form.twitter);
    localStorage.setItem(`youtube_${usuario.id}`, form.youtube);
    localStorage.setItem(`twitch_${usuario.id}`, form.twitch);
    localStorage.setItem(`bluesky_${usuario.id}`, form.bluesky);
    localStorage.setItem(`fundo_${usuario.id}`, form.fundo);
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

  // Extraimos as configs locais apenas para exibição no perfil
  const discord = localStorage.getItem(`discord_${usuario.id}`);
  const steam = localStorage.getItem(`steam_${usuario.id}`);
  const twitter = localStorage.getItem(`twitter_${usuario.id}`);
  const privNome = localStorage.getItem(`priv_nome_${usuario.id}`) || 'publico';
  const privGanhos = localStorage.getItem(`priv_ganhos_${usuario.id}`) || 'publico';
  const privAmigos = localStorage.getItem(`priv_amigos_${usuario.id}`) || 'publico';

  return (
    <main id="perfil-page" className="perfil-page" style={{
      background: `radial-gradient(circle at 80% 0%, rgba(114, 62, 195, 0.22), transparent 34%), linear-gradient(135deg, rgba(8, 4, 18, 0.8), rgba(3, 1, 8, 0.9)), url(${fundo}) center/cover no-repeat`
    }}>
      <div className="perfil-container">
        <div className="perfil-cabecalho">
          <div>
            <span className="perfil-kicker">{isPublico ? 'Perfil de jogador' : 'Conta de jogador'}</span>
            <h1>{isPublico ? (usuario.nome || usuario.nome_usuario || 'Perfil') : 'Meu perfil'}</h1>
            <p>{isPublico ? 'Visualizando perfil público do jogador.' : 'Gerencie suas informações, conexões e privacidade.'}</p>
          </div>
          <Link to="/torneios" className="perfil-link-voltar">Ver torneios</Link>
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

            {/* Regra de privacidade do Nome */}
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              {privNome === 'privado' ? 'Nome Privado' : (usuario.nome || usuario.nome_usuario || 'Jogador')}
              {usuario.admin && <span style={{ fontSize: '10px', background: '#8c52ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>ADM</span>}
            </h2>

            <p className="perfil-cargo">{usuario.nome_usuario ? `@${usuario.nome_usuario}` : 'Sem usuário'}</p>
            <div className="perfil-dados">
              <div><span>Time atual</span><strong>{usuario.time_usuario || 'Nenhum'}</strong></div>
              <div><span>Status</span><strong className="perfil-online">Online agora</strong></div>
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

                  {/* REDES SOCIAIS */}
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Conexões (Redes)</h3>
                    <div className="perfil-detalhes-grid">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Discord</label>
                        <input type="text" value={form.discord} onChange={e => setForm({ ...form, discord: e.target.value })} placeholder="@Usuário" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Steam URL</label>
                        <input type="text" value={form.steam} onChange={e => setForm({ ...form, steam: e.target.value })} placeholder="https://steamcommunity.com/id/..." style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Twitter</label>
                        <input type="text" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="@seu_twitter" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%', borderRadius: '8px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>YouTube</label>
                        <input type="text" value={form.youtube} onChange={e => setForm({ ...form, youtube: e.target.value })} placeholder="https://youtube.com/..." style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%', borderRadius: '8px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Twitch</label>
                        <input type="text" value={form.twitch} onChange={e => setForm({ ...form, twitch: e.target.value })} placeholder="https://twitch.tv/..." style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%', borderRadius: '8px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Bluesky</label>
                        <input type="text" value={form.bluesky} onChange={e => setForm({ ...form, bluesky: e.target.value })} placeholder="@usuario.bsky.social" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%', borderRadius: '8px' }} />
                      </div>
                    </div>
                  </div>


                  {/* PRIVACIDADE */}
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Privacidade</h3>
                    <div className="perfil-detalhes-grid">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Nome de Perfil</label>
                        <select value={form.privacidade_nome} onChange={e => setForm({ ...form, privacidade_nome: e.target.value })} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                          <option value="publico">Público</option>
                          <option value="amigos">Apenas Amigos</option>
                          <option value="privado">Privado</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Lista de Amigos</label>
                        <select value={form.privacidade_amigos} onChange={e => setForm({ ...form, privacidade_amigos: e.target.value })} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                          <option value="publico">Mostrar</option>
                          <option value="privado">Privar</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Meus Ganhos</label>
                        <select value={form.privacidade_ganhos} onChange={e => setForm({ ...form, privacidade_ganhos: e.target.value })} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                          <option value="publico">Mostrar</option>
                          <option value="privado">Privar</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PERSONALIZAÇÃO */}
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Personalização</h3>

                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '8px' }}>Fundo do Perfil</label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4, 5].map(num => {
                          const url = `https://placehold.co/1920x1080/1a1a2e/ffffff?text=Fundo+${num}`;
                          return (
                            <label key={num} style={{ cursor: 'pointer', border: form.fundo === url ? '2px solid var(--roxo-claro)' : '2px solid transparent', borderRadius: '8px', overflow: 'hidden' }}>
                              <input type="radio" name="fundo" value={url} checked={form.fundo === url} onChange={e => setForm({ ...form, fundo: e.target.value })} style={{ display: 'none' }} />
                              <img src={`https://placehold.co/100x60/1a1a2e/ffffff?text=Fundo+${num}`} alt={`Fundo ${num}`} style={{ display: 'block' }} />
                            </label>
                          );
                        })}
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
                    <div><span className="perfil-kicker">Informações</span><h2>Biografia</h2></div>
                  </div>
                  <div>
                    <p style={{ color: 'var(--texto-secundario)', lineHeight: '1.6' }}>
                      {usuario.bio || 'Este jogador ainda não escreveu nenhuma biografia.'}
                    </p>
                  </div>
                  <div><span className="perfil-kicker">Desempenho</span><h2>Estatísticas e Histórico</h2></div>
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

                  <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', margin: '32px 0 16px' }}>Conexões Vinculadas</h3>
                  <div className="perfil-contas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone perfil-conta-discord" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/discord.svg" alt="Discord" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Discord</strong><span>{discord || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone perfil-conta-steam" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/steam.svg" alt="Steam" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Steam</strong><span>{steam || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#1DA1F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/twitter.svg" alt="Twitter" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Twitter</strong><span>{twitter || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#FF0000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/youtube.svg" alt="YouTube" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>YouTube</strong><span>{youtube || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#9146FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/twitch.svg" alt="Twitch" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Twitch</strong><span>{twitch || 'Não conectado'}</span></div>
                    </div>
                    <div className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)' }}>
                      <span className="perfil-conta-icone" style={{ background: '#0085ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/svg/bluesky.svg" alt="Bluesky" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <div><strong>Bluesky</strong><span>{bluesky || 'Não conectado'}</span></div>
                    </div>
                  </div>
                </section>

                {/* LISTA DE AMIGOS (MOCK) */}
                <section className="perfil-secao" style={{ marginTop: '24px' }}>
                  <div className="perfil-secao-titulo">
                    <div><span className="perfil-kicker">Comunidade</span><h2>Lista de Amigos</h2></div>
                  </div>
                  {privAmigos === 'privado' ? (
                    <p className="perfil-vazio">Sua lista de amigos está definida como privada nas configurações.</p>
                  ) : (
                    <div className="perfil-amigos">
                      <article className="perfil-amigo">
                        <img src="https://placehold.co/96x96/291547/ffffff?text=LS" alt="Lucas Silva" />
                        <div className="perfil-amigo-info"><strong>Lucas Silva</strong><span>Vortex Gaming</span><em className="online" style={{ color: '#5ce390' }}>Online</em></div>
                      </article>
                      <article className="perfil-amigo">
                        <img src="https://placehold.co/96x96/42206b/ffffff?text=AC" alt="Ana Costa" />
                        <div className="perfil-amigo-info"><strong>Ana Costa</strong><span>Nexus Five</span><em style={{ color: 'var(--texto-terciario)' }}>Offline</em></div>
                      </article>
                      <article className="perfil-amigo">
                        <img src="https://placehold.co/96x96/17121f/ffffff?text=RL" alt="Rafael Lima" />
                        <div className="perfil-amigo-info"><strong>Rafael Lima</strong><span>Sem equipe</span><em style={{ color: 'var(--texto-terciario)' }}>Offline</em></div>
                      </article>
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