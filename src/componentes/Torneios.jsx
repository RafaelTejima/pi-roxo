import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import '../css/torneios.css'
import '../css/bracket.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// ============================================================
// TORNEIOS FICTICIOS (fallback quando nao ha API)
// ============================================================

const TORNEIOS_FICTICIOS = [
  {
    id: 'demo-1',
    name: 'ROXO Major 2026',
    tournament_date: '2026-10-15T18:00:00',
    prize: 50000,
    teams_count: 8,
    status: 'open',
    rules: 'Formato Single Elimination com 8 equipes. Partidas em formato MR12 (primeiro a 13 rounds vence o mapa). Series em melhor de 1 (BO1) nas quartas e semis, e melhor de 3 (BO3) na grande final. Proibido uso de cheats ou exploits. A organizacao se reserva o direito de desclassificar equipes por comportamento antidesportivo.',
  },
  {
    id: 'demo-2',
    name: 'Invitational Series — Outono',
    tournament_date: '2026-11-02T15:00:00',
    prize: 25000,
    teams_count: 4,
    status: 'open',
    rules: 'Torneio fechado por convite com 4 equipes selecionadas pelo staff da ROXO. Formato de rodada unica (bracket de 4). Todas as partidas em BO3. Check-in obrigatorio 30 minutos antes do inicio.',
  },
  {
    id: 'demo-3',
    name: 'Copa ROXO — Fase de Grupos',
    tournament_date: '2026-12-05T20:00:00',
    prize: 10000,
    teams_count: 16,
    status: 'soon',
    rules: 'Fase de grupos com 4 grupos de 4 times, seguida de playoffs. Classificam-se os dois primeiros de cada grupo. Formato suíço nas fases iniciais e eliminação simples nos playoffs.',
  },
  {
    id: 'demo-4',
    name: 'ROXO Open — Qualificatória',
    tournament_date: '2026-09-28T14:00:00',
    prize: 5000,
    teams_count: 32,
    status: 'open',
    rules: 'Torneio aberto para qualquer equipe registrada na plataforma. Inscrições encerram 24h antes do inicio. Formato de eliminação simples com 32 equipes. Partidas BO1 ate a final, que sera BO3.',
  },
]

