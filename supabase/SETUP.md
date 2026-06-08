# Supabase Database Setup

The POS app **will not work** until all tables exist in your Supabase project.

## Steps

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` in this repo, copy the **entire file**, and paste it into the editor.
4. Click **Run** (or press Ctrl+Enter).
5. Confirm success — you should see “Success. No rows returned” or similar.

## Verify tables exist

From the project root:

```bash
npm run db:check
```

Expected output:

```
✓ settings — ok
✓ orders — ok
✓ bookings — ok
✓ users — ok
✓ products — ok
✓ allergens — ok

Database schema OK
```

## Full E2E test (optional)

After `db:check` passes:

```bash
npm run test:e2e
```

## Tables created

| Table | Purpose |
|-------|---------|
| `settings` | Venue name, PIN, table count, menu JSON, floor map |
| `orders` | Waiter/bar orders with realtime sync |
| `bookings` | Customer reservations |
| `users` | Staff accounts (admin, waiter, bar) |
| `products` | Normalized menu items |
| `allergens` | Master allergen list |
| `product_allergens` | Links products to allergens |

## Default credentials

- **Admin PIN:** `1234` (change in Admin → Settings after first login)
- **Default admin user:** `admin@stratfordbar.local` (PIN `1234`)

## Troubleshooting

- **“Could not find the table in the schema cache”** — schema not applied; run `schema.sql` again.
- **Realtime not updating** — ensure `orders` is in **Database → Replication** (added automatically by schema).
- **App still shows “Database Not Set Up”** — refresh after running SQL; run `npm run db:check` locally.
