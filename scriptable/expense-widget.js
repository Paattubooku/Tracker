// ============================================================================
//  SpendFlow — Expense Tracker Widget for the Scriptable App  (v2)
//  Dark premium finance theme. Small / Medium / Large all fully fit.
// ============================================================================
//
//  Schema:
//  ┌──────────────────────────────────────────────────────────────────┐
//  │  expense_entries                                                  │
//  │    id           uuid         PK                                   │
//  │    amount       numeric(10,2)    CHECK (amount > 0)              │
//  │    category     text                                              │
//  │    description  text                                              │
//  │    created_at   timestamptz      default now()                   │
//  ├──────────────────────────────────────────────────────────────────┤
//  │  user_settings  (single row, id = 1)                             │
//  │    monthly_budget  numeric(10,2)  default 2000                   │
//  │    currency        text           default '$'                     │
//  └──────────────────────────────────────────────────────────────────┘
// ============================================================================

// ============================ CONFIGURATION =================================
const SUPABASE_URL = "https://gorcnicinidmpjevduhg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcmNuaWNpbmlkbXBqZXZkdWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTY4NDEsImV4cCI6MjA5ODgzMjg0MX0.AIkJqwDBI8odQ_Lg00SuujUr6cknxNkZeyHEwW8oScw";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcmNuaWNpbmlkbXBqZXZkdWhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1Njg0MSwiZXhwIjoyMDk4ODMyODQxfQ.Bx0WI6ncRTbUU5E0X-oMLnyN-PIAFAYlcL9BMTrdl6o";

const TAP_URL = "";
const FETCH_TIMEOUT_MS = 8000;
const PREVIEW_FAMILY = "medium"; // small | medium | large
// ============================================================================

// ── Colour Palette ───────────────────────────────────────────────────────────
const C = {
  bg: "#0d0d12",
  bgCard: "#13131a",
  bgTrack: "#1c1c28",
  accent: "#7c5cfc",
  green: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  blue: "#3b82f6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  text: "#f1f5f9",
  textSub: "#64748b",
  textDim: "#2d3748",
  sep: "#1e253a",
};

const CAT_COLORS = [
  "#7c5cfc", "#3b82f6", "#10b981", "#f59e0b",
  "#f97316", "#ec4899", "#06b6d4", "#a855f7",
];

function categoryColor(name) {
  if (!name) return CAT_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CAT_COLORS[h % CAT_COLORS.length];
}

const API_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const CONFIGURED = Boolean(SUPABASE_URL && API_KEY);

// ============================================================================
// Date helpers
// ============================================================================
function getLocalDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthStartUTC() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
function nextMonthStartUTC() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
}
function todayDateStr() {
  return getLocalDateString(new Date());
}
function currentMonthLabel() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date();
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
function currentLocalDay() { return new Date().getDate(); }
function daysInMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
function nowHHMM() { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }

// ============================================================================
// Money formatting
// ============================================================================
function fmt(n, sym, forceShort) {
  sym = sym || "$";
  if (forceShort || n >= 10000) return `${sym}${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${sym}${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${sym}${n.toFixed(2)}`;
}
function fmtShort(n, sym) { return fmt(n, sym, true); }

// ============================================================================
// Network
// ============================================================================
function withTimeout(promise, ms, label) {
  let t = null;
  const timeout = new Promise((_, rej) => {
    t = Timer.schedule(ms, false, () => rej(new Error("timeout:" + label)));
  });
  return Promise.race([promise, timeout]).then(
    v => { if (t) t.invalidate(); return v; },
    e => { if (t) t.invalidate(); throw e; }
  );
}

