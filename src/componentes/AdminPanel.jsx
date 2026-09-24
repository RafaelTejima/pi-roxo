import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../css/admin.css';

// Tabelas conhecidas do projeto, com nome amigável e colunas relevantes
const TABELAS_CONHECIDAS = [
  { nome: 'usuarios',    label: 'Usuários',    icone: 'U', descricao: 'Contas cadastradas na plataforma' },
  { nome: 'times',       label: 'Times',       icone: 'T', descricao: 'Times registrados pelos usuários' },
  { nome: 'torneios',    label: 'Torneios',    icone: 'C', descricao: 'Campeonatos criados na plataforma' },
  { nome: 'mapas',       label: 'Mapas',       icone: 'M', descricao: 'Mapas de CS2 disponiveis' },
  { nome: 'partidas',    label: 'Partidas',    icone: 'P', descricao: 'Partidas e confrontos do bracket' },
  { nome: 'inscricoes',  label: 'Inscrições',  icone: 'I', descricao: 'Inscrições de times em torneios' },
  { nome: 'amigos',      label: 'Amigos',      icone: 'A', descricao: 'Relações de amizade entre usuários' },
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
      const { data, error } = await supabase.from(tabela.nome).select('*').limit(200);
      if (error) {
        if (error.code === '42P01') {
          setErro('TABELA_INEXISTENTE');
        } else {
          setErro(error.message);
        }
      } else {
        setDados(data || []);
      }
      setLoading(false);
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
    const { error } = await supabase
      .from(tabela.nome)
      .update(camposEdicao)
      .eq('id', linhaId);
    setSalvando(false);
    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      setDados((prev) =>
        prev.map((l) => (l.id === linhaId ? { ...l, ...camposEdicao } : l))
      );
      cancelarEdicao();
    }
  }

  // ---- Deletar ----
  async function confirmarDelete(linha) {
    if (!linha.id) { alert('Este registro não possui ID, não é possível deletar.'); return; }
    const { error } = await supabase.from(tabela.nome).delete().eq('id', linha.id);
    if (error) {
      alert('Erro ao deletar: ' + error.message);
    } else {
      setDados((prev) => prev.filter((l) => l.id !== linha.id));
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
          <span className="admin-chevron" aria-hidden="true">{aberta ? '−' : '+'}</span>
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
                                col === 'admin' ? (
                                  <label className="admin-switch">
                                    <input
                                      type="checkbox"
                                      checked={camposEdicao[col] === true || camposEdicao[col] === 'true'}
                                      onChange={(e) => {
                                        if (tabela.nome === 'usuarios' && linha.id === usuarioLogado?.id && !e.target.checked) {
                                          alert('Voce nao pode remover seu proprio acesso de administrador.');
                                          return;
                                        }
                                        setCamposEdicao((prev) => ({ ...prev, [col]: e.target.checked }));
                                      }}
                                      disabled={tabela.nome === 'usuarios' && linha.id === usuarioLogado?.id}
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
