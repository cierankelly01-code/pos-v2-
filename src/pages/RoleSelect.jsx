import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function RoleSelect() {
  const navigate = useNavigate();

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['roleselect-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tab_closed', false)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  // Count unique open tables (any order not yet tab-closed by waiter)
  const openTables = new Set(activeOrders.map(o => o.table_number)).size;

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="font-heading text-3xl text-amber-400 uppercase tracking-widest mb-4">
        Stratford Bar
      </h1>

      <button
        onClick={() => navigate('/order')}
        className="w-full max-w-sm min-h-[120px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-2 border-zinc-700 hover:border-amber-500/50 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2"
      >
        <span className="font-heading text-4xl text-amber-400 uppercase tracking-wider">Waiter</span>
        <span className="font-body text-base text-zinc-500">Take orders at tables</span>
      </button>

      <button
        onClick={() => navigate('/bar')}
        className="w-full max-w-sm min-h-[120px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-2 border-zinc-700 hover:border-emerald-500/50 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2"
      >
        <span className="font-heading text-4xl text-emerald-400 uppercase tracking-wider">Bar</span>
        <span className="font-body text-base text-zinc-500">View &amp; complete live orders</span>
      </button>

      <button
        onClick={() => navigate('/tables')}
        className="w-full max-w-sm min-h-[120px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-2 border-zinc-700 hover:border-blue-500/50 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2 relative"
      >
        <span className="font-heading text-4xl text-blue-400 uppercase tracking-wider">Live Tables</span>
        <span className="font-body text-base text-zinc-500">Close tables &amp; take payment</span>
        {openTables > 0 && (
          <span className="absolute top-4 right-4 min-w-[28px] h-7 px-2 bg-blue-500 text-white font-heading text-base rounded-full flex items-center justify-center">
            {openTables}
          </span>
        )}
      </button>

      <button
        onClick={() => navigate('/bookings')}
        className="w-full max-w-sm min-h-[120px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-2 border-zinc-700 hover:border-purple-500/50 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2 relative"
      >
        <span className="font-heading text-4xl text-purple-400 uppercase tracking-wider">Bookings</span>
        <span className="font-body text-base text-zinc-500">Take &amp; manage reservations</span>
      </button>

      <button
        onClick={() => navigate('/admin')}
        className="w-full max-w-sm min-h-[120px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-2 border-zinc-700 hover:border-zinc-500/50 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2"
      >
        <span className="font-heading text-4xl text-zinc-300 uppercase tracking-wider">Admin</span>
        <span className="font-body text-base text-zinc-500">Manage menu &amp; settings</span>
      </button>
    </div>
  );
}