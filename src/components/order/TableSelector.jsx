import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import NavMenu from '@/components/NavMenu';
import { Users, Clock } from 'lucide-react';

const DEFAULT_FLOOR_MAP = [
  {
    id: 'ground',
    label: 'First Floor — Back Seating',
    tables: [
      { id: 'G1', seats: 4 },
      { id: 'G2', seats: 4 },
      { id: 'G3', seats: 2 },
      { id: 'G4', seats: 2 },
    ],
  },
  {
    id: 'upper',
    label: 'Second Floor — Seating',
    tables: [
      { id: 'U1', seats: 4 },
      { id: 'U2', seats: 4 },
      { id: 'U3', seats: 2 },
      { id: 'U4', seats: 2 },
    ],
  },
];

export default function TableSelector({ onSelect }) {
  const { data: settings } = useSettings();
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const floorMap = settings?.floor_map?.length ? settings.floor_map : DEFAULT_FLOOR_MAP;

  // Build ID ↔ number maps dynamically from whatever's in settings
  const { tableIdToNum, tableNumToId } = useMemo(() => {
    const allTables = floorMap.flatMap(f => f.tables);
    return {
      tableIdToNum: Object.fromEntries(allTables.map((t, i) => [t.id, i + 1])),
      tableNumToId: Object.fromEntries(allTables.map((t, i) => [i + 1, t.id])),
    };
  }, [floorMap]);

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['tableselector-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('table_number')
        .eq('tab_closed', false)
        .limit(200);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: todaysBookings = [] } = useQuery({
    queryKey: ['tableselector-bookings'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', today)
        .neq('status', 'cancelled')
        .order('time', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const occupiedNums = new Set(activeOrders.map(o => o.table_number));
  const occupiedIds = new Set(
    [...occupiedNums].map(n => tableNumToId[n]).filter(Boolean)
  );

  // Check if a table has an upcoming booking within 2 hours
  const hasUpcomingBooking = (tableId) => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    return todaysBookings.some(b => {
      const bookingTime = new Date(`${b.date}T${b.time}`);
      return bookingTime >= now && bookingTime <= twoHoursLater;
    });
  };

  const reservedIds = new Set(
    todaysBookings
      .filter(b => hasUpcomingBooking('any'))
      .map(b => b.table_preference)
      .filter(Boolean)
  );

  const handleSelect = (tableId) => {
    setSelected(tableId === selected ? null : tableId);
  };

  const handleContinue = () => {
    if (!selected) return;
    onSelect(tableIdToNum[selected]);
  };

  const handleCloseTab = () => {
    if (!selected) return;
    navigate(`/tables?table=${tableIdToNum[selected]}`);
  };

  const isOccupied = selected && occupiedIds.has(selected);

  return (
    <div className="min-h-screen bg-[#110a0a] flex flex-col items-center justify-start p-4 pt-16">
      <div className="absolute top-4 left-4">
        <NavMenu />
      </div>

      <h1 className="font-heading text-4xl text-amber-500 mb-1 tracking-widest uppercase">
        Select Table
      </h1>
      <p className="text-zinc-600 font-body text-base mb-8 tracking-wide">Tap a table to begin</p>

      {/* Floor sections */}
      <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-6 mb-8">
        {floorMap.map((floor, floorIdx) => (
          <div key={floorIdx} className="flex-1">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-px flex-1 bg-red-900/40" />
              <span className="font-heading text-xs text-red-400/80 uppercase tracking-widest whitespace-nowrap">
                {floor.label}
              </span>
              <div className="h-px flex-1 bg-red-900/40" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {floor.tables.map((table) => {
                const occupied = occupiedIds.has(table.id);
                const isSelected = selected === table.id;
                const hasBooking = todaysBookings.some(b => 
                  b.table_preference && 
                  (b.table_preference.toLowerCase().includes('first') || b.table_preference.toLowerCase().includes('second')) &&
                  hasUpcomingBooking('any')
                );

                let baseStyle = '';
                if (isSelected) {
                  baseStyle = 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-900/50 scale-[1.03]';
                } else if (occupied) {
                  baseStyle = 'bg-red-950/70 border-red-700/70 text-red-300 hover:bg-red-900/60';
                } else if (hasBooking) {
                  baseStyle = 'bg-purple-950/70 border-purple-700/70 text-purple-300 hover:bg-purple-900/60';
                } else {
                  baseStyle = 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/50';
                }

                return (
                  <button
                    key={table.id}
                    onClick={() => handleSelect(table.id)}
                    className={`relative rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[90px] ${baseStyle}`}
                  >
                    <span className="font-heading text-2xl tracking-wider">{table.id}</span>
                    <div className="flex items-center gap-1 opacity-70">
                      <Users className="w-3 h-3" />
                      <span className="font-body text-xs">{table.seats}</span>
                    </div>
                    {occupied && !isSelected && (
                      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {hasBooking && !isSelected && !occupied && (
                      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-600" />
          <span className="font-body text-xs text-zinc-600">Free</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-700" />
          <span className="font-body text-xs text-zinc-600">Tab open</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-700" />
          <span className="font-body text-xs text-zinc-600">Booking soon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="font-body text-xs text-zinc-600">Selected</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-2xl">
        {isOccupied ? (
          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              className="flex-1 min-h-[64px] rounded-xl font-heading text-xl uppercase tracking-wider bg-amber-700 hover:bg-amber-600 text-white transition-all active:scale-[0.98]"
            >
              Add to Tab
            </button>
            <button
              onClick={handleCloseTab}
              className="flex-1 min-h-[64px] rounded-xl font-heading text-xl uppercase tracking-wider bg-red-900 hover:bg-red-800 text-red-200 border border-red-700/50 transition-all active:scale-[0.98]"
            >
              Close Tab
            </button>
          </div>
        ) : (
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full min-h-[64px] rounded-xl font-heading text-2xl uppercase tracking-wider transition-all active:scale-[0.98]
              ${selected
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40'
                : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800'
              }`}
          >
            {selected ? `Continue — Table ${selected}` : 'Select a Table'}
          </button>
        )}
      </div>
    </div>
  );
}