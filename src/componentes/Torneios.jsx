import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import '../css/torneios.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

async function loadTournaments() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Os torneios criados serão mostrados aqui!')
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/tournaments?select=*&order=tournament_date.asc`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  })

  if (!response.ok) throw new Error('Os torneios criados serão mostrados aqui!.')
  return response.json()
}

function formatDate(value) {
  if (!value) return 'Data a confirmar'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatPrize(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)
}

function TournamentCard({ tournament, index }) {
  return (
    <article className="tournament-card">
      <Link className="tournament-card-link" to={`/torneios/${tournament.id || index}`} aria-label={`Ver detalhes de ${tournament.name}`}>
        <div className="tournament-card-visual" aria-hidden="true"><span>ROXO</span><strong>CS2</strong></div>
        <div className="tournament-card-content">
          <span className="tournament-status">INSCRIÇÕES ABERTAS</span>
          <h2>{tournament.name}</h2>
          <p className="tournament-date">{formatDate(tournament.tournament_date)}</p>
          <div className="tournament-meta">
            <span><small>PRÊMIO</small>{formatPrize(tournament.prize)}</span>
            <span><small>TIMES</small>{tournament.teams_count || tournament.registered_teams || 0} inscritos</span>
          </div>
        </div>
      </Link>
      <details className="tournament-rules">
        <summary>Ver regras <span>+</span></summary>
        <p>{tournament.rules || 'As regras deste torneio ainda não foram informadas.'}</p>
      </details>
    </article>
  )
}

function TournamentDetails({ tournaments, loading, error }) {
  const { id } = useParams()
  const tournament = tournaments.find((item, index) => String(item.id || index) === id)

  if (loading) return <main className="tournament-page-state"><p>Carregando detalhes...</p></main>
  if (error) return <main className="tournament-page-state error"><p>{error}</p><Link to="/torneios">Voltar para torneios</Link></main>
  if (!tournament) return <main className="tournament-page-state"><h1>Torneio não encontrado</h1><Link to="/torneios">Voltar para torneios</Link></main>

  return (
    <main className="tournament-details">
      <Link className="back-link" to="/torneios">&lt;- Voltar para torneios</Link>
      <div className="details-hero">
        <div className="tournament-card-visual" aria-hidden="true"><span>ROXO</span><strong>CS2</strong></div>
        <div><span className="tournament-status">INSCRIÇÕES ABERTAS</span><h1>{tournament.name}</h1><p>{formatDate(tournament.tournament_date)}</p></div>
      </div>
      <div className="details-grid">
        <div><small>VALOR DO PRÊMIO</small><strong>{formatPrize(tournament.prize)}</strong></div>
        <div><small>TIMES INSCRITOS</small><strong>{tournament.teams_count || tournament.registered_teams || 0}</strong></div>
      </div>
      <section className="details-rules"><h2>Regras do torneio</h2><p>{tournament.rules || 'Nenhuma regra informada.'}</p></section>
    </main>
  )
}

export default function Torneios() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isDetailsPage = window.location.pathname !== '/torneios'

  useEffect(() => {
    loadTournaments().then(setTournaments).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  if (isDetailsPage) return <TournamentDetails tournaments={tournaments} loading={loading} error={error} />

  return (
    <main className="tournaments-page">
      <section className="tournaments-heading">
        <div><p className="tournaments-overline">COMPETIÇÃO AO VIVO</p><h1>Escolha seu próximo <span>desafio.</span></h1></div>
        <p>Encontre um campeonato, monte sua equipe e dispute o topo do ranking.</p>
      </section>
      {loading && <div className="tournament-page-state"><p>Carregando torneios...</p></div>}
      {error && <div className="tournament-page-state error"><p>{error}</p></div>}
      {!loading && !error && tournaments.length === 0 && <div className="tournament-page-state"><h2>Nenhum torneio disponível</h2><p>Os próximos campeonatos aparecerão aqui assim que forem criados.</p></div>}
      {!loading && !error && tournaments.length > 0 && <div className="tournaments-grid">{tournaments.map((tournament, index) => <TournamentCard key={tournament.id || index} tournament={tournament} index={index} />)}</div>}
    </main>
  )
}
