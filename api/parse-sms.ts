import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================
// Trackr — SMS Parser API
// POST /api/parse-sms
// Receives a raw bank SMS, extracts debit transactions only,
// auto-categorizes, and stores in Supabase.
// ============================================================

// ---- Auto-Categorization ----
const CATEGORIES: Record<string, string[]> = {
  Food: ['SWIGGY', 'ZOMATO', 'DOMINOS', 'PIZZA HUT', 'MCDONALDS', 'BURGER KING', 'KFC', 'SUBWAY', 'STARBUCKS', 'CHAAYOS', 'EAT.FIT', 'FRESHMENU', 'BOX8', 'FAASOS', 'BEHROUZ', 'LUNCHBOX', 'ROLLS MAN', 'HALDIRAM', 'BIKANERVALA', 'SAGAR RATNA', 'CHAI POINT', 'COSTA COFFEE', 'BARISTA', 'CREAM STONE', 'HAVMOR', 'NATURAL', 'HOT N SPICY', 'BIRYANI', 'DOSA', 'IDLY', 'RESTAURANT', 'CAFE', 'BAKERY', 'SWEET', 'FOOD', 'DHABA', 'MESS', 'KITCHEN', 'TANDOOR', 'PIZZA', 'BURGER', 'NOODLES', 'BIRYANI HOUSE'],
  Transport: ['UBER', 'OLA', 'RAPIDO', 'IRCTC', 'MAKEMYTRIP', 'GOIBIBO', 'CLEARTRIP', 'REDBUS', 'YATRA', 'BLUSMART', 'INDIGO', 'SPICEJET', 'AIR INDIA', 'VISTARA', 'AKASA AIR', 'METRO', 'FASTAG', 'TOLL', 'NHAI', 'PARKING', 'PETROL', 'FUEL', 'GAS STATION', 'HP PETROL', 'BP PETROL', 'IOCL', 'CABS', 'TAXI', 'AUTORICKSHAW', 'RAILWAY'],
  Shopping: ['AMAZON', 'FLIPKART', 'MYNTRA', 'AJIO', 'NYKAA', 'SNAPDEAL', 'MEESHO', 'CROMA', 'RELIANCE DIGITAL', 'VIJAY SALES', 'IKEA', 'H&M', 'ZARA', 'TATA CLIQ', 'FIRSTCRY', 'DECATHLON', 'NYKA FASHION', 'LIMEROAD', 'STREET STYLE', 'BIG BAZAAR', 'DMART', 'RELIANCE FRESH', 'MORE STORE', 'SPENCER', 'D-MART'],
  Entertainment: ['NETFLIX', 'SPOTIFY', 'HOTSTAR', 'DISNEY', 'PRIME VIDEO', 'YOUTUBE', 'APPLE MUSIC', 'SOUNDCLOUD', 'GAANA', 'JIOSAAVN', 'WYNK', 'BOOKMYSHOW', 'TICKETMASTER', 'PAYTM MOVIES', 'PVR', 'INOX', 'CINEPOLIS', 'XBOX', 'PLAYSTATION', 'STEAM', 'EPIC GAMES'],
  Bills: ['ELECTRICITY', 'WATER BILL', 'GAS BILL', 'RENT', 'SOCIETY', 'MAINTENANCE', 'MUNICIPAL', 'PROPERTY TAX', 'INSURANCE', 'LIC', 'POLICY', 'EMI', 'LOAN', 'HDFC LTD', 'BAJAJ FINSERV', 'TATA POWER', 'ADANI', 'BSNL', 'JIO POSTPAID', 'AIRTEL', 'VI POSTPAID', 'DTH', 'TATA SKY', 'DISHTV', 'ACTFIBER', 'BSNL FIBER', 'JIO FIBER', 'AIRTEL BROADBAND', 'HATHWAY', 'BROADBAND', 'FIBER', 'TATA PLAY', 'AURAGOLD'],
  Health: ['PHARMACY', 'MEDPLUS', 'APOLLO PHARMA', 'NETMEDS', 'PHARMEASY', '1MG', 'PRISTYN', 'APOLLO HOSPITAL', 'FORTIS', 'MAX HOSPITAL', 'GYM', 'CULT FIT', 'FITSO', 'HEALTHIFY', 'DOCTOR', 'DENTAL', 'HOSPITAL', 'CLINIC', 'DIAGNOSTIC', 'DR LAL PATH', 'THYROCARE', 'METROPOLIS'],
  Education: ['COURSERA', 'UDACITY', 'UDEMY', 'BYJU', 'UNACADEMY', 'WHITEHAT', 'VEDANTU', 'TOPPR', 'SIMPLILEARN', 'PLURALSIGHT', 'SKILLSHARE', 'DUOLINGO', 'CHEGG', 'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'TUITION'],
  Subscriptions: ['ICLOUD', 'GITHUB', 'MEDIUM', 'NOTION', 'CANVA', 'FIGMA', 'SLACK', 'ZOOM', 'MICROSOFT 365', 'GOOGLE ONE', 'APPLE ONE', 'APPLE TV', 'AUDIBLE', 'KINDLE', 'HEADSPACE', 'CALM'],
};

function categorize(payee: string): string {
  const name = payee.toUpperCase().trim();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => name.includes(kw))) return category;
  }
  return 'UPI';
}

