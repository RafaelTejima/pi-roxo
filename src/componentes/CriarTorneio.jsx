import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/criar-torneio.css'

// ============================================================
// COMPONENTE PRINCIPAL: PAGINA DE CRIACAO DE TORNEIO
// ============================================================

// Opções fixas de horário para manter o formato 24h independente do navegador
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

// Campos fixos exigidos pela tabela `torneios` que ainda nao tem selecao propria na tela
const JOGO_PADRAO = 'CS2'
const FORMATO_PADRAO = 'Eliminação Simples'

export default function CriarTorneio() {
  const navigate = useNavigate()
  const [usuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem('usuarioLogado')
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null
  })

  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [minuto, setMinuto] = useState('')
  const [premio, setPremio] = useState('')
  const [regras, setRegras] = useState([])
  const [novaRegra, setNovaRegra] = useState('')
  const [regrasAbertas, setRegrasAbertas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  function handleAdicionarRegra() {
    const texto = novaRegra.trim()
    if (!texto) return
    setRegras((prev) => [...prev, texto])
    setNovaRegra('')
  }

  function handleRemoverRegra(index) {
    setRegras((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')

    if (!usuario) {
      setErro('Voce precisa estar logado para criar um torneio.')
      return
    }

    if (!nome.trim() || !data || !hora || !minuto || !premio) {
      setErro('Preencha todos os campos do torneio.')
      return
    }

    if (regras.length === 0) {
      setErro('Adicione ao menos uma regra antes de continuar.')
      return
    }

    // Formato 24h garantido, sem depender do idioma do navegador
    const dataHora = `${data}T${hora}:${minuto}`

    const formData = {
      nome: nome.trim(),
      descricao: regras.map((regra) => `- ${regra}`).join('\n'),
      jogo: JOGO_PADRAO,
      formato: FORMATO_PADRAO,
      data_inicio: dataHora,
      status: true,
      id_criador: usuario.id,
      dinheiro: Math.round(Number(premio)),
    }

    // Armazena temporariamente no localStorage para sincronia de etapas
    localStorage.setItem('dadosTorneioEmCriacao', JSON.stringify(formData))

    // Navega para a seleção de mapas passando os dados do torneio no state
    navigate('/selecao-mapas', { state: { dadosTorneio: formData } })
  }


  return (
    <main id="pagina-criar-torneio">
      <section className="criar-torneio-heading">
        <p className="criar-torneio-overline">NOVO TORNEIO</p>
        <h1>Organize seu próximo <span>campeonato.</span></h1>
        <p>Preencha os dados abaixo para publicar um torneio na plataforma.</p>
      </section>

      <form className="criar-torneio-form" onSubmit={handleSubmit}>
        <div className="campo-form">
          <label htmlFor="nome-torneio">Nome do torneio</label>
          <input
            id="nome-torneio"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: ROXO Major 2026"
          />
        </div>

        <div className="campo-form">
          <label htmlFor="data-torneio">Horário e data do torneio</label>
          <div className="campo-form-datahora">
            <input
              id="data-torneio"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
            />
            <select
              id="hora-torneio"
              aria-label="Hora"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            >
              <option value="">Hora</option>
              {HORAS.map((h) => (
                <option key={h} value={h}>{h}h</option>
              ))}
            </select>
            <select
              id="minuto-torneio"
              aria-label="Minuto"
              value={minuto}
              onChange={(e) => setMinuto(e.target.value)}
            >
              <option value="">Min</option>
              {MINUTOS.map((m) => (
                <option key={m} value={m}>{m}min</option>
              ))}
            </select>
          </div>
        </div>

        <div className="campo-form">
          <label htmlFor="premio-torneio">Valor do prêmio (R$)</label>
          <input
            id="premio-torneio"
            type="number"
            min="0"
            step="1"
            value={premio}
            onChange={(e) => setPremio(e.target.value)}
            placeholder="Ex: 5000"
          />
        </div>

        {/* Regras do torneio em formato dropdown */}
        <div className="campo-form">
          <label>Regras do torneio</label>
          <details
            className="regras-dropdown"
            open={regrasAbertas}
            onToggle={(e) => setRegrasAbertas(e.target.open)}
          >
            <summary>
              {regras.length > 0 ? `${regras.length} regra(s) adicionada(s)` : 'Adicionar regras'} <span>+</span>
            </summary>

            <div className="regras-conteudo">
              <div className="regras-input-linha">
                <input
                  type="text"
                  value={novaRegra}
                  onChange={(e) => setNovaRegra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAdicionarRegra()
                    }
                  }}
                  placeholder="Ex: Formato Single Elimination"
                />
                <button type="button" onClick={handleAdicionarRegra}>Adicionar</button>
              </div>

              {regras.length > 0 && (
                <ul className="regras-lista">
                  {regras.map((regra, index) => (
                    <li key={index}>
                      <span>{regra}</span>
                      <button type="button" onClick={() => handleRemoverRegra(index)}>Remover</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        </div>

        {erro && <p className="criar-torneio-mensagem erro">{erro}</p>}
        {sucesso && <p className="criar-torneio-mensagem sucesso">{sucesso}</p>}

        <div className="criar-torneio-acoes">
          <Link to="/torneios" className="botao-cancelar">Cancelar</Link>
          <button type="submit" className="botao-enviar">
            Continuar
          </button>
        </div>

      </form>
    </main>
  )
}
