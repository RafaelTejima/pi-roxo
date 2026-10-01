import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/detalhes-time.css'

const LOGO_PLACEHOLDER = 'https://placehold.co/120x120/723EC3/FFFFFF?text=TEAM'

function resolverLogo(logo) {
  const caminho = typeof logo === 'string' ? logo.trim() : ''
  if (!caminho) return LOGO_PLACEHOLDER
  if (/^(https?:\/\/|data:|blob:|\/\/)/i.test(caminho)) return caminho
  return `/${caminho.replace(/^(\.\/)+/, '').replace(/^\/+/, '')}`
}

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
      .then(async ({ data, error }) => {
        if (!ativo || error || !data) return

        const candidatos = data.filter((u) => !integrantes.some((item) => item.idUsuario === u.id))
        if (candidatos.length === 0) {
          setResultados([])
          setDropdownAberto(true)
          return
        }

        // Exclui quem ja faz parte de qualquer time (deste ou de outro)
        const { data: vinculos } = await supabase
          .from('times_integrantes')
          .select('id_usuario')
          .in('id_usuario', candidatos.map((u) => u.id))

        if (!ativo) return

        const idsOcupados = new Set((vinculos || []).map((v) => v.id_usuario))
        const filtrados = candidatos
          .filter((u) => !idsOcupados.has(u.id))
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

    // Revalida no banco (evita corrida caso o jogador tenha entrado em outro time nesse meio tempo)
    const { data: vinculoExistente } = await supabase
      .from('times_integrantes')
      .select('id_time')
      .eq('id_usuario', jogador.id)
      .limit(1)

    if (vinculoExistente && vinculoExistente.length > 0) {
      setProcessandoId(null)
      setErroJogadores('Este jogador já faz parte de outra equipe.')
      return
    }

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

  async function atualizarCapitao(integrante, remover = false) {
    if (usuario?.admin !== true) return

    const capitaoAtual = integrantes.find((item) => item.funcao === 'capitao')
    const novoCapitao = remover ? null : integrante
    if (!remover && capitaoAtual?.id === novoCapitao.id) return

    setErroJogadores('')
    setProcessandoId(integrante.id)

    try {
      if (remover) {
        const { error: erroTime } = await supabase
          .from('times')
          .update({ id_capitao: null })
          .eq('id', id)

        if (erroTime) throw erroTime

        if (capitaoAtual) {
          const { error: erroIntegrante } = await supabase
            .from('times_integrantes')
            .update({ funcao: 'jogador' })
            .eq('id', capitaoAtual.id)
            .eq('id_time', id)

          if (erroIntegrante) {
            await supabase.from('times').update({ id_capitao: capitaoAtual.idUsuario }).eq('id', id)
            throw erroIntegrante
          }
        }
      } else {
        if (capitaoAtual) {
          const { error: erroCapitaoAtual } = await supabase
            .from('times_integrantes')
            .update({ funcao: 'jogador' })
            .eq('id', capitaoAtual.id)
            .eq('id_time', id)

          if (erroCapitaoAtual) throw erroCapitaoAtual
        }

        const { error: erroNovoCapitao } = await supabase
          .from('times_integrantes')
          .update({ funcao: 'capitao' })
          .eq('id', novoCapitao.id)
          .eq('id_time', id)

        if (erroNovoCapitao) {
          if (capitaoAtual) {
            await supabase.from('times_integrantes').update({ funcao: 'capitao' }).eq('id', capitaoAtual.id)
          }
          throw erroNovoCapitao
        }

        const { error: erroTime } = await supabase
          .from('times')
          .update({ id_capitao: novoCapitao.idUsuario })
          .eq('id', id)

        if (erroTime) {
          await supabase.from('times_integrantes').update({ funcao: 'jogador' }).eq('id', novoCapitao.id)
          if (capitaoAtual) {
            await supabase.from('times_integrantes').update({ funcao: 'capitao' }).eq('id', capitaoAtual.id)
          }
          throw erroTime
        }
      }

      setTime((atual) => ({ ...atual, id_capitao: novoCapitao?.idUsuario ?? null }))
      setIntegrantes((atuais) => atuais.map((item) => ({
        ...item,
        funcao: item.id === capitaoAtual?.id ? 'jogador' : item.funcao
      })).map((item) => ({
        ...item,
        funcao: item.id === novoCapitao?.id ? 'capitao' : item.funcao
      })))
    } catch {
      setErroJogadores(remover
        ? 'Não foi possível remover o capitão. Tente novamente.'
        : 'Não foi possível alterar o capitão. Tente novamente.')
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <main id="pagina-detalhes-time">
      <Link to="/equipes" className="detalhes-time-voltar">&larr; Voltar para Equipes</Link>

      <div className="detalhes-time-layout">
        <div className="detalhes-time-coluna-principal">
          <section className="detalhes-time-cabecalho">
            <img
              src={resolverLogo(time.logo)}
              alt={`Logo do time ${time.nome}`}
              className="detalhes-time-logo"
              onError={(event) => {
                const imagem = event.currentTarget
                if (imagem.src === LOGO_PLACEHOLDER) {
                  imagem.style.display = 'none'
                  return
                }
                imagem.src = LOGO_PLACEHOLDER
              }}
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
                  {gerenciandoJogadores && usuario?.admin === true && (
                    <button
                      type="button"
                      className="detalhes-time-capitao-btn detalhes-time-capitao-btn-remover"
                      onClick={() => atualizarCapitao(capitao, true)}
                      disabled={processandoId !== null}
                    >
                      {processandoId === capitao.id ? 'Removendo...' : 'Remover como capitão'}
                    </button>
                  )}
                </div>
              )}
              {jogadores.map((jogador) => (
                <div className="detalhes-time-jogador-card" key={jogador.id}>
                  <strong>{jogador.nome}</strong>
                  <span>JOGADOR</span>
                  {gerenciandoJogadores && usuario?.admin === true && (
                    <button
                      type="button"
                      className="detalhes-time-capitao-btn"
                      onClick={() => atualizarCapitao(jogador)}
                      disabled={processandoId !== null}
                    >
                      {processandoId === jogador.id ? 'Definindo...' : 'Tornar capitão'}
                    </button>
                  )}
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
