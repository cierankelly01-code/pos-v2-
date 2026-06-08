import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { ALL_ALLERGENS } from '@/components/order/AllergenFilterBar';

export const DRINK_SUBCATEGORIES = ['Beer', 'Wine', 'Spirits', 'Cocktails', 'Soft Drinks', 'Hot Drinks', 'Other'];

export default function MenuEditor({ menuItems, onSave }) {
  const [items, setItems] = useState(menuItems || []);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'drinks', subcategory: 'Beer' });
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [savingIdx, setSavingIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sync local state when props update after a save
  useEffect(() => {
    setItems(menuItems || []);
  }, [menuItems]);

  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    const item = {
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category,
      allergens: [],
    };
    if (newItem.category === 'drinks') item.subcategory = newItem.subcategory;
    setItems(prev => [...prev, item]);
    setNewItem({ name: '', price: '', category: newItem.category, subcategory: newItem.subcategory });
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === 'price' ? parseFloat(value) || 0 : value };
      return next;
    });
  };

  const toggleAllergen = (idx, allergen) => {
    setItems(prev => {
      const next = [...prev];
      const current = next[idx].allergens || [];
      next[idx] = {
        ...next[idx],
        allergens: current.includes(allergen)
          ? current.filter(a => a !== allergen)
          : [...current, allergen],
      };
      return next;
    });
  };

  const drinks = items.filter(i => i.category === 'drinks');
  const food = items.filter(i => i.category === 'food');

  const renderItem = (item) => {
    const globalIdx = items.indexOf(item);
    const isExpanded = expandedIdx === globalIdx;
    const allergens = item.allergens || [];

    return (
      <div key={globalIdx} className="bg-zinc-800 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 p-3">
          <input
            value={item.name}
            onChange={e => updateItem(globalIdx, 'name', e.target.value)}
            className="flex-1 bg-transparent text-zinc-100 font-body text-base focus:outline-none"
          />
          <div className="flex items-center shrink-0">
            <span className="text-zinc-500 mr-1">£</span>
            <input
              type="number"
              step="0.01"
              value={item.price}
              onChange={e => updateItem(globalIdx, 'price', e.target.value)}
              className="w-20 bg-zinc-700 text-amber-400 font-heading text-base rounded px-2 py-1 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-body shrink-0"
          >
            {allergens.length > 0
              ? <span className="text-amber-400">{allergens.length} allergen{allergens.length > 1 ? 's' : ''}</span>
              : 'Edit'
            }
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => removeItem(globalIdx)}
            className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-zinc-700 px-3 py-3 bg-zinc-900/50">
            {/* Subcategory picker for drinks */}
            {item.category === 'drinks' && (
              <div className="mb-3">
                <p className="font-body text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Drink category:</p>
                <div className="flex flex-wrap gap-1.5">
                  {DRINK_SUBCATEGORIES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateItem(globalIdx, 'subcategory', s)}
                      className={`px-2.5 py-1 rounded-full font-body text-xs border transition-all
                        ${(item.subcategory || 'Other') === s
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-zinc-800 border-zinc-600 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="font-body text-xs text-zinc-500 mb-2 uppercase tracking-wider">Contains allergens:</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ALL_ALLERGENS.map(a => {
                const active = allergens.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleAllergen(globalIdx, a)}
                    className={`px-2.5 py-1 rounded-full font-body text-xs border transition-all
                      ${active
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                        : 'bg-zinc-800 border-zinc-600 text-zinc-500 hover:border-zinc-500'
                      }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
            <button
              disabled={savingIdx === globalIdx}
              onClick={async () => {
                setSavingIdx(globalIdx);
                await onSave(items);
                setSavingIdx(null);
                setExpandedIdx(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-sm uppercase tracking-wider transition-colors disabled:opacity-60"
            >
              {savingIdx === globalIdx
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Check className="w-4 h-4" /> Save</>
              }
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Drinks grouped by subcategory */}
      <div className="mb-8">
        <h3 className="font-heading text-xl text-amber-400 uppercase tracking-wider mb-3">Drinks</h3>
        {DRINK_SUBCATEGORIES.map(sub => {
          const subItems = drinks.filter(i => (i.subcategory || 'Other') === sub);
          if (subItems.length === 0) return null;
          return (
            <div key={sub} className="mb-4">
              <p className="font-body text-sm text-zinc-500 uppercase tracking-wider mb-1.5 px-1">{sub}</p>
              <div className="space-y-2">{subItems.map(renderItem)}</div>
            </div>
          );
        })}
      </div>

      {/* Food */}
      <div className="mb-8">
        <h3 className="font-heading text-xl text-amber-400 uppercase tracking-wider mb-3">Deli Food</h3>
        <div className="space-y-2">{food.map(renderItem)}</div>
      </div>

      {/* Add new item */}
      <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
        <h3 className="font-heading text-lg text-zinc-300 uppercase tracking-wider mb-3">Add Item</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newItem.name}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name"
            className="flex-1 bg-zinc-700 text-zinc-100 font-body text-base rounded-lg px-4 py-3 focus:outline-none placeholder:text-zinc-500"
          />
          <input
            type="number"
            step="0.01"
            value={newItem.price}
            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="Price"
            className="w-28 bg-zinc-700 text-amber-400 font-heading text-base rounded-lg px-4 py-3 focus:outline-none placeholder:text-zinc-500"
          />
          <select
            value={newItem.category}
            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
            className="bg-zinc-700 text-zinc-100 font-body rounded-lg px-4 py-3 focus:outline-none"
          >
            <option value="drinks">Drinks</option>
            <option value="food">Food</option>
          </select>
          {newItem.category === 'drinks' && (
            <select
              value={newItem.subcategory}
              onChange={e => setNewItem({ ...newItem, subcategory: e.target.value })}
              className="bg-zinc-700 text-zinc-100 font-body rounded-lg px-4 py-3 focus:outline-none"
            >
              {DRINK_SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button
            onClick={addItem}
            className="min-h-[48px] px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-heading text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Add
          </button>
        </div>
      </div>

      <button
        disabled={saving}
        onClick={async () => { setSaving(true); await onSave(items); setSaving(false); }}
        className="w-full min-h-[56px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xl uppercase tracking-wider transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Menu'}
      </button>
    </div>
  );
}