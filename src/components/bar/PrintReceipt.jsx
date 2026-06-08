import { format } from 'date-fns';
import { X } from 'lucide-react';

export default function PrintReceipt({ order, venueName, onClose }) {
  const time = format(new Date(order.created_at), 'HH:mm');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full">
        {/* Print controls (hidden when printing) */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h3 className="font-heading text-lg">Print Preview</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Receipt content */}
        <div id="receipt-content" className="p-6 font-mono text-sm leading-relaxed">
          <div className="text-center mb-4">
            <p className="text-lg font-bold">================================</p>
            <p className="text-lg font-bold uppercase">{venueName}</p>
            <p className="text-lg font-bold">================================</p>
          </div>

          <div className="flex justify-between mb-4">
            <span>TABLE: {order.table_number}</span>
            <span>TIME: {time}</span>
          </div>

          <div className="mb-4">
            {order.items?.map((item, i) => (
              <p key={i}>{item.quantity}x {item.name}</p>
            ))}
          </div>

          {order.note && (
            <p className="mb-4">NOTE: {order.note}</p>
          )}

          <div className="border-t border-dashed border-stone-300 pt-2">
            <p className="font-bold text-base">TOTAL: £{order.total?.toFixed(2)}</p>
          </div>

          <p className="text-center mt-4 text-lg font-bold">================================</p>
        </div>

        {/* Print button */}
        <div className="p-4 border-t print:hidden">
          <button
            onClick={handlePrint}
            className="w-full min-h-[56px] rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-heading text-lg uppercase tracking-wider"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}