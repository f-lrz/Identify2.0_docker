// Login SIMPLES, combinado com o cliente: é só uma porta de entrada, para que a
// tela de envio de fotos não abra direto quando o sistema for ao ar.
//
// NÃO é segurança: usuário e senha ficam no código do site (visíveis para quem
// inspecionar a página), não há hash nem token, e a API do backend continua
// aberta. Para proteger de verdade, a autenticação teria de ser feita no
// backend (ver "Melhorias e novas funcionalidades" no README).

const USUARIO = 'admin';
const SENHA = 'admin';

// A sessão fica no sessionStorage: sobrevive a recarregar a página (F5), mas
// termina ao fechar a aba ou o navegador.
const CHAVE = 'identify2.sessao';

export function credenciaisValidas(usuario, senha) {
  return usuario === USUARIO && senha === SENHA;
}

// O sessionStorage pode estar bloqueado (modo privativo restrito, política do
// navegador): nesse caso o login vale só até recarregar a página.
export function sessaoAtiva() {
  try {
    return sessionStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
}

export function iniciarSessao() {
  try {
    sessionStorage.setItem(CHAVE, '1');
  } catch {
    /* sem armazenamento: segue logado só nesta carga da página */
  }
}

export function encerrarSessao() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    /* nada a limpar */
  }
}
