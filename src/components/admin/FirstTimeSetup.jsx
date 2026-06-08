import { useState } from 'react';
import { useUpdateSettings } from '@/lib/useSettings';

export default function FirstTimeSetup({ onComplete }) {
  const updateSettings = useUpdateSettings();
  const [venueName, setVenueName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!venueName.trim()) { setError('Please enter a venue name.'); return; }
    if (pin.length < 4) { setError('PIN must be at least 4 digits.'); return; }
    if (pin !== confirmPin) { setError('PINs do not match.'); return; }

    setSaving(true);
    await updateSettings.mutateAsync({
      venue_name: venueName.trim(),
      admin_pin: pin,
      table_count: 40,
      menu_items: [],
      setup_complete: true,
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-amber-400 uppercase tracking-widest">Welcome</h1>
          <p className="font-body text-zinc-400 mt-2 text-lg">Set up your bar before you start</p>
        </div>

        <div>
          <label className="font-body text-sm text-zinc-400 uppercase tracking-wider block mb-2">Venue Name</label>
          <input
            type="text"
            value={venueName}
            onChange={e => { setVenueName(e.target.value); setError(''); }}
            placeholder="e.g. Stratford Bar"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-xl rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600"
          />
        </div>

        <div>
          <label className="font-body text-sm text-zinc-400 uppercase tracking-wider block mb-2">Admin PIN</label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
            placeholder="Choose a PIN (4+ digits)"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-xl rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 tracking-widest"
          />
        </div>

        <div>
          <label className="font-body text-sm text-zinc-400 uppercase tracking-wider block mb-2">Confirm PIN</label>
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '')); setError(''); }}
            placeholder="Repeat your PIN"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-xl rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 tracking-widest"
          />
        </div>

        {error && (
          <p className="font-body text-red-400 text-base">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-[60px] rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-heading text-xl uppercase tracking-wider transition-colors"
        >
          {saving ? 'Saving…' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}