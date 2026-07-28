/* ══ Supabase ═══════════════════════════════════════════════ */
let sb = null, user = null;

function configured() {
    return typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('https://')
        && typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 20;
}

/* ══ helpers ════════════════════════════════════════════════ */
const money = n => '₹' + Math.round(n).toLocaleString('en-IN');
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const fmtDate = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
const prodById = id => PRODUCTS.find(p => p.id === id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tierLabel = k => (TIERS.find(t => t.key === k) || { label: k }).label;

function toast(msg) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
}

/* Each item stores the rate it was billed at, so editing products.js
   later never changes the total of an account already created. */
const rateOf = (it, tier) => (typeof it.rate === 'number' ? it.rate : (prodById(it.id) || {})[tier] || 0);
const mrpOf = it => (typeof it.mrp === 'number' ? it.mrp : (prodById(it.id) || {}).mrp || 0);

function totals(acct) {
    let qty = 0, vp = 0, sub = 0, mrp = 0;
    (acct.items || []).forEach(it => {
        const p = prodById(it.id);
        qty += it.qty;
        vp += (p ? p.volPoint : 0) * it.qty;
        sub += rateOf(it, acct.tier) * it.qty;
        mrp += mrpOf(it) * it.qty;
    });
    const delivery = Number(acct.delivery) || 0;   // added only when you tick it
    const total = sub + delivery;
    const paid = (acct.payments || []).reduce((s, p) => s + p.amount, 0);
    return {
        qty, vp, sub, mrp, delivery, total, paid,
        saved: mrp - sub,
        balance: Math.round((total - paid) * 100) / 100
    };
}

/* ══ auth ═══════════════════════════════════════════════════ */
let mode = 'login';

function authMode(m) {
    mode = m;
    document.getElementById('tabLogin').classList.toggle('on', m === 'login');
    document.getElementById('tabSignup').classList.toggle('on', m === 'signup');
    document.getElementById('authBtn').textContent = m === 'login' ? 'Sign in' : 'Create account';
    document.getElementById('aPass').setAttribute('autocomplete', m === 'login' ? 'current-password' : 'new-password');
    document.getElementById('forgotBtn').classList.toggle('hide', m !== 'login');
    document.getElementById('authMsg').innerHTML = '';
}

function authMsg(text, kind) {
    document.getElementById('authMsg').innerHTML = `<div class="${kind || 'err'}">${esc(text)}</div>`;
}

async function doAuth(e) {
    e.preventDefault();
    const email = document.getElementById('aEmail').value.trim();
    const password = document.getElementById('aPass').value;
    const btn = document.getElementById('authBtn');
    btn.disabled = true; btn.textContent = 'Please wait…';
    try {
        if (mode === 'signup') {
            const { data, error } = await sb.auth.signUp({ email, password });
            if (error) throw error;
            if (!data.session) {
                // Only reachable if email confirmation gets switched back on in Supabase.
                authMsg('Account created. Sign in with the same email and password.', 'ok');
                authMode('login');
            }
        } else {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (err) {
        authMsg(friendlyAuthError(err));
    } finally {
        btn.disabled = false;
        btn.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    }
}

/* Show the Google button only if the provider is switched on for this
   project, so nobody can tap it into a dead end. Enabling it in the
   Supabase dashboard makes the button appear on the next page load. */
async function revealEnabledProviders() {
    try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/settings', { headers: { apikey: SUPABASE_ANON_KEY } });
        const s = await r.json();
        if (s.external && s.external.google)
            document.getElementById('googleBlock').classList.remove('hide');
    } catch (e) { /* offline — email sign-in still works */ }
}

async function signInWithGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + location.pathname }
    });
    if (error) authMsg(friendlyAuthError(error));
}

