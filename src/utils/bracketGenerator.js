import { supabase } from '../supabase.js'

/**
 * Quantidades permitidas de equipes para geração de chaveamento eliminatório (potências de 2 completas).
 */
export const TAMANHOS_VALIDOS_BRACKET = [4, 8, 16, 32]

/**
 * Serviço responsável por gerar os registros da tabela partidas
 * quando um torneio (Eliminação Simples) é iniciado.
 * 
 * Regra: Só gera chaves com número PAR e exato de equipes (4, 8, 16 ou 32).
 * Remove qualquer lógica de times "BYE" ou slots fantasmas.
 */
export async function gerarBracket(torneioId, timesInscritos) {
  try {
    const N = timesInscritos?.length || 0
    if (!TAMANHOS_VALIDOS_BRACKET.includes(N)) {
      throw new Error('Para gerar o bracket, o torneio deve possuir um número exato de equipes: 4, 8, 16 ou 32.')
    }

    const maxParticipantes = N
    const rodadasTotais = Math.log2(maxParticipantes)

    // Embaralha os participantes para sorteio equilibrado
    const participantes = [...timesInscritos].sort(() => Math.random() - 0.5)

    const partidasGeradas = []
    let partidaIdCounter = 1 // IDs temporários para encadeamento de chaves

    // Estrutura para rastrear as partidas por rodada
    const partidasPorRodada = {}
    for (let r = 1; r <= rodadasTotais; r++) {
      partidasPorRodada[r] = []
    }

    // Gera de trás pra frente (da final para as fases iniciais)
    for (let rodada = rodadasTotais; rodada >= 1; rodada--) {
      const numPartidasNestaRodada = maxParticipantes / Math.pow(2, rodada)
      
      for (let i = 0; i < numPartidasNestaRodada; i++) {
        const partidaTemp = {
          temp_id: partidaIdCounter++, // ID local para referência
          torneio_id: torneioId,
          rodada: rodada,
          posicao: i + 1,
          status: rodada === 1 ? 'Pendente' : 'Agendada',
          time1_id: null,
          time2_id: null,
          proxima_partida_id: null,
          proxima_partida_slot: null
        }

        // Se não for a final (última rodada), vincula com a partida da próxima rodada
        if (rodada < rodadasTotais) {
          const proximaRodadaPartidas = partidasPorRodada[rodada + 1]
          // Cada partida da próxima rodada recebe 2 partidas desta rodada
          const partidaDestinoIndex = Math.floor(i / 2)
          const partidaDestino = proximaRodadaPartidas[partidaDestinoIndex]
          
          partidaTemp.temp_proxima = partidaDestino.temp_id
          partidaTemp.proxima_partida_slot = (i % 2) + 1
        }

        partidasPorRodada[rodada].push(partidaTemp)
        partidasGeradas.push(partidaTemp)
      }
    }

    // Distribui todos os participantes na primeira rodada (100% preenchida sem BYEs)
    const partidasRodada1 = partidasPorRodada[1]
    let participanteIndex = 0
    for (const p of partidasRodada1) {
      p.time1_id = participantes[participanteIndex++]?.id || null
      p.time2_id = participantes[participanteIndex++]?.id || null
      p.status = 'Pendente'
    }

    // Inserção no banco: insere do final para o início para obter os IDs reais e encadear
    const partidasReaisIds = {} // mapeia temp_id -> uuid real no supabase

    for (let rodada = rodadasTotais; rodada >= 1; rodada--) {
      const partidasDaRodada = partidasPorRodada[rodada]

      for (const p of partidasDaRodada) {
        const insertObj = {
          torneio_id: p.torneio_id,
          rodada: p.rodada,
          posicao: p.posicao,
          status: p.status,
          time1_id: p.time1_id,
          time2_id: p.time2_id,
          proxima_partida_slot: p.proxima_partida_slot
        }

        if (p.temp_proxima) {
          insertObj.proxima_partida_id = partidasReaisIds[p.temp_proxima]
        }

        const { data, error } = await supabase
          .from('partidas')
          .insert(insertObj)
          .select('id')
          .single()

        if (error) {
          console.error('Erro ao inserir partida no banco:', error)
          throw error
        }

        partidasReaisIds[p.temp_id] = data.id
      }
    }

    return true
  } catch (error) {
    console.error('Falha ao gerar o bracket:', error)
    throw error
  }
}
