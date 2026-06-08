import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, isToday, parseISO } from 'date-fns';
import NavMenu from '@/components/NavMenu';
import NewBookingForm from '@/components/bookings/NewBookingForm';
import TodaysBookings from '@/components/bookings/TodaysBookings';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const todayBookings = useMemo(
    () => bookings.filter(b => b.date && isToday(parseISO(b.date))).sort((a, b) => a.time?.localeCompare(b.time)),
    [bookings]
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-zinc-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <NavMenu />
            <h1 className="font-heading text-2xl text-purple-400 uppercase tracking-wider">Bookings</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-3 rounded-lg font-heading text-base uppercase tracking-wider transition-colors relative
                ${activeTab === 'today' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              Today
              {todayBookings.length > 0 && (
                <span className="absolute top-1.5 right-2 min-w-[20px] h-5 px-1.5 bg-purple-400 text-black font-heading text-xs rounded-full flex items-center justify-center">
                  {todayBookings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-3 rounded-lg font-heading text-base uppercase tracking-wider transition-colors
                ${activeTab === 'new' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              + New Booking
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 rounded-lg font-heading text-base uppercase tracking-wider transition-colors
                ${activeTab === 'all' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'today' && (
          <TodaysBookings bookings={todayBookings} loading={isLoading} onRefresh={refresh} />
        )}
        {activeTab === 'new' && (
          <NewBookingForm onSaved={() => { refresh(); setActiveTab('today'); }} />
        )}
        {activeTab === 'all' && (
          <AllBookings bookings={bookings} loading={isLoading} onRefresh={refresh} />
        )}
      </div>
    </div>
  );
}

function AllBookings({ bookings, loading, onRefresh }) {
  const queryClient = useQueryClient();

  const updateStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    onRefresh();
  };

  if (loading) return <div className="text-center py-12 text-zinc-600 font-body">Loading...</div>;
  if (!bookings.length) return <div className="text-center py-12 text-zinc-600 font-body">No bookings yet</div>;

  const grouped = bookings.reduce((acc, b) => {
    const key = b.date || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date}>
          <p className="font-heading text-sm text-zinc-500 uppercase tracking-wider mb-2 px-1">
            {date === 'Unknown' ? 'Unknown Date' : format(parseISO(date), 'EEEE d MMMM yyyy')}
            {isToday(parseISO(date)) && <span className="ml-2 text-purple-400">— Today</span>}
          </p>
          <div className="space-y-2">
            {grouped[date].map(b => (
              <BookingCard key={b.id} booking={b} onStatusChange={updateStatus} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingCard({ booking, onStatusChange }) {
  const statusColours = {
    confirmed: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
    arrived: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/40',
    no_show: 'text-red-400 bg-red-900/30 border-red-700/40',
    cancelled: 'text-zinc-500 bg-zinc-800/30 border-zinc-700/40',
  };

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${statusColours[booking.status] || 'border-zinc-700 bg-zinc-800/30'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg text-zinc-100">{booking.name}</p>
          <p className="font-body text-sm text-zinc-400">{booking.time} · {booking.party_size} guest{booking.party_size !== 1 ? 's' : ''}</p>
        </div>
        <select
          value={booking.status}
          onChange={e => onStatusChange(booking.id, e.target.value)}
          className="bg-zinc-700 border border-zinc-600 text-zinc-200 font-body text-sm rounded-lg px-2 py-1 focus:outline-none"
        >
          <option value="confirmed">Confirmed</option>
          <option value="arrived">Arrived</option>
          <option value="no_show">No Show</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {(booking.phone || booking.email) && (
        <p className="font-body text-xs text-zinc-500">{booking.phone}{booking.phone && booking.email ? ' · ' : ''}{booking.email}</p>
      )}
      {booking.table_preference && <p className="font-body text-xs text-zinc-500">Pref: {booking.table_preference}</p>}
      {booking.occasion && booking.occasion !== 'none' && (
        <p className="font-body text-xs text-amber-400/80 capitalize">🎉 {booking.occasion}</p>
      )}
      {booking.dietary_notes && <p className="font-body text-xs text-orange-400/80">⚠ {booking.dietary_notes}</p>}
      {booking.special_requests && <p className="font-body text-xs text-zinc-400 italic">"{booking.special_requests}"</p>}
      {booking.notes && <p className="font-body text-xs text-zinc-500 border-t border-zinc-700/50 pt-2">Staff note: {booking.notes}</p>}
    </div>
  );
}