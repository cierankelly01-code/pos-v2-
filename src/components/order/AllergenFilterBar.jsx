import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const ALL_ALLERGENS = [
  'Gluten', 'Dairy', 'Nuts', 'Vegan', 'Vegetarian',
  'Eggs', 'Soya', 'Fish', 'Shellfish', 'Mustard',
  'Sesame', 'Celery', 'Lupin', 'Molluscs', 'Sulphites',
];

export { ALL_ALLERGENS };

export default function AllergenFilterBar({ activeAllergens, onToggle, onClearAll }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-zinc-800 bg-zinc-900">
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-zinc-400 uppercase tracking-wider">Allergen Filters</span>
          {activeAllergens.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-body text-xs">
              {activeAllergens.length} active
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {/* Active allergen chips — always visible if any active */}
      {activeAllergens.length > 0 && !expanded && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {activeAllergens.map(a => (
            <button
              key={a}
              onClick={() => onToggle(a)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-body text-xs hover:bg-amber-500/30 transition-colors"
            >
              {a} <X className="w-3 h-3" />
            </button>
          ))}
          <button onClick={onClearAll} className="font-body text-xs text-zinc-500 hover:text-zinc-300 underline px-1">
            Clear all
          </button>
        </div>
      )}

      {/* Expanded picker — all allergens */}
      {expanded && (
        <div className="px-3 pb-3">
          <p className="font-body text-xs text-zinc-600 mb-2">Tap to hide items containing that allergen:</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ALLERGENS.map(a => {
              const active = activeAllergens.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => onToggle(a)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs border transition-all
                    ${active
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                >
                  {a}
                  {active && <X className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
          {activeAllergens.length > 0 && (
            <button onClick={() => { onClearAll(); setExpanded(false); }} className="font-body text-xs text-zinc-500 hover:text-zinc-300 underline mt-2 block">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}