# Setup — free hosting with logins

Two free services, about 20 minutes end to end:

- **Supabase** — stores the accounts and handles logins. Free tier.
- **GitHub Pages** — serves the website. Free.

You need no credit card for either.

---

## Step 1 — Create the database

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub.
2. **New project**.
   - Name: `hl-accounting`
   - Database password: let it generate one, and save it in your password manager. You will not need it day to day.
   - Region: **South Asia (Mumbai)** — closest to you, so the app feels faster.
3. Wait ~2 minutes for it to finish setting up.

## Step 2 — Create the table and the security rules

1. In the left sidebar click **SQL Editor** → **New query**.
2. Open `schema.sql` from this folder, copy the whole thing, paste it in, click **Run**.
3. You should see *Success. No rows returned*.

What you just ran matters — the `Row Level Security` policies in that file are what guarantee each person only ever sees their own accounts. That check happens inside the database, so it holds even if someone edits the website's code in their own browser.

To confirm it took: left sidebar → **Table Editor** → `accounts`. It should show a green **RLS enabled** badge.

## Step 3 — Connect the app to it

1. Left sidebar → **Project Settings** (gear) → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `config.js` in this folder and paste them in:

```js
const SUPABASE_URL = 'https://yourprojectid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...';   // long string
```

Only ever use the **anon public** key. Never the `service_role` key — that one bypasses all security and must stay on a server.

The anon key being visible in the website is normal and safe. It only identifies your project; it grants no data access by itself.

## Step 4 — Auth settings

Left sidebar → **Authentication**.

- **Sign In / Providers → Email**: leave **Confirm email** ON. It stops someone signing up with an email that isn't theirs.
- **Providers → Email → Minimum password length**: set to **8**.
- Turn on **Leaked password protection** if you see it (blocks passwords found in known breaches).
- **URL Configuration → Site URL**: put your live address here once you have it from Step 5, e.g. `https://ayushkakkar.github.io/hl-accounting/`. Add the same under **Redirect URLs**. Password reset links won't work until you do this.

**Who can sign up?** By default anyone who finds your link can create their own login. Their data is completely separate from yours, so nothing leaks — but if you want only your own team to have logins, go to **Authentication → Sign In / Providers → Email** and turn **Allow new users to sign up** OFF. Then create each person's login yourself under **Authentication → Users → Add user**, and give them the password to change after first sign-in.

## Step 5 — Put it online (free)

1. Create a new **public** repository on GitHub called `hl-accounting`.
2. Upload these files to it (drag and drop on github.com works fine):
   `index.html`, `app.js`, `products.js`, `config.js`, `manifest.json`
   (`schema.sql`, `SETUP.md` and `README.md` are optional — they're just notes.)
3. In the repo: **Settings → Pages**. Under *Build and deployment*, set Source = **Deploy from a branch**, Branch = **main**, folder = **/ (root)**. Save.
4. Wait a minute, then open `https://ayushkakkar.github.io/hl-accounting/`.
5. Go back and finish Step 4's **Site URL** with this address.

Because the repo is public, `config.js` is public too — that's fine, as explained above. Just never commit the `service_role` key.

> Prefer not to make the repo public? Use **Netlify** instead (netlify.com → *Add new site* → *Deploy manually* → drag this folder in). Also free, works with private code, and gives you an address like `hl-accounting.netlify.app`.

## Step 6 — Put it on your phone's home screen

Open the live link on your phone, then:

- **iPhone (Safari)**: Share button → *Add to Home Screen*.
- **Android (Chrome)**: ⋮ menu → *Add to Home screen*.

It then opens full-screen like a normal app, and you stay signed in between uses.

---

## Security — what protects your data

| | |
|---|---|
| **Passwords** | Never stored by the app. Supabase stores only a bcrypt hash; nobody, including you, can read them back. |
| **Isolation** | Enforced by Postgres Row Level Security, not by the app's code. A signed-in user's queries are automatically filtered to their own rows. |
| **Not signed in** | No policy grants anonymous visitors anything, so an unauthenticated request returns zero rows. |
| **In transit** | Everything is HTTPS, both GitHub Pages and Supabase. |
| **Sessions** | A signed token stored on the device, auto-refreshed, cleared on Sign out. |
| **Ownership** | A database trigger prevents a row's owner from ever being changed, so a record can't be moved to another user. |

Worth doing:

- Turn on **two-factor authentication** on your Supabase account itself — it is the one login that can see everything.
- Take a backup now and then (👤 menu → *Download a backup*).
- Free Supabase projects **pause after 7 days with no activity**. Daily use avoids this; if it ever pauses, un-pause it from the dashboard and nothing is lost.

## Changing prices later

Edit `products.js` and re-upload it. Accounts that already exist keep the rates they were billed at — a price change never rewrites history. New entries use the new prices.
