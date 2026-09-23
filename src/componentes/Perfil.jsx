import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/perfil.css';

const amigosIniciais = [
  { id: 1, nome: 'Lucas Silva', equipe: 'Vortex Gaming', status: 'online', imagem: 'https://placehold.co/96x96/291547/ffffff?text=LS' },
  { id: 2, nome: 'Ana Costa', equipe: 'Nexus Five', status: 'online', imagem: 'https://placehold.co/96x96/42206b/ffffff?text=AC' },
  { id: 3, nome: 'Rafael Lima', equipe: 'Sem equipe', status: 'offline', imagem: 'https://placehold.co/96x96/17121f/ffffff?text=RL' },
];

export default function Perfil() {
  const navigate = useNavigate();
  const [amigos, setAmigos] = useState(amigosIniciais);
  const [bloqueados, setBloqueados] = useState([]);

  function alternarBloqueio(amigoId) {
    setBloqueados((atuais) => atuais.includes(amigoId)
      ? atuais.filter((id) => id !== amigoId)
      : [...atuais, amigoId]);
  }

  function removerAmigo(amigoId) {
    setAmigos((atuais) => atuais.filter((amigo) => amigo.id !== amigoId));
  }

  function adicionarAmigo() {
    window.alert('A busca de amigos será conectada à API na próxima etapa.');
  }

  function sair() {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      navigate('/');
    }
  }

  return (
    <main id="perfil-page" className="perfil-page">
      <div className="perfil-container">
        <div className="perfil-cabecalho">
          <div>
            <span className="perfil-kicker">Conta de jogador</span>
            <h1>Meu perfil</h1>
            <p>Gerencie suas informações, conexões e equipe.</p>
          </div>
          <Link to="/torneios" className="perfil-link-voltar">Ver torneios</Link>
        </div>

        <section className="perfil-grid">
          <aside className="perfil-resumo">
            <div className="perfil-avatar-wrap">
              <img src="https://placehold.co/180x180/35176b/ffffff?text=JP" alt="Avatar de João Pedro" />
              <span className="perfil-status-dot" aria-label="Online"></span>
            </div>
            <h2>João Pedro</h2>
            <p className="perfil-cargo">Capitão da equipe</p>
            <div className="perfil-dados">
              <div><span>Time afiliado</span><strong>Vortex Gaming</strong></div>
              <div><span>Status</span><strong className="perfil-online">Online agora</strong></div>
              <div><span>Membro desde</span><strong>Março de 2026</strong></div>
            </div>
            <a className="perfil-botao perfil-botao-principal" href="#detalhes-conta">Editar perfil</a>
            <button className="perfil-botao perfil-botao-perigo" type="button" onClick={sair}>Sair da conta</button>
          </aside>

          <div className="perfil-conteudo">
            <section className="perfil-secao" id="detalhes-conta">
              <div className="perfil-secao-titulo">
                <div><span className="perfil-kicker">Informações</span><h2>Detalhes da conta</h2></div>
                <button className="perfil-texto-botao" type="button" onClick={() => window.alert('Edição de dados será conectada à API na próxima etapa.')}>Editar dados</button>
              </div>
              <div className="perfil-detalhes-grid">
                <div><span>Nome completo</span><strong>João Pedro Almeida</strong></div>
                <div><span>Nome de usuário</span><strong>@joaopedro</strong></div>
                <div><span>E-mail</span><strong>joao.pedro@email.com</strong></div>
                <div><span>Localização</span><strong>São Paulo, Brasil</strong></div>
              </div>
            </section>

            <section className="perfil-secao">
              <div className="perfil-secao-titulo">
                <div><span className="perfil-kicker">Conexões</span><h2>Contas vinculadas</h2></div>
              </div>
              <div className="perfil-contas">
                <div className="perfil-conta"><span className="perfil-conta-icone perfil-conta-discord">D</span><div><strong>Discord</strong><span>joaopedro#4210</span></div><button type="button" onClick={() => window.alert('O vínculo com o Discord será configurado na próxima etapa.')}>Gerenciar</button></div>
                <div className="perfil-conta"><span className="perfil-conta-icone perfil-conta-steam">S</span><div><strong>Steam</strong><span>JoaoPedroCS</span></div><button type="button" onClick={() => window.alert('O vínculo com a Steam será configurado na próxima etapa.')}>Gerenciar</button></div>
              </div>
            </section>

            <section className="perfil-secao">
              <div className="perfil-secao-titulo">
                <div><span className="perfil-kicker">Comunidade</span><h2>Lista de amigos <small>{amigos.length}</small></h2></div>
                <button className="perfil-texto-botao" type="button" onClick={adicionarAmigo}>+ Adicionar amigo</button>
              </div>
              <div className="perfil-amigos">
                {amigos.map((amigo) => {
                  const bloqueado = bloqueados.includes(amigo.id);
                  return (
                    <article className={`perfil-amigo ${bloqueado ? 'perfil-amigo-bloqueado' : ''}`} key={amigo.id}>
                      <img src={amigo.imagem} alt={`Avatar de ${amigo.nome}`} />
                      <div className="perfil-amigo-info"><strong>{amigo.nome}</strong><span>{amigo.equipe}</span><em className={amigo.status}>{bloqueado ? 'Bloqueado' : amigo.status === 'online' ? 'Online' : 'Offline'}</em></div>
                      <div className="perfil-amigo-acoes"><button type="button" onClick={() => removerAmigo(amigo.id)}>Remover</button><button type="button" onClick={() => alternarBloqueio(amigo.id)}>{bloqueado ? 'Desbloquear' : 'Bloquear'}</button></div>
                    </article>
                  );
                })}
                {amigos.length === 0 && <p className="perfil-vazio">Você ainda não possui amigos adicionados.</p>}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}