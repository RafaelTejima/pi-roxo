import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/criar-equipe.css'

const MOCK_JOGADORES = [
  { id: 'usr-admin', nome: 'admin', email: 'admin@csgo.com' },
  { id: 'usr-fallen', nome: 'FalleN', email: 'fallen@imperial.gg' },
  { id: 'usr-coldzera', nome: 'coldzera', email: 'coldzera@redcanids.com.br' },
  { id: 'usr-s1mple', nome: 's1mple', email: 's1mple@navi.gg' },
  { id: 'usr-zywoo', nome: 'ZywOo', email: 'zywoo@vitality.gg' },
  { id: 'usr-fer', nome: 'fer', email: 'fer@csgo.com' },
  { id: 'usr-taco', nome: 'TACO', email: 'taco@csgo.com' },
  { id: 'usr-kscerato', nome: 'KSCERATO', email: 'kscerato@furia.gg' },
  { id: 'usr-yuurih', nome: 'yuurih', email: 'yuurih@furia.gg' },
  { id: 'usr-chelo', nome: 'chelo', email: 'chelo@furia.gg' },
  { id: 'usr-art', nome: 'arT', email: 'art@fluxo.gg' }
]

const equipeInicial = { nome: '', sigla: '', descricao: '' }

export default function CriarEquipe() {
  const navigate = useNavigate()
  const [usuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem('usuarioLogado')
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null
  })

  const [equipe, setEquipe] = useState(equipeInicial)
  const [jogadores, setJogadores] = useState([])
  const [buscaJogador, setBuscaJogador] = useState('')
  const [resultados, setResultados] = useState([])
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
    }
  }, [navigate, usuario])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const fecharAoClicarFora = (e) => {
      if (!e.target.closest('.buscar-jogador-wrap')) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('click', fecharAoClicarFora)
    return () => document.removeEventListener('click', fecharAoClicarFora)
  }, [])

  // Filtro dinâmico em tempo real conforme digita
  useEffect(() => {
    const termo = buscaJogador.trim().toLowerCase()
    if (!termo) {
      setResultados([])
      setDropdownAberto(false)
      return
    }

    let ativo = true

    // Filtrar nos mocks locais instantaneamente
    const locais = MOCK_JOGADORES.filter(
      (j) =>
        (j.nome.toLowerCase().includes(termo) || j.email.toLowerCase().includes(termo)) &&
        j.id !== usuario?.id &&
        !jogadores.some((item) => item.id === j.id)
    )

    setResultados(locais)
    setDropdownAberto(true)

    // Buscar no Supabase se houver conexão
    if (supabase) {
      supabase
        .from('usuarios')
        .select('id, nome, email')
        .or(`nome.ilike.%${termo}%,email.ilike.%${termo}%`)
        .limit(5)
        .then(({ data, error }) => {
          if (ativo && !error && data) {
            const combinados = [...locais]
            data.forEach((jDb) => {
              if (
                jDb.id !== usuario?.id &&
                !jogadores.some((item) => item.id === jDb.id) &&
                !combinados.some((item) => item.id === jDb.id || item.email === jDb.email)
              ) {
                combinados.push(jDb)
              }
            })
            setResultados(combinados)
          }
        })
        .catch(() => {})
    }

    return () => {
      ativo = false
    }
  }, [buscaJogador, jogadores, usuario])

  function atualizarCampo(event) {
    setEquipe((atual) => ({ ...atual, [event.target.name]: event.target.value }))
    setErro('')
  }

  function adicionarJogador(jogador) {
    if (jogadores.length >= 4) {
      setErro('A line-up já atingiu o limite de 5 integrantes (1 capitão + 4 jogadores).')
      return
    }
    if (!jogadores.some((item) => item.id === jogador.id)) {
      setJogadores((atuais) => [...atuais, jogador])
    }
    setBuscaJogador('')
    setResultados([])
    setDropdownAberto(false)
    setErro('')
  }

  function removerJogador(id) {
    setJogadores((atuais) => atuais.filter((jogador) => jogador.id !== id))
    setErro('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const termo = buscaJogador.trim()
      if (!termo) return

      if (resultados.length > 0) {
        adicionarJogador(resultados[0])
      } else {
        const novoConvidado = {
          id: 'usr-' + Date.now(),
          nome: termo,
          email: `${termo.toLowerCase().replace(/\s+/g, '')}@jogador.com`
        }
        adicionarJogador(novoConvidado)
      }
    }
  }

  async function enviarEquipe(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')

    if (!equipe.nome.trim() || equipe.sigla.trim().length < 2) {
      setErro('Preencha o nome e a sigla (mínimo 2 caracteres) da equipe.')
      return
    }

    setEnviando(true)

    const novaEquipeObj = {
      id: 'team-' + Date.now(),
      nome: equipe.nome.trim(),
      tag: equipe.sigla.trim().toUpperCase(),
      descricao: equipe.descricao.trim(),
      capitao: usuario.nome || usuario.email,
      jogadoresCount: `${jogadores.length + 1}/5`,
      jogadores: [
        { id: usuario.id, nome: usuario.nome || usuario.email, role: 'captain' },
        ...jogadores.map((j) => ({ id: j.id, nome: j.nome, email: j.email, role: 'player' }))
      ],
      createdAt: new Date().toISOString()
    }

    // Salvar no localStorage para que a lista em /equipes exiba imediatamente
    try {
      const salvas = localStorage.getItem('equipesCadastradas')
      const lista = salvas ? JSON.parse(salvas) : []
      lista.unshift(novaEquipeObj)
      localStorage.setItem('equipesCadastradas', JSON.stringify(lista))
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err)
    }

    // Integração Supabase opcional
    try {
      const { data: novaEquipeDb, error: erroEquipe } = await supabase
        .from('teams')
        .insert({
          name: equipe.nome.trim(),
          tag: equipe.sigla.trim().toUpperCase(),
          description: equipe.descricao.trim(),
          captain_id: usuario.id,
          avatar_url: 'https://placehold.co/96x96/723EC3/FFFFFF?text=TEAM'
        })
        .select()
        .single()

      if (!erroEquipe && novaEquipeDb) {
        const membros = [
          { team_id: novaEquipeDb.id, user_id: usuario.id, role: 'captain' },
          ...jogadores.map((j) => ({ team_id: novaEquipeDb.id, user_id: j.id, role: 'player' }))
        ]
        await supabase.from('team_members').insert(membros)
      }
    } catch (err) {
      console.warn('Integração Supabase opcional:', err)
    }

    setEnviando(false)
    setSucesso('Equipe criada com sucesso!')
    setTimeout(() => navigate('/equipes'), 1200)
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
        {/* Seção 01: Identidade da Equipe */}
        <div className="criar-equipe-secao">
          <div className="criar-equipe-secao-titulo">
            <span>01</span>
            <div>
              <h2>Identidade da equipe</h2>
              <p>Como sua equipe será apresentada aos adversários.</p>
            </div>
          </div>
          <div className="criar-equipe-campos">
            <label>
              Nome da equipe
              <input
                name="nome"
                value={equipe.nome}
                onChange={atualizarCampo}
                placeholder="Ex.: Vortex Gaming"
                required
              />
            </label>
            <label>
              Sigla / TAG
              <input
                name="sigla"
                maxLength="5"
                value={equipe.sigla}
                onChange={atualizarCampo}
                placeholder="Ex.: VTX"
                required
              />
            </label>
          </div>
          <label>
            Descrição <span className="campo-opcional">Opcional</span>
            <textarea
              name="descricao"
              value={equipe.descricao}
              onChange={atualizarCampo}
              placeholder="Conte um pouco sobre a trajetória ou objetivos da sua equipe..."
            />
          </label>
        </div>

        {/* Seção 02: Jogadores e Line-up */}
        <div className="criar-equipe-secao">
          <div className="criar-equipe-secao-titulo">
            <span>02</span>
            <div>
              <h2>Jogadores &amp; Line-up</h2>
              <p>Você entra automaticamente como capitão ({jogadores.length + 1}/5 integrantes).</p>
            </div>
          </div>

          <div className="jogador-capitao">
            <strong>{usuario.nome || usuario.email}</strong>
            <span>CAPITÃO</span>
          </div>

          <div className="buscar-jogador-wrap">
            <div className="buscar-jogador">
              <input
                value={buscaJogador}
                onChange={(event) => setBuscaJogador(event.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => buscaJogador.trim() && setDropdownAberto(true)}
                placeholder="Buscar por nick ou e-mail do jogador (ex: admin)..."
                disabled={jogadores.length >= 4}
              />
            </div>

            {/* Lista suspensa Autocomplete em tempo real */}
            {dropdownAberto && buscaJogador.trim().length > 0 && (
              <div className="autocomplete-dropdown">
                {resultados.length > 0 ? (
                  resultados.map((j) => (
                    <div
                      key={j.id}
                      className="autocomplete-item"
                      onClick={() => adicionarJogador(j)}
                    >
                      <div className="autocomplete-item-info">
                        <span className="autocomplete-item-name">{j.nome}</span>
                        <span className="autocomplete-item-email">{j.email}</span>
                      </div>
                      <span className="autocomplete-add-btn">+ Adicionar</span>
                    </div>
                  ))
                ) : (
                  <div className="autocomplete-empty">Nenhum jogador encontrado</div>
                )}
              </div>
            )}
          </div>

          <div className="lista-jogadores">
            {jogadores.map((jogador) => (
              <div className="jogador-item" key={jogador.id}>
                <span>
                  <strong>{jogador.nome}</strong>
                  <small>{jogador.email}</small>
                </span>
                <button type="button" onClick={() => removerJogador(jogador.id)}>
                  Remover
                </button>
              </div>
            ))}
            {jogadores.length === 0 && (
              <p className="criar-equipe-aviso">
                Digite o nick ou e-mail no campo acima para adicionar até 4 jogadores à sua line-up.
              </p>
            )}
          </div>
        </div>

        {erro && <p className="criar-equipe-mensagem erro">{erro}</p>}
        {sucesso && <p className="criar-equipe-mensagem sucesso">{sucesso}</p>}

        <div className="criar-equipe-acoes">
          <Link to="/equipes" className="criar-equipe-cancelar">
            Cancelar
          </Link>
          <button className="criar-equipe-enviar" type="submit" disabled={enviando}>
            {enviando ? 'Criando equipe...' : 'Criar Equipe'}
          </button>
        </div>
      </form>
    </main>
  )
}
