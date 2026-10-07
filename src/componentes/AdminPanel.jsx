import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { supabase } from '../supabase.js';
import '../css/admin.css';
import { useAlerta } from './AlertaModal';
import { calcularRetencao } from '../utils/financeiro.js';

// Tabelas conhecidas do projeto, com nome amigável e colunas relevantes
const TABELAS_CONHECIDAS = [
  { nome: 'usuarios',    label: 'Usuários',    icone: 'U', descricao: 'Contas cadastradas na plataforma' },
  { nome: 'times',             label: 'Times',               icone: 'T',  descricao: 'Times registrados pelos usuários' },
  { nome: 'times_integrantes', label: 'Integrantes de Times',icone: 'TI', descricao: 'Roster e funções dos jogadores em cada time' },
  { nome: 'torneios',          label: 'Torneios',            icone: 'C',  descricao: 'Campeonatos criados na plataforma' },
  { nome: 'transacoes_plataforma', label: 'Transações da Plataforma', icone: '$', descricao: 'Retenções financeiras e repasses de torneios' },
  { nome: 'mapas',             label: 'Mapas',               icone: 'M',  descricao: 'Mapas de CS2 disponiveis' },
  { nome: 'partidas',          label: 'Partidas',            icone: 'P',  descricao: 'Partidas e confrontos do bracket' },
  { nome: 'inscricoes',        label: 'Inscrições',          icone: 'I',  descricao: 'Inscrições de times em torneios' },
];

// Colunas que nunca devem ser exibidas por segurança
const COLUNAS_OCULTAS = ['password', 'hash', 'token', 'secret'];

function ocultarColuna(col) {
  return COLUNAS_OCULTAS.some((c) => col.toLowerCase().includes(c));
}

function formatarValor(valor) {
  if (valor === null || valor === undefined) return <span className="admin-null">null</span>;
  if (typeof valor === 'boolean') return <span className={`admin-badge ${valor ? 'admin-badge--sim' : 'admin-badge--nao'}`}>{valor ? 'SIM' : 'NAO'}</span>;
  if (typeof valor === 'object') return <span className="admin-json">{JSON.stringify(valor)}</span>;
  const str = String(valor);
  if (str.length > 80) return <span title={str}>{str.slice(0, 80)}…</span>;
  return str;
}

function formatarDataHora(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function formatarMoeda(val) {
  return Number(val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// ----- Componente de seção de tabela -----
function SecaoTabela({ tabela, usuarioLogado }) {
  const { mostrarAlerta } = useAlerta();
  const cacheKey = `cache_admin_tab_${tabela.nome}_v1`;
  const [dados, setDados] = useState(() => {
    try {
      const salvo = localStorage.getItem(cacheKey);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const salvo = localStorage.getItem(cacheKey);
      return !salvo || JSON.parse(salvo).length === 0;
    } catch {
      return true;
    }
  });
  const [erro, setErro] = useState('');
  const [aberta, setAberta] = useState(true);
  const [busca, setBusca] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [camposEdicao, setCamposEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [confirmandoDelete, setConfirmandoDelete] = useState(null);

  useEffect(() => {
    async function buscarDados() {
      setLoading((atual) => (dados.length === 0 ? true : atual));
      setErro('');
      try {
        let res;
        if (tabela.nome === 'partidas') {
          // Busca partidas com dados relacionais dos times participantes
          res = await supabase
            .from('partidas')
            .select('*, time1:time1_id(id, nome, tag), time2:time2_id(id, nome, tag)')
            .order('id', { ascending: false })
            .limit(100);

          if (res.error) {
            console.warn('Fallback para busca simples de partidas sem join:', res.error);
            res = await supabase.from('partidas').select('*').order('id', { ascending: false }).limit(100);
          }
        } else if (tabela.nome === 'inscricoes') {
          // Busca inscrições com dados relacionais de torneio, time e usuário
          res = await supabase
            .from('inscricoes')
            .select('*, torneio:id_torneio(id, nome), time:id_time(id, nome, tag), usuario:id_usuario_inscritor(id, nome, nome_usuario)')
            .order('id', { ascending: false })
            .limit(100);

          if (res.error) {
            console.warn('Fallback para busca simples de inscricoes sem join:', res.error);
            res = await supabase.from('inscricoes').select('*').order('id', { ascending: false }).limit(100);
          }
        } else if (tabela.nome === 'transacoes_plataforma') {
          // Busca transações da plataforma com dados relacionais do torneio
          res = await supabase
            .from('transacoes_plataforma')
            .select('*, torneio:id_torneio(id, nome)')
            .order('id', { ascending: false })
            .limit(100);

          if (res.error) {
            console.warn('Fallback para busca simples de transacoes_plataforma sem join:', res.error);
            res = await supabase.from('transacoes_plataforma').select('*').order('id', { ascending: false }).limit(100);
          }
        } else {
          res = await supabase.from(tabela.nome).select('*').limit(100);
        }

        const { data, error } = res;
        if (error) {
          if (error.code === '42P01') {
            setErro('TABELA_INEXISTENTE');
          } else {
            if (dados.length === 0) {
              setErro(error.message);
            }
          }
        } else {
          let dadosProcessados = [];
          if (tabela.nome === 'partidas' && Array.isArray(data)) {
            dadosProcessados = data.map((p) => {
              const t1 = p.time1
                ? `[${p.time1.tag || 'TAG'}] ${p.time1.nome || ''}`.trim()
                : (p.time1_id ? `Time #${p.time1_id}` : '-');
              const t2 = p.time2
                ? `[${p.time2.tag || 'TAG'}] ${p.time2.nome || ''}`.trim()
                : (p.time2_id ? `Time #${p.time2_id}` : '-');
              const { time1, time2, ...resto } = p;
              return {
                ...resto,
                time_1: t1,
                time_2: t2
              };
            });
          } else if (tabela.nome === 'inscricoes' && Array.isArray(data)) {
            dadosProcessados = data.map((i) => {
              const tor = i.torneio?.nome || (i.id_torneio ? `Torneio #${i.id_torneio}` : '-');
              const tm = i.time ? `[${i.time.tag || 'TAG'}] ${i.time.nome || ''}`.trim() : (i.id_time ? `Time #${i.id_time}` : '-');
              const usr = i.usuario?.nome_usuario || i.usuario?.nome || (i.id_usuario_inscritor ? `Usuário #${i.id_usuario_inscritor}` : '-');
              const { torneio, time, usuario, ...resto } = i;
              return {
                ...resto,
                torneio_nome: tor,
                time_nome: tm,
                usuario_nome: usr
              };
            });
          } else if (tabela.nome === 'transacoes_plataforma' && Array.isArray(data)) {
            dadosProcessados = data.map((t) => {
              const tor = t.torneio?.nome || (t.id_torneio ? `Torneio #${t.id_torneio}` : '-');
              const { torneio, ...resto } = t;
              return {
                ...resto,
                torneio_nome: tor
              };
            });
          } else {
            dadosProcessados = data || [];
          }

          setDados(dadosProcessados);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(dadosProcessados));
          } catch {}
        }
      } catch (err) {
        console.error(`Erro ao carregar tabela ${tabela.nome}:`, err);
        if (dados.length === 0) {
          setErro(err.message || 'Erro inesperado ao carregar dados');
        }
      } finally {
        setLoading(false);
      }
    }
    buscarDados();
  }, [tabela.nome, cacheKey, dados.length]);

  // Tabela inexistente: não renderiza nada
  if (!loading && erro === 'TABELA_INEXISTENTE') return null;

  const colunas = dados.length > 0
    ? Object.keys(dados[0]).filter((col) => !ocultarColuna(col))
    : [];

  const dadosFiltrados = busca.trim() === ''
    ? dados
    : dados.filter((linha) =>
        Object.values(linha).some((v) =>
          String(v).toLowerCase().includes(busca.toLowerCase())
        )
      );

  // ---- Editar ----
  function iniciarEdicao(linha) {
    setEditandoId(linha.id ?? null);
    const campos = {};
    colunas.forEach((col) => { campos[col] = linha[col] ?? ''; });
    setCamposEdicao(campos);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setCamposEdicao({});
  }

  async function salvarEdicao(linhaId) {
    setSalvando(true);
    
    const payload = { ...camposEdicao };
    // Remover propriedades computadas/virtuais antes de enviar ao banco
    delete payload.time_1;
    delete payload.time_2;
    delete payload.time1;
    delete payload.time2;
    delete payload.torneio_nome;
    delete payload.time_nome;
    delete payload.usuario_nome;
    delete payload.torneio;
    delete payload.time;
    delete payload.usuario;

    Object.keys(payload).forEach(key => {
      if (payload[key] === '') {
        payload[key] = null;
      } else if (key.endsWith('_id') || key.startsWith('id_') || key === 'dinheiro' || key === 'saldo' || key === 'valor_bruto' || key === 'taxa_retida' || key === 'valor_liquido') {
        if (!isNaN(Number(payload[key])) && payload[key] !== null) {
          payload[key] = Number(payload[key]);
        }
      }
    });

    const { error } = await supabase
      .from(tabela.nome)
      .update(payload)
      .eq('id', linhaId);
    setSalvando(false);
    if (error) {
      mostrarAlerta({
        titulo: 'Erro ao Salvar',
        mensagem: 'Erro ao salvar alterações: ' + error.message,
        tipo: 'erro'
      });
    } else {
      setDados((prev) =>
        prev.map((l) => (l.id === linhaId ? { ...l, ...camposEdicao } : l))
      );
      cancelarEdicao();
      mostrarAlerta({
        titulo: 'Alteração Salva',
        mensagem: 'Registro atualizado com sucesso na tabela ' + tabela.label + '.',
        tipo: 'sucesso'
      });
    }
  }

  // ---- Deletar ----
  async function confirmarDelete(linha) {
    if (!linha.id) {
      mostrarAlerta({
        titulo: 'Aviso',
        mensagem: 'Este registro não possui ID, não é possível deletar.',
        tipo: 'aviso'
      });
      return;
    }
    if (tabela.nome === 'usuarios' && linha.id === usuarioLogado?.id) {
      mostrarAlerta({
        titulo: 'Ação Bloqueada',
        mensagem: 'Você não pode deletar a sua própria conta de administrador.',
        tipo: 'erro'
      });
      setConfirmandoDelete(null);
      return;
    }
    const { error } = await supabase.from(tabela.nome).delete().eq('id', linha.id);
    if (error) {
      mostrarAlerta({
        titulo: 'Erro ao Deletar',
        mensagem: 'Erro ao deletar registro: ' + error.message,
        tipo: 'erro'
      });
    } else {
      setDados((prev) => prev.filter((l) => l.id !== linha.id));

      if (tabela.nome === 'times') {
        window.dispatchEvent(new Event('equipesAtualizadas'));
        window.dispatchEvent(new Event('storage'));
      }

      if (tabela.nome === 'usuarios') {
        try {
          const salvas = localStorage.getItem('listaAmigosUsuario');
          if (salvas) {
            const lista = JSON.parse(salvas);
            localStorage.setItem('listaAmigosUsuario', JSON.stringify(lista.filter((a) => String(a.id) !== String(linha.id))));
          }
          const salvasP = localStorage.getItem('listaAmigosPerfil');
          if (salvasP) {
            const listaP = JSON.parse(salvasP);
            localStorage.setItem('listaAmigosPerfil', JSON.stringify(listaP.filter((a) => String(a.id) !== String(linha.id))));
          }
        } catch {}
        // Limpa amizades órfãs no Supabase vinculadas ao usuário deletado
        supabase.from('amizades').delete().or(`id_usuario1.eq.${linha.id},id_usuario2.eq.${linha.id}`).then(() => {}).catch(() => {});
        window.dispatchEvent(new Event('amigosAtualizados'));
        window.dispatchEvent(new Event('storage'));
      }

      mostrarAlerta({
        titulo: 'Registro Removido',
        mensagem: 'O registro foi excluído com sucesso.',
        tipo: 'sucesso'
      });
    }
    setConfirmandoDelete(null);
  }

  return (
    <section className="admin-secao">
      {/* Cabeçalho da seção */}
      <button
        className="admin-secao-header"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
      >
        <div className="admin-secao-header-esq">
          <span className="admin-icone-tabela">{tabela.icone}</span>
          <div>
            <h2 className="admin-secao-titulo">{tabela.label}</h2>
            <p className="admin-secao-desc">{tabela.descricao}</p>
          </div>
        </div>
        <div className="admin-secao-header-dir">
          {!loading && !erro && (
            <span className="admin-badge admin-badge--count">{dados.length} registros</span>
          )}
          <span className={`admin-chevron ${aberta ? 'aberto' : ''}`} aria-hidden="true">▼</span>
        </div>
      </button>

      {aberta && (
        <div className="admin-secao-corpo">
          {loading && (
            <div className="admin-estado">
              <div className="admin-spinner" aria-label="Carregando..."></div>
              <p>Carregando {tabela.label}...</p>
            </div>
          )}

          {!loading && erro && (
            <div className="admin-estado admin-estado--erro">
              <p>Erro ao carregar tabela: {erro}</p>
            </div>
          )}

          {!loading && !erro && dados.length === 0 && (
            <div className="admin-estado">
              <p>Nenhum registro encontrado nesta tabela.</p>
            </div>
          )}

          {!loading && !erro && dados.length > 0 && (
            <>
              <div className="admin-tabela-toolbar">
                <input
                  className="admin-busca"
                  type="search"
                  placeholder={`Buscar em ${tabela.label}...`}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  aria-label={`Buscar em ${tabela.label}`}
                />
                <span className="admin-contagem">
                  {dadosFiltrados.length} de {dados.length}
                </span>
              </div>

              <div className="admin-tabela-wrapper">
                <table className="admin-tabela" id={`tabela-${tabela.nome}`}>
                  <thead>
                    <tr>
                      {colunas.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                      <th className="admin-col-acoes">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosFiltrados.map((linha, idx) => {
                      const linhaId = linha.id ?? idx;
                      const estaEditando = editandoId === linhaId && linha.id !== undefined;
                      return (
                        <tr key={linhaId} className={estaEditando ? 'admin-linha-editando' : ''}>
                          {colunas.map((col) => (
                            <td key={col}>
                              {estaEditando && col !== 'id' ? (
                                (col === 'time_1' || col === 'time_2' || col === 'torneio_nome' || col === 'time_nome' || col === 'usuario_nome') ? (
                                  <span className="admin-badge admin-badge--count" title="Calculado via chave estrangeira relacional">
                                    {linha[col] || '-'}
                                  </span>
                                ) : col === 'admin' || col.toLowerCase().includes('status') ? (
                                  <label className="admin-switch">
                                    <input
                                      type="checkbox"
                                      checked={camposEdicao[col] === true || camposEdicao[col] === 'true'}
                                      onChange={(e) => {
                                        if (col === 'admin' && tabela.nome === 'usuarios' && linha.id === usuarioLogado?.id && !e.target.checked) {
                                          mostrarAlerta({
                                            titulo: 'Ação Bloqueada',
                                            mensagem: 'Você não pode remover seu próprio acesso de administrador.',
                                            tipo: 'erro'
                                          });
                                          return;
                                        }
                                        setCamposEdicao((prev) => ({ ...prev, [col]: e.target.checked }));
                                      }}
                                      disabled={col === 'admin' && tabela.nome === 'usuarios' && linha.id === usuarioLogado?.id}
                                    />
                                    <span className="admin-slider"></span>
                                  </label>
                                ) : (
                                  <input
                                    className="admin-input-edicao"
                                    value={camposEdicao[col] ?? ''}
                                    onChange={(e) =>
                                      setCamposEdicao((prev) => ({ ...prev, [col]: e.target.value }))
                                    }
                                    aria-label={`Editar campo ${col}`}
                                  />
                                )
                              ) : (
                                formatarValor(linha[col])
                              )}
                            </td>
                          ))}
                          <td className="admin-col-acoes">
                            {confirmandoDelete === linhaId ? (
                              <div className="admin-confirm-delete">
                                <span>Confirmar?</span>
                                <button
                                  className="admin-btn admin-btn--deletar"
                                  onClick={() => confirmarDelete(linha)}
                                >
                                  Sim
                                </button>
                                <button
                                  className="admin-btn admin-btn--cancelar"
                                  onClick={() => setConfirmandoDelete(null)}
                                >
                                  Nao
                                </button>
                              </div>
                            ) : estaEditando ? (
                              <div className="admin-acoes">
                                <button
                                  className="admin-btn admin-btn--salvar"
                                  onClick={() => salvarEdicao(linhaId)}
                                  disabled={salvando}
                                >
                                  {salvando ? '...' : 'Salvar'}
                                </button>
                                <button
                                  className="admin-btn admin-btn--cancelar"
                                  onClick={cancelarEdicao}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="admin-acoes">
                                {linha.id !== undefined && (
                                  <button
                                    className="admin-btn admin-btn--editar"
                                    onClick={() => iniciarEdicao(linha)}
                                  >
                                    Editar
                                  </button>
                                )}
                                <button
                                  className="admin-btn admin-btn--deletar"
                                  onClick={() => setConfirmandoDelete(linhaId)}
                                  disabled={tabela.nome === 'usuarios' && linha.id === usuarioLogado?.id}
                                >
                                  Deletar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

// ----- Helpers e Componente do Gráfico Analítico de Receitas -----
function getChaveData(d) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarDataEixo(chaveData) {
  if (!chaveData) return '';
  const partes = chaveData.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}`;
  }
  return chaveData;
}

function formatarDataTooltip(chaveData) {
  if (!chaveData) return '';
  const partes = chaveData.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return chaveData;
}

function CustomTooltipGrafico({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload || {};
    const valor = payload[0].value ?? 0;
    return (
      <div className="admin-grafico-tooltip">
        <div className="admin-grafico-tooltip-header">
          <span className="admin-grafico-tooltip-dot" />
          <span className="admin-grafico-tooltip-data">
            {item.dataCompleta || label}
          </span>
        </div>
        <div className="admin-grafico-tooltip-body">
          <div className="admin-grafico-tooltip-row">
            <span className="admin-grafico-tooltip-label">Taxa Retida:</span>
            <strong className="admin-grafico-tooltip-valor">
              {formatarMoeda(valor)}
            </strong>
          </div>
          {item.bruto > 0 && (
            <div className="admin-grafico-tooltip-row admin-grafico-tooltip-row--secundaria">
              <span className="admin-grafico-tooltip-label-sub">Volume Bruto:</span>
              <span className="admin-grafico-tooltip-valor-sub">
                {formatarMoeda(item.bruto)}
              </span>
            </div>
          )}
          {item.transacoesQtd > 0 && (
            <div className="admin-grafico-tooltip-qtd">
              {item.transacoesQtd} {item.transacoesQtd === 1 ? 'transação' : 'transações'} no dia
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

const FILTROS_GRAFICO = [
  { id: '7d', rotulo: 'Últimos 7 Dias' },
  { id: '30d', rotulo: 'Últimos 30 Dias' },
  { id: 'mes', rotulo: 'Este Mês' },
  { id: 'tudo', rotulo: 'Tudo' },
];

function GraficoReceitas({ transacoes = [], loading = false }) {
  const [filtro, setFiltro] = useState('30d');

  const dadosGrafico = useMemo(() => {
    try {
      if (!Array.isArray(transacoes)) return [];

      const hoje = new Date();
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);

      // Transações válidas com timestamp
      const transacoesValidas = transacoes
        .map((t) => {
          const raw = t?.registro;
          if (!raw) return null;
          const d = new Date(raw);
          if (isNaN(d.getTime())) return null;
          return {
            data: d,
            chaveData: getChaveData(d),
            taxa: Number(t.taxa_retida) || 0,
            bruto: Number(t.valor_bruto) || 0,
          };
        })
        .filter(Boolean);

      if (filtro === '7d') {
        const buckets = [];
        const mapa = new Map();

        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
          const chave = getChaveData(d);
          buckets.push(chave);
          mapa.set(chave, {
            dataKey: chave,
            dataExibicao: formatarDataEixo(chave),
            dataCompleta: formatarDataTooltip(chave),
            valor: 0,
            bruto: 0,
            transacoesQtd: 0,
          });
        }

        const inicio7d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6, 0, 0, 0, 0);

        transacoesValidas.forEach((t) => {
          if (t.data >= inicio7d && t.data <= fimHoje) {
            const item = mapa.get(t.chaveData);
            if (item) {
              item.valor = Number((item.valor + t.taxa).toFixed(2));
              item.bruto = Number((item.bruto + t.bruto).toFixed(2));
              item.transacoesQtd += 1;
            }
          }
        });

        return buckets.map((k) => mapa.get(k));
      }

      if (filtro === '30d') {
        const buckets = [];
        const mapa = new Map();

        for (let i = 29; i >= 0; i--) {
          const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
          const chave = getChaveData(d);
          buckets.push(chave);
          mapa.set(chave, {
            dataKey: chave,
            dataExibicao: formatarDataEixo(chave),
            dataCompleta: formatarDataTooltip(chave),
            valor: 0,
            bruto: 0,
            transacoesQtd: 0,
          });
        }

        const inicio30d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29, 0, 0, 0, 0);

        transacoesValidas.forEach((t) => {
          if (t.data >= inicio30d && t.data <= fimHoje) {
            const item = mapa.get(t.chaveData);
            if (item) {
              item.valor = Number((item.valor + t.taxa).toFixed(2));
              item.bruto = Number((item.bruto + t.bruto).toFixed(2));
              item.transacoesQtd += 1;
            }
          }
        });

        return buckets.map((k) => mapa.get(k));
      }

      if (filtro === 'mes') {
        const buckets = [];
        const mapa = new Map();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        const diasAteHoje = Math.max(hoje.getDate(), 1);
        const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
        const limiteDias = Math.min(Math.max(diasAteHoje, 7), ultimoDiaMes);

        for (let dia = 1; dia <= limiteDias; dia++) {
          const d = new Date(anoAtual, mesAtual, dia);
          const chave = getChaveData(d);
          buckets.push(chave);
          mapa.set(chave, {
            dataKey: chave,
            dataExibicao: formatarDataEixo(chave),
            dataCompleta: formatarDataTooltip(chave),
            valor: 0,
            bruto: 0,
            transacoesQtd: 0,
          });
        }

        const inicioMes = new Date(anoAtual, mesAtual, 1, 0, 0, 0, 0);

        transacoesValidas.forEach((t) => {
          if (t.data >= inicioMes && t.data <= fimHoje) {
            const item = mapa.get(t.chaveData);
            if (item) {
              item.valor = Number((item.valor + t.taxa).toFixed(2));
              item.bruto = Number((item.bruto + t.bruto).toFixed(2));
              item.transacoesQtd += 1;
            }
          }
        });

        return buckets.map((k) => mapa.get(k));
      }

      if (filtro === 'tudo') {
        if (transacoesValidas.length === 0) {
          return [];
        }

        const mapa = new Map();
        transacoesValidas.forEach((t) => {
          if (!mapa.has(t.chaveData)) {
            mapa.set(t.chaveData, {
              dataKey: t.chaveData,
              dataExibicao: formatarDataEixo(t.chaveData),
              dataCompleta: formatarDataTooltip(t.chaveData),
              valor: 0,
              bruto: 0,
              transacoesQtd: 0,
              timestamp: new Date(t.chaveData + 'T00:00:00').getTime(),
            });
          }
          const item = mapa.get(t.chaveData);
          item.valor = Number((item.valor + t.taxa).toFixed(2));
          item.bruto = Number((item.bruto + t.bruto).toFixed(2));
          item.transacoesQtd += 1;
        });

        const ordenados = Array.from(mapa.values()).sort((a, b) => a.timestamp - b.timestamp);

        // Se houver somente 1 dia registrado, inclui um ponto anterior zerado para traçar uma área elegante
        if (ordenados.length === 1) {
          const pontoUnico = ordenados[0];
          const dataAnterior = new Date(pontoUnico.timestamp);
          dataAnterior.setDate(dataAnterior.getDate() - 1);
          const chaveAnt = getChaveData(dataAnterior);
          return [
            {
              dataKey: chaveAnt,
              dataExibicao: formatarDataEixo(chaveAnt),
              dataCompleta: formatarDataTooltip(chaveAnt),
              valor: 0,
              bruto: 0,
              transacoesQtd: 0,
            },
            pontoUnico,
          ];
        }

        return ordenados;
      }

      return [];
    } catch (err) {
      console.error('Falha ao processar dados do gráfico financeiro:', err);
      return [];
    }
  }, [transacoes, filtro]);

  // Totais e métricas calculados em tempo real de acordo com o filtro selecionado
  const totalReceitaPeriodo = useMemo(() => {
    return dadosGrafico.reduce((acc, item) => acc + (item.valor || 0), 0);
  }, [dadosGrafico]);

  const totalBrutoPeriodo = useMemo(() => {
    return dadosGrafico.reduce((acc, item) => acc + (item.bruto || 0), 0);
  }, [dadosGrafico]);

  const totalTransacoesPeriodo = useMemo(() => {
    return dadosGrafico.reduce((acc, item) => acc + (item.transacoesQtd || 0), 0);
  }, [dadosGrafico]);

  const mediaDiaria = useMemo(() => {
    if (!dadosGrafico || dadosGrafico.length === 0) return 0;
    return totalReceitaPeriodo / dadosGrafico.length;
  }, [dadosGrafico, totalReceitaPeriodo]);

  const temDadosReais = totalReceitaPeriodo > 0 || totalTransacoesPeriodo > 0;

  return (
    <div className="admin-secao admin-secao-grafico">
      {/* Topo do Gráfico: Título, Métricas Rápidas e Filtros */}
      <div className="admin-grafico-topo">
        <div className="admin-grafico-info">
          <div className="admin-grafico-badge-wrap">
            <span className="admin-grafico-badge-radar">
              <span className="admin-grafico-radar-pulse" />
              FLUXO FINANCEIRO
            </span>
            <span className="admin-grafico-badge-sub">MÉTRICA ANALÍTICA</span>
          </div>
          <h2 className="admin-grafico-titulo">Desempenho de Receitas da Plataforma</h2>
          <p className="admin-grafico-descricao">
            Evolução temporal da taxa retida (<span className="admin-grafico-destaque-campo">taxa_retida</span>) agrupada por data de registro
          </p>
        </div>

        {/* Botões de Filtros Dinâmicos */}
        <div className="admin-grafico-filtros-wrap">
          <span className="admin-grafico-filtro-label">Período:</span>
          <div className="admin-grafico-filtros" role="group" aria-label="Filtro de período do gráfico">
            {FILTROS_GRAFICO.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`admin-grafico-btn-filtro ${filtro === f.id ? 'admin-grafico-btn-filtro--ativo' : ''}`}
                onClick={() => setFiltro(f.id)}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de Resumo Dinâmico do Período */}
      <div className="admin-grafico-resumo-bar">
        <div className="admin-grafico-kpi">
          <span className="admin-grafico-kpi-label">Receita Retida no Período</span>
          <strong className="admin-grafico-kpi-valor neon-roxo">
            {formatarMoeda(totalReceitaPeriodo)}
          </strong>
        </div>
        <div className="admin-grafico-kpi-divisor" />
        <div className="admin-grafico-kpi">
          <span className="admin-grafico-kpi-label">Média Diária Estimada</span>
          <strong className="admin-grafico-kpi-valor">
            {formatarMoeda(mediaDiaria)}
          </strong>
        </div>
        <div className="admin-grafico-kpi-divisor" />
        <div className="admin-grafico-kpi">
          <span className="admin-grafico-kpi-label">Volume Bruto Movimentado</span>
          <strong className="admin-grafico-kpi-valor">
            {formatarMoeda(totalBrutoPeriodo)}
          </strong>
        </div>
        <div className="admin-grafico-kpi-divisor" />
        <div className="admin-grafico-kpi">
          <span className="admin-grafico-kpi-label">Transações Computadas</span>
          <strong className="admin-grafico-kpi-valor">
            {totalTransacoesPeriodo}
          </strong>
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="admin-grafico-area">
        {loading ? (
          <div className="admin-grafico-estado">
            <div className="admin-spinner" />
            <span>Processando dados analíticos do gráfico...</span>
          </div>
        ) : dadosGrafico.length === 0 ? (
          <div className="admin-grafico-estado admin-grafico-estado--vazio">
            <span className="admin-grafico-vazio-aviso">Sem dados disponíveis</span>
            <p>Nenhuma transação financeira encontrada para o período selecionado.</p>
          </div>
        ) : (
          <div className="admin-grafico-container-canvas">
            {!temDadosReais && (
              <div className="admin-grafico-aviso-zero">
                <span>Nenhuma retenção registrada no intervalo selecionado (curva zerada).</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={dadosGrafico}
                margin={{ top: 18, right: 24, left: 16, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="corGradienteReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b565f2" stopOpacity={0.45} />
                    <stop offset="50%" stopColor="#b565f2" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#b565f2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(157, 78, 221, 0.12)"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="dataExibicao"
                  stroke="rgba(168, 162, 185, 0.35)"
                  tick={{ fill: '#a8a2b9', fontSize: 11, fontFamily: 'inherit' }}
                  tickLine={{ stroke: 'rgba(157, 78, 221, 0.25)' }}
                  axisLine={{ stroke: 'rgba(157, 78, 221, 0.25)' }}
                  minTickGap={20}
                  dy={6}
                />
                <YAxis
                  stroke="rgba(168, 162, 185, 0.35)"
                  tick={{ fill: '#a8a2b9', fontSize: 11, fontFamily: 'inherit' }}
                  tickLine={{ stroke: 'rgba(157, 78, 221, 0.25)' }}
                  axisLine={{ stroke: 'rgba(157, 78, 221, 0.25)' }}
                  tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                  width={80}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={<CustomTooltipGrafico />}
                  cursor={{
                    stroke: 'rgba(181, 101, 242, 0.55)',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 4',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Taxa Retida"
                  stroke="#b565f2"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#corGradienteReceita)"
                  activeDot={{
                    r: 6,
                    fill: '#b565f2',
                    stroke: '#0e081c',
                    strokeWidth: 2,
                  }}
                  dot={
                    dadosGrafico.length <= 15
                      ? { r: 3.5, fill: '#b565f2', stroke: '#0e081c', strokeWidth: 1.5 }
                      : false
                  }
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ----- Seção Financeira Restrita (Receitas & Transações) -----
const CACHE_ADMIN_TRANSACOES = 'cache_admin_transacoes_v1';
const CACHE_ADMIN_SALDO = 'cache_admin_saldo_v1';
const CACHE_ADMIN_PRINCIPAL = 'cache_admin_principal_v1';

function SecaoFinanceiro({ usuarioLogado }) {
  const [transacoes, setTransacoes] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_ADMIN_TRANSACOES);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });
  const [saldoAdmin, setSaldoAdmin] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_ADMIN_SALDO);
      return salvo ? Number(salvo) : 0;
    } catch {
      return 0;
    }
  });
  const [adminPrincipal, setAdminPrincipal] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_ADMIN_PRINCIPAL);
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const salvo = localStorage.getItem(CACHE_ADMIN_TRANSACOES);
      return !salvo || JSON.parse(salvo).length === 0;
    } catch {
      return true;
    }
  });
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  const carregarFinanceiro = async () => {
    setLoading((atual) => (transacoes.length === 0 ? true : atual));
    setErro('');

    try {
      // 1. Requisição para a tabela usuarios para obter a receita total (saldo do Admin principal)
      const { data: adminData, error: adminErr } = await supabase
        .from('usuarios')
        .select('id, nome, email, saldo')
        .eq('admin', true)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!adminErr && adminData) {
        setSaldoAdmin(Number(adminData.saldo) || 0);
        setAdminPrincipal(adminData);
        try {
          localStorage.setItem(CACHE_ADMIN_SALDO, String(Number(adminData.saldo) || 0));
          localStorage.setItem(CACHE_ADMIN_PRINCIPAL, JSON.stringify(adminData));
        } catch {}
      }

      // 2. Histórico de Transações: consulta cirúrgica com join relacional e limite
      let res = await supabase
        .from('transacoes_plataforma')
        .select('id, id_torneio, valor_bruto, taxa_retida, valor_liquido, status, registro, torneio:id_torneio(id, nome)')
        .order('id', { ascending: false })
        .limit(150);

      if (res.error) {
        console.warn('Fallback para busca simples em transacoes_plataforma:', res.error);
        res = await supabase
          .from('transacoes_plataforma')
          .select('id, id_torneio, valor_bruto, taxa_retida, valor_liquido, status, registro')
          .order('id', { ascending: false })
          .limit(150);
      }

      if (res.error) {
        if (transacoes.length === 0) {
          setErro(res.error.message);
        }
      } else {
        let lista = res.data || [];

        // Fallback de integridade: se algum registro não tiver o nome do torneio carregado
        const semNome = lista.filter((t) => !t.torneio?.nome && t.id_torneio);
        if (semNome.length > 0) {
          const idsBusca = [...new Set(semNome.map((t) => t.id_torneio))];
          const { data: torneiosDados } = await supabase
            .from('torneios')
            .select('id, nome')
            .in('id', idsBusca);

          if (torneiosDados) {
            const mapaNomes = new Map(torneiosDados.map((tor) => [tor.id, tor]));
            lista = lista.map((t) => ({
              ...t,
              torneio: t.torneio?.nome ? t.torneio : (mapaNomes.get(t.id_torneio) || t.torneio)
            }));
          }
        }

        setTransacoes(lista);
        try {
          localStorage.setItem(CACHE_ADMIN_TRANSACOES, JSON.stringify(lista));
        } catch {}
      }
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      if (transacoes.length === 0) {
        setErro('Não foi possível carregar os dados financeiros.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sincronizarTorneiosPendentes = async () => {
    try {
      // Identifica torneios finalizados que ainda não têm transação registrada
      const { data: torneiosFinalizados, error: errTor } = await supabase
        .from('torneios')
        .select('id, nome, dinheiro, status, id_time_vencedor')
        .not('id_time_vencedor', 'is', null);

      if (errTor || !torneiosFinalizados || torneiosFinalizados.length === 0) return;

      const { data: transacoesExistentes } = await supabase
        .from('transacoes_plataforma')
        .select('id_torneio');

      const idsComTransacao = new Set((transacoesExistentes || []).map((t) => t.id_torneio));
      const torneiosSemTransacao = torneiosFinalizados.filter((tor) => !idsComTransacao.has(tor.id));

      if (torneiosSemTransacao.length === 0) return;

      console.log(`[Financeiro] Sincronizando ${torneiosSemTransacao.length} torneios finalizados pendentes...`);

      for (const tor of torneiosSemTransacao) {
        const { data: inscricoes } = await supabase
          .from('inscricoes')
          .select('id')
          .eq('id_torneio', tor.id);

        const totalTimes = (inscricoes || []).length || 1;
        const bruto = (Number(tor.dinheiro) || 0) * totalTimes;
        const ret = calcularRetencao(bruto);
        const taxa = ret ? ret.taxaPlataforma : 0;
        const liquido = ret ? ret.premioLiquido : bruto;

        await supabase.from('transacoes_plataforma').insert({
          id_torneio: tor.id,
          valor_bruto: bruto,
          taxa_retida: taxa,
          valor_liquido: liquido,
          status: 'PROCESSADO'
        });
      }

      await carregarFinanceiro();
    } catch (e) {
      console.warn('Erro ao sincronizar torneios pendentes:', e);
    }
  };

  useEffect(() => {
    carregarFinanceiro();

    const handleAtualizar = () => {
      carregarFinanceiro();
    };

    window.addEventListener('saldoAtualizado', handleAtualizar);
    window.addEventListener('transacoesAtualizadas', handleAtualizar);
    window.addEventListener('torneiosAtualizados', handleAtualizar);

    return () => {
      window.removeEventListener('saldoAtualizado', handleAtualizar);
      window.removeEventListener('transacoesAtualizadas', handleAtualizar);
      window.removeEventListener('torneiosAtualizados', handleAtualizar);
    };
  }, []);

  // Restrição de segurança: só renderiza se admin for true
  if (!usuarioLogado || (!usuarioLogado.admin && usuarioLogado.admin !== true)) {
    return null;
  }

  const totalRetidoHistorico = transacoes.reduce((acc, t) => acc + (Number(t.taxa_retida) || 0), 0);
  const totalBrutoHistorico = transacoes.reduce((acc, t) => acc + (Number(t.valor_bruto) || 0), 0);
  const totalLiquidoRepassado = transacoes.reduce((acc, t) => acc + (Number(t.valor_liquido) || 0), 0);

  const transacoesFiltradas = transacoes.filter((t) => {
    if (!busca.trim()) return true;
    const termo = busca.toLowerCase();
    const idStr = String(t.id || '');
    const idTorneioStr = String(t.id_torneio || '');
    const nomeTorneio = (t.torneio?.nome || '').toLowerCase();
    const statusStr = (t.status || '').toLowerCase();
    return idStr.includes(termo) || idTorneioStr.includes(termo) || nomeTorneio.includes(termo) || statusStr.includes(termo);
  });

  return (
    <div className="admin-financeiro-container">
      {/* Cards de Métricas Financeiras */}
      <div className="admin-financeiro-grid">
        <div className="admin-card-metrica admin-card-metrica--destaque">
          <div className="admin-metrica-header">
            <span className="admin-metrica-rotulo">Receita Total da Plataforma</span>
            <span className="admin-metrica-tag-live">SALDO ADMIN</span>
          </div>
          <strong className="admin-metrica-valor principal">
            {formatarMoeda(saldoAdmin || totalRetidoHistorico)}
          </strong>
          <small className="admin-metrica-detalhe">
            Carteira da plataforma ({adminPrincipal?.nome || adminPrincipal?.email || 'Admin Principal'})
          </small>
        </div>

        <div className="admin-card-metrica">
          <div className="admin-metrica-header">
            <span className="admin-metrica-rotulo">Total de Taxas Retidas</span>
            <span className="admin-metrica-tag-info">LUCRO RETIDO</span>
          </div>
          <strong className="admin-metrica-valor taxa">
            {formatarMoeda(totalRetidoHistorico)}
          </strong>
          <small className="admin-metrica-detalhe">
            Soma de todas as retenções aplicadas nos torneios
          </small>
        </div>

        <div className="admin-card-metrica">
          <div className="admin-metrica-header">
            <span className="admin-metrica-rotulo">Volume Bruto Movimentado</span>
            <span className="admin-metrica-tag-neutro">PREMIAÇÃO TOTAL</span>
          </div>
          <strong className="admin-metrica-valor">
            {formatarMoeda(totalBrutoHistorico)}
          </strong>
          <small className="admin-metrica-detalhe">
            Total bruto acumulado das premiações
          </small>
        </div>

        <div className="admin-card-metrica">
          <div className="admin-metrica-header">
            <span className="admin-metrica-rotulo">Repassado aos Vencedores</span>
            <span className="admin-metrica-tag-sucesso">LÍQUIDO</span>
          </div>
          <strong className="admin-metrica-valor liquido">
            {formatarMoeda(totalLiquidoRepassado)}
          </strong>
          <small className="admin-metrica-detalhe">
            {transacoes.length} transação(ões) registrada(s)
          </small>
        </div>
      </div>

      {/* Gráfico Analítico de Desempenho de Receitas */}
      <GraficoReceitas transacoes={transacoes} loading={loading} />

      {/* Histórico de Transações */}
      <div className="admin-secao admin-secao-financeiro">
        <div className="admin-secao-header static">
          <div className="admin-secao-titulo-wrap">
            <span className="admin-secao-icone">💳</span>
            <div>
              <h2 className="admin-secao-titulo">Histórico de Transações da Plataforma</h2>
              <span className="admin-secao-descricao">
                Registros de retenções financeiras e valores repassados por torneio
              </span>
            </div>
          </div>
          <div className="admin-secao-acoes">
            <button
              type="button"
              className="admin-btn-recarregar"
              onClick={async () => {
                await sincronizarTorneiosPendentes();
                await carregarFinanceiro();
              }}
              title="Recarregar e sincronizar transações"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="admin-secao-corpo">
          <div className="admin-busca-wrap">
            <input
              type="text"
              placeholder="Buscar por ID, torneio ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="admin-busca-input"
            />
          </div>

          {loading ? (
            <div className="admin-carregando">
              <div className="admin-spinner"></div>
              <span>Carregando histórico financeiro...</span>
            </div>
          ) : erro ? (
            <div className="admin-erro">
              <p>Erro ao carregar transações: {erro}</p>
            </div>
          ) : transacoesFiltradas.length === 0 ? (
            <div className="admin-vazio">
              <p>
                {busca
                  ? 'Nenhuma transação encontrada para esta pesquisa.'
                  : 'Nenhuma transação registrada na tabela transacoes_plataforma até o momento.'}
              </p>
            </div>
          ) : (
            <div className="admin-tabela-scroll">
              <table className="admin-tabela">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Torneio</th>
                    <th>Data</th>
                    <th>Valor Bruto</th>
                    <th>Taxa Retida</th>
                    <th>Valor Líquido</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoesFiltradas.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="admin-id-badge">#{t.id}</span>
                      </td>
                      <td>
                        <strong>{t.torneio?.nome || (t.id_torneio ? `Torneio #${t.id_torneio}` : 'Torneio')}</strong>
                        {t.id_torneio && (
                          <small className="admin-subdado">ID #{t.id_torneio}</small>
                        )}
                      </td>
                      <td>{formatarDataHora(t.registro)}</td>
                      <td>
                        <strong>{formatarMoeda(t.valor_bruto)}</strong>
                      </td>
                      <td>
                        <span className="admin-taxa-badge">
                          +{formatarMoeda(t.taxa_retida)}
                        </span>
                      </td>
                      <td>
                        <span className="admin-liquido-badge">
                          {formatarMoeda(t.valor_liquido)}
                        </span>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge--sim">
                          {t.status || 'PROCESSADO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----- Página principal -----
export default function AdminPanel() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabelasAtivas] = useState(TABELAS_CONHECIDAS);
  const [abaAtiva, setAbaAtiva] = useState('financeiro'); // 'financeiro' | 'tabelas'

  useEffect(() => {
    async function verificarAdmin() {
      const salvo = localStorage.getItem('usuarioLogado');
      if (!salvo) { setVerificando(false); return; }

      try {
        const usuario = JSON.parse(salvo);
        setUsuarioLogado(usuario);

        if (usuario && usuario.admin === true) {
          setIsAdmin(true);
        }

        // Busca o registro atualizado do banco para checar admin
        if (usuario && usuario.id) {
          const { data } = await supabase
            .from('usuarios')
            .select('admin, nome, email, senha')
            .eq('id', usuario.id)
            .single();

          if (data && data.admin === true) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar permissões de admin:', err);
      }
      setVerificando(false);
    }
    verificarAdmin();
  }, []);

  // Tela de carregamento
  if (verificando) {
    return (
      <main id="admin-panel" className="admin-verificando">
        <div className="admin-spinner-grande" aria-label="Verificando permissoes..."></div>
        <p>Verificando permissoes...</p>
      </main>
    );
  }

  // Sem sessão
  if (!usuarioLogado) {
    return (
      <main id="admin-panel" className="admin-acesso-negado">
        <div className="admin-negado-card">
          <div className="admin-negado-icone">!</div>
          <h1>Acesso Negado</h1>
          <p>Voce precisa estar logado para acessar esta pagina.</p>
          <Link to="/login" className="admin-btn-voltar">Ir para o login</Link>
        </div>
      </main>
    );
  }

  // Logado mas sem permissão de admin
  if (!isAdmin && !usuarioLogado?.admin) {
    return (
      <main id="admin-panel" className="admin-acesso-negado">
        <div className="admin-negado-card">
          <div className="admin-negado-icone">X</div>
          <h1>Permissao Insuficiente</h1>
          <p>
            Sua conta nao tem privilegios de administrador.
            Se voce acredita que isso e um erro, contate o responsavel pelo sistema.
          </p>
          <Link to="/" className="admin-btn-voltar">Voltar para o inicio</Link>
        </div>
      </main>
    );
  }

  // Painel completo
  return (
    <main id="admin-panel">
      <div className="admin-topo">
        <div className="admin-topo-info">
          <span className="admin-badge admin-badge--admin">ADMINISTRADOR</span>
          <h1 className="admin-titulo-pagina">Painel Administrativo</h1>
          <p className="admin-subtitulo-pagina">
            Gestão financeira de receitas da plataforma e controle de dados do Supabase.
          </p>
        </div>
        <div className="admin-topo-usuario">
          <span className="admin-usuario-nome">{usuarioLogado.nome || usuarioLogado.email || usuarioLogado.senha}</span>
          <Link to="/" className="admin-btn-voltar-nav">Voltar ao site</Link>
        </div>
      </div>

      <div className="admin-abas-container">
        <div className="admin-abas-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'financeiro'}
            className={`admin-aba-btn ${abaAtiva === 'financeiro' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('financeiro')}
          >
            <span className="admin-aba-icone">💰</span>
            Receitas & Financeiro
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'tabelas'}
            className={`admin-aba-btn ${abaAtiva === 'tabelas' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('tabelas')}
          >
            <span className="admin-aba-icone">🗄️</span>
            Banco de Dados ({tabelasAtivas.length})
          </button>
        </div>
      </div>

      <div className="admin-container">
        {abaAtiva === 'financeiro' && (
          <SecaoFinanceiro usuarioLogado={usuarioLogado} />
        )}

        {abaAtiva === 'tabelas' && (
          tabelasAtivas.map((tabela) => (
            <SecaoTabela
              key={tabela.nome}
              tabela={tabela}
              usuarioLogado={usuarioLogado}
            />
          ))
        )}
      </div>
    </main>
  );
}
