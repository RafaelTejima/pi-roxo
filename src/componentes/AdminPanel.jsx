import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../css/admin.css';
import { useAlerta } from './AlertaModal';

// Tabelas conhecidas do projeto, com nome amigável e colunas relevantes
const TABELAS_CONHECIDAS = [
  { nome: 'usuarios',    label: 'Usuários',    icone: 'U', descricao: 'Contas cadastradas na plataforma' },
  { nome: 'times',             label: 'Times',               icone: 'T',  descricao: 'Times registrados pelos usuários' },
  { nome: 'times_integrantes', label: 'Integrantes de Times',icone: 'TI', descricao: 'Roster e funções dos jogadores em cada time' },
  { nome: 'torneios',          label: 'Torneios',            icone: 'C',  descricao: 'Campeonatos criados na plataforma' },
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
      } else if (key.endsWith('_id') || key.startsWith('id_') || key === 'dinheiro') {
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

// ----- Página principal -----
export default function AdminPanel() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabelasAtivas] = useState(TABELAS_CONHECIDAS);

  useEffect(() => {
    async function verificarAdmin() {
      const salvo = localStorage.getItem('usuarioLogado');
      if (!salvo) { setVerificando(false); return; }

      try {
        const usuario = JSON.parse(salvo);
        setUsuarioLogado(usuario);

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
  if (!isAdmin) {
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
          <h1 className="admin-titulo-pagina">Painel do Banco de Dados</h1>
          <p className="admin-subtitulo-pagina">
            Visualize, edite e gerencie todos os registros do Supabase.
          </p>
        </div>
        <div className="admin-topo-usuario">
          <span className="admin-usuario-nome">{usuarioLogado.nome || usuarioLogado.email || usuarioLogado.senha}</span>
          <Link to="/" className="admin-btn-voltar-nav">Voltar ao site</Link>
        </div>
      </div>

      <div className="admin-container">
        {tabelasAtivas.map((tabela) => (
          <SecaoTabela
            key={tabela.nome}
            tabela={tabela}
            usuarioLogado={usuarioLogado}
          />
        ))}
      </div>
    </main>
  );
}
