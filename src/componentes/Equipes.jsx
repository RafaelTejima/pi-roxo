import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import '../css/equipes.css';
import evaPersonagemImg from '../../imagens/eva-06-1.png';
import AuroraBackground from './AuroraBackground';

export const TIMES_PADRAO = [
  {
    id: 'furia',
    nome: 'FURIA Esports',
    tag: 'FUR',
    descricao: 'Organização líder do cenário brasileiro de Counter-Strike e esportes eletrônicos.',
    logo: 'https://placehold.co/120x120/120d20/FFFFFF?text=FURIA',
    capitao: 'FalleN',
    id_capitao: 'usr-fallen',
    capitaoNome: 'FalleN',
    totalIntegrantes: 5,
    registro: '2024-01-15T12:00:00Z',
    jogadores: [
      { id: 'usr-fallen', nome: 'FalleN', funcao: 'capitao' },
      { id: 'usr-kscerato', nome: 'KSCERATO', funcao: 'jogador' },
      { id: 'usr-yuurih', nome: 'yuurih', funcao: 'jogador' },
      { id: 'usr-chelo', nome: 'chelo', funcao: 'jogador' },
      { id: 'usr-skullz', nome: 'skullz', funcao: 'jogador' }
    ]
  },
  {
    id: 'mibr',
    nome: 'Made in Brazil',
    tag: 'MIBR',
    descricao: 'Uma das marcas mais históricas e lendárias dos e-sports brasileiros e mundiais.',
    logo: 'https://placehold.co/120x120/120d20/FFFFFF?text=MIBR',
    capitao: 'exit',
    id_capitao: 'usr-exit',
    capitaoNome: 'exit',
    totalIntegrantes: 5,
    registro: '2024-02-10T14:30:00Z',
    jogadores: [
      { id: 'usr-exit', nome: 'exit', funcao: 'capitao' },
      { id: 'usr-insani', nome: 'insani', funcao: 'jogador' },
      { id: 'usr-saffee', nome: 'saffee', funcao: 'jogador' },
      { id: 'usr-drop', nome: 'drop', funcao: 'jogador' },
      { id: 'usr-brnz4n', nome: 'brnz4n', funcao: 'jogador' }
    ]
  },
  {
    id: 'imperial',
    nome: 'Imperial Esports',
    tag: 'IMP',
    descricao: 'Equipe verde e amarela com trajetória memorável em Majors de CS.',
    logo: 'https://placehold.co/120x120/120d20/FFFFFF?text=IMP',
    capitao: 'VINI',
    id_capitao: 'usr-vini',
    capitaoNome: 'VINI',
    totalIntegrantes: 5,
    registro: '2024-03-01T10:15:00Z',
    jogadores: [
      { id: 'usr-vini', nome: 'VINI', funcao: 'capitao' },
      { id: 'usr-felps', nome: 'felps', funcao: 'jogador' },
      { id: 'usr-decenty', nome: 'decenty', funcao: 'jogador' },
      { id: 'usr-noway', nome: 'noway', funcao: 'jogador' },
      { id: 'usr-try', nome: 'try', funcao: 'jogador' }
    ]
  },
  {
    id: 'pain',
    nome: 'paIN Gaming',
    tag: 'PAIN',
    descricao: 'Tradição e garra representando o Brasil nas principais ligas internacionais.',
    logo: 'https://placehold.co/120x120/120d20/FFFFFF?text=PAIN',
    capitao: 'biguzera',
    id_capitao: 'usr-biguzera',
    capitaoNome: 'biguzera',
    totalIntegrantes: 5,
    registro: '2024-03-12T16:45:00Z',
    jogadores: [
      { id: 'usr-biguzera', nome: 'biguzera', funcao: 'capitao' },
      { id: 'usr-lux', nome: 'lux', funcao: 'jogador' },
      { id: 'usr-kauez', nome: 'kauez', funcao: 'jogador' },
      { id: 'usr-nqz', nome: 'nqz', funcao: 'jogador' },
      { id: 'usr-snow', nome: 'snow', funcao: 'jogador' }
    ]
  }
];

