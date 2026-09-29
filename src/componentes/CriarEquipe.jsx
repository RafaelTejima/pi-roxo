import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/criar-equipe.css'
import { useAlerta } from './AlertaModal'

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
  const { mostrarAlerta } = useAlerta()
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
      mostrarAlerta({
        titulo: 'Vagas Esgotadas',
        mensagem: 'A line-up já atingiu o limite máximo de 5 integrantes (1 capitão + 4 jogadores).',
        tipo: 'aviso'
      })
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
      const msgErro = 'Preencha o nome e a sigla (mínimo 2 caracteres) da equipe.'
      setErro(msgErro)
      mostrarAlerta({
        titulo: 'Campos Obrigatórios',
        mensagem: msgErro,
        tipo: 'aviso'
      })
      return
    }

    if (equipe.sigla.trim().length > 5) {
      const msgErro = 'A sigla / TAG da equipe deve ter no máximo 5 caracteres.'
      setErro(msgErro)
      mostrarAlerta({
        titulo: 'TAG Muito Longa',
        mensagem: msgErro,
        tipo: 'aviso'
      })
      return
    }

    if (!usuario?.id) {
      const msgErro = 'Você precisa estar logado para registrar uma equipe.'
      setErro(msgErro)
      mostrarAlerta({
        titulo: 'Autenticação Necessária',
        mensagem: msgErro,
        tipo: 'aviso',
        botaoTexto: 'Fazer Login',
        onConfirmar: () => navigate('/login')
      })
      return
    }

    setEnviando(true)

    const nomeLimpo = equipe.nome.trim()
    const tagLimpa = equipe.sigla.trim().toUpperCase()
    const descLimpa = equipe.descricao.trim()

    try {
      if (!supabase) {
        throw new Error('Serviço de banco de dados não configurado ou indisponível.')
      }

      // Passo A: Inserir na tabela 'times' sem passar ID manual (deixando o PostgreSQL gerar a sequence serial)
      const insertPayload = {
        nome: nomeLimpo,
        tag: tagLimpa,
        logo: null,
        descricao: descLimpa || null,
        id_capitao: Number(usuario.id) || usuario.id
      }

      const { data: timeInserido, error: erroTimes } = await supabase
        .from('times')
        .insert(insertPayload)
        .select()
        .single()

      if (erroTimes || !timeInserido) {
        const msgLower = ((erroTimes?.message || '') + ' ' + (erroTimes?.details || '')).toLowerCase()
        const isUnique =
          erroTimes?.code === '23505' ||
          msgLower.includes('duplicate key') ||
          msgLower.includes('unique constraint') ||
          msgLower.includes('already exists')

        setEnviando(false)

        if (isUnique) {
          if (msgLower.includes('tag') || msgLower.includes('times_tag_key')) {
            const msg = 'Esta TAG já está em uso por outra equipe. Escolha outra sigla/TAG.'
            setErro(msg)
            mostrarAlerta({
              titulo: 'TAG Indisponível',
              mensagem: msg,
              tipo: 'aviso'
            })
            return
          }
          if (msgLower.includes('nome') || msgLower.includes('times_nome_key')) {
            const msg = 'Já existe uma equipe cadastrada com este nome. Escolha outro nome.'
            setErro(msg)
            mostrarAlerta({
              titulo: 'Nome Indisponível',
              mensagem: msg,
              tipo: 'aviso'
            })
            return
          }
          const msg = 'Já existe uma equipe cadastrada com este nome ou TAG.'
          setErro(msg)
          mostrarAlerta({
            titulo: 'Equipe Já Existente',
            mensagem: msg,
            tipo: 'aviso'
          })
          return
        }

        if (erroTimes?.code === '22001' || msgLower.includes('value too long')) {
          const msg = 'A sigla/TAG da equipe deve ter no máximo 5 caracteres.'
          setErro(msg)
          mostrarAlerta({
            titulo: 'TAG Inválida',
            mensagem: msg,
            tipo: 'aviso'
          })
          return
        }

        // Outros erros de banco
        const msg = erroTimes?.message || 'Falha ao salvar a equipe no banco de dados.'
        setErro(msg)
        mostrarAlerta({
          titulo: 'Erro no Cadastro',
          mensagem: msg,
          tipo: 'erro'
        })
        return
      }

      const novoIdTime = timeInserido.id

      // Passo B: Imediatamente após a confirmação do Passo A, inserir capitão na tabela 'times_integrantes'
      const { error: erroCapitao } = await supabase
        .from('times_integrantes')
        .insert({
          id_time: novoIdTime,
          id_usuario: Number(usuario.id) || usuario.id,
          funcao: 'capitao'
        })

      if (erroCapitao) {
        // Rollback para integridade transacional: remove o time recém-criado
        try {
          await supabase.from('times').delete().eq('id', novoIdTime)
        } catch (_) {}
        setEnviando(false)
        const msg = `Falha ao registrar capitão na equipe: ${erroCapitao.message || 'Erro de integridade'}`
        setErro(msg)
        mostrarAlerta({
          titulo: 'Erro ao Vincular Capitão',
          mensagem: msg,
          tipo: 'erro'
        })
        return
      }

      // Inserir jogadores convidados que possuam ID de usuário válido no banco
      const convidadosValidos = jogadores
        .filter((j) => typeof j.id === 'number' || (!isNaN(Number(j.id)) && Number(j.id) > 0 && !String(j.id).startsWith('usr-')))
        .map((j) => ({
          id_time: novoIdTime,
          id_usuario: Number(j.id),
          funcao: 'jogador'
        }))

      if (convidadosValidos.length > 0) {
        for (const convidado of convidadosValidos) {
          try {
            const { error: errMembro } = await supabase.from('times_integrantes').insert(convidado)
            if (errMembro) {
              console.warn('Convidado não pôde ser vinculado ao time no banco:', convidado, errMembro)
            }
          } catch (errCatch) {
            console.warn('Erro ao tentar inserir convidado no banco:', convidado, errCatch)
          }
        }
      }

      // Passo C: APENAS se ambas as operações no Supabase forem concluídas com sucesso irrefutável, atualiza o localStorage e emite eventos globais
      const novaEquipeObj = {
        id: novoIdTime,
        nome: nomeLimpo,
        tag: tagLimpa,
        descricao: descLimpa,
        capitao: usuario.nome || usuario.email,
        id_capitao: usuario.id,
        capitaoNome: usuario.nome || usuario.email,
        totalIntegrantes: jogadores.length + 1,
        jogadoresCount: `${jogadores.length + 1}/5`,
        jogadores: [
          { id: usuario.id, nome: usuario.nome || usuario.email, funcao: 'capitao', role: 'captain' },
          ...jogadores.map((j) => ({ id: j.id, nome: j.nome, email: j.email, funcao: 'jogador', role: 'player' }))
        ],
        createdAt: timeInserido.registro || new Date().toISOString()
      }

      try {
        const salvas = localStorage.getItem('equipesCadastradas')
        const lista = salvas ? JSON.parse(salvas) : []
        const filtrada = lista.filter((t) => String(t.id) !== String(novoIdTime))
        filtrada.unshift(novaEquipeObj)
        localStorage.setItem('equipesCadastradas', JSON.stringify(filtrada))
      } catch (errStorage) {
        console.error('Erro ao salvar no localStorage:', errStorage)
      }

      window.dispatchEvent(new Event('equipesAtualizadas'))
      window.dispatchEvent(new Event('storage'))

      setEnviando(false)
      setSucesso('Equipe criada com sucesso!')
      mostrarAlerta({
        titulo: 'Equipe Registrada!',
        mensagem: `A equipe "${nomeLimpo}" [${tagLimpa}] foi cadastrada com sucesso!`,
        tipo: 'sucesso',
        botaoTexto: 'Ver Equipes',
        onConfirmar: () => navigate('/equipes')
      })
      setTimeout(() => navigate('/equipes'), 1500)
    } catch (err) {
      // Passo D: Tratamento robusto de exceções e bloqueio de persistência
      console.error('Erro inesperado no cadastro de equipe:', err)
      setEnviando(false)
      const msg = err.message || 'Ocorreu um erro inesperado ao cadastrar a equipe. Tente novamente.'
      setErro(msg)
      mostrarAlerta({
        titulo: 'Falha no Cadastro',
        mensagem: msg,
        tipo: 'erro'
      })
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
