import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import { useAlerta } from './AlertaModal';
import AuroraBackground from './AuroraBackground';

export default function Cadastrar() {
  const [nome, setNome] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mostrarAlerta } = useAlerta();

  const handleCadastrar = async (e) => {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      mostrarAlerta({
        titulo: "Senhas Divergentes",
        mensagem: "As senhas informadas não coincidem. Digite novamente com atenção.",
        tipo: "aviso"
      });
      return;
    }

    const regexSenha = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{9,}$/;
    if (!regexSenha.test(senha)) {
      mostrarAlerta({
        titulo: "Senha Fraca",
        mensagem: "A senha precisa ter mais de 8 caracteres, números, letra maiúscula e um caractere especial!",
        tipo: "aviso"
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('usuarios')
      .insert([
        {
          nome: nome,
          nome_usuario: nomeUsuario,
          email: email,
          senha: senha,
          admin: email.includes('@admin')
        }
      ]);

    setLoading(false);

    if (error) {
      const msgLower = (error.message || '').toLowerCase();
      const detLower = (error.details || '').toLowerCase();
      const isUnique = error.code === '23505' || msgLower.includes('duplicate key') || msgLower.includes('unique constraint') || msgLower.includes('already exists');

      if (isUnique) {
        if (msgLower.includes('email') || detLower.includes('email') || msgLower.includes('usuarios_email_key')) {
          mostrarAlerta({
            titulo: "E-mail Já Cadastrado",
            mensagem: "Este e-mail já está cadastrado no sistema. Tente fazer login ou utilize outro endereço.",
            tipo: "aviso"
          });
          return;
        }
        if (msgLower.includes('nome_usuario') || detLower.includes('nome_usuario') || msgLower.includes('usuarios_nome_usuario_key') || msgLower.includes('nick')) {
          mostrarAlerta({
            titulo: "Nome de Usuário Indisponível",
            mensagem: "Este nome de usuário (nick) já está em uso por outro jogador. Escolha outro nick.",
            tipo: "aviso"
          });
          return;
        }
        mostrarAlerta({
          titulo: "Dados Já Cadastrados",
          mensagem: "Já existe uma conta cadastrada com esses dados (e-mail ou nome de usuário).",
          tipo: "aviso"
        });
        return;
      }

      mostrarAlerta({
        titulo: "Erro no Cadastro",
        mensagem: "Não foi possível concluir seu cadastro. Verifique as informações fornecidas e tente novamente.",
        tipo: "erro"
      });
    } else {
      mostrarAlerta({
        titulo: "Cadastro Realizado!",
        mensagem: "Sua conta foi criada com sucesso! Faça login para ingressar nas competições.",
        tipo: "sucesso",
        botaoTexto: "Ir para o Login",
        onConfirmar: () => navigate('/login')
      });
    }
  };

  return (
    <main className="auth-page fundo-aurora-motion">
      <AuroraBackground />
      <div className="auth-card">
        <h2>Cadastrar</h2>
        <form className="auth-form" onSubmit={handleCadastrar}>
          <div className="input-group">
            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
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
