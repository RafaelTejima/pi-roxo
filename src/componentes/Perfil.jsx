import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../css/perfil.css';

export default function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      const salvo = localStorage.getItem('usuarioLogado');
      if (!salvo) {
        navigate('/login');
        return;
      }
      
      const userLocal = JSON.parse(salvo);
      if (!userLocal.id) {
        navigate('/login');
        return;
      }

      // Busca dados atualizados do banco (omite email, senha, etc)
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome, nome_usuario, time_usuario, bio, imagem, registro')
        .eq('id', userLocal.id)
        .single();

      if (data) {
        setUsuario(data);
      }
      setLoading(false);
    }
    carregarPerfil();
  }, [navigate]);

  function sair() {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      localStorage.removeItem('usuarioLogado');
      navigate('/');
      // Dispara um evento para atualizar o Menu
      window.dispatchEvent(new Event('storage'));
    }
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

  return (
    <main id="perfil-page" className="perfil-page">
      <div className="perfil-container">
        <div className="perfil-cabecalho">
          <div>
            <span className="perfil-kicker">Conta de jogador</span>
            <h1>Meu perfil</h1>
            <p>Visualize suas informações públicas e sua equipe.</p>
          </div>
          <Link to="/torneios" className="perfil-link-voltar">Ver torneios</Link>
        </div>

        <section className="perfil-grid">
          <aside className="perfil-resumo">
            <div className="perfil-avatar-wrap">
              <img src={avatarUrl} alt={`Avatar de ${usuario.nome || usuario.nome_usuario}`} />
              <span className="perfil-status-dot" aria-label="Online"></span>
            </div>
            <h2>{usuario.nome || usuario.nome_usuario || 'Jogador'}</h2>
            <p className="perfil-cargo">{usuario.nome_usuario ? `@${usuario.nome_usuario}` : 'Sem usuário'}</p>
            <div className="perfil-dados">
              <div><span>Time afiliado</span><strong>{usuario.time_usuario || 'Nenhum'}</strong></div>
              <div><span>Status</span><strong className="perfil-online">Online agora</strong></div>
              <div><span>Membro desde</span><strong style={{textTransform: 'capitalize'}}>{dataRegistro}</strong></div>
            </div>
            <button className="perfil-botao perfil-botao-perigo" type="button" onClick={sair}>Sair da conta</button>
          </aside>

          <div className="perfil-conteudo">
            <section className="perfil-secao" id="detalhes-conta">
              <div className="perfil-secao-titulo">
                <div><span className="perfil-kicker">Informações Públicas</span><h2>Detalhes da conta</h2></div>
              </div>
              <div className="perfil-detalhes-grid">
                <div><span>Nome de exibição</span><strong>{usuario.nome || 'Não informado'}</strong></div>
                <div><span>Username</span><strong>{usuario.nome_usuario ? `@${usuario.nome_usuario}` : 'Não informado'}</strong></div>
              </div>
            </section>
            
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
          </div>
        </section>
      </div>
    </main>
  );
}