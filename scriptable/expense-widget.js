/**
 * Trackr Expense Widget — Scriptable iPhone Widget
 * Displays daily spend summary and category highlights.
 * Connects to Supabase for real data.
 * 
 * Setup:
 * 1. Copy this script into the Scriptable app
 * 2. Add a Scriptable widget to your home screen
 * 3. Select this script for the widget
 * 4. Configure SUPABASE_URL and SUPABASE_ANON_KEY below
 * 5. Store your auth token: Keychain.set("trackr-auth-token", "your-jwt")
 */

// ============ CONFIGURATION ============
const SUPABASE_URL = "https://your-project.supabase.co"; // Your Supabase URL
const SUPABASE_ANON_KEY = "eyJ..."; // Your Supabase anon key
const MONTHLY_BUDGET = 2000; // Fallback
const WIDGET_BG = "#0f172a";
const ACCENT_COLOR = "#ec4899";
const ACCENT_LIGHT = "#f9a8d4";
const TEXT_PRIMARY = "#f1f5f9";
const TEXT_SECONDARY = "#94a3b8";
const TEXT_TERTIARY = "#64748b";

const CATEGORY_COLORS = {
  "Food": "#f59e0b",
  "Transport": "#3b82f6",
  "Shopping": "#ec4899",
  "Entertainment": "#8b5cf6",
  "Bills": "#ef4444",
  "Health": "#22c55e",
  "Education": "#06b6d4",
  "Subscriptions": "#f97316",
};

// ============ SUPABASE API HELPERS ============
function getAuthHeaders() {
  const token = Keychain.get("trackr-auth-token");
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

async function fetchFromSupabase(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const req = new Request(url);
  req.headers = getAuthHeaders();
  req.method = "GET";
  try {
    return await req.loadJSON();
  } catch (e) {
    console.error(`Failed to fetch from ${table}:`, e);
    return null;
  }
}

// ============ DATA FETCHING ============
async function getExpenseData() {
  const now = new Date();
  const todayStart = now.toISOString().split("T")[0] + "T00:00:00";
  const currentMonth = now.toISOString().substring(0, 7);
  
  // Fetch today's expenses
  const todayEntries = await fetchFromSupabase(
    "expense_entries",
    `?select=amount,category,description,expense_type&order=created_at.desc&created_at=gte.${todayStart}`
  );
  
  // Fetch monthly expenses for category breakdown
  const monthEntries = await fetchFromSupabase(
    "expense_entries",
    `?select=amount,category,expense_type&created_at=gte.${currentMonth}-01T00:00:00`
  );
  
  // Fetch settings
  const settings = await fetchFromSupabase(
    "user_settings",
    "?select=monthly_budget"
  );
  
  const budget = settings?.[0]?.monthly_budget || MONTHLY_BUDGET;
  
  if (todayEntries && monthEntries) {
    const todaySpend = todayEntries.reduce((s, e) => s + Number(e.amount), 0);
    const monthSpend = monthEntries.reduce((s, e) => s + Number(e.amount), 0);
    const needsAmount = monthEntries.filter(e => e.expense_type === "need").reduce((s, e) => s + Number(e.amount), 0);
    const wantsAmount = monthEntries.filter(e => e.expense_type === "want").reduce((s, e) => s + Number(e.amount), 0);
    
    // Category breakdown
    const catMap = {};
    monthEntries.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
    });
    const categories = Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
    
    const topCategory = categories[0] || { name: "None", amount: 0 };
    
    return {
      todaySpend,
      todayTransactions: todayEntries.length,
      monthSpend,
      monthlyBudget: budget,
      budgetPercent: Math.min(Math.round((monthSpend / budget) * 100), 100),
      topCategory,
      categories,
      needsAmount,
      wantsAmount,
    };
  }
  
  return getMockExpenseData();
}

