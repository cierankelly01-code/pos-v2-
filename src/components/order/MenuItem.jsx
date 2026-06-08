import { Plus } from 'lucide-react';

export default function MenuItem({ item, onAdd }) {
  return (
    <button
      onClick={() => onAdd(item)}
      className="flex items-center justify-between w-full bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg px-4 py-4 min-h-[72px] transition-all active:scale-[0.98] group"
    >
      <span className="font-body text-lg text-zinc-100 text-left pr-3">{item.name}</span>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-heading text-lg text-amber-400">£{item.price.toFixed(2)}</span>
        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/40 transition-colors">
          <Plus className="w-5 h-5 text-amber-400" />
        </div>
      </div>
    </button>
  );
}