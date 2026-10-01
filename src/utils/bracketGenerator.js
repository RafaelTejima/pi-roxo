import { supabase } from '../supabase'

/**
 * Serviço responsável por gerar os registros da tabela partidas
 * quando um torneio (Eliminação Simples) é iniciado.
 */
export async function gerarBracket(torneioId, timesInscritos) {
  try {
    const N = timesInscritos.length
    if (N < 2) {
      throw new Error('É necessário pelo menos 2 times para gerar um chaveamento.')
    }

    // Calcula a próxima potência de 2 (ex: 3 times -> 4, 6 times -> 8, 16 -> 16)
    const potencias = [2, 4, 8, 16, 32, 64]
    let maxParticipantes = potencias.find(p => p >= N) || 64
    const rodadasTotais = Math.log2(maxParticipantes)

    // Preenche a lista com null para times faltantes (Byes)
    const participantes = [...timesInscritos]
    while (participantes.length < maxParticipantes) {
      participantes.push(null)
    }

    // Embaralha os participantes (opcional, mas recomendado para brackets aleatórios)
    participantes.sort(() => Math.random() - 0.5)

    const partidasGeradas = []
    let partidaIdCounter = 1 // IDs temporários para encadeamento

    // Estrutura para rastrear as partidas por rodada
    const partidasPorRodada = {}
    for (let r = 1; r <= rodadasTotais; r++) {
      partidasPorRodada[r] = []
    }

    // Gera de trás pra frente (da final para as oitavas/quartas)
    for (let rodada = rodadasTotais; rodada >= 1; rodada--) {
      const numPartidasNestaRodada = maxParticipantes / Math.pow(2, rodada)
      
      for (let i = 0; i < numPartidasNestaRodada; i++) {
        const partidaTemp = {
          temp_id: partidaIdCounter++, // ID local para referência
          torneio_id: torneioId,
          rodada: rodada,
          posicao: i + 1,
          status: 'Agendada',
          time1_id: null,
          time2_id: null,
          proxima_partida_id: null,
          proxima_partida_slot: null
        }

        // Se não for a final (última rodada), vincular com a partida da próxima rodada
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

    // Distribui os participantes na primeira rodada
    const partidasRodada1 = partidasPorRodada[1]
    let participanteIndex = 0
    for (let p of partidasRodada1) {
      p.time1_id = participantes[participanteIndex++]?.id || null
      p.time2_id = participantes[participanteIndex++]?.id || null

      // Se um dos lados for nulo (BYE), o time real já avança de status
      if (p.time1_id && !p.time2_id) {
        p.id_vencedor = p.time1_id
        p.status = 'Finalizada'
      } else if (!p.time1_id && p.time2_id) {
        p.id_vencedor = p.time2_id
        p.status = 'Finalizada'
      } else if (!p.time1_id && !p.time2_id) {
        p.status = 'Finalizada' // Partida fantasma
      } else {
        p.status = 'Pendente' // Pronta para jogar
      }
    }

    // Inserção no banco: temos que inserir do final para o início para obter os IDs reais e associá-los
    const partidasReaisIds = {} // mapeia temp_id -> uuid real no supabase

    for (let rodada = rodadasTotais; rodada >= 1; rodada--) {
      const partidasDaRodada = partidasPorRodada[rodada]

      for (let p of partidasDaRodada) {
        // Prepara objeto para inserção
        const insertObj = {
          torneio_id: p.torneio_id,
          rodada: p.rodada,
          posicao: p.posicao,
          status: p.status,
          time1_id: p.time1_id,
          time2_id: p.time2_id,
          proxima_partida_slot: p.proxima_partida_slot
        }

        if (p.id_vencedor) insertObj.id_vencedor = p.id_vencedor
        if (p.temp_proxima) insertObj.proxima_partida_id = partidasReaisIds[p.temp_proxima]

        const { data, error } = await supabase
          .from('partidas')
          .insert(insertObj)
          .select('id')
          .single()

        if (error) {
          console.error('Erro ao inserir partida:', error)
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
