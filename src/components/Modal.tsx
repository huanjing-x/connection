import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function Modal() {
  const { modal, closeModal } = useApp();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (modal.open) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [modal.open, closeModal]);

  if (!modal.open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === overlayRef.current) closeModal(); }}
    >
      <div className="bg-parchment-light border-2 border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-parchment-dark rounded-t-xl">
          <h2 className="text-lg font-bold text-ink">{modal.title}</h2>
          <button
            onClick={closeModal}
            className="text-ink-light hover:text-ink text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{modal.content}</div>
      </div>
    </div>
  );
}