// ---- Date Parsing ----
const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

function parseDate(dateStr: string | null): string {
  if (!dateStr) return new Date().toISOString();

  // ISO format: 2026-06-15
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00+05:30`).toISOString();
  }

  // DD-Mon-YY format: 01-Jun-26
  const shortMatch = dateStr.match(/^(\d{1,2})-(\w{3})-(\d{2})$/);
  if (shortMatch) {
    const day = shortMatch[1].padStart(2, '0');
    const month = MONTH_MAP[shortMatch[2].toUpperCase()] || '01';
    const year = '20' + shortMatch[3];
    return new Date(`${year}-${month}-${day}T00:00:00+05:30`).toISOString();
  }

  // DD-MON-YYYY format: 20-JUN-26
  const longMonthMatch = dateStr.match(/^(\d{1,2})-(\w{3,})-(\d{2,4})$/);
  if (longMonthMatch) {
    const day = longMonthMatch[1].padStart(2, '0');
    const month = MONTH_MAP[longMonthMatch[2].toUpperCase().substring(0, 3)] || '01';
    const rawYear = longMonthMatch[3];
    const year = rawYear.length === 2 ? '20' + rawYear : rawYear;
    return new Date(`${year}-${month}-${day}T00:00:00+05:30`).toISOString();
  }

  return new Date().toISOString();
}

// ---- SMS Parsing ----
interface ParsedTransaction {
  amount: number;
  payee: string;
  date: string;
  type: 'debit' | 'auto-debit' | 'atm-withdrawal';
}

function parseSMS(text: string): ParsedTransaction | null {
  const cleaned = text.trim().replace(/\s+/g, ' ');

  // ========== SKIP: Credit transactions ==========
  if (/is credited with/i.test(cleaned)) return null;
  if (/credited\s+with/i.test(cleaned) && !/debited/i.test(cleaned)) return null;

  // ========== SKIP: Failed/rejected debits ==========
  if (/not debited/i.test(cleaned)) return null;
  if (/due to\s+.*rejection/i.test(cleaned)) return null;
  if (/could not be debited/i.test(cleaned)) return null;
  if (/failed/i.test(cleaned) && /debit/i.test(cleaned)) return null;

  // ========== SKIP: Credit card statements ==========
  if (/credit card.*statement/i.test(cleaned)) return null;
  if (/statement is sent/i.test(cleaned)) return null;
  if (/minimum of\s+Rs/i.test(cleaned) && /is due by/i.test(cleaned)) return null;

  // ========== SKIP: Policy/update messages ==========
  if (/revised.*fee/i.test(cleaned)) return null;
  if (/policy.*update/i.test(cleaned)) return null;

  // ========== PARSE: Standard debit ==========
  // "ICICI Bank Acct XX219 debited for Rs 40.00 on 01-Jun-26; HOT N SPICY credited. UPI:..."
  const debitMatch = cleaned.match(
    /debited\s+for\s+Rs\.?\s*([\d,]+\.?\d*)\s+on\s+([\d\w-]+)\s*;\s*(.+?)\s+credited/i
  );
  if (debitMatch) {
    return {
      amount: parseFloat(debitMatch[1].replace(/,/g, '')),
      date: parseDate(debitMatch[2]),
      payee: debitMatch[3].trim(),
      type: 'debit',
    };
  }

    // ========== PARSE: ICICI-style debit (no "for", no "; PAYEE credited") ==========
  // "ICICI Bank Acc XX219 debited Rs. 323.00 on 07-Jul-26 InfoBIL*BPAY*0000.Avl Bal Rs. 3,496.00..."
  const iciciDebitMatch = cleaned.match(
    /debited\s+Rs\.?\s*([\d,]+\.?\d*)\s+on\s+([\d\w-]+)\s+([^\s.]+)/i
  );
  if (iciciDebitMatch) {
    return {
      amount: parseFloat(iciciDebitMatch[1].replace(/,/g, '')),
      date: parseDate(iciciDebitMatch[2]),
      payee: iciciDebitMatch[3].trim(),
      type: 'debit',
    };
  }


  // ========== PARSE: Auto-debit ==========
  // "ACTFIBER bill of Rs 1237.82 for 108863157766 due on 2026-06-15, will be auto-debited on 2026-06-12-ICICI Bank."
  const autoDebitWithDate = cleaned.match(
    /(.+?)\s+bill of\s+Rs\.?\s*([\d,]+\.?\d*).*?auto-debited\s+on\s+([\d-]+)/i
  );
  if (autoDebitWithDate) {
    return {
      amount: parseFloat(autoDebitWithDate[2].replace(/,/g, '')),
      date: parseDate(autoDebitWithDate[3]),
      payee: autoDebitWithDate[1].trim(),
      type: 'auto-debit',
    };
  }

  // "PAYEE bill of Rs X.XX for ID due on DATE" (auto-debit without explicit debit date)
  const autoDebitDue = cleaned.match(
    /(.+?)\s+bill of\s+Rs\.?\s*([\d,]+\.?\d*).*?due\s+on\s+([\d-]+)/i
  );
  if (autoDebitDue && /auto.?debit/i.test(cleaned)) {
    return {
      amount: parseFloat(autoDebitDue[2].replace(/,/g, '')),
      date: parseDate(autoDebitDue[3]),
      payee: autoDebitDue[1].trim(),
      type: 'auto-debit',
    };
  }

  // ========== PARSE: ATM Withdrawal ==========
  // "Rs. 2,000.00 cardless withdrawal at ICICI Bank ATM on 10-Jun-26."
  const atmMatch = cleaned.match(
    /Rs\.?\s*([\d,]+\.?\d*).*?withdrawal.*?(?:on\s+([\d\w-]+))?/i
  );
  if (atmMatch) {
    return {
      amount: parseFloat(atmMatch[1].replace(/,/g, '')),
      date: parseDate(atmMatch[2] || null),
      payee: 'ATM Withdrawal',
      type: 'atm-withdrawal',
    };
  }

  // ========== PARSE: Generic debit (fallback) ==========
  // "debited for Rs X.XX" without the standard format
  const genericDebit = cleaned.match(
    /debited\s+for\s+Rs\.?\s*([\d,]+\.?\d*)/i
  );
  if (genericDebit) {
    // Try to extract a payee from the context
    const payeeFromContext = cleaned.match(
      /;\s*(.+?)\s+(?:credited|UPI|Ref)/i
    );
    return {
      amount: parseFloat(genericDebit[1].replace(/,/g, '')),
      date: new Date().toISOString(),
      payee: payeeFromContext ? payeeFromContext[1].trim() : 'Bank Debit',
      type: 'debit',
    };
  }

  // Not a debit transaction
  return null;
}

// ---- Main Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing "message" field in request body. Send { "message": "your SMS text" }',
    });
  }

  // Parse the SMS
  const parsed = parseSMS(message);

  if (!parsed) {
    return res.status(200).json({
      success: true,
      action: 'skipped',
      reason: 'Not a debit transaction (credit, failed debit, statement, or unrecognized format)',
      original_message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    });
  }

  // Auto-categorize
  const category = categorize(parsed.payee);

  // Build the expense entry
  const expense = {
    amount: parsed.amount,
    category,
    description: parsed.payee,
    created_at: parsed.date,
  };

  // Connect to Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      error: 'Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.',
      parsed: expense,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Insert into expense_entries
  const { data, error } = await supabase
    .from('expense_entries')
    .insert(expense)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: `Supabase insert failed: ${error.message}`,
      parsed: expense,
    });
  }

  return res.status(200).json({
    success: true,
    action: 'logged',
    type: parsed.type,
    data: data,
    auto_categorized: category,
  });
}