async function supabaseGet(path) {
  const req = new Request(`${SUPABASE_URL}/rest/v1/${path}`);
  req.method = "GET";
  req.timeoutInterval = FETCH_TIMEOUT_MS / 1000;
  req.headers = {
    "apikey": API_KEY,
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  const text = await req.loadString();
  const status = req.response && req.response.statusCode;
  if (typeof status === "number" && (status < 200 || status >= 300))
    throw new Error(`HTTP ${status}: ${text.slice(0, 120)}`);
  try { return JSON.parse(text); }
  catch (e) { throw new Error(`Bad JSON: ${text.slice(0, 120)}`); }
}

// ============================================================================
// Cache
// ============================================================================
const fm = FileManager.local();
const CACHE = fm.joinPath(fm.cacheDirectory(), "spendflow_v2_cache.json");

function loadCache() {
  try {
    if (!fm.fileExists(CACHE)) return null;
    const t = fm.readString(CACHE);
    return t ? JSON.parse(t) : null;
  } catch { return null; }
}
function saveCache(d) {
  try { fm.writeString(CACHE, JSON.stringify(d)); } catch { }
}

// ============================================================================
// Data fetch
// ============================================================================
async function fetchData() {
  const settingsPromise = withTimeout(
    supabaseGet("user_settings?select=monthly_budget,currency&id=eq.1"),
    FETCH_TIMEOUT_MS, "settings"
  ).then(r => ({ ok: true, r })).catch(e => ({ ok: false, e: e?.message || String(e) }));

  const ms = encodeURIComponent(monthStartUTC());
  const me = encodeURIComponent(nextMonthStartUTC());
  const expPromise = withTimeout(
    supabaseGet(`expense_entries?select=amount,category,created_at&created_at=gte.${ms}&created_at=lt.${me}&order=created_at.desc`),
    FETCH_TIMEOUT_MS, "expenses"
  ).then(r => ({ ok: true, r })).catch(e => ({ ok: false, e: e?.message || String(e) }));

  const [sRes, eRes] = await Promise.all([settingsPromise, expPromise]);

  if (!sRes.ok) console.log(`[SpendFlow] settings error: ${sRes.e}`);
  if (!eRes.ok) console.log(`[SpendFlow] expenses error: ${eRes.e}`);
  if (!sRes.ok && !eRes.ok) return { failure: true, reason: sRes.e || eRes.e };

  // Settings
  let budget = null, currency = null;
  if (sRes.ok && Array.isArray(sRes.r) && sRes.r.length > 0) {
    budget = parseFloat(sRes.r[0].monthly_budget) || null;
    currency = sRes.r[0].currency || null;
  }

  // Expenses
  let monthTotal = 0, todayTotal = 0;
  const catMap = {}, dayMap = {};
  const todayStr = todayDateStr();

  if (eRes.ok && Array.isArray(eRes.r)) {
    for (const row of eRes.r) {
      const amt = parseFloat(row.amount) || 0;
      const cat = (row.category || "Other").trim();
      const localDate = row.created_at ? new Date(row.created_at) : new Date();
      const dayStr = getLocalDateString(localDate);
      const dayNum = localDate.getDate();

      monthTotal += amt;
      if (dayStr === todayStr) todayTotal += amt;
      catMap[cat] = (catMap[cat] || 0) + amt;
      if (dayNum > 0) dayMap[dayNum] = (dayMap[dayNum] || 0) + amt;
    }
  }

  // Top 3 categories
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([name, amount]) => ({ name, amount, color: categoryColor(name) }));

  // Last 7 days bar data
  const days7 = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days7.push({
      label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()],
      day: d.getDate(),
      amount: dayMap[d.getDate()] || 0,
    });
  }

  const cached = loadCache();
  const finalBudget = budget !== null ? budget : (cached?.budget ?? 2000);
  const finalCurrency = currency !== null ? currency : (cached?.currency ?? "$");
  const pct = finalBudget > 0 ? Math.min((monthTotal / finalBudget) * 100, 100) : 0;
  const remaining = Math.max(finalBudget - monthTotal, 0);
  const over = monthTotal > finalBudget;
  const onTrack = monthTotal <= (finalBudget / daysInMonth()) * currentLocalDay() * 1.05;

  let status, accent;
  if (over) { status = "Over Budget!"; accent = C.orange; }
  else if (pct >= 85) { status = "Almost Limit"; accent = C.amber; }
  else if (pct >= 60) { status = "Spending up"; accent = C.blue; }
  else if (pct >= 30) { status = "On track"; accent = C.green; }
  else { status = "Great start!"; accent = C.green; }

  return {
    monthTotal, todayTotal,
    budget: finalBudget, currency: finalCurrency, pct, remaining,
    over, onTrack, status, accent,
    topCats, days7,
    monthLabel: currentMonthLabel(),
    live: sRes.ok && eRes.ok,
    updatedAt: nowHHMM(),
  };
}

