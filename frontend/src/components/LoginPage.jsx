import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import Header from './Header';
import HelpButton from './HelpButton';

// Página de entrada. A conferência do usuário e da senha fica em auth.js;
// aqui é só o formulário. Sem "criar conta" nem "esqueci a senha", de propósito.
export default function LoginPage({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const enviar = (event) => {
    event.preventDefault();
    if (onLogin(usuario.trim(), senha)) {
      return;
    }
    setErro('Usuário ou senha incorretos.');
    setSenha('');
  };

  const campo = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10';

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 relative font-sans">
      <Header />

      <main className="bg-white w-full max-w-sm rounded-3xl border border-gray-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-10">
        <form onSubmit={enviar} className="flex flex-col animate-fade-in" noValidate>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Entrar</h2>
          <p className="text-gray-500 text-sm mb-8 text-center">
            Acesse com seu usuário e senha.
          </p>

          <label className="mb-4 text-sm font-semibold text-gray-700">
            Usuário
            <input
              type="text"
              name="usuario"
              autoComplete="username"
              autoFocus
              value={usuario}
              onChange={(event) => { setUsuario(event.target.value); setErro(''); }}
              className={campo}
            />
          </label>

          <label className="mb-6 text-sm font-semibold text-gray-700">
            Senha
            <input
              type="password"
              name="senha"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => { setSenha(event.target.value); setErro(''); }}
              className={campo}
            />
          </label>

          {erro && (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white text-sm font-semibold px-8 py-3 rounded-full transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Entrar
          </button>
        </form>
      </main>

      <HelpButton />
    </div>
  );
}
