import { Minus, Plus, Trash2, X } from 'lucide-react';

export default function OrderPanel({ items, note, onUpdateQty, onRemove, onNoteChange, total, onSend, tableNumber, onClose }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6">
        <p className="font-body text-xl">No items yet</p>
        <p className="font-body text-sm mt-1">Tap menu items to add</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h2 className="font-heading text-xl text-amber-400 uppercase tracking-wider">
          Table {tableNumber}
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 lg:hidden">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="bg-zinc-800 rounded-lg px-3 py-3 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-body text-base text-zinc-100 truncate">{item.name}</p>
              <p className="font-body text-sm text-amber-400">£{(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => item.quantity <= 1 ? onRemove(idx) : onUpdateQty(idx, item.quantity - 1)}
                className="w-10 h-10 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 flex items-center justify-center transition-colors"
              >
                {item.quantity <= 1 ? <Trash2 className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-zinc-300" />}
              </button>
              <span className="w-8 text-center font-heading text-lg text-zinc-100">{item.quantity}</span>
              <button
                onClick={() => onUpdateQty(idx, item.quantity + 1)}
                className="w-10 h-10 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-zinc-300" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-zinc-700 space-y-3">
        <input
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add a note (optional)..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 font-body text-base placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
        />
        <div className="flex items-center justify-between px-1">
          <span className="font-body text-lg text-zinc-400">Total</span>
          <span className="font-heading text-2xl text-amber-400">£{total.toFixed(2)}</span>
        </div>
        <button
          onClick={onSend}
          className="w-full min-h-[64px] rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-white font-heading text-xl uppercase tracking-wider transition-all active:scale-[0.98]"
        >
          Send Order
        </button>
      </div>
    </div>
  );
}