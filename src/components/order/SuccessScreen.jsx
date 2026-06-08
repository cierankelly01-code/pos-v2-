import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessScreen({ tableNumber, onNewOrder }) {
  // Auto-reset after 3 seconds
  useEffect(() => {
    const id = setTimeout(onNewOrder, 3000);
    return () => clearTimeout(id);
  }, [onNewOrder]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6 select-none">
      <div className="w-24 h-24 rounded-full bg-emerald-600/20 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
      </div>
      <p className="font-heading text-2xl text-zinc-400 uppercase tracking-wider mb-2">Order Sent</p>
      <p className="font-heading text-6xl text-amber-400 mb-8">Table {tableNumber}</p>
      <button
        onClick={onNewOrder}
        className="min-h-[64px] px-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading text-xl uppercase tracking-wider transition-colors"
      >
        New Order
      </button>
      <p className="font-body text-sm text-zinc-700 mt-4">Returns automatically in 3s</p>
    </div>
  );
}