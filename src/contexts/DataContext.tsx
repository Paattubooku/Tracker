import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Types
export interface WaterEntry {
  id: string;
  amount: number;
  timestamp: string;
  type: 'glass' | 'bottle' | 'cup' | 'custom';
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  description: string;
  timestamp: string;
}

export interface WaterGoal {
  daily: number;
  reminderInterval: number;
}

export interface ExpenseBudget {
  monthly: number;
  categories: Record<string, number>;
}

export interface AppSettings {
  currency: string;
  waterUnit: 'ml' | 'oz';
  weekStartsOn: 'monday' | 'sunday';
  notifications: boolean;
}

interface DataContextType {
  waterEntries: WaterEntry[];
  expenseEntries: ExpenseEntry[];
  waterGoal: WaterGoal;
  expenseBudget: ExpenseBudget;
  settings: AppSettings;
  addWaterEntry: (amount: number, type: WaterEntry['type']) => void;
  addExpenseEntry: (entry: Omit<ExpenseEntry, 'id' | 'timestamp'>) => void;
  deleteWaterEntry: (id: string) => void;
  deleteExpenseEntry: (id: string) => void;
  updateWaterGoal: (goal: Partial<WaterGoal>) => void;
  updateExpenseBudget: (budget: Partial<ExpenseBudget>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  todayWaterTotal: number;
  todayExpenseTotal: number;
  weekWaterData: { day: string; amount: number; goal: number }[];
  weekExpenseData: { day: string; amount: number; budget: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  isLoading: boolean;
  dbStatus: 'connected' | 'local' | 'checking';
}

const DataContext = createContext<DataContextType | null>(null);

// Category color mapping
export const categoryColors: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Entertainment: '#8b5cf6',
  Bills: '#ef4444',
  Health: '#22c55e',
  Education: '#06b6d4',
  Subscriptions: '#f97316',
};

// Generate mock data
const generateId = () => Math.random().toString(36).substring(2, 9);
const now = new Date();
const today = now.toISOString().split('T')[0];

function generateMockWaterEntries(): WaterEntry[] {
  const entries: WaterEntry[] = [
    { id: generateId(), amount: 250, timestamp: `${today}T07:00:00`, type: 'glass' },
    { id: generateId(), amount: 500, timestamp: `${today}T09:30:00`, type: 'bottle' },
    { id: generateId(), amount: 200, timestamp: `${today}T12:00:00`, type: 'cup' },
    { id: generateId(), amount: 250, timestamp: `${today}T14:30:00`, type: 'glass' },
    { id: generateId(), amount: 500, timestamp: `${today}T17:00:00`, type: 'bottle' },
    { id: generateId(), amount: 300, timestamp: `${today}T19:30:00`, type: 'cup' },
  ];
  for (let d = 1; d <= 6; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < count; i++) {
      const hour = 7 + Math.floor(Math.random() * 14);
      const types: WaterEntry['type'][] = ['glass', 'bottle', 'cup'];
      entries.push({
        id: generateId(),
        amount: [200, 250, 500][Math.floor(Math.random() * 3)],
        timestamp: `${dateStr}T${hour.toString().padStart(2, '0')}:${(Math.random() * 60 | 0).toString().padStart(2, '0')}:00`,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  }
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateMockExpenseEntries(): ExpenseEntry[] {
  const categories = Object.keys(categoryColors);
  const descriptions: Record<string, string[]> = {
    Food: ['Lunch at cafe', 'Grocery shopping', 'Coffee & pastry', 'Dinner delivery', 'Breakfast smoothie'],
    Transport: ['Uber ride', 'Metro pass', 'Gas fill-up', 'Parking fee', 'Train ticket'],
    Shopping: ['New headphones', 'Clothing haul', 'Home decor', 'Kitchen supplies', 'Book purchase'],
    Entertainment: ['Movie tickets', 'Concert pass', 'Game purchase', 'Streaming sub', 'Bowling night'],
    Bills: ['Electric bill', 'Internet bill', 'Phone bill', 'Water bill', 'Rent payment'],
    Health: ['Pharmacy', 'Gym membership', 'Supplements', 'Doctor visit', 'Dental cleaning'],
    Education: ['Online course', 'Textbook', 'Workshop fee', 'Certification', 'Study materials'],
    Subscriptions: ['Netflix', 'Spotify', 'iCloud+', 'GitHub Pro', 'Medium'],
  };
  const entries: ExpenseEntry[] = [
    { id: generateId(), amount: 15.50, category: 'Food', description: 'Lunch at cafe', timestamp: `${today}T12:30:00` },
    { id: generateId(), amount: 8.00, category: 'Transport', description: 'Uber ride', timestamp: `${today}T08:15:00` },
    { id: generateId(), amount: 45.99, category: 'Shopping', description: 'New headphones', timestamp: `${today}T16:00:00` },
    { id: generateId(), amount: 12.00, category: 'Entertainment', description: 'Movie tickets', timestamp: `${today}T19:00:00` },
    { id: generateId(), amount: 5.50, category: 'Food', description: 'Coffee & pastry', timestamp: `${today}T09:00:00` },
    { id: generateId(), amount: 9.99, category: 'Subscriptions', description: 'Netflix', timestamp: `${today}T00:00:00` },
  ];
  for (let d = 1; d <= 30; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < count; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const descList = descriptions[cat];
      const hour = 8 + Math.floor(Math.random() * 14);
      entries.push({
        id: generateId(),
        amount: Math.round((Math.random() * 80 + 3) * 100) / 100,
        category: cat,
        description: descList[Math.floor(Math.random() * descList.length)],
        timestamp: `${dateStr}T${hour.toString().padStart(2, '0')}:${(Math.random() * 60 | 0).toString().padStart(2, '0')}:00`,
      });
    }
  }
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>(generateMockWaterEntries);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(generateMockExpenseEntries);
  const [waterGoal, setWaterGoal] = useState<WaterGoal>({ daily: 2500, reminderInterval: 60 });
  const [expenseBudget, setExpenseBudget] = useState<ExpenseBudget>({
    monthly: 2000,
    categories: { Food: 400, Transport: 200, Shopping: 300, Entertainment: 150, Bills: 500, Health: 150, Education: 100, Subscriptions: 50 },
  });
  const [settings, setSettings] = useState<AppSettings>({
    currency: '$',
    waterUnit: 'ml',
    weekStartsOn: 'monday',
    notifications: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'local' | 'checking'>('local');

  const configured = isSupabaseConfigured();

  // ---- Load data from Supabase on mount ----
  useEffect(() => {
    if (!supabase || !configured) {
      setDbStatus('local');
      return;
    }

    let cancelled = false;
    const sb = supabase;

    const loadAll = async () => {
      setIsLoading(true);
      setDbStatus('checking');
      try {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Load water entries
        const { data: waterData, error: wErr } = await sb
          .from('water_entries')
          .select('*')
          .gte('created_at', sixtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (wErr) throw wErr;
        if (waterData && !cancelled) {
          setWaterEntries(waterData.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            amount: e.amount as number,
            timestamp: e.created_at as string,
            type: e.entry_type as WaterEntry['type'],
          })));
        }

        // Load expense entries
        const { data: expenseData, error: eErr } = await sb
          .from('expense_entries')
          .select('*')
          .gte('created_at', sixtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (eErr) throw eErr;
        if (expenseData && !cancelled) {
          setExpenseEntries(expenseData.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            amount: Number(e.amount),
            category: e.category as string,
            description: e.description as string,
            timestamp: e.created_at as string,
          })));
        }

        // Load user settings
        const { data: settingsData, error: sErr } = await sb
          .from('user_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (sErr) throw sErr;
        if (settingsData && !cancelled) {
          const s = settingsData as Record<string, unknown>;
          setWaterGoal({
            daily: (s.daily_water_goal as number) || 2500,
            reminderInterval: (s.reminder_interval_minutes as number) || 60,
          });
          setExpenseBudget(prev => ({
            ...prev,
            monthly: Number(s.monthly_budget) || 2000,
          }));
          setSettings({
            currency: (s.currency as string) || '$',
            waterUnit: (s.water_unit as 'ml' | 'oz') || 'ml',
            weekStartsOn: (s.week_starts_on as 'monday' | 'sunday') || 'monday',
            notifications: (s.notifications_enabled as boolean) ?? true,
          });
        }

        setDbStatus('connected');
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
        setDbStatus('local');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [configured]);

  // ---- Realtime subscriptions ----
  useEffect(() => {
    if (!supabase || !configured) return;
    const sb = supabase;

    const channel = sb
      .channel('trackr-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'water_entries' },
        (payload) => {
          const e = payload.new as Record<string, unknown>;
          setWaterEntries(prev => [{
            id: e.id as string,
            amount: e.amount as number,
            timestamp: e.created_at as string,
            type: e.entry_type as WaterEntry['type'],
          }, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'water_entries' },
        (payload) => {
          const e = payload.old as Record<string, unknown>;
          setWaterEntries(prev => prev.filter(entry => entry.id !== e.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expense_entries' },
        (payload) => {
          const e = payload.new as Record<string, unknown>;
          setExpenseEntries(prev => [{
            id: e.id as string,
            amount: Number(e.amount),
            category: e.category as string,
            description: e.description as string,
            timestamp: e.created_at as string,
          }, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expense_entries' },
        (payload) => {
          const e = payload.old as Record<string, unknown>;
          setExpenseEntries(prev => prev.filter(entry => entry.id !== e.id));
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [configured]);

  // ---- CRUD Operations ----
  const addWaterEntry = useCallback(async (amount: number, type: WaterEntry['type']) => {
    const optimisticEntry: WaterEntry = {
      id: generateId(),
      amount,
      timestamp: new Date().toISOString(),
      type,
    };
    setWaterEntries(prev => [optimisticEntry, ...prev]);

    if (supabase && configured) {
      const { error } = await supabase.from('water_entries').insert({
        amount,
        entry_type: type,
      });
      if (error) {
        console.error('Failed to add water entry:', error);
        setWaterEntries(prev => prev.filter(e => e.id !== optimisticEntry.id));
      }
    }
  }, [configured]);

  const addExpenseEntry = useCallback(async (entry: Omit<ExpenseEntry, 'id' | 'timestamp'>) => {
    const optimisticEntry: ExpenseEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setExpenseEntries(prev => [optimisticEntry, ...prev]);

    if (supabase && configured) {
      const { error } = await supabase.from('expense_entries').insert({
        amount: entry.amount,
        category: entry.category,
        description: entry.description,
      });
      if (error) {
        console.error('Failed to add expense entry:', error);
        setExpenseEntries(prev => prev.filter(e => e.id !== optimisticEntry.id));
      }
    }
  }, [configured]);

  const deleteWaterEntry = useCallback(async (id: string) => {
    const prev = waterEntries;
    setWaterEntries(entries => entries.filter(e => e.id !== id));

    if (supabase && configured) {
      const { error } = await supabase.from('water_entries').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete water entry:', error);
        setWaterEntries(prev);
      }
    }
  }, [configured, waterEntries]);

  const deleteExpenseEntry = useCallback(async (id: string) => {
    const prev = expenseEntries;
    setExpenseEntries(entries => entries.filter(e => e.id !== id));

    if (supabase && configured) {
      const { error } = await supabase.from('expense_entries').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete expense entry:', error);
        setExpenseEntries(prev);
      }
    }
  }, [configured, expenseEntries]);

  const updateWaterGoal = useCallback(async (goal: Partial<WaterGoal>) => {
    setWaterGoal(prev => ({ ...prev, ...goal }));

    if (supabase && configured) {
      const updates: Record<string, unknown> = {};
      if (goal.daily !== undefined) updates.daily_water_goal = goal.daily;
      if (goal.reminderInterval !== undefined) updates.reminder_interval_minutes = goal.reminderInterval;

      const { error } = await supabase.from('user_settings').update(updates).limit(1);
      if (error) console.error('Failed to update water goal:', error);
    }
  }, [configured]);

  const updateExpenseBudget = useCallback(async (budget: Partial<ExpenseBudget>) => {
    setExpenseBudget(prev => ({ ...prev, ...budget }));

    if (supabase && configured) {
      const updates: Record<string, unknown> = {};
      if (budget.monthly !== undefined) updates.monthly_budget = budget.monthly;

      const { error } = await supabase.from('user_settings').update(updates).limit(1);
      if (error) console.error('Failed to update budget:', error);
    }
  }, [configured]);

  const updateSettings = useCallback(async (s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));

    if (supabase && configured) {
      const updates: Record<string, unknown> = {};
      if (s.currency !== undefined) updates.currency = s.currency;
      if (s.waterUnit !== undefined) updates.water_unit = s.waterUnit;
      if (s.weekStartsOn !== undefined) updates.week_starts_on = s.weekStartsOn;
      if (s.notifications !== undefined) updates.notifications_enabled = s.notifications;

      const { error } = await supabase.from('user_settings').update(updates).limit(1);
      if (error) console.error('Failed to update settings:', error);
    }
  }, [configured]);

  // ---- Computed Values ----
  const todayWaterTotal = waterEntries
    .filter(e => e.timestamp.startsWith(today))
    .reduce((sum, e) => sum + e.amount, 0);

  const todayExpenseTotal = expenseEntries
    .filter(e => e.timestamp.startsWith(today))
    .reduce((sum, e) => sum + e.amount, 0);

  const weekWaterData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const shortDay = days[(date.getDay() + 6) % 7];
      const total = waterEntries
        .filter(e => e.timestamp.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0);
      result.push({ day: d === 0 ? 'Today' : shortDay, amount: total, goal: waterGoal.daily });
    }
    return result;
  })();

  const weekExpenseData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const shortDay = days[(date.getDay() + 6) % 7];
      const total = expenseEntries
        .filter(e => e.timestamp.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0);
      result.push({ day: d === 0 ? 'Today' : shortDay, amount: Math.round(total * 100) / 100, budget: Math.round(expenseBudget.monthly / 30) });
    }
    return result;
  })();

  const categoryBreakdown = (() => {
    const currentMonth = now.toISOString().substring(0, 7);
    const monthEntries = expenseEntries.filter(e => e.timestamp.startsWith(currentMonth));
    const catMap: Record<string, number> = {};
    monthEntries.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100, color: categoryColors[name] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value);
  })();

  return (
    <DataContext.Provider value={{
      waterEntries, expenseEntries, waterGoal, expenseBudget, settings,
      addWaterEntry, addExpenseEntry, deleteWaterEntry, deleteExpenseEntry,
      updateWaterGoal, updateExpenseBudget, updateSettings,
      todayWaterTotal, todayExpenseTotal,
      weekWaterData, weekExpenseData, categoryBreakdown,
      isLoading, dbStatus,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