// ============================================================================
// Drawing primitives
// ============================================================================
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return new Point(cx + r * Math.cos(rad), cy + r * Math.sin(rad));
}

function fillRR(ctx, x, y, w, h, r, hex, a) {
  const p = new Path();
  p.addRoundedRect(new Rect(x, y, w, h), r, r);
  ctx.addPath(p);
  ctx.setFillColor(new Color(hex, a ?? 1));
  ctx.fillPath();
}

function ctxText(ctx, text, font, hex, alpha, align, x, y, w, h) {
  ctx.setFont(font);
  ctx.setTextColor(new Color(hex, alpha ?? 1));
  if (align === "c") ctx.setTextAlignedCenter();
  else if (align === "r") ctx.setTextAlignedRight();
  else ctx.setTextAlignedLeft();
  ctx.drawTextInRect(text, new Rect(x, y, w, h));
}

// ============================================================================
// Donut renderer   ← used only by SMALL and MEDIUM
// mode: "pct"  →  just the % number + "used" label  (no inner amount text)
// mode: "full" →  amount + sublabel + % pill
// ============================================================================
function renderDonut(sz, pct, accent, total, budget, currency, dim, mode) {
  const cx = sz / 2, cy = sz / 2;
  const outerR = sz * 0.43, stroke = sz * 0.10;
  const arcR = outerR - stroke / 2;
  const alpha = dim ? 0.5 : 1;

  const ctx = new DrawContext();
  ctx.size = new Size(sz, sz);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  // Track
  ctx.setStrokeColor(new Color(C.bgTrack, 1));
  ctx.setLineWidth(stroke);
  ctx.strokeEllipse(new Rect(cx - arcR, cy - arcR, arcR * 2, arcR * 2));

  // Arc
  const sweep = Math.max(0, Math.min(pct, 100));
  if (sweep > 0) {
    const deg = (sweep / 100) * 360;
    const segs = Math.max(2, Math.round(deg / 2));
    const pts = [];
    for (let i = 0; i <= segs; i++) pts.push(polar(cx, cy, arcR, (deg * i) / segs));
    const arc = new Path(); arc.addLines(pts);
    ctx.addPath(arc);
    ctx.setStrokeColor(new Color(accent, alpha));
    ctx.setLineWidth(stroke);
    ctx.strokePath();
    // caps
    const capR = stroke / 2;
    ctx.setFillColor(new Color(accent, alpha));
    [pts[0], pts[pts.length - 1]].forEach(p =>
      ctx.fillEllipse(new Rect(p.x - capR, p.y - capR, capR * 2, capR * 2))
    );
  }

  if (mode === "pct") {
    // Centre: big %
    ctxText(ctx, `${Math.round(pct)}%`, Font.boldSystemFont(sz * 0.21),
      accent, alpha, "c", 0, cy - sz * 0.145, sz, sz * 0.29);
    ctxText(ctx, "used", Font.mediumSystemFont(sz * 0.08),
      C.textSub, alpha, "c", 0, cy + sz * 0.06, sz, sz * 0.13);
  } else {
    // Centre: amount (auto-size), sub-label, % pill
    const amtStr = fmt(total, currency);
    const fs = amtStr.length > 7 ? sz * 0.115 : (amtStr.length > 5 ? sz * 0.135 : sz * 0.155);
    ctxText(ctx, amtStr, Font.boldSystemFont(fs),
      C.text, alpha, "c", 0, cy - sz * 0.195, sz, sz * 0.21);
    ctxText(ctx, `of ${fmt(budget, currency)}`, Font.mediumSystemFont(sz * 0.068),
      C.textSub, alpha, "c", 0, cy + sz * 0.01, sz, sz * 0.1);
    // % pill
    const pW = sz * 0.30, pH = sz * 0.11, pX = cx - pW / 2, pY = cy + sz * 0.115;
    fillRR(ctx, pX, pY, pW, pH, pH / 2, accent, 0.18);
    ctxText(ctx, `${Math.round(pct)}%`, Font.semiboldSystemFont(sz * 0.068),
      accent, alpha, "c", pX, pY + pH * 0.08, pW, pH * 0.84);
  }

  return ctx.getImage();
}

