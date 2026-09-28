import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import { useAlerta } from './AlertaModal';

export default function Entrar() {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mostrarAlerta } = useAlerta();

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
      mostrarAlerta({
        titulo: "Falha no Login",
        mensagem: "Credenciais incorretas. Verifique seu usuário/e-mail e senha e tente novamente.",
        tipo: "erro"
      });
    } else {
      localStorage.setItem('usuarioLogado', JSON.stringify(data));
      navigate('/');
    }
  };

  return (
    <main className="auth-page">
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