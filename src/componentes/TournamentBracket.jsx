import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import '../css/bracket.css'
import { useAlerta } from './AlertaModal'

export default function TournamentBracket({ torneioId, podeEditar }) {
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { mostrarAlerta } = useAlerta()
  const wrapperRef = useRef(null)

  const carregarPartidas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select(`
          *,
          jogador1:times!fk_partidas_time1(id, nome, tag),
          jogador2:times!fk_partidas_time2(id, nome, tag)
        `)
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

  // Fecha o fullscreen com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const handleDeclararVencedor = (partida, timeId) => {
    if (!podeEditar || partida.status === 'Finalizada') return
    if (!timeId) return

    mostrarAlerta({
      tipo: 'confirmacao',
      titulo: 'Declarar Vencedor',
      mensagem: 'Tem certeza que deseja declarar este time como vencedor da partida?',
      botaoTexto: 'Sim, declarar',
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
          }

          await carregarPartidas()

          mostrarAlerta({
            tipo: 'sucesso',
            titulo: 'Sucesso',
            mensagem: 'Vencedor declarado com sucesso e chave atualizada!'
          })
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
    if (n === 1) return 'Final'
    if (n === 2) return 'Semifinais'
    if (n === 4) return 'Quartas de Final'
    if (n === 8) return 'Oitavas de Final'
    return `Rodada ${rIndex}`
  }

  if (loading) return <div className="bracket-loading">Carregando chaveamento...</div>
  if (partidas.length === 0) return <div className="bracket-empty">A chave do torneio ainda não foi gerada.</div>

  const rodadas = [...new Set(partidas.map(p => p.rodada))].sort((a, b) => a - b)

  return (
    <>
      {/* Botão fixo no canto da tela quando em fullscreen */}
      {isFullscreen && (
        <button
          className="bracket-fullscreen-btn bracket-fullscreen-btn--fixed"
          onClick={() => setIsFullscreen(false)}
          title="Minimizar (ESC)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
          </svg>
          <span>Minimizar</span>
        </button>
      )}

      <div
        ref={wrapperRef}
        className={`tournament-bracket-wrapper${isFullscreen ? ' fullscreen' : ''}`}
      >
        {/* Botão de maximizar — visível apenas quando NÃO está em fullscreen */}
        {!isFullscreen && (
          <button
            className="bracket-fullscreen-btn"
            onClick={() => setIsFullscreen(true)}
            title="Expandir chaveamento"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
            <span>Expandir</span>
          </button>
        )}

        <div className="tournament-bracket">
          {rodadas.map((rIndex) => {
            const partidasRodada = partidas.filter(p => p.rodada === rIndex)
            const nomeFase = partidasRodada[0]?.fase || getNomeFase(rIndex)
            return (
              <div key={rIndex} className="bracket-rodada">
                <h3 className="bracket-rodada-titulo">{nomeFase}</h3>
                <div className="bracket-partidas-coluna">
                  {partidasRodada.map((p) => (
                    <div key={p.id} className="bracket-partida-container">
                      <div className="bracket-partida">
                        <div
                          className={`bracket-time ${p.id_vencedor === p.time1_id && p.id_vencedor ? 'vencedor' : ''} ${podeEditar && p.time1_id && !p.id_vencedor ? 'clicavel' : ''}`}
                          onClick={() => handleDeclararVencedor(p, p.time1_id)}
                        >
                          <span className="time-tag">{p.jogador1?.tag || (p.time1_id ? '???' : 'BYE')}</span>
                          <span className="time-nome">{p.jogador1?.nome || (p.time1_id ? 'TBD' : '—')}</span>
                        </div>
                        <div className="bracket-divisor"></div>
                        <div
                          className={`bracket-time ${p.id_vencedor === p.time2_id && p.id_vencedor ? 'vencedor' : ''} ${podeEditar && p.time2_id && !p.id_vencedor ? 'clicavel' : ''}`}
                          onClick={() => handleDeclararVencedor(p, p.time2_id)}
                        >
                          <span className="time-tag">{p.jogador2?.tag || (p.time2_id ? '???' : 'BYE')}</span>
                          <span className="time-nome">{p.jogador2?.nome || (p.time2_id ? 'TBD' : '—')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
