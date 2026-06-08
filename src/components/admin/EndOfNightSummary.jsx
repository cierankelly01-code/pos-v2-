import { useMemo } from 'react';
import { format, startOfToday, startOfWeek, startOfMonth } from 'date-fns';
import { jsPDF } from 'jspdf';
import { X, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

function buildSummary(orders, tips) {
  const todayStart = startOfToday();
  const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
  const closedToday = todayOrders.filter(o => o.tab_closed && o.status === 'complete');
  const revenue = closedToday.reduce((s, o) => s + (o.total || 0), 0);

  const todayTips = tips.filter(t => new Date(t.created_at) >= todayStart);
  const tipsTotal = todayTips.reduce((s, t) => s + Number(t.amount || 0), 0);

  const tipsByStaff = {};
  todayTips.forEach(t => {
    const name = t.staff_name || 'Unknown';
    tipsByStaff[name] = (tipsByStaff[name] || 0) + Number(t.amount || 0);
  });

  const byTable = {};
  closedToday.forEach(o => {
    if (!byTable[o.table_number]) byTable[o.table_number] = 0;
    byTable[o.table_number] += o.total || 0;
  });
  const tableEntries = Object.entries(byTable).sort((a, b) => b[1] - a[1]);
  const busiestTable = tableEntries[0] ? { table: tableEntries[0][0], total: tableEntries[0][1] } : null;

  const itemCounts = {};
  closedToday.forEach(o => {
    (o.items || []).forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
    });
  });
  const itemEntries = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
  const topItem = itemEntries[0] ? { name: itemEntries[0][0], count: itemEntries[0][1] } : null;

  const uniqueTables = new Set(closedToday.map(o => o.table_number)).size;
  const avgSpend = uniqueTables ? revenue / uniqueTables : 0;
  const covers = closedToday.length;

  return {
    date: format(new Date(), 'EEEE d MMMM yyyy'),
    revenue,
    tipsTotal,
    combined: revenue + tipsTotal,
    tipsByStaff,
    busiestTable,
    topItem,
    covers,
    uniqueTables,
    avgSpend,
  };
}

function summaryText(s) {
  const lines = [
    `END OF NIGHT — ${s.date}`,
    '',
    `Revenue:        £${s.revenue.toFixed(2)}`,
    `Tips:           £${s.tipsTotal.toFixed(2)}`,
    `Combined:       £${s.combined.toFixed(2)}`,
    '',
    'Tips by staff:',
    ...Object.entries(s.tipsByStaff).map(([name, amt]) => `  ${name}: £${amt.toFixed(2)}`),
    ...(Object.keys(s.tipsByStaff).length === 0 ? ['  (none)'] : []),
    '',
    s.busiestTable ? `Busiest table:  #${s.busiestTable.table} (£${s.busiestTable.total.toFixed(2)})` : 'Busiest table:  —',
    s.topItem ? `Top item:       ${s.topItem.name} (${s.topItem.count}×)` : 'Top item:       —',
    `Covers closed:  ${s.covers}`,
    `Tables served:  ${s.uniqueTables}`,
    `Avg spend/table: £${s.avgSpend.toFixed(2)}`,
  ];
  return lines.join('\n');
}

export default function EndOfNightSummary({ orders, tips, onClose }) {
  const summary = useMemo(() => buildSummary(orders, tips), [orders, tips]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(summaryText(summary));
    toast.success('Summary copied to clipboard');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const text = summaryText(summary);
    doc.setFontSize(11);
    text.split('\n').forEach((line, i) => {
      doc.text(line, 14, 20 + i * 7);
    });
    doc.save(`end-of-night-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-amber-400 uppercase tracking-wider">End of Night</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="font-body text-sm text-zinc-500 text-center">{summary.date}</p>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-3 text-center">
              <p className="font-body text-xs text-emerald-400 uppercase">Revenue</p>
              <p className="font-heading text-xl text-emerald-400">£{summary.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-amber-900/30 border border-amber-700/30 rounded-xl p-3 text-center">
              <p className="font-body text-xs text-amber-400 uppercase">Tips</p>
              <p className="font-heading text-xl text-amber-400">£{summary.tipsTotal.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center">
              <p className="font-body text-xs text-zinc-400 uppercase">Combined</p>
              <p className="font-heading text-xl text-zinc-100">£{summary.combined.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <p className="font-body text-xs text-zinc-500 uppercase tracking-wider mb-2">Tips by staff</p>
            {Object.keys(summary.tipsByStaff).length === 0 ? (
              <p className="font-body text-zinc-600 text-sm">No tips recorded today</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(summary.tipsByStaff)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, amt]) => (
                    <div key={name} className="flex justify-between bg-zinc-800 rounded-lg px-3 py-2">
                      <span className="font-body text-zinc-300">{name}</span>
                      <span className="font-heading text-amber-400">£{amt.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-body text-xs text-zinc-500 uppercase">Busiest table</p>
              <p className="font-heading text-lg text-zinc-100">
                {summary.busiestTable ? `#${summary.busiestTable.table}` : '—'}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-body text-xs text-zinc-500 uppercase">Top item</p>
              <p className="font-heading text-sm text-zinc-100 truncate">
                {summary.topItem?.name || '—'}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-body text-xs text-zinc-500 uppercase">Covers closed</p>
              <p className="font-heading text-lg text-zinc-100">{summary.covers}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-body text-xs text-zinc-500 uppercase">Avg / table</p>
              <p className="font-heading text-lg text-zinc-100">£{summary.avgSpend.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={copyToClipboard}
              className="min-h-[52px] rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-heading text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-zinc-200"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={exportPdf}
              className="min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 font-heading text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-black"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TipsLeaderboard({ tips }) {
  const todayStart = startOfToday();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monthStart = startOfMonth(new Date());

  const aggregate = (from) => {
    const map = {};
    tips
      .filter(t => new Date(t.created_at) >= from)
      .forEach(t => {
        const name = t.staff_name || 'Unknown';
        map[name] = (map[name] || 0) + Number(t.amount || 0);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  const today = aggregate(todayStart);
  const week = aggregate(weekStart);
  const month = aggregate(monthStart);

  const allNames = [...new Set([...today, ...week, ...month].map(([n]) => n))];

  if (allNames.length === 0) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
        <p className="font-heading text-sm text-zinc-500 uppercase tracking-wider mb-2">Staff Tips Leaderboard</p>
        <p className="font-body text-zinc-600 text-sm">No tips recorded yet</p>
      </div>
    );
  }

  const lookup = (list, name) => list.find(([n]) => n === name)?.[1] || 0;

  return (
    <div>
      <h3 className="font-heading text-base text-zinc-500 uppercase tracking-wider mb-3">Staff Tips Leaderboard</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-body text-xs text-zinc-500 uppercase">
              <th className="pb-2 pr-4">Staff</th>
              <th className="pb-2 pr-4 text-right">Today</th>
              <th className="pb-2 pr-4 text-right">Week</th>
              <th className="pb-2 text-right">Month</th>
            </tr>
          </thead>
          <tbody>
            {allNames.map(name => (
              <tr key={name} className="border-t border-zinc-800">
                <td className="py-2 font-body text-zinc-200">{name}</td>
                <td className="py-2 text-right font-heading text-amber-400">£{lookup(today, name).toFixed(2)}</td>
                <td className="py-2 text-right font-heading text-zinc-300">£{lookup(week, name).toFixed(2)}</td>
                <td className="py-2 text-right font-heading text-zinc-400">£{lookup(month, name).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