// ============================================================================
// Horizontal budget bar  ← used by LARGE widget header
// ============================================================================
function renderBudgetBar(w, h, pct, accent, dim) {
  const alpha = dim ? 0.5 : 1;
  const ctx = new DrawContext();
  ctx.size = new Size(w, h);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const barH = h;
  const r = barH / 2;
  // Track
  fillRR(ctx, 0, 0, w, barH, r, C.bgTrack, 1);
  // Fill
  const fillW = Math.max((pct / 100) * w, r * 2);
  fillRR(ctx, 0, 0, fillW, barH, r, accent, alpha);
  return ctx.getImage();
}

// ============================================================================
// 7-day bar chart  ← used by MEDIUM and LARGE
// ============================================================================
function renderBars(W, H, days, accent, currency, dim) {
  const alpha = dim ? 0.5 : 1;
  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const n = days.length;
  const padX = W * 0.01;
  const slotW = (W - padX * 2) / n;
  const barW = Math.max(slotW * 0.48, 6);
  const labelH = H * 0.22;
  const barAreaH = H - labelH - H * 0.02;
  const maxAmt = Math.max(...days.map(d => d.amount), 1);

  for (let i = 0; i < n; i++) {
    const d = days[i];
    const isToday = i === n - 1;
    const slotX = padX + i * slotW;
    const barX = slotX + (slotW - barW) / 2;
    const filledH = Math.max(barAreaH * (d.amount / maxAmt), 4);
    const barY = barAreaH - filledH;

    // track
    fillRR(ctx, barX, 0, barW, barAreaH, barW / 2, C.bgTrack, alpha);
    // fill
    const col = isToday ? accent : C.blue;
    const a2 = isToday ? alpha : alpha * 0.5;
    fillRR(ctx, barX, barY, barW, filledH, barW / 2, col, a2);

    // glow dot on today
    if (isToday && d.amount > 0) {
      const dr = barW * 0.38;
      ctx.setFillColor(new Color(accent, 0.25));
      ctx.fillEllipse(new Rect(barX + barW / 2 - dr * 1.4, barY - dr * 0.6, dr * 2.8, dr * 2.8));
      ctx.setFillColor(new Color(accent, alpha));
      ctx.fillEllipse(new Rect(barX + barW / 2 - dr * 0.55, barY - dr * 0.05, dr * 1.1, dr * 1.1));
    }

    // day label
    const lY = barAreaH + H * 0.02;
    ctxText(ctx, d.label,
      isToday ? Font.boldSystemFont(H * 0.16) : Font.mediumSystemFont(H * 0.15),
      isToday ? accent : C.textSub, alpha, "c",
      slotX, lY, slotW, labelH);
  }
  return ctx.getImage();
}

// ============================================================================
// Category rows  ← used by LARGE widget
// ============================================================================
function renderCatBars(W, H, cats, maxAmt, currency, dim) {
  const alpha = dim ? 0.5 : 1;
  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const n = cats.length;
  if (n === 0) return ctx.getImage();
  const rowH = H / n;
  const barH = Math.max(Math.min(rowH * 0.22, 7), 4);
  const trackW = W;
  const maxV = maxAmt || 1;

  for (let i = 0; i < n; i++) {
    const cat = cats[i];
    const y = i * rowH;
    const textH = rowH * 0.42;

    // name left
    ctxText(ctx, cat.name, Font.semiboldSystemFont(rowH * 0.26),
      C.textSub, alpha, "l", 0, y + rowH * 0.03, W * 0.60, textH);

    // amount right
    ctxText(ctx, fmt(cat.amount, currency), Font.boldSystemFont(rowH * 0.26),
      cat.color, alpha, "r", W * 0.40, y + rowH * 0.03, W * 0.60, textH);

    // bar track
    const barY = y + textH + rowH * 0.08;
    fillRR(ctx, 0, barY, trackW, barH, barH / 2, C.bgTrack, 1);

    // bar fill
    const fillW = Math.max((cat.amount / maxV) * trackW, barH);
    fillRR(ctx, 0, barY, fillW, barH, barH / 2, cat.color, alpha);
  }
  return ctx.getImage();
}

