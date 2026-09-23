import { Routes, Route } from 'react-router-dom';
import Menu from './componentes/Menu';
import Home from './componentes/Home';
import Regras from './componentes/Regras';
import Torneios from './componentes/Torneios';
import Faq from './componentes/Faq';
import Entrar from './componentes/Entrar';
import Cadastrar from './componentes/Cadastrar';
import EsqueciSenha from './componentes/EsqueciSenha';
import AdminPanel from './componentes/AdminPanel';
import Perfil from './componentes/Perfil';

function App() {
  return (
    <Menu>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/regras" element={<Regras />} />
        <Route path="/torneios" element={<Torneios />} />
        <Route path="/torneios/:id" element={<Torneios />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/login" element={<Entrar />} />
        <Route path="/cadastro" element={<Cadastrar />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </Menu>
  );
}

export default App;