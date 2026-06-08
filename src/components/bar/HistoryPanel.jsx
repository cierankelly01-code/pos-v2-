import { format } from 'date-fns';

export default function HistoryPanel({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-xl text-stone-400">No completed orders today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div key={order.id} className="bg-white/60 rounded-xl border border-stone-200 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading text-xl text-stone-700">
              Table {order.table_number}
            </span>
            <span className="font-body text-base text-stone-400">
              {format(new Date(order.created_at), 'HH:mm')}
              {order.completed_at && ` → ${format(new Date(order.completed_at), 'HH:mm')}`}
            </span>
          </div>
          <div className="space-y-1">
            {order.items?.map((item, i) => (
              <p key={i} className="font-body text-base text-stone-600">
                {item.quantity}x {item.name}
              </p>
            ))}
          </div>
          {order.note && (
            <p className="font-body text-sm text-amber-700 mt-2 italic">Note: "{order.note}"</p>
          )}
          <p className="font-heading text-lg text-stone-800 mt-2">£{order.total?.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}