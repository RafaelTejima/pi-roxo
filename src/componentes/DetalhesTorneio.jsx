import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/torneios.css'
import '../css/bracket.css'
import AuroraBackground from './AuroraBackground'
import { useAlerta } from './AlertaModal'
import TournamentBracket from './TournamentBracket'
import { gerarBracket, TAMANHOS_VALIDOS_BRACKET } from '../utils/bracketGenerator'
import { calcularRetencao } from '../utils/financeiro'

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

function tournamentStatus(status, idTimeVencedor) {
  if (idTimeVencedor) {
    return { label: 'ENCERRADO', classe: 'tournament-status tournament-status--finished' }
  }
  const isStatusFechado = status === false || status === 'false' || status === 0 || status === '0'
  if (isStatusFechado) {
    return { label: 'EM ANDAMENTO', classe: 'tournament-status tournament-status--live' }
  }
  if (status === true || status === 'true' || status === 1 || status === '1') {
    return { label: 'INSCRIÇÕES ABERTAS', classe: 'tournament-status tournament-status--open' }
  }
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
  
  // Controle do botao de gerar bracket
  const [gerando, setGerando] = useState(false)

  // Painel de teste (admin): adicionar time manualmente
  const [buscaTimeAdmin, setBuscaTimeAdmin] = useState('')
  const [resultadosAdmin, setResultadosAdmin] = useState([])
  const [buscandoAdmin, setBuscandoAdmin] = useState(false)
  const [adicionandoAdmin, setAdicionandoAdmin] = useState(null)

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

        if (data) {
          const { data: criador } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', data.id_criador)
            .maybeSingle()
          
          data.organizadorNome = criador?.nome || 'Desconhecido'
        }

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
  const carregarTimesGrupo = useCallback(async () => {
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
  }, [id])

  useEffect(() => {
    carregarTimesGrupo()
  }, [carregarTimesGrupo])

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
      window.dispatchEvent(new Event('saldoAtualizado'))
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

  // Distribui o premio liquido entre os integrantes do time vencedor, retem taxa da plataforma e registra transacao
  async function handleDeclararVencedor(time) {
    if (!time) return

    const timeId = typeof time === 'object' ? time.id : time
    const timeNome = typeof time === 'object' && time.nome
      ? time.nome
      : (timesGrupo.find((t) => t.id === timeId)?.nome || `Time #${timeId}`)

    if (tournament?.id_time_vencedor) {
      mostrarAlerta({
        titulo: 'Torneio Já Finalizado',
        mensagem: 'Este torneio já possui um vencedor declarado.',
        tipo: 'aviso'
      })
      return
    }

    setDeclarandoVencedorId(timeId)

    try {
      const { data: integrantes, error: erroIntegrantes } = await supabase
        .from('times_integrantes')
        .select('id_usuario')
        .eq('id_time', timeId)

      if (erroIntegrantes) throw erroIntegrantes
      if (!integrantes || integrantes.length === 0) {
        throw new Error('Não foi possível encontrar os integrantes deste time vencedor.')
      }

      // 1. Cálculo financeiro da premiação e retenção da plataforma (Tiers)
      const totalTimes = timesGrupo.length > 0 ? timesGrupo.length : 1
      const valorBruto = (Number(tournament.dinheiro) || 0) * totalTimes
      const retencao = calcularRetencao(valorBruto)
      const taxaRetida = retencao ? retencao.taxaPlataforma : 0
      const valorLiquido = retencao ? retencao.premioLiquido : valorBruto
      const premioPorJogador = integrantes.length > 0 ? valorLiquido / integrantes.length : 0

      console.log('[Financeiro] Finalizando torneio:', {
        idTorneio: id,
        timeVencedor: timeNome,
        totalTimes,
        valorBruto,
        taxaRetida,
        valorLiquido,
        premioPorJogador,
        numIntegrantes: integrantes.length
      })

      // 2. Credita a premiação líquida aos integrantes da equipe campeã
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

      // 3. Atualiza o status do torneio para encerrado e define o campeão
      const { error: erroTorneio } = await supabase
        .from('torneios')
        .update({ status: false, id_time_vencedor: timeId })
        .eq('id', id)

      if (erroTorneio) throw erroTorneio

      // 4. Registro da transação na tabela transacoes_plataforma e repasse da taxa ao Admin
      try {
        const transacaoPayload = {
          id_torneio: Number(id),
          valor_bruto: valorBruto,
          taxa_retida: taxaRetida,
          valor_liquido: valorLiquido,
          status: 'PROCESSADO'
        }

        console.log('[Financeiro] Inserindo registro em transacoes_plataforma:', transacaoPayload)

        const { data: transacaoCriada, error: erroTransacao } = await supabase
          .from('transacoes_plataforma')
          .insert(transacaoPayload)
          .select()

        if (erroTransacao) {
          console.error('[Financeiro] Falha ao inserir em transacoes_plataforma:', erroTransacao)
          throw erroTransacao
        } else {
          console.log('[Financeiro] Movimentação registrada em transacoes_plataforma com sucesso:', transacaoCriada)
        }

        // Soma a taxa_retida ao saldo do usuário Administrador
        if (taxaRetida > 0) {
          const { data: adminPrincipal, error: erroBuscaAdmin } = await supabase
            .from('usuarios')
            .select('id, saldo, nome, email')
            .eq('admin', true)
            .order('id', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (erroBuscaAdmin) {
            console.error('[Financeiro] Erro ao buscar usuário administrador para retenção:', erroBuscaAdmin)
          } else if (adminPrincipal?.id) {
            const saldoAdminAtual = Number(adminPrincipal.saldo) || 0
            const novoSaldoAdmin = saldoAdminAtual + taxaRetida

            const { error: erroUpdateAdmin } = await supabase
              .from('usuarios')
              .update({ saldo: novoSaldoAdmin })
              .eq('id', adminPrincipal.id)

            if (erroUpdateAdmin) {
              console.error('[Financeiro] Erro ao creditar taxa retida no saldo do admin:', erroUpdateAdmin)
            } else {
              console.log(`[Financeiro] Taxa de R$ ${taxaRetida.toFixed(2)} somada ao saldo do Administrador #${adminPrincipal.id} (${adminPrincipal.nome || adminPrincipal.email})`)

              // Atualiza o saldo no localStorage se o usuário logado for este administrador
              const salvo = localStorage.getItem('usuarioLogado')
              if (salvo) {
                try {
                  const usuarioSalvo = JSON.parse(salvo)
                  if (usuarioSalvo.id === adminPrincipal.id) {
                    usuarioSalvo.saldo = novoSaldoAdmin
                    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioSalvo))
                  }
                } catch (e) {
                  console.warn('Erro ao atualizar usuarioLogado em localStorage:', e)
                }
              }
            }
          }
        }
      } catch (errFinanceiro) {
        console.error('[Financeiro] Erro na movimentação financeira da plataforma:', {
          message: errFinanceiro?.message,
          code: errFinanceiro?.code,
          details: errFinanceiro?.details,
          hint: errFinanceiro?.hint
        })
      }

      setTournament((atual) => ({ ...atual, status: false, id_time_vencedor: timeId }))
      window.dispatchEvent(new Event('saldoAtualizado'))
      window.dispatchEvent(new Event('transacoesAtualizadas'))
      window.dispatchEvent(new Event('torneiosAtualizados'))

      mostrarAlerta({
        titulo: 'Torneio Encerrado',
        mensagem: `O time ${timeNome} foi declarado campeão! Prêmio líquido de ${formatPrize(valorLiquido)} dividido entre os ${integrantes.length} integrantes (Taxa retida pela plataforma: ${formatPrize(taxaRetida)}).`,
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

  // Busca times para o painel admin (reativo imediatamente na primeira letra)
  async function handleBuscaAdmin(termo) {
    setBuscaTimeAdmin(termo)
    if (!termo.trim()) { setResultadosAdmin([]); return }
    setBuscandoAdmin(true)
    try {
      const { data } = await supabase
        .from('times')
        .select('id, nome, tag')
        .or(`nome.ilike.%${termo.trim()}%,tag.ilike.%${termo.trim()}%`)
        .limit(8)
      const idsJaInscritos = new Set(timesGrupo.map((t) => t.id))
      setResultadosAdmin((data || []).filter((t) => !idsJaInscritos.has(t.id)))
    } catch (err) {
      console.error(err)
    } finally {
      setBuscandoAdmin(false)
    }
  }

  async function handleAdicionarTimeAdmin(time) {
    setAdicionandoAdmin(time.id)
    try {
      const { error } = await supabase.from('inscricoes').insert({
        id_torneio: id,
        id_time: time.id,
        id_usuario_inscritor: usuario.id,
      })
      if (error) throw error
      await carregarTimesGrupo()
      setResultadosAdmin((prev) => prev.filter((t) => t.id !== time.id))
      mostrarAlerta({ titulo: 'Time Adicionado', mensagem: `${time.nome} foi inscrito no torneio (modo teste).`, tipo: 'sucesso' })
    } catch (err) {
      mostrarAlerta({ titulo: 'Erro', mensagem: err.message, tipo: 'erro' })
    } finally {
      setAdicionandoAdmin(null)
    }
  }

  async function handleGerarChaveamento() {
    const totalTimes = timesGrupo?.length || 0
    if (!TAMANHOS_VALIDOS_BRACKET.includes(totalTimes)) {
      mostrarAlerta({
        titulo: 'Ação Bloqueada',
        mensagem: 'Para gerar o bracket, o torneio deve possuir um número exato de equipes: 4, 8, 16 ou 32.',
        tipo: 'aviso'
      })
      return
    }

    setGerando(true)
    try {
      await gerarBracket(id, timesGrupo)
      
      // Fecha inscrições automaticamente ao iniciar o torneio
      const { error } = await supabase
        .from('torneios')
        .update({ status: false })
        .eq('id', id)
        
      if (!error) {
        setTournament((atual) => ({ ...atual, status: false }))
      }

      mostrarAlerta({
        titulo: 'Sucesso',
        mensagem: 'Chaveamento gerado com sucesso! As inscrições foram encerradas e o torneio começou.',
        tipo: 'sucesso'
      })
    } catch (err) {
      console.error(err)
      mostrarAlerta({
        titulo: 'Erro',
        mensagem: 'Falha ao gerar chaveamento: ' + (err.message || JSON.stringify(err)),
        tipo: 'erro'
      })
    } finally {
      setGerando(false)
    }
  }

  if (loading) return <main className="tournament-page-state"><p>Carregando detalhes...</p></main>
  if (erro) return <main className="tournament-page-state error"><p>{erro}</p><Link to="/torneios">Voltar para torneios</Link></main>
  if (!tournament) return <main className="tournament-page-state"><h1>Torneio não encontrado</h1><Link to="/torneios">Voltar para torneios</Link></main>

  const info = tournamentStatus(tournament.status, tournament.id_time_vencedor)
  const inscricoesAbertas = tournament.status === true

  let textoBotao = 'Inscrever-se'
  if (jaInscrito) textoBotao = 'Time Inscrito'
  else if (enviandoInscricao) textoBotao = 'Inscrevendo...'

  const botaoDesabilitado = !inscricoesAbertas || jaInscrito || enviandoInscricao || carregandoInscricao || (usuario && !timeCapitaneado) || Boolean(torneioConflito)
  const podeEditar = usuario && (usuario.id === tournament.id_criador || usuario.admin)
  const premioAcumulado = (Number(tournament.dinheiro) || 0) * timesGrupo.length

  return (
    <main className="tournament-details fundo-aurora-motion">
      <AuroraBackground />
      <Link className="back-link" to="/torneios">&lt;- Voltar para torneios</Link>
      <div className="details-hero">
        <div className="tournament-card-visual details-cs2-logo">
          <img
            src="https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react/cs2/logo_cs2_header.svg"
            alt="Counter-Strike 2"
            loading="lazy"
          />
        </div>
        <div>
          <span className={info.classe}>{info.label}</span>
          <h1>{tournament.nome}</h1>
          <p>{formatDate(tournament.data_inicio)}</p>
        </div>
      </div>
      
      <div className="details-grid">
        <div><small>ORGANIZADOR</small><strong>{tournament.organizadorNome || 'Não informado'}</strong></div>
        <div><small>TAXA DE INSCRIÇÃO (POR TIME)</small><strong>{formatPrize(tournament.dinheiro)}</strong></div>
        <div><small>PRÊMIO ACUMULADO</small><strong>{formatPrize(premioAcumulado)}</strong></div>
        <div><small>FORMATO</small><strong>{tournament.formato || 'Não informado'}</strong></div>
      </div>
      {tournament.id_time_vencedor && (
        <section className="bracket-celebracao-vencedor details-campeao-hero">
          <div className="bracket-celebracao-aura" />
          <div className="bracket-celebracao-header-badge">
            <span className="bracket-celebracao-ping" />
            CAMPEONATO CONCLUÍDO // VENCEDOR OFICIAL
          </div>
          <div className="bracket-celebracao-corpo">
            <div className="bracket-celebracao-trofeu-box">
              <span className="bracket-celebracao-trofeu">🏆</span>
            </div>
            <div className="bracket-celebracao-titulos">
              <h2 className="bracket-celebracao-texto-principal">
                🏆 VENCEDOR: <span className="bracket-celebracao-nome-time">{timesGrupo.find((time) => time.id === tournament.id_time_vencedor)?.nome || `Time #${tournament.id_time_vencedor}`}</span>!
              </h2>
              {timesGrupo.find((time) => time.id === tournament.id_time_vencedor)?.tag && (
                <span className="bracket-celebracao-tag">[{timesGrupo.find((time) => time.id === tournament.id_time_vencedor)?.tag}]</span>
              )}
              <p className="bracket-celebracao-descricao">
                {timesGrupo.find((time) => time.id === tournament.id_time_vencedor)?.nome || `Time #${tournament.id_time_vencedor}`} conquistou a glória máxima! O prêmio de {formatPrize(premioAcumulado)} foi creditado aos integrantes da line-up.
              </p>
            </div>
          </div>
        </section>
      )}

    <br/>

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
      
      <br/>
      
      <section className="details-rules">
        <h2>Descrição do torneio</h2>
        <p>{tournament.descricao || 'Nenhuma descrição informada.'}</p>
      </section>

      <br/>
      
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
                  {podeEditar && !tournament.id_time_vencedor && (
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

    <br/>

      <section className="details-rules">
        <h2>Chaveamento (Bracket)</h2>
        {podeEditar && inscricoesAbertas && (
          <div style={{ marginBottom: '15px' }}>
            <button 
              className="tournaments-criar-btn" 
              onClick={handleGerarChaveamento} 
              disabled={gerando || carregandoGrupo}
            >
              {gerando ? 'Gerando Chaves...' : `Gerar Chaveamento (Iniciar Torneio)${timesGrupo.length > 0 ? ` — ${timesGrupo.length} times` : ''}`}
            </button>
            {timesGrupo.length > 0 && !TAMANHOS_VALIDOS_BRACKET.includes(timesGrupo.length) && (
              <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '6px' }}>
                ⚠️ O chaveamento exige exatamente 4, 8, 16 ou 32 equipes inscritas (atual: {timesGrupo.length}).
              </p>
            )}
          </div>
        )}
        <TournamentBracket 
          torneioId={id} 
          podeEditar={podeEditar} 
          onDeclararVencedorTorneio={handleDeclararVencedor} 
          timeCampeao={timesGrupo.find((time) => time.id === tournament.id_time_vencedor) || (tournament.id_time_vencedor ? { id: tournament.id_time_vencedor, nome: `Time #${tournament.id_time_vencedor}` } : null)}
        />
      </section>

   <br/>

      {/* Painel exclusivo para administradores — apenas para testes */}
      {usuario?.admin && (
        <section className="details-rules details-admin-teste">
          <h2>🛠️ Ferramentas de Teste (Admin)</h2>
          <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '14px' }}>
            Esta seção é visível apenas para administradores e permite adicionar times diretamente ao torneio sem validações.
          </p>
          <div className="admin-busca-time-wrap">
            <input
              type="text"
              className="tournaments-busca-input"
              placeholder="Buscar time por nome ou TAG..."
              value={buscaTimeAdmin}
              onChange={(e) => handleBuscaAdmin(e.target.value)}
              style={{ marginBottom: '10px', width: '100%' }}
            />
            {buscandoAdmin && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Buscando...</p>}
            {!buscandoAdmin && resultadosAdmin.length > 0 && (
              <ul className="admin-busca-resultados">
                {resultadosAdmin.map((time) => (
                  <li key={time.id} className="admin-busca-item">
                    <span className="details-grupo-tag">{time.tag || 'TAG'}</span>
                    <span>{time.nome}</span>
                    <button
                      type="button"
                      className="tournaments-criar-btn"
                      style={{ padding: '5px 14px', fontSize: '0.82rem' }}
                      disabled={adicionandoAdmin === time.id}
                      onClick={() => handleAdicionarTimeAdmin(time)}
                    >
                      {adicionandoAdmin === time.id ? 'Adicionando...' : '+ Adicionar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!buscandoAdmin && buscaTimeAdmin.trim().length >= 2 && resultadosAdmin.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Nenhum time encontrado (ou todos já estão inscritos).</p>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
