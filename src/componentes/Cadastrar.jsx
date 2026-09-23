import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';

export default function Cadastrar() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCadastrar = async (e) => {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('usuarios')
      .insert([
        {
          nome: nomeUsuario,
          email: email,
          senha: senha
        }
      ]);

    setLoading(false);

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
    } else {
      alert("Cadastro realizado com sucesso!");
      navigate('/login');
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
        <h2>Cadastrar</h2>
        <form className="auth-form" onSubmit={handleCadastrar}>
          <div className="input-group">
            <label>Nome de usuário</label>
            <input
              type="text"
              placeholder="Digite seu nome de usuário"
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <div className="input-group">
            <label>Confirmação de senha</label>
            <input
              type="password"
              placeholder="Confirme sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="botao-principal auth-btn" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="auth-redirect">
          <Link to="/login">Já tem uma conta? Faça login</Link>
        </p>
      </div>
    </main>
  );
}
