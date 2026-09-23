import { Link } from 'react-router-dom';

export default function EsqueciSenha() {
  return (
    <main className="auth-page">
      <div className="auth-carousel">
        <img src="https://placehold.co/1920x1080/1a1a2e/723EC3?text=Torneios+Exclusivos" alt="Slide 1" />
        <img src="https://placehold.co/1920x1080/16213e/723EC3?text=Competicao+Acirrada" alt="Slide 2" />
        <img src="https://placehold.co/1920x1080/0f3460/723EC3?text=Comunidade+Ativa" alt="Slide 3" />
        <img src="https://placehold.co/1920x1080/221f2e/723EC3?text=Premios+Incriveis" alt="Slide 4" />
      </div>
      <div className="auth-overlay"></div>
      
      <div className="auth-card">
        <h2>Recuperar Senha</h2>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label>Email (ou nome de usuário)</label>
            <input type="text" placeholder="Digite seu email ou usuário" required />
          </div>
          <button type="submit" className="botao-principal auth-btn">Esqueci minha senha</button>
        </form>
        <p className="auth-redirect">
          <Link to="/login">Voltar para login</Link>
        </p>
      </div>
    </main>
  );
}
