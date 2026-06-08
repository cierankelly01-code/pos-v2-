import { useState } from 'react';

export default function PinGate({ correctPin, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const pinLength = correctPin?.length || 4;

  const handleDigit = (d) => {
    const next = pin + d;
    setError(false);
    if (next.length >= pinLength) {
      if (next === correctPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 600);
      }
    } else {
      setPin(next);
    }
  };

  const handleClear = () => { setPin(''); setError(false); };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4">
      <h1 className="font-heading text-2xl text-amber-400 uppercase tracking-wider mb-8">
        Enter Admin PIN
      </h1>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {Array.from({ length: pinLength }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              error ? 'bg-red-500' :
              i < pin.length ? 'bg-amber-400' : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'C'].map((key, i) => (
          key === null ? <div key={i} /> : (
            <button
              key={i}
              onClick={() => key === 'C' ? handleClear() : handleDigit(String(key))}
              className="min-h-[72px] rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 font-heading text-2xl text-zinc-100 transition-colors"
            >
              {key}
            </button>
          )
        ))}
      </div>
    </div>
  );
}