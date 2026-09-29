import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { TIMES_PADRAO } from './Equipes'
import '../css/detalhes-time.css'

function formatarData(valor) {
  if (!valor) return 'Data não informada'
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(valor))
  } catch {
    return String(valor)
  }
}

export default function DetalhesTime() {
  const { id } = useParams()
  const [usuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem('usuarioLogado')
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null
  })

  const [time, setTime] = useState(null)
  const [integrantes, setIntegrantes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [edicaoAtiva, setEdicaoAtiva] = useState(false)
  const [formEdicao, setFormEdicao] = useState({ nome: '', sigla: '', descricao: '', logo: '' })
  const [salvando, setSalvando] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')

  const [gerenciandoJogadores, setGerenciandoJogadores] = useState(false)
  const [buscaJogador, setBuscaJogador] = useState('')
  const [resultados, setResultados] = useState([])
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [processandoId, setProcessandoId] = useState(null)
  const [erroJogadores, setErroJogadores] = useState('')

  useEffect(() => {
    async function carregarTime() {
      setCarregando(true)
      setErro('')

      if (!id) {
        setErro('Identificador de time não fornecido.')
        setCarregando(false)
        return
      }

      const idNormalizado = String(id).toLowerCase().trim()

      // 1. Procurar nas equipes salvas em localStorage
      try {
        const salvas = localStorage.getItem('equipesCadastradas')
        if (salvas) {
          const lista = JSON.parse(salvas)
          const encontrada = lista.find(
            (t) =>
              String(t.id).toLowerCase() === idNormalizado ||
              (t.tag && t.tag.toLowerCase() === idNormalizado)
          )
          if (encontrada) {
            setTime({
              id: encontrada.id,
              nome: encontrada.nome,
              tag: encontrada.tag,
              descricao: encontrada.descricao || '',
              logo:
                encontrada.logo ||
                `https://placehold.co/120x120/723EC3/FFFFFF?text=${encodeURIComponent(encontrada.tag || 'TEAM')}`,
              registro: encontrada.createdAt || encontrada.registro || new Date().toISOString(),
              id_capitao: encontrada.id_capitao || (encontrada.jogadores && encontrada.jogadores[0]?.id),
              capitao: encontrada.capitao || (encontrada.jogadores && encontrada.jogadores[0]?.nome)
            })

            const integrantesCompletos = (encontrada.jogadores || []).map((jogador) => ({
              id: jogador.id,
              idUsuario: jogador.id,
              funcao: jogador.funcao || (jogador.role === 'captain' ? 'capitao' : 'jogador'),
              nome: jogador.nome
            }))

            setIntegrantes(integrantesCompletos)
            setCarregando(false)
            return
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar equipe do localStorage:', err)
      }

      // 2. Procurar nos TIMES_PADRAO
      const timePadrao = TIMES_PADRAO.find(
        (t) =>
          String(t.id).toLowerCase() === idNormalizado ||
          t.tag.toLowerCase() === idNormalizado ||
          (idNormalizado === 't1' && t.id === 'furia') ||
          (idNormalizado === 't2' && t.id === 'mibr') ||
          (idNormalizado === 't3' && t.id === 'imperial') ||
          (idNormalizado === 't4' && t.id === 'pain')
      )

      if (timePadrao) {
        setTime(timePadrao)
        setIntegrantes(timePadrao.jogadores || [])
        setCarregando(false)
        return
      }

      // 3. Procurar no Supabase utilizando JOIN com times_integrantes
      try {
        if (supabase) {
          let timeEncontrado = null
          let carregouComJoin = false

          try {
            const { data: comJoin, error: erroJoin } = await supabase
              .from('times')
              .select(`
                *,
                times_integrantes (
                  id,
                  id_usuario,
                  funcao,
                  usuarios ( id, nome, nome_usuario, imagem )
                )
              `)
              .eq('id', id)
              .maybeSingle()

            if (!erroJoin && comJoin) {
              timeEncontrado = comJoin
              carregouComJoin = true
            }
          } catch (errJoin) {
            console.warn('Tentativa com join em times_integrantes falhou em DetalhesTime, usando fallback:', errJoin)
          }

          if (carregouComJoin && timeEncontrado) {
            const integrantesCompletos = (timeEncontrado.times_integrantes || []).map((linha) => {
              const u = Array.isArray(linha.usuarios) ? linha.usuarios[0] : linha.usuarios
              return {
                id: linha.id,
                idUsuario: linha.id_usuario,
                funcao: linha.funcao,
                nome: u?.nome_usuario || u?.nome || 'Jogador desconhecido'
              }
            })

            setTime(timeEncontrado)
            setIntegrantes(integrantesCompletos)
            setCarregando(false)
            return
          } else {
            // Fallback manual relacional com times_integrantes
            const { data: timeSimples, error: erroTime } = await supabase
              .from('times')
              .select('*')
              .eq('id', id)
              .maybeSingle()

            if (!erroTime && timeSimples) {
              const { data: linhas } = await supabase
                .from('times_integrantes')
                .select(`
                  id,
                  id_usuario,
                  funcao,
                  usuarios ( id, nome, nome_usuario )
                `)
                .eq('id_time', id)

              const integrantesCompletos = (linhas || []).map((linha) => {
                const u = Array.isArray(linha.usuarios) ? linha.usuarios[0] : linha.usuarios
                return {
                  id: linha.id,
                  idUsuario: linha.id_usuario,
                  funcao: linha.funcao,
                  nome: u?.nome_usuario || u?.nome || 'Jogador desconhecido'
                }
              })

              setTime(timeSimples)
              setIntegrantes(integrantesCompletos)
              setCarregando(false)
              return
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar do Supabase:', err)
      }

      setErro('Time não encontrado.')
      setCarregando(false)
    }

    carregarTime()
  }, [id])

  // Busca de jogadores reais na tabela 'usuarios' conforme digita, excluindo quem ja esta no time
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
          .filter((u) => !integrantes.some((item) => item.idUsuario === u.id))
          .map((u) => ({ id: u.id, nome: u.nome_usuario || u.nome, email: u.email }))
        setResultados(filtrados)
        setDropdownAberto(true)
      })
      .catch(() => {})

    return () => {
      ativo = false
    }
  }, [buscaJogador, integrantes])

  if (carregando) {
    return (
      <main id="pagina-detalhes-time">
        <p className="detalhes-time-status">Carregando time...</p>
      </main>
    )
  }

  if (erro || !time) {
    return (
      <main id="pagina-detalhes-time">
        <div className="detalhes-time-status">
          <p>{erro || 'Time não encontrado.'}</p>
          <Link to="/equipes" className="detalhes-time-voltar">Voltar para Equipes</Link>
        </div>
      </main>
    )
  }

  const capitao = integrantes.find((i) => i.funcao === 'capitao')
  const jogadores = integrantes.filter((i) => i.funcao !== 'capitao')
  const podeEditar = usuario && (usuario.id === time.id_capitao || usuario.admin)

  function abrirEdicao() {
    setFormEdicao({
      nome: time.nome || '',
      sigla: time.tag || '',
      descricao: time.descricao || '',
      logo: time.logo || ''
    })
    setErroEdicao('')
    setEdicaoAtiva(true)
  }

  function atualizarCampoEdicao(event) {
    setFormEdicao((atual) => ({ ...atual, [event.target.name]: event.target.value }))
  }

  async function salvarEdicao(event) {
    event.preventDefault()
    setErroEdicao('')

    if (!formEdicao.nome.trim() || formEdicao.sigla.trim().length < 2) {
      setErroEdicao('Preencha o nome e a sigla (mínimo 2 caracteres) da equipe.')
      return
    }

    setSalvando(true)

    const dadosAtualizados = {
      nome: formEdicao.nome.trim(),
      tag: formEdicao.sigla.trim().toUpperCase(),
      descricao: formEdicao.descricao.trim() || null,
      logo: formEdicao.logo.trim() || null
    }

    const { data: timeAtualizado, error: erroUpdate } = await supabase
      .from('times')
      .update(dadosAtualizados)
      .eq('id', id)
      .select()
      .single()

    setSalvando(false)

    if (erroUpdate || !timeAtualizado) {
      setErroEdicao('Não foi possível salvar as alterações. Tente novamente.')
      return
    }

    setTime(timeAtualizado)
    setEdicaoAtiva(false)
  }

  async function adicionarJogador(jogador) {
    setErroJogadores('')

    if (integrantes.length >= 5) {
      setErroJogadores('A line-up já atingiu o limite de 5 integrantes.')
      return
    }

    setProcessandoId(jogador.id)

    const { data: novaLinha, error: erroInsert } = await supabase
      .from('times_integrantes')
      .insert({ id_time: id, id_usuario: jogador.id, funcao: 'jogador' })
      .select()
      .single()

    setProcessandoId(null)

    if (erroInsert || !novaLinha) {
      setErroJogadores('Não foi possível adicionar o jogador. Tente novamente.')
      return
    }

    setIntegrantes((atuais) => [
      ...atuais,
      { id: novaLinha.id, idUsuario: jogador.id, funcao: 'jogador', nome: jogador.nome }
    ])
    setBuscaJogador('')
    setResultados([])
    setDropdownAberto(false)
  }

  async function removerJogador(integranteId) {
    setErroJogadores('')
    setProcessandoId(integranteId)

    const { error: erroDelete } = await supabase.from('times_integrantes').delete().eq('id', integranteId)

    setProcessandoId(null)

    if (erroDelete) {
      setErroJogadores('Não foi possível remover o jogador. Tente novamente.')
      return
    }

    setIntegrantes((atuais) => atuais.filter((item) => item.id !== integranteId))
  }

  return (
    <main id="pagina-detalhes-time">
      <Link to="/equipes" className="detalhes-time-voltar">&larr; Voltar para Equipes</Link>

      <div className="detalhes-time-layout">
        <div className="detalhes-time-coluna-principal">
          <section className="detalhes-time-cabecalho">
            <img
              src={time.logo || 'https://placehold.co/120x120/723EC3/FFFFFF?text=TEAM'}
              alt={`Logo do time ${time.nome}`}
              className="detalhes-time-logo"
            />
            <div className="detalhes-time-info">
              <span className="detalhes-time-tag">[{time.tag}]</span>
              <h1>{time.nome}</h1>
              <p className="detalhes-time-registro">Criado em {formatarData(time.registro)}</p>
              {podeEditar && !edicaoAtiva && (
                <button type="button" className="detalhes-time-editar-btn" onClick={abrirEdicao}>
                  Editar time
                </button>
              )}
            </div>
          </section>

          {edicaoAtiva && (
            <section className="detalhes-time-secao">
              <h2>Editar time</h2>
              <form className="detalhes-time-form-edicao" onSubmit={salvarEdicao}>
                <label>
                  Nome da equipe
                  <input name="nome" value={formEdicao.nome} onChange={atualizarCampoEdicao} required />
                </label>
                <label>
                  Sigla / TAG
                  <input name="sigla" maxLength="5" value={formEdicao.sigla} onChange={atualizarCampoEdicao} required />
                </label>
                <label>
                  URL do logo <span className="campo-opcional">Opcional</span>
                  <input name="logo" value={formEdicao.logo} onChange={atualizarCampoEdicao} placeholder="https://..." />
                </label>
                <label>
                  Descrição <span className="campo-opcional">Opcional</span>
                  <textarea name="descricao" value={formEdicao.descricao} onChange={atualizarCampoEdicao} />
                </label>

                {erroEdicao && <p className="detalhes-time-mensagem-erro">{erroEdicao}</p>}

                <div className="detalhes-time-form-acoes">
                  <button type="button" className="detalhes-time-cancelar-btn" onClick={() => setEdicaoAtiva(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="detalhes-time-editar-btn" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {time.descricao && (
            <section className="detalhes-time-secao">
              <h2>Descrição</h2>
              <p>{time.descricao}</p>
            </section>
          )}
        </div>

        <aside className="detalhes-time-coluna-lateral">
          <section className="detalhes-time-secao">
            <div className="detalhes-time-secao-titulo">
              <h2>Line-up ({integrantes.length}/5)</h2>
              {podeEditar && (
                <button
                  type="button"
                  className="detalhes-time-gerenciar-btn"
                  onClick={() => {
                    setGerenciandoJogadores((atual) => !atual)
                    setErroJogadores('')
                    setBuscaJogador('')
                    setResultados([])
                    setDropdownAberto(false)
                  }}
                >
                  {gerenciandoJogadores ? 'Concluir' : 'Adicionar/Remover jogadores'}
                </button>
              )}
            </div>

            {gerenciandoJogadores && (
              <div className="detalhes-time-gerenciar-jogadores">
                <div className="buscar-jogador-wrap">
                  <input
                    value={buscaJogador}
                    onChange={(event) => setBuscaJogador(event.target.value)}
                    onFocus={() => buscaJogador.trim() && setDropdownAberto(true)}
                    placeholder="Buscar por nick ou e-mail do jogador..."
                    disabled={integrantes.length >= 5}
                  />

                  {dropdownAberto && buscaJogador.trim().length > 0 && (
                    <div className="autocomplete-dropdown">
                      {resultados.length > 0 ? (
                        resultados.map((jogador) => (
                          <div key={jogador.id} className="autocomplete-item" onClick={() => adicionarJogador(jogador)}>
                            <div className="autocomplete-item-info">
                              <span className="autocomplete-item-name">{jogador.nome}</span>
                              <span className="autocomplete-item-email">{jogador.email}</span>
                            </div>
                            <span className="autocomplete-add-btn">
                              {processandoId === jogador.id ? 'Adicionando...' : '+ Adicionar'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="autocomplete-empty">Nenhum jogador encontrado</div>
                      )}
                    </div>
                  )}
                </div>
                {erroJogadores && <p className="detalhes-time-mensagem-erro">{erroJogadores}</p>}
              </div>
            )}

            <div className="detalhes-time-jogadores">
              {capitao && (
                <div className="detalhes-time-jogador-card capitao">
                  <strong>{capitao.nome}</strong>
                  <span>CAPITÃO</span>
                </div>
              )}
              {jogadores.map((jogador) => (
                <div className="detalhes-time-jogador-card" key={jogador.id}>
                  <strong>{jogador.nome}</strong>
                  <span>JOGADOR</span>
                  {gerenciandoJogadores && (
                    <button
                      type="button"
                      className="detalhes-time-remover-btn"
                      onClick={() => removerJogador(jogador.id)}
                      disabled={processandoId === jogador.id}
                    >
                      {processandoId === jogador.id ? 'Removendo...' : 'Remover'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {jogadores.length === 0 && (
              <p className="detalhes-time-aviso">Este time ainda não tem jogadores além do capitão.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}
