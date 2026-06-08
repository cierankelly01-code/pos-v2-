export default function ConfirmModal({ tableNumber, items, total, note, onConfirm, onCancel, sending }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={!sending ? onCancel : undefined}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Big summary line */}
        <div className="text-center mb-6">
          <p className="font-heading text-2xl text-zinc-400 uppercase tracking-wider mb-1">
            Table {tableNumber}
          </p>
          <p className="font-heading text-5xl text-amber-400">
            £{total.toFixed(2)}
          </p>
        </div>

        {/* Item summary */}
        <div className="bg-zinc-800 rounded-xl px-4 py-3 mb-4 space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between font-body text-base text-zinc-300">
              <span>{item.quantity}× {item.name}</span>
              <span className="text-zinc-500 ml-2 shrink-0">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {note && (
            <p className="text-sm text-zinc-500 italic pt-1 border-t border-zinc-700 mt-1">"{note}"</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 min-h-[60px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading text-lg uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="flex-1 min-h-[60px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xl uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}