function friendlyAuthError(err) {
    const m = (err && err.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'Wrong email or password.';
    if (m.includes('email not confirmed')) return 'Email confirmation is still switched on in Supabase — turn it off under Authentication → Sign In / Providers → Email.';
    if (m.includes('already registered')) return 'That email already has an account. Sign in instead.';
    if (m.includes('password')) return err.message;
    if (m.includes('provider is not enabled') || m.includes('unsupported provider'))
        return 'Google sign-in is not switched on yet in Supabase — see SETUP.md.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a minute and try again.';
    if (m.includes('fetch') || m.includes('network')) return 'No connection. Check your internet and try again.';
    return err.message || 'Something went wrong. Try again.';
}

async function forgotPassword() {
    const email = document.getElementById('aEmail').value.trim();
    if (!email) return authMsg('Type your email above first, then tap Forgot password.');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
    authMsg(error ? friendlyAuthError(error) : 'Password reset link sent. Check your email.', error ? 'err' : 'ok');
}

async function signOut() {
    await sb.auth.signOut();
    accounts = []; draft = {}; editingId = null;
    closeSheet();
    toast('Signed out');
}

function openAccountMenu() {
    sheet(`
    <div class="sh"><div><h2>Your account</h2>
      <div style="color:var(--muted);font-size:13.5px;margin-top:3px">${esc(user.email)}</div></div>
      <button class="x" onclick="closeSheet()">×</button></div>
    <div class="sb">
      <p class="note" style="margin-top:0">Everything you record is tied to this login and is private to you.
         Other people using this tool cannot see it, and it stays saved when you sign in from another phone.</p>
      <div class="sec">Data</div>
      <button class="ghost" style="width:100%;margin-bottom:9px" onclick="exportData()">Download a backup (.json)</button>
      <button class="ghost" style="width:100%" onclick="changePassword()">Change password</button>
    </div>
    <div class="sf"><button class="dangerbtn" style="flex:1" onclick="signOut()">Sign out</button></div>`);
}

async function changePassword() {
    const p1 = prompt('New password (at least 8 characters):');
    if (!p1) return;
    if (p1.length < 8) return alert('Password must be at least 8 characters.');
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) return alert(friendlyAuthError(error));
    closeSheet(); toast('Password changed');
}

/* ══ data ═══════════════════════════════════════════════════ */
let accounts = [];
let hasDeliveryColumn = true;   // probed at sign-in; see SETUP.md migration

async function probeSchema() {
    const { error } = await sb.from('accounts').select('delivery').limit(1);
    hasDeliveryColumn = !error;
    if (error) toast('Run the one-line delivery migration in SETUP.md — delivery is not being saved yet');
}

const fromRow = r => ({
    id: r.id, name: r.name, phone: r.phone || '', tier: r.tier,
    date: r.order_date, closedAt: r.closed_at, delivery: Number(r.delivery) || 0,
    items: r.items || [], payments: r.payments || []
});

async function loadAccounts() {
    const { data, error } = await sb.from('accounts').select('*').order('order_date', { ascending: false });
    if (error) { toast('Could not load: ' + error.message); return; }
    accounts = data.map(fromRow);
    refresh();
}

async function dbInsert(a) {
    const row = {
        user_id: user.id, name: a.name, phone: a.phone, tier: a.tier,
        order_date: a.date, items: a.items, payments: a.payments
    };
    if (hasDeliveryColumn) row.delivery = a.delivery;
    const { data, error } = await sb.from('accounts').insert(row).select().single();
    if (error) throw error;
    return fromRow(data);
}

async function dbUpdate(id, patch) {
    if (!hasDeliveryColumn) delete patch.delivery;
    const { data, error } = await sb.from('accounts').update(patch).eq('id', id).select().single();
    if (error) throw error;
    const a = fromRow(data);
    const i = accounts.findIndex(x => x.id === id);
    if (i >= 0) accounts[i] = a;
    return a;
}

/* ══ views ══════════════════════════════════════════════════ */
let view = 'open';

function show(v) {
    view = v;
    ['open', 'closed', 'new'].forEach(k => {
        const cap = k[0].toUpperCase() + k.slice(1);
        document.getElementById('view' + cap).classList.toggle('hide', k !== v);
        document.getElementById('tab' + cap).classList.toggle('on', k === v);
    });
    document.getElementById('stickybar').classList.toggle('hide', v !== 'new');
    window.scrollTo(0, 0);
    if (v === 'open') renderOpen();
    if (v === 'closed') renderClosed();
    if (v === 'new') recalc();
}

