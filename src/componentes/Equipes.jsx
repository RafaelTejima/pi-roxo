import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/equipes.css';
import evaPersonagemImg from '../../imagens/eva-06-1.png';

export default function Equipes() {
  const [equipes, setEquipes] = useState([]);

  useEffect(() => {
    try {
      const salvas = localStorage.getItem('equipesCadastradas');
      if (salvas) {
        setEquipes(JSON.parse(salvas));
      }
    } catch (err) {
      console.error(err);
    }
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
        {equipes.length > 0 ? (
          <div className="equipes-grid">
            {equipes.map((equipe, idx) => (
              <div key={equipe.id || idx} className="equipe-card">
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
                    <strong>{equipe.jogadoresCount || '5/5'}</strong>
                  </div>
                  <div className="equipe-meta-item">
                    <small>CAPITÃO</small>
                    <strong>{equipe.capitao || 'Não informado'}</strong>
                  </div>
                </div>
              </div>
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
