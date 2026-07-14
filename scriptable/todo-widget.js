// ============================================================================
//  TodoFlow — iPhone Widget for the Scriptable App
// ============================================================================
//
//  Schema used:
//  ┌─────────────────────────────────────────────────────────┐
//  │  todo_entries                                            │
//  │    id            uuid                                    │
//  │    title         text                                    │
//  │    description   text                                    │
//  │    is_completed  boolean                                 │
//  │    priority      text ('low', 'medium', 'high')          │
//  │    due_date      timestamptz                             │
//  │    created_at    timestamptz                             │
//  └─────────────────────────────────────────────────────────┘
// ============================================================================

// ============================ CONFIGURATION =================================
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const SUPABASE_SERVICE_ROLE_KEY = "";

const TAP_URL = "";          // optional deep-link when the widget is tapped
const FETCH_TIMEOUT_MS = 8000;        // per-request timeout before falling back to cache

// Only used when you tap ▶️ inside the Scriptable app (manual preview).
const PREVIEW_FAMILY = "medium";
// ============================================================================

const API_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const CONFIGURED = Boolean(SUPABASE_URL && API_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function priorityColor(priority) {
  if (priority === "high") return "#f43f5e";
  if (priority === "medium") return "#f59e0b";
  return "#3b82f6";
}

function formatNowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Timeout wrapper
// ---------------------------------------------------------------------------
function withTimeout(promise, ms, label) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = Timer.schedule(ms, false, () =>
      reject(new Error("timeout:" + label))
    );
  });
  return Promise.race([promise, timeout]).then(
    (value) => { if (timer) timer.invalidate(); return value; },
    (err) => { if (timer) timer.invalidate(); throw err; }
  );
}

