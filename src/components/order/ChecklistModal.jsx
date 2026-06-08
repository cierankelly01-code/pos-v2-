import { useState } from 'react';
import { ShieldCheck, Leaf, CheckCircle2, Circle } from 'lucide-react';
import { ALL_ALLERGENS } from './AllergenFilterBar';
import { format, subYears } from 'date-fns';

export default function ChecklistModal({ tableNumber, onConfirm }) {
  const cutoff = subYears(new Date(), 18);
  const dobCutoffDate = format(cutoff, 'd MMMM yyyy');
  const dobCutoffYear = format(cutoff, 'yyyy');

  const [idChecked, setIdChecked] = useState(false);
  const [allergyChecked, setAllergyChecked] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  const canProceed = idChecked && allergyChecked;

  const toggleAllergen = (a) => {
    setSelectedAllergens(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-5 text-center">
          <p className="font-heading text-3xl text-black uppercase tracking-widest">Table {tableNumber}</p>
          <p className="font-body text-black/70 text-base mt-1">Complete before taking the order</p>
        </div>

        {/* Checks */}
        <div className="p-5 space-y-4">
          <CheckItem
            icon={ShieldCheck}
            title="ID Checked"
            description="Customer is 18+ and ID has been verified"
            checked={idChecked}
            onToggle={() => setIdChecked(v => !v)}
            color="amber"
          />

          {/* DOB cutoff — always visible below ID check */}
          <div className="bg-zinc-800 border border-amber-500/30 rounded-xl px-4 py-3 -mt-2">
            <p className="font-body text-xs text-amber-400 uppercase tracking-wider mb-1">Today's ID Check — Born on or before</p>
            <p className="font-heading text-2xl text-white tracking-wider">{dobCutoffDate}</p>
            <p className="font-body text-xs text-zinc-500 mt-0.5">Must be born <span className="text-amber-400">{dobCutoffYear}</span> or earlier</p>
          </div>
          <CheckItem
            icon={Leaf}
            title="Allergies Asked"
            description="Customer has been asked about dietary requirements"
            checked={allergyChecked}
            onToggle={() => setAllergyChecked(v => !v)}
            color="emerald"
          />

          {/* Allergen picker — shown when allergies checked */}
          {allergyChecked && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
              <p className="font-heading text-sm text-emerald-400 uppercase tracking-wider mb-3">
                Select customer allergens
              </p>
              <p className="font-body text-xs text-zinc-500 mb-3">
                Tap any allergens the customer has — those items will be hidden from the menu.
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_ALLERGENS.map(a => {
                  const active = selectedAllergens.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAllergen(a)}
                      className={`px-3 py-1.5 rounded-full font-body text-sm border transition-all
                        ${active
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:border-zinc-500'
                        }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
              {selectedAllergens.length > 0 && (
                <p className="font-body text-xs text-amber-400 mt-3">
                  {selectedAllergens.length} allergen{selectedAllergens.length > 1 ? 's' : ''} selected — menu will be filtered
                </p>
              )}
              {selectedAllergens.length === 0 && (
                <p className="font-body text-xs text-zinc-600 mt-3">
                  Tap allergens above, or leave blank if no restrictions
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            onClick={() => canProceed && onConfirm({ idChecked, allergyChecked, allergens: selectedAllergens })}
            disabled={!canProceed}
            className={`w-full min-h-[60px] rounded-xl font-heading text-xl uppercase tracking-wider transition-all
              ${canProceed
                ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.98]'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
          >
            {canProceed ? 'Proceed to Order' : 'Confirm both checks'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ icon: Icon, title, description, checked, onToggle, color }) {
  const colors = {
    amber: {
      border: checked ? 'border-amber-500/50 bg-amber-500/10' : 'border-zinc-700 bg-zinc-800',
      icon: checked ? 'text-amber-400' : 'text-zinc-500',
      check: 'text-amber-400',
    },
    emerald: {
      border: checked ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-700 bg-zinc-800',
      icon: checked ? 'text-emerald-400' : 'text-zinc-500',
      check: 'text-emerald-400',
    },
  }[color];

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left active:scale-[0.98] ${colors.border}`}
    >
      <Icon className={`w-7 h-7 shrink-0 transition-colors ${colors.icon}`} />
      <div className="flex-1">
        <p className={`font-heading text-lg uppercase tracking-wider ${checked ? 'text-zinc-100' : 'text-zinc-400'}`}>{title}</p>
        <p className="font-body text-sm text-zinc-500">{description}</p>
      </div>
      {checked
        ? <CheckCircle2 className={`w-6 h-6 shrink-0 ${colors.check}`} />
        : <Circle className="w-6 h-6 shrink-0 text-zinc-700" />
      }
    </button>
  );
}