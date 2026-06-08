import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfToday } from 'date-fns';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Hash, Table2, ShoppingBag, ShieldCheck, Leaf, Coins } from 'lucide-react';
import { TipsLeaderboard } from '@/components/admin/EndOfNightSummary';

const PAGE_SIZE = 50;

export default function OrdersOverview({ todayOrders, weekOrders, tips = [] }) {
  const [view, setView] = useState('today');

  const statsOrders = view === 'today' ? todayOrders : weekOrders;
  const completedOrders = statsOrders.filter(o => o.status === 'complete');
  const pendingOrders = statsOrders.filter(o => o.status === 'pending');

  const fromDate = useMemo(
    () => (view === 'today'
      ? startOfToday().toISOString()
      : startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()),
    [view]
  );

  const {
    data: listPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-orders', 'list', view],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
  });

  const listOrders = listPages?.pages.flat() ?? [];

  const revenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const periodTips = useMemo(() => {
    const from = view === 'today'
      ? startOfToday()
      : startOfWeek(new Date(), { weekStartsOn: 1 });
    return tips.filter(t => new Date(t.created_at) >= from);
  }, [view, tips]);

  const tipsTotal = periodTips.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const combinedTotal = revenue + tipsTotal;

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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-body text-xs text-zinc-500 uppercase">Revenue</span>
          </div>
          <p className="font-heading text-2xl text-emerald-400">£{revenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-body text-xs text-zinc-500 uppercase">Tips</span>
          </div>
          <p className="font-heading text-2xl text-amber-400">£{tipsTotal.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4 col-span-2">
          <span className="font-body text-xs text-zinc-500 uppercase">Combined</span>
          <p className="font-heading text-3xl text-zinc-100">£{combinedTotal.toFixed(2)}</p>
        </div>
      </div>

      <TipsLeaderboard tips={periodTips} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-zinc-500" />
          <div>
            <p className="font-body text-xs text-zinc-500 uppercase">Completed</p>
            <p className="font-heading text-xl text-zinc-100">{completedOrders.length}</p>
          </div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3">
          <Hash className="w-5 h-5 text-zinc-500" />
          <div>
            <p className="font-body text-xs text-zinc-500 uppercase">Pending</p>
            <p className="font-heading text-xl text-amber-400">{pendingOrders.length}</p>
          </div>
        </div>
        {topTable && (
          <div className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3">
            <Table2 className="w-5 h-5 text-zinc-500" />
            <div>
              <p className="font-body text-xs text-zinc-500 uppercase">Top table</p>
              <p className="font-heading text-lg text-zinc-100">T{topTable.table} · £{topTable.total.toFixed(2)}</p>
            </div>
          </div>
        )}
        {topItem && (
          <div className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-zinc-500" />
            <div>
              <p className="font-body text-xs text-zinc-500 uppercase">Top item</p>
              <p className="font-heading text-sm text-zinc-100">{topItem.name} ×{topItem.count}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
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

      {/* Orders list — paginated */}
      <div>
        <h3 className="font-heading text-base text-zinc-500 uppercase tracking-wider mb-3">
          All Orders {view === 'today' ? 'Today' : 'This Week'}
        </h3>
        <div className="space-y-2">
          {listOrders.length === 0 ? (
            <p className="text-center py-8 font-body text-lg text-zinc-500">No orders {view === 'today' ? 'today' : 'this week'}</p>
          ) : (
            listOrders.map(order => (
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
                    {order.staff_name && (
                      <span
                        className="inline-flex items-center gap-1 mt-1 text-xs font-body px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${order.staff_colour || '#F59E0B'}33`, color: order.staff_colour || '#F59E0B' }}
                      >
                        {order.staff_name}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-heading text-lg text-amber-400">£{order.total?.toFixed(2)}</p>
                    <p className="font-body text-xs text-zinc-500">{format(new Date(order.created_at), 'EEE HH:mm')}</p>
                  </div>
                </div>
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
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full mt-4 min-h-[48px] rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-heading text-sm uppercase tracking-wider text-zinc-300 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more orders'}
          </button>
        )}
      </div>
    </div>
  );
}
