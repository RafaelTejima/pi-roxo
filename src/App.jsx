function App() {
  return (
    <div>
      {/* Cabeçalho Fixo com Efeito Glass */}
      <header className="cabecalho">
        <div className="logo">
          CS:GO <span className="roxo">TOURNAMENTS</span>
        </div>
        <nav className="links">
          <a href="./index.html" className="ativo">Início</a>
          <a href="./torneios.html">Torneios</a>
          <a href="./regras.html">Regras</a>
          <a href="./faq.html">FAQ</a>
        </nav>
        <div className="user-area">
          <a href="./login.html" className="botao-login">Entrar</a>
          <a href="./cadastro.html" className="botao-cadastrar">Cadastrar</a>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ minHeight: 'calc(100vh - 160px)', paddingTop: '100px', textAlign: 'center' }}>
        <h1>Projeto Roxo</h1>
      </main>

      {/* Rodapé Simples */}
      <footer className="rodape">
        <p>&copy; 2026 CS:GO Tournaments. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default App;