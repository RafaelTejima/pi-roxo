import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import '../css/equipes.css';
import evaPersonagemImg from '../../imagens/eva-06-1.png';
import AuroraBackground from './AuroraBackground';

function resolverLogo(logo) {
  const caminho = typeof logo === 'string' ? logo.trim() : '';
  if (!caminho) return '';
  if (/^(https?:\/\/|data:|blob:|\/\/)/i.test(caminho)) return caminho;
  return `/${caminho.replace(/^(\.\/)+/, '').replace(/^\/+/, '')}`;
}

const CACHE_KEY_EQUIPES = 'cache_equipes_v1';

export default function Equipes() {
  const [equipes, setEquipes] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_KEY_EQUIPES);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });
  const [carregando, setCarregando] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_KEY_EQUIPES);
      return !salvo || JSON.parse(salvo).length === 0;
    } catch {
      return true;
    }
  });
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const montadoRef = useRef(true);

  const carregarEquipes = useCallback(async () => {
    // Apenas marca carregando se não tiver nada em cache
    setCarregando((atual) => (equipes.length === 0 ? true : atual));
    setErro('');

    let equipesSupabase = [];
    let carregouDoBanco = false;
    let falhaConsulta = false;

    // 1. Sempre buscar a lista mais atualizada diretamente do Supabase via JOIN com times_integrantes (busca cirúrgica sem overfetching)
    try {
      if (supabase) {
        let timesData = null;
        let buscaJoinSucesso = false;

        try {
          const { data: timesComJoin, error: erroJoin } = await supabase
            .from('times')
            .select('id, nome, tag, logo, descricao, id_capitao, registro, times_integrantes(id, id_usuario, funcao, usuarios(id, nome, nome_usuario))')
            .order('registro', { ascending: false })
            .limit(60);

          if (erroJoin) {
            console.error('ERRO SUPABASE [Times - Join]:', erroJoin.message, erroJoin.details, erroJoin.hint, erroJoin.code);
          } else if (Array.isArray(timesComJoin)) {
            timesData = timesComJoin;
            buscaJoinSucesso = true;
          }
        } catch (errJoin) {
          console.warn('Tentativa com join em times_integrantes falhou, tentando fallback relacional:', errJoin);
        }

        if (buscaJoinSucesso && timesData) {
          carregouDoBanco = true;
          equipesSupabase = timesData.map((time) => {
            const integrantesArray = Array.isArray(time.times_integrantes) ? time.times_integrantes : [];
            const capitaoObj = integrantesArray.find((ti) => ti.funcao === 'capitao');
            const capUser = Array.isArray(capitaoObj?.usuarios) ? capitaoObj.usuarios[0] : capitaoObj?.usuarios;
            const capPorId = !capUser && time.id_capitao ? integrantesArray.find((ti) => String(ti.id_usuario) === String(time.id_capitao)) : null;
            const capPorIdUser = Array.isArray(capPorId?.usuarios) ? capPorId.usuarios[0] : capPorId?.usuarios;
            const capitaoNome = capUser?.nome_usuario || capUser?.nome || capPorIdUser?.nome_usuario || capPorIdUser?.nome || 'Não informado';

            return {
              ...time,
              capitaoNome,
              totalIntegrantes: integrantesArray.length || 1,
              jogadores: integrantesArray.map((ti) => {
                const u = Array.isArray(ti.usuarios) ? ti.usuarios[0] : ti.usuarios;
                return {
                  id: ti.id_usuario,
                  nome: u?.nome_usuario || u?.nome || 'Jogador',
                  funcao: ti.funcao
                };
              })
            };
          });
        } else {
          // Fallback estruturado com times_integrantes e limite cirúrgico
          const { data: times, error } = await supabase
            .from('times')
            .select('id, nome, tag, logo, descricao, id_capitao, registro')
            .order('registro', { ascending: false })
            .limit(60);

          if (error) {
            console.error('ERRO SUPABASE [Times - Fallback]:', error.message, error.details, error.hint, error.code);
          } else if (Array.isArray(times)) {
            carregouDoBanco = true;
            if (times.length > 0) {
              const idsTimes = times.map((t) => t.id).filter(Boolean);

              const { data: integrantes, error: erroIntegrantes } = await supabase
                .from('times_integrantes')
                .select(`
                  id,
                  id_time,
                  id_usuario,
                  funcao,
                  usuarios ( id, nome, nome_usuario )
                `)
                .in('id_time', idsTimes);

              if (erroIntegrantes) {
                console.warn('ERRO SUPABASE [Times - Integrantes Fallback]:', erroIntegrantes.message, erroIntegrantes.details, erroIntegrantes.hint);
              }

              const listaIntegrantes = Array.isArray(integrantes) ? integrantes : [];

              equipesSupabase = times.map((time) => {
                const membrosDesteTime = listaIntegrantes.filter(
                  (i) => String(i.id_time) === String(time.id)
                );
                const cap = membrosDesteTime.find((m) => m.funcao === 'capitao');
                const u = Array.isArray(cap?.usuarios) ? cap.usuarios[0] : cap?.usuarios;
                const capPorId = !u && time.id_capitao ? membrosDesteTime.find((m) => String(m.id_usuario) === String(time.id_capitao)) : null;
                const uPorId = Array.isArray(capPorId?.usuarios) ? capPorId.usuarios[0] : capPorId?.usuarios;
                const capitaoNome = u?.nome_usuario || u?.nome || uPorId?.nome_usuario || uPorId?.nome || 'Não informado';

                return {
                  ...time,
                  capitaoNome,
                  totalIntegrantes: membrosDesteTime.length || 1,
                  jogadores: membrosDesteTime.map((ti) => {
                    const usr = Array.isArray(ti.usuarios) ? ti.usuarios[0] : ti.usuarios;
                    return {
                      id: ti.id_usuario,
                      nome: usr?.nome_usuario || usr?.nome || 'Jogador',
                      funcao: ti.funcao
                    };
                  })
                };
              });
            } else {
              equipesSupabase = [];
            }
          }
        }
      }
    } catch (err) {
      console.error('ERRO SUPABASE [Times - Excecao]:', err.message || err);
      falhaConsulta = true;
      if (equipes.length === 0) {
        setErro('Não foi possível carregar as equipes. Tente novamente mais tarde.');
      }
    }

    if (!montadoRef.current) return;

    if (equipesSupabase.length > 0) {
      setEquipes(equipesSupabase);
      try {
        localStorage.setItem(CACHE_KEY_EQUIPES, JSON.stringify(equipesSupabase));
      } catch (e) {
        console.warn('Falha ao gravar cache de equipes:', e);
      }
      setErro('');
    } else if (carregouDoBanco && equipesSupabase.length === 0) {
      setEquipes([]);
      try {
        localStorage.setItem(CACHE_KEY_EQUIPES, JSON.stringify([]));
      } catch {}
      setErro('');
    } else if (!carregouDoBanco && !falhaConsulta && equipes.length === 0) {
      setErro('Não foi possível carregar as equipes. Tente novamente mais tarde.');
    }

    setCarregando(false);
  }, [equipes.length]);

  useEffect(() => {
    montadoRef.current = true;
    carregarEquipes();

    const onUpdate = () => {
      if (montadoRef.current) {
        carregarEquipes();
      }
    };

    const onFocus = () => {
      if (montadoRef.current) {
        carregarEquipes();
      }
    };

    window.addEventListener('storage', onUpdate);
    window.addEventListener('equipesAtualizadas', onUpdate);
    window.addEventListener('focus', onFocus);

    return () => {
      montadoRef.current = false;
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('equipesAtualizadas', onUpdate);
      window.removeEventListener('focus', onFocus);
    };
  }, [carregarEquipes]);

  const termoBusca = busca.trim().toLowerCase();
  const equipesFiltradas = termoBusca
    ? equipes.filter((equipe) => {
        const matchTime = [equipe.nome, equipe.tag, equipe.capitaoNome, equipe.capitao]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termoBusca));
        const matchJogadores = Array.isArray(equipe.jogadores) && equipe.jogadores.some((j) =>
          String(j.nome || '').toLowerCase().includes(termoBusca)
        );
        return matchTime || matchJogadores;
      })
    : equipes;

  return (
    <main id="pagina-equipes" className="fundo-aurora-motion">
      <AuroraBackground />
      <section className="equipes-heading">
        <h1>Equipes &amp; <span>Times.</span></h1>
        <p>Encontre line-ups, acompanhe organizações e desafie outros times no cenário competitivo.</p>
        <Link to="/equipes/criar" className="equipes-criar-btn">
          Criar Equipe
        </Link>
      </section>

      <section className="equipes-container">
        <div className="equipes-busca-wrap">
          <input
            type="text"
            className="equipes-busca-input"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar por nome, tag, capitão ou jogador..."
          />
        </div>

        {carregando ? (
          <div className="equipes-vazio">
            <p>Carregando equipes...</p>
          </div>
        ) : erro ? (
          <div className="equipes-vazio">
            <p>{erro}</p>
          </div>
        ) : equipesFiltradas.length > 0 ? (
          <div className="equipes-grid">
            {equipesFiltradas.map((equipe) => (
              <Link to={`/equipes/${equipe.id}`} key={equipe.id} className="equipe-card">
                <div className="equipe-card-header">
                  <div className="equipe-avatar" style={{ position: 'relative', overflow: 'hidden' }}>
                    <span className="equipe-avatar-texto">
                      {equipe.tag ? equipe.tag.substring(0, 3).toUpperCase() : 'TEAM'}
                    </span>
                    {equipe.logo && equipe.logo.trim() !== '' && (
                      <img
                        src={resolverLogo(equipe.logo)}
                        alt={`Logo da equipe ${equipe.nome}`}
                        loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="equipe-info-top">
                    <h3>{equipe.nome}</h3>
                    <span className="equipe-tag">[{equipe.tag || 'Sem tag'}]</span>
                  </div>
                </div>
                <div className="equipe-card-body">
                  <div className="equipe-meta-item">
                    <div className="equipe-meta-label">
                      <svg className="equipe-meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <small>JOGADORES</small>
                    </div>
                    <strong>{equipe.totalIntegrantes}/5</strong>
                  </div>
                  <div className="equipe-meta-item">
                    <div className="equipe-meta-label">
                      <svg className="equipe-meta-icon equipe-meta-icon--capitao" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
                      </svg>
                      <small>CAPITÃO</small>
                    </div>
                    <strong>{equipe.capitaoNome}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="equipes-vazio">
            <p>{termoBusca ? 'Nenhuma equipe encontrada para essa pesquisa.' : 'Nenhuma equipe cadastrada no momento'}</p>
          </div>
        )}
      </section>

      <div className="equipes-personagem-wrap" aria-hidden="true">
        <img 
          src={evaPersonagemImg} 
          alt="Agente EVA" 
          loading="lazy"
          className="equipes-personagem-img" 
        />
      </div>
    </main>
  );
}
