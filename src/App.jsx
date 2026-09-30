import { Routes, Route } from 'react-router-dom';
import Menu from './componentes/Menu';
import Home from './componentes/Home';
import Regras from './componentes/Regras';
import Torneios from './componentes/Torneios';
import CriarTorneio from './componentes/CriarTorneio';
import CriarEquipe from './componentes/CriarEquipe';
import Faq from './componentes/Faq';
import Suporte from './componentes/Suporte';
import Entrar from './componentes/Entrar';
import Cadastrar from './componentes/Cadastrar';
import EsqueciSenha from './componentes/EsqueciSenha';
import AdminPanel from './componentes/AdminPanel';
import Perfil from './componentes/Perfil';
import Equipes from './componentes/Equipes';
import DetalhesTime from './componentes/DetalhesTime';
import SelecaoMapas from './componentes/SelecaoMapas';
import DetalhesTorneio from './componentes/DetalhesTorneio';
import { AlertaProvider } from './componentes/AlertaModal';

function App() {
  return (
    <AlertaProvider>
      <Menu>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/times" element={<Equipes />} />
          <Route path="/equipes/criar" element={<CriarEquipe />} />
          <Route path="/times/criar" element={<CriarEquipe />} />
          <Route path="/equipes/:id" element={<DetalhesTime />} />
          <Route path="/equipe/:id" element={<DetalhesTime />} />
          <Route path="/time/:id" element={<DetalhesTime />} />
          <Route path="/times/:id" element={<DetalhesTime />} />
          <Route path="/regras" element={<Regras />} />
          <Route path="/torneios" element={<Torneios />} />

          <Route path="/torneios/criar" element={<CriarTorneio />} />
          <Route path="/torneios/:id/mapa" element={<SelecaoMapas />} />
          <Route path="/selecao-mapas" element={<SelecaoMapas />} />
          <Route path="/torneios/:id" element={<DetalhesTorneio />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/login" element={<Entrar />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/cadastro" element={<Cadastrar />} />
          <Route path="/cadastrar" element={<Cadastrar />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:nome_usuario" element={<Perfil />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Menu>
    </AlertaProvider>
  );
}

export default App;