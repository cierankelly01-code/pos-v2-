import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, MessageSquare, Copy, Check } from 'lucide-react';

export default function MarketingList() {
  const [copied, setCopied] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings-marketing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const emailList = useMemo(() =>
    [...new Map(
      bookings
        .filter(b => b.marketing_email && b.email)
        .map(b => [b.email.toLowerCase(), b])
    ).values()],
    [bookings]
  );

  const smsList = useMemo(() =>
    [...new Map(
      bookings
        .filter(b => b.marketing_sms && b.phone)
        .map(b => [b.phone, b])
    ).values()],
    [bookings]
  );

  const phonelist = useMemo(() =>
    [...new Map(
      bookings
        .filter(b => b.marketing_phone && b.phone)
        .map(b => [b.phone, b])
    ).values()],
    [bookings]
  );

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) return <div className="text-center py-12 text-zinc-600 font-body">Loading...</div>;

  return (
    <div className="space-y-8">
      <p className="font-body text-sm text-zinc-500">
        Customers who have explicitly opted in to each channel. Deduplicated by contact detail.
      </p>

      <MarketingSection
        icon={<Mail className="w-5 h-5 text-purple-400" />}
        title="Email Marketing"
        colour="purple"
        items={emailList}
        contactKey="email"
        onCopy={(list, key) => copyToClipboard(list.map(b => b.email).join(', '), key)}
        copied={copied}
        copyKey="email"
      />

      <MarketingSection
        icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
        title="SMS / Text Marketing"
        colour="blue"
        items={smsList}
        contactKey="phone"
        onCopy={(list, key) => copyToClipboard(list.map(b => b.phone).join(', '), key)}
        copied={copied}
        copyKey="sms"
      />

      <MarketingSection
        icon={<Phone className="w-5 h-5 text-emerald-400" />}
        title="Phone Call Marketing"
        colour="emerald"
        items={phonelist}
        contactKey="phone"
        onCopy={(list, key) => copyToClipboard(list.map(b => b.phone).join(', '), key)}
        copied={copied}
        copyKey="phone"
      />
    </div>
  );
}

function MarketingSection({ icon, title, colour, items, contactKey, onCopy, copied, copyKey }) {
  const colourMap = {
    purple: 'border-purple-700/40 bg-purple-900/20',
    blue: 'border-blue-700/40 bg-blue-900/20',
    emerald: 'border-emerald-700/40 bg-emerald-900/20',
  };
  const badgeMap = {
    purple: 'bg-purple-800/50 text-purple-300',
    blue: 'bg-blue-800/50 text-blue-300',
    emerald: 'bg-emerald-800/50 text-emerald-300',
  };

  return (
    <div className={`rounded-xl border p-4 ${colourMap[colour]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-heading text-lg text-zinc-200 uppercase tracking-wider">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full font-body text-xs ${badgeMap[colour]}`}>
            {items.length} opted in
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => onCopy(items, copyKey)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-body text-xs transition-colors"
          >
            {copied === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === copyKey ? 'Copied!' : 'Copy all'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="font-body text-sm text-zinc-600 italic">No opt-ins yet</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {items.map((b, i) => (
            <div key={i} className="flex items-center justify-between bg-zinc-800/60 rounded-lg px-3 py-2">
              <div>
                <span className="font-body text-sm text-zinc-200">{b.name}</span>
                <span className="font-body text-xs text-zinc-500 ml-2">{b[contactKey]}</span>
              </div>
              {b.occasion && b.occasion !== 'none' && (
                <span className="font-body text-xs text-amber-500 capitalize">{b.occasion}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}