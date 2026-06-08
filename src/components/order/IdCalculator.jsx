import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { format, subYears } from 'date-fns';

export default function IdCalculator() {
  const [open, setOpen] = useState(false);

  // Anyone born ON or BEFORE this date is 18+
  const cutoff = subYears(new Date(), 18);
  const cutoffStr = format(cutoff, 'dd MMMM yyyy');
  const cutoffYear = format(cutoff, 'yyyy');

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-all lg:bottom-6"
        aria-label="ID Calculator"
      >
        <ShieldCheck className="w-7 h-7" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="font-heading text-lg text-amber-400 uppercase tracking-wider">ID Check</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 text-center space-y-4">
              <div>
                <p className="font-body text-sm text-zinc-400 uppercase tracking-wider mb-1">Customer must be born on or before</p>
                <p className="font-heading text-4xl text-amber-400">{cutoffStr}</p>
              </div>

              <div className="bg-zinc-800 rounded-xl px-4 py-3">
                <p className="font-body text-sm text-zinc-400">Looking for year of birth</p>
                <p className="font-heading text-5xl text-white">{cutoffYear} or earlier</p>
              </div>

              <p className="font-body text-xs text-zinc-500">
                Today is {format(new Date(), 'dd MMMM yyyy')}. Anyone born after {cutoffStr} is under 18 — do not serve.
              </p>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setOpen(false)}
                className="w-full min-h-[50px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading text-base uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}