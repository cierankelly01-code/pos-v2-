import { useState } from 'react';
import { useStaff, useStaffMutations, STAFF_COLOURS } from '@/lib/useStaff';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['waiter', 'bar', 'admin'];

export default function StaffEditor() {
  const { data: staff = [], isLoading } = useStaff({ activeOnly: false });
  const { createStaff, updateStaff, deleteStaff } = useStaffMutations();
  const [name, setName] = useState('');
  const [role, setRole] = useState('waiter');
  const [colour, setColour] = useState(STAFF_COLOURS[0]);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error('Enter a name');
      return;
    }
    await createStaff.mutateAsync({
      name: name.trim(),
      role,
      colour,
      active: true,
    });
    setName('');
    toast.success('Staff member added');
  };

  const toggleActive = async (member) => {
    await updateStaff.mutateAsync({ id: member.id, active: !member.active });
    toast.success(member.active ? 'Staff deactivated' : 'Staff activated');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    await deleteStaff.mutateAsync(id);
    toast.success('Staff removed');
  };

  if (isLoading) {
    return <p className="text-zinc-500 font-body text-center py-8">Loading staff…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl text-amber-400 uppercase tracking-wider">Staff Profiles</h2>

      {/* Add form */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-3">
        <p className="font-body text-xs text-zinc-500 uppercase tracking-wider">Add staff member</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 font-body text-lg rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500/50"
        />
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg font-heading text-sm uppercase tracking-wider capitalize transition-colors
                ${role === r ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-400'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div>
          <p className="font-body text-xs text-zinc-500 mb-2">Colour</p>
          <div className="flex flex-wrap gap-2">
            {STAFF_COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColour(c)}
                className={`w-10 h-10 rounded-full border-2 transition-transform ${colour === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={createStaff.isPending}
          className="w-full min-h-[52px] rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-heading uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {createStaff.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Add Staff
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {staff.length === 0 && (
          <p className="text-center py-8 font-body text-zinc-500">No staff yet — add your team above.</p>
        )}
        {staff.map((member) => (
          <div
            key={member.id}
            className={`flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-700 ${!member.active ? 'opacity-50' : ''}`}
          >
            <div
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-heading text-black"
              style={{ backgroundColor: member.colour }}
            >
              {member.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-lg text-zinc-100">{member.name}</p>
              <p className="font-body text-xs text-zinc-500 capitalize">{member.role}</p>
            </div>
            <button
              onClick={() => toggleActive(member)}
              className={`px-3 py-1.5 rounded-lg font-body text-xs uppercase ${member.active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}
            >
              {member.active ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => handleDelete(member.id)}
              className="p-2 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
