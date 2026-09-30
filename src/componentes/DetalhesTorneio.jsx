import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/torneios.css'
import AuroraBackground from './AuroraBackground'
import { useAlerta } from './AlertaModal'

const TAMANHO_LINEUP = 5

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

function tournamentStatus(status) {
  if (status === true) return { label: 'INSCRIÇÕES ABERTAS', classe: 'tournament-status' }
  if (status === false) return { label: 'ENCERRADO', classe: 'tournament-status tournament-status--finished' }
  return { label: 'STATUS NÃO INFORMADO', classe: 'tournament-status' }
}

// ============================================================
// COMPONENTE: DETALHES DO TORNEIO (com Bracket)
// ============================================================

export default function DetalhesTorneio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarAlerta } = useAlerta()
  const [usuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem('usuarioLogado')
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null
  })

  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  // Dados usados para habilitar/desabilitar o botao de inscricao
  const [timeCapitaneado, setTimeCapitaneado] = useState(null)
  const [jaInscrito, setJaInscrito] = useState(false)
  const [torneioConflito, setTorneioConflito] = useState(null)
  const [carregandoInscricao, setCarregandoInscricao] = useState(true)
  const [enviandoInscricao, setEnviandoInscricao] = useState(false)

  // Times inscritos exibidos na fase de grupos
  const [timesGrupo, setTimesGrupo] = useState([])
  const [carregandoGrupo, setCarregandoGrupo] = useState(true)

  // Declaracao de vencedor (visivel para o criador do torneio ou admin)
  const [declarandoVencedorId, setDeclarandoVencedorId] = useState(null)

  useEffect(() => {
    let ativo = true

    async function carregarTorneio() {
      setLoading(true)
      setErro('')

      try {
        const { data, error } = await supabase
          .from('torneios')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (error) throw error
        if (ativo) setTournament(data)
      } catch {
        if (ativo) setErro('Não foi possível carregar os detalhes do torneio. Tente novamente mais tarde.')
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregarTorneio()

    return () => {
      ativo = false
    }
  }, [id])

  // Verifica se o usuario logado capitaneia um time com line-up completa (capitao + 4 jogadores)
  useEffect(() => {
    let ativo = true

    async function carregarElegibilidade() {
      setCarregandoInscricao(true)

      if (!usuario) {
        if (ativo) {
          setTimeCapitaneado(null)
          setCarregandoInscricao(false)
        }
        return
      }

      try {
        const { data: times, error: erroTimes } = await supabase
          .from('times')
          .select('id, nome, tag')
          .eq('id_capitao', usuario.id)

        if (erroTimes) throw erroTimes

        let timeCompleto = null

        for (const time of times || []) {
          const { count, error: erroContagem } = await supabase
            .from('times_integrantes')
            .select('id', { count: 'exact', head: true })
            .eq('id_time', time.id)

          if (erroContagem) throw erroContagem

          if (count === TAMANHO_LINEUP) {
            timeCompleto = time
            break
          }
        }

        if (!ativo) return
        setTimeCapitaneado(timeCompleto)

        if (timeCompleto) {
          // Busca todas as inscricoes do time, com o status do torneio de cada uma,
          // para saber se ja esta inscrito aqui ou preso em outro torneio em andamento
          const { data: inscricoesTime, error: erroInscricao } = await supabase
            .from('inscricoes')
            .select('id, id_torneio, torneio:id_torneio(id, nome, status)')
            .eq('id_time', timeCompleto.id)

          if (erroInscricao) throw erroInscricao
          if (!ativo) return

          const linhas = inscricoesTime || []
          const inscricaoAtual = linhas.find((linha) => String(linha.id_torneio) === String(id))
          const inscricaoAtiva = linhas.find((linha) => {
            return String(linha.id_torneio) !== String(id) && linha.torneio?.status === true
          })

          setJaInscrito(Boolean(inscricaoAtual))
          setTorneioConflito(inscricaoAtiva?.torneio || null)
        }
      } catch (err) {
        console.error('Erro ao verificar elegibilidade de inscrição:', err)
      } finally {
        if (ativo) setCarregandoInscricao(false)
      }
    }

    carregarElegibilidade()

    return () => {
      ativo = false
    }
  }, [usuario, id])

  // Busca os times ja inscritos neste torneio para exibir na fase de grupos
  async function carregarTimesGrupo() {
    setCarregandoGrupo(true)

    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('id, time:id_time(id, nome, tag)')
        .eq('id_torneio', id)
        .order('id', { ascending: true })

      if (error) throw error
      setTimesGrupo((data || []).map((linha) => linha.time).filter(Boolean))
    } catch (err) {
      console.error('Erro ao carregar times da fase de grupos:', err)
    } finally {
      setCarregandoGrupo(false)
    }
  }

  useEffect(() => {
    carregarTimesGrupo()
  }, [id])

  async function handleInscrever() {
    if (!usuario) {
      mostrarAlerta({
        titulo: 'Acesso Restrito',
        mensagem: 'Você precisa estar logado para inscrever seu time.',
        tipo: 'aviso',
        botaoTexto: 'Fazer Login',
        onConfirmar: () => navigate('/login')
      })
      return
    }

    if (!timeCapitaneado) {
      mostrarAlerta({
        titulo: 'Inscrição Indisponível',
        mensagem: 'Você precisa ser capitão de um time com 5 jogadores (capitão + 4 jogadores) para se inscrever.',
        tipo: 'aviso'
      })
      return
    }

    if (torneioConflito) {
      mostrarAlerta({
        titulo: 'Time Já Inscrito',
        mensagem: `Seu time já está inscrito no torneio "${torneioConflito.nome}". Aguarde ele terminar para se inscrever em outro.`,
        tipo: 'aviso'
      })
      return
    }

    setEnviandoInscricao(true)

    try {
      const taxaInscricao = Number(tournament.dinheiro) || 0

      // Confere o saldo atual do capitao direto no banco (localStorage pode estar desatualizado)
      const { data: usuarioAtual, error: erroSaldo } = await supabase
        .from('usuarios')
        .select('saldo')
        .eq('id', usuario.id)
        .maybeSingle()

      if (erroSaldo) throw erroSaldo

      const saldoAtual = Number(usuarioAtual?.saldo) || 0

      if (saldoAtual < taxaInscricao) {
        mostrarAlerta({
          titulo: 'Saldo Insuficiente',
          mensagem: `Você precisa de ${formatPrize(taxaInscricao)} na carteira para pagar a taxa de inscrição. Seu saldo atual é ${formatPrize(saldoAtual)}.`,
          tipo: 'aviso'
        })
        setEnviandoInscricao(false)
        return
      }

      // Debita a taxa da carteira do capitao; o premio acumulado e sempre recalculado (taxa x times inscritos)
      const { error: erroDebito } = await supabase
        .from('usuarios')
        .update({ saldo: saldoAtual - taxaInscricao })
        .eq('id', usuario.id)

      if (erroDebito) throw erroDebito

      const { error } = await supabase.from('inscricoes').insert({
        id_torneio: id,
        id_time: timeCapitaneado.id,
        id_usuario_inscritor: usuario.id,
      })

      if (error) {
        // Rollback do debito caso a inscricao falhe
        await supabase.from('usuarios').update({ saldo: saldoAtual }).eq('id', usuario.id)
        throw error
      }

      setJaInscrito(true)
      await carregarTimesGrupo()
      mostrarAlerta({
        titulo: 'Inscrição Confirmada',
        mensagem: `O time ${timeCapitaneado.nome} pagou a taxa de ${formatPrize(taxaInscricao)} e foi inscrito com sucesso neste torneio.`,
        tipo: 'sucesso'
      })
    } catch (err) {
      console.error('Erro ao inscrever time no torneio:', err)
      mostrarAlerta({
        titulo: 'Erro na Inscrição',
        mensagem: err.message || 'Não foi possível inscrever seu time. Tente novamente.',
        tipo: 'erro'
      })
    } finally {
      setEnviandoInscricao(false)
    }
  }

  // Distribui o premio acumulado entre os 5 integrantes do time vencedor e encerra o torneio
  async function handleDeclararVencedor(time) {
    setDeclarandoVencedorId(time.id)

    try {
      const { data: integrantes, error: erroIntegrantes } = await supabase
        .from('times_integrantes')
        .select('id_usuario')
        .eq('id_time', time.id)

      if (erroIntegrantes) throw erroIntegrantes
      if (!integrantes || integrantes.length === 0) {
        throw new Error('Não foi possível encontrar os integrantes deste time.')
      }

      const premioTotal = (Number(tournament.dinheiro) || 0) * timesGrupo.length
      const premioPorJogador = premioTotal / integrantes.length

      for (const integrante of integrantes) {
        const { data: jogadorAtual, error: erroBusca } = await supabase
          .from('usuarios')
          .select('saldo')
          .eq('id', integrante.id_usuario)
          .maybeSingle()

        if (erroBusca) throw erroBusca

        const novoSaldo = (Number(jogadorAtual?.saldo) || 0) + premioPorJogador
        const { error: erroCredito } = await supabase
          .from('usuarios')
          .update({ saldo: novoSaldo })
          .eq('id', integrante.id_usuario)

        if (erroCredito) throw erroCredito
      }

      const { error: erroTorneio } = await supabase
        .from('torneios')
        .update({ status: false, id_time_vencedor: time.id })
        .eq('id', id)

      if (erroTorneio) throw erroTorneio

      setTournament((atual) => ({ ...atual, status: false, id_time_vencedor: time.id }))
      mostrarAlerta({
        titulo: 'Torneio Encerrado',
        mensagem: `O time ${time.nome} foi declarado campeão e ${formatPrize(premioTotal)} foram divididos entre os ${integrantes.length} integrantes.`,
        tipo: 'sucesso'
      })
    } catch (err) {
      console.error('Erro ao declarar vencedor do torneio:', err)
      mostrarAlerta({
        titulo: 'Erro ao Declarar Vencedor',
        mensagem: err.message || 'Não foi possível declarar o vencedor. Tente novamente.',
        tipo: 'erro'
      })
    } finally {
      setDeclarandoVencedorId(null)
    }
  }

  if (loading) return <main className="tournament-page-state"><p>Carregando detalhes...</p></main>
  if (erro) return <main className="tournament-page-state error"><p>{erro}</p><Link to="/torneios">Voltar para torneios</Link></main>
  if (!tournament) return <main className="tournament-page-state"><h1>Torneio não encontrado</h1><Link to="/torneios">Voltar para torneios</Link></main>

  const info = tournamentStatus(tournament.status)
  const inscricoesAbertas = tournament.status === true

  let textoBotao = 'Inscrever-se'
  if (jaInscrito) textoBotao = 'Time Inscrito'
  else if (enviandoInscricao) textoBotao = 'Inscrevendo...'

  const botaoDesabilitado = !inscricoesAbertas || jaInscrito || enviandoInscricao || carregandoInscricao || (usuario && !timeCapitaneado) || Boolean(torneioConflito)
  const podeDeclararVencedor = inscricoesAbertas && usuario && (usuario.id === tournament.id_criador || usuario.admin)
  const premioAcumulado = (Number(tournament.dinheiro) || 0) * timesGrupo.length

  return (
    <main className="tournament-details fundo-aurora-motion">
      <AuroraBackground />
      <Link className="back-link" to="/torneios">&lt;- Voltar para torneios</Link>
      <div className="details-hero">
        <div className="tournament-card-visual" aria-hidden="true">
          <span>ROXO</span>
          <strong>CS2</strong>
        </div>
        <div>
          <span className={info.classe}>{info.label}</span>
          <h1>{tournament.nome}</h1>
          <p>{formatDate(tournament.data_inicio)}</p>
        </div>
      </div>
      <div className="details-grid">
        <div><small>TAXA DE INSCRIÇÃO (POR TIME)</small><strong>{formatPrize(tournament.dinheiro)}</strong></div>
        <div><small>PRÊMIO ACUMULADO</small><strong>{formatPrize(premioAcumulado)}</strong></div>
        <div><small>FORMATO</small><strong>{tournament.formato || 'Não informado'}</strong></div>
      </div>
      {tournament.id_time_vencedor && (
        <section className="details-rules details-campeao">
          <h2>Campeão</h2>
          <p>{timesGrupo.find((time) => time.id === tournament.id_time_vencedor)?.nome || `Time #${tournament.id_time_vencedor}`} venceu este torneio e o prêmio já foi dividido entre os integrantes.</p>
        </section>
      )}
      <section className="details-rules details-inscricao">
        <button
          type="button"
          className="tournaments-criar-btn"
          onClick={handleInscrever}
          disabled={botaoDesabilitado}
        >
          {textoBotao}
        </button>
        {!inscricoesAbertas && <p>As inscrições para este torneio estão encerradas.</p>}
        {inscricoesAbertas && usuario && !carregandoInscricao && !timeCapitaneado && (
          <p>Você precisa ser capitão de um time com 5 jogadores (capitão + 4 jogadores) para se inscrever.</p>
        )}
        {inscricoesAbertas && !carregandoInscricao && timeCapitaneado && torneioConflito && (
          <p>Seu time já está inscrito no torneio "{torneioConflito.nome}". Aguarde ele terminar para se inscrever em outro.</p>
        )}
        {inscricoesAbertas && !usuario && <p>Faça login e seja capitão de um time completo para se inscrever.</p>}
      </section>
      <section className="details-rules">
        <h2>Descrição do torneio</h2>
        <p>{tournament.descricao || 'Nenhuma descrição informada.'}</p>
      </section>
      <section className="details-rules">
        <h2>Fase de Grupos</h2>
        {carregandoGrupo && <p>Carregando times inscritos...</p>}
        {!carregandoGrupo && timesGrupo.length === 0 && (
          <p>Nenhum time inscrito ainda. Assim que um time se inscrever, ele aparece aqui.</p>
        )}
        {!carregandoGrupo && timesGrupo.length > 0 && (
          <div className="details-grupo">
            <h3>Grupo A</h3>
            <ol className="details-grupo-lista">
              {timesGrupo.map((time) => (
                <li key={time.id}>
                  <span className="details-grupo-tag">{time.tag || 'TAG'}</span>
                  <span>{time.nome}</span>
                  {podeDeclararVencedor && (
                    <button
                      type="button"
                      className="details-grupo-declarar-btn"
                      onClick={() => handleDeclararVencedor(time)}
                      disabled={declarandoVencedorId !== null}
                    >
                      {declarandoVencedorId === time.id ? 'Processando...' : 'Declarar Vencedor'}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </main>
  )
}
