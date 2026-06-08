import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { X, Plus, Minus, Check, Loader2 } from 'lucide-react';
import { DRINK_SUBCATEGORIES } from '@/components/admin/MenuEditor';

export default function AddToTabModal({ occupiedTables, staff, onClose, onDone }) {
  const { data: settings } = useSettings();
  const [step, setStep] = useState('table'); // table | items | confirm
  const [tableNumber, setTableNumber] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [sending, setSending] = useState(false);
  const [activeSubcat, setActiveSubcat] = useState('Beer');

  const menuItems = useMemo(() => {
    if (!settings?.menu_items) return [];
    return settings.menu_items.filter(i => i.category === 'drinks');
  }, [settings]);

  const subcats = useMemo(() => {
    const present = new Set(menuItems.map(i => i.subcategory || 'Other'));
    return DRINK_SUBCATEGORIES.filter(s => present.has(s));
  }, [menuItems]);

  const visibleItems = useMemo(
    () => menuItems.filter(i => (i.subcategory || 'Other') === activeSubcat),
    [menuItems, activeSubcat]
  );

  const total = useMemo(
    () => orderItems.reduce((s, i) => s + i.price * i.quantity, 0),
    [orderItems]
  );

  const addItem = (item) => {
    setOrderItems(prev => {
      const idx = prev.findIndex(i => i.name === item.name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const changeQty = (name, delta) => {
    setOrderItems(prev => {
      const idx = prev.findIndex(i => i.name === name);
      if (idx < 0) return prev;
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  };

  const confirm = async () => {
    setSending(true);
    await supabase.from('orders').insert({
      table_number: tableNumber,
      items: orderItems,
      total,
      status: 'pending',
      id_checked: true,
      allergy_checked: true,
      allergens: [],
      tab_closed: false,
      staff_name: staff?.name || null,
      staff_colour: staff?.colour || null,
    });
    setSending(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-zinc-900 rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="font-heading text-xl text-amber-400 uppercase tracking-wider">
            {step === 'table' ? 'Add to Tab — Select Table'
              : step === 'items' ? `Table ${tableNumber} — Add Drinks`
              : `Table ${tableNumber} — Confirm`}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step: Table picker */}
        {step === 'table' && (
          <div className="p-5">
            {occupiedTables.length === 0 ? (
              <p className="font-body text-zinc-500 text-center py-8">No open tables right now</p>
            ) : (
              <>
                <p className="font-body text-sm text-zinc-500 mb-4">Which table?</p>
                <div className="grid grid-cols-5 gap-2">
                  {occupiedTables.map(n => (
                    <button
                      key={n}
                      onClick={() => { setTableNumber(n); setStep('items'); }}
                      className="min-h-[56px] rounded-lg bg-amber-900/50 border border-amber-700/60 text-amber-400 font-heading text-xl hover:bg-amber-800/60 active:scale-95 transition-all"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Item picker */}
        {step === 'items' && (
          <>
            {/* Subcategory tabs */}
            <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto shrink-0">
              {subcats.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSubcat(s)}
                  className={`px-3 py-1.5 rounded-full font-body text-sm whitespace-nowrap transition-all
                    ${activeSubcat === s
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1">
              {visibleItems.map((item, i) => {
                const inOrder = orderItems.find(o => o.name === item.name);
                return (
                  <button
                    key={i}
                    onClick={() => addItem(item)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] transition-all"
                  >
                    <span className="font-body text-base text-zinc-200">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-base text-amber-400">£{item.price.toFixed(2)}</span>
                      {inOrder && (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-black font-heading text-sm flex items-center justify-center">
                          {inOrder.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-zinc-800 shrink-0">
              {orderItems.length > 0 && (
                <div className="space-y-1 mb-3">
                  {orderItems.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="font-body text-sm text-zinc-300">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(item.name, -1)} className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-600">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-heading text-sm text-zinc-200 w-4 text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item.name, 1)} className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-600">
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="font-body text-sm text-zinc-400 w-14 text-right">£{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setStep('confirm')}
                disabled={orderItems.length === 0}
                className="w-full min-h-[52px] rounded-xl font-heading text-lg uppercase tracking-wider transition-all
                  bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                {orderItems.length > 0 ? `Review — £${total.toFixed(2)}` : 'Select items'}
              </button>
            </div>
          </>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="p-5 space-y-4">
            <p className="font-body text-sm text-zinc-500 uppercase tracking-wider">Adding to Table {tableNumber}</p>
            <div className="space-y-2">
              {orderItems.map(item => (
                <div key={item.name} className="flex justify-between">
                  <span className="font-body text-base text-zinc-300">{item.quantity}× {item.name}</span>
                  <span className="font-body text-base text-zinc-400">£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-3">
              <span className="font-heading text-lg text-zinc-400 uppercase">Total</span>
              <span className="font-heading text-xl text-emerald-400">£{total.toFixed(2)}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('items')}
                className="flex-1 min-h-[52px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading text-base uppercase tracking-wider"
              >
                Back
              </button>
              <button
                onClick={confirm}
                disabled={sending}
                className="flex-1 min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Check className="w-4 h-4" /> Confirm</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}