// ============ MOCK DATA (Fallback) ============
function getMockExpenseData() {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const todaySpend = Math.round((Math.random() * 60 + 15) * 100) / 100;
  const monthSpend = Math.round((MONTHLY_BUDGET * (dayOfMonth / daysInMonth) * (0.6 + Math.random() * 0.6)) * 100) / 100;
  
  const categories = [
    { name: "Food", amount: Math.round(todaySpend * 0.4 * 100) / 100 },
    { name: "Transport", amount: Math.round(todaySpend * 0.25 * 100) / 100 },
    { name: "Shopping", amount: Math.round(todaySpend * 0.2 * 100) / 100 },
    { name: "Entertainment", amount: Math.round(todaySpend * 0.15 * 100) / 100 },
  ];
  
  const topCategory = categories.reduce((a, b) => a.amount > b.amount ? a : b);
  
  return {
    todaySpend,
    todayTransactions: Math.floor(Math.random() * 6) + 1,
    monthSpend,
    monthlyBudget: MONTHLY_BUDGET,
    budgetPercent: Math.min(Math.round((monthSpend / MONTHLY_BUDGET) * 100), 100),
    topCategory,
    categories,
    needsAmount: Math.round(todaySpend * 0.65 * 100) / 100,
    wantsAmount: Math.round(todaySpend * 0.35 * 100) / 100,
  };
}

// ============ HELPER: Draw mini bar chart ============
function drawCategoryBars(categories, width, height) {
  const drawContext = new DrawContext();
  drawContext.size = new Size(width, height);
  drawContext.opaque = false;
  
  const maxAmount = Math.max(...categories.map(c => c.amount), 1);
  const barHeight = 6;
  const barGap = 4;
  const labelWidth = 60;
  const valueWidth = 35;
  const barMaxWidth = width - labelWidth - valueWidth - 8;
  
  categories.forEach((cat, i) => {
    const y = i * (barHeight + barGap);
    
    drawContext.setFont(Font.mediumSystemFont(8));
    drawContext.setTextColor(new Color(TEXT_SECONDARY));
    drawContext.drawTextInRect(cat.name, new Rect(0, y - 1, labelWidth, barHeight + 2));
    
    drawContext.setFillColor(new Color(TEXT_TERTIARY, 0.1));
    const bgRect = new Rect(labelWidth, y + 1, barMaxWidth, barHeight - 2);
    drawContext.fill(bgRect);
    
    const barWidth = (cat.amount / maxAmount) * barMaxWidth;
    const color = CATEGORY_COLORS[cat.name] || ACCENT_COLOR;
    drawContext.setFillColor(new Color(color));
    const fillRect = new Rect(labelWidth, y + 1, barWidth, barHeight - 2);
    drawContext.fillRoundedRect(fillRect, 2);
    
    drawContext.setFont(Font.mediumSystemFont(8));
    drawContext.setTextColor(new Color(TEXT_PRIMARY));
    drawContext.drawTextInRect(`$${cat.amount.toFixed(0)}`, new Rect(width - valueWidth, y - 1, valueWidth, barHeight + 2));
  });
  
  return drawContext.getImage();
}

