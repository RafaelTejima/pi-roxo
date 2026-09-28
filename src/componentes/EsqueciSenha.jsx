import { Link } from 'react-router-dom';

export default function EsqueciSenha() {
  return (
    <main className="auth-page">
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