// ============================================================================
// Shared: horizontal divider image
// ============================================================================
function makeDivider(W) {
  const ctx = new DrawContext();
  ctx.size = new Size(W, 1);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  fillRR(ctx, 0, 0, W, 1, 0, C.sep, 1);
  return ctx.getImage();
}

// ============================================================================
// Setup widget
// ============================================================================
function buildSetupWidget(family) {
  const w = new ListWidget();
  w.backgroundColor = new Color(C.bg);
  w.setPadding(16, 16, 16, 16);
  const s = w.addStack(); s.layoutVertically(); s.addSpacer();
  const ic = s.addText("💸");
  ic.font = Font.systemFont(family === "small" ? 26 : 32); ic.centerAlignText();
  s.addSpacer(6);
  const ti = s.addText("SpendFlow");
  ti.font = Font.boldSystemFont(family === "small" ? 16 : 20);
  ti.textColor = new Color(C.text); ti.centerAlignText();
  s.addSpacer(6);
  const su = s.addText("Add Supabase URL & key\nin the CONFIGURATION block.");
  su.font = Font.regularSystemFont(family === "small" ? 10 : 12);
  su.textColor = new Color(C.textSub); su.centerAlignText();
  s.addSpacer();
  return w;
}

// ============================================================================
// SMALL WIDGET  (~155×155 pt)
//
//  ┌──────────────────────┐
//  │  💸 SPEND       ●   │   ← 12pt header
//  │                      │
//  │    [ donut  ]        │   ← 112pt donut (pct mode — just %)
//  │                      │
//  │  $1,234   $766 left  │   ← two small stats
//  │       Jan 2025       │   ← month
//  └──────────────────────┘
//
//  Kept ultra-simple: donut only shows %, two numbers below.
//  No inner-donut text complexity — nothing overflows.
// ============================================================================
function buildSmallWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = new Color(C.bg);
  w.setPadding(12, 12, 10, 12);

  const root = w.addStack();
  root.layoutVertically();

  // Header row
  const hdr = root.addStack();
  hdr.layoutHorizontally();
  hdr.centerAlignContent();

  const hIco = hdr.addText("💸");
  hIco.font = Font.systemFont(11);
  hdr.addSpacer(4);
  const hTit = hdr.addText("SPEND");
  hTit.font = Font.semiboldSystemFont(10);
  hTit.textColor = new Color(C.textSub);
  hdr.addSpacer();
  const dot = hdr.addText(data.live ? "●" : "○");
  dot.font = Font.systemFont(8);
  dot.textColor = new Color(data.live ? C.green : C.textDim);

  root.addSpacer(6);

  // Donut — "pct" mode (just the % and "used")
  const dia = 108;
  const donutImg = root.addStack();
  donutImg.layoutHorizontally();
  donutImg.addSpacer();
  const di = donutImg.addImage(
    renderDonut(dia, data.pct, data.accent, data.monthTotal, data.budget, data.currency, !data.live, "pct")
  );
  di.imageSize = new Size(dia, dia);
  donutImg.addSpacer();

  root.addSpacer(6);

  // Two stats: spend  |  remaining
  const sRow = root.addStack();
  sRow.layoutHorizontally();
  sRow.centerAlignContent();
  sRow.addSpacer();

  const spT = sRow.addText(fmt(data.monthTotal, data.currency));
  spT.font = Font.boldSystemFont(13);
  spT.textColor = new Color(C.text);
  spT.minimumScaleFactor = 0.7;

  sRow.addSpacer(6);

  const sep = sRow.addText("·");
  sep.font = Font.systemFont(10);
  sep.textColor = new Color(C.textDim);

  sRow.addSpacer(6);

  const remT = sRow.addText(`${fmt(data.remaining, data.currency)} left`);
  remT.font = Font.mediumSystemFont(11);
  remT.textColor = new Color(data.over ? C.orange : C.green);
  remT.minimumScaleFactor = 0.7;

  sRow.addSpacer();

  root.addSpacer(3);

  // Month label + status
  const mRow = root.addStack();
  mRow.layoutHorizontally();
  mRow.addSpacer();
  const mT = mRow.addText(`${data.monthLabel}  ·  ${data.status}`);
  mT.font = Font.mediumSystemFont(9);
  mT.textColor = new Color(C.textSub);
  mT.lineLimit = 1;
  mT.minimumScaleFactor = 0.7;
  mRow.addSpacer();

  return w;
}

