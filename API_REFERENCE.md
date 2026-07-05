# Trackr — Backend API Reference

## Supabase REST API (PostgREST)

Your Supabase project exposes a full REST API at:

```
https://YOUR_PROJECT_ID.supabase.co/rest/v1/
```

Every table in your database automatically becomes a REST endpoint. All responses are JSON.

---

## Authentication

Every request needs **two headers**:

| Header | Value |
|--------|-------|
| `apikey` | Your Supabase anon key |
| `Authorization` | `Bearer YOUR_SUPABASE_ANON_KEY` |

For write operations, also add:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Prefer` | `return=representation` (if you want the inserted row back) |

---

## Set Your Credentials

Replace these in all examples below:

```bash
export SUPABASE_URL="https://abcdefghijk.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Water Entries API

### Get All Water Entries

```bash
curl "$SUPABASE_URL/rest/v1/water_entries?order=created_at.desc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

**Response:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "amount": 250,
    "entry_type": "glass",
    "created_at": "2025-07-04T07:00:00+00:00"
  },
  {
    "id": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
    "amount": 500,
    "entry_type": "bottle",
    "created_at": "2025-07-04T09:30:00+00:00"
  }
]
```

### Get Today's Water Entries

```bash
curl "$SUPABASE_URL/rest/v1/water_entries?created_at=gte.2025-07-04T00:00:00&created_at=lt.2025-07-05T00:00:00&order=created_at.desc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Get Last 7 Days of Water Entries

```bash
curl "$SUPABASE_URL/rest/v1/water_entries?created_at=gte.2025-06-27T00:00:00&order=created_at.desc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Get Total Water Today (Sum)

PostgREST doesn't have a built-in SUM, but you can use the RPC function or just sum the results client-side. Here's using the `select` to get only the amount column:

```bash
curl "$SUPABASE_URL/rest/v1/water_entries?select=amount&created_at=gte.2025-07-04T00:00:00&created_at=lt.2025-07-05T00:00:00" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

**Response:**
```json
[
  { "amount": 250 },
  { "amount": 500 },
  { "amount": 200 }
]
```

Then sum: 250 + 500 + 200 = 950ml

### Add a Water Entry

```bash
curl -X POST "$SUPABASE_URL/rest/v1/water_entries" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"amount": 250, "entry_type": "glass"}'
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 250,
  "entry_type": "glass",
  "created_at": "2025-07-04T14:30:00.123456+00:00"
}
```

### Delete a Water Entry

```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/water_entries?id=eq.a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Delete All Water Entries (⚠️ Destructive)

```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/water_entries?id=not.eq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

---

## Expense Entries API

### Get All Expense Entries

```bash
curl "$SUPABASE_URL/rest/v1/expense_entries?order=created_at.desc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

**Response:**
```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "amount": 15.50,
    "category": "Food",
    "description": "Lunch at cafe",
    "created_at": "2025-07-04T12:30:00+00:00"
  },
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "amount": 45.99,
    "category": "Shopping",
    "description": "New headphones",
    "created_at": "2025-07-04T16:00:00+00:00"
  }
]
```

### Get Today's Expenses

```bash
curl "$SUPABASE_URL/rest/v1/expense_entries?created_at=gte.2025-07-04T00:00:00&created_at=lt.2025-07-05T00:00:00&order=created_at.desc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Get Expenses by Category

```bash
curl "$SUPABASE_URL/rest/v1/expense_entries?category=eq.Food&order=created_at.desc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Get Monthly Expenses

```bash
curl "$SUPABASE_URL/rest/v1/expense_entries?created_at=gte.2025-07-01T00:00:00&created_at=lt.2025-08-01T00:00:00&order=created_at.desc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Add an Expense Entry

```bash
curl -X POST "$SUPABASE_URL/rest/v1/expense_entries" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"amount": 12.50, "category": "Food", "description": "Coffee & pastry"}'
```

**Response:**
```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "amount": 12.50,
  "category": "Food",
  "description": "Coffee & pastry",
  "created_at": "2025-07-04T09:00:00.654321+00:00"
}
```

### Delete an Expense Entry

```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/expense_entries?id=eq.d4e5f6a7-b8c9-0123-defa-234567890123" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