async function loadTournaments() {
  if (!supabaseUrl || !supabaseKey) {
    // Sem API configurada: retorna dados ficticios
    return TORNEIOS_FICTICIOS
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/tournaments?select=*&order=tournament_date.asc`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  })

  if (!response.ok) return TORNEIOS_FICTICIOS
  const data = await response.json()
  // Se o banco retornar vazio, usa ficticios para nao deixar a tela em branco
  return data && data.length > 0 ? data : TORNEIOS_FICTICIOS
}

function formatDate(value) {
  if (!value) return 'Data a confirmar'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatPrize(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)
}

// ============================================================
// DADOS SIMULADOS DO BRACKET
// ============================================================

const TIMES_SIMULADOS = [
  { id: 't1', nome: 'FURIA',      seed: 1 },
  { id: 't2', nome: 'MIBR',       seed: 2 },
  { id: 't3', nome: 'Imperial',   seed: 3 },
  { id: 't4', nome: 'paIN',       seed: 4 },
  { id: 't5', nome: 'RED Canids', seed: 5 },
  { id: 't6', nome: 'Bestia',     seed: 6 },
  { id: 't7', nome: 'Fluxo',      seed: 7 },
  { id: 't8', nome: 'ODDIK',      seed: 8 },
]

// Cruzamento inicial por seeding: 1x8, 4x5, 2x7, 3x6
function gerarPartidasIniciais() {
  return [
    // Rodada 1 - Quartas de Final
    { id: 'm_r1_p0', rodada: 1, posicao: 0, time1_id: 't1', time2_id: 't8', time1_placar: null, time2_placar: null, vencedor_id: null, proximo_id: 'm_r2_p0', status: 'PENDING' },
    { id: 'm_r1_p1', rodada: 1, posicao: 1, time1_id: 't4', time2_id: 't5', time1_placar: null, time2_placar: null, vencedor_id: null, proximo_id: 'm_r2_p0', status: 'PENDING' },
    { id: 'm_r1_p2', rodada: 1, posicao: 2, time1_id: 't2', time2_id: 't7', time1_placar: null, time2_placar: null, vencedor_id: null, proximo_id: 'm_r2_p1', status: 'PENDING' },
    { id: 'm_r1_p3', rodada: 1, posicao: 3, time1_id: 't3', time2_id: 't6', time1_placar: null, time2_placar: null, vencedor_id: null, proximo_id: 'm_r2_p1', status: 'PENDING' },
    // Rodada 2 - Semifinais
    { id: 'm_r2_p0', rodada: 2, posicao: 0, time1_id: null, time2_id: null, time1_placar: null, time2_placar: null, vencedor_id: null, proximo_id: 'm_r3_p0', status: 'WAITING' },
    { id: 'm_r2_p1', rodada: 2, posicao: 1, time1_id: null, time2_id: null, time1_placar: null, time2_placar: null, vencedor_id: null, proximo_id: 'm_r3_p0', status: 'WAITING' },
    // Rodada 3 - Final
    { id: 'm_r3_p0', rodada: 3, posicao: 0, time1_id: null, time2_id: null, time1_placar: null, time2_placar: null, vencedor_id: null, proximo_id: null, status: 'WAITING' },
  ]
}

// ============================================================
// ALGORITMO DE RESOLUCAO DE PARTIDAS (CS2 MR12)
// ============================================================

function gerarPlacarCS2() {
  // Vencedor: sempre 13. Perdedor: entre 0 e 11.
  const perdedor = Math.floor(Math.random() * 12) // 0 a 11
  return { vencedor: 13, perdedor }
}

function resolverPartida(partida, vencedorId) {
  const { vencedor, perdedor } = gerarPlacarCS2()
  const perdedorId = vencedorId === partida.time1_id ? partida.time2_id : partida.time1_id
  return {
    ...partida,
    time1_placar: partida.time1_id === vencedorId ? vencedor : perdedor,
    time2_placar: partida.time2_id === vencedorId ? vencedor : perdedor,
    vencedor_id: vencedorId,
    status: 'FINISHED',
  }
}

// Avanca o vencedor para a proxima partida no bracket
function avancarVencedor(partidas, partidaResolvida) {
  const { vencedor_id, proximo_id, posicao } = partidaResolvida
  if (!proximo_id || !vencedor_id) return partidas

  return partidas.map((p) => {
    if (p.id !== proximo_id) return p
    // Posicao par -> Time 1, posicao impar -> Time 2
    const eTime1 = posicao % 2 === 0
    const novaPartida = {
      ...p,
      time1_id: eTime1 ? vencedor_id : p.time1_id,
      time2_id: !eTime1 ? vencedor_id : p.time2_id,
    }
    // Se ambos os times estiverem preenchidos, a partida fica PENDING
    if (novaPartida.time1_id && novaPartida.time2_id) {
      novaPartida.status = 'PENDING'
    }
    return novaPartida
  })
}

// Aplica resolucao de uma partida + avanco no bracket
function processarUmaPartida(partidas, partidaId, vencedorId) {
  const partida = partidas.find((p) => p.id === partidaId)
  if (!partida || partida.status !== 'PENDING' || !vencedorId) return partidas

  const resolvida = resolverPartida(partida, vencedorId)
  const atualizadas = partidas.map((p) => (p.id === resolvida.id ? resolvida : p))
  return avancarVencedor(atualizadas, resolvida)
}

// Escolhe um vencedor aleatorio entre os dois times de uma partida
function escolherVencedorAleatorio(partida) {
  if (!partida.time1_id || !partida.time2_id) return null
  return Math.random() < 0.5 ? partida.time1_id : partida.time2_id
}

// Processa todo o torneio em cascata (rodada por rodada)
function processarTorneioCompleto(partidas) {
  let estado = [...partidas]
  const rodadas = [1, 2, 3]
  for (const rodada of rodadas) {
    const pendentes = estado.filter((p) => p.rodada === rodada && p.status === 'PENDING')
    for (const partida of pendentes) {
      const vencedor = escolherVencedorAleatorio(partida)
      if (vencedor) {
        estado = processarUmaPartida(estado, partida.id, vencedor)
      }
    }
  }
  return estado
}

// ============================================================
// HELPERS DE CONSULTA DE DADOS
// ============================================================

function getTime(times, id) {
  return times.find((t) => t.id === id) || null
}

function getCampiao(partidas, times) {
  const final = partidas.find((p) => p.rodada === 3)
  if (!final || !final.vencedor_id) return null
  return getTime(times, final.vencedor_id)
}

function haPartidasPendentes(partidas) {
  return partidas.some((p) => p.status === 'PENDING')
}

// ============================================================
// COMPONENTE: CONECTOR SVG ENTRE FASES
// ============================================================

function ConectorSVG({ ativo }) {
  return (
    <svg className="bracket-conector-svg" viewBox="0 0 36 60" height="60" xmlns="http://www.w3.org/2000/svg">
      <path
        className={`bracket-conector-path${ativo ? ' bracket-conector-path--ativo' : ''}`}
        d="M 0 15 H 18 V 45 H 36 M 0 45 H 18"
      />
    </svg>
  )
}

// ============================================================
// COMPONENTE: CARD DE UMA PARTIDA
// ============================================================

function CardPartida({ partida, times, onClicarTime, onResolver }) {
  const time1 = getTime(times, partida.time1_id)
  const time2 = getTime(times, partida.time2_id)
  const isFinal = partida.rodada === 3
  const isPending = partida.status === 'PENDING'
  const isFinished = partida.status === 'FINISHED'
  const isWaiting = partida.status === 'WAITING'

  function classeTime(timeId) {
    if (!isFinished) return ''
    if (partida.vencedor_id === timeId) return 'bracket-time--vencedor'
    return 'bracket-time--perdedor'
  }

  function renderTime(timeId, placar, slot) {
    const time = getTime(times, timeId)
    const nomeExibido = time ? time.nome : 'Aguardando...'
    const seedExibido = time ? time.seed : null
    const eVazio = !time

    return (
      <div
        className={`bracket-time ${classeTime(timeId)} ${eVazio ? 'bracket-time--vazio' : ''}`}
        onClick={() => {
          if (isPending && !eVazio) onClicarTime(partida.id, timeId)
        }}
        title={isPending && !eVazio ? `Declarar ${nomeExibido} como vencedor` : undefined}
      >
        {seedExibido && <span className="bracket-seed">{seedExibido}</span>}
        <span className="bracket-time-nome">{nomeExibido}</span>
        <span className="bracket-time-placar">
          {isFinished ? placar : '—'}
        </span>
      </div>
    )
  }

  function textoStatus() {
    if (isFinished) return 'ENCERRADO'
    if (isPending) return 'AO VIVO'
    return 'AGUARDANDO'
  }

  function classeStatus() {
    if (isFinished) return 'bracket-status--finished'
    if (isPending) return 'bracket-status--pending'
    return 'bracket-status--waiting'
  }

  return (
    <div className={`bracket-card${isFinal ? ' bracket-card--final' : ''}${isFinished ? ' bracket-card--resolvido' : ''}`}>
      {renderTime(partida.time1_id, partida.time1_placar, 1)}
      {renderTime(partida.time2_id, partida.time2_placar, 2)}
      <div className="bracket-card-footer">
        <span className={`bracket-status ${classeStatus()}`}>{textoStatus()}</span>
        {isPending && (
          <button
            className="bracket-btn-resolver"
            onClick={() => onResolver(partida.id)}
          >
            Resolver
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE: BRACKET COMPLETO
// ============================================================

function Bracket({ partidas, times, onClicarTime, onResolver }) {
  const fases = [
    { rodada: 1, label: 'Quartas de Final' },
    { rodada: 2, label: 'Semifinal' },
    { rodada: 3, label: 'Final' },
  ]

  return (
    <div className="bracket-scroll-wrapper">
      <div className="bracket-fases">
        {fases.map((fase, faseIdx) => {
          const partidasDaFase = partidas.filter((p) => p.rodada === fase.rodada)
          const proximaFase = fases[faseIdx + 1]

          return (
            <div key={fase.rodada} style={{ display: 'flex', flex: 1, flexDirection: 'row' }}>
              {/* Coluna da fase */}
              <div className="bracket-fase" style={{ flex: 1 }}>
                <div className="bracket-fase-label">{fase.label}</div>
                <div className="bracket-partidas-coluna">
                  {partidasDaFase.map((partida) => (
                    <div key={partida.id} className="bracket-partida-wrapper">
                      <CardPartida
                        partida={partida}
                        times={times}
                        onClicarTime={onClicarTime}
                        onResolver={onResolver}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Conectores SVG entre fases (exceto depois da última) */}
              {proximaFase && (
                <div className="bracket-conector-col">
                  {partidasDaFase.map((partida, idx) => {
                    const isAtivo = partida.status === 'FINISHED'
                    // Renderiza par de conectores (dois partidas -> uma)
                    return idx % 2 === 0 ? (
                      <ConectorSVG key={partida.id} ativo={isAtivo && partidasDaFase[idx + 1]?.status === 'FINISHED'} />
                    ) : null
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE: DETALHES DO TORNEIO (com Bracket)
// ============================================================

function TournamentDetails({ tournaments, loading, error }) {
  const { id } = useParams()
  const tournament = tournaments.find((item, index) => String(item.id ?? index) === id)

  const [partidas, setPartidas] = useState(gerarPartidasIniciais)
  const [times] = useState(TIMES_SIMULADOS)

  const campiao = getCampiao(partidas, times)
  const temPendentes = haPartidasPendentes(partidas)

  function handleClicarTime(partidaId, vencedorId) {
    setPartidas((prev) => processarUmaPartida(prev, partidaId, vencedorId))
  }

  function handleResolver(partidaId) {
    setPartidas((prev) => {
      const partida = prev.find((p) => p.id === partidaId)
      if (!partida) return prev
      const vencedor = escolherVencedorAleatorio(partida)
      return processarUmaPartida(prev, partidaId, vencedor)
    })
  }

  function handleProcessarTudo() {
    setPartidas((prev) => processarTorneioCompleto(prev))
  }

  function handleReiniciar() {
    setPartidas(gerarPartidasIniciais())
  }

  if (loading) return <main className="tournament-page-state"><p>Carregando detalhes...</p></main>
  if (error) return <main className="tournament-page-state error"><p>{error}</p><Link to="/torneios">Voltar para torneios</Link></main>
  if (!tournament) return <main className="tournament-page-state"><h1>Torneio não encontrado</h1><Link to="/torneios">Voltar para torneios</Link></main>

  return (
    <main className="tournament-details">
      <Link className="back-link" to="/torneios">&lt;- Voltar para torneios</Link>

      {/* Hero do Torneio */}
      <div className="details-hero">
        <div className="tournament-card-visual" aria-hidden="true"><span>ROXO</span><strong>CS2</strong></div>
        <div>
          <span className="tournament-status">INSCRICOES ABERTAS</span>
          <h1>{tournament.name}</h1>
          <p>{formatDate(tournament.tournament_date)}</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="details-grid">
        <div><small>VALOR DO PREMIO</small><strong>{formatPrize(tournament.prize)}</strong></div>
        <div><small>TIMES INSCRITOS</small><strong>{tournament.teams_count || tournament.registered_teams || 0}</strong></div>
      </div>

      {/* Regras */}
      <section className="details-rules">
        <h2>Regras do torneio</h2>
        <p>{tournament.rules || 'Nenhuma regra informada.'}</p>
      </section>

      <Link className="tournaments-criar-btn" to={`/torneios/${id}/mapa`}>Selecionar mapa da partida -&gt;</Link>

      {/* =====================================================
          BRACKET / CHAVEAMENTO
          ===================================================== */}
      <section id="bracket-secao">
        <h2>Chaveamento</h2>
        <p>Formato Single Elimination — 8 equipes. Clique em um time para declara-lo vencedor ou use os botoes abaixo.</p>

        {/* Instrucao */}
        <div className="bracket-instrucao">
          <span className="bracket-instrucao-dot"></span>
          Clique no nome de um time em uma partida ativa para declara-lo vencedor manualmente.
        </div>

        {/* Controles */}
        <div className="bracket-controles">
          <button
            className="bracket-btn bracket-btn--processar"
            onClick={handleProcessarTudo}
            disabled={!temPendentes}
          >
            Processar Torneio
          </button>
          <button
            className="bracket-btn bracket-btn--reiniciar"
            onClick={handleReiniciar}
          >
            Reiniciar Bracket
          </button>
        </div>

        {/* Bracket */}
        <Bracket
          partidas={partidas}
          times={times}
          onClicarTime={handleClicarTime}
          onResolver={handleResolver}
        />

        {/* Campeao */}
        {campiao && (
          <div className="bracket-campiao">
            <p className="bracket-campiao-label">Campeao do Torneio</p>
            <p className="bracket-campiao-nome">{campiao.nome}</p>
          </div>
        )}
      </section>
    </main>
  )
}

// ============================================================
// COMPONENTE: CARD DA LISTA DE TORNEIOS
// ============================================================

function TournamentCard({ tournament, index }) {
  const cardId = tournament.id ?? index

  // Mapeia status para label e cor
  const statusInfo = {
    open:     { label: 'INSCRICOES ABERTAS', classe: 'tournament-status' },
    soon:     { label: 'EM BREVE',           classe: 'tournament-status tournament-status--soon' },
    ongoing:  { label: 'EM ANDAMENTO',       classe: 'tournament-status tournament-status--live' },
    finished: { label: 'ENCERRADO',          classe: 'tournament-status tournament-status--finished' },
  }
  const info = statusInfo[tournament.status] || statusInfo.open

  return (
    <article className="tournament-card">
      <Link className="tournament-card-link" to={`/torneios/${cardId}`} aria-label={`Ver detalhes de ${tournament.name}`}>
        <div className="tournament-card-visual" aria-hidden="true">
          <span>ROXO</span>
          <strong>CS2</strong>
        </div>
        <div className="tournament-card-content">
          <span className={info.classe}>{info.label}</span>
          <h2>{tournament.name}</h2>
          <p className="tournament-date">{formatDate(tournament.tournament_date)}</p>
          <div className="tournament-meta">
            <span><small>PREMIO</small>{formatPrize(tournament.prize)}</span>
            <span><small>TIMES</small>{tournament.teams_count || tournament.registered_teams || 0} inscritos</span>
          </div>
        </div>
      </Link>
      <details className="tournament-rules">
        <summary>Ver regras <span>+</span></summary>
        <p>{tournament.rules || 'As regras deste torneio ainda nao foram informadas.'}</p>
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
  const { id } = useParams()

  useEffect(() => {
    loadTournaments()
      .then(setTournaments)
      .catch(() => setTournaments(TORNEIOS_FICTICIOS))
      .finally(() => setLoading(false))
  }, [])

  if (id !== undefined) return <TournamentDetails tournaments={tournaments} loading={loading} error={''} />

  return (
    <main className="tournaments-page">
      <section className="tournaments-heading">
        <div>
          <p className="tournaments-overline">COMPETICAO AO VIVO</p>
          <h1>Escolha seu próximo <span>desafio.</span></h1>
        </div>
        <p>Encontre um campeonato, monte sua equipe e dispute o topo do ranking.</p>
        <Link to="/torneios/criar" className="tournaments-criar-btn">Criar Torneio</Link>
      </section>

      {loading && (
        <div className="tournament-page-state">
          <p>Carregando torneios...</p>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="tournaments-grid">
          {tournaments.map((tournament, index) => (
            <TournamentCard key={tournament.id ?? index} tournament={tournament} index={index} />
          ))}
        </div>
      )}
    </main>
  )
}