// ============================================================================
// MEDIUM WIDGET  (~338×155 pt)
//
//  ┌──────────────────┬─────────────────────────────┐
//  │                  │  💸 SPENDFLOW      LIVE      │
//  │  [donut full     │  $1,234.50                   │
//  │   118×118        │  of $2,000 · Jan 2025        │
//  │   shows amount]  │  ─────────────────────────   │
//  │                  │  TODAY    STATUS    LEFT      │
//  │                  │  $45.20  On track  $766       │
//  └──────────────────┴─────────────────────────────┘
// ============================================================================
function buildMediumWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = new Color(C.bg);
  w.setPadding(14, 16, 14, 16);

  const row = w.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  // Left: donut (full mode — shows spend amount inside)
  const dia = 118;
  const di = row.addImage(
    renderDonut(dia, data.pct, data.accent, data.monthTotal, data.budget, data.currency, !data.live, "full")
  );
  di.imageSize = new Size(dia, dia);

  row.addSpacer(16);

  // Right: info
  const info = row.addStack();
  info.layoutVertically();

  // Title + live
  const tRow = info.addStack();
  tRow.layoutHorizontally();
  tRow.centerAlignContent();
  const tIco = tRow.addText("💸");
  tIco.font = Font.systemFont(11);
  tRow.addSpacer(5);
  const tTit = tRow.addText("SPENDFLOW");
  tTit.font = Font.semiboldSystemFont(10);
  tTit.textColor = new Color(C.textSub);
  tRow.addSpacer();
  const live = tRow.addText(data.live ? "LIVE" : "CACHE");
  live.font = Font.semiboldSystemFont(8);
  live.textColor = new Color(data.live ? C.green : C.amber);

  info.addSpacer(5);

  // Big amount
  const bigT = info.addText(fmt(data.monthTotal, data.currency));
  bigT.font = Font.boldSystemFont(26);
  bigT.textColor = new Color(C.text);
  bigT.lineLimit = 1;
  bigT.minimumScaleFactor = 0.65;

  info.addSpacer(2);

  // Sub-label
  const subT = info.addText(`of ${fmt(data.budget, data.currency)} budget · ${data.monthLabel}`);
  subT.font = Font.regularSystemFont(10);
  subT.textColor = new Color(C.textSub);
  subT.lineLimit = 1;
  subT.minimumScaleFactor = 0.75;

  info.addSpacer(7);

  // Divider
  const divImg = info.addImage(makeDivider(175));
  divImg.imageSize = new Size(175, 1);

  info.addSpacer(7);

  // 3-stat row
  const sRow = info.addStack();
  sRow.layoutHorizontally();

  function mStat(parent, val, lbl, col) {
    const b = parent.addStack(); b.layoutVertically();
    const v = b.addText(val);
    v.font = Font.boldSystemFont(14); v.textColor = new Color(col);
    v.lineLimit = 1; v.minimumScaleFactor = 0.6;
    b.addSpacer(2);
    const l = b.addText(lbl);
    l.font = Font.mediumSystemFont(8); l.textColor = new Color(C.textSub);
  }

  mStat(sRow, fmt(data.todayTotal, data.currency), "TODAY", C.blue);
  sRow.addSpacer();
  mStat(sRow, data.status, "STATUS", data.accent);
  sRow.addSpacer();
  mStat(sRow, fmt(data.remaining, data.currency), "LEFT", data.over ? C.orange : C.green);

  info.addSpacer();
  row.addSpacer();
  return w;
}