/* ── new entry ── */
let draft = {};          // {productId: qty}
let editingId = null;
let tier = 'd25';

function initForm() {
    document.getElementById('tierChips').innerHTML =
        TIERS.map(t => `<button type="button" data-tier="${t.key}" onclick="setTier('${t.key}')">
            ${t.key === 'mrp' ? 'MRP' : t.label.replace(' off', '')}</button>`).join('');
    document.getElementById('fDate').value = today();
    setTier('d25');
}

/* Changing the discount level repaints every product's price straight away. */
function setTier(k) {
    tier = k;
    document.querySelectorAll('#tierChips button').forEach(b => b.classList.toggle('on', b.dataset.tier === k));
    renderProducts();
    recalc();
}

function renderProducts() {
    const q = (document.getElementById('pSearch').value || '').toLowerCase().trim();
    const list = PRODUCTS.filter(p => !q || p.name.toLowerCase().includes(q));
    document.getElementById('plist').innerHTML = list.map(p => {
        const qty = draft[p.id] || 0;
        return `<div class="prow ${qty ? 'picked' : ''}">
      <div class="pn">
        <div class="t">${esc(p.name)}</div>
        <div class="s">${money(p[tier])} · ${p.volPoint} VP</div>
      </div>
      <div class="qty">
        <button type="button" onclick="bump(${p.id},-1)" aria-label="less">−</button>
        <input type="number" inputmode="numeric" min="0" value="${qty}" onchange="setQty(${p.id},this.value)">
        <button type="button" onclick="bump(${p.id},1)" aria-label="more">+</button>
      </div></div>`;
    }).join('') || '<div class="empty">No product matches that search.</div>';
}

function bump(id, d) { setQty(id, (draft[id] || 0) + d); }

function setQty(id, v) {
    const n = Math.max(0, Math.min(999, parseInt(v) || 0));
    if (n === 0) delete draft[id]; else draft[id] = n;
    renderProducts(); recalc();
}

const draftItems = () => Object.keys(draft).map(id => ({
    id: +id, qty: draft[id], rate: prodById(+id)[tier], mrp: prodById(+id).mrp
}));

/* Delivery is never automatic — it is added only when this is ticked. */
function deliveryToggled() {
    const on = document.getElementById('fDelivery').checked;
    const amt = document.getElementById('fDeliveryAmt');
    amt.disabled = !on;
    if (on && !Number(amt.value)) amt.value = DELIVERY_CHARGE;
    recalc();
}

const draftDelivery = () => document.getElementById('fDelivery').checked
    ? Math.max(0, Number(document.getElementById('fDeliveryAmt').value) || 0)
    : 0;

function recalc() {
    const items = draftItems();
    const t = totals({ items, tier, payments: [], delivery: draftDelivery() });

    document.getElementById('sQty').textContent = t.qty;
    document.getElementById('sVP').textContent = t.vp.toFixed(2);
    document.getElementById('sMRP').textContent = money(t.mrp);
    document.getElementById('sSaved').textContent = '−' + money(t.saved);
    document.getElementById('sSavedRow').classList.toggle('hide', t.saved <= 0);
    document.getElementById('sDel').textContent = money(t.delivery);
    document.getElementById('sTotal').textContent = money(t.total);
    document.getElementById('barTotal').textContent = money(t.total);
    document.getElementById('barSub').textContent = t.qty
        ? `${t.qty} item${t.qty === 1 ? '' : 's'} · ${t.vp.toFixed(2)} VP · ${tierLabel(tier)}`
        : 'No items yet';

    document.getElementById('sumItems').innerHTML = items.length
        ? items.map(it => `<div class="kv" style="font-size:13px;padding:3px 0">
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px">
              ${it.qty}× ${esc(prodById(it.id).name)}</span>
            <b>${money(it.rate * it.qty)}</b></div>`).join('')
          + '<div style="height:10px"></div>'
        : '<div class="note" style="margin:0 0 10px">No items selected yet.</div>';

    const ok = document.getElementById('fName').value.trim() && items.length;
    const btn = document.getElementById('saveBtn');
    btn.disabled = !ok;
    btn.textContent = editingId ? 'Save' : 'Create';
}

