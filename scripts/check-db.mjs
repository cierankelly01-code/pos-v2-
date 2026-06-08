/**
 * Verify Supabase tables exist. Run: node scripts/check-db.mjs
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

const url = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const key =
  process.env.VITE_SUPABASE_ANON_KEY ||
  fileEnv.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / key in env');
  process.exit(1);
}

const supabase = createClient(url, key);
const tables = ['settings', 'orders', 'bookings', 'users', 'products', 'allergens', 'staff', 'tips'];
let ok = true;

for (const table of tables) {
  const { error } = await supabase.from(table).select('id').limit(1);
  if (error?.message?.includes('schema cache') || error?.code === 'PGRST205') {
    console.log(`✗ ${table} — table missing`);
    ok = false;
  } else if (error) {
    console.log(`? ${table} — ${error.message}`);
    ok = false;
  } else {
    console.log(`✓ ${table} — ok`);
  }
}

if (!ok) {
  console.log('\nRun supabase/schema.sql in your Supabase project SQL Editor, then re-test.');
  process.exit(1);
}

console.log('\nDatabase schema OK');