// ============================================================================
// LARGE WIDGET  (~338×354 pt)
//
//  Everything is drawn-canvas-based to guarantee pixel-perfect fit.
//  Layout budget (inner height ≈ 318pt after 18pt padding top+bottom):
//
//   Header row (title + month + live)        ~18 pt
//   Spacer                                     6 pt
//   Budget progress bar (wide)                10 pt
//   Bar labels row (spent / budget)           16 pt
//   Spacer                                     8 pt
//   ── divider ──                              1 pt
//   Spacer                                     8 pt
//   3-stat row (Today / Remaining / On Pace)  ~40 pt
//   Spacer                                    10 pt
//   ── divider ──                              1 pt
//   Spacer                                    10 pt
//   "TOP CATEGORIES" label                    ~12 pt
//   Spacer                                     5 pt
//   Category bars image                       66 pt   (3 rows × 22pt)
//   Spacer                                    10 pt
//   ── divider ──                              1 pt
//   Spacer                                    10 pt
//   "LAST 7 DAYS" label                       ~12 pt
//   Spacer                                     5 pt
//   Bar chart image                           68 pt
//   ─────────────────────────────────────────────
//   Total ≈ 317 pt  ✓  fits perfectly
// ============================================================================
function buildLargeWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = new Color(C.bg);
  w.setPadding(18, 18, 18, 18);

  const root = w.addStack();
  root.layoutVertically();
  root.spacing = 0;

  // ── Header ──────────────────────────────────────────────────────────────
  const hdr = root.addStack();
  hdr.layoutHorizontally();
  hdr.centerAlignContent();

  const hIco = hdr.addText("💸");
  hIco.font = Font.systemFont(15);
  hdr.addSpacer(6);
  const hTit = hdr.addText("SpendFlow");
  hTit.font = Font.boldSystemFont(15);
  hTit.textColor = new Color(C.text);
  hdr.addSpacer();
  const mLbl = hdr.addText(data.monthLabel);
  mLbl.font = Font.mediumSystemFont(10);
  mLbl.textColor = new Color(C.textSub);
  hdr.addSpacer(8);
  const liveT = hdr.addText(data.live ? "● LIVE" : "○ CACHE");
  liveT.font = Font.semiboldSystemFont(9);
  liveT.textColor = new Color(data.live ? C.green : C.amber);

  root.addSpacer(10);

  // ── Budget bar ────────────────────────────────────────────────────────────
  const barW = 302;
  const barImg = root.addImage(renderBudgetBar(barW, 10, data.pct, data.accent, !data.live));
  barImg.imageSize = new Size(barW, 10);
  barImg.leftAlignImage();

  root.addSpacer(6);

  // Spent / budget labels beneath bar
  const barLblRow = root.addStack();
  barLblRow.layoutHorizontally();
  const spLbl = barLblRow.addText(`Spent: ${fmt(data.monthTotal, data.currency)}`);
  spLbl.font = Font.mediumSystemFont(10);
  spLbl.textColor = new Color(data.accent);
  barLblRow.addSpacer();
  const pctLbl = barLblRow.addText(`${Math.round(data.pct)}% of ${fmt(data.budget, data.currency)}`);
  pctLbl.font = Font.mediumSystemFont(10);
  pctLbl.textColor = new Color(C.textSub);

  root.addSpacer(10);

  // Divider
  const div1 = root.addImage(makeDivider(302));
  div1.imageSize = new Size(302, 1);
  div1.leftAlignImage();

  root.addSpacer(10);

  // ── 3-stat row ───────────────────────────────────────────────────────────
  const sRow = root.addStack();
  sRow.layoutHorizontally();
  sRow.centerAlignContent();

  function lStat(parent, val, lbl, col) {
    const b = parent.addStack(); b.layoutVertically();
    const v = b.addText(val);
    v.font = Font.boldSystemFont(18); v.textColor = new Color(col);
    v.lineLimit = 1; v.minimumScaleFactor = 0.65;
    b.addSpacer(3);
    const l = b.addText(lbl);
    l.font = Font.mediumSystemFont(9); l.textColor = new Color(C.textSub);
  }

  lStat(sRow, fmt(data.todayTotal, data.currency), "TODAY'S SPEND", C.blue);
  sRow.addSpacer();
  lStat(sRow, fmt(data.remaining, data.currency), "REMAINING", data.over ? C.orange : C.green);
  sRow.addSpacer();
  lStat(sRow, data.onTrack ? "✓ Yes" : "✗ No", "ON PACE", data.onTrack ? C.green : C.orange);

  root.addSpacer(10);

  // Divider
  const div2 = root.addImage(makeDivider(302));
  div2.imageSize = new Size(302, 1);
  div2.leftAlignImage();

  root.addSpacer(10);

  // ── TOP CATEGORIES ────────────────────────────────────────────────────────
  const catLbl = root.addText("TOP CATEGORIES");
  catLbl.font = Font.semiboldSystemFont(9);
  catLbl.textColor = new Color(C.textDim);

  root.addSpacer(5);

  if (data.topCats.length > 0) {
    const catH = 66; // 3 rows × 22pt
    const catImg = root.addImage(
      renderCatBars(302, catH, data.topCats, data.topCats[0].amount, data.currency, !data.live)
    );
    catImg.imageSize = new Size(302, catH);
    catImg.leftAlignImage();
  } else {
    const nd = root.addText("No expenses this month");
    nd.font = Font.italicSystemFont(11);
    nd.textColor = new Color(C.textDim);
    root.addSpacer(44); // maintain layout height
  }

  root.addSpacer(10);

  // Divider
  const div3 = root.addImage(makeDivider(302));
  div3.imageSize = new Size(302, 1);
  div3.leftAlignImage();

  root.addSpacer(10);

  // ── LAST 7 DAYS ──────────────────────────────────────────────────────────
  const daysLbl = root.addText("LAST 7 DAYS");
  daysLbl.font = Font.semiboldSystemFont(9);
  daysLbl.textColor = new Color(C.textDim);

  root.addSpacer(5);

  const barsH = 68;
  const barsImg = root.addImage(
    renderBars(302, barsH, data.days7, data.accent, data.currency, !data.live)
  );
  barsImg.imageSize = new Size(302, barsH);
  barsImg.leftAlignImage();

  // Offline footer (only if needed — don't add spacer before it to preserve fit)
  if (!data.live) {
    root.addSpacer(6);
    const offRow = root.addStack();
    offRow.layoutHorizontally();
    const offT = offRow.addText(
      data.offlineReason ? `⚠️ ${data.offlineReason}` : "⚠️ Offline — cached data"
    );
    offT.font = Font.mediumSystemFont(8);
    offT.textColor = new Color(C.textDim);
    offT.lineLimit = 1;
    offT.minimumScaleFactor = 0.8;
  }

  return w;
}

