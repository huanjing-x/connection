import { useApp } from '../context/AppContext';

export default function ConfirmDialog() {
  const { confirm, closeConfirm } = useApp();

  if (!confirm.open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-parchment-light border-2 border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <p className="text-ink text-sm mb-5 leading-relaxed whitespace-pre-wrap">{confirm.message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { confirm.onCancel?.(); closeConfirm(); }}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={() => { confirm.onConfirm(); closeConfirm(); }}
            className="btn-primary"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
