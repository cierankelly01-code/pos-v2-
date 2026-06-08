import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { TrendingUp, Hash, Table2, ShoppingBag, ShieldCheck, Leaf } from 'lucide-react';

export default function OrdersOverview({ todayOrders, weekOrders }) {
  const [view, setView] = useState('today');

  const orders = view === 'today' ? todayOrders : weekOrders;
  const completedOrders = orders.filter(o => o.status === 'complete');
  const pendingOrders = orders.filter(o => o.status === 'pending');

  const revenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const topTable = useMemo(() => {
    const byTable = {};
    completedOrders.forEach(o => {
      if (!byTable[o.table_number]) byTable[o.table_number] = 0;
      byTable[o.table_number] += o.total || 0;
    });
    const entries = Object.entries(byTable);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { table: entries[0][0], total: entries[0][1] };
  }, [completedOrders]);

  const topItem = useMemo(() => {
    const counts = {};
    completedOrders.forEach(o => {
      (o.items || []).forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1);
      });
    });
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { name: entries[0][0], count: entries[0][1] };
  }, [completedOrders]);

  const avgOrderValue = completedOrders.length ? revenue / completedOrders.length : 0;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('today')}
          className={`flex-1 py-3 rounded-lg font-heading text-base uppercase tracking-wider transition-colors
            ${view === 'today' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
        >
          Today
        </button>
        <button
          onClick={() => setView('week')}
          className={`flex-1 py-3 rounded-lg font-heading text-base uppercase tracking-wider transition-colors
            ${view === 'week' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
        >
          This Week
        </button>
      </div>

      {view === 'week' && (
        <p className="font-body text-xs text-zinc-500 text-center -mt-2">
          {format(weekStart, 'EEE d MMM')} — {format(weekEnd, 'EEE d MMM')}
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="font-body text-xs text-emerald-400 uppercase tracking-wider">Revenue</p>
          </div>
          <p className="font-heading text-3xl text-emerald-400">£{revenue.toFixed(2)}</p>
          <p className="font-body text-xs text-zinc-500 mt-1">{view === 'today' ? 'today' : 'this week'}</p>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-4 h-4 text-amber-400" />
            <p className="font-body text-xs text-amber-400 uppercase tracking-wider">Orders</p>
          </div>
          <p className="font-heading text-3xl text-zinc-100">{completedOrders.length}</p>
          <p className="font-body text-xs text-zinc-500 mt-1">{pendingOrders.length} pending</p>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Table2 className="w-4 h-4 text-amber-400" />
            <p className="font-body text-xs text-amber-400 uppercase tracking-wider">Top Table</p>
          </div>
          {topTable ? (
            <>
              <p className="font-heading text-3xl text-zinc-100">#{topTable.table}</p>
              <p className="font-body text-xs text-zinc-500 mt-1">£{topTable.total.toFixed(2)} spent</p>
            </>
          ) : (
            <p className="font-heading text-2xl text-zinc-600">—</p>
          )}
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <p className="font-body text-xs text-amber-400 uppercase tracking-wider">Top Item</p>
          </div>
          {topItem ? (
            <>
              <p className="font-heading text-lg text-zinc-100 leading-tight">{topItem.name}</p>
              <p className="font-body text-xs text-zinc-500 mt-1">{topItem.count}× ordered</p>
            </>
          ) : (
            <p className="font-heading text-2xl text-zinc-600">—</p>
          )}
        </div>
      </div>

      {/* Avg order value */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-4 flex items-center justify-between">
        <span className="font-body text-base text-zinc-400 uppercase tracking-wider">Avg order value</span>
        <span className="font-heading text-2xl text-amber-400">£{avgOrderValue.toFixed(2)}</span>
      </div>

      {/* Per-table breakdown */}
      {completedOrders.length > 0 && (
        <div>
          <h3 className="font-heading text-base text-zinc-500 uppercase tracking-wider mb-3">Table Breakdown</h3>
          <div className="space-y-2">
            {(() => {
              const byTable = {};
              completedOrders.forEach(o => {
                if (!byTable[o.table_number]) byTable[o.table_number] = { total: 0, count: 0 };
                byTable[o.table_number].total += o.total || 0;
                byTable[o.table_number].count += 1;
              });
              return Object.entries(byTable)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([table, data]) => (
                  <div key={table} className="bg-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-heading text-lg text-zinc-100">Table {table}</span>
                      <span className="font-body text-sm text-zinc-500 ml-2">{data.count} order{data.count > 1 ? 's' : ''}</span>
                    </div>
                    <span className="font-heading text-lg text-amber-400">£{data.total.toFixed(2)}</span>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}

      {/* Orders list */}
      <div>
        <h3 className="font-heading text-base text-zinc-500 uppercase tracking-wider mb-3">
          All Orders {view === 'today' ? 'Today' : 'This Week'}
        </h3>
        <div className="space-y-2">
          {orders.length === 0 ? (
            <p className="text-center py-8 font-body text-lg text-zinc-500">No orders {view === 'today' ? 'today' : 'this week'}</p>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-zinc-800 rounded-lg px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-heading text-lg text-zinc-100">Table {order.table_number}</span>
                    <span className={`ml-3 font-body text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'complete'
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-amber-900/50 text-amber-400'
                    }`}>
                      {order.status}
                    </span>
                    <p className="font-body text-sm text-zinc-500 mt-0.5">
                      {(order.items || []).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-heading text-lg text-amber-400">£{order.total?.toFixed(2)}</p>
                    <p className="font-body text-xs text-zinc-500">{format(new Date(order.created_at), 'EEE HH:mm')}</p>
                  </div>
                </div>
                {/* Compliance badges */}
                <div className="flex gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-body ${
                    order.id_checked ? 'bg-amber-900/40 text-amber-400' : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    <ShieldCheck className="w-3 h-3" />
                    ID {order.id_checked ? 'Checked' : 'Not recorded'}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-body ${
                    order.allergy_checked ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    <Leaf className="w-3 h-3" />
                    Allergies {order.allergy_checked ? 'Asked' : 'Not recorded'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}