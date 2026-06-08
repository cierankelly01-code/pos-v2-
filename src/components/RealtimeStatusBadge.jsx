export function RealtimeStatusBadge({ status }) {
  const config = {
    connected: { label: 'Live', className: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40' },
    connecting: { label: 'Connecting…', className: 'bg-amber-500/20 text-amber-800 border-amber-500/40' },
    disconnected: { label: 'Offline — polling', className: 'bg-red-500/20 text-red-800 border-red-500/40' },
  };
  const { label, className } = config[status] || config.connecting;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-body text-xs uppercase tracking-wider ${className}`}>
      <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : status === 'disconnected' ? 'bg-red-500' : 'bg-amber-500'}`} />
      {label}
    </span>
  );
}
