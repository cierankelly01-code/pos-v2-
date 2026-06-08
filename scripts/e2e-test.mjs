/**
 * End-to-end API tests for Stratford Bar POS (Supabase backend flows).
 * Run: node scripts/e2e-test.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile(resolve(root, '.env.local')),
  ...loadEnvFile(resolve(root, 'base44/.env.local')),
};

const url =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  fileEnv.VITE_SUPABASE_URL ||
  fileEnv.SUPABASE_URL;
const key =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  fileEnv.VITE_SUPABASE_ANON_KEY ||
  fileEnv.SUPABASE_ANON_KEY ||
  fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('FAIL: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);
const results = [];
const TEST_TABLE = 99;
const testIds = { orderId: null, bookingId: null };

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function timed(name, fn) {
  const start = performance.now();
  try {
    const detail = await fn();
    const ms = Math.round(performance.now() - start);
    pass(name, detail ? `${detail} (${ms}ms)` : `${ms}ms`);
    return true;
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    fail(name, `${e.message} (${ms}ms)`);
    return false;
  }
}

async function testSettingsAndPin() {
  const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No settings row — run FirstTimeSetup first');
  if (!data.admin_pin) throw new Error('admin_pin missing');
  return `PIN configured (${data.admin_pin.length} digits), venue: ${data.venue_name || 'unnamed'}`;
}

async function testCreateOrder() {
  const payload = {
    table_number: TEST_TABLE,
    items: [{ name: 'E2E Test Pint', price: 5.5, quantity: 1 }],
    note: 'e2e-test',
    total: 5.5,
    status: 'pending',
    tab_closed: false,
    id_checked: true,
    allergy_checked: true,
    allergens: [],
  };
  const { data, error } = await supabase.from('orders').insert(payload).select('id').single();
  if (error) throw new Error(error.message);
  testIds.orderId = data.id;
  return `order ${data.id.slice(0, 8)}… on table ${TEST_TABLE}`;
}

async function testBarSeesPending() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, table_number')
    .eq('status', 'pending')
    .eq('id', testIds.orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Pending order not visible to bar query');
  return `pending order visible`;
}

async function testCompleteOrder() {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', testIds.orderId);
  if (error) throw new Error(error.message);
  return 'marked complete';
}

async function testLiveTables() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, table_number, tab_closed, total')
    .eq('tab_closed', false)
    .eq('table_number', TEST_TABLE);
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('Table 99 not in live tables');
  const total = data.reduce((s, o) => s + (o.total || 0), 0);
  return `table ${TEST_TABLE} open, £${total.toFixed(2)}`;
}

async function testCloseTable() {
  const { data: rows, error: fetchErr } = await supabase
    .from('orders')
    .select('id')
    .eq('table_number', TEST_TABLE)
    .eq('tab_closed', false);
  if (fetchErr) throw new Error(fetchErr.message);
  const ids = rows.map(r => r.id);
  const { error } = await supabase
    .from('orders')
    .update({ tab_closed: true, payment_method: 'card', status: 'complete' })
    .in('id', ids);
  if (error) throw new Error(error.message);
  return `closed ${ids.length} order(s)`;
}

async function testBookingSave() {
  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    name: 'E2E Test Guest',
    email: '',
    phone: '07000000000',
    date: today,
    time: '19:00',
    party_size: 2,
    table_preference: String(TEST_TABLE),
    occasion: 'none',
    status: 'confirmed',
    notes: 'e2e-test',
  };
  const { data, error } = await supabase.from('bookings').insert(payload).select('id').single();
  if (error) throw new Error(error.message);
  testIds.bookingId = data.id;

  const { data: saved, error: readErr } = await supabase
    .from('bookings')
    .select('name, date, status')
    .eq('id', data.id)
    .single();
  if (readErr) throw new Error(readErr.message);
  if (saved.name !== payload.name) throw new Error('Booking read-back mismatch');
  return `booking ${data.id.slice(0, 8)}… for ${today}`;
}

async function testAdminAnalytics() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('orders')
    .select('total, status, created_at')
    .gte('created_at', todayStart.toISOString())
    .limit(1000);
  if (error) throw new Error(error.message);
  const completed = data.filter(o => o.status === 'complete');
  const revenue = completed.reduce((s, o) => s + (o.total || 0), 0);
  return `today: ${data.length} orders, ${completed.length} complete, £${revenue.toFixed(2)} revenue`;
}

async function testRealtimeChannel() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      reject(new Error('Realtime subscription timed out after 8s'));
    }, 8000);

    const channel = supabase
      .channel('e2e-realtime-test')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        clearTimeout(timeout);
        supabase.removeChannel(channel);
        resolve('realtime channel subscribed');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Trigger a no-op select to verify connection; subscription itself is the test
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve('realtime channel connected');
        }
        if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(new Error('Realtime channel error'));
        }
      });
  });
}

async function cleanup() {
  if (testIds.orderId) {
    await supabase.from('orders').delete().eq('id', testIds.orderId);
  }
  if (testIds.bookingId) {
    await supabase.from('bookings').delete().eq('id', testIds.bookingId);
  }
  // Also clean any leftover e2e orders on test table
  await supabase.from('orders').delete().eq('table_number', TEST_TABLE).eq('note', 'e2e-test');
  await supabase.from('bookings').delete().eq('notes', 'e2e-test');
}

console.log('\nStratford Bar POS — E2E Tests\n');

// Preflight: schema must exist
const { error: schemaErr } = await supabase.from('settings').select('id').limit(1);
if (schemaErr?.message?.includes('schema cache') || schemaErr?.code === 'PGRST205') {
  console.error('  ✗ Database schema missing — run supabase/schema.sql in Supabase SQL Editor first');
  console.error('    Then: npm run db:check && npm run test:e2e\n');
  process.exit(1);
}

await timed('1. Admin settings & PIN', testSettingsAndPin);
await timed('2. Create pending order (waiter flow)', testCreateOrder);
await timed('3. Bar page sees pending order', testBarSeesPending);
await timed('4. Complete order (bar flow)', testCompleteOrder);
await timed('5. Live Tables shows active table', testLiveTables);
await timed('6. Close table (payment flow)', testCloseTable);
await timed('7. Bookings saves data', testBookingSave);
await timed('8. Admin analytics/revenue query', testAdminAnalytics);
await timed('9. Realtime subscription', testRealtimeChannel);

await cleanup();

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;

console.log(`\nResults: ${passed}/${results.length} passed${failed ? `, ${failed} failed` : ''}\n`);

if (failed > 0) process.exit(1);
