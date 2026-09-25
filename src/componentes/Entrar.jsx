import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';

export default function Entrar() {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Busca por email ou nome_usuario
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .or(`email.eq."${identificador}",nome_usuario.eq."${identificador}"`)
      .eq('senha', senha)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("Credenciais incorretas. Tente novamente.");
    } else {
      localStorage.setItem('usuarioLogado', JSON.stringify(data));
      navigate('/');
    }
  };

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
        <h2>Entrar</h2>
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email (ou nome de usuário)</label>
            <input
              type="text"
              placeholder="Digite seu email ou usuário"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="botao-principal auth-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="auth-redirect" style={{ marginBottom: '10px' }}>
          <Link to="/esqueci-senha" style={{ color: 'var(--texto-secundario)' }}>Esqueceu sua senha?</Link>
        </p>
        <p className="auth-redirect" style={{ marginTop: '0' }}>
          <Link to="/cadastro">Não tem uma conta? Cadastre-se</Link>
        </p>
      </div>
    </main>
  );
}