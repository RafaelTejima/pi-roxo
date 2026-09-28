import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import '../css/equipes.css';
import evaPersonagemImg from '../../imagens/eva-06-1.png';

export default function Equipes() {
  const [equipes, setEquipes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarEquipes() {
      setCarregando(true);
      const { data: times, error } = await supabase
        .from('times')
        .select('*')
        .order('registro', { ascending: false });

      if (error) {
        console.error(error);
        setErro('Não foi possível carregar as equipes.');
        setCarregando(false);
        return;
      }

      const idsCapitaes = [...new Set((times || []).map((t) => t.id_capitao))];
      const idsTimes = (times || []).map((t) => t.id);

      const [{ data: capitaes }, { data: integrantes }] = await Promise.all([
        idsCapitaes.length
          ? supabase.from('usuarios').select('id, nome, nome_usuario').in('id', idsCapitaes)
          : Promise.resolve({ data: [] }),
        idsTimes.length
          ? supabase.from('times_integrantes').select('id_time').in('id_time', idsTimes)
          : Promise.resolve({ data: [] })
      ]);

      const equipesCompletas = (times || []).map((time) => {
        const capitao = capitaes?.find((c) => c.id === time.id_capitao);
        const totalIntegrantes = integrantes?.filter((i) => i.id_time === time.id).length || 0;
        return {
          ...time,
          capitaoNome: capitao?.nome_usuario || capitao?.nome || 'Não informado',
          totalIntegrantes
        };
      });

      setEquipes(equipesCompletas);
      setCarregando(false);
    }

    carregarEquipes();
  }, []);

  return (
    <main id="pagina-equipes">
      <section className="equipes-heading">
        <h1>Equipes &amp; <span>Times.</span></h1>
        <p>Encontre line-ups, acompanhe organizações e desafie outros times no cenário competitivo.</p>
        <Link to="/equipes/criar" className="equipes-criar-btn">
          Criar Equipe
        </Link>
      </section>

      <section className="equipes-container">
        {carregando ? (
          <div className="equipes-vazio">
            <p>Carregando equipes...</p>
          </div>
        ) : erro ? (
          <div className="equipes-vazio">
            <p>{erro}</p>
          </div>
        ) : equipes.length > 0 ? (
          <div className="equipes-grid">
            {equipes.map((equipe) => (
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
            <p>Nenhuma equipe cadastrada no momento</p>
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
