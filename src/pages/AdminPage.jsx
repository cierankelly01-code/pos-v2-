import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettings, useUpdateSettings } from '@/lib/useSettings';
import MenuEditor from '@/components/admin/MenuEditor';
import OrdersOverview from '@/components/admin/OrdersOverview';
import FirstTimeSetup from '@/components/admin/FirstTimeSetup';
import AppSettings from '@/components/admin/AppSettings';
import FloorMapEditor from '@/components/admin/FloorMapEditor';
import MarketingList from '@/components/admin/MarketingList';
import StaffEditor from '@/components/admin/StaffEditor';
import EndOfNightSummary from '@/components/admin/EndOfNightSummary';
import PinGate from '@/components/admin/PinGate';
import DatabaseSetupNotice, { isSchemaMissingError } from '@/components/DatabaseSetupNotice';
import { startOfToday, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import NavMenu from '@/components/NavMenu';

const ADMIN_UNLOCK_KEY = 'admin_unlocked';

export default function AdminPage() {
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('menu');
  const [tableCount, setTableCount] = useState(null);
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(ADMIN_UNLOCK_KEY) === '1'
  );
  const [showEndOfNight, setShowEndOfNight] = useState(false);

  const todayStr = useMemo(() => startOfToday().toISOString(), []);
  const weekStr = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(), []);

  const { data: allOrders = [], refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refetch();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refetch]);

  const { data: allTips = [] } = useQuery({
    queryKey: ['admin-tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-tips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tips' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-tips'] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  const todayOrders = useMemo(() => allOrders.filter(o => new Date(o.created_at) >= new Date(todayStr)), [allOrders, todayStr]);
  const weekOrders = useMemo(() => allOrders.filter(o => new Date(o.created_at) >= new Date(weekStr)), [allOrders, weekStr]);

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (settingsError?.message === 'DATABASE_NOT_SETUP' || isSchemaMissingError(settingsError?.cause)) {
    return <DatabaseSetupNotice />;
  }

  // First-time setup — before PIN gate
  if (!settings?.setup_complete) {
    return (
      <FirstTimeSetup
        onComplete={() => {
          sessionStorage.setItem(ADMIN_UNLOCK_KEY, '1');
          setUnlocked(true);
          queryClient.invalidateQueries({ queryKey: ['settings'] });
        }}
      />
    );
  }

  if (!unlocked) {
    return (
      <PinGate
        correctPin={settings.admin_pin || '1234'}
        onUnlock={() => {
          sessionStorage.setItem(ADMIN_UNLOCK_KEY, '1');
          setUnlocked(true);
        }}
      />
    );
  }

  const saveMenu = async (items) => {
    await updateSettings.mutateAsync({ menu_items: items });
    toast.success('Menu saved');
  };

  const saveTableCount = async () => {
    const count = parseInt(tableCount ?? settings?.table_count);
    if (count < 1 || count > 99) return;
    await updateSettings.mutateAsync({ table_count: count });
    toast.success('Table count updated');
  };

  const clearQueue = async () => {
    const pending = allOrders.filter(o => o.status === 'pending');
    if (!pending.length) {
      toast.message('No pending orders to clear');
      return;
    }
    const { error } = await supabase.from('orders').delete().eq('status', 'pending');
    if (error) {
      toast.error('Failed to clear queue');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    toast.success(`Cleared ${pending.length} pending orders`);
  };

  const wipeAllOrders = async () => {
    if (!window.confirm('Wipe ALL orders? This cannot be undone.')) return;
    const { error } = await supabase.from('orders').delete().gte('created_at', '1970-01-01');
    if (error) {
      toast.error('Failed to wipe orders');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    toast.success(`Wiped ${allOrders.length} orders`);
  };

  const saveFloorMap = async (floorMap) => {
    await updateSettings.mutateAsync({ floor_map: floorMap });
  };

  const tabs = [
    { key: 'menu', label: 'Menu' },
    { key: 'staff', label: 'Staff' },
    { key: 'tables', label: 'Tables' },
    { key: 'floormap', label: 'Map' },
    { key: 'orders', label: 'Orders' },
    { key: 'marketing', label: 'Mktg' },
    { key: 'settings', label: 'Set' },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-zinc-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <NavMenu />
            <h1 className="font-heading text-2xl text-amber-400 uppercase tracking-wider flex-1">
              Admin Panel
            </h1>
            <button
              onClick={() => setShowEndOfNight(true)}
              className="shrink-0 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-heading text-xs uppercase tracking-wider text-amber-400"
            >
              End of Night
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 rounded-lg font-heading text-sm uppercase tracking-wider transition-colors shrink-0 min-w-[4rem]
                  ${activeTab === tab.key
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'menu' && (
          <MenuEditor menuItems={settings?.menu_items || []} onSave={saveMenu} />
        )}

        {activeTab === 'staff' && (
          <StaffEditor />
        )}

        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div>
              <label className="font-body text-sm text-zinc-400 uppercase tracking-wider block mb-2">
                Number of Tables
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={tableCount ?? settings?.table_count ?? 40}
                  onChange={e => setTableCount(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 font-heading text-2xl rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  onClick={saveTableCount}
                  className="min-h-[56px] px-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-heading text-base uppercase tracking-wider transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <h3 className="font-heading text-lg text-red-400 uppercase tracking-wider mb-3">Danger Zone</h3>
              <div className="space-y-3">
                <button
                  onClick={clearQueue}
                  className="w-full min-h-[56px] rounded-lg bg-red-900/30 hover:bg-red-900/50 border border-red-700/30 text-red-400 font-heading text-base uppercase tracking-wider transition-colors"
                >
                  Clear All Pending Orders
                </button>
                <button
                  onClick={wipeAllOrders}
                  className="w-full min-h-[56px] rounded-lg bg-red-900/50 hover:bg-red-900/70 border border-red-600/50 text-red-300 font-heading text-base uppercase tracking-wider transition-colors"
                >
                  ⚠ Wipe ALL Orders (Testing)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'floormap' && (
          <FloorMapEditor settings={settings} onSave={saveFloorMap} />
        )}

        {activeTab === 'orders' && (
          <OrdersOverview todayOrders={todayOrders} weekOrders={weekOrders} tips={allTips} />
        )}

        {activeTab === 'marketing' && (
          <MarketingList />
        )}

        {activeTab === 'settings' && (
          <AppSettings settings={settings} />
        )}
      </div>

      {showEndOfNight && (
        <EndOfNightSummary
          orders={allOrders}
          tips={allTips}
          onClose={() => setShowEndOfNight(false)}
        />
      )}
    </div>
  );
}