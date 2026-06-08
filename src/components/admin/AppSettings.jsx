import { useState } from 'react';
import { useUpdateSettings } from '@/lib/useSettings';
import { toast } from 'sonner';

export default function AppSettings({ settings }) {
  const updateSettings = useUpdateSettings();
  const [venueName, setVenueName] = useState(settings?.venue_name || '');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);

  const saveVenueName = async () => {
    if (!venueName.trim()) return;
    setSaving(true);
    await updateSettings.mutateAsync({ venue_name: venueName.trim() });
    toast.success('Venue name updated');
    setSaving(false);
  };

  const savePin = async () => {
    if (newPin.length < 4) { toast.error('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { toast.error('PINs do not match'); return; }
    setSaving(true);
    await updateSettings.mutateAsync({ admin_pin: newPin });
    toast.success('PIN updated');
    setNewPin('');
    setConfirmPin('');
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Venue Name */}
      <div>
        <h3 className="font-heading text-lg text-amber-400 uppercase tracking-wider mb-3">Venue Name</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-xl rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={saveVenueName}
            disabled={saving}
            className="min-h-[56px] px-6 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-heading text-base uppercase tracking-wider transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Change PIN */}
      <div>
        <h3 className="font-heading text-lg text-amber-400 uppercase tracking-wider mb-3">Change Admin PIN</h3>
        <div className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="New PIN (4+ digits)"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-xl rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 tracking-widest"
          />
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Confirm new PIN"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-xl rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 tracking-widest"
          />
          <button
            onClick={savePin}
            disabled={saving}
            className="w-full min-h-[56px] rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-heading text-base uppercase tracking-wider transition-colors"
          >
            Update PIN
          </button>
        </div>
      </div>
    </div>
  );
}