async function saveAccount() {
    const name = document.getElementById('fName').value.trim();
    const items = draftItems();
    if (!name || !items.length) return;
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.textContent = 'Saving…';

    const payload = {
        name, phone: document.getElementById('fPhone').value.trim(),
        tier, date: document.getElementById('fDate').value || today(),
        items, payments: [], delivery: draftDelivery()
    };

    try {
        if (editingId) {
            await dbUpdate(editingId, {
                name: payload.name, phone: payload.phone, tier: payload.tier,
                order_date: payload.date, items: payload.items, delivery: payload.delivery
            });
            toast('Account updated');
            resetForm();
            show('open');
        } else {
            const created = await dbInsert(payload);
            accounts.unshift(created);
            resetForm();
            show('open');
            messageSheet(created.id, true);   // offer the text to send straight away
        }
    } catch (err) {
        toast('Could not save: ' + err.message);
        btn.disabled = false; btn.textContent = editingId ? 'Save' : 'Create';
    }
}

function resetForm() {
    draft = {}; editingId = null;
    document.getElementById('fName').value = '';
    document.getElementById('fPhone').value = '';
    document.getElementById('fDate').value = today();
    document.getElementById('pSearch').value = '';
    document.getElementById('fDelivery').checked = false;
    document.getElementById('fDeliveryAmt').value = DELIVERY_CHARGE;
    deliveryToggled();
    setTier('d25');
}

function editAccount(id) {
    const a = accounts.find(x => x.id === id);
    editingId = id;
    draft = {}; a.items.forEach(it => draft[it.id] = it.qty);
    document.getElementById('fName').value = a.name;
    document.getElementById('fPhone').value = a.phone || '';
    document.getElementById('fDate').value = a.date;
    document.getElementById('pSearch').value = '';
    document.getElementById('fDelivery').checked = a.delivery > 0;
    document.getElementById('fDeliveryAmt').value = a.delivery > 0 ? a.delivery : DELIVERY_CHARGE;
    deliveryToggled();
    closeSheet(); show('new'); setTier(a.tier);
}

/* ── lists ── */
function card(a) {
    const t = totals(a);
    const pct = t.total ? Math.min(100, (t.paid / t.total) * 100) : 0;
    const settled = t.balance <= 0;
    return `<button class="acct" onclick="openSheet('${a.id}')">
    <div class="r1">
      <div style="min-width:0">
        <div class="nm">${esc(a.name)}</div>
        <div class="sub">${a.closedAt ? fmtDate(a.date) + ' → ' + fmtDate(a.closedAt) : fmtDate(a.date)}
          · ${t.qty} item${t.qty === 1 ? '' : 's'} · ${tierLabel(a.tier)}</div>
      </div>
      <div class="pill ${a.closedAt || settled ? '' : 'due'}">
        ${a.closedAt ? '✓ Closed' : (settled ? 'Ready to close' : 'Due')}</div>
    </div>
    <div class="money">
      <div>Total<b>${money(t.total)}</b></div>
      <div>Received<b>${money(t.paid)}</b></div>
      <div>Balance<b class="${t.balance > 0 ? 'due' : ''}">${money(t.balance)}</b></div>
    </div>
    ${a.closedAt ? '' : `<div class="bar"><i style="width:${pct}%"></i></div>`}</button>`;
}

function renderOpen() {
    const open = accounts.filter(a => !a.closedAt);
    const q = (document.getElementById('searchOpen').value || '').toLowerCase().trim();
    const shown = open.filter(a => !q || a.name.toLowerCase().includes(q));

    let billed = 0, paid = 0;
    open.forEach(a => { const t = totals(a); billed += t.total; paid += t.paid; });
    const ready = open.filter(a => totals(a).balance <= 0).length;

    document.getElementById('stats').innerHTML = `
    <div class="stat wide"><div class="k">Outstanding</div><div class="v due">${money(billed - paid)}</div></div>
    <div class="stat"><div class="k">Open accounts</div><div class="v">${open.length}</div></div>
    <div class="stat"><div class="k">Ready to close</div><div class="v">${ready}</div></div>
    <div class="stat"><div class="k">Billed</div><div class="v">${money(billed)}</div></div>
    <div class="stat"><div class="k">Received</div><div class="v good">${money(paid)}</div></div>`;

    document.getElementById('openCards').innerHTML = shown.length ? shown.map(card).join('')
        : `<div class="empty">${open.length
            ? 'No account matches that search.'
            : 'No open accounts yet.<br>Tap <b>+ New Entry</b> to add one.'}</div>`;
}

