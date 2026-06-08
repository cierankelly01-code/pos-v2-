import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/lib/useSettings';
import OrderCard from '@/components/bar/OrderCard';
import HistoryPanel from '@/components/bar/HistoryPanel';
import AddToTabModal from '@/components/bar/AddToTabModal';
import StaffSelector from '@/components/staff/StaffSelector';
import { getSessionStaff, setSessionStaff } from '@/lib/useStaff';
import { startOfToday } from 'date-fns';
import NavMenu from '@/components/NavMenu';
import { PlusCircle } from 'lucide-react';

// Synthesise a short "ding" using Web Audio API — no external files needed
function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) {
    // Audio not available — silent fail
  }
}

export default function BarPage() {
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();
  const [staff, setStaff] = useState(() => getSessionStaff());
  const [activeTab, setActiveTab] = useState('queue');
  const [flashActive, setFlashActive] = useState(false);
  const [showAddToTab, setShowAddToTab] = useState(false);
  const knownOrderIds = useRef(null); // null = first load, don't alert

  const todayStr = useMemo(() => startOfToday().toISOString(), []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['bar-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data.filter(o => new Date(o.created_at) >= new Date(todayStr));
    },
    refetchInterval: false,
    staleTime: 30000,
  });

  // Detect genuinely new pending orders and alert
  useEffect(() => {
    const pendingIds = orders.filter(o => o.status === 'pending').map(o => o.id);
    if (knownOrderIds.current === null) {
      // First load — seed known IDs silently
      knownOrderIds.current = new Set(pendingIds);
      return;
    }
    const hasNew = pendingIds.some(id => !knownOrderIds.current.has(id));
    if (hasNew) {
      playPing();
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 1000);
      // Switch to queue tab so bartender sees the order
      setActiveTab('queue');
    }
    knownOrderIds.current = new Set(pendingIds);
  }, [orders]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('bar-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['bar-orders'] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  const pendingOrders = useMemo(
    () => orders.filter(o => o.status === 'pending'),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter(o => o.status === 'complete'),
    [orders]
  );
  const occupiedTables = useMemo(
    () => [...new Set(orders.filter(o => !o.tab_closed).map(o => o.table_number))].sort((a, b) => a - b),
    [orders]
  );
  const completeOrder = async (order) => {
    await supabase.from('orders').update({
      status: 'complete',
      completed_at: new Date().toISOString(),
    }).eq('id', order.id);
    queryClient.invalidateQueries({ queryKey: ['bar-orders'] });
  };

  if (!staff) {
    return (
      <StaffSelector
        role="bar"
        title="Who are you?"
        subtitle="Select your name before the bar queue"
        onSelect={(s) => { setSessionStaff(s); setStaff(s); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] relative">
      {showAddToTab && (
        <AddToTabModal
          occupiedTables={occupiedTables}
          staff={staff}
          onClose={() => setShowAddToTab(false)}
          onDone={() => {
            setShowAddToTab(false);
            queryClient.invalidateQueries({ queryKey: ['bar-orders'] });
          }}
        />
      )}

      {/* Amber flash overlay on new order */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 bg-amber-400 transition-opacity duration-300 ${
          flashActive ? 'opacity-20' : 'opacity-0'
        }`}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f5f0e8] border-b border-stone-300">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <NavMenu />
              <h1 className="font-heading text-2xl text-stone-800 uppercase tracking-wider">
                {settings?.venue_name || 'Stratford Bar'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSessionStaff(null); setStaff(null); }}
                className="px-3 py-1.5 rounded-lg bg-stone-200 font-body text-sm text-stone-700 border-l-4"
                style={{ borderLeftColor: staff.colour }}
              >
                {staff.name}
              </button>
              <button
              onClick={() => setShowAddToTab(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-heading text-base uppercase tracking-wider transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add to Tab
            </button>
            </div>
          </div>

          <div className="flex">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-3 font-heading text-base uppercase tracking-wider transition-colors rounded-l-lg border border-stone-300
                ${activeTab === 'queue'
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-500 hover:text-stone-700'
                }`}
            >
              Queue
              {pendingOrders.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black text-sm font-heading">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 font-heading text-base uppercase tracking-wider transition-colors rounded-r-lg border border-stone-300 border-l-0
                ${activeTab === 'history'
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-500 hover:text-stone-700'
                }`}
            >
              History ({completedOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'queue' ? (
          pendingOrders.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-heading text-3xl text-stone-300 uppercase tracking-wider">All clear</p>
              <p className="font-body text-lg text-stone-400 mt-2">Waiting for orders…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onComplete={completeOrder}
                />
              ))}
            </div>
          )
        ) : (
          <HistoryPanel orders={completedOrders} />
        )}
      </div>
    </div>
  );
}