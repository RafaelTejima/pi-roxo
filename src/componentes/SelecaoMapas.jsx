import { useMemo, useState } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { imagensMapas } from '../mapas'
import '../css/selecao-mapas.css'
import { useAlerta } from './AlertaModal'

const mapas = [
  {
    nome: 'Mirage',
    categoria: 'Clássico',
    regiao: 'Oriente Médio',
    descricao: 'Um mapa clássico de equilíbrio tático, com rotas abertas para o controle do meio e execuções coordenadas nos bombsites.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: imagensMapas.Mirage,
  },
  {
    nome: 'Inferno',
    categoria: 'Clássico',
    regiao: 'Europa',
    descricao: 'Corredores estreitos e pontos de estrangulamento fazem deste mapa uma escolha para equipes que dominam utilitários.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: imagensMapas.Inferno,
  },
  {
    nome: 'Nuke',
    categoria: 'Tático',
    regiao: 'Estados Unidos',
    descricao: 'Dois níveis de combate exigem comunicação precisa, leitura de rota e controle constante das áreas de acesso.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: imagensMapas.Nuke,
  },
  {
    nome: 'Dust II',
    categoria: 'Clássico',
    regiao: 'Marrocos',
    descricao: 'O campo de batalha mais reconhecido da série, com confrontos diretos e espaço para jogadas individuais.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: imagensMapas['Dust II'],
  },
  {
    nome: 'Overpass',
    categoria: 'Tático',
    regiao: 'Alemanha',
    descricao: 'Um mapa vertical e dinâmico que recompensa rotações rápidas e domínio das áreas externas.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: imagensMapas.Overpass,
  },
  {
    nome: 'Ancient',
    categoria: 'Tático',
    regiao: 'América Central',
    descricao: 'Arquitetura antiga, espaços apertados e uma região central disputada em cada rodada.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: imagensMapas.Ancient,
  },
  {
    nome: 'Anubis',
    categoria: 'Operação',
    regiao: 'Egito',
    descricao: 'Linhas longas e passagens conectadas criam possibilidades variadas para ataques e retakes.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: imagensMapas.Anubis,
  },
]

const categorias = ['Todos', ...new Set(mapas.map((mapa) => mapa.categoria))]

