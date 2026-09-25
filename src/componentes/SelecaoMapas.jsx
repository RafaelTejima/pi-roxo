import { useMemo, useState } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/selecao-mapas.css'

const mapas = [
  {
    nome: 'Mirage',
    categoria: 'Clássico',
    regiao: 'Oriente Médio',
    descricao: 'Um mapa clássico de equilíbrio tático, com rotas abertas para o controle do meio e execuções coordenadas nos bombsites.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: 'https://placehold.co/900x560/282238/e9ddff?text=MIRAGE',
  },
  {
    nome: 'Inferno',
    categoria: 'Clássico',
    regiao: 'Europa',
    descricao: 'Corredores estreitos e pontos de estrangulamento fazem deste mapa uma escolha para equipes que dominam utilitários.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: 'https://placehold.co/900x560/392821/f7d8c9?text=INFERNO',
  },
  {
    nome: 'Nuke',
    categoria: 'Tático',
    regiao: 'Estados Unidos',
    descricao: 'Dois níveis de combate exigem comunicação precisa, leitura de rota e controle constante das áreas de acesso.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: 'https://placehold.co/900x560/202d36/d9edf4?text=NUKE',
  },
  {
    nome: 'Dust II',
    categoria: 'Clássico',
    regiao: 'Marrocos',
    descricao: 'O campo de batalha mais reconhecido da série, com confrontos diretos e espaço para jogadas individuais.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: 'https://placehold.co/900x560/423328/f5dfc0?text=DUST+II',
  },
  {
    nome: 'Overpass',
    categoria: 'Tático',
    regiao: 'Alemanha',
    descricao: 'Um mapa vertical e dinâmico que recompensa rotações rápidas e domínio das áreas externas.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: 'https://placehold.co/900x560/25332e/d9eee3?text=OVERPASS',
  },
  {
    nome: 'Ancient',
    categoria: 'Tático',
    regiao: 'América Central',
    descricao: 'Arquitetura antiga, espaços apertados e uma região central disputada em cada rodada.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: 'https://placehold.co/900x560/2b3529/e2edc9?text=ANCIENT',
  },
  {
    nome: 'Anubis',
    categoria: 'Operação',
    regiao: 'Egito',
    descricao: 'Linhas longas e passagens conectadas criam possibilidades variadas para ataques e retakes.',
    rounds: 'MR12',
    formato: 'Competitivo',
    imagem: 'https://placehold.co/900x560/3b3028/f2d9bd?text=ANUBIS',
  },
]

const categorias = ['Todos', ...new Set(mapas.map((mapa) => mapa.categoria))]

export default function SelecaoMapas() {
  const { id: torneioId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

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
      setErro('Dados do torneio nao encontrados. Volte e preencha o formulario novamente.')
      return
    }

    setErro('')
    setEnviando(true)

    const mapaNome = mapaSelecionado ? mapaSelecionado.nome : 'Mirage'
    const descricaoComMapa = `${dadosTorneio.descricao || ''}\n- Mapa oficial: ${mapaNome}`

    const { error } = await supabase.from('torneios').insert({
      nome: dadosTorneio.nome,
      descricao: descricaoComMapa,
      jogo: dadosTorneio.jogo,
      formato: dadosTorneio.formato,
      data_inicio: dadosTorneio.data_inicio,
      status: dadosTorneio.status,
      id_criador: dadosTorneio.id_criador,
      dinheiro: dadosTorneio.dinheiro,
    })

    setEnviando(false)

    if (error) {
      console.error(error)
      setErro('Nao foi possivel salvar o torneio no banco de dados. Tente novamente.')
      return
    }

    localStorage.removeItem('dadosTorneioEmCriacao')
    setConfirmado(false)
    navigate('/torneios')
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
