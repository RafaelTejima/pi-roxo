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

            const membros = (encontrada.jogadores || []).map((j, idx) => ({
              id: j.id || `jog-${idx}`,
              funcao: j.role === 'captain' || j.funcao === 'capitao' || idx === 0 ? 'capitao' : 'jogador',
              nome: j.nome || j.email || 'Jogador'
            }))
            setIntegrantes(membros)
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

      // 3. Procurar no Supabase
      try {
        if (supabase) {
          const { data: timeEncontrado, error: erroTime } = await supabase
            .from('times')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (!erroTime && timeEncontrado) {
            const { data: linhas } = await supabase
              .from('times_integrantes')
              .select('id, id_usuario, funcao')
              .eq('id_time', id)

            const idsUsuarios = [...new Set((linhas || []).map((l) => l.id_usuario))]
            const { data: usuariosEncontrados } = idsUsuarios.length
              ? await supabase.from('usuarios').select('id, nome, nome_usuario').in('id', idsUsuarios)
              : { data: [] }

            const integrantesCompletos = (linhas || []).map((linha) => {
              const usuarioDoTime = usuariosEncontrados?.find((u) => u.id === linha.id_usuario)
              return {
                id: linha.id,
                funcao: linha.funcao,
                nome: usuarioDoTime?.nome_usuario || usuarioDoTime?.nome || 'Jogador desconhecido'
              }
            })

            setTime(timeEncontrado)
            setIntegrantes(integrantesCompletos)
            setCarregando(false)
            return
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

  const capitao = integrantes.find((i) => i.funcao === 'capitao' || i.role === 'captain')
  const jogadores = integrantes.filter((i) => i.funcao !== 'capitao' && i.role !== 'captain')
  const ehCapitao = Boolean(
    usuario &&
    time &&
    (
      usuario.id === time.id_capitao ||
      usuario.nome === time.capitao ||
      usuario.email === time.capitao ||
      integrantes.some(
        (i) =>
          (i.funcao === 'capitao' || i.role === 'captain') &&
          (i.id === usuario.id || i.nome === usuario.nome || i.nome === usuario.email)
      )
    )
  )

  return (
    <main id="pagina-detalhes-time">
      <Link to="/equipes" className="detalhes-time-voltar">&larr; Voltar para Equipes</Link>

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
          {ehCapitao && (
            <button type="button" className="detalhes-time-editar-btn">
              Editar time
            </button>
          )}
        </div>
      </section>

      {time.descricao && (
        <section className="detalhes-time-secao">
          <h2>Descrição</h2>
          <p>{time.descricao}</p>
        </section>
      )}

      <section className="detalhes-time-secao">
        <h2>Line-up ({integrantes.length}/5)</h2>

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
            </div>
          ))}
        </div>

        {jogadores.length === 0 && (
          <p className="detalhes-time-aviso">Este time ainda não tem jogadores além do capitão.</p>
        )}
      </section>
    </main>
  )
}