export default function SelecaoMapas() {
  const { id: torneioId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { mostrarAlerta } = useAlerta()

  const [pesquisa, setPesquisa] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [mapaSelecionado, setMapaSelecionado] = useState(null)
  const [confirmado, setConfirmado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleFinalizar() {
    const dadosState = location.state?.dadosTorneio
    const dadosLocal = localStorage.getItem('dadosTorneioEmCriacao')
    const dadosTorneio = dadosState || (dadosLocal ? JSON.parse(dadosLocal) : null)

    if (!dadosTorneio) {
      const msg = 'Dados do torneio não encontrados. Volte e preencha o formulário novamente.'
      setErro(msg)
      mostrarAlerta({
        titulo: 'Dados Ausentes',
        mensagem: msg,
        tipo: 'erro',
        onConfirmar: () => navigate('/torneios/criar')
      })
      return
    }

    setErro('')
    setEnviando(true)

    if (!mapaSelecionado) {
      setErro('Selecione um mapa antes de continuar.')
      return
    }

    const mapaNome = mapaSelecionado.nome
    const descricaoComMapa = `${dadosTorneio.descricao || ''}\n- Mapa oficial: ${mapaNome}`

    try {
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado ou indisponível.')
      }

      const payloadBanco = {
        nome: dadosTorneio.nome?.trim(),
        descricao: descricaoComMapa,
        formato: dadosTorneio.formato,
        data_inicio: dadosTorneio.data_inicio,
        status: typeof dadosTorneio.status === 'boolean' ? dadosTorneio.status : true,
        id_criador: dadosTorneio.id_criador,
        dinheiro: dadosTorneio.dinheiro,
      }

      const { data: torneioCriado, error } = await supabase
        .from('torneios')
        .insert(payloadBanco)
        .select()
        .single()

      setEnviando(false)

      if (error) {
        console.error('Erro detalhado no PostgreSQL ao publicar torneio:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })

        const msgLower = ((error.message || '') + ' ' + (error.details || '')).toLowerCase()
        const isNomeDuplicado =
          error.code === '23505' && (msgLower.includes('nome') || msgLower.includes('torneios_nome_key'))

        if (isNomeDuplicado) {
          const msg = 'Já existe um torneio cadastrado com este nome. Volte e escolha outro nome.'
          setErro(msg)
          mostrarAlerta({
            titulo: 'Nome Indisponível',
            mensagem: msg,
            tipo: 'aviso',
            botaoTexto: 'Editar Torneio',
            onConfirmar: () => navigate('/torneios/criar')
          })
          return
        }

        const msgErro = error.message || 'Não foi possível salvar o torneio no banco de dados. Tente novamente.'
        setErro(msgErro)
        mostrarAlerta({
          titulo: 'Erro ao Publicar',
          mensagem: `Não foi possível salvar o torneio no banco de dados. Motivo: ${error.message} (${error.code || 'DB_ERROR'})`,
          tipo: 'erro'
        })
        return
      }

      localStorage.removeItem('dadosTorneioEmCriacao')
      setConfirmado(false)

      window.dispatchEvent(new Event('torneiosAtualizados'))
      window.dispatchEvent(new Event('storage'))

      mostrarAlerta({
        titulo: 'Torneio Publicado!',
        mensagem: `O campeonato "${dadosTorneio.nome}" com mapa oficial ${mapaNome} foi cadastrado com sucesso!`,
        tipo: 'sucesso',
        botaoTexto: 'Ver Torneios',
        onConfirmar: () => navigate('/torneios')
      })
      setTimeout(() => navigate('/torneios'), 1500)
    } catch (err) {
      console.error('Exceção ao publicar torneio no Supabase:', err)
      setEnviando(false)
      const msg = err.message || 'Ocorreu um erro inesperado ao publicar o torneio.'
      setErro(msg)
      mostrarAlerta({
        titulo: 'Erro ao Publicar',
        mensagem: msg,
        tipo: 'erro'
      })
    }
  }

  const mapasFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    return mapas.filter((mapa) => {
      const correspondeNome = mapa.nome.toLowerCase().includes(termo)
      const correspondeCategoria = categoria === 'Todos' || mapa.categoria === categoria
      return correspondeNome && correspondeCategoria
    })
  }, [pesquisa, categoria])

  function limparFiltros() {
    setPesquisa('')
    setCategoria('Todos')
  }

  function selecionarMapa(mapa) {
    setMapaSelecionado(mapa)
  }


  return (
    <main id="selecao-mapas">
      <section className="selecao-mapas-conteudo" aria-labelledby="titulo-selecao-mapas">
        <Link className="selecao-mapas-voltar" to={torneioId ? `/torneios/${torneioId}` : '/torneios'}>
          <span aria-hidden="true">&lt;-</span> Voltar para o torneio
        </Link>

        <header className="selecao-mapas-cabecalho">
          <div>
            <p className="selecao-mapas-kicker">CONFIGURAÇÃO DA PARTIDA / MAP POOL</p>
            <h1 id="titulo-selecao-mapas">Seleção de mapa</h1>
            <p>Escolha o mapa que será utilizado na partida do campeonato.</p>
          </div>
          <div className="selecao-mapas-etapa" aria-label="Etapa 1 de 2">
            <strong>01</strong>
            <span>MAPA DA RODADA</span>
          </div>
        </header>

        <section className="selecao-mapas-controles" aria-label="Pesquisa e filtros">
          <label className="selecao-mapas-pesquisa">
            <span>Pesquisar mapa</span>
            <input
              type="search"
              value={pesquisa}
              onChange={(evento) => setPesquisa(evento.target.value)}
              placeholder="Digite o nome do mapa..."
            />
          </label>
          <label className="selecao-mapas-filtro">
            <span>Categoria</span>
            <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>
              {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button className="selecao-mapas-limpar" type="button" onClick={limparFiltros}>Limpar filtros</button>
        </section>

        <div className="selecao-mapas-resultados">
          <span>{mapasFiltrados.length} mapas encontrados</span>
          {mapaSelecionado && <span>Selecionado: <strong>{mapaSelecionado.nome}</strong></span>}
        </div>

        {mapasFiltrados.length > 0 ? (
          <div className="selecao-mapas-grid" role="radiogroup" aria-label="Mapas disponíveis">
            {mapasFiltrados.map((mapa) => {
              const selecionado = mapaSelecionado?.nome === mapa.nome
              return (
                <button
                  className={`mapa-card ${selecionado ? 'mapa-card-selecionado' : ''}`}
                  key={mapa.nome}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  onClick={() => selecionarMapa(mapa)}
                >
                  <img src={mapa.imagem} alt={`Imagem ilustrativa do mapa ${mapa.nome}`} />
                  <span className="mapa-card-overlay" />
                  <span className="mapa-card-topo">
                    <span>{mapa.categoria}</span>
                    <span className="mapa-card-radio" aria-hidden="true"><span /></span>
                  </span>
                  <span className="mapa-card-info">
                    <small>{mapa.regiao}</small>
                    <strong>{mapa.nome}</strong>
                  </span>
                  <span className="mapa-card-estado">{selecionado ? 'Selecionado' : 'Escolher mapa'}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="selecao-mapas-vazio">
            <strong>Nenhum mapa encontrado</strong>
            <p>Tente buscar por outro nome ou remova os filtros ativos.</p>
            <button className="selecao-mapas-botao-secundario" type="button" onClick={limparFiltros}>Limpar filtros</button>
          </div>
        )}

        {mapaSelecionado && (
          <section className="mapa-detalhes" aria-labelledby="titulo-detalhes-mapa">
            <div className="mapa-detalhes-imagem">
              <img src={mapaSelecionado.imagem} alt={`Destaque do mapa ${mapaSelecionado.nome}`} />
              <span>MAPA SELECIONADO</span>
            </div>
            <div className="mapa-detalhes-conteudo">
              <p className="selecao-mapas-kicker">DETALHES DO MAPA</p>
              <h2 id="titulo-detalhes-mapa">{mapaSelecionado.nome}</h2>
              <p>{mapaSelecionado.descricao}</p>
              <div className="mapa-detalhes-dados">
                <div><small>CATEGORIA</small><strong>{mapaSelecionado.categoria}</strong></div>
                <div><small>FORMATO</small><strong>{mapaSelecionado.formato}</strong></div>
                <div><small>RODADAS</small><strong>{mapaSelecionado.rounds}</strong></div>
              </div>
              <button className="selecao-mapas-botao-principal" type="button" onClick={() => setConfirmado(true)}>Confirmar mapa <span aria-hidden="true">-&gt;</span></button>
            </div>
          </section>
        )}
      </section>

      {confirmado && (
        <div className="selecao-mapas-modal-fundo" role="presentation" onClick={() => setConfirmado(false)}>
          <section className="selecao-mapas-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacao" onClick={(evento) => evento.stopPropagation()}>
            <span className="selecao-mapas-modal-marca" aria-hidden="true">OK</span>
            <p className="selecao-mapas-kicker">MAPA DEFINIDO PARA A PARTIDA</p>
            <h2 id="titulo-confirmacao">{mapaSelecionado.nome} confirmado</h2>
            <p>O mapa foi selecionado para a configuração desta partida do torneio.</p>
            {erro && <p className="selecao-mapas-mensagem-erro">{erro}</p>}
            <div className="selecao-mapas-modal-acoes">
              <button className="selecao-mapas-botao-principal" type="button" onClick={handleFinalizar} disabled={enviando}>
                {enviando ? 'Salvando...' : 'Continuar'}
              </button>
              <Link className="selecao-mapas-link-modal" to={torneioId ? `/torneios/${torneioId}` : '/torneios'}>Ver torneio</Link>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