function renderClosed() {
    const closed = accounts.filter(a => a.closedAt).sort((a, b) => b.closedAt.localeCompare(a.closedAt));
    const q = (document.getElementById('searchClosed').value || '').toLowerCase().trim();
    const shown = closed.filter(a => !q || a.name.toLowerCase().includes(q));
    document.getElementById('closedCards').innerHTML = shown.length ? shown.map(card).join('')
        : `<div class="empty"><div class="big">✅</div>${closed.length
            ? 'No account matches that search.' : 'No closed accounts yet.'}</div>`;
}

function refresh() { view === 'closed' ? renderClosed() : renderOpen(); }

/* ══ account sheet ══════════════════════════════════════════ */
let openId = null;

function sheet(html) {
    document.getElementById('sheetHost').innerHTML =
        `<div class="veil" onclick="if(event.target===this)closeSheet()">
       <div class="sheet"><div class="grab"></div>${html}</div></div>`;
    document.body.style.overflow = 'hidden';
}

function closeSheet() {
    openId = null;
    document.getElementById('sheetHost').innerHTML = '';
    document.body.style.overflow = '';
}

function openSheet(id) { openId = id; drawSheet(); }

function drawSheet() {
    const a = accounts.find(x => x.id === openId);
    if (!a) return closeSheet();
    const t = totals(a);
    const settled = t.balance === 0;
    const over = t.balance < 0;

    const rows = a.items.map(it => {
        const p = prodById(it.id);
        const rate = rateOf(it, a.tier);
        return `<tr><td>${esc(p ? p.name : 'Item #' + it.id)}</td><td class="r">${it.qty}</td>
      <td class="r">${money(rate)}</td><td class="r">${money(rate * it.qty)}</td></tr>`;
    }).join('');

    const pays = (a.payments || []).map((p, i) => `
    <div class="payrow"><span>${fmtDate(p.date)}</span>
      <span style="display:flex;align-items:center;gap:8px"><b>${money(p.amount)}</b>
      ${a.closedAt ? '' : `<button class="del" onclick="delPay(${i})" aria-label="Remove">×</button>`}</span></div>`
    ).join('') || '<div class="note">Nothing received yet.</div>';

    sheet(`
    <div class="sh">
      <div style="min-width:0">
        <h2 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name)}</h2>
        <div style="color:var(--muted);font-size:13px;margin-top:3px">
          ${a.phone ? esc(a.phone) + ' · ' : ''}${tierLabel(a.tier)}</div>
      </div>
      <button class="x" onclick="closeSheet()">×</button>
    </div>

    <div class="sb">
      <div class="kv"><span>Created</span><b>${fmtDate(a.date)}</b></div>
      ${a.closedAt ? `<div class="kv"><span>Closed</span><b>${fmtDate(a.closedAt)}</b></div>
        <div class="kv"><span>Days to settle</span><b>${daysBetween(a.date, a.closedAt)}</b></div>` : ''}

      <div class="sec">Items</div>
      <table>
        <tr><th>Product</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>
        ${rows}
        <tr><td colspan="3" style="color:var(--muted)">Total MRP</td><td class="r">${money(t.mrp)}</td></tr>
        ${t.saved > 0 ? `<tr><td colspan="3" style="color:var(--muted)">Discount on product earn-base (${a.tier.slice(1)}%)</td>
          <td class="r" style="color:var(--brand)">−${money(t.saved)}</td></tr>` : ''}
        <tr><td colspan="3" style="color:var(--muted)">Their price · ${t.vp.toFixed(2)} VP</td><td class="r">${money(t.sub)}</td></tr>
        ${t.delivery ? `<tr><td colspan="3" style="color:var(--muted)">Delivery</td><td class="r">${money(t.delivery)}</td></tr>` : ''}
        <tr><td colspan="3"><b>Total to receive</b></td><td class="r"><b>${money(t.total)}</b></td></tr>
      </table>

      <div class="sec">Amount received</div>
      ${pays}
      ${a.closedAt ? '' : `
      <div class="addpay">
        <input type="number" inputmode="decimal" id="payAmt" placeholder="Amount" min="0" step="1">
        <input type="date" id="payDate" value="${today()}">
        <button onclick="addPay()">Add payment</button>
      </div>
      ${t.balance > 0 ? `<button class="chipbtn" style="margin-top:10px"
          onclick="document.getElementById('payAmt').value=${t.balance}">
          Fill full balance ${money(t.balance)}</button>` : ''}`}

      <div class="balbox ${settled ? 'settled' : ''} ${over ? 'over' : ''}">
        <div><div class="l">${over ? 'Overpaid by' : (settled ? 'Fully settled' : 'Balance to receive')}</div>
          <div class="n">${money(Math.abs(t.balance))}</div></div>
        <div style="text-align:right"><div class="l">Received / Total</div>
          <div style="font-weight:640">${money(t.paid)} / ${money(t.total)}</div></div>
      </div>
      ${over ? '<div class="note" style="color:var(--danger)">Received is more than the total — check the payments before closing.</div>' : ''}

      <button class="ghost" style="width:100%;margin-top:14px" onclick="messageSheet('${a.id}')">
        📋 Copy order message</button>
    </div>

    <div class="sf">
      ${a.closedAt
        ? `<button class="ghost" onclick="reopen()">Reopen</button>
           <div class="flex1"></div>
           <button class="dangerbtn" onclick="removeAcct()">Delete</button>`
        : `<button class="primary" style="flex:1" onclick="closeAcct()" ${settled ? '' : 'disabled'}>
             ${settled ? '✓ Close account' : 'Balance ' + money(t.balance) + ' due'}</button>
           <button class="ghost" onclick="editAccount('${a.id}')">Edit</button>
           <button class="dangerbtn" onclick="removeAcct()">Delete</button>`}
    </div>`);
}

