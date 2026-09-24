import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/criar-equipe.css'

const equipeInicial = { nome: '', sigla: '', descricao: '', torneioId: '' }

async function carregarTorneiosAbertos() {
  return supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'open')
    .order('tournament_date', { ascending: true })
}

export default function CriarEquipe() {
  const navigate = useNavigate()
  const [usuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem('usuarioLogado')
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null
  })
  const [equipe, setEquipe] = useState(equipeInicial)
  const [torneios, setTorneios] = useState([])
  const [jogadores, setJogadores] = useState([])
  const [buscaJogador, setBuscaJogador] = useState('')
  const [resultados, setResultados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }

    carregarTorneiosAbertos().then(({ data, error }) => {
      if (error) setErro('Não foi possível carregar os torneios disponíveis.')
      setTorneios(data || [])
      setCarregando(false)
    })
  }, [navigate, usuario])

  async function pesquisarJogador() {
    const termo = buscaJogador.trim()
    if (!termo) return

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .or(`nome.ilike.%${termo}%,email.ilike.%${termo}%`)
      .limit(5)

    if (error) {
      setErro('Não foi possível buscar esse jogador.')
      return
    }

    setResultados((data || []).filter((jogador) => jogador.id !== usuario?.id))
  }

  function atualizarCampo(event) {
    setEquipe((atual) => ({ ...atual, [event.target.name]: event.target.value }))
    setErro('')
  }

  function adicionarJogador(jogador) {
    if (!jogadores.some((item) => item.id === jogador.id)) setJogadores((atuais) => [...atuais, jogador])
    setResultados([])
    setBuscaJogador('')
  }

  function removerJogador(id) {
    setJogadores((atuais) => atuais.filter((jogador) => jogador.id !== id))
  }

  async function enviarEquipe(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')

    if (!equipe.nome.trim() || equipe.sigla.trim().length < 2 || !equipe.torneioId) {
      setErro('Preencha o nome, a sigla e o torneio da equipe.')
      return
    }

    const torneio = torneios.find((item) => String(item.id) === equipe.torneioId)
    const minimo = Number(torneio?.min_teams_members || torneio?.min_players || 1)
    if (jogadores.length + 1 < minimo) {
      setErro(`Este torneio exige pelo menos ${minimo} jogadores na equipe.`)
      return
    }

    setEnviando(true)
    const { data: novaEquipe, error: erroEquipe } = await supabase
      .from('teams')
      .insert({ name: equipe.nome.trim(), tag: equipe.sigla.trim().toUpperCase(), description: equipe.descricao.trim(), captain_id: usuario.id, avatar_url: 'https://placehold.co/96x96/723EC3/FFFFFF?text=TEAM' })
      .select()
      .single()

    if (erroEquipe) {
      setErro('Não foi possível criar a equipe. Verifique os dados e tente novamente.')
      setEnviando(false)
      return
    }

    const membros = [{ team_id: novaEquipe.id, user_id: usuario.id, role: 'captain' }, ...jogadores.map((jogador) => ({ team_id: novaEquipe.id, user_id: jogador.id, role: 'player' }))]
    const { error: erroMembros } = await supabase.from('team_members').insert(membros)
    const { error: erroInscricao } = await supabase.from('tournament_teams').insert({ tournament_id: equipe.torneioId, team_id: novaEquipe.id, status: 'confirmed' })

    setEnviando(false)
    if (erroMembros || erroInscricao) {
      setErro('A equipe foi criada, mas não foi possível concluir a inscrição no torneio.')
      return
    }

    setSucesso('Equipe criada e inscrita no torneio com sucesso.')
    setTimeout(() => navigate('/torneios'), 1200)
  }

  if (!usuario) return null

  return (
    <main id="pagina-criar-equipe">
      <section className="criar-equipe-heading">
        <p className="criar-equipe-overline">NOVA EQUIPE</p>
        <h1>Monte sua <span>line-up.</span></h1>
        <p>Crie sua equipe, convide seus jogadores e entre na disputa.</p>
      </section>

      <form className="criar-equipe-form" onSubmit={enviarEquipe}>
        <div className="criar-equipe-secao">
          <div className="criar-equipe-secao-titulo"><span>01</span><div><h2>Identidade da equipe</h2><p>Como sua equipe será apresentada.</p></div></div>
          <div className="criar-equipe-campos">
            <label>Nome da equipe<input name="nome" value={equipe.nome} onChange={atualizarCampo} placeholder="Ex.: Vortex Gaming" required /></label>
            <label>Sigla<input name="sigla" maxLength="5" value={equipe.sigla} onChange={atualizarCampo} placeholder="Ex.: VTX" required /></label>
          </div>
          <label>Descrição <span className="campo-opcional">Opcional</span><textarea name="descricao" value={equipe.descricao} onChange={atualizarCampo} placeholder="Conte um pouco sobre sua equipe..." /></label>
        </div>

        <div className="criar-equipe-secao">
          <div className="criar-equipe-secao-titulo"><span>02</span><div><h2>Escolha o torneio</h2><p>Selecione onde sua equipe vai competir.</p></div></div>
          {carregando ? <p className="criar-equipe-aviso">Carregando torneios...</p> : <select name="torneioId" value={equipe.torneioId} onChange={atualizarCampo} required><option value="">Selecione um torneio aberto</option>{torneios.map((torneio) => <option key={torneio.id} value={torneio.id}>{torneio.name} | R$ {Number(torneio.prize || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>)}</select>}
        </div>

        <div className="criar-equipe-secao">
          <div className="criar-equipe-secao-titulo"><span>03</span><div><h2>Jogadores</h2><p>Você entra automaticamente como capitão.</p></div></div>
          <div className="jogador-capitao"><strong>{usuario.nome || usuario.email}</strong><span>CAPITÃO</span></div>
          <div className="buscar-jogador"><input value={buscaJogador} onChange={(event) => setBuscaJogador(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), pesquisarJogador())} placeholder="Buscar por nome ou e-mail" /><button type="button" onClick={pesquisarJogador}>Buscar</button></div>
          {resultados.length > 0 && <div className="resultados-jogadores">{resultados.map((jogador) => <button type="button" key={jogador.id} onClick={() => adicionarJogador(jogador)}><strong>{jogador.nome}</strong><span>{jogador.email}</span></button>)}</div>}
          <div className="lista-jogadores">{jogadores.map((jogador) => <div className="jogador-item" key={jogador.id}><span>{jogador.nome} <small>{jogador.email}</small></span><button type="button" onClick={() => removerJogador(jogador.id)}>Remover</button></div>)}{jogadores.length === 0 && <p className="criar-equipe-aviso">Adicione os jogadores que participarão com você.</p>}</div>
        </div>

        {erro && <p className="criar-equipe-mensagem erro">{erro}</p>}
        {sucesso && <p className="criar-equipe-mensagem sucesso">{sucesso}</p>}
        <div className="criar-equipe-acoes"><Link to="/torneios" className="criar-equipe-cancelar">Cancelar</Link><button className="criar-equipe-enviar" type="submit" disabled={enviando}>{enviando ? 'Criando equipe...' : 'Criar e inscrever equipe'}</button></div>
      </form>
    </main>
  )
}
