import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import TableSelector from '@/components/order/TableSelector';
import MenuItem from '@/components/order/MenuItem';
import OrderPanel from '@/components/order/OrderPanel';
import ConfirmModal from '@/components/order/ConfirmModal';
import SuccessScreen from '@/components/order/SuccessScreen';
import { ShoppingCart } from 'lucide-react';
import NavMenu from '@/components/NavMenu';
import ChecklistModal from '@/components/order/ChecklistModal';
import IdCalculator from '@/components/order/IdCalculator';
import AllergenFilterBar from '@/components/order/AllergenFilterBar';
import DrinksCategoryMenu from '@/components/order/DrinksCategoryMenu';
import StaffSelector from '@/components/staff/StaffSelector';
import { getSessionStaff, setSessionStaff } from '@/lib/useStaff';

export default function OrderPage() {
  const { data: settings, isLoading } = useSettings();
  const [staff, setStaff] = useState(() => getSessionStaff());
  const [step, setStep] = useState('table');
  const [tableNumber, setTableNumber] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState('drinks');
  const [sending, setSending] = useState(false);
  const [checks, setChecks] = useState({ idChecked: false, allergyChecked: false, allergens: [] });
  const [activeAllergens, setActiveAllergens] = useState([]);

  const menuItems = useMemo(() => {
    if (!settings?.menu_items) return { drinks: [], food: [] };
    return {
      drinks: settings.menu_items.filter(i => i.category === 'drinks'),
      food: settings.menu_items.filter(i => i.category === 'food'),
    };
  }, [settings]);

  const total = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [orderItems]
  );

  const itemCount = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.quantity, 0),
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

  const updateQty = (idx, qty) => {
    setOrderItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: qty };
      return next;
    });
  };

  const removeItem = (idx) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const sendOrder = async () => {
    setSending(true);
    const { error } = await supabase.from('orders').insert({
      table_number: tableNumber,
      items: orderItems,
      note: note || '',
      total,
      status: 'pending',
      id_checked: checks.idChecked,
      allergy_checked: checks.allergyChecked,
      allergens: checks.allergens || [],
      tab_closed: false,
      staff_name: staff?.name || null,
      staff_colour: staff?.colour || null,
    });
    if (error) console.error('Order error:', error);
    setSending(false);
    setShowConfirm(false);
    setStep('success');
  };

  const resetOrder = () => {
    setStep('table');
    setTableNumber(null);
    setOrderItems([]);
    setNote('');
    setShowCart(false);
    setChecks({ idChecked: false, allergyChecked: false, allergens: [] });
    setActiveAllergens([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!staff) {
    return (
      <StaffSelector
        role="waiter"
        title="Who are you?"
        subtitle="Select your name before taking orders"
        onSelect={(s) => { setSessionStaff(s); setStaff(s); }}
      />
    );
  }

  if (step === 'table') {
    return <TableSelector onSelect={(n) => { setTableNumber(n); setStep('checklist'); }} />;
  }

  if (step === 'checklist') {
    return (
      <ChecklistModal
        tableNumber={tableNumber}
        onConfirm={(c) => { setChecks(c); setActiveAllergens(c.allergens || []); setStep('menu'); }}
      />
    );
  }

  if (step === 'success') {
    return <SuccessScreen tableNumber={tableNumber} onNewOrder={resetOrder} />;
  }

  // Menu step — filter out items containing any active allergen
  const allTabItems = menuItems[activeTab] || [];
  const currentItems = allTabItems.filter(item => {
    if (activeAllergens.length === 0) return true;
    const itemAllergens = item.allergens || [];
    return !activeAllergens.some(a => itemAllergens.includes(a));
  });
  const hiddenCount = allTabItems.length - currentItems.length;

  const toggleAllergenFilter = (a) => {
    setActiveAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col lg:flex-row">
      {/* Menu side */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <NavMenu />
            <button onClick={() => { setStep('table'); setOrderItems([]); setNote(''); }} className="font-body text-zinc-500 hover:text-zinc-300 text-base">
              ← Back
            </button>
          </div>
          <h2 className="font-heading text-xl text-amber-400 uppercase tracking-wider">
            Table {tableNumber}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSessionStaff(null); setStaff(null); }}
              className="px-3 py-1 rounded-lg font-body text-xs border border-zinc-700 text-zinc-400"
              style={{ borderLeftColor: staff.colour, borderLeftWidth: '3px' }}
            >
              {staff.name}
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="relative lg:hidden text-zinc-300 hover:text-amber-400 p-2"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-black text-xs font-heading rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex border-b border-zinc-800">
          {[{ key: 'drinks', label: 'Drinks' }, { key: 'food', label: 'Deli Food' }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-4 font-heading text-lg uppercase tracking-wider transition-colors
                ${activeTab === tab.key
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Allergen filter bar */}
        <AllergenFilterBar
          activeAllergens={activeAllergens}
          onToggle={toggleAllergenFilter}
          onClearAll={() => setActiveAllergens([])}
        />

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-24 lg:pb-3">
          {hiddenCount > 0 && (
            <div className="bg-amber-950/30 border border-amber-700/30 rounded-lg px-4 py-2.5 text-center">
              <p className="font-body text-sm text-amber-400">
                {hiddenCount} item{hiddenCount > 1 ? 's' : ''} hidden due to allergen filters
              </p>
            </div>
          )}
          {activeTab === 'drinks'
            ? <DrinksCategoryMenu items={currentItems} onAdd={addItem} />
            : currentItems.map((item, i) => <MenuItem key={i} item={item} onAdd={addItem} />)
          }
        </div>

        {/* Mobile bottom bar */}
        {itemCount > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-zinc-900/95 border-t border-zinc-800 backdrop-blur-sm">
            <button
              onClick={() => setShowCart(true)}
              className="w-full min-h-[60px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-lg uppercase tracking-wider flex items-center justify-center gap-3"
            >
              <span>View Order ({itemCount})</span>
              <span className="text-emerald-200">£{total.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Order panel — desktop sidebar */}
      <div className="hidden lg:flex w-[380px] border-l border-zinc-800 bg-zinc-900/50 flex-col">
        <OrderPanel
          items={orderItems}
          note={note}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onNoteChange={setNote}
          total={total}
          tableNumber={tableNumber}
          onSend={() => setShowConfirm(true)}
        />
      </div>

      {/* Mobile cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl max-h-[85vh] flex flex-col">
            <OrderPanel
              items={orderItems}
              note={note}
              onUpdateQty={updateQty}
              onRemove={removeItem}
              onNoteChange={setNote}
              total={total}
              tableNumber={tableNumber}
              onSend={() => { setShowCart(false); setShowConfirm(true); }}
              onClose={() => setShowCart(false)}
            />
          </div>
        </div>
      )}

      {/* ID Calculator floating button */}
      <IdCalculator />

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          tableNumber={tableNumber}
          items={orderItems}
          total={total}
          note={note}
          onCancel={() => !sending && setShowConfirm(false)}
          onConfirm={sendOrder}
          sending={sending}
        />
      )}
    </div>
  );
}