// ============ WIDGET RENDERING ============
async function createExpenseWidget() {
  const data = await getExpenseData();
  
  const widget = new ListWidget();
  widget.backgroundColor = new Color(WIDGET_BG);
  widget.setPadding(16, 16, 16, 16);
  widget.cornerRadius = 20;

  // Header
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  
  const iconStack = headerStack.addStack();
  iconStack.size = new Size(28, 28);
  iconStack.cornerRadius = 8;
  iconStack.backgroundColor = new Color(ACCENT_COLOR, 0.2);
  iconStack.centerAlignContent();
  const icon = iconStack.addText("💰");
  icon.font = Font.mediumSystemFont(14);
  
  headerStack.addSpacer(8);
  const title = headerStack.addText("Expenses");
  title.font = Font.boldSystemFont(14);
  title.textColor = new Color(TEXT_PRIMARY);
  
  headerStack.addSpacer();
  const dateText = headerStack.addText(new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
  dateText.font = Font.mediumSystemFont(9);
  dateText.textColor = new Color(TEXT_TERTIARY);

  widget.addSpacer(10);

  // Today's Spend
  const todayStack = widget.addStack();
  todayStack.layoutHorizontally();
  todayStack.centerAlignContent();
  const todayLabel = todayStack.addText("Today");
  todayLabel.font = Font.mediumSystemFont(11);
  todayLabel.textColor = new Color(TEXT_SECONDARY);
  todayStack.addSpacer();
  const txCount = todayStack.addText(`${data.todayTransactions} txns`);
  txCount.font = Font.mediumSystemFont(9);
  txCount.textColor = new Color(TEXT_TERTIARY);

  const todayAmount = widget.addText(`$${data.todaySpend.toFixed(2)}`);
  todayAmount.font = Font.boldSystemFont(28);
  todayAmount.textColor = new Color(TEXT_PRIMARY);

  widget.addSpacer(6);

  // Needs vs Wants
  const nwStack = widget.addStack();
  nwStack.layoutHorizontally();
  nwStack.centerAlignContent();
  nwStack.cornerRadius = 8;
  nwStack.backgroundColor = new Color(TEXT_TERTIARY, 0.05);
  nwStack.setPadding(6, 10, 6, 10);
  const needsLabel = nwStack.addText(`▼ Needs $${data.needsAmount.toFixed(0)}`);
  needsLabel.font = Font.mediumSystemFont(9);
  needsLabel.textColor = new Color("#22c55e");
  nwStack.addSpacer();
  const wantsLabel = nwStack.addText(`▲ Wants $${data.wantsAmount.toFixed(0)}`);
  wantsLabel.font = Font.mediumSystemFont(9);
  wantsLabel.textColor = new Color("#f59e0b");

  widget.addSpacer(8);

  // Category bars
  const barImage = drawCategoryBars(data.categories, 310, 38);
  const barWidget = widget.addImage(barImage);
  barWidget.imageSize = new Size(310, 38);

  widget.addSpacer(8);

  // Monthly Budget
  const budgetLabelStack = widget.addStack();
  budgetLabelStack.layoutHorizontally();
  const budgetLabel = budgetLabelStack.addText("Monthly Budget");
  budgetLabel.font = Font.mediumSystemFont(10);
  budgetLabel.textColor = new Color(TEXT_SECONDARY);
  budgetLabelStack.addSpacer();
  const budgetPct = budgetLabelStack.addText(`${data.budgetPercent}%`);
  budgetPct.font = Font.boldSystemFont(10);
  budgetPct.textColor = new Color(data.budgetPercent > 80 ? "#ef4444" : ACCENT_LIGHT);

  // Budget bar
  const budgetBarStack = widget.addStack();
  budgetBarStack.layoutHorizontally();
  budgetBarStack.size = new Size(310, 6);
  budgetBarStack.cornerRadius = 3;
  budgetBarStack.backgroundColor = new Color(TEXT_TERTIARY, 0.1);
  const filledStack = budgetBarStack.addStack();
  const fillPercent = Math.min(data.budgetPercent, 100);
  filledStack.size = new Size(Math.round(310 * fillPercent / 100), 6);
  filledStack.cornerRadius = 3;
  filledStack.backgroundColor = new Color(data.budgetPercent > 80 ? "#ef4444" : ACCENT_COLOR);

  widget.addSpacer(4);

  // Budget detail
  const budgetDetailStack = widget.addStack();
  budgetDetailStack.layoutHorizontally();
  const spent = budgetDetailStack.addText(`$${data.monthSpend.toFixed(0)} spent`);
  spent.font = Font.mediumSystemFont(9);
  spent.textColor = new Color(TEXT_TERTIARY);
  budgetDetailStack.addSpacer();
  const remaining = budgetDetailStack.addText(`$${Math.max(data.monthlyBudget - data.monthSpend, 0).toFixed(0)} left`);
  remaining.font = Font.mediumSystemFont(9);
  remaining.textColor = new Color(TEXT_TERTIARY);

  // Top category
  widget.addSpacer(6);
  const topCatStack = widget.addStack();
  topCatStack.layoutHorizontally();
  topCatStack.centerAlignContent();
  topCatStack.cornerRadius = 8;
  topCatStack.setPadding(6, 10, 6, 10);
  const topCatColor = CATEGORY_COLORS[data.topCategory.name] || ACCENT_COLOR;
  topCatStack.backgroundColor = new Color(topCatColor, 0.08);
  const topDot = topCatStack.addStack();
  topDot.size = new Size(6, 6);
  topDot.cornerRadius = 3;
  topDot.backgroundColor = new Color(topCatColor);
  topCatStack.addSpacer(6);
  const topCatLabel = topCatStack.addText(`Top: ${data.topCategory.name} — $${data.topCategory.amount.toFixed(2)}`);
  topCatLabel.font = Font.mediumSystemFont(9);
  topCatLabel.textColor = new Color(topCatColor);

  widget.url = "trackr://expenses";
  return widget;
}

// ============ WIDGET PREVIEW ============
if (config.runsInWidget) {
  const widget = await createExpenseWidget();
  Script.setWidget(widget);
} else {
  const widget = await createExpenseWidget();
  widget.presentMedium();
}

Script.complete();