// ---------------------------------------------------------------------------
// Supabase REST helper
// ---------------------------------------------------------------------------
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

  if (typeof status === "number" && (status < 200 || status >= 300)) {
    throw new Error(`HTTP ${status} on ${path}: ${text.slice(0, 140)}`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Bad JSON from ${path}: ${text.slice(0, 140)}`);
  }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
const fm = FileManager.local();
const CACHE_PATH = fm.joinPath(fm.cacheDirectory(), "todoflow_widget_cache.json");

function loadCache() {
  try {
    if (!fm.fileExists(CACHE_PATH)) return null;
    const txt = fm.readString(CACHE_PATH);
    return txt ? JSON.parse(txt) : null;
  } catch (e) {
    return null;
  }
}

function saveCache(data) {
  try {
    fm.writeString(CACHE_PATH, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function fetchData() {
  const path = "todo_entries?is_completed=eq.false&select=title,priority,due_date,created_at";

  const result = await withTimeout(
    supabaseGet(path),
    FETCH_TIMEOUT_MS,
    "todo_entries"
  )
    .then((rows) => ({ ok: true, rows }))
    .catch((err) => ({ ok: false, error: err && err.message ? err.message : String(err) }));

  if (!result.ok) {
    return {
      failure: true,
      reason: result.error || "Unknown network error",
    };
  }

  // Sort by priority then by created_at
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  let todos = [];
  
  if (Array.isArray(result.rows)) {
    todos = result.rows.sort((a, b) => {
      const wA = priorityWeight[a.priority] || 0;
      const wB = priorityWeight[b.priority] || 0;
      if (wA !== wB) return wB - wA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return {
    todos,
    live: true,
    updatedAt: formatNowHHMM(),
  };
}

// ---------------------------------------------------------------------------
// Widget builders
// ---------------------------------------------------------------------------
function buildSmallWidget(data) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#0f172a");
  widget.setPadding(14, 14, 14, 14);

  const header = widget.addStack();
  header.centerAlignContent();
  
  const icon = header.addText("✓");
  icon.font = Font.boldSystemFont(14);
  icon.textColor = new Color("#6366f1");
  
  header.addSpacer(4);
  
  const title = header.addText("Tasks");
  title.font = Font.boldSystemFont(14);
  title.textColor = Color.white();
  
  header.addSpacer();
  
  const count = header.addText(String(data.todos.length));
  count.font = Font.boldSystemFont(14);
  count.textColor = new Color("#94a3b8");

  widget.addSpacer(8);

  const maxItems = 3;
  const itemsToShow = data.todos.slice(0, maxItems);

  if (itemsToShow.length === 0) {
    widget.addSpacer();
    const empty = widget.addText("All caught up!");
    empty.font = Font.mediumSystemFont(12);
    empty.textColor = new Color("#64748b");
    empty.centerAlignText();
    widget.addSpacer();
  } else {
    itemsToShow.forEach(todo => {
      const row = widget.addStack();
      row.centerAlignContent();
      row.setPadding(4, 0, 4, 0);

      const dot = row.addText("●");
      dot.font = Font.systemFont(8);
      dot.textColor = new Color(priorityColor(todo.priority));
      
      row.addSpacer(6);
      
      const taskTitle = row.addText(todo.title);
      taskTitle.font = Font.mediumSystemFont(12);
      taskTitle.textColor = new Color("#e2e8f0");
      taskTitle.lineLimit = 1;
    });
    
    if (data.todos.length > maxItems) {
      widget.addSpacer(4);
      const more = widget.addText(`+${data.todos.length - maxItems} more`);
      more.font = Font.systemFont(10);
      more.textColor = new Color("#64748b");
    }
  }

  widget.addSpacer();
  
  if (!data.live) {
    const offline = widget.addText("Offline");
    offline.font = Font.systemFont(8);
    offline.textColor = new Color("#ef4444");
  }

  return widget;
}

function buildMediumWidget(data) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#0f172a");
  widget.setPadding(16, 16, 16, 16);

  const main = widget.addStack();
  main.layoutHorizontally();

  // Left Column
  const leftCol = main.addStack();
  leftCol.layoutVertically();
  
  const header = leftCol.addStack();
  header.centerAlignContent();
  
  const iconBox = header.addStack();
  iconBox.backgroundColor = new Color("#6366f1", 0.2);
  iconBox.cornerRadius = 6;
  iconBox.setPadding(4, 6, 4, 6);
  const icon = iconBox.addText("✓");
  icon.font = Font.boldSystemFont(12);
  icon.textColor = new Color("#818cf8");
  
  header.addSpacer(8);
  
  const title = header.addText("Active Tasks");
  title.font = Font.boldSystemFont(16);
  title.textColor = Color.white();
  
  leftCol.addSpacer();
  
  const count = leftCol.addText(String(data.todos.length));
  count.font = Font.boldSystemFont(32);
  count.textColor = Color.white();
  
  const subtitle = leftCol.addText("Pending");
  subtitle.font = Font.systemFont(12);
  subtitle.textColor = new Color("#94a3b8");
  
  leftCol.addSpacer();
  
  if (!data.live) {
    const offline = leftCol.addText("Offline mode");
    offline.font = Font.systemFont(10);
    offline.textColor = new Color("#ef4444");
  }

  main.addSpacer(16);

  // Right Column (Tasks)
  const rightCol = main.addStack();
  rightCol.layoutVertically();
  rightCol.backgroundColor = new Color("#1e293b", 0.5);
  rightCol.cornerRadius = 12;
  rightCol.setPadding(12, 12, 12, 12);

  const maxItems = 3;
  const itemsToShow = data.todos.slice(0, maxItems);

  if (itemsToShow.length === 0) {
    rightCol.addSpacer();
    const empty = rightCol.addText("No pending tasks! 🎉");
    empty.font = Font.mediumSystemFont(13);
    empty.textColor = new Color("#94a3b8");
    empty.centerAlignText();
    rightCol.addSpacer();
  } else {
    itemsToShow.forEach((todo, index) => {
      if (index > 0) {
        rightCol.addSpacer(8);
      }
      
      const row = rightCol.addStack();
      row.layoutHorizontally();
      
      const line = row.addStack();
      line.backgroundColor = new Color(priorityColor(todo.priority));
      line.size = new Size(3, 16);
      line.cornerRadius = 1.5;
      
      row.addSpacer(8);
      
      const textStack = row.addStack();
      textStack.layoutVertically();
      
      const taskTitle = textStack.addText(todo.title);
      taskTitle.font = Font.semiboldSystemFont(13);
      taskTitle.textColor = new Color("#f1f5f9");
      taskTitle.lineLimit = 1;
      
      if (todo.due_date) {
        const dateStr = new Date(todo.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const date = textStack.addText(`Due: ${dateStr}`);
        date.font = Font.systemFont(10);
        date.textColor = new Color("#64748b");
      }
    });
    
    if (data.todos.length > maxItems) {
      rightCol.addSpacer(8);
      const more = rightCol.addText(`+${data.todos.length - maxItems} more tasks`);
      more.font = Font.systemFont(11);
      more.textColor = new Color("#64748b");
    }
  }

  return widget;
}

function buildLargeWidget(data) {
  // Can be similar to medium but with more items
  return buildMediumWidget(data); 
}

function buildSetupWidget(family) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#0f172a");
  widget.setPadding(16, 16, 16, 16);

  const stack = widget.addStack();
  stack.layoutVertically();
  stack.addSpacer();

  const title = stack.addText("✓ TodoFlow");
  title.font = Font.boldSystemFont(family === "small" ? 16 : 20);
  title.textColor = Color.white();
  title.centerAlignText();

  stack.addSpacer(6);

  const subtitle = stack.addText(
    "Add your Supabase URL & key\ninside the script's CONFIGURATION block."
  );
  subtitle.font = Font.regularSystemFont(family === "small" ? 11 : 13);
  subtitle.textColor = new Color("#94a3b8");
  subtitle.centerAlignText();

  stack.addSpacer();
  return widget;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
function getFamily() {
  return config.widgetFamily || PREVIEW_FAMILY;
}

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
    let data = null;
    let failureReason = null;

    try {
      const result = await withTimeout(fetchData(), FETCH_TIMEOUT_MS + 1500, "overall");
      if (result && result.failure) {
        failureReason = result.reason;
      } else {
        data = result;
      }
    } catch (e) {
      failureReason = e && e.message ? e.message : String(e);
    }

    if (data) {
      saveCache(data);
    } else {
      console.log(`[TodoFlow] Using cache/defaults. Reason: ${failureReason}`);
      const cached = loadCache();
      data = cached
        ? { ...cached, live: false, offlineReason: failureReason }
        : {
          todos: [],
          live: false,
          updatedAt: formatNowHHMM(),
          offlineReason: failureReason || "No data yet",
        };
    }

    widget = buildWidget(family, data);
  }

  if (TAP_URL) widget.url = TAP_URL;
  // Refresh every 30 minutes
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
