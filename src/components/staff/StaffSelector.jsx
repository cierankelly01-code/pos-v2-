import { useStaff } from '@/lib/useStaff';

export default function StaffSelector({ role, title = 'Who are you?', subtitle, onSelect }) {
  const { data: staff = [], isLoading } = useStaff({ role, activeOnly: true });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6">
      <h1 className="font-heading text-3xl text-amber-400 uppercase tracking-widest mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="font-body text-zinc-500 text-lg mb-8">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-8" />}

      {staff.length === 0 ? (
        <div className="text-center max-w-sm space-y-3">
          <p className="font-body text-zinc-400">No staff profiles yet.</p>
          <p className="font-body text-sm text-zinc-600">
            Ask a manager to add staff in Admin → Staff.
          </p>
          <button
            onClick={() => onSelect({ name: 'Staff', colour: '#F59E0B' })}
            className="mt-4 min-h-[56px] px-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading uppercase tracking-wider"
          >
            Continue without profile
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md grid grid-cols-1 gap-3">
          {staff.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect({ id: member.id, name: member.name, colour: member.colour, role: member.role })}
              className="min-h-[80px] rounded-2xl border-2 border-zinc-700 hover:border-zinc-500 active:scale-[0.98] transition-all flex items-center gap-4 px-6 py-4 bg-zinc-900/80"
              style={{ borderLeftColor: member.colour, borderLeftWidth: '6px' }}
            >
              <div
                className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-heading text-xl text-black"
                style={{ backgroundColor: member.colour }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-heading text-2xl text-zinc-100 uppercase tracking-wider">
                  {member.name}
                </p>
                <p className="font-body text-sm text-zinc-500 capitalize">{member.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
