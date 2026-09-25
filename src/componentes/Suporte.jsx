import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/suporte.css';

const categorias = [
  'Conta e acesso',
  'Torneios e inscrições',
  'Partidas e bracket',
  'Denúncia de trapaça',
  'Premiação e pagamentos',
  'Problema técnico',
  'Outro'
];

export default function Suporte() {
  const [formulario, setFormulario] = useState({
    nome: '',
    email: '',
    categoria: '',
    assunto: '',
    descricao: '',
    torneio: '',
    partida: '',
    evidencia: ''
  });
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');

      if (usuario) {
        setFormulario((atual) => ({
          ...atual,
          nome: usuario.nome || atual.nome,
          email: usuario.email || atual.email
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar os dados do usuário:', error);
    }
  }, []);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
    setMensagem('');
  }

  function enviarFormulario(evento) {
    evento.preventDefault();

    const corpo = [
      `Nome: ${formulario.nome}`,
      `E-mail para resposta: ${formulario.email}`,
      `Categoria: ${formulario.categoria}`,
      `Assunto: ${formulario.assunto}`,
      '',
      'Descrição:',
      formulario.descricao,
      formulario.torneio && `Torneio: ${formulario.torneio}`,
      formulario.partida && `Partida: ${formulario.partida}`,
      formulario.evidencia && `Evidência: ${formulario.evidencia}`
    ].filter((linha) => linha !== false && linha !== undefined).join('\n');

    const assunto = `[${formulario.categoria}] ${formulario.assunto}`;
    window.location.href = `mailto:suporte@csgotournaments.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    setMensagem('Seu aplicativo de e-mail foi aberto com a mensagem preenchida. Revise e envie por lá.');
  }

  return (
    <main id="pagina-suporte">
      <div className="suporte-conteudo">
        <header className="suporte-cabecalho">
          <p className="suporte-etiqueta"><span></span> CENTRAL DE SUPORTE / CS2</p>
          <h1>Vamos resolver isso.</h1>
          <p className="suporte-introducao">
            Conte o que aconteceu. Quanto mais detalhes sobre a conta, torneio ou partida, mais fácil será encaminhar seu pedido.
          </p>
        </header>

        <div className="suporte-layout">
          <form className="suporte-formulario" onSubmit={enviarFormulario}>
            <div className="suporte-formulario-topo">
              <div>
                <span className="suporte-passo">01 / CONTATO</span>
                <h2>Quem está falando?</h2>
              </div>
              <span className="suporte-obrigatorios">* Obrigatório</span>
            </div>

            <div className="suporte-campos-duplos">
              <div className="suporte-campo">
                <label htmlFor="suporte-nome">Nome <span>*</span></label>
                <input
                  id="suporte-nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  maxLength="100"
                  value={formulario.nome}
                  onChange={alterarCampo}
                  required
                />
              </div>
              <div className="suporte-campo">
                <label htmlFor="suporte-email">E-mail para resposta <span>*</span></label>
                <input
                  id="suporte-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength="150"
                  value={formulario.email}
                  onChange={alterarCampo}
                  required
                />
              </div>
            </div>

            <div className="suporte-divisor">
              <span className="suporte-passo">02 / SOLICITAÇÃO</span>
              <span className="suporte-linha"></span>
            </div>

            <div className="suporte-campo">
              <label htmlFor="suporte-categoria">Categoria <span>*</span></label>
              <select
                id="suporte-categoria"
                name="categoria"
                value={formulario.categoria}
                onChange={alterarCampo}
                required
              >
                <option value="" disabled>Selecione o assunto do contato</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>

            {formulario.categoria === 'Denúncia de trapaça' && (
              <p className="suporte-aviso-denuncia">
                Inclua o horário aproximado e os dados da partida. A FAQ orienta enviar denúncias em até 2 horas após o fim da partida.
              </p>
            )}

            <div className="suporte-campo">
              <label htmlFor="suporte-assunto">Assunto <span>*</span></label>
              <input
                id="suporte-assunto"
                name="assunto"
                type="text"
                maxLength="120"
                value={formulario.assunto}
                onChange={alterarCampo}
                required
              />
            </div>

            <div className="suporte-campo">
              <label htmlFor="suporte-descricao">O que aconteceu? <span>*</span></label>
              <textarea
                id="suporte-descricao"
                name="descricao"
                rows="6"
                maxLength="3000"
                value={formulario.descricao}
                onChange={alterarCampo}
                required
              ></textarea>
              <span className="suporte-ajuda-campo">Inclua os passos para reproduzir o problema, se houver.</span>
            </div>

            <div className="suporte-divisor">
              <span className="suporte-passo">03 / DETALHES DA PARTIDA</span>
              <span className="suporte-opcional">Opcional</span>
              <span className="suporte-linha"></span>
            </div>

            <div className="suporte-campos-duplos">
              <div className="suporte-campo">
                <label htmlFor="suporte-torneio">Torneio</label>
                <input
                  id="suporte-torneio"
                  name="torneio"
                  type="text"
                  maxLength="120"
                  value={formulario.torneio}
                  onChange={alterarCampo}
                  placeholder="Nome ou código do torneio"
                />
              </div>
              <div className="suporte-campo">
                <label htmlFor="suporte-partida">Partida</label>
                <input
                  id="suporte-partida"
                  name="partida"
                  type="text"
                  maxLength="120"
                  value={formulario.partida}
                  onChange={alterarCampo}
                  placeholder="Código ou equipes da partida"
                />
              </div>
            </div>

            <div className="suporte-campo">
              <label htmlFor="suporte-evidencia">Link de evidência</label>
              <input
                id="suporte-evidencia"
                name="evidencia"
                type="url"
                maxLength="500"
                value={formulario.evidencia}
                onChange={alterarCampo}
                placeholder="https://"
              />
              <span className="suporte-ajuda-campo">Use um link acessível pela equipe. Não inclua senhas ou códigos de acesso.</span>
            </div>

            <div className="suporte-enviar-area">
              <button className="suporte-botao-enviar" type="submit">
                <span>Preparar mensagem</span>
                <span aria-hidden="true">↗</span>
              </button>
              <p>O envio será concluído no seu aplicativo de e-mail.</p>
            </div>

            {mensagem && <p className="suporte-mensagem" role="status" aria-live="polite">{mensagem}</p>}
          </form>

          <aside className="suporte-lateral">
            <div className="suporte-lateral-bloco">
              <span className="suporte-passo">CANAL DIRETO</span>
              <h2>Fale com a equipe.</h2>
              <p>Seu pedido será preparado para envio ao canal oficial de suporte.</p>
              <a href="mailto:suporte@csgotournaments.com">suporte@csgotournaments.com</a>
            </div>

            <div className="suporte-lateral-divisor"></div>

            <div className="suporte-lateral-bloco suporte-denuncia-bloco">
              <span className="suporte-passo">PARTIDA EM ANÁLISE</span>
              <h3>Denúncia de trapaça</h3>
              <p>Informe partida, horário aproximado e evidências. A FAQ pede que o contato seja feito em até 2 horas após a partida.</p>
            </div>

            <Link className="suporte-link-faq" to="/faq">
              <span>Voltar às perguntas frequentes</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}