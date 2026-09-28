import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/criar-equipe.css'

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

  // Busca de jogadores reais na tabela 'usuarios' conforme digita
  useEffect(() => {
    const termo = buscaJogador.trim().toLowerCase()
    if (!termo) {
      setResultados([])
      setDropdownAberto(false)
      return
    }

    let ativo = true

    supabase
      .from('usuarios')
      .select('id, nome, nome_usuario, email')
      .or(`nome.ilike.%${termo}%,nome_usuario.ilike.%${termo}%,email.ilike.%${termo}%`)
      .limit(5)
      .then(({ data, error }) => {
        if (!ativo || error || !data) return
        const filtrados = data
          .filter((j) => j.id !== usuario?.id && !jogadores.some((item) => item.id === j.id))
          .map((j) => ({ id: j.id, nome: j.nome_usuario || j.nome, email: j.email }))
        setResultados(filtrados)
        setDropdownAberto(true)
      })
      .catch(() => {})

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
      if (resultados.length > 0) {
        adicionarJogador(resultados[0])
      } else {
        setErro('Nenhum jogador cadastrado foi encontrado com esse nome ou e-mail.')
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

    try {
      const { data: novoTime, error: erroTime } = await supabase
        .from('times')
        .insert({
          nome: equipe.nome.trim(),
          tag: equipe.sigla.trim().toUpperCase(),
          logo: 'https://placehold.co/96x96/723EC3/FFFFFF?text=TEAM',
          descricao: equipe.descricao.trim() || null,
          id_capitao: usuario.id
        })
        .select()
        .single()

      if (erroTime) throw erroTime

      const integrantes = [
        { id_time: novoTime.id, id_usuario: usuario.id, funcao: 'capitao' },
        ...jogadores.map((j) => ({ id_time: novoTime.id, id_usuario: j.id, funcao: 'jogador' }))
      ]
      const { error: erroIntegrantes } = await supabase.from('times_integrantes').insert(integrantes)
      if (erroIntegrantes) throw erroIntegrantes

      setSucesso('Equipe criada com sucesso!')
      setTimeout(() => navigate('/equipes'), 1200)
    } catch (err) {
      console.error('Erro ao criar equipe:', err)
      setErro('Não foi possível criar a equipe. Tente novamente.')
    } finally {
      setEnviando(false)
    }
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