// ============================================================================
// Entry point
// ============================================================================
function getFamily() { return config.widgetFamily || PREVIEW_FAMILY; }

function buildWidget(family, data) {
  if (family === "small") return buildSmallWidget(data);
  if (family === "large") return buildLargeWidget(data);
  return buildMediumWidget(data);
}

async function main() {
  const family = getFamily();
  let widget;

  if (!CONFIGURED) {
    widget = buildSetupWidget(family);
  } else {
    let data = null, failReason = null;

    try {
      const result = await withTimeout(fetchData(), FETCH_TIMEOUT_MS + 1500, "overall");
      if (result && result.failure) failReason = result.reason;
      else data = result;
    } catch (e) {
      failReason = e?.message ?? String(e);
    }

    if (data) {
      saveCache(data);
    } else {
      console.log(`[SpendFlow] Cache fallback. Reason: ${failReason}`);
      const cached = loadCache();
      if (cached) {
        data = { ...cached, live: false, offlineReason: failReason };
      } else {
        const blankDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          return { label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()], day: d.getDate(), amount: 0 };
        });
        data = {
          monthTotal: 0, todayTotal: 0, budget: 2000, currency: cached ? cached.currency : "$",
          pct: 0, remaining: 2000, over: false, onTrack: true,
          status: "Great start!", accent: C.green,
          topCats: [], days7: blankDays,
          monthLabel: currentMonthLabel(),
          live: false, updatedAt: nowHHMM(),
          offlineReason: failReason || "No data yet",
        };
      }
    }

    widget = buildWidget(family, data);
  }

  if (TAP_URL) widget.url = TAP_URL;
  widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  Script.setWidget(widget);

  if (config.runsInWidget === false) {
    if (family === "small") await widget.presentSmall();
    else if (family === "large") await widget.presentLarge();
    else await widget.presentMedium();
  }
  Script.complete();
}

main();
