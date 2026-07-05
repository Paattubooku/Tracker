/**
 * Trackr Water Widget — Scriptable iPhone Widget
 * Displays hydration progress with a visual ring and daily stats.
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
const DAILY_GOAL_ML = 2500; // Fallback if settings not loaded
const WIDGET_BG = "#0f172a";
const ACCENT_COLOR = "#06b6d4";
const ACCENT_LIGHT = "#67e8f9";
const TEXT_PRIMARY = "#f1f5f9";
const TEXT_SECONDARY = "#94a3b8";
const TEXT_TERTIARY = "#64748b";

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
async function getWaterData() {
  const now = new Date();
  const todayStart = now.toISOString().split("T")[0] + "T00:00:00";
  
  // Fetch today's water entries
  const entries = await fetchFromSupabase(
    "water_entries",
    `?select=amount,entry_type,created_at&order=created_at.desc&created_at=gte.${todayStart}`
  );
  
  // Fetch user settings
  const settings = await fetchFromSupabase(
    "user_settings",
    "?select=daily_water_goal,reminder_interval_minutes"
  );
  
  const goal = settings?.[0]?.daily_water_goal || DAILY_GOAL_ML;
  
  if (entries && entries.length > 0) {
    const todayTotal = entries.reduce((sum, e) => sum + e.amount, 0);
    const lastEntry = new Date(entries[0].created_at);
    const lastEntryStr = `${lastEntry.getHours()}:${String(lastEntry.getMinutes()).padStart(2, "0")}`;
    
    // Calculate streak
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = d.toISOString().split("T")[0];
      const dayEntries = await fetchFromSupabase(
        "water_entries",
        `?select=amount&created_at=gte.${dateStr}T00:00:00&created_at=lt.${dateStr}T23:59:59`
      );
      const dayTotal = dayEntries?.reduce((s, e) => s + e.amount, 0) || 0;
      if (dayTotal >= goal) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        if (i === 0) { d.setDate(d.getDate() - 1); continue; }
        break;
      }
    }
    
    return {
      todayTotal,
      dailyGoal: goal,
      entries: entries.length,
      streak,
      weeklyAvg: todayTotal, // Simplified; fetch weekly data for accurate avg
      lastEntry: lastEntryStr,
    };
  }
  
  // Fallback to mock data if API fails
  return getMockWaterData();
}

// ============ MOCK DATA (Fallback) ============
function getMockWaterData() {
  const now = new Date();
  const hour = now.getHours();
  const progressFactor = Math.min(hour / 18, 1);
  const totalMl = Math.round(DAILY_GOAL_ML * progressFactor * (0.7 + Math.random() * 0.5));
  
  return {
    todayTotal: Math.min(totalMl, DAILY_GOAL_ML + 500),
    dailyGoal: DAILY_GOAL_ML,
    entries: Math.floor(Math.random() * 5) + 3,
    streak: Math.floor(Math.random() * 7) + 1,
    weeklyAvg: Math.round(DAILY_GOAL_ML * (0.75 + Math.random() * 0.3)),
    lastEntry: `${hour - 1}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
  };
}

// ============ WIDGET RENDERING ============
async function createWaterWidget() {
  const data = await getWaterData();
  const percent = Math.min((data.todayTotal / data.dailyGoal) * 100, 100);
  const remaining = Math.max(data.dailyGoal - data.todayTotal, 0);
  const isGoalReached = percent >= 100;

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
  const icon = iconStack.addText("💧");
  icon.font = Font.mediumSystemFont(14);
  
  headerStack.addSpacer(8);
  const title = headerStack.addText("Water");
  title.font = Font.boldSystemFont(14);
  title.textColor = new Color(TEXT_PRIMARY);
  
  headerStack.addSpacer();
  const streakText = headerStack.addText(`🔥 ${data.streak}`);
  streakText.font = Font.mediumSystemFont(11);
  streakText.textColor = new Color("#f59e0b");

  widget.addSpacer(12);

  // Progress Ring
  const circleSize = 90;
  const circleStack = widget.addStack();
  circleStack.size = new Size(circleSize, circleSize);
  circleStack.centerAlignContent();

  const drawContext = new DrawContext();
  drawContext.size = new Size(circleSize, circleSize);
  drawContext.opaque = false;
  
  const center = new Point(circleSize / 2, circleSize / 2);
  const lineWidth = 8;
  const radius = (circleSize - lineWidth) / 2;
  
  // Background ring
  drawContext.setStrokeColor(new Color(TEXT_TERTIARY, 0.15));
  drawContext.setLineWidth(lineWidth);
  drawContext.setLineCap("round");
  const bgPath = new Path();
  bgPath.addArc(center, radius, 0, 360, false);
  drawContext.addPath(bgPath);
  drawContext.strokePath();
  
  // Progress ring
  if (percent > 0) {
    const progressColor = isGoalReached ? new Color("#22c55e") : new Color(ACCENT_COLOR);
    drawContext.setStrokeColor(progressColor);
    drawContext.setLineWidth(lineWidth);
    drawContext.setLineCap("round");
    const progressPath = new Path();
    const startAngle = -90;
    const endAngle = startAngle + (percent / 100) * 360;
    progressPath.addArc(center, radius, startAngle, endAngle, false);
    drawContext.addPath(progressPath);
    drawContext.strokePath();
  }
  
  // Center text
  const amountText = `${(data.todayTotal / 1000).toFixed(1)}L`;
  drawContext.setFont(Font.boldSystemFont(18));
  drawContext.setTextColor(new Color(TEXT_PRIMARY));
  const amountSize = drawContext.measureText(amountText);
  drawContext.drawTextInRect(amountText, new Rect(
    (circleSize - amountSize.width) / 2,
    (circleSize - amountSize.height) / 2 - 6,
    amountSize.width, amountSize.height
  ));
  
  const percentText = `${Math.round(percent)}%`;
  drawContext.setFont(Font.mediumSystemFont(10));
  drawContext.setTextColor(new Color(ACCENT_LIGHT));
  const percentSize = drawContext.measureText(percentText);
  drawContext.drawTextInRect(percentText, new Rect(
    (circleSize - percentSize.width) / 2,
    (circleSize + amountSize.height) / 2 - 2,
    percentSize.width, percentSize.height
  ));
  
  const circleImage = drawContext.getImage();
  const circleWidgetImage = circleStack.addImage(circleImage);
  circleWidgetImage.imageSize = new Size(circleSize, circleSize);

  widget.addSpacer(8);

  // Goal info
  const goalStack = widget.addStack();
  goalStack.layoutHorizontally();
  goalStack.centerAlignContent();
  
  const goalLabel = goalStack.addText(isGoalReached ? "✅ Goal reached!" : `Need ${(remaining / 1000).toFixed(1)}L more`);
  goalLabel.font = Font.mediumSystemFont(12);
  goalLabel.textColor = new Color(isGoalReached ? "#22c55e" : TEXT_SECONDARY);

  widget.addSpacer(6);

  // Footer
  const footerStack = widget.addStack();
  footerStack.layoutHorizontally();
  footerStack.centerAlignContent();
  
  const lastEntry = footerStack.addText(`Last: ${data.lastEntry}`);
  lastEntry.font = Font.mediumSystemFont(9);
  lastEntry.textColor = new Color(TEXT_TERTIARY);
  
  footerStack.addSpacer();
  const entriesInfo = footerStack.addText(`${data.entries} drinks`);
  entriesInfo.font = Font.mediumSystemFont(9);
  entriesInfo.textColor = new Color(TEXT_TERTIARY);

  widget.url = "trackr://water";
  return widget;
}

// ============ WIDGET PREVIEW ============
if (config.runsInWidget) {
  const widget = await createWaterWidget();
  Script.setWidget(widget);
} else {
  const widget = await createWaterWidget();
  widget.presentMedium();
}

Script.complete();