---

## Settings API

### Get Current Settings

```bash
curl "$SUPABASE_URL/rest/v1/user_settings?id=eq.1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

**Response:**
```json
[
  {
    "id": 1,
    "daily_water_goal": 2500,
    "reminder_interval_minutes": 60,
    "monthly_budget": 2000.00,
    "currency": "$",
    "water_unit": "ml",
    "week_starts_on": "monday",
    "notifications_enabled": true,
    "created_at": "2025-07-01T00:00:00+00:00",
    "updated_at": "2025-07-04T14:00:00+00:00"
  }
]
```

### Update Settings

```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/user_settings?id=eq.1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"daily_water_goal": 3000, "monthly_budget": 2500, "currency": "€"}'
```

---

## RPC (Custom Function) API

### Get Monthly Category Breakdown

This calls the `get_monthly_category_breakdown` function defined in the schema:

```bash
curl "$SUPABASE_URL/rest/v1/rpc/get_monthly_category_breakdown" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -X POST
```

**Response:**
```json
[
  { "category": "Food",          "total": 450.50, "percentage": 35.2 },
  { "category": "Shopping",      "total": 320.00, "percentage": 25.0 },
  { "category": "Transport",     "total": 180.75, "percentage": 14.1 },
  { "category": "Entertainment", "total": 150.00, "percentage": 11.7 },
  { "category": "Bills",         "total": 120.00, "percentage": 9.4 },
  { "category": "Health",        "total": 60.00,  "percentage": 4.7 }
]
```

### Get Category Breakdown for a Specific Month

```bash
curl "$SUPABASE_URL/rest/v1/rpc/get_monthly_category_breakdown" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"p_month": "2025-06"}'
```

---

## PostgREST Query Cheatsheet

All filters go in the **URL query string** after `?`:

| Filter | Syntax | Example |
|--------|--------|---------|
| Equals | `col=eq.value` | `category=eq.Food` |
| Not equals | `col=neq.value` | `category=neq.Food` |
| Greater than | `col=gt.value` | `amount=gt.100` |
| Greater than or equal | `col=gte.value` | `created_at=gte.2025-07-01` |
| Less than | `col=lt.value` | `amount=lt.50` |
| Less than or equal | `col=lte.value` | `created_at=lte.2025-07-31` |
| Like (pattern) | `col=like.*pattern*` | `description=like.*coffee*` |
| ILike (case-insensitive) | `col=ilike.*pattern*` | `description=ilike.*Coffee*` |
| In (list) | `col=in.(v1,v2,v3)` | `category=in.(Food,Transport)` |
| Is null | `col=is.null` | `description=is.null` |
| Is not null | `col=is.not.null` | `description=is.not.null` |
| Order by | `order=col.asc` | `order=created_at.desc` |
| Limit rows | `limit=N` | `limit=10` |
| Select columns | `select=col1,col2` | `select=amount,category` |
| Count | `select=count` with `Prefer: count=exact` header | See below |

### Get Count of Today's Water Entries

```bash
curl "$SUPABASE_URL/rest/v1/water_entries?select=count&created_at=gte.2025-07-04T00:00:00&created_at=lt.2025-07-05T00:00:00" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Prefer: count=exact"
```

The count is returned in the `Content-Range` response header:
```
Content-Range: 0-5/6
```
(6 total entries)

---

## Quick Test Commands

Copy-paste these to verify your API is working (replace the URL and key first):

```bash
# 1. Check if API is reachable — should return settings
curl -s "$SUPABASE_URL/rest/v1/user_settings?id=eq.1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | python3 -m json.tool

