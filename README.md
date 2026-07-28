# HL Accounting

Track who has taken what, at which discount level, how much is still to be received, and when each account was opened and settled. Built for the phone, works on desktop too. Each person signs in and sees only their own accounts.

**First time here → read `SETUP.md`.** The app won't do anything until it's connected to a Supabase project (free, ~20 minutes).

## Using it

**Sign in** with email and password. Create an account on first use. Everything you record stays tied to that login, so it's all there when you sign in from another phone.

**+ New Entry** — name, date, then tap a discount level (MRP / 15 / 25 / 35 / 42 / 50%). Every product price on screen repaints instantly when you change the level. Set quantities with the +/− steppers. The bar at the bottom always shows the running total to receive. ₹105 delivery is added automatically under 100 VP, free at 100 and above.

As soon as you create the entry you get a ready-written message to send the customer — itemised, with the total and any balance due. Tap **Copy message** and paste it into WhatsApp, or **Share** to send it straight from your phone. The text box is editable if you want to change the wording first. The same message is available any time from inside an account (**📋 Copy order message**), and it stays up to date as payments come in. Your discount level is deliberately left out of it.

**Open** — everything unsettled, with outstanding total across all of them at the top. Tap any account for the full breakdown.

**Inside an account** — the itemised bill, then record amounts received. Part payments are fine, each with its own date; *Fill full balance* saves typing the last one. The **✓ Close account** button stays locked until received equals the total exactly, then closing it stamps the date and moves it to **Closed**.

**Closed** — settled accounts with both dates and days taken. Reopen if you recorded something by mistake.

**👤 menu** — download a backup, change your password, sign out.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole interface and styling |
| `app.js` | Logic — auth, totals, saving |
| `products.js` | The price list. Edit this when prices change. |
| `config.js` | Your Supabase URL and anon key (see SETUP.md) |
| `schema.sql` | Database table + security rules, run once in Supabase |
| `manifest.json` | Lets it install to a phone home screen |
| `SETUP.md` | Setup and free hosting, step by step |
| `Start HL Accounting.command` | Runs it locally on this Mac for testing |

## Prices

From https://ayushkakkar.github.io/Hl-price-cal/ — 39 products with volume points, MRP and all five discount tiers. Edit `products.js` to update; accounts already created keep the rates they were billed at.
