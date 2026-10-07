import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { imagensMapas } from '../mapas'
import '../css/torneios.css'
import personagemImg from '../../imagens/personagem-torneios.png'
import AuroraBackground from './AuroraBackground'

const CAMPOS_TORNEIOS = 'id, nome, descricao, data_inicio, dinheiro, formato, status, id_time_vencedor, premio_acumulado, registro'

async function loadTournaments() {
  let { data, error } = await supabase
    .from('torneios')
    .select(CAMPOS_TORNEIOS)
    .order('registro', { ascending: false })
    .limit(60)

  if (error) {
    console.error('ERRO SUPABASE [Torneios - Consulta Principal]:', error.message, error.details, error.hint, error.code)
    const fallback = await supabase
      .from('torneios')
      .select(CAMPOS_TORNEIOS)
      .order('id', { ascending: false })
      .limit(60)
    data = fallback.data
    error = fallback.error
    if (error) {
      console.error('ERRO SUPABASE [Torneios - Consulta Fallback]:', error.message, error.details, error.hint, error.code)
    }
  }

  if (error) throw error

  const tournaments = Array.isArray(data) ? data : []
  if (tournaments.length === 0) return []

  try {
    // Conta quantos times estao inscritos em cada torneio para calcular o premio acumulado (taxa * inscritos)
    const { data: inscricoes, error: errInsc } = await supabase
      .from('inscricoes')
      .select('id_torneio')
      .in('id_torneio', tournaments.map((t) => t.id).filter(Boolean))

    if (errInsc) {
      console.warn('ERRO SUPABASE [Torneios - Inscricoes]:', errInsc.message, errInsc.details, errInsc.hint)
    }

    const contagemPorTorneio = {}
    for (const linha of Array.isArray(inscricoes) ? inscricoes : []) {
      if (linha?.id_torneio) {
        contagemPorTorneio[linha.id_torneio] = (contagemPorTorneio[linha.id_torneio] || 0) + 1
      }
    }

    return tournaments.map((t) => ({ ...t, totalInscritos: contagemPorTorneio[t.id] || 0 }))
  } catch (errInscricoes) {
    console.warn('Falha ao computar contagem de inscricoes:', errInscricoes)
    return tournaments.map((t) => ({ ...t, totalInscritos: 0 }))
  }
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

// Fallback seguro e leitura de mapas
function extrairDadosMapa(tournament) {
  if (!tournament) return { nome: 'Mirage', imagem: imagensMapas.Mirage }

  // 1. Campo explícito no objeto do banco (caso adicionado no futuro)
  if (tournament.imagem_mapa || tournament.imagem) {
    const img = tournament.imagem_mapa || tournament.imagem
    return { nome: tournament.mapa || 'CS2', imagem: img }
  }

  // 2. Extrai nome do mapa da descrição (ex: "- Mapa oficial: Mirage" ou "Mapa: Dust II")
  let nomeDetectado = null
  const matchRegex = tournament.descricao?.match(/(?:^|\n)-?\s*(?:mapa oficial|mapa):\s*([^\n\r]+)/i)
  if (matchRegex && matchRegex[1]) {
    nomeDetectado = matchRegex[1].trim()
  }

  // 3. Se não achou na regex, procura menção aos mapas conhecidos na descrição ou no nome
  if (!nomeDetectado) {
    const textoGeral = `${tournament.nome || ''} ${tournament.descricao || ''}`.toLowerCase()
    if (textoGeral.includes('dust')) nomeDetectado = 'Dust II'
    else if (textoGeral.includes('mirage')) nomeDetectado = 'Mirage'
    else if (textoGeral.includes('inferno')) nomeDetectado = 'Inferno'
    else if (textoGeral.includes('nuke')) nomeDetectado = 'Nuke'
    else if (textoGeral.includes('overpass')) nomeDetectado = 'Overpass'
    else if (textoGeral.includes('ancient')) nomeDetectado = 'Ancient'
    else if (textoGeral.includes('anubis')) nomeDetectado = 'Anubis'
  }

  // 4. Normalização de variações de grafia
  if (nomeDetectado) {
    if (/dust\s*2|dust2|dust_2|de_dust2/i.test(nomeDetectado)) {
      return { nome: 'Dust II', imagem: imagensMapas['Dust II'] }
    }
    const mapaChave = Object.keys(imagensMapas).find(
      (m) => m.toLowerCase() === nomeDetectado.toLowerCase()
    )
    if (mapaChave && imagensMapas[mapaChave]) {
      return { nome: mapaChave, imagem: imagensMapas[mapaChave] }
    }
  }

  // 5. Fallback padrão seguro (Mirage / Dust II)
  return {
    nome: nomeDetectado || 'Mirage',
    imagem: imagensMapas.Mirage || imagensMapas['Dust II']
  }
}

// ============================================================
// COMPONENTE: CARD DE TORNEIO
// ============================================================

function tournamentStatus(tournament) {
  // 1. Torneio com campeão declarado -> Encerrado
  if (tournament?.id_time_vencedor) {
    return { tipo: 'encerrado', label: 'ENCERRADO', classe: 'tournament-status tournament-status--finished' }
  }

  // 2. Inscrições fechadas mas sem vencedor -> Em Andamento (Bracket em disputa)
  const isStatusFechado = tournament?.status === false || tournament?.status === 'false' || tournament?.status === 0 || tournament?.status === '0'
  if (isStatusFechado) {
    return { tipo: 'em_andamento', label: 'EM ANDAMENTO', classe: 'tournament-status tournament-status--live' }
  }

  // 3. Torneio aberto para novas inscrições
  return { tipo: 'aberto', label: 'INSCRIÇÕES ABERTAS', classe: 'tournament-status tournament-status--open' }
}

function TournamentCard({ tournament, index }) {
  const cardId = tournament.id ?? index
  const info = tournamentStatus(tournament)
  const premioAcumulado = (Number(tournament.dinheiro) || 0) * (tournament.totalInscritos || 0)
  const mapaInfo = extrairDadosMapa(tournament)

  return (
    <article className={`tournament-card${info.tipo === 'em_andamento' ? ' tournament-card--live' : ''}`}>
      <Link className="tournament-card-link" to={`/torneios/${cardId}`} aria-label={`Ver detalhes de ${tournament.nome}`}>
        <div className="tournament-card-visual" aria-hidden="true">
          {mapaInfo.imagem && (
            <img
              className="tournament-card-map-image"
              src={mapaInfo.imagem}
              alt={mapaInfo.nome}
              loading="lazy"
              onError={(e) => {
                if (e.currentTarget.src !== imagensMapas['Dust II']) {
                  e.currentTarget.src = imagensMapas['Dust II']
                } else {
                  e.currentTarget.style.display = 'none'
                }
              }}
            />
          )}
          <span>{mapaInfo.nome.toUpperCase()}</span>
          <strong>CS2</strong>
        </div>
        <div className="tournament-card-content">
          <span className={info.classe}>{info.label}</span>
          <h2>{tournament.nome}</h2>
          <p className="tournament-date">{formatDate(tournament.data_inicio)}</p>
          <div className="tournament-meta">
            <span className="tournament-meta-premio">
              <small>PRÊMIO ACUMULADO</small>
              <strong className="tournament-premio-valor">{formatPrize(premioAcumulado)}</strong>
            </span>
            <span>
              <small>TAXA DE INSCRIÇÃO</small>
              <strong>{formatPrize(tournament.dinheiro)}</strong>
            </span>
            <span>
              <small>FORMATO</small>
              <strong>{tournament.formato || 'Não informado'}</strong>
            </span>
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

const CACHE_KEY_TORNEIOS = 'cache_torneios_v1'

export default function Torneios() {
  const [tournaments, setTournaments] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_KEY_TORNEIOS)
      return salvo ? JSON.parse(salvo) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_KEY_TORNEIOS)
      return !salvo || JSON.parse(salvo).length === 0
    } catch {
      return true
    }
  })
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    let ativo = true

    const recarregar = () => {
      loadTournaments()
        .then((data) => {
          if (ativo) {
            const listaSegura = Array.isArray(data) ? data : []
            setTournaments(listaSegura)
            try {
              localStorage.setItem(CACHE_KEY_TORNEIOS, JSON.stringify(listaSegura))
            } catch (e) {
              console.warn('Falha ao gravar cache de torneios:', e)
            }
            setErro('')
          }
        })
        .catch((err) => {
          console.error('ERRO SUPABASE [Torneios - Falha no Carregamento]:', err?.message || err)
          if (ativo && tournaments.length === 0) {
            setErro('Não foi possível carregar os torneios. Tente novamente mais tarde.')
          }
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

  const torneiosEmAndamento = useMemo(() => {
    return torneiosFiltrados.filter((tournament) => {
      const isStatusFechado = tournament.status === false || tournament.status === 'false' || tournament.status === 0 || tournament.status === '0'
      return isStatusFechado && !tournament.id_time_vencedor
    })
  }, [torneiosFiltrados])

  const torneiosAbertos = useMemo(() => {
    return torneiosFiltrados.filter((tournament) => {
      const isStatusFechado = tournament.status === false || tournament.status === 'false' || tournament.status === 0 || tournament.status === '0'
      return !isStatusFechado && !tournament.id_time_vencedor
    })
  }, [torneiosFiltrados])

  const torneiosEncerrados = useMemo(() => {
    return torneiosFiltrados.filter((tournament) => Boolean(tournament.id_time_vencedor))
  }, [torneiosFiltrados])

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

      {/* Secao: Torneios em Andamento */}
      {!loading && !erro && torneiosEmAndamento.length > 0 && (
        <section className="tournaments-secao tournaments-secao--andamento">
          <div className="tournaments-secao-header">
            <div className="tournaments-secao-titulo-wrap">
              <span className="tournaments-live-indicator" aria-label="Ao vivo">
                <span className="tournaments-live-dot" />
                AO VIVO
              </span>
              <h2 className="tournaments-secao-titulo">Torneios em Andamento</h2>
            </div>
            <span className="tournaments-secao-contador">
              {torneiosEmAndamento.length} {torneiosEmAndamento.length === 1 ? 'campeonato' : 'campeonatos'}
            </span>
          </div>
          <div className="tournaments-grid">
            {torneiosEmAndamento.map((tournament, index) => (
              <TournamentCard key={tournament.id ?? index} tournament={tournament} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Secao: Torneios com Inscrições Abertas */}
      {!loading && !erro && torneiosAbertos.length > 0 && (
        <section className="tournaments-secao tournaments-secao--abertos">
          <div className="tournaments-secao-header">
            <div className="tournaments-secao-titulo-wrap">
              <span className="tournaments-aberto-indicator">
                INSCRIÇÕES
              </span>
              <h2 className="tournaments-secao-titulo">Inscrições Abertas</h2>
            </div>
            <span className="tournaments-secao-contador">
              {torneiosAbertos.length} {torneiosAbertos.length === 1 ? 'campeonato' : 'campeonatos'}
            </span>
          </div>
          <div className="tournaments-grid">
            {torneiosAbertos.map((tournament, index) => (
              <TournamentCard key={tournament.id ?? index} tournament={tournament} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Mensagem quando não há torneios em andamento nem com inscrições abertas */}
      {!loading && !erro && !busca && tournaments.length > 0 && torneiosAbertos.length === 0 && torneiosEmAndamento.length === 0 && (
        <div className="tournament-page-state">
          <p>No momento não há campeonatos em andamento ou com inscrições abertas. Confira o histórico de encerrados abaixo.</p>
        </div>
      )}

      {/* Secao: Torneios Encerrados */}
      {!loading && !erro && torneiosEncerrados.length > 0 && (
        <details className="tournaments-encerrados" defaultOpen={torneiosAbertos.length === 0 && torneiosEmAndamento.length === 0}>
          <summary>
            <span>Torneios encerrados ({torneiosEncerrados.length})</span>
            <span className="tournaments-encerrados-icone" aria-hidden="true">+</span>
          </summary>
          <div className="tournaments-grid">
            {torneiosEncerrados.map((tournament, index) => (
              <TournamentCard key={tournament.id ?? index} tournament={tournament} index={index} />
            ))}
          </div>
        </details>
      )}

      <div className="torneios-personagem-wrap" aria-hidden="true">
        <img 
          src={personagemImg} 
          alt="Agente CS" 
          loading="lazy"
          className="torneios-personagem-img" 
        />
      </div>
    </main>
  )
}