export default function Equipes() {
  const [equipes, setEquipes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function carregarEquipes() {
      setCarregando(true);
      setErro('');

      // 1. Carregar equipes criadas no localStorage
      let equipesLocais = [];
      try {
        const salvas = localStorage.getItem('equipesCadastradas');
        if (salvas) {
          equipesLocais = JSON.parse(salvas);
        }
      } catch (err) {
        console.warn('Erro ao ler equipes do localStorage:', err);
      }

      // 2. Carregar equipes do Supabase (se disponível)
      let equipesSupabase = [];
      try {
        if (supabase) {
          const { data: times, error } = await supabase
            .from('times')
            .select('*')
            .order('registro', { ascending: false });

          if (!error && times && times.length > 0) {
            const idsCapitaes = [...new Set(times.map((t) => t.id_capitao).filter(Boolean))];
            const idsTimes = times.map((t) => t.id);

            const [{ data: capitaes }, { data: integrantes }] = await Promise.all([
              idsCapitaes.length
                ? supabase.from('usuarios').select('id, nome, nome_usuario').in('id', idsCapitaes)
                : Promise.resolve({ data: [] }),
              idsTimes.length
                ? supabase.from('times_integrantes').select('id_time').in('id_time', idsTimes)
                : Promise.resolve({ data: [] })
            ]);

            equipesSupabase = times.map((time) => {
              const capitao = capitaes?.find((c) => c.id === time.id_capitao);
              const totalIntegrantes = integrantes?.filter((i) => i.id_time === time.id).length || 0;
              return {
                ...time,
                capitaoNome: capitao?.nome_usuario || capitao?.nome || 'Não informado',
                totalIntegrantes
              };
            });
          }
        }
      } catch (err) {
        console.warn('Falha na consulta Supabase, utilizando dados locais:', err);
      }

      // 3. Consolidar lista unificada: LocalStorage + Supabase + Times Padrão
      const todas = [];
      const idsVistos = new Set();

      // Equipes criadas pelo usuário
      equipesLocais.forEach((eq) => {
        if (eq && eq.id && !idsVistos.has(String(eq.id))) {
          idsVistos.add(String(eq.id));
          todas.push({
            ...eq,
            capitaoNome: eq.capitao || eq.capitaoNome || 'Não informado',
            totalIntegrantes: eq.jogadores?.length || 1
          });
        }
      });

      // Equipes do Supabase
      equipesSupabase.forEach((eq) => {
        if (eq && eq.id && !idsVistos.has(String(eq.id))) {
          idsVistos.add(String(eq.id));
          todas.push(eq);
        }
      });

      // Times Padrão
      TIMES_PADRAO.forEach((eq) => {
        if (eq && eq.id && !idsVistos.has(String(eq.id))) {
          idsVistos.add(String(eq.id));
          todas.push(eq);
        }
      });

      setEquipes(todas);
      setCarregando(false);
    }

    carregarEquipes();
  }, []);

  const termoBusca = busca.trim().toLowerCase();
  const equipesFiltradas = termoBusca
    ? equipes.filter((equipe) =>
        [equipe.nome, equipe.tag, equipe.capitaoNome, equipe.capitao]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termoBusca))
      )
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
            placeholder="Pesquisar por nome, tag ou capitão..."
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
                  <div className="equipe-avatar">
                    {equipe.tag ? equipe.tag.substring(0, 3) : 'TEAM'}
                  </div>
                  <div className="equipe-info-top">
                    <h3>{equipe.nome}</h3>
                    <span className="equipe-tag">[{equipe.tag || 'ROX'}]</span>
                  </div>
                </div>
                <div className="equipe-card-body">
                  <div className="equipe-meta-item">
                    <small>JOGADORES</small>
                    <strong>{equipe.totalIntegrantes}/5</strong>
                  </div>
                  <div className="equipe-meta-item">
                    <small>CAPITÃO</small>
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
          className="equipes-personagem-img" 
        />
      </div>
    </main>
  );
}
