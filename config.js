/* ─────────────────────────────────────────────────────────────
   Supabase connection for this app.

   The publishable key below is MEANT to be public — it is safe to
   commit and to ship in a website. It grants no access on its own;
   the database's Row Level Security policies (see schema.sql) are
   what decide who can read what.

   Never put the "service_role" / secret key here — that one bypasses
   all security and must only ever live on a server.
   ───────────────────────────────────────────────────────────── */

const SUPABASE_URL = 'https://cnrlbozgnbfcqilwwvyt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QBwTLGKd7o9xFCJb0b9rhw_RyGtYgvl';
