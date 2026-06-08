import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, UtensilsCrossed, Beer, ShieldCheck } from 'lucide-react';

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => { setOpen(false); navigate(path); };

  const links = [
    { path: '/order', label: 'Waiter', icon: UtensilsCrossed, color: 'text-amber-400' },
    { path: '/bar',   label: 'Bar',    icon: Beer,            color: 'text-emerald-400' },
    { path: '/admin', label: 'Admin',  icon: ShieldCheck,     color: 'text-zinc-300' },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
        aria-label="Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className="relative z-10 w-64 bg-zinc-900 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-5 border-b border-zinc-800">
              <span className="font-heading text-xl text-amber-400 uppercase tracking-widest">Stratford Bar</span>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 px-3">
              {links.map(({ path, label, icon: Icon, color }) => {
                const active = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => go(path)}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-heading text-xl uppercase tracking-wider transition-all
                      ${active ? 'bg-zinc-800 ' + color : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                  >
                    <Icon className={`w-5 h-5 ${active ? color : ''}`} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}