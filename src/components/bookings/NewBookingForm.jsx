import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { sendBookingEmail } from '@/lib/sendBookingEmail';
import { Loader2, Check } from 'lucide-react';

const OCCASIONS = ['none', 'birthday', 'anniversary', 'work event', 'date night', 'other'];
const TIME_SLOTS = [
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30',
];

const EMPTY = {
  name: '', email: '', phone: '', date: '', time: '19:00',
  party_size: 2, table_preference: '', occasion: 'none',
  dietary_notes: '', special_requests: '', deposit_paid: false, notes: '',
  marketing_email: false, marketing_sms: false, marketing_phone: false,
};

function Checkbox({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0
        ${checked ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-zinc-600'}`}
    >
      {checked && <Check className="w-4 h-4 text-black" />}
    </button>
  );
}

export default function NewBookingForm({ onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.time || !form.party_size) return;
    setSaving(true);
    const { error } = await supabase.from('bookings').insert({
      ...form,
      party_size: parseInt(form.party_size),
      status: 'confirmed',
    });
    if (error) console.error('Booking error:', error);

    if (form.email) {
      try {
        await sendBookingEmail({
          to: form.email,
          subject: 'Booking Confirmation - Stratford Bar',
          body: `Hi ${form.name},\n\nYour booking is confirmed!\n\nDate: ${form.date}\nTime: ${form.time}\nParty size: ${form.party_size}${form.table_preference ? `\nTable preference: ${form.table_preference}` : ''}${form.occasion && form.occasion !== 'none' ? `\nOccasion: ${form.occasion}` : ''}\n\nIf you have any questions, please contact us.\n\nSee you soon!\nStratford Bar Team`,
        });
      } catch (_) {
        // Email send failed but booking succeeded — don't block the flow
      }
    }

    setSaving(false);
    setForm(EMPTY);
    onSaved();
  };

  const field = 'bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-base rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500/60 w-full';
  const label = 'font-body text-xs text-zinc-500 uppercase tracking-wider block mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-heading text-xl text-purple-400 uppercase tracking-wider mb-2">New Booking</h2>

      {/* Name + Party Size */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={label}>Guest Name *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)} className={field} placeholder="Full name" />
        </div>
        <div>
          <label className={label}>Party Size *</label>
          <input required type="number" min="1" max="50" value={form.party_size} onChange={e => set('party_size', e.target.value)} className={field} />
        </div>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Date *</label>
          <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Time *</label>
          <select value={form.time} onChange={e => set('time', e.target.value)} className={field}>
            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={field} placeholder="07..." />
        </div>
        <div>
          <label className={label}>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={field} placeholder="email@..." />
        </div>
      </div>

      {/* Area preference + Occasion */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Table / Area Preference</label>
          <select value={form.table_preference} onChange={e => set('table_preference', e.target.value)} className={field}>
            <option value="">No preference</option>
            <option value="First Floor">First Floor</option>
            <option value="Second Floor">Second Floor</option>
          </select>
        </div>
        <div>
          <label className={label}>Occasion</label>
          <select value={form.occasion} onChange={e => set('occasion', e.target.value)} className={field}>
            {OCCASIONS.map(o => <option key={o} value={o}>{o === 'none' ? 'No occasion' : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Dietary + Special requests */}
      <div>
        <label className={label}>Dietary Requirements / Allergens</label>
        <input value={form.dietary_notes} onChange={e => set('dietary_notes', e.target.value)} className={field} placeholder="e.g. vegan, nut allergy..." />
      </div>
      <div>
        <label className={label}>Special Requests</label>
        <textarea value={form.special_requests} onChange={e => set('special_requests', e.target.value)} className={field + ' resize-none h-20'} placeholder="Decorations, cake, high chair..." />
      </div>

      {/* Deposit */}
      <div className="flex items-center gap-3">
        <Checkbox checked={form.deposit_paid} onChange={() => set('deposit_paid', !form.deposit_paid)} />
        <span className="font-body text-sm text-zinc-400">Deposit paid</span>
      </div>

      {/* Marketing consent */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-3">
        <p className="font-heading text-sm text-zinc-400 uppercase tracking-wider">Marketing Consent</p>
        <p className="font-body text-xs text-zinc-500">Ask the customer which channels they're happy to be contacted on:</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <Checkbox checked={form.marketing_email} onChange={() => set('marketing_email', !form.marketing_email)} />
            <span className="font-body text-sm text-zinc-300">Email marketing</span>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox checked={form.marketing_sms} onChange={() => set('marketing_sms', !form.marketing_sms)} />
            <span className="font-body text-sm text-zinc-300">SMS / text marketing</span>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox checked={form.marketing_phone} onChange={() => set('marketing_phone', !form.marketing_phone)} />
            <span className="font-body text-sm text-zinc-300">Phone call marketing</span>
          </div>
        </div>
      </div>
      <div>
        <label className={label}>Internal Staff Notes</label>
        <input value={form.notes} onChange={e => set('notes', e.target.value)} className={field} placeholder="Staff-only notes..." />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full min-h-[56px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-heading text-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Confirm Booking'}
      </button>
    </form>
  );
}