async function addPay() {
    const amt = parseFloat(document.getElementById('payAmt').value);
    if (!amt || amt <= 0) return;
    const date = document.getElementById('payDate').value || today();
    const a = accounts.find(x => x.id === openId);
    const payments = [...a.payments, { amount: amt, date }];
    try {
        await dbUpdate(a.id, { payments });
        drawSheet(); refresh();
        if (totals(accounts.find(x => x.id === openId)).balance === 0)
            toast('Fully paid — you can close this account');
    } catch (err) { toast('Could not save: ' + err.message); }
}

async function delPay(i) {
    const a = accounts.find(x => x.id === openId);
    const payments = a.payments.filter((_, k) => k !== i);
    try { await dbUpdate(a.id, { payments }); drawSheet(); refresh(); }
    catch (err) { toast('Could not save: ' + err.message); }
}

async function closeAcct() {
    const a = accounts.find(x => x.id === openId);
    if (totals(a).balance !== 0) return toast('Balance must be zero to close');
    try {
        await dbUpdate(a.id, { closed_at: today() });
        closeSheet(); refresh();
        toast('Closed — moved to the Closed tab');
    } catch (err) { toast('Could not save: ' + err.message); }
}

async function reopen() {
    const a = accounts.find(x => x.id === openId);
    try { await dbUpdate(a.id, { closed_at: null }); closeSheet(); show('open'); toast('Account reopened'); }
    catch (err) { toast('Could not save: ' + err.message); }
}

async function removeAcct() {
    const a = accounts.find(x => x.id === openId);
    if (!confirm(`Delete the account for ${a.name}? This cannot be undone.`)) return;
    const { error } = await sb.from('accounts').delete().eq('id', a.id);
    if (error) return toast('Could not delete: ' + error.message);
    accounts = accounts.filter(x => x.id !== a.id);
    closeSheet(); refresh(); toast('Account deleted');
}

/* ══ order message ══════════════════════════════════════════
   A plain-text summary to send the customer on WhatsApp/SMS.   */
