'use client';
import { useEffect, useRef, useState } from 'react';
import { Workbox } from 'workbox-window';

export default function UpdatePrompt() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const wbRef = useRef<Workbox | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const wb = new Workbox('/sw.js'); // next-pwa gera esse SW em prod
    wbRef.current = wb;

    // Dispara quando há um SW novo em "waiting"
    wb.addEventListener('waiting', () => setHasUpdate(true));

    // Quando o novo SW "assumir" os clientes, recarregue a página
    wb.addEventListener('controlling', () => window.location.reload());

    wb.register();
  }, []);

  const updateNow = async () => {
    // Pede ao SW em "waiting" para ativar imediatamente
    await wbRef.current?.messageSkipWaiting();
    // Quando ativar, o evento 'controlling' acima vai disparar e fará o reload
  };

  if (!hasUpdate) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 rounded-xl p-3 bg-black text-white">
      Nova versão disponível.
      <button onClick={updateNow} className="ml-3 px-3 py-1 bg-white/10 rounded">
        Atualizar agora
      </button>
    </div>
  );
}
