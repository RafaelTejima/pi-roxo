import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../css/criar-torneio.css'

// ============================================================
// COMPONENTE PRINCIPAL: PAGINA DE CRIACAO DE TORNEIO
// ============================================================

export default function CriarTorneio() {
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [dataHora, setDataHora] = useState('')
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

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')

    if (!nome.trim() || !dataHora || !premio) {
      setErro('Preencha todos os campos do torneio.')
      return
    }

    if (regras.length === 0) {
      setErro('Adicione ao menos uma regra antes de enviar o torneio.')
      return
    }

    setEnviando(true)

    const { error } = await supabase.from('tournaments').insert({
      name: nome.trim(),
      tournament_date: dataHora,
      prize: Number(premio),
      rules: regras.map((regra) => `- ${regra}`).join('\n'),
      status: 'open',
      teams_count: 0,
    })

    setEnviando(false)

    if (error) {
      setErro('Não foi possível criar o torneio. Tente novamente.')
      return
    }

    setSucesso('Torneio criado com sucesso!')
    setTimeout(() => navigate('/torneios'), 1200)
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
          <input
            id="data-torneio"
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
          />
        </div>

        <div className="campo-form">
          <label htmlFor="premio-torneio">Valor do prêmio (R$)</label>
          <input
            id="premio-torneio"
            type="number"
            min="0"
            step="0.01"
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
          <button type="submit" className="botao-enviar" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Criar torneio'}
          </button>
        </div>
      </form>
    </main>
  )
}
