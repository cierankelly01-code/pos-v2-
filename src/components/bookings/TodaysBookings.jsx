import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Phone, Mail, Clock, AlertTriangle, Star, StickyNote, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', colour: 'bg-blue-900/40 border-blue-700/50 text-blue-300', badge: 'bg-blue-800 text-blue-200' },
  arrived:   { label: 'Arrived',   colour: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300', badge: 'bg-emerald-800 text-emerald-200' },
  no_show:   { label: 'No Show',   colour: 'bg-red-900/40 border-red-700/50 text-red-300', badge: 'bg-red-900 text-red-300' },
  cancelled: { label: 'Cancelled', colour: 'bg-zinc-800/40 border-zinc-700/50 text-zinc-500', badge: 'bg-zinc-800 text-zinc-500' },
};

export default function TodaysBookings({ bookings, loading, onRefresh }) {
  const [updating, setUpdating] = useState(null);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    await supabase.from('bookings').update({ status }).eq('id', id);
    setUpdating(null);
    onRefresh();
  };

  const todayLabel = format(new Date(), 'EEEE d MMMM yyyy');

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const arrived = bookings.filter(b => b.status === 'arrived');
  const others = bookings.filter(b => b.status !== 'confirmed' && b.status !== 'arrived');

  if (loading) return <div className="text-center py-12 text-zinc-600 font-body">Loading...</div>;

  return (
    <div className="space-y-5">
      {/* Date + stats bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-lg text-purple-400 uppercase tracking-wider">{todayLabel}</p>
          <p className="font-body text-sm text-zinc-500">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} · {arrived.length} arrived · {confirmed.length} expected
          </p>
        </div>
        <button onClick={onRefresh} className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-16">
          <p className="font-heading text-2xl text-zinc-700 uppercase tracking-wider">No Bookings Today</p>
          <p className="font-body text-sm text-zinc-600 mt-2">Walk-ins only today</p>
        </div>
      )}

      {/* Expected (confirmed) */}
      {confirmed.length > 0 && (
        <section>
          <p className="font-body text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">Expected</p>
          <div className="space-y-3">
            {confirmed.map(b => (
              <BookingRow key={b.id} booking={b} onStatus={updateStatus} updating={updating === b.id} />
            ))}
          </div>
        </section>
      )}

      {/* Arrived */}
      {arrived.length > 0 && (
        <section>
          <p className="font-body text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">Arrived ✓</p>
          <div className="space-y-3">
            {arrived.map(b => (
              <BookingRow key={b.id} booking={b} onStatus={updateStatus} updating={updating === b.id} />
            ))}
          </div>
        </section>
      )}

      {/* No shows / cancelled */}
      {others.length > 0 && (
        <section>
          <p className="font-body text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">Other</p>
          <div className="space-y-3">
            {others.map(b => (
              <BookingRow key={b.id} booking={b} onStatus={updateStatus} updating={updating === b.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingRow({ booking, onStatus, updating }) {
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.colour}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading text-xl text-zinc-100">{booking.name}</p>
            {booking.occasion && booking.occasion !== 'none' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-800/40 border border-amber-600/40 text-amber-400 font-body text-xs capitalize">
                <Star className="w-3 h-3" />{booking.occasion}
              </span>
            )}
            {booking.deposit_paid && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-700/50 text-emerald-400 font-body text-xs">£ Deposit paid</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-body text-sm text-zinc-400">
              <Clock className="w-3.5 h-3.5" />{booking.time}
            </span>
            <span className="flex items-center gap-1 font-body text-sm text-zinc-400">
              <Users className="w-3.5 h-3.5" />{booking.party_size} guest{booking.party_size !== 1 ? 's' : ''}
            </span>
            {booking.table_preference && (
              <span className="font-body text-sm text-zinc-500">{booking.table_preference}</span>
            )}
          </div>
        </div>

        {/* Status selector */}
        <select
          value={booking.status}
          disabled={updating}
          onChange={e => onStatus(booking.id, e.target.value)}
          className={`shrink-0 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 font-body text-sm px-2 py-1.5 focus:outline-none ${updating ? 'opacity-50' : ''}`}
        >
          <option value="confirmed">Confirmed</option>
          <option value="arrived">Arrived</option>
          <option value="no_show">No Show</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Contact */}
      {(booking.phone || booking.email) && (
        <div className="flex gap-4 flex-wrap">
          {booking.phone && (
            <a href={`tel:${booking.phone}`} className="flex items-center gap-1.5 font-body text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              <Phone className="w-3.5 h-3.5" />{booking.phone}
            </a>
          )}
          {booking.email && (
            <a href={`mailto:${booking.email}`} className="flex items-center gap-1.5 font-body text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              <Mail className="w-3.5 h-3.5" />{booking.email}
            </a>
          )}
        </div>
      )}

      {/* Alerts */}
      {booking.dietary_notes && (
        <div className="flex items-start gap-2 bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="font-body text-sm text-orange-300">{booking.dietary_notes}</p>
        </div>
      )}

      {booking.special_requests && (
        <p className="font-body text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3">"{booking.special_requests}"</p>
      )}

      {booking.notes && (
        <div className="flex items-start gap-2 border-t border-zinc-700/50 pt-2">
          <StickyNote className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
          <p className="font-body text-xs text-zinc-500">{booking.notes}</p>
        </div>
      )}
    </div>
  );
}