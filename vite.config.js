import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'

function resolveSupabaseEnv(mode) {
  const fileEnv = loadEnv(mode, process.cwd(), '')

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    fileEnv.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    fileEnv.SUPABASE_URL ??
    ''

  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ??
    fileEnv.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    fileEnv.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY ??
    ''

  return { supabaseUrl, supabaseAnonKey }
}

export default defineConfig(({ mode }) => {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseEnv(mode)

  return {
    logLevel: 'error',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Inline at build time so Vercel env vars are available in the client bundle.
    // Accepts VITE_* names (required for Vite) and unprefixed SUPABASE_* fallbacks.
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
  }
})
