import { useState } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SEAT_OPTIONS = [2, 4, 6, 8];

const DEFAULT_FLOOR_MAP = [
  {
    id: 'ground',
    label: 'First Floor — Back Seating',
    tables: [
      { id: 'G1', seats: 4 },
      { id: 'G2', seats: 4 },
      { id: 'G3', seats: 2 },
      { id: 'G4', seats: 2 },
    ],
  },
  {
    id: 'upper',
    label: 'Second Floor — Seating',
    tables: [
      { id: 'U1', seats: 4 },
      { id: 'U2', seats: 4 },
      { id: 'U3', seats: 2 },
      { id: 'U4', seats: 2 },
    ],
  },
];

export default function FloorMapEditor({ settings, onSave }) {
  const [floors, setFloors] = useState(
    settings?.floor_map?.length ? settings.floor_map : DEFAULT_FLOOR_MAP
  );
  const [saving, setSaving] = useState(false);

  const updateFloorLabel = (floorIdx, value) => {
    setFloors(prev => {
      const next = [...prev];
      next[floorIdx] = { ...next[floorIdx], label: value };
      return next;
    });
  };

  const updateTable = (floorIdx, tableIdx, field, value) => {
    setFloors(prev => {
      const next = prev.map(f => ({ ...f, tables: [...f.tables] }));
      next[floorIdx].tables[tableIdx] = { ...next[floorIdx].tables[tableIdx], [field]: value };
      return next;
    });
  };

  const addTable = (floorIdx) => {
    setFloors(prev => {
      const next = prev.map(f => ({ ...f, tables: [...f.tables] }));
      const floor = next[floorIdx];
      // Auto-generate next ID based on floor prefix
      const prefix = floor.tables[0]?.id?.replace(/\d+$/, '') || `F${floorIdx + 1}`;
      const nums = floor.tables.map(t => parseInt(t.id.replace(/\D/g, '')) || 0);
      const nextNum = Math.max(0, ...nums) + 1;
      floor.tables.push({ id: `${prefix}${nextNum}`, seats: 4 });
      return next;
    });
  };

  const removeTable = (floorIdx, tableIdx) => {
    setFloors(prev => {
      const next = prev.map(f => ({ ...f, tables: [...f.tables] }));
      next[floorIdx].tables.splice(tableIdx, 1);
      return next;
    });
  };

  const addFloor = () => {
    const idx = floors.length + 1;
    setFloors(prev => [
      ...prev,
      { id: `floor${idx}`, label: `Floor ${idx} — Seating`, tables: [] },
    ]);
  };

  const removeFloor = (floorIdx) => {
    if (floors.length <= 1) return;
    setFloors(prev => prev.filter((_, i) => i !== floorIdx));
  };

  const handleSave = async () => {
    // Validate: no duplicate table IDs
    const allIds = floors.flatMap(f => f.tables.map(t => t.id.trim()));
    const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
    if (dupes.length) {
      toast.error(`Duplicate table IDs: ${dupes.join(', ')}`);
      return;
    }
    if (allIds.some(id => !id)) {
      toast.error('All tables must have an ID');
      return;
    }
    setSaving(true);
    await onSave(floors);
    setSaving(false);
    toast.success('Floor map saved');
  };

  return (
    <div className="space-y-6">
      <p className="font-body text-sm text-zinc-500">
        Add or remove tables and sections. Changes update the table selection screen immediately.
      </p>

      {floors.map((floor, floorIdx) => (
        <div key={floorIdx} className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
          {/* Floor label */}
          <div className="flex items-center gap-2">
            <input
              value={floor.label}
              onChange={e => updateFloorLabel(floorIdx, e.target.value)}
              className="flex-1 bg-zinc-700 text-zinc-100 font-heading text-base rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500/50 uppercase tracking-wider"
            />
            {floors.length > 1 && (
              <button
                onClick={() => removeFloor(floorIdx)}
                className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tables */}
          <div className="space-y-2">
            {floor.tables.map((table, tableIdx) => (
              <div key={tableIdx} className="flex items-center gap-2">
                <input
                  value={table.id}
                  onChange={e => updateTable(floorIdx, tableIdx, 'id', e.target.value.toUpperCase())}
                  className="w-20 bg-zinc-700 text-amber-400 font-heading text-base rounded-lg px-3 py-2 focus:outline-none text-center uppercase"
                  placeholder="ID"
                  maxLength={4}
                />
                <div className="flex items-center gap-1.5 flex-1">
                  {SEAT_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => updateTable(floorIdx, tableIdx, 'seats', s)}
                      className={`flex-1 py-2 rounded-lg font-body text-sm transition-all
                        ${table.seats === s
                          ? 'bg-amber-500 text-black font-semibold'
                          : 'bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      {s} seats
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => removeTable(floorIdx, tableIdx)}
                  className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addTable(floorIdx)}
            className="w-full py-2.5 rounded-lg border border-dashed border-zinc-600 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 font-body text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Table
          </button>
        </div>
      ))}

      <button
        onClick={addFloor}
        className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 font-heading text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Floor / Section
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full min-h-[56px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save Floor Map</>}
      </button>
    </div>
  );
}