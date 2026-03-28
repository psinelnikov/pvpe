import { X } from 'lucide-react';

export default function Alert({ type = 'info', message, onDismiss }) {
  const colors = {
    success: 'bg-green-500/10 border-green-500 text-green-400',
    error: 'bg-red-500/10 border-red-500 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500 text-blue-400',
  };

  if (!message) return null;

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${colors[type]} mb-4`}>
      <p className="text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
