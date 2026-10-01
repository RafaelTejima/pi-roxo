import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
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

  const tournaments = data || []
  if (tournaments.length === 0) return tournaments

  // Conta quantos times estao inscritos em cada torneio para calcular o premio acumulado (taxa * inscritos)
  const { data: inscricoes } = await supabase
    .from('inscricoes')
    .select('id_torneio')
    .in('id_torneio', tournaments.map((t) => t.id))

  const contagemPorTorneio = {}
  for (const linha of inscricoes || []) {
    contagemPorTorneio[linha.id_torneio] = (contagemPorTorneio[linha.id_torneio] || 0) + 1
  }

  return tournaments.map((t) => ({ ...t, totalInscritos: contagemPorTorneio[t.id] || 0 }))
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
// COMPONENTE: CARD DE TORNEIO
// ============================================================

function tournamentStatus(status) {
  if (status === true) return { label: 'INSCRIÇÕES ABERTAS', classe: 'tournament-status' }
  if (status === false) return { label: 'ENCERRADO', classe: 'tournament-status tournament-status--finished' }
  return { label: 'STATUS NÃO INFORMADO', classe: 'tournament-status' }
}

function TournamentCard({ tournament, index }) {
  const cardId = tournament.id ?? index
  const info = tournamentStatus(tournament.status)
  const premioAcumulado = (Number(tournament.dinheiro) || 0) * (tournament.totalInscritos || 0)

  return (
    <article className="tournament-card">
      <Link className="tournament-card-link" to={`/torneios/${cardId}`} aria-label={`Ver detalhes de ${tournament.nome}`}>
        <div className="tournament-card-visual" aria-hidden="true">
              <span>ROXO</span>
              <strong>CS2</strong>
        </div>
        <div className="tournament-card-content">
          <span className={info.classe}>{info.label}</span>
          <h2>{tournament.nome}</h2>
          <p className="tournament-date">{formatDate(tournament.data_inicio)}</p>
          <div className="tournament-meta">
            <span><small>PRÊMIO ACUMULADO</small>{formatPrize(premioAcumulado)}</span>
            <span><small>TAXA DE INSCRIÇÃO</small>{formatPrize(tournament.dinheiro)}</span>
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
      const matchDesc = (tournament.descricao || '').toLowerCase().includes(termo)
      
      const valorPremioStr = String(tournament.dinheiro || '')
      const premioFormatado = formatPrize(tournament.dinheiro).toLowerCase()
      const matchPremio = valorPremioStr.includes(termo) || premioFormatado.includes(termo)

      return matchNome || matchFormato || matchDesc || matchPremio
    })
  }, [tournaments, busca])

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
