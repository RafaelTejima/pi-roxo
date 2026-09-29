import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase.js';
import '../css/perfil.css';
import { useAlerta } from './AlertaModal';
import AuroraBackground from './AuroraBackground';

// ------------------------------------------------------------------
// STATUS AMIZADE: PENDENTE | ACEITO | BLOQUEADO
// ------------------------------------------------------------------

export default function Perfil() {
  const navigate = useNavigate();
  const { nome_usuario } = useParams();
  const { mostrarAlerta } = useAlerta();

  const [usuario, setUsuario] = useState(null);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPublico, setIsPublico] = useState(false);

  // ---- Edição ----
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

  // ---- Amizades (Supabase) ----
  const [listaAmigos, setListaAmigos] = useState([]);
  const [pedidosPendentes, setPedidosPendentes] = useState([]); // recebidos
  const [pedidosEnviados, setPedidosEnviados] = useState([]);   // enviados
  const [carregandoAmigos, setCarregandoAmigos] = useState(false);

  // ---- Status amizade (perfil público) ----
  const [statusAmizade, setStatusAmizade] = useState(null); // null | 'PENDENTE_ENVIADO' | 'PENDENTE_RECEBIDO' | 'ACEITO' | 'BLOQUEADO'
  const [amizadeId, setAmizadeId] = useState(null);

  // ---- Aba da seção amigos ----
  const [abaAmigos, setAbaAmigos] = useState('amigos'); // 'amigos' | 'pendentes' | 'enviados'

  // ---- Busca de Jogadores ----
  const [buscaAmigo, setBuscaAmigo] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [dropdownAmigoAberto, setDropdownAmigoAberto] = useState(false);
  const [buscandoAmigos, setBuscandoAmigos] = useState(false);
  const buscarAmigoRef = useRef(null);

  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // CARREGAMENTO DO PERFIL
  // ------------------------------------------------------------------
  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      const salvo = localStorage.getItem('usuarioLogado');
      const userLocal = salvo ? JSON.parse(salvo) : null;
      if (!ativo) return;
      setUsuarioLogado(userLocal);

      if (nome_usuario && (!userLocal || String(userLocal.nome_usuario) !== String(nome_usuario))) {
        // Perfil público de outro usuário
        setIsPublico(true);
        setLoading(true);

        // Busca no Supabase com JOIN em times_integrantes para obter a equipe atual
        let dadosUsuario = null;
        try {
          const { data: uComJoin, error: errJoin } = await supabase
            .from('usuarios')
            .select(`
              id, nome, nome_usuario, bio, imagem, registro, admin,
              conexao_discord, conexao_steam, conexao_twitter, conexao_youtube, conexao_twitch, conexao_bluesky,
              times_integrantes (
                id,
                funcao,
                times ( id, nome, tag, logo )
              )
            `)
            .eq('nome_usuario', nome_usuario)
            .maybeSingle();

          if (!errJoin && uComJoin) {
            const ti = uComJoin.times_integrantes?.[0];
            const timeObj = Array.isArray(ti?.times) ? ti.times[0] : ti?.times;
            const timeNome = timeObj ? (timeObj.tag ? `[${timeObj.tag}] ${timeObj.nome}` : timeObj.nome) : 'Sem equipe';
            dadosUsuario = {
              ...uComJoin,
              time_usuario: timeNome,
              discord: uComJoin.conexao_discord || null,
              steam: uComJoin.conexao_steam || null,
              twitter: uComJoin.conexao_twitter || null
            };
          }
        } catch (eJoin) {
          console.warn('Tentativa com join em times_integrantes falhou no perfil publico:', eJoin);
        }

        if (!dadosUsuario) {
          try {
            const { data: uSimples } = await supabase
              .from('usuarios')
              .select('id, nome, nome_usuario, bio, imagem, registro, admin, conexao_discord, conexao_steam, conexao_twitter, conexao_youtube, conexao_twitch, conexao_bluesky')
              .eq('nome_usuario', nome_usuario)
              .maybeSingle();

            if (uSimples) {
              const { data: ti } = await supabase
                .from('times_integrantes')
                .select('id, id_time, funcao, times ( id, nome, tag )')
                .eq('id_usuario', id)
                .maybeSingle();

              const timeObj = Array.isArray(ti?.times) ? ti.times[0] : ti?.times;
              const timeNome = timeObj ? (timeObj.tag ? `[${timeObj.tag}] ${timeObj.nome}` : timeObj.nome) : 'Sem equipe';

              dadosUsuario = {
                ...uSimples,
                time_usuario: timeNome,
                discord: uSimples.conexao_discord || null,
                steam: uSimples.conexao_steam || null,
                twitter: uSimples.conexao_twitter || null
              };
            }
          } catch (eSimples) {
            console.warn('Tentativa simples no perfil publico falhou:', eSimples);
          }
        }

        if (ativo) {
          if (dadosUsuario) {
            setUsuario(dadosUsuario);
          } else {
            setUsuario({
              id: 0,
              nome: `Jogador ${nome_usuario}`,
              nome_usuario: nome_usuario,
              time_usuario: 'Sem equipe',
              bio: 'Perfil público de jogador na plataforma.',
              imagem: '',
              registro: new Date().toISOString(),
              status: 'offline'
            });
          }
          setLoading(false);
        }
        return;
      }

      // Perfil próprio
      setIsPublico(false);
      if (!userLocal?.id) { navigate('/login'); return; }

      let dadosUsuarioProprio = null;
      try {
        const { data: uComJoin } = await supabase
          .from('usuarios')
          .select(`
            id, nome, nome_usuario, bio, imagem, registro, admin,
            conexao_discord, conexao_steam, conexao_twitter, conexao_youtube, conexao_twitch, conexao_bluesky,
            times_integrantes (
              id,
              funcao,
              times ( id, nome, tag, logo )
            )
          `)
          .eq('id', userLocal.id)
          .maybeSingle();

        if (uComJoin) {
          const ti = uComJoin.times_integrantes?.[0];
          const timeObj = Array.isArray(ti?.times) ? ti.times[0] : ti?.times;
          const timeNome = timeObj ? (timeObj.tag ? `[${timeObj.tag}] ${timeObj.nome}` : timeObj.nome) : 'Sem equipe';

          dadosUsuarioProprio = {
            ...uComJoin,
            time_usuario: timeNome
          };
        }
      } catch (eJoin) {
        console.warn('Tentativa com join no perfil proprio falhou:', eJoin);
      }

      if (!dadosUsuarioProprio) {
        const { data: uSimples } = await supabase
          .from('usuarios')
          .select('id, nome, nome_usuario, bio, imagem, registro, admin, conexao_discord, conexao_steam, conexao_twitter, conexao_youtube, conexao_twitch, conexao_bluesky')
          .eq('id', userLocal.id)
          .maybeSingle();

        if (uSimples) {
          const { data: ti } = await supabase
            .from('times_integrantes')
            .select('id, id_time, funcao, times ( id, nome, tag )')
            .eq('id_usuario', userLocal.id)
            .maybeSingle();

          const timeObj = Array.isArray(ti?.times) ? ti.times[0] : ti?.times;
          const timeNome = timeObj ? (timeObj.tag ? `[${timeObj.tag}] ${timeObj.nome}` : timeObj.nome) : 'Sem equipe';

          dadosUsuarioProprio = {
            ...uSimples,
            time_usuario: timeNome
          };
        }
      }

      if (ativo) {
        setUsuario(dadosUsuarioProprio || userLocal);
        setLoading(false);
      }
    }
    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [nome_usuario, navigate]);

  // ------------------------------------------------------------------
  // CARREGAR AMIZADES DO SUPABASE COM VALIDAÇÃO CRUZADA (perfil próprio)
  // ------------------------------------------------------------------
  const isCarregandoAmizadesRef = useRef(false);

  const carregarAmizades = useCallback(async (isMountedCheck) => {
    if (!usuarioLogado?.id) return;
    if (isCarregandoAmizadesRef.current) return;
    isCarregandoAmizadesRef.current = true;

    setCarregandoAmigos(true);
    try {
      // 1. Amizades aceitas
      const { data: aceitas, error: errAceitas } = await supabase
        .from('amizades')
        .select('id, status, registro, id_usuario1, id_usuario2')
        .or(`id_usuario1.eq.${usuarioLogado.id},id_usuario2.eq.${usuarioLogado.id}`);

      if (errAceitas) throw errAceitas;

      const relacoesAceitas = (aceitas || []).filter(
        (a) => String(a.status).toUpperCase() === 'ACEITO'
      );

      // 2. Pedidos recebidos (eu = usuario2)
      const { data: recebidos } = await supabase
        .from('amizades')
        .select('id, status, registro, id_usuario1, id_usuario2')
        .eq('id_usuario2', usuarioLogado.id)
        .ilike('status', 'PENDENTE');

      // 3. Pedidos enviados (eu = usuario1)
      const { data: enviados } = await supabase
        .from('amizades')
        .select('id, status, registro, id_usuario1, id_usuario2')
        .eq('id_usuario1', usuarioLogado.id)
        .ilike('status', 'PENDENTE');

      // 4. Extrair candidatos brutos
      const amigosBrutos = relacoesAceitas.map((a) => {
        const amigoId = String(a.id_usuario1) === String(usuarioLogado.id) ? a.id_usuario2 : a.id_usuario1;
        return {
          amizade_id: a.id,
          id: amigoId
        };
      }).filter((item) => Boolean(item.id));

      const pedidosPendentesBrutos = (recebidos || []).map((p) => ({
        id: p.id,
        registro: p.registro,
        remetenteId: p.id_usuario1
      })).filter((item) => Boolean(item.remetenteId));

      const pedidosEnviadosBrutos = (enviados || []).map((e) => ({
        id: e.id,
        registro: e.registro,
        destinatarioId: e.id_usuario2
      })).filter((item) => Boolean(item.destinatarioId));

      // 5. Coletar todos os IDs para validação cruzada no banco
      let amigosStorage = [];
      try {
        const salvas = localStorage.getItem('listaAmigosUsuario');
        if (salvas) amigosStorage = JSON.parse(salvas);
      } catch {}

      const idsParaValidar = [...new Set([
        ...amigosBrutos.map((a) => String(a.id)),
        ...pedidosPendentesBrutos.map((p) => String(p.remetenteId)),
        ...pedidosEnviadosBrutos.map((e) => String(e.destinatarioId)),
        ...amigosStorage.map((s) => String(s.id))
      ])].filter(Boolean);

      if (idsParaValidar.length > 0) {
        // Validação cruzada estrita na tabela 'usuarios' do Supabase (sem a coluna descontinuada time_usuario)
        const { data: usuariosAtivos, error: errVal } = await supabase
          .from('usuarios')
          .select('id, nome, nome_usuario, imagem, status')
          .in('id', idsParaValidar);

        // Busca equipes dos jogadores via tabela normalizada times_integrantes
        const mapaTimes = new Map();
        try {
          const { data: membrosTimes } = await supabase
            .from('times_integrantes')
            .select(`
              id_usuario,
              funcao,
              times ( id, nome, tag )
            `)
            .in('id_usuario', idsParaValidar);

          (membrosTimes || []).forEach((m) => {
            const t = Array.isArray(m.times) ? m.times[0] : m.times;
            if (t) {
              const rotulo = t.tag ? `[${t.tag}] ${t.nome}` : t.nome;
              mapaTimes.set(String(m.id_usuario), rotulo);
            }
          });
        } catch (eTimes) {
          console.warn('Erro ao carregar times dos amigos via times_integrantes:', eTimes);
        }

        if (!errVal && usuariosAtivos) {
          const mapaAtivos = new Map(usuariosAtivos.map((u) => [String(u.id), u]));
          const amigosValidados = [];
          const idsVistos = new Set();

          for (const item of amigosBrutos) {
            const idStr = String(item.id);
            if (mapaAtivos.has(idStr) && !idsVistos.has(idStr)) {
              idsVistos.add(idStr);
              const u = mapaAtivos.get(idStr);
              amigosValidados.push({
                id: u.id,
                amizade_id: item.amizade_id,
                nome: u.nome || u.nome_usuario,
                nome_usuario: u.nome_usuario || u.nome,
                name: u.nome_usuario || u.nome,
                time_usuario: mapaTimes.get(idStr) || 'Sem equipe',
                imagem: u.imagem || '',
                status: u.status || 'online',
                game: 'CS2'
              });
            } else if (!mapaAtivos.has(idStr)) {
              // Amigo excluído do sistema: remove relação órfã da tabela amizades
              if (item.amizade_id) {
                supabase.from('amizades').delete().eq('id', item.amizade_id).catch(() => {});
              }
            }
          }

          if (isMountedCheck && !isMountedCheck()) return;

          setListaAmigos(amigosValidados);
          // Limpa referências órfãs no localStorage imediatamente
          localStorage.setItem('listaAmigosUsuario', JSON.stringify(amigosValidados));
          localStorage.setItem('listaAmigosPerfil', JSON.stringify(amigosValidados));
          // NOTA DE DESEMPENHO: NÃO emitir amigosAtualizados dentro do leitor para evitar loop infinito

          // Validar pedidos pendentes recebidos
          const pendentesValidados = [];
          for (const p of pedidosPendentesBrutos) {
            const idStr = String(p.remetenteId);
            if (mapaAtivos.has(idStr)) {
              pendentesValidados.push({
                id: p.id,
                registro: p.registro,
                remetente: {
                  ...mapaAtivos.get(idStr),
                  time_usuario: mapaTimes.get(idStr) || 'Sem equipe'
                }
              });
            } else {
              if (p.id) supabase.from('amizades').delete().eq('id', p.id).catch(() => {});
            }
          }
          setPedidosPendentes(pendentesValidados);

          // Validar pedidos enviados
          const enviadosValidados = [];
          for (const e of pedidosEnviadosBrutos) {
            const idStr = String(e.destinatarioId);
            if (mapaAtivos.has(idStr)) {
              enviadosValidados.push({
                id: e.id,
                registro: e.registro,
                destinatario: {
                  ...mapaAtivos.get(idStr),
                  time_usuario: mapaTimes.get(idStr) || 'Sem equipe'
                }
              });
            } else {
              if (e.id) supabase.from('amizades').delete().eq('id', e.id).catch(() => {});
            }
          }
          setPedidosEnviados(enviadosValidados);
        }
      } else {
        if (isMountedCheck && !isMountedCheck()) return;
        setListaAmigos([]);
        setPedidosPendentes([]);
        setPedidosEnviados([]);
        localStorage.setItem('listaAmigosUsuario', JSON.stringify([]));
        localStorage.setItem('listaAmigosPerfil', JSON.stringify([]));
      }
    } catch (err) {
      console.error('Erro ao carregar amizades:', err);
    } finally {
      isCarregandoAmizadesRef.current = false;
      if (!isMountedCheck || isMountedCheck()) {
        setCarregandoAmigos(false);
      }
    }
  }, [usuarioLogado?.id]);

  useEffect(() => {
    let montado = true;
    const isMountedCheck = () => montado;

    if (usuarioLogado?.id && !isPublico) {
      carregarAmizades(isMountedCheck);

      const onUpdate = () => {
        if (montado) carregarAmizades(isMountedCheck);
      };

      window.addEventListener('amigosAtualizados', onUpdate);
      window.addEventListener('storage', onUpdate);
      return () => {
        montado = false;
        window.removeEventListener('amigosAtualizados', onUpdate);
        window.removeEventListener('storage', onUpdate);
      };
    }
  }, [usuarioLogado?.id, isPublico, carregarAmizades]);

  // ------------------------------------------------------------------
  // STATUS AMIZADE (perfil público)
  // ------------------------------------------------------------------
  useEffect(() => {
    let ativo = true;

    async function verificarAmizade() {
      if (!isPublico || !usuarioLogado?.id || !usuario?.id) return;
      const targetId = usuario.id;
      const { data } = await supabase
        .from('amizades')
        .select('id, status, id_usuario1, id_usuario2')
        .or(`and(id_usuario1.eq.${usuarioLogado.id},id_usuario2.eq.${targetId}),and(id_usuario1.eq.${targetId},id_usuario2.eq.${usuarioLogado.id})`)
        .maybeSingle();

      if (!ativo) return;
      if (!data) { setStatusAmizade(null); setAmizadeId(null); return; }
      setAmizadeId(data.id);
      if (data.status === 'ACEITO') setStatusAmizade('ACEITO');
      else if (data.status === 'BLOQUEADO') setStatusAmizade('BLOQUEADO');
      else if (data.status === 'PENDENTE') {
        setStatusAmizade(String(data.id_usuario1) === String(usuarioLogado.id) ? 'PENDENTE_ENVIADO' : 'PENDENTE_RECEBIDO');
      }
    }
    verificarAmizade();

    return () => {
      ativo = false;
    };
  }, [isPublico, usuarioLogado?.id, usuario?.id]);

  // ------------------------------------------------------------------
  // AÇÕES DE AMIZADE — PERFIL PÚBLICO
  // ------------------------------------------------------------------
  async function enviarPedidoAmizade() {
    if (!usuarioLogado?.id || !usuario?.id) return;
    const { error } = await supabase.from('amizades').insert({
      id_usuario1: usuarioLogado.id,
      id_usuario2: usuario.id,
      status: 'PENDENTE'
    });
    if (error) {
      mostrarAlerta({ titulo: 'Erro', mensagem: error.message, tipo: 'erro' });
    } else {
      setStatusAmizade('PENDENTE_ENVIADO');
      mostrarAlerta({ titulo: 'Pedido enviado!', mensagem: `Seu pedido foi enviado para ${usuario?.nome_usuario || usuario?.nome}.`, tipo: 'sucesso' });
      window.dispatchEvent(new Event('amigosAtualizados'));
      window.dispatchEvent(new Event('storage'));
    }
  }

  async function aceitarPedidoPublico() {
    if (!amizadeId) return;
    await supabase.from('amizades').update({ status: 'ACEITO' }).eq('id', amizadeId);
    setStatusAmizade('ACEITO');
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
    mostrarAlerta({ titulo: 'Amizade aceita!', mensagem: 'Vocês agora são amigos.', tipo: 'sucesso' });
  }

  async function removerAmizadePublica() {
    if (!amizadeId) return;
    await supabase.from('amizades').delete().eq('id', amizadeId);
    setStatusAmizade(null); setAmizadeId(null);
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
    mostrarAlerta({ titulo: 'Amizade removida', mensagem: 'Amizade removida com sucesso.', tipo: 'aviso' });
  }

  async function bloquearUsuario() {
    if (!usuarioLogado?.id || !usuario?.id) return;
    if (amizadeId) {
      await supabase.from('amizades').update({ status: 'BLOQUEADO', id_usuario1: usuarioLogado.id, id_usuario2: usuario.id }).eq('id', amizadeId);
    } else {
      await supabase.from('amizades').insert({ id_usuario1: usuarioLogado.id, id_usuario2: usuario.id, status: 'BLOQUEADO' });
    }
    setStatusAmizade('BLOQUEADO');
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
    mostrarAlerta({ titulo: 'Usuário bloqueado', mensagem: `${usuario?.nome_usuario || usuario?.nome} foi bloqueado.`, tipo: 'aviso' });
  }

  async function desbloquearUsuario() {
    if (!amizadeId) return;
    await supabase.from('amizades').delete().eq('id', amizadeId);
    setStatusAmizade(null); setAmizadeId(null);
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
    mostrarAlerta({ titulo: 'Desbloqueado', mensagem: 'Usuário desbloqueado com sucesso.', tipo: 'sucesso' });
  }

  // ------------------------------------------------------------------
  // AÇÕES DE AMIZADE — LISTA PRÓPRIA
  // ------------------------------------------------------------------
  async function aceitarPedido(amizade_id) {
    const { error } = await supabase.from('amizades').update({ status: 'ACEITO' }).eq('id', amizade_id);
    if (!error) {
      const pedido = pedidosPendentes.find(p => p.id === amizade_id);
      if (pedido) {
        setPedidosPendentes(prev => prev.filter(p => p.id !== amizade_id));
        setListaAmigos(prev => [...prev, {
           id: pedido.remetente.id,
           amizade_id: amizade_id,
           nome: pedido.remetente.nome,
           nome_usuario: pedido.remetente.nome_usuario,
           imagem: pedido.remetente.imagem,
           status: pedido.remetente.status || 'offline',
           time_usuario: pedido.remetente.time_usuario,
           game: 'CS2'
        }]);
      }
      mostrarAlerta({ titulo: 'Amizade aceita!', mensagem: 'Pedido de amizade aceito com sucesso.', tipo: 'sucesso' });
      carregarAmizades();
      window.dispatchEvent(new Event('amigosAtualizados'));
      window.dispatchEvent(new Event('storage'));
    }
  }

  async function rejeitarPedido(amizade_id) {
    await supabase.from('amizades').delete().eq('id', amizade_id);
    setPedidosPendentes(prev => prev.filter(p => p.id !== amizade_id));
    mostrarAlerta({ titulo: 'Pedido rejeitado', mensagem: 'Pedido de amizade rejeitado.', tipo: 'aviso' });
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
  }

  async function cancelarPedidoEnviado(amizade_id) {
    await supabase.from('amizades').delete().eq('id', amizade_id);
    setPedidosEnviados(prev => prev.filter(e => e.id !== amizade_id));
    mostrarAlerta({ titulo: 'Pedido cancelado', mensagem: 'Seu pedido de amizade foi cancelado.', tipo: 'aviso' });
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
  }

  async function removerAmigo(amizade_id, nome) {
    await supabase.from('amizades').delete().eq('id', amizade_id);
    setListaAmigos((prev) => {
      const nova = prev.filter((a) => a.amizade_id !== amizade_id);
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(nova));
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(nova));
      return nova;
    });
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
    mostrarAlerta({ titulo: 'Amizade Removida', mensagem: `${nome} foi removido da sua lista de amigos.`, tipo: 'aviso' });
  }

  async function bloquearAmigo(amizade_id, amigo_id, nome) {
    await supabase.from('amizades')
      .update({ status: 'BLOQUEADO', id_usuario1: usuarioLogado.id, id_usuario2: amigo_id })
      .eq('id', amizade_id);
    setListaAmigos((prev) => {
      const nova = prev.filter((a) => a.amizade_id !== amizade_id);
      localStorage.setItem('listaAmigosUsuario', JSON.stringify(nova));
      localStorage.setItem('listaAmigosPerfil', JSON.stringify(nova));
      return nova;
    });
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
    mostrarAlerta({ titulo: 'Usuário bloqueado', mensagem: `${nome} foi bloqueado.`, tipo: 'aviso' });
  }

  // ------------------------------------------------------------------
  // BUSCA DINÂMICA DE JOGADORES
  // ------------------------------------------------------------------
  useEffect(() => {
    const fecharAoClicarFora = (e) => {
      if (buscarAmigoRef.current && !buscarAmigoRef.current.contains(e.target)) {
        setDropdownAmigoAberto(false);
      }
    };
    document.addEventListener('click', fecharAoClicarFora);
    return () => document.removeEventListener('click', fecharAoClicarFora);
  }, []);

  useEffect(() => {
    const termo = buscaAmigo.trim().toLowerCase();
    if (!termo) { setResultadosBusca([]); setDropdownAmigoAberto(false); return; }

    setBuscandoAmigos(true);
    let ativo = true;

    const idsRelacionados = new Set([
      ...listaAmigos.map(a => String(a.id)),
      ...pedidosPendentes.map(p => String(p.remetente?.id)),
      ...pedidosEnviados.map(e => String(e.destinatario?.id)),
      String(usuarioLogado?.id)
    ]);

    // Busca direta no Supabase com usuários reais cadastrados
    supabase
      .from('usuarios')
      .select('id, nome, nome_usuario, imagem')
      .or(`nome.ilike.%${termo}%,nome_usuario.ilike.%${termo}%`)
      .limit(8)
      .then(async ({ data, error }) => {
        if (!ativo || error) { if (ativo) setBuscandoAmigos(false); return; }
        const lista = [];
        const idsEncontrados = [];

        (data || []).forEach((jDb) => {
          if (idsRelacionados.has(String(jDb.id))) return;
          lista.push({
            id: jDb.id,
            nome: jDb.nome || jDb.nome_usuario,
            nome_usuario: jDb.nome_usuario || jDb.nome,
            time_usuario: 'Sem equipe',
            imagem: jDb.imagem || '',
            status: 'offline'
          });
          idsEncontrados.push(jDb.id);
        });

        // Buscar equipes dos usuários encontrados via times_integrantes
        if (idsEncontrados.length > 0) {
          try {
            const { data: timesData } = await supabase
              .from('times_integrantes')
              .select('id_usuario, times(nome, tag)')
              .in('id_usuario', idsEncontrados);

            if (timesData) {
              const mapaTimes = {};
              timesData.forEach((r) => {
                const t = Array.isArray(r.times) ? r.times[0] : r.times;
                if (t && !mapaTimes[r.id_usuario]) {
                  mapaTimes[r.id_usuario] = t.tag ? `[${t.tag}] ${t.nome}` : t.nome;
                }
              });
              lista.forEach((item) => {
                if (mapaTimes[item.id]) item.time_usuario = mapaTimes[item.id];
              });
            }
          } catch (eT) {
            console.warn('Erro ao carregar times da busca:', eT);
          }
        }

        if (ativo) {
          setResultadosBusca(lista);
          setBuscandoAmigos(false);
          setDropdownAmigoAberto(true);
        }
      })
      .catch(() => { if (ativo) setBuscandoAmigos(false); });

    return () => { ativo = false; };
  }, [buscaAmigo, listaAmigos, pedidosPendentes, pedidosEnviados, usuarioLogado?.id]);

  async function handleEnviarPedido(jogador) {
    if (!usuarioLogado?.id || String(jogador.id) === String(usuarioLogado?.id)) return;

    const { error } = await supabase.from('amizades').insert({
      id_usuario1: usuarioLogado.id,
      id_usuario2: jogador.id,
      status: 'PENDENTE'
    });

    if (error) {
      mostrarAlerta({ titulo: 'Erro', mensagem: error.message, tipo: 'erro' });
      return;
    }

    setBuscaAmigo('');
    setResultadosBusca([]);
    setDropdownAmigoAberto(false);
    mostrarAlerta({
      titulo: 'Pedido enviado!',
      mensagem: `Pedido enviado para ${jogador.nome_usuario || jogador.nome}.`,
      tipo: 'sucesso'
    });
    carregarAmizades();
    window.dispatchEvent(new Event('amigosAtualizados'));
    window.dispatchEvent(new Event('storage'));
  }

  // ------------------------------------------------------------------
  // EDIÇÃO DE PERFIL
  // ------------------------------------------------------------------
  function iniciarEdicao() {
    setForm({
      nome_usuario: usuario.nome_usuario || '',
      imagem: usuario.imagem || '',
      bio: usuario.bio || '',
      discord: usuario.conexao_discord || '',
      steam: usuario.conexao_steam || '',
      twitter: usuario.conexao_twitter || '',
      youtube: usuario.conexao_youtube || '',
      twitch: usuario.conexao_twitch || '',
      bluesky: usuario.conexao_bluesky || '',
      privacidade_amigos: localStorage.getItem(`priv_amigos_${usuario.id}`) || 'publico',
      privacidade_nome: localStorage.getItem(`priv_nome_${usuario.id}`) || 'publico',
      privacidade_ganhos: localStorage.getItem(`priv_ganhos_${usuario.id}`) || 'publico',
    });
    setEditando(true);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setSalvando(true);
    const payload = {
      nome_usuario: form.nome_usuario,
      imagem: form.imagem,
      bio: form.bio,
      conexao_discord: form.discord,
      conexao_steam: form.steam,
      conexao_twitter: form.twitter,
      conexao_youtube: form.youtube,
      conexao_twitch: form.twitch,
      conexao_bluesky: form.bluesky,
    };
    const { error } = await supabase.from('usuarios').update(payload).eq('id', usuario.id);
    if (error) {
      mostrarAlerta({ titulo: 'Erro ao Salvar', mensagem: error.message, tipo: 'erro' });
      setSalvando(false);
      return;
    }
    localStorage.setItem(`priv_amigos_${usuario.id}`, form.privacidade_amigos);
    localStorage.setItem(`priv_nome_${usuario.id}`, form.privacidade_nome);
    localStorage.setItem(`priv_ganhos_${usuario.id}`, form.privacidade_ganhos);
    setUsuario(prev => ({ ...prev, ...payload }));
    setSalvando(false);
    setEditando(false);
    mostrarAlerta({ titulo: 'Perfil Atualizado!', mensagem: 'Suas informações foram salvas com sucesso.', tipo: 'sucesso' });
  }

  function sair() {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      localStorage.removeItem('usuarioLogado');
      navigate('/');
      window.dispatchEvent(new Event('storage'));
    }
  }

  // ------------------------------------------------------------------
  // LOADING / GUARD
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <main id="perfil-page" className="perfil-page fundo-aurora-motion">
        <AuroraBackground />
        <div className="perfil-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2 style={{ color: 'var(--roxo-claro)' }}>Carregando perfil...</h2>
        </div>
      </main>
    );
  }
  if (!usuario) return null;

  // ------------------------------------------------------------------
  // DERIVAÇÕES
  // ------------------------------------------------------------------
  const dataRegistro = new Date(usuario.registro).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const avatarUrl = usuario.imagem || `https://placehold.co/180x180/35176b/ffffff?text=${(usuario.nome || usuario.nome_usuario || 'U').substring(0, 2).toUpperCase()}`;

  const discord = isPublico ? (usuario.discord || null) : usuario.conexao_discord;
  const steam   = isPublico ? (usuario.steam   || null) : usuario.conexao_steam;
  const twitter = isPublico ? (usuario.twitter  || null) : usuario.conexao_twitter;
  const youtube = isPublico ? null : usuario.conexao_youtube;
  const twitch  = isPublico ? null : usuario.conexao_twitch;
  const bluesky = isPublico ? null : usuario.conexao_bluesky;

  const privNome   = isPublico ? (localStorage.getItem(`priv_nome_${usuario.id}`) || 'publico') : 'publico';
  const privGanhos = isPublico ? (localStorage.getItem(`priv_ganhos_${usuario.id}`) || 'publico') : 'publico';
  const privAmigos = isPublico ? (localStorage.getItem(`priv_amigos_${usuario.id}`) || 'publico') : 'publico';

  const statsPartidas = usuario.stats?.partidas ?? 0;
  const statsTorneios = usuario.stats?.torneios ?? 0;
  const statsTitulos  = usuario.stats?.titulos  ?? 0;
  const statsGanhos   = usuario.stats?.ganhos   ?? (privGanhos === 'privado' ? '🔒 Oculto' : 'R$ 0,00');

  const totalPendentes = pedidosPendentes.length;

  // ------------------------------------------------------------------
  // RENDER — BOTÃO DE AMIZADE (perfil público)
  // ------------------------------------------------------------------
  function renderBotaoAmizade() {
    if (!usuarioLogado) return null;
    if (String(usuarioLogado.id) === String(usuario?.id)) return null;

    if (statusAmizade === 'ACEITO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ padding: '8px 14px', background: 'rgba(80,200,120,0.15)', border: '1px solid rgba(80,200,120,0.3)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>
            ✓ Amigos
          </div>
          <button onClick={removerAmizadePublica} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(233,85,85,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Remover
          </button>
          <button onClick={bloquearUsuario} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Bloquear
          </button>
        </div>
      );
    }
    if (statusAmizade === 'PENDENTE_ENVIADO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ padding: '8px 14px', background: 'rgba(181,101,242,0.12)', border: '1px solid rgba(181,101,242,0.3)', borderRadius: '8px', color: '#c084fc', fontSize: '13px', fontWeight: '700' }}>
            ⏳ Aguardando resposta
          </div>
        </div>
      );
    }
    if (statusAmizade === 'PENDENTE_RECEBIDO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button onClick={aceitarPedidoPublico} style={{ padding: '8px 14px', background: 'rgba(80,200,120,0.2)', border: '1px solid rgba(80,200,120,0.4)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            ✓ Aceitar pedido
          </button>
          <button onClick={removerAmizadePublica} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(233,85,85,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Rejeitar
          </button>
        </div>
      );
    }
    if (statusAmizade === 'BLOQUEADO') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ padding: '8px 14px', background: 'rgba(233,85,85,0.1)', border: '1px solid rgba(233,85,85,0.25)', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: '700' }}>
            🚫 Bloqueado
          </div>
          <button onClick={desbloquearUsuario} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Desbloquear
          </button>
        </div>
      );
    }
    return (
      <button onClick={enviarPedidoAmizade} className="perfil-botao perfil-botao-principal" style={{ marginTop: '12px' }}>
        + Adicionar Amigo
      </button>
    );
  }

  // ------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ------------------------------------------------------------------
  return (
    <main id="perfil-page" className="perfil-page fundo-aurora-motion">
      <AuroraBackground />
      <div className="perfil-container">
        {/* Cabeçalho */}
        <div className="perfil-cabecalho">
          <div>
            <span className="perfil-kicker">{isPublico ? 'Perfil de jogador' : 'Conta de jogador'}</span>
            <h1>{isPublico ? (usuario.nome || usuario.nome_usuario || 'Perfil') : 'Meu perfil'}</h1>
            <p>{isPublico ? 'Visualizando perfil público do jogador.' : 'Gerencie suas informações, conexões e privacidade.'}</p>
          </div>
          {isPublico ? (
            <button type="button" className="perfil-link-voltar" onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid rgba(181, 101, 242, 0.4)', cursor: 'pointer' }}>
              Voltar
            </button>
          ) : (
            <Link to="/torneios" className="perfil-link-voltar">Ver torneios</Link>
          )}
        </div>

        <section className="perfil-grid">
          {/* ---- Sidebar ---- */}
          <aside className="perfil-resumo">
            <div className="perfil-avatar-wrap">
              <img src={avatarUrl} alt={`Avatar de ${usuario.nome || usuario.nome_usuario}`} />
              <span
                className={`perfil-status-dot ${usuario.status === 'offline' ? 'offline' : ''}`}
                style={usuario.status === 'offline' ? { backgroundColor: '#64748b', boxShadow: 'none' } : {}}
                aria-label={usuario.status === 'offline' ? 'Offline' : 'Online'}
              ></span>
            </div>

            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              {privNome === 'privado' ? 'Nome Privado' : (usuario.nome || usuario.nome_usuario || 'Jogador')}
              {usuario.admin && (
                <span style={{ fontSize: '10px', background: '#8c52ff', padding: '2px 7px', borderRadius: '4px', fontWeight: '800', color: '#fff', letterSpacing: '1.2px', textTransform: 'uppercase', flexShrink: 0 }}>ADM</span>
              )}
            </h2>

            <p className="perfil-cargo">{usuario.nome_usuario ? `@${usuario.nome_usuario}` : 'Sem usuário'}</p>

            <div className="perfil-dados">
              <div><span>Time atual</span><strong>{usuario.time_usuario || 'Nenhum'}</strong></div>
              <div>
                <span>Status</span>
                {usuario.status === 'offline'
                  ? <strong style={{ color: '#94a3b8' }}>Offline</strong>
                  : <strong className="perfil-online">Online agora</strong>
                }
              </div>
              <div><span>Membro desde</span><strong style={{ textTransform: 'capitalize' }}>{dataRegistro}</strong></div>
            </div>

            {/* Botões de amizade (perfil público) */}
            {isPublico && renderBotaoAmizade()}
            {isPublico && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(181, 101, 242, 0.08)', border: '1px solid rgba(181, 101, 242, 0.22)', color: '#c084fc', fontSize: '0.82rem', textAlign: 'center', fontWeight: '600', letterSpacing: '0.5px' }}>
                PERFIL PÚBLICO
              </div>
            )}

            {/* Botões do próprio perfil */}
            {!isPublico && (
              <>
                {!editando && (
                  <button className="perfil-botao perfil-botao-principal" type="button" onClick={iniciarEdicao} style={{ marginBottom: '10px' }}>
                    Editar perfil
                  </button>
                )}
                <button className="perfil-botao perfil-botao-perigo" type="button" onClick={sair}>Sair da conta</button>
              </>
            )}
          </aside>

          {/* ---- Conteúdo principal ---- */}
          <div className="perfil-conteudo">
            {editando ? (
              /* ---- FORMULÁRIO DE EDIÇÃO ---- */
              <section className="perfil-secao">
                <div className="perfil-secao-titulo">
                  <div><span className="perfil-kicker">Configurações</span><h2>Editar Perfil</h2></div>
                </div>
                <form onSubmit={salvarEdicao} style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Dados Básicos</h3>
                    <div className="perfil-detalhes-grid">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>URL da Imagem</label>
                        <input type="url" value={form.imagem} onChange={e => setForm({ ...form, imagem: e.target.value })} placeholder="https://..." style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Nome de usuário (@)</label>
                        <input type="text" value={form.nome_usuario} onChange={e => setForm({ ...form, nome_usuario: e.target.value })} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>Biografia</label>
                    <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows="3" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%', resize: 'vertical' }}></textarea>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Conexões (Redes)</h3>
                    <div className="perfil-detalhes-grid">
                      {[
                        { key: 'discord', label: 'Discord', placeholder: '@Usuário' },
                        { key: 'steam', label: 'Steam URL', placeholder: 'https://steamcommunity.com/id/...' },
                        { key: 'twitter', label: 'Twitter / X', placeholder: '@seu_twitter' },
                        { key: 'youtube', label: 'YouTube', placeholder: '@seucanal' },
                        { key: 'twitch', label: 'Twitch', placeholder: 'seucanal' },
                        { key: 'bluesky', label: 'Bluesky', placeholder: '@usuario.bsky.social' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>{label}</label>
                          <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', marginBottom: '10px' }}>Privacidade</h3>
                    <div className="perfil-detalhes-grid">
                      {[
                        { key: 'privacidade_nome', label: 'Nome de Perfil', opts: [['publico','Público'],['amigos','Apenas Amigos'],['privado','Privado']] },
                        { key: 'privacidade_amigos', label: 'Lista de Amigos', opts: [['publico','Mostrar'],['privado','Privar']] },
                        { key: 'privacidade_ganhos', label: 'Meus Ganhos', opts: [['publico','Mostrar'],['privado','Privar']] },
                      ].map(({ key, label, opts }) => (
                        <div key={key}>
                          <label style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>{label}</label>
                          <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}>
                            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button type="submit" className="perfil-botao perfil-botao-principal" disabled={salvando} style={{ maxWidth: '200px' }}>
                      {salvando ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button type="button" onClick={() => setEditando(false)} className="perfil-botao perfil-botao-perigo" style={{ margin: 0, maxWidth: '150px' }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <>
                {/* ---- DETALHES DA CONTA ---- */}
                <section className="perfil-secao" id="detalhes-conta">
                  <div className="perfil-secao-titulo">
                    <div><span className="perfil-kicker">Sobre</span><h2>Biografia</h2></div>
                  </div>
                  <p style={{ color: 'var(--texto-secundario)', lineHeight: '1.6', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {usuario.bio || 'Este jogador ainda não escreveu nenhuma biografia.'}
                  </p>

                  <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', margin: '32px 0 14px' }}>Desempenho</h3>
                  <div className="perfil-detalhes-grid" style={{ gap: '16px' }}>
                    {[
                      { label: 'Partidas Jogadas', valor: statsPartidas, cor: '#e8e0f0' },
                      { label: 'Torneios Participados', valor: statsTorneios, cor: '#e8e0f0' },
                      { label: 'Torneios Vencidos', valor: statsTitulos, cor: '#e8e0f0' },
                      { label: 'Ganhos Totais', valor: statsGanhos, cor: privGanhos === 'privado' ? 'var(--texto-terciario)' : '#5ce390' },
                    ].map(({ label, valor, cor }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>{label}</span>
                        <strong style={{ fontSize: '28px', color: cor }}>{valor}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ---- BIOGRAFIA + DESEMPENHO ---- */}
            

                {/* ---- CONEXÕES VINCULADAS ---- */}
                <section className="perfil-secao" style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--roxo-claro)', margin: '0 0 16px' }}>Conexões Vinculadas</h3>
                  <div className="perfil-contas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {[
                      { label: 'Discord', val: discord, bg: '#5865f2', icon: '/svg/discord.svg' },
                      { label: 'Steam', val: steam, bg: '#1b2838', icon: '/svg/steam.svg' },
                      { label: 'Twitter / X', val: twitter, bg: '#1DA1F2', icon: '/svg/twitter.svg' },
                      { label: 'YouTube', val: youtube, bg: '#FF0000', icon: '/svg/youtube.svg' },
                      { label: 'Twitch', val: twitch, bg: '#9146FF', icon: '/svg/twitch.svg' },
                      { label: 'Bluesky', val: bluesky, bg: '#0085FF', icon: '/svg/bluesky.svg' },
                    ].map(({ label, val, bg, icon }) => (
                      <div key={label} className="perfil-conta" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
                        <span className="perfil-conta-icone" style={{ background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={icon} alt={label} style={{ width: '20px', height: '20px' }} />
                        </span>
                        <div><strong>{label}</strong><span>{val || 'Não conectado'}</span></div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ---- LISTA DE AMIGOS (perfil próprio) ---- */}
                {!isPublico && (
                  <section className="perfil-secao perfil-secao-amigos" style={{ marginTop: '24px' }}>
                    <div className="perfil-amigos-header">
                      <div>
                        <span className="perfil-kicker">Comunidade</span>
                        <h2>
                          Lista de Amigos <small>({listaAmigos.length})</small>
                          {totalPendentes > 0 && (
                            <span style={{ marginLeft: '8px', background: '#e95555', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                              {totalPendentes} pendente{totalPendentes > 1 ? 's' : ''}
                            </span>
                          )}
                        </h2>
                      </div>

                      {/* Barra de busca */}
                      <div className="perfil-buscar-amigo-wrap" ref={buscarAmigoRef}>
                        <div className="perfil-buscar-input-container">
                          <svg className="perfil-buscar-icone" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                          <input
                            type="text"
                            className="perfil-buscar-input"
                            value={buscaAmigo}
                            onChange={(e) => setBuscaAmigo(e.target.value)}
                            onFocus={() => buscaAmigo.trim() && setDropdownAmigoAberto(true)}
                            placeholder="Buscar jogadores para adicionar..."
                          />
                          {buscaAmigo && (
                            <button type="button" className="perfil-buscar-limpar" onClick={() => { setBuscaAmigo(''); setResultadosBusca([]); setDropdownAmigoAberto(false); }} aria-label="Limpar busca">
                              &times;
                            </button>
                          )}
                        </div>

                        {dropdownAmigoAberto && buscaAmigo.trim().length > 0 && (
                          <div className="perfil-autocomplete-dropdown">
                            {buscandoAmigos ? (
                              <div className="perfil-autocomplete-loading">Buscando jogadores...</div>
                            ) : resultadosBusca.length > 0 ? (
                              resultadosBusca.map((j) => (
                                <div key={j.id} className="perfil-autocomplete-item">
                                  <div className="perfil-autocomplete-user">
                                    <img
                                      src={j.imagem || `https://placehold.co/96x96/35176b/ffffff?text=${(j.nome_usuario || j.nome || 'J').substring(0, 2).toUpperCase()}`}
                                      alt={j.nome || j.nome_usuario}
                                      className="perfil-autocomplete-avatar"
                                    />
                                    <div className="perfil-autocomplete-info">
                                      <strong>{j.nome || j.nome_usuario}</strong>
                                      <span>{j.nome_usuario ? `@${j.nome_usuario}` : ''}{j.time_usuario ? ` • ${j.time_usuario}` : ''}</span>
                                    </div>
                                  </div>
                                  <button type="button" className="perfil-autocomplete-add-btn" onClick={() => handleEnviarPedido(j)} title="Enviar pedido de amizade">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <line x1="12" y1="5" x2="12" y2="19"></line>
                                      <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    <span>Adicionar</span>
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="perfil-autocomplete-empty">Nenhum jogador encontrado</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Abas */}
                    <div className="perfil-amigos-abas">
                      {[
                        { key: 'amigos',   label: `Amigos (${listaAmigos.length})` },
                        { key: 'pendentes', label: 'Pendentes', badge: totalPendentes },
                        { key: 'enviados',  label: `Enviados (${pedidosEnviados.length})` },
                      ].map(({ key, label, badge }) => (
                        <button key={key} className={`perfil-aba-amigos ${abaAmigos === key ? 'ativa' : ''}`} onClick={() => setAbaAmigos(key)} type="button">
                          {label}
                          {badge > 0 && <span className="perfil-aba-badge">{badge}</span>}
                        </button>
                      ))}
                    </div>

                    {/* Conteúdo das abas */}
                    {privAmigos === 'privado' ? (
                      <p className="perfil-vazio">Sua lista de amigos está definida como privada nas configurações.</p>
                    ) : carregandoAmigos ? (
                      <div className="perfil-amigos-loading">
                        <div className="perfil-spinner"></div>
                        Carregando amizades...
                      </div>
                    ) : (
                      <>
                        {/* ABA: Amigos aceitos */}
                        {abaAmigos === 'amigos' && (
                          <div className="perfil-amigos">
                            {listaAmigos.length === 0 ? (
                              <p className="perfil-vazio">Nenhum amigo na sua lista. Use o campo de busca para encontrar e adicionar jogadores!</p>
                            ) : listaAmigos.map((amigo) => (
                              <article className="perfil-amigo" key={amigo.amizade_id}>
                                <Link
                                  to={`/perfil/${amigo.nome_usuario}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
                                  title={`Ver perfil de ${amigo.nome_usuario ? `@${amigo.nome_usuario}` : amigo.nome}`}
                                >
                                  <img
                                    src={amigo.imagem || `https://placehold.co/96x96/291547/ffffff?text=${(amigo.nome_usuario || amigo.nome || 'J').substring(0, 2).toUpperCase()}`}
                                    alt={amigo.nome || amigo.nome_usuario}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <div className="perfil-amigo-info">
                                    <strong style={{ color: '#e8e0f0' }}>
                                      {amigo.nome_usuario ? `@${amigo.nome_usuario}` : amigo.nome}
                                    </strong>
                                    <span>{amigo.time_usuario || 'Sem equipe'}</span>
                                    <em style={{ color: 'var(--texto-terciario)' }}>{amigo.nome || ''}</em>
                                  </div>
                                </Link>
                                <div className="perfil-amigo-acoes">
                                  <button type="button" onClick={() => removerAmigo(amigo.amizade_id, amigo.nome_usuario || amigo.nome)} title="Remover amigo">Remover</button>
                                  <button type="button" onClick={() => bloquearAmigo(amigo.amizade_id, amigo.id, amigo.nome_usuario || amigo.nome)} title="Bloquear" style={{ color: '#f87171' }}>Bloquear</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}

                        {/* ABA: Pedidos recebidos */}
                        {abaAmigos === 'pendentes' && (
                          <div className="perfil-amigos">
                            {pedidosPendentes.length === 0 ? (
                              <p className="perfil-vazio">Nenhum pedido de amizade pendente.</p>
                            ) : pedidosPendentes.map((p) => (
                              <article className="perfil-amigo perfil-amigo-pendente" key={p.id}>
                                <Link
                                  to={`/perfil/${p.remetente?.nome_usuario}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
                                  title={`Ver perfil de ${p.remetente?.nome_usuario ? `@${p.remetente.nome_usuario}` : p.remetente?.nome}`}
                                >
                                  <img
                                    src={p.remetente?.imagem || `https://placehold.co/96x96/291547/ffffff?text=${(p.remetente?.nome_usuario || 'J').substring(0, 2).toUpperCase()}`}
                                    alt={p.remetente?.nome || p.remetente?.nome_usuario}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <div className="perfil-amigo-info">
                                    <strong style={{ color: '#e8e0f0' }}>
                                      {p.remetente?.nome_usuario ? `@${p.remetente.nome_usuario}` : p.remetente?.nome}
                                    </strong>
                                    <span>{p.remetente?.time_usuario || 'Sem equipe'}</span>
                                    <em style={{ color: '#c084fc', fontStyle: 'normal', fontSize: '11px' }}>Pedido recebido</em>
                                  </div>
                                </Link>
                                <div className="perfil-amigo-acoes">
                                  <button type="button" onClick={() => aceitarPedido(p.id)} style={{ color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '6px 12px', borderRadius: '6px', background: 'rgba(74,222,128,0.08)' }}>
                                    ✓ Aceitar
                                  </button>
                                  <button type="button" onClick={() => rejeitarPedido(p.id)} style={{ color: '#f87171' }}>Rejeitar</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}

                        {/* ABA: Pedidos enviados */}
                        {abaAmigos === 'enviados' && (
                          <div className="perfil-amigos">
                            {pedidosEnviados.length === 0 ? (
                              <p className="perfil-vazio">Nenhum pedido de amizade enviado aguardando resposta.</p>
                            ) : pedidosEnviados.map((e) => (
                              <article className="perfil-amigo" key={e.id} style={{ opacity: 0.8 }}>
                                <Link
                                  to={`/perfil/${e.destinatario?.nome_usuario}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
                                  title={`Ver perfil de ${e.destinatario?.nome_usuario ? `@${e.destinatario.nome_usuario}` : e.destinatario?.nome}`}
                                >
                                  <img
                                    src={e.destinatario?.imagem || `https://placehold.co/96x96/291547/ffffff?text=${(e.destinatario?.nome_usuario || 'J').substring(0, 2).toUpperCase()}`}
                                    alt={e.destinatario?.nome || e.destinatario?.nome_usuario}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <div className="perfil-amigo-info">
                                    <strong style={{ color: '#e8e0f0' }}>
                                      {e.destinatario?.nome_usuario ? `@${e.destinatario.nome_usuario}` : e.destinatario?.nome}
                                    </strong>
                                    <span>{e.destinatario?.time_usuario || 'Sem equipe'}</span>
                                    <em style={{ color: '#a78bfa', fontStyle: 'normal', fontSize: '11px' }}>⏳ Aguardando resposta</em>
                                  </div>
                                </Link>
                                <div className="perfil-amigo-acoes">
                                  <button type="button" onClick={() => cancelarPedidoEnviado(e.id)} title="Cancelar pedido">Cancelar</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}

                {/* ---- AMIGOS em perfil público (exibe contagem) ---- */}
                {isPublico && privAmigos === 'publico' && (
                  <section className="perfil-secao" style={{ marginTop: '24px' }}>
                    <div className="perfil-secao-titulo">
                      <div><span className="perfil-kicker">Comunidade</span><h2>Amigos</h2></div>
                    </div>
                    <p style={{ color: 'var(--texto-secundario)', fontSize: '14px' }}>
                      Lista de amigos não exibida publicamente neste perfil.
                    </p>
                  </section>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}