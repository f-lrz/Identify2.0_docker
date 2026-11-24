import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Expand, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_MIN = 1;
const ZOOM_MAX = 10;   // a foto original tem 5472 px: 10x passa da resolução real
const PASSO_BOTAO = 1.5;

const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

// Visualizador da foto ampliada, com zoom e arraste.
//
// Renderizado num portal em document.body: dentro do card, o `transform` da
// animação de entrada (animate-fade-in) prendia o `position: fixed` ao card, e
// o fundo escuro não cobria a tela inteira.
//
// Como funciona o zoom: a imagem ocupa o palco inteiro (object-contain) e
// recebe `translate(x, y) scale(s)` com origem no canto superior esquerdo.
// Para ampliar mantendo fixo o ponto sob o cursor, o deslocamento é
// recalculado: novo = ponto - (ponto - antigo) * (s_novo / s_antigo).
export default function ImageViewer({ src, alt, onClose }) {
  const containerRef = useRef(null);
  const palcoRef = useRef(null);
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 });
  const [telaCheia, setTelaCheia] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  // ponteiros ativos (mouse ou dedos) para arrastar e para o gesto de pinça
  const ponteiros = useRef(new Map());
  const pinca = useRef(null);

  // Mantém a imagem cobrindo o palco: sem isso dava para "arrastar a foto
  // para fora" e ficar olhando um fundo vazio.
  const ajustar = useCallback(({ s, x, y }) => {
    const palco = palcoRef.current;
    if (!palco || s <= 1) return { s: 1, x: 0, y: 0 };
    const { width: w, height: h } = palco.getBoundingClientRect();
    return { s, x: limitar(x, w * (1 - s), 0), y: limitar(y, h * (1 - s), 0) };
  }, []);

  // Amplia (fator > 1) ou reduz mantendo fixo o ponto (px, py) do palco.
  const zoomEm = useCallback((fator, px, py) => {
    setZoom((z) => {
      const s = limitar(z.s * fator, ZOOM_MIN, ZOOM_MAX);
      const k = s / z.s;
      return ajustar({ s, x: px - (px - z.x) * k, y: py - (py - z.y) * k });
    });
  }, [ajustar]);

  const centroDoPalco = () => {
    const r = palcoRef.current.getBoundingClientRect();
    return [r.width / 2, r.height / 2];
  };
  const resetar = () => setZoom({ s: 1, x: 0, y: 0 });

  // Rodinha do mouse. Registrado à mão porque o onWheel do React é "passivo"
  // e não deixa cancelar a rolagem da página por trás.
  useEffect(() => {
    const palco = palcoRef.current;
    const aoRolar = (e) => {
      e.preventDefault();
      const r = palco.getBoundingClientRect();
      zoomEm(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top);
    };
    palco.addEventListener('wheel', aoRolar, { passive: false });
    return () => palco.removeEventListener('wheel', aoRolar);
  }, [zoomEm]);

  // Teclado: Esc fecha (ou sai da tela cheia), + e - ampliam, 0 volta ao normal.
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) onClose();
      else if (e.key === '+' || e.key === '=') zoomEm(PASSO_BOTAO, ...centroDoPalco());
      else if (e.key === '-') zoomEm(1 / PASSO_BOTAO, ...centroDoPalco());
      else if (e.key === '0') resetar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onClose, zoomEm]);

  // Ao entrar/sair da tela cheia o palco muda de tamanho: volta ao zoom 1
  // para não ficar com um deslocamento que não vale mais.
  useEffect(() => {
    const aoMudar = () => {
      setTelaCheia(document.fullscreenElement === containerRef.current);
      resetar();
    };
    document.addEventListener('fullscreenchange', aoMudar);
    return () => document.removeEventListener('fullscreenchange', aoMudar);
  }, []);

  // Trava a rolagem da página enquanto o visualizador está aberto.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, []);

  const alternarTelaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen?.();
  };

  // ------------------------------------------------- arrastar e pinça (dedos)
  const aoPressionar = (e) => {
    palcoRef.current.setPointerCapture(e.pointerId);
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      pinca.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
    setArrastando(true);
  };

  const aoMover = (e) => {
    const antes = ponteiros.current.get(e.pointerId);
    if (!antes) return;
    const agora = { x: e.clientX, y: e.clientY };
    ponteiros.current.set(e.pointerId, agora);

    if (ponteiros.current.size === 2 && pinca.current) {
      // Pinça: a razão entre a distância nova e a anterior dos dois dedos
      // vira o fator de zoom, centrado no ponto médio entre eles.
      const [a, b] = [...ponteiros.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = palcoRef.current.getBoundingClientRect();
      zoomEm(dist / pinca.current, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      pinca.current = dist;
      return;
    }
    setZoom((z) => ajustar({ s: z.s, x: z.x + agora.x - antes.x, y: z.y + agora.y - antes.y }));
  };

  const aoSoltar = (e) => {
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size < 2) pinca.current = null;
    if (ponteiros.current.size === 0) setArrastando(false);
  };

  const aoDuploClique = (e) => {
    if (zoom.s > 1) { resetar(); return; }
    const r = palcoRef.current.getBoundingClientRect();
    zoomEm(3, e.clientX - r.left, e.clientY - r.top);
  };

  const botao = 'rounded-full bg-white/90 p-2 text-gray-900 shadow transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-40';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Visualização da imagem identificada"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className={telaCheia
          ? 'relative flex h-full w-full flex-col bg-black'
          : 'relative flex h-[88vh] w-full max-w-6xl flex-col rounded-2xl bg-white p-3 shadow-2xl'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow" aria-live="polite">
            {Math.round(zoom.s * 100)}%
          </span>
          <button type="button" className={botao} onClick={() => zoomEm(1 / PASSO_BOTAO, ...centroDoPalco())} disabled={zoom.s <= ZOOM_MIN} aria-label="Diminuir zoom" title="Diminuir zoom (-)">
            <ZoomOut className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" className={botao} onClick={() => zoomEm(PASSO_BOTAO, ...centroDoPalco())} disabled={zoom.s >= ZOOM_MAX} aria-label="Aumentar zoom" title="Aumentar zoom (+)">
            <ZoomIn className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" className={botao} onClick={resetar} disabled={zoom.s === 1} aria-label="Voltar ao tamanho normal" title="Tamanho normal (0)">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" className={botao} onClick={alternarTelaCheia} aria-label={telaCheia ? 'Sair da tela cheia' : 'Exibir imagem em tela cheia'} title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}>
            <Expand className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" className={botao} onClick={onClose} aria-label="Fechar visualização" title="Fechar (Esc)">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Palco: área fixa onde a imagem é ampliada e arrastada. touch-action
            none deixa os gestos de dedo para o zoom, e não para a página. */}
        <div
          ref={palcoRef}
          className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden rounded-xl ${
            zoom.s > 1 ? (arrastando ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onDoubleClick={aoDuploClique}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="pointer-events-none h-full w-full object-contain"
            style={{
              transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`,
              transformOrigin: '0 0',
              transition: arrastando ? 'none' : 'transform 0.12s ease-out',
            }}
          />
        </div>

        <p className={`mt-2 text-center text-xs ${telaCheia ? 'text-gray-300' : 'text-gray-500'}`}>
          Role a rodinha do mouse (ou use os botões + e −) para dar zoom · arraste para percorrer a foto ·
          duplo clique amplia ou volta ao normal
        </p>
      </div>
    </div>,
    document.body,
  );
}
