import React, { useState } from 'react';
import IdentifyApp from './components/IdentifyApp';
import LoginPage from './components/LoginPage';
import { credenciaisValidas, encerrarSessao, iniciarSessao, sessaoAtiva } from './auth';

// Sem login, mostra a página de entrada; com login, o sistema. É uma porta de
// entrada simples, não um controle de acesso (ver auth.js).
function App() {
  const [logado, setLogado] = useState(sessaoAtiva);

  const entrar = (usuario, senha) => {
    if (!credenciaisValidas(usuario, senha)) {
      return false;
    }
    iniciarSessao();
    setLogado(true);
    return true;
  };

  const sair = () => {
    encerrarSessao();
    setLogado(false);
  };

  return logado ? <IdentifyApp onLogout={sair} /> : <LoginPage onLogin={entrar} />;
}

export default App;
