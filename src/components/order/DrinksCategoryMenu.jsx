import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MenuItem from './MenuItem';
import { DRINK_SUBCATEGORIES } from '@/components/admin/MenuEditor';

export default function DrinksCategoryMenu({ items, onAdd }) {
  // Start with all subcategories collapsed
  const [openSubs, setOpenSubs] = useState({});

  const toggle = (sub) => setOpenSubs(prev => ({ ...prev, [sub]: !prev[sub] }));

  // Group items by subcategory
  const grouped = {};
  items.forEach(item => {
    const sub = item.subcategory || 'Other';
    if (!grouped[sub]) grouped[sub] = [];
    grouped[sub].push(item);
  });

  // Render in the canonical subcategory order, skip empty ones
  const presentSubs = DRINK_SUBCATEGORIES.filter(s => grouped[s]?.length > 0);
  // Also catch any subcategory not in the canonical list
  Object.keys(grouped).forEach(s => {
    if (!presentSubs.includes(s)) presentSubs.push(s);
  });

  if (presentSubs.length === 0) {
    return <p className="text-center py-8 font-body text-zinc-500">No drinks available</p>;
  }

  return (
    <div className="space-y-2">
      {presentSubs.map(sub => {
        const subItems = grouped[sub] || [];
        const isOpen = !!openSubs[sub];
        return (
          <div key={sub} className="rounded-xl overflow-hidden border border-zinc-800">
            {/* Subcategory header */}
            <button
              onClick={() => toggle(sub)}
              className="w-full flex items-center justify-between px-5 py-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-heading text-xl text-zinc-100 uppercase tracking-wider">{sub}</span>
                <span className="font-body text-sm text-zinc-500">{subItems.length} item{subItems.length !== 1 ? 's' : ''}</span>
              </div>
              {isOpen
                ? <ChevronUp className="w-5 h-5 text-amber-400" />
                : <ChevronDown className="w-5 h-5 text-zinc-500" />
              }
            </button>
            {/* Items */}
            {isOpen && (
              <div className="bg-zinc-900 space-y-px">
                {subItems.map((item, i) => (
                  <div key={i} className="px-2 py-1">
                    <MenuItem item={item} onAdd={onAdd} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}