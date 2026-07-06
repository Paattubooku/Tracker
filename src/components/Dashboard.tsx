import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Droplets, Wallet, TrendingUp, TrendingDown, Target,
  ArrowUpRight, Wifi, WifiOff
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface DashboardProps {
  onNavigate: (page: 'water' | 'expenses' | 'settings') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { isDark } = useTheme();
  const {
    todayWaterTotal, todayExpenseTotal, waterGoal, expenseBudget,
    weekWaterData, categoryBreakdown, waterEntries, expenseEntries,
    dbStatus, settings,
  } = useData();
  const currency = settings?.currency || '$';

  const waterPercent = Math.min((todayWaterTotal / waterGoal.daily) * 100, 100);
  const budgetUsed = (() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    return expenseEntries
      .filter(e => e.timestamp.startsWith(currentMonth))
      .reduce((s, e) => s + e.amount, 0);
  })();
  const budgetPercent = Math.min((budgetUsed / expenseBudget.monthly) * 100, 100);

  const recentWater = waterEntries.slice(0, 3);
  const recentExpenses = expenseEntries.slice(0, 3);

  const cardBg = isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  const thisWeekWater = weekWaterData.reduce((s, d) => s + d.amount, 0);
  const lastWeekWater = weekWaterData.slice(0, 6).reduce((s, d) => s + d.amount, 0);
  const waterTrendUp = thisWeekWater >= lastWeekWater;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: textColor }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: mutedColor }}>Here's your daily overview</p>
        <div className="flex items-center gap-1.5 mt-1">
          {dbStatus === 'connected' ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-500" />
          )}
          <span className="text-[10px]" style={{ color: dbStatus === 'connected' ? '#22c55e' : '#f59e0b' }}>
            {dbStatus === 'connected' ? 'Synced with cloud' : dbStatus === 'checking' ? 'Connecting...' : 'Local data only'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Water Card */}
        <div
          className="col-span-2 lg:col-span-1 rounded-2xl p-5 glass cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          style={{ background: isDark ? 'rgba(8, 145, 178, 0.15)' : 'rgba(6, 182, 212, 0.08)' }}
          onClick={() => onNavigate('water')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl gradient-water flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
              {waterTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {waterTrendUp ? 'On track' : 'Behind'}
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: textColor }}>{(todayWaterTotal / 1000).toFixed(1)}L</p>
          <p className="text-xs mt-1" style={{ color: mutedColor }}>of {(waterGoal.daily / 1000).toFixed(1)}L goal</p>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.06)' }}>
            <div className="h-full rounded-full gradient-water transition-all duration-500" style={{ width: `${waterPercent}%` }} />
          </div>
        </div>

        {/* Expense Card */}
        <div
          className="col-span-2 lg:col-span-1 rounded-2xl p-5 glass cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          style={{ background: isDark ? 'rgba(219, 39, 119, 0.15)' : 'rgba(236, 72, 153, 0.08)' }}
          onClick={() => onNavigate('expenses')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl gradient-expense flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
              background: budgetPercent > 80 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: budgetPercent > 80 ? '#ef4444' : '#22c55e',
            }}>
              {budgetPercent.toFixed(0)}% used
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: textColor }}>{currency}{todayExpenseTotal.toFixed(0)}</p>
          <p className="text-xs mt-1" style={{ color: mutedColor }}>spent today</p>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.06)' }}>
            <div className="h-full rounded-full gradient-expense transition-all duration-500" style={{ width: `${budgetPercent}%` }} />
          </div>
        </div>

        {/* Weekly Avg */}
        <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }}>
            <Target className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold" style={{ color: textColor }}>
            {(thisWeekWater / 7 / 1000).toFixed(1)}L
          </p>
          <p className="text-xs mt-1" style={{ color: mutedColor }}>avg daily water</p>
        </div>

        {/* Monthly Spend */}
        <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)' }}>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold" style={{ color: textColor }}>{currency}{budgetUsed.toFixed(0)}</p>
          <p className="text-xs mt-1" style={{ color: mutedColor }}>monthly spend</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Water Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: textColor }}>Weekly Hydration</h3>
            <button
              onClick={() => onNavigate('water')}
              className="text-xs font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekWaterData}>
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: mutedColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: mutedColor }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#1e293b' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    color: textColor,
                    fontSize: '12px',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${(Number(value)/1000).toFixed(2)}L`, 'Intake']}
                />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2.5} fill="url(#waterGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie */}
        <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: textColor }}>Spending Categories</h3>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1"
            >
              Details <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#1e293b' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    color: textColor,
                    fontSize: '12px',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {categoryBreakdown.slice(0, 3).map(cat => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs" style={{ color: mutedColor }}>{cat.name}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: textColor }}>{currency}{cat.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Water */}
        <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: textColor }}>Recent Hydration</h3>
            <button
              onClick={() => onNavigate('water')}
              className="text-xs font-medium text-primary-500 flex items-center gap-1"
            >
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentWater.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: isDark ? 'rgba(6, 182, 212, 0.06)' : 'rgba(6, 182, 212, 0.04)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-water flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: textColor }}>{entry.amount}ml</p>
                    <p className="text-[10px]" style={{ color: mutedColor }}>
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                  background: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                  color: '#06b6d4',
                }}>
                  {entry.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: textColor }}>Recent Expenses</h3>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-medium text-primary-500 flex items-center gap-1"
            >
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentExpenses.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: isDark ? 'rgba(236, 72, 153, 0.06)' : 'rgba(236, 72, 153, 0.04)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-expense flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: textColor }}>{entry.description}</p>
                    <p className="text-[10px]" style={{ color: mutedColor }}>{entry.category}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold" style={{ color: textColor }}>{currency}{entry.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