# 2. Add a test water entry
curl -s -X POST "$SUPABASE_URL/rest/v1/water_entries" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"amount": 999, "entry_type": "custom"}' | python3 -m json.tool

# 3. Read it back
curl -s "$SUPABASE_URL/rest/v1/water_entries?amount=eq.999" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | python3 -m json.tool

# 4. Add a test expense
curl -s -X POST "$SUPABASE_URL/rest/v1/expense_entries" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"amount": 1.23, "category": "Food", "description": "API test entry"}' | python3 -m json.tool

# 5. Get category breakdown
curl -s "$SUPABASE_URL/rest/v1/rpc/get_monthly_category_breakdown" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -X POST | python3 -m json.tool

# 6. Clean up test entries
curl -s -X DELETE "$SUPABASE_URL/rest/v1/water_entries?amount=eq.999" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

curl -s -X DELETE "$SUPABASE_URL/rest/v1/expense_entries?description=eq.API test entry" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

---

## Using in JavaScript (Node.js / Scriptable / Anywhere)

```javascript
const url = "https://YOUR_PROJECT.supabase.co/rest/v1";
const key = "YOUR_ANON_KEY";

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

// GET — Fetch today's water entries
const res = await fetch(
  `${url}/water_entries?created_at=gte.2025-07-04T00:00:00&order=created_at.desc`,
  { headers }
);
const data = await res.json();
console.log(data);

// POST — Add a water entry
const insertRes = await fetch(`${url}/water_entries`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify({ amount: 250, entry_type: "glass" }),
});
const inserted = await insertRes.json();
console.log(inserted);

// DELETE — Remove by ID
await fetch(`${url}/water_entries?id=eq.${inserted[0].id}`, {
  method: "DELETE",
  headers,
});
```

---

## API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rest/v1/water_entries` | List water entries (supports filters) |
| `POST` | `/rest/v1/water_entries` | Add a water entry |
| `DELETE` | `/rest/v1/water_entries?id=eq.UUID` | Delete a water entry |
| `PATCH` | `/rest/v1/water_entries?id=eq.UUID` | Update a water entry |
| `GET` | `/rest/v1/expense_entries` | List expense entries (supports filters) |
| `POST` | `/rest/v1/expense_entries` | Add an expense entry |
| `DELETE` | `/rest/v1/expense_entries?id=eq.UUID` | Delete an expense entry |
| `PATCH` | `/rest/v1/expense_entries?id=eq.UUID` | Update an expense entry |
| `GET` | `/rest/v1/user_settings?id=eq.1` | Get settings |
| `PATCH` | `/rest/v1/user_settings?id=eq.1` | Update settings |
| `POST` | `/rest/v1/rpc/get_monthly_category_breakdown` | Category breakdown (optional `p_month` param) |
| `POST` | `/api/parse-sms` | Parse bank SMS → auto-log debit expense (Vercel serverless) |

---

## Vercel Serverless API — SMS Parser

### `POST /api/parse-sms`

Send a raw bank SMS to this endpoint. It automatically:
1. Detects if it's a **debit** (skips credits, failed debits, statements)
2. Extracts **amount**, **payee**, and **date**
3. **Auto-categorizes** the payee
4. **Stores** the expense in Supabase
5. Your Trackr app shows it **instantly** via realtime

#### Request

```bash
curl -X POST "https://your-app.vercel.app/api/parse-sms" \
  -H "Content-Type: application/json" \
  -d '{"message": "ICICI Bank Acct XX219 debited for Rs 40.00 on 01-Jun-26; HOT N SPICY credited. UPI:651870302957. Call 18002662 for dispute. SMS BLOCK 219 to 9215676766"}'
```

#### Response — Debit Logged

