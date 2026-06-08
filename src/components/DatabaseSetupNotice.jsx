export function isSchemaMissingError(error) {
  if (!error) return false;
  const msg = error.message || '';
  return (
    error.code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('Could not find the table')
  );
}

export default function DatabaseSetupNotice() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="font-heading text-2xl text-amber-400 uppercase tracking-wider">
          Database Not Set Up
        </h1>
        <p className="font-body text-zinc-400">
          Supabase tables are missing. Open your Supabase project → SQL Editor, paste and run{' '}
          <code className="text-amber-300">supabase/schema.sql</code>, then refresh this page.
        </p>
        <p className="font-body text-sm text-zinc-500">
          Required tables: <span className="text-zinc-300">settings</span>,{' '}
          <span className="text-zinc-300">orders</span>,{' '}
          <span className="text-zinc-300">bookings</span>
        </p>
      </div>
    </div>
  );
}