function orderMessage(a) {
    const t = totals(a);
    const L = [];
    L.push(`Hi ${a.name},`, '');
    L.push(`Here is your order dated ${fmtDate(a.date)}:`, '');

    a.items.forEach(it => {
        const p = prodById(it.id);
        const rate = rateOf(it, a.tier);
        L.push(`• ${p ? p.name : 'Item #' + it.id} × ${it.qty} — ${money(rate * it.qty)}`);
    });

    L.push('');
    if (t.saved > 0) {
        L.push(`Total MRP: ${money(t.mrp)}`);
        L.push(`Discount on product earn-base (${a.tier.slice(1)}%): −${money(t.saved)}`);
        L.push(`Your price: ${money(t.sub)}`);
    } else {
        L.push(`Total MRP: ${money(t.mrp)}`);
    }
    if (t.delivery) L.push(`Delivery: ${money(t.delivery)}`);
    L.push(`Total payable: ${money(t.total)}`);

    if (t.paid > 0) {
        L.push('', `Received: ${money(t.paid)}`);
        if (t.balance > 0) L.push(`Balance due: ${money(t.balance)}`);
    }

    L.push('');
    L.push(t.total > 0 && t.balance <= 0
        ? 'Payment received in full — thank you!'
        : 'Thank you!');
    return L.join('\n');
}

function messageSheet(id, justCreated) {
    const a = accounts.find(x => x.id === id);
    if (!a) return;
    const msg = orderMessage(a);
    const canShare = typeof navigator.share === 'function';
    sheet(`
    <div class="sh">
      <div><h2>${justCreated ? 'Account created' : 'Order message'}</h2>
        <div style="color:var(--muted);font-size:13px;margin-top:3px">
          Send this to ${esc(a.name)}</div></div>
      <button class="x" onclick="closeSheet()">×</button>
    </div>
    <div class="sb">
      <textarea id="msgBox" class="msgbox" rows="14" readonly>${esc(msg)}</textarea>
      <p class="note">Tap Copy, then paste it into WhatsApp. You can edit the text above before copying.</p>
    </div>
    <div class="sf">
      <button class="primary" style="flex:1" onclick="copyMsg()">📋 Copy message</button>
      ${canShare ? '<button class="ghost" onclick="shareMsg()">Share</button>' : ''}
      <button class="ghost" onclick="closeSheet()">Done</button>
    </div>`);
    document.getElementById('msgBox').removeAttribute('readonly');
}

async function copyMsg() {
    const el = document.getElementById('msgBox');
    try {
        await navigator.clipboard.writeText(el.value);
        toast('Message copied');
    } catch (e) {
        el.focus(); el.select();
        try { document.execCommand('copy'); toast('Message copied'); }
        catch (_) { toast('Select the text above and copy it manually'); }
    }
}

async function shareMsg() {
    try { await navigator.share({ text: document.getElementById('msgBox').value }); }
    catch (e) { /* user dismissed the share sheet */ }
}

/* ══ backup ═════════════════════════════════════════════════ */
function exportData() {
    const blob = new Blob([JSON.stringify(accounts, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hl-accounts-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
}

/* ══ boot ═══════════════════════════════════════════════════ */
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

async function boot() {
    if (!configured() || typeof window.supabase === 'undefined') {
        document.getElementById('setupView').classList.remove('hide');
        return;
    }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    initForm();
    revealEnabledProviders();

    sb.auth.onAuthStateChange((event, session) => {
        user = session ? session.user : null;
        const signedIn = !!user;
        document.getElementById('appView').classList.toggle('hide', !signedIn);
        document.getElementById('authView').classList.toggle('hide', signedIn);
        if (signedIn) { show('open'); probeSchema().then(loadAccounts); }
    });

    const { data } = await sb.auth.getSession();
    if (!data.session) {
        document.getElementById('authView').classList.remove('hide');
        authMode('login');
        // Surface anything Google sent back on the redirect, e.g. a cancelled sign-in.
        const back = new URLSearchParams(location.hash.slice(1) || location.search);
        const oerr = back.get('error_description') || back.get('error');
        if (oerr) authMsg(decodeURIComponent(oerr.replace(/\+/g, ' ')));
    }
}

boot();
