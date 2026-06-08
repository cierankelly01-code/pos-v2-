import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function useRelativeTime(date) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => setLabel(formatDistanceToNow(new Date(date), { addSuffix: true }));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [date]);
  return label;
}

export default function OrderCard({ order, onComplete }) {
  const timeAgo = useRelativeTime(order.created_at);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(order);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-opacity ${completing ? 'opacity-40' : 'border-stone-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-stone-50 border-b border-stone-200">
        <span className="font-heading text-4xl text-stone-900 tracking-widest">
          TABLE {order.table_number}
        </span>
        <span className="font-body text-base text-stone-400">{timeAgo}</span>
      </div>
      {order.staff_name && (
        <div className="px-5 py-2 bg-stone-50 border-b border-stone-100">
          <span
            className="inline-flex items-center gap-1 font-body text-sm px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${order.staff_colour || '#F59E0B'}22`, color: order.staff_colour || '#B45309' }}
          >
            {order.staff_name}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="mx-5 border-t border-stone-200" />

      {/* Items */}
      <div className="px-5 py-5 space-y-3">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className="font-heading text-2xl text-stone-900 w-10 shrink-0 text-right">
              {item.quantity}x
            </span>
            <span className="font-body text-xl text-stone-800 leading-snug">
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Allergen alert */}
      {order.allergens && order.allergens.length > 0 && (
        <>
          <div className="mx-5 border-t border-dashed border-red-200" />
          <div className="px-5 py-3 bg-red-50">
            <p className="font-body text-base text-red-700 font-semibold uppercase tracking-wide mb-1">⚠ Allergen Alert</p>
            <p className="font-body text-base text-red-800">
              {order.allergens.join(' · ')}
            </p>
          </div>
        </>
      )}

      {/* Note */}
      {order.note && (
        <>
          <div className="mx-5 border-t border-dashed border-stone-200" />
          <div className="px-5 py-3">
            <p className="font-body text-base text-amber-700">
              <span className="font-semibold">NOTE:</span> {order.note}
            </p>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="mx-5 border-t border-stone-200" />

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-heading text-2xl text-stone-700">
          £{order.total?.toFixed(2)}
        </span>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="min-h-[60px] px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 disabled:bg-emerald-300 text-white font-heading text-xl uppercase tracking-wider flex items-center gap-3 transition-colors"
        >
          <Check className="w-6 h-6" />
          Done
        </button>
      </div>
    </div>
  );
}