import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Banknote, CreditCard, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import StaffSelector from '@/components/staff/StaffSelector';
import { getSessionStaff, setSessionStaff } from '@/lib/useStaff';

const TIP_PRESETS = [2, 5, 10, 20];

export default function LiveTables() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [staff, setStaff] = useState(() => getSessionStaff());

  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get('table');
  const [expandedTable, setExpandedTable] = useState(tableParam ? parseInt(tableParam) : null);
  const [closingTable, setClosingTable] = useState(null);
  const [tipAmounts, setTipAmounts] = useState({});

  const { data: orders = [] } = useQuery({
    queryKey: ['live-tables-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tab_closed', false)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    refetchInterval: false,
    staleTime: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('live-tables-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['live-tables-orders'] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  const tableMap = {};
  orders.forEach(order => {
    const t = order.table_number;
    if (!tableMap[t]) {
      tableMap[t] = {
        tableNumber: t,
        orders: [],
        total: 0,
        staff_name: null,
        staff_colour: null,
      };
    }
    tableMap[t].orders.push(order);
    tableMap[t].total += order.total || 0;
    if (order.staff_name && !tableMap[t].staff_name) {
      tableMap[t].staff_name = order.staff_name;
      tableMap[t].staff_colour = order.staff_colour;
    }
  });

  const tables = Object.values(tableMap).sort((a, b) => a.tableNumber - b.tableNumber);

  const getTip = (tableNumber) => tipAmounts[tableNumber] ?? 0;

  const setTip = (tableNumber, amount) => {
    setTipAmounts(prev => ({ ...prev, [tableNumber]: Math.max(0, amount) }));
  };

  const closeTable = async (tableNumber, paymentMethod) => {
    setClosingTable({ tableNumber, paymentMethod });
    const tableOrders = tableMap[tableNumber]?.orders || [];
    const ids = tableOrders.map(o => o.id);
    const tip = getTip(tableNumber);

    if (ids.length) {
      await supabase.from('orders').update({
        tab_closed: true,
        payment_method: paymentMethod,
        status: 'complete',
        completed_at: new Date().toISOString(),
      }).in('id', ids);
    }

    if (tip > 0 && staff?.name) {
      await supabase.from('tips').insert({
        table_number: tableNumber,
        amount: tip,
        staff_name: staff.name,
        payment_method: paymentMethod,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-tips'] });
    }

    queryClient.invalidateQueries({ queryKey: ['live-tables-orders'] });
    setClosingTable(null);
    setExpandedTable(null);
    setTipAmounts(prev => {
      const next = { ...prev };
      delete next[tableNumber];
      return next;
    });
  };

  const handleStaffSelect = (selected) => {
    setSessionStaff(selected);
    setStaff(selected);
  };

  if (!staff) {
    return (
      <StaffSelector
        role="waiter"
        title="Who are you?"
        subtitle="Select your name to close tables"
        onSelect={handleStaffSelect}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-zinc-100">
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-heading text-2xl text-amber-400 uppercase tracking-wider">Live Tables</h1>
          <button
            onClick={() => { setSessionStaff(null); setStaff(null); }}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700"
            style={{ borderLeftColor: staff.colour, borderLeftWidth: '3px' }}
          >
            <span className="font-body text-sm text-zinc-300">{staff.name}</span>
          </button>
        </div>
        {tables.length > 0 && (
          <p className="font-body text-sm text-zinc-500 mt-2 pl-9">{tables.length} table{tables.length !== 1 ? 's' : ''} open</p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {tables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600/40" />
            <p className="font-heading text-2xl text-zinc-500 uppercase tracking-wider">All Clear</p>
            <p className="font-body text-base text-zinc-600">No open tables right now</p>
          </div>
        )}

        {tables.map(({ tableNumber, orders: tableOrders, total, staff_name, staff_colour }) => {
          const isExpanded = expandedTable === tableNumber;
          const isClosing = closingTable?.tableNumber === tableNumber;
          const tip = getTip(tableNumber);

          return (
            <div key={tableNumber} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedTable(isExpanded ? null : tableNumber)}
                className="w-full flex items-center justify-between px-5 py-5 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center border-2"
                    style={{ borderColor: staff_colour || '#52525b', backgroundColor: `${staff_colour || '#27272a'}44` }}
                  >
                    <span className="font-heading text-2xl text-amber-400">{tableNumber}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-heading text-xl text-zinc-100">Table {tableNumber}</p>
                    <p className="font-body text-sm text-zinc-500">
                      {tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''} · since {format(new Date(tableOrders[tableOrders.length - 1].created_at), 'HH:mm')}
                    </p>
                    {staff_name && (
                      <span
                        className="inline-block mt-1 px-2 py-0.5 rounded-full font-body text-xs"
                        style={{ backgroundColor: `${staff_colour || '#F59E0B'}33`, color: staff_colour || '#F59E0B' }}
                      >
                        {staff_name}
                      </span>
                    )}
                    {tableOrders.some(o => o.status === 'pending') && (
                      <span className="inline-block mt-1 ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-body text-xs">
                        Bar still making orders
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-2xl text-emerald-400">£{total.toFixed(2)}</span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
                  <div>
                    <p className="font-body text-xs text-zinc-500 uppercase tracking-wider mb-2">Items ordered</p>
                    <div className="space-y-1">
                      {(() => {
                        const itemMap = {};
                        tableOrders.forEach(o => {
                          (o.items || []).forEach(item => {
                            if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, price: item.price, quantity: 0 };
                            itemMap[item.name].quantity += item.quantity || 1;
                          });
                        });
                        return Object.values(itemMap).map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="font-body text-base text-zinc-300">{item.quantity}× {item.name}</span>
                            <span className="font-body text-base text-zinc-400">£{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                    <span className="font-heading text-lg text-zinc-400 uppercase">Order total</span>
                    <span className="font-heading text-2xl text-emerald-400">£{total.toFixed(2)}</span>
                  </div>

                  <div>
                    <p className="font-body text-xs text-zinc-500 uppercase tracking-wider mb-2">Add tip (optional)</p>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {TIP_PRESETS.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTip(tableNumber, preset)}
                          className={`min-h-[44px] rounded-lg font-heading text-base transition-colors
                            ${tip === preset ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                        >
                          £{preset}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <span className="font-body text-zinc-500 self-center">£</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tip || ''}
                        onChange={(e) => setTip(tableNumber, parseFloat(e.target.value) || 0)}
                        placeholder="Custom amount"
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 font-body rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    {tip > 0 && (
                      <p className="font-body text-xs text-amber-400/80 mt-2">
                        Tip £{tip.toFixed(2)} → {staff.name} (not added to order total)
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="font-body text-xs text-zinc-500 uppercase tracking-wider mb-2">Close & take payment</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        disabled={isClosing}
                        onClick={() => closeTable(tableNumber, 'cash')}
                        className="min-h-[64px] rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-heading text-lg uppercase tracking-wider flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Banknote className="w-6 h-6" />
                        {isClosing && closingTable.paymentMethod === 'cash' ? 'Closing...' : 'Cash'}
                      </button>
                      <button
                        disabled={isClosing}
                        onClick={() => closeTable(tableNumber, 'card')}
                        className="min-h-[64px] rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-heading text-lg uppercase tracking-wider flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <CreditCard className="w-6 h-6" />
                        {isClosing && closingTable.paymentMethod === 'card' ? 'Closing...' : 'Card'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
