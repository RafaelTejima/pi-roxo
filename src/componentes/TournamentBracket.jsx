import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase'
import '../css/bracket.css'
import { useAlerta } from './AlertaModal'

export default function TournamentBracket({ torneioId, podeEditar, onDeclararVencedorTorneio, timeCampeao }) {
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { mostrarAlerta } = useAlerta()
  const wrapperRef = useRef(null)

  const carregarPartidas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select('*, jogador1:times!fk_partidas_time1(id, nome, tag), jogador2:times!fk_partidas_time2(id, nome, tag)')
        .eq('torneio_id', torneioId)
        .order('rodada', { ascending: true })
        .order('posicao', { ascending: true })

      if (error) throw error
      setPartidas(data || [])
    } catch (err) {
      console.error('Erro ao carregar bracket', err)
    } finally {
      setLoading(false)
    }
  }, [torneioId])

  useEffect(() => {
    // Reseta para loading sempre que torneioId muda ou o componente monta
    setLoading(true)
    setPartidas([])
    carregarPartidas()

    const channel = supabase.channel(`realtime-bracket-${torneioId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partidas', filter: `torneio_id=eq.${torneioId}` },
        () => {
          // Quando o realtime dispara (chave gerada ou vencedor declarado), recarrega
          carregarPartidas()
        }
      )
      .subscribe()

    // Polling de segurança caso o realtime não esteja habilitado no Supabase
    const pollInterval = setInterval(() => {
      carregarPartidas()
    }, 8000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [carregarPartidas, torneioId])

  // Fecha o fullscreen com ESC e trava o scroll da página de fundo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    if (isFullscreen) {
      document.body.classList.add('bracket-fullscreen-active')
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.classList.remove('bracket-fullscreen-active')
    }
    return () => {
      document.body.classList.remove('bracket-fullscreen-active')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  const handleDeclararVencedor = (partida, timeId) => {
    if (!podeEditar || partida.status === 'Finalizada') return
    if (!timeId) return

    const ehFinal = !partida.proxima_partida_id
    const mensagemConfirmacao = ehFinal
      ? 'Esta é a Grande Final! Tem certeza que deseja declarar este time como vencedor da partida e campeão do torneio?'
      : 'Tem certeza que deseja declarar este time como vencedor da partida?'

    mostrarAlerta({
      tipo: 'confirmacao',
      titulo: ehFinal ? 'Declarar Campeão do Torneio' : 'Declarar Vencedor',
      mensagem: mensagemConfirmacao,
      botaoTexto: ehFinal ? 'Sim, declarar campeão' : 'Sim, declarar',
      botaoCancelarTexto: 'Cancelar',
      onConfirmar: async () => {
        try {
          const { error } = await supabase
            .from('partidas')
            .update({ id_vencedor: timeId, status: 'Finalizada' })
            .eq('id', partida.id)

          if (error) throw error

          if (partida.proxima_partida_id) {
            const slotUpdate = partida.proxima_partida_slot === 1
              ? { time1_id: timeId }
              : { time2_id: timeId }

            const { error: errProx } = await supabase
              .from('partidas')
              .update(slotUpdate)
              .eq('id', partida.proxima_partida_id)

            if (errProx) console.warn('Erro ao propagar para a proxima partida:', errProx)
          } else if (onDeclararVencedorTorneio) {
            // Partida Final da chave: finaliza o torneio e distribui a premiação oficial
            const timeObj = partida.jogador1?.id === timeId
              ? partida.jogador1
              : (partida.jogador2?.id === timeId ? partida.jogador2 : { id: timeId, nome: `Time #${timeId}` })
            await onDeclararVencedorTorneio(timeObj)
          }

          await carregarPartidas()

          if (!ehFinal) {
            mostrarAlerta({
              tipo: 'sucesso',
              titulo: 'Sucesso',
              mensagem: 'Vencedor declarado com sucesso e chave atualizada!'
            })
          }
        } catch (err) {
          console.error('Erro ao declarar vencedor', err)
          mostrarAlerta({
            tipo: 'erro',
            titulo: 'Falha',
            mensagem: 'Erro ao declarar vencedor: ' + err.message
          })
        }
      }
    })
  }

  const getNomeFase = (rIndex) => {
    const n = partidas.filter(p => p.rodada === rIndex).length
    if (n === 1) return 'Grande Final'
    if (n === 2) return 'Semifinais'
    if (n === 4) return 'Quartas de Final'
    if (n === 8) return 'Oitavas de Final'
    return `Rodada ${rIndex}`
  }

  // Detecta o campeão da chave
  const partidaFinal = partidas.find(p => !p.proxima_partida_id)
  const idVencedorFinal = timeCampeao?.id || (partidaFinal?.status === 'Finalizada' ? partidaFinal?.id_vencedor : null)
  const campeao = timeCampeao || (idVencedorFinal ? (
    partidaFinal?.jogador1?.id === idVencedorFinal
      ? partidaFinal.jogador1
      : (partidaFinal?.jogador2?.id === idVencedorFinal ? partidaFinal.jogador2 : { id: idVencedorFinal, nome: `Time #${idVencedorFinal}` })
  ) : null)

  if (loading) return <div className="bracket-loading">Carregando chaveamento...</div>
  if (partidas.length === 0) return <div className="bracket-empty">A chave do torneio ainda não foi gerada.</div>

  const rodadas = [...new Set(partidas.map(p => p.rodada))].sort((a, b) => a - b)

  const bracketJSX = (
    <div
      ref={wrapperRef}
      className={`tournament-bracket-wrapper${isFullscreen ? ' fullscreen' : ''}`}
    >
      {/* Botão de Expandir / Minimizar — sempre acessível e alinhado ao topo */}
      <button
        className={`bracket-fullscreen-btn${isFullscreen ? ' bracket-fullscreen-btn--fixed' : ''}`}
        onClick={() => setIsFullscreen(prev => !prev)}
        title={isFullscreen ? 'Minimizar (ESC)' : 'Expandir chaveamento'}
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {isFullscreen ? (
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
          ) : (
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          )}
        </svg>
        <span>{isFullscreen ? 'Minimizar' : 'Expandir'}</span>
      </button>

      {/* Faixa/Card Imersivo de Celebração de Vitória */}
      {campeao && (
        <div className="bracket-celebracao-vencedor">
          <div className="bracket-celebracao-aura" />
          <div className="bracket-celebracao-header-badge">
            <span className="bracket-celebracao-ping" />
            TORNEIO FINALIZADO // CAMPEÃO OFICIAL
          </div>
          <div className="bracket-celebracao-corpo">
            <div className="bracket-celebracao-trofeu-box">
              <span className="bracket-celebracao-trofeu">🏆</span>
            </div>
            <div className="bracket-celebracao-titulos">
              <h2 className="bracket-celebracao-texto-principal">
                🏆 VENCEDOR: <span className="bracket-celebracao-nome-time">{campeao.nome}</span>!
              </h2>
              {campeao.tag && (
                <span className="bracket-celebracao-tag">[{campeao.tag}]</span>
              )}
              <p className="bracket-celebracao-sub">
                Equipe soberana no campeonato! Vitória conquistada na Grande Final e registrada na história.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="tournament-bracket">
        {rodadas.map((rIndex) => {
          const partidasRodada = partidas.filter(p => p.rodada === rIndex)
          const nomeFase = partidasRodada[0]?.fase || getNomeFase(rIndex)
          return (
            <div key={rIndex} className="bracket-rodada">
              <h3 className="bracket-rodada-titulo">{nomeFase}</h3>
              <div className="bracket-partidas-coluna">
                {partidasRodada.map((p) => {
                  const time1Vencedor = Boolean(p.id_vencedor && p.id_vencedor === p.time1_id)
                  const time1Derrotado = Boolean(p.id_vencedor && p.time1_id && p.id_vencedor !== p.time1_id)
                  const time2Vencedor = Boolean(p.id_vencedor && p.id_vencedor === p.time2_id)
                  const time2Derrotado = Boolean(p.id_vencedor && p.time2_id && p.id_vencedor !== p.time2_id)
                  const ehFinal = !p.proxima_partida_id
                  const matchFinalizada = p.status === 'Finalizada'

                  return (
                    <div key={p.id} className="bracket-partida-container">
                      <div className={`bracket-partida ${ehFinal ? 'bracket-partida--final' : ''} ${matchFinalizada ? 'bracket-partida--concluida' : ''}`}>
                        <div className="bracket-partida-meta">
                          <span className="bracket-partida-id">#{p.posicao || p.id}</span>
                          <span className={`bracket-partida-badge ${matchFinalizada ? 'status-finalizada' : (p.time1_id && p.time2_id ? 'status-pronto' : 'status-aguardando')}`}>
                            {ehFinal ? (matchFinalizada ? 'GRANDE FINAL ENCERRADA' : 'GRANDE FINAL') : (matchFinalizada ? 'CONCLUÍDA' : (p.time1_id && p.time2_id ? 'EM DISPUTA' : 'A DEFINIR'))}
                          </span>
                        </div>

                        {/* Slot Time 1 */}
                        <div
                          className={`bracket-time ${time1Vencedor ? 'vencedor' : ''} ${time1Derrotado ? 'derrotado' : ''} ${podeEditar && p.time1_id && !p.id_vencedor ? 'clicavel' : ''}`}
                          onClick={() => handleDeclararVencedor(p, p.time1_id)}
                          title={podeEditar && p.time1_id && !p.id_vencedor ? 'Clique para declarar vitória deste time' : (p.jogador1?.nome || '')}
                        >
                          <div className="bracket-time-info">
                            <span className={`time-tag ${p.time1_id ? 'time-tag--ativo' : 'time-tag--tbd'} ${time1Vencedor ? 'time-tag--vencedor' : ''}`}>
                              {p.jogador1?.tag || (p.time1_id ? 'TAG' : 'TBD')}
                            </span>
                            <span className="time-nome">
                              {p.jogador1?.nome || (p.time1_id ? 'Time ' + String(p.time1_id).slice(0, 4) : 'A definir')}
                            </span>
                          </div>

                          <div className="bracket-time-status">
                            {time1Vencedor && (
                              <span className="time-badge-win" title="Vencedor da partida">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span>WIN</span>
                              </span>
                            )}
                            {time1Derrotado && (
                              <span className="time-badge-out">OUT</span>
                            )}
                            {podeEditar && p.time1_id && !p.id_vencedor && (
                              <span className="time-badge-acao">Avançar</span>
                            )}
                          </div>
                        </div>

                        <div className="bracket-divisor" />

                        {/* Slot Time 2 */}
                        <div
                          className={`bracket-time ${time2Vencedor ? 'vencedor' : ''} ${time2Derrotado ? 'derrotado' : ''} ${podeEditar && p.time2_id && !p.id_vencedor ? 'clicavel' : ''}`}
                          onClick={() => handleDeclararVencedor(p, p.time2_id)}
                          title={podeEditar && p.time2_id && !p.id_vencedor ? 'Clique para declarar vitória deste time' : (p.jogador2?.nome || '')}
                        >
                          <div className="bracket-time-info">
                            <span className={`time-tag ${p.time2_id ? 'time-tag--ativo' : 'time-tag--tbd'} ${time2Vencedor ? 'time-tag--vencedor' : ''}`}>
                              {p.jogador2?.tag || (p.time2_id ? 'TAG' : 'TBD')}
                            </span>
                            <span className="time-nome">
                              {p.jogador2?.nome || (p.time2_id ? 'Time ' + String(p.time2_id).slice(0, 4) : 'A definir')}
                            </span>
                          </div>

                          <div className="bracket-time-status">
                            {time2Vencedor && (
                              <span className="time-badge-win" title="Vencedor da partida">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span>WIN</span>
                              </span>
                            )}
                            {time2Derrotado && (
                              <span className="time-badge-out">OUT</span>
                            )}
                            {podeEditar && p.time2_id && !p.id_vencedor && (
                              <span className="time-badge-acao">Avançar</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return isFullscreen ? createPortal(bracketJSX, document.body) : bracketJSX
}
