import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import '../css/bracket.css'

export default function TournamentBracket({ torneioId, podeEditar }) {
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)

  const carregarPartidas = async () => {
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
  }

  useEffect(() => {
    carregarPartidas()

    // Configurando Realtime
    const channel = supabase.channel('realtime-bracket')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partidas', filter: `torneio_id=eq.${torneioId}` },
        () => {
          // Sempre que houver update (ex: admin declarou vencedor, e a trigger ativou),
          // refaz o fetch das partidas
          carregarPartidas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [torneioId])

  const handleDeclararVencedor = async (partida, timeId) => {
    if (!podeEditar || partida.status === 'Finalizada') return
    if (!timeId) return

    if (!window.confirm('Tem certeza que deseja declarar este time como vencedor da partida?')) return;

    try {
      const { error } = await supabase
        .from('partidas')
        .update({ id_vencedor: timeId, status: 'Finalizada' })
        .eq('id', partida.id)

      if (error) throw error
      // Nao precisa chamar carregarPartidas manualmente se o realtime estiver funcionando, 
      // mas vamos deixar que o realtime cuide disso.
    } catch (err) {
      console.error('Erro ao declarar vencedor', err)
      alert('Erro ao declarar vencedor: ' + err.message)
    }
  }

  if (loading) return <div className="bracket-loading">Carregando chaveamento...</div>
  if (partidas.length === 0) return <div className="bracket-empty">A chave do torneio ainda não foi gerada.</div>

  // Agrupar partidas por rodada
  const rodadas = [...new Set(partidas.map(p => p.rodada))].sort((a,b) => a - b)

  return (
    <div className="tournament-bracket-wrapper">
      <div className="tournament-bracket">
        {rodadas.map((rIndex) => {
          const partidasRodada = partidas.filter(p => p.rodada === rIndex)
          return (
            <div key={rIndex} className="bracket-rodada">
              <h3 className="bracket-rodada-titulo">{partidasRodada[0]?.fase || `Rodada ${rIndex}`}</h3>
              <div className="bracket-partidas-coluna">
                {partidasRodada.map((p) => {
                  return (
                    <div key={p.id} className="bracket-partida">
                      <div 
                        className={`bracket-time ${p.id_vencedor === p.time1_id && p.id_vencedor ? 'vencedor' : ''} ${podeEditar && p.time1_id && !p.id_vencedor ? 'clicavel' : ''}`}
                        onClick={() => handleDeclararVencedor(p, p.time1_id)}
                      >
                        <span className="time-tag">{p.jogador1?.tag || '???'}</span>
                        <span className="time-nome">{p.jogador1?.nome || 'TBD'}</span>
                      </div>
                      <div className="bracket-divisor"></div>
                      <div 
                        className={`bracket-time ${p.id_vencedor === p.time2_id && p.id_vencedor ? 'vencedor' : ''} ${podeEditar && p.time2_id && !p.id_vencedor ? 'clicavel' : ''}`}
                        onClick={() => handleDeclararVencedor(p, p.time2_id)}
                      >
                        <span className="time-tag">{p.jogador2?.tag || '???'}</span>
                        <span className="time-nome">{p.jogador2?.nome || 'TBD'}</span>
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
}