```json
{
  "success": true,
  "action": "logged",
  "type": "debit",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "amount": 40.00,
    "category": "Food",
    "description": "HOT N SPICY",
    "created_at": "2026-06-01T00:00:00.000Z"
  },
  "auto_categorized": "Food"
}
```

#### Response — Skipped (Not a Debit)

```json
{
  "success": true,
  "action": "skipped",
  "reason": "Not a debit transaction (credit, failed debit, statement, or unrecognized format)",
  "original_message": "Dear Customer, Acct XX219 is credited with Rs 16.80 on 01-Jun-26 from supermoney..."
}
```

#### Supported SMS Types

| Type | Example | Parsed As |
|------|---------|-----------|
| **Standard debit** | `Acct XX219 debited for Rs 40.00 on 01-Jun-26; HOT N SPICY credited.` | ✅ Logged |
| **Auto-debit** | `ACTFIBER bill of Rs 1237.82 for 108863157766 due on 2026-06-15, will be auto-debited on 2026-06-12` | ✅ Logged |
| **ATM withdrawal** | `Rs. 2,000.00 cardless withdrawal at ICICI Bank ATM on 10-Jun-26.` | ✅ Logged |
| Credit | `Acct XX219 is credited with Rs 16.80` | ❌ Skipped |
| Failed debit | `Your account is not debited with Rs 5000.00` | ❌ Skipped |
| CC statement | `Credit Card XX8006 Statement... Total of Rs 1,237.82 is due by 20-JUN-26` | ❌ Skipped |
| Policy update | `Revised Dynamic Currency Conversion Fee...` | ❌ Skipped |

#### Auto-Categorization

| Payee Contains | → Category |
|---------------|------------|
| SWIGGY, ZOMATO, DOMINOS, PIZZA HUT, MCDONALDS, BURGER KING, KFC, SUBWAY, STARBUCKS, HOT N SPICY, BIRYANI, RESTAURANT, CAFE | Food |
| UBER, OLA, RAPIDO, IRCTC, MAKEMYTRIP, GOIBIBO, FASTAG, BLUSMART, PETROL, METRO | Transport |
| AMAZON, FLIPKART, MYNTRA, AJIO, NYKAA, CROMA, BIG BAZAAR, DMART | Shopping |
| NETFLIX, SPOTIFY, HOTSTAR, PRIME VIDEO, YOUTUBE, BOOKMYSHOW | Entertainment |
| ELECTRICITY, RENT, INSURANCE, LIC, EMI, LOAN, TATA POWER, ACTFIBER, JIO FIBER, BROADBAND, AURAGOLD | Bills |
| PHARMACY, MEDPLUS, APOLLO, CULT FIT, HOSPITAL, GYM | Health |
| COURSERA, UDEMY, BYJU, UNACADEMY | Education |
| ICLOUD, GITHUB, NOTION, CANVA, FIGMA, SLACK | Subscriptions |
| *(anything else)* | UPI |

---

## iPhone Shortcut Setup

### Create the Shortcut (3 Actions Only!)

Since the Vercel API handles all parsing, the Shortcut is dead simple:

**Action 1: "Get Dictionary from Input"**
- Automatically receives the SMS text from the automation

**Action 2: "Get Dictionary Value"**
- Key: `body` (extracts the SMS message text)

**Action 3: "Get Contents of URL"**
- URL: `https://your-app.vercel.app/api/parse-sms`
- Method: **POST**
- Headers: `Content-Type`: `application/json`
- Body (File): Select the text output from Action 2 — BUT wrap it in JSON:
  - First add a **"Text"** action with: `{"message": "⟨SMS Body⟩"}`
  - Then use that Text as the Body

### Set Up the Automation

1. Open Shortcuts → **Automation** tab → **Create Personal Automation**
2. **Message** → Message contains: `debited`
3. **Run Shortcut** → select your "Track Expense" shortcut
4. Turn **OFF** "Ask Before Running" → Done

That's it! Every debit SMS now auto-logs to your Trackr app.
