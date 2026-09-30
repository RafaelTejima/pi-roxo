import { useEffect, useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/torneios.css'
import personagemImg from '../../imagens/personagem-torneios.png'
import AuroraBackground from './AuroraBackground'

async function loadTournaments() {
  let { data, error } = await supabase
    .from('torneios')
    .select('*')
    .order('registro', { ascending: false })

  if (error) {
    const fallback = await supabase.from('torneios').select('*').order('id', { ascending: false })
    data = fallback.data
    error = fallback.error
  }

  if (error) throw error
  return data || []
}

function formatDate(value) {
  if (!value) return 'Data a confirmar'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function formatPrize(value) {
  if (value === null || value === undefined || value === '') return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)
}

// ============================================================
// COMPONENTE: DETALHES DO TORNEIO (com Bracket)
// ============================================================

function tournamentStatus(status) {
  if (status === true) return { label: 'INSCRIÇÕES ABERTAS', classe: 'tournament-status' }
  if (status === false) return { label: 'ENCERRADO', classe: 'tournament-status tournament-status--finished' }
  return { label: 'STATUS NÃO INFORMADO', classe: 'tournament-status' }
}

function TournamentDetails({ tournaments, loading, error }) {
  const { id } = useParams()
  const tournament = tournaments.find((item) => String(item.id) === id)

  if (loading) return <main className="tournament-page-state"><p>Carregando detalhes...</p></main>
  if (error) return <main className="tournament-page-state error"><p>{error}</p><Link to="/torneios">Voltar para torneios</Link></main>
  if (!tournament) return <main className="tournament-page-state"><h1>Torneio não encontrado</h1><Link to="/torneios">Voltar para torneios</Link></main>

  const info = tournamentStatus(tournament.status)

  return (
    <main className="tournament-details fundo-aurora-motion">
      <AuroraBackground />
      <Link className="back-link" to="/torneios">&lt;- Voltar para torneios</Link>
      <div className="details-hero">
        <div className="tournament-card-visual" aria-hidden="true">
          <span>ROXO</span>
          <strong>{tournament.jogo || 'Não informado'}</strong>
        </div>
        <div>
          <span className={info.classe}>{info.label}</span>
          <h1>{tournament.nome}</h1>
          <p>{formatDate(tournament.data_inicio)}</p>
        </div>
      </div>
      <div className="details-grid">
        <div><small>VALOR DO PRÊMIO</small><strong>{formatPrize(tournament.dinheiro)}</strong></div>
        <div><small>FORMATO</small><strong>{tournament.formato || 'Não informado'}</strong></div>
      </div>
      <section className="details-rules">
        <h2>Descrição do torneio</h2>
        <p>{tournament.descricao || 'Nenhuma descrição informada.'}</p>
      </section>
      <section className="details-rules">
        <h2>Chaveamento</h2>
        <p>Os dados de partidas deste torneio ainda não estão disponíveis.</p>
      </section>
    </main>
  )
}

function TournamentCard({ tournament, index }) {
  const cardId = tournament.id ?? index
  const info = tournamentStatus(tournament.status)

  return (
    <article className="tournament-card">
      <Link className="tournament-card-link" to={`/torneios/${cardId}`} aria-label={`Ver detalhes de ${tournament.nome}`}>
        <div className="tournament-card-visual" aria-hidden="true">
          <span>ROXO</span>
          <strong>{tournament.jogo || 'Não informado'}</strong>
        </div>
        <div className="tournament-card-content">
          <span className={info.classe}>{info.label}</span>
          <h2>{tournament.nome}</h2>
          <p className="tournament-date">{formatDate(tournament.data_inicio)}</p>
          <div className="tournament-meta">
            <span><small>PRÊMIO</small>{formatPrize(tournament.dinheiro)}</span>
            <span><small>FORMATO</small>{tournament.formato || 'Não informado'}</span>
          </div>
        </div>
      </Link>
      <details className="tournament-rules">
        <summary>Ver descrição <span>+</span></summary>
        <p>{tournament.descricao || 'Nenhuma descrição informada.'}</p>
      </details>
    </article>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL: PAGINA DE TORNEIOS
// ============================================================

export default function Torneios() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const { id } = useParams()

  useEffect(() => {
    let ativo = true

    const recarregar = () => {
      loadTournaments()
        .then((data) => {
          if (ativo) {
            setTournaments(data)
            setErro('')
          }
        })
        .catch(() => {
          if (ativo) setErro('Não foi possível carregar os torneios. Tente novamente mais tarde.')
        })
        .finally(() => {
          if (ativo) setLoading(false)
        })
    }

    recarregar()

    window.addEventListener('torneiosAtualizados', recarregar)
    window.addEventListener('storage', recarregar)
    window.addEventListener('focus', recarregar)

    return () => {
      ativo = false
      window.removeEventListener('torneiosAtualizados', recarregar)
      window.removeEventListener('storage', recarregar)
      window.removeEventListener('focus', recarregar)
    }
  }, [])

  const torneiosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return tournaments

    return tournaments.filter((tournament) => {
      const matchNome = (tournament.nome || '').toLowerCase().includes(termo)
      const matchFormato = (tournament.formato || '').toLowerCase().includes(termo)
      const matchJogo = (tournament.jogo || '').toLowerCase().includes(termo)
      const matchDesc = (tournament.descricao || '').toLowerCase().includes(termo)
      
      const valorPremioStr = String(tournament.dinheiro || '')
      const premioFormatado = formatPrize(tournament.dinheiro).toLowerCase()
      const matchPremio = valorPremioStr.includes(termo) || premioFormatado.includes(termo)

      return matchNome || matchFormato || matchJogo || matchDesc || matchPremio
    })
  }, [tournaments, busca])

  if (id !== undefined) return <TournamentDetails tournaments={tournaments} loading={loading} error={erro} />

  return (
    <main className="tournaments-page fundo-aurora-motion">
      <AuroraBackground />
      <section className="tournaments-heading">
        <div>
          <h1>Escolha seu próximo <span>desafio.</span></h1>
        </div>
        <p>Encontre um campeonato, monte sua equipe e dispute o topo do ranking.</p>
        <Link to="/torneios/criar" className="tournaments-criar-btn">Criar Torneio</Link>
      </section>

      {/* Barra de Pesquisa de Competições */}
      <div className="tournaments-busca-container">
        <div className="tournaments-busca-box">
          <svg className="tournaments-busca-icone" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="tournaments-busca-input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar competição por nome, formato ou premiação..."
            aria-label="Buscar competições"
          />
          {busca && (
            <button
              type="button"
              className="tournaments-busca-limpar"
              onClick={() => setBusca('')}
              title="Limpar pesquisa"
              aria-label="Limpar pesquisa"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="tournament-page-state">
          <p>Carregando torneios...</p>
        </div>
      )}

      {!loading && erro && (
        <div className="tournament-page-state error">
          <p>{erro}</p>
        </div>
      )}

      {!loading && !erro && tournaments.length === 0 && (
        <div className="tournament-page-state">
          <p>Nenhum torneio disponível no momento.</p>
        </div>
      )}

      {!loading && !erro && tournaments.length > 0 && torneiosFiltrados.length === 0 && (
        <div className="tournaments-busca-vazio">
          <div className="tournaments-busca-vazio-icone" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          <h3>Nenhuma competição encontrada</h3>
          <p>Nenhuma competição encontrada para esta busca.</p>
          <button type="button" className="tournaments-busca-limpar-btn" onClick={() => setBusca('')}>
            Limpar busca
          </button>
        </div>
      )}

      {!loading && !erro && torneiosFiltrados.length > 0 && (
        <div className="tournaments-grid">
          {torneiosFiltrados.map((tournament, index) => (
            <TournamentCard key={tournament.id ?? index} tournament={tournament} index={index} />
          ))}
        </div>
      )}

      <div className="torneios-personagem-wrap" aria-hidden="true">
        <img 
          src={personagemImg} 
          alt="Agente CS" 
          className="torneios-personagem-img" 
        />
      </div>
    </main>
  )
}
