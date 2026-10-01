import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import '../css/criar-torneio.css'
import { useAlerta } from './AlertaModal'

// ============================================================
// REGRAS DE NEGÓCIO: TIERS DE RETENÇÃO DA PLATAFORMA
// - Tier 1: Prêmios até R$ 200,00 -> retém 12%
// - Tier 2: Prêmios entre R$ 201,00 e R$ 1.500,00 -> retém 8%
// - Tier 3: Prêmios acima de R$ 1.500,00 -> retém 5%
// ============================================================
function calcularRetencao(valorInput) {
  const valor = Number(valorInput)
  if (!valorInput || isNaN(valor) || valor <= 0) {
    return null
  }

  let percentual = 12
  let tier = 1

  if (valor > 1500) {
    percentual = 5
    tier = 3
  } else if (valor > 200) {
    percentual = 8
    tier = 2
  }

  const taxaPlataforma = (valor * percentual) / 100
  const premioLiquido = valor - taxaPlataforma

  return {
    tier,
    percentual,
    taxaPlataforma,
    premioLiquido,
  }
}

// ============================================================
// COMPONENTE PRINCIPAL: PAGINA DE CRIACAO DE TORNEIO
// ============================================================

// Opções fixas de horário para manter o formato 24h independente do navegador
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

// Formatos de partida padrao do CS2 (melhor de X mapas)
const FORMATOS = ['Fase de Grupos']

export default function CriarTorneio() {
  const navigate = useNavigate()
  const { mostrarAlerta } = useAlerta()
  const [usuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem('usuarioLogado')
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null
  })

  // Bloqueia acesso direto a rota sem sessao, igual ao CriarEquipe
  useEffect(() => {
    if (!usuario) {
      navigate('/login')
    }
  }, [navigate, usuario])

  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [minuto, setMinuto] = useState('')
  const [formato, setFormato] = useState('')
  const [premio, setPremio] = useState('')
  const retencao = useMemo(() => calcularRetencao(premio), [premio])
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

    if (!usuario) {
      const msg = 'Você precisa estar logado para criar um torneio.'
      setErro(msg)
      mostrarAlerta({
        titulo: 'Acesso Restrito',
        mensagem: msg,
        tipo: 'aviso',
        botaoTexto: 'Fazer Login',
        onConfirmar: () => navigate('/login')
      })
      return
    }

    if (!nome.trim() || !data || !hora || !minuto || !formato || !premio) {
      const msg = 'Preencha todos os campos do torneio antes de prosseguir.'
      setErro(msg)
      mostrarAlerta({
        titulo: 'Campos Incompletos',
        mensagem: msg,
        tipo: 'aviso'
      })
      return
    }

    if (regras.length === 0) {
      const msg = 'Adicione ao menos uma regra antes de continuar.'
      setErro(msg)
      mostrarAlerta({
        titulo: 'Regulamento Necessário',
        mensagem: msg,
        tipo: 'aviso'
      })
      return
    }

    // Formato 24h garantido, sem depender do idioma do navegador
    const dataHora = `${data}T${hora}:${minuto}`
    const bruto = Math.round(Number(premio)) || 0

    const formData = {
      nome: nome.trim(),
      descricao: regras.map((regra) => `- ${regra}`).join('\n'),
      formato,
      data_inicio: dataHora,
      status: true,
      id_criador: usuario.id,
      dinheiro: bruto,
    }

    setEnviando(true)

    // Insere o torneio na tabela torneios
    let idNovoTorneio = null
    try {
      if (supabase) {
        const { data: torneioCriado, error: erroTorneio } = await supabase
          .from('torneios')
          .insert({
            nome: formData.nome,
            descricao: formData.descricao,
            formato: formData.formato,
            data_inicio: formData.data_inicio,
            status: true,
            id_criador: formData.id_criador,
            dinheiro: formData.dinheiro,
          })
          .select()
          .single()

        if (!erroTorneio && torneioCriado?.id) {
          idNovoTorneio = torneioCriado.id
          formData.id = idNovoTorneio
        }
      }
    } catch (errTorneio) {
      console.warn('Erro ao inserir torneio no Supabase:', errTorneio)
    }

    // Logo após a query de insert na tabela torneios obter o novo id da competição,
    // execute uma nova query para inserir na tabela transacoes_plataforma:
    // { id_torneio: idNovoTorneio, valor_bruto: bruto, taxa_retida: taxa, valor_liquido: liquido }
    if (idNovoTorneio) {
      try {
        const ret = calcularRetencao(bruto)
        const taxa = ret ? ret.taxaPlataforma : 0
        const liquido = ret ? ret.premioLiquido : bruto

        await supabase.from('transacoes_plataforma').insert({
          id_torneio: idNovoTorneio,
          valor_bruto: bruto,
          taxa_retida: taxa,
          valor_liquido: liquido,
        })

        // Atualização no banco para somar a taxa_retida ao saldo do usuário Admin principal
        const { data: adminPrincipal } = await supabase
          .from('usuarios')
          .select('id, saldo')
          .eq('admin', true)
          .order('id', { ascending: true })
          .limit(1)
          .single()

        if (adminPrincipal?.id) {
          const saldoAtual = Number(adminPrincipal.saldo) || 0
          const novoSaldo = saldoAtual + Number(taxa)
          await supabase
            .from('usuarios')
            .update({ saldo: novoSaldo })
            .eq('id', adminPrincipal.id)
        }
      } catch (errFinanceiro) {
        console.warn('Erro silencioso ao registrar fluxo financeiro da plataforma:', errFinanceiro)
      }
    }

    setEnviando(false)

    // Armazena temporariamente no localStorage para sincronia de etapas
    localStorage.setItem('dadosTorneioEmCriacao', JSON.stringify(formData))

    window.dispatchEvent(new Event('torneiosAtualizados'))

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
          <label htmlFor="formato-torneio">Formato da partida</label>
          <select
            id="formato-torneio"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
          >
            <option value="">Selecione o formato</option>
            {FORMATOS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="campo-form">
          <label htmlFor="premio-torneio">Premiação / Taxa de Inscrição (R$)</label>
          <input
            id="premio-torneio"
            type="number"
            min="0"
            step="1"
            value={premio}
            onChange={(e) => setPremio(e.target.value)}
            placeholder="Ex: 250"
          />

          {retencao && (
            <div className="calculadora-retencao" aria-live="polite">
              <div className="retencao-linha retencao-linha-taxa">
                <span className="retencao-item-rotulo">
                  <span className="retencao-tier-tag">Tier {retencao.tier}</span>
                  Taxa da plataforma ({retencao.percentual}%):
                </span>
                <strong className="retencao-valor-taxa">
                  -R$ {retencao.taxaPlataforma.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="retencao-divisor" aria-hidden="true" />

              <div className="retencao-linha retencao-linha-liquido">
                <span className="retencao-item-rotulo">
                  <svg className="retencao-icone" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                  </svg>
                  Prêmio repassado ao vencedor:
                </span>
                <strong className="retencao-valor-liquido">
                  R$ {retencao.premioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          )}
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
                  placeholder="Ex: Melhor de 3"
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
