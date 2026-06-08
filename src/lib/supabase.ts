import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.DEV) {
  const viteEnvKeys = Object.keys(import.meta.env).filter((key) =>
    key.startsWith('VITE_')
  );
  console.log('[supabase] env check', {
    VITE_SUPABASE_URL_set: Boolean(supabaseUrl),
    VITE_SUPABASE_ANON_KEY_set: Boolean(supabaseAnonKey),
    viteEnvKeys,
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Missing env vars. In Vercel, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (must be prefixed VITE_) for Production, then redeploy.'
  );
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment (e.g. Vercel → Project Settings → Environment Variables), then trigger a new deployment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
