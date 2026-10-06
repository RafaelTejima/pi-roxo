import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [aberta, setAberta] = useState(true);
  const [busca, setBusca] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [camposEdicao, setCamposEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [confirmandoDelete, setConfirmandoDelete] = useState(null);

  useEffect(() => {
    async function buscarDados() {
      setLoading(true);
      setErro('');
      try {
        let res;
        if (tabela.nome === 'partidas') {
          // Busca partidas com dados relacionais dos times participantes
          res = await supabase
            .from('partidas')
            .select('*, time1:time1_id(id, nome, tag), time2:time2_id(id, nome, tag)')
            .order('id', { ascending: false })
            .limit(200);

          if (res.error) {
            console.warn('Fallback para busca simples de partidas sem join:', res.error);
            res = await supabase.from('partidas').select('*').order('id', { ascending: false }).limit(200);
          }
        } else if (tabela.nome === 'inscricoes') {
          // Busca inscrições com dados relacionais de torneio, time e usuário
          res = await supabase
            .from('inscricoes')
            .select('*, torneio:id_torneio(id, nome), time:id_time(id, nome, tag), usuario:id_usuario_inscritor(id, nome, nome_usuario)')
            .order('id', { ascending: false })
            .limit(200);

          if (res.error) {
            console.warn('Fallback para busca simples de inscricoes sem join:', res.error);
            res = await supabase.from('inscricoes').select('*').order('id', { ascending: false }).limit(200);
          }
        } else if (tabela.nome === 'transacoes_plataforma') {
          // Busca transações da plataforma com dados relacionais do torneio
          res = await supabase
            .from('transacoes_plataforma')
            .select('*, torneio:id_torneio(id, nome)')
            .order('id', { ascending: false })
            .limit(200);

          if (res.error) {
            console.warn('Fallback para busca simples de transacoes_plataforma sem join:', res.error);
            res = await supabase.from('transacoes_plataforma').select('*').order('id', { ascending: false }).limit(200);
          }
        } else {
          res = await supabase.from(tabela.nome).select('*').limit(200);
        }

        const { data, error } = res;
        if (error) {
          if (error.code === '42P01') {
            setErro('TABELA_INEXISTENTE');
          } else {
            setErro(error.message);
          }
        } else {
          if (tabela.nome === 'partidas' && Array.isArray(data)) {
            const partidasFormatadas = data.map((p) => {
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
            setDados(partidasFormatadas);
          } else if (tabela.nome === 'inscricoes' && Array.isArray(data)) {
            const inscricoesFormatadas = data.map((i) => {
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
            setDados(inscricoesFormatadas);
          } else if (tabela.nome === 'transacoes_plataforma' && Array.isArray(data)) {
            const transacoesFormatadas = data.map((t) => {
              const tor = t.torneio?.nome || (t.id_torneio ? `Torneio #${t.id_torneio}` : '-');
              const { torneio, ...resto } = t;
              return {
                ...resto,
                torneio_nome: tor
              };
            });
            setDados(transacoesFormatadas);
          } else {
            setDados(data || []);
          }
        }
      } catch (err) {
        console.error(`Erro ao carregar tabela ${tabela.nome}:`, err);
        setErro(err.message || 'Erro inesperado ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    buscarDados();
  }, [tabela.nome]);

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

// ----- Seção Financeira Restrita (Receitas & Transações) -----
function SecaoFinanceiro({ usuarioLogado }) {
  const [transacoes, setTransacoes] = useState([]);
  const [saldoAdmin, setSaldoAdmin] = useState(0);
  const [adminPrincipal, setAdminPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  const carregarFinanceiro = async () => {
    setLoading(true);
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
      }

      // 2. Histórico de Transações: consumindo a tabela transacoes_plataforma com join relacional no torneio
      let res = await supabase
        .from('transacoes_plataforma')
        .select('*, torneio:id_torneio(id, nome)')
        .order('id', { ascending: false });

      if (res.error) {
        console.warn('Fallback para busca simples em transacoes_plataforma:', res.error);
        res = await supabase
          .from('transacoes_plataforma')
          .select('*')
          .order('id', { ascending: false });
      }

      if (res.error) {
        setErro(res.error.message);
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
      }
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      setErro('Não foi possível carregar os dados financeiros.');
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
                      <td>{formatarDataHora(t.registro || t.created_at)}</td>
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
