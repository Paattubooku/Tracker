import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { categoryColors } from '../contexts/DataContext';
import {
  Wallet, Plus, Trash2, Receipt, Tag
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const categories = Object.keys(categoryColors);

export default function ExpenseTracker() {
  const { isDark } = useTheme();
  const {
    expenseEntries, expenseBudget, todayExpenseTotal,
    weekExpenseData, categoryBreakdown, addExpenseEntry, deleteExpenseEntry, updateExpenseBudget,
    settings,
  } = useData();
  const currency = settings?.currency || '$';

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: '',
  });
  const [budgetInput, setBudgetInput] = useState(expenseBudget.monthly);

  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthEntries = expenseEntries.filter(e => e.timestamp.startsWith(currentMonth));
  const monthTotal = monthEntries.reduce((s, e) => s + e.amount, 0);
  const budgetPercent = Math.min((monthTotal / expenseBudget.monthly) * 100, 100);
  const todayEntries = expenseEntries.filter(e => e.timestamp.startsWith(new Date().toISOString().split('T')[0]));

  // Top spending category this month
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) return;
    addExpenseEntry({
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description,
    });
    setNewExpense({ amount: '', category: 'Food', description: '' });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2" style={{ color: textColor }}>
            <Wallet className="w-7 h-7 text-expense-500" />
            Expense Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: mutedColor }}>Track every debit, stay on budget</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
          >
            Budget
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl gradient-expense text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-expense-500/25 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today */}
        <div className="rounded-2xl p-4 glass" style={{ background: isDark ? 'rgba(219, 39, 119, 0.1)' : 'rgba(236, 72, 153, 0.05)' }}>
          <p className="text-xs" style={{ color: mutedColor }}>Today</p>
          <p className="text-xl font-bold mt-1" style={{ color: textColor }}>{currency}{todayExpenseTotal.toFixed(2)}</p>
          <p className="text-[10px] mt-1" style={{ color: mutedColor }}>{todayEntries.length} transactions</p>
        </div>

        {/* This Month */}
        <div className="rounded-2xl p-4 glass" style={{ background: cardBg }}>
          <p className="text-xs" style={{ color: mutedColor }}>This Month</p>
          <p className="text-xl font-bold mt-1" style={{ color: textColor }}>{currency}{monthTotal.toFixed(0)}</p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.06)' }}>
            <div className="h-full rounded-full gradient-expense transition-all duration-500" style={{ width: `${budgetPercent}%` }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: mutedColor }}>{budgetPercent.toFixed(0)}% of {currency}{expenseBudget.monthly}</p>
        </div>

        {/* Top Category */}
        <div className="rounded-2xl p-4 glass col-span-2 lg:col-span-1" style={{ background: cardBg }}>
          <p className="text-xs" style={{ color: mutedColor }}>Top Category</p>
          {topCategory ? (
            <>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ background: topCategory.color }} />
                <p className="text-lg font-bold" style={{ color: textColor }}>{topCategory.name}</p>
              </div>
              <p className="text-sm font-semibold" style={{ color: topCategory.color }}>{currency}{topCategory.value.toFixed(0)}</p>
            </>
          ) : (
            <p className="text-lg font-bold mt-1" style={{ color: mutedColor }}>No data</p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend */}
        <div className="lg:col-span-2 rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: textColor }}>Weekly Spending</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekExpenseData}>
                <defs>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: mutedColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: mutedColor }} axisLine={false} tickLine={false} tickFormatter={v => `${currency}${v}`} />
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
                  formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, 'Spent']}
                />
                <Area type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={2.5} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: textColor }}>By Category</h3>
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
            {categoryBreakdown.map(cat => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="text-[10px] truncate" style={{ color: mutedColor }}>{cat.name}</span>
                <span className="text-[10px] font-medium ml-auto" style={{ color: textColor }}>{currency}{cat.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="font-semibold text-sm mb-4" style={{ color: textColor }}>Category Comparison</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBreakdown} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: mutedColor }} axisLine={false} tickLine={false} tickFormatter={v => `${currency}${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: mutedColor }} axisLine={false} tickLine={false} width={80} />
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
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {categoryBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Transactions */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: textColor }}>All Transactions</h3>
          <button onClick={() => setShowHistory(!showHistory)} className="text-xs font-medium text-expense-500">
            {showHistory ? 'Show Less' : 'Show All'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Date</th>
                <th className="text-left text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Description</th>
                <th className="text-left text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Category</th>
                <th className="text-right text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Amount</th>
                <th className="text-right text-[10px] font-medium pb-2" style={{ color: mutedColor }}></th>
              </tr>
            </thead>
            <tbody>
              {(showHistory ? expenseEntries : expenseEntries.slice(0, 10)).map(entry => (
                <tr key={entry.id} className="group border-t" style={{ borderColor: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(0,0,0,0.04)' }}>
                  <td className="py-2.5 text-xs" style={{ color: mutedColor }}>
                    {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2.5 text-xs font-medium" style={{ color: textColor }}>{entry.description}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                      background: `${categoryColors[entry.category] || '#94a3b8'}20`,
                      color: categoryColors[entry.category] || '#94a3b8',
                    }}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs font-semibold text-right" style={{ color: textColor }}>{currency}{entry.amount.toFixed(2)}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => deleteExpenseEntry(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm glass-strong" style={{ background: isDark ? '#1e293b' : '#ffffff' }}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: textColor }}>
              <Receipt className="w-5 h-5 text-expense-500" />
              New Expense
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: mutedColor }}>Amount</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-expense-500/30"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: mutedColor }}>Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What did you spend on?"
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-expense-500/30"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium flex items-center gap-1" style={{ color: mutedColor }}>
                  <Tag className="w-3 h-3" /> Category
                </label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewExpense(prev => ({ ...prev, category: cat }))}
                      className={`py-2 px-2 rounded-lg text-[10px] font-medium transition-all ${
                        newExpense.category === cat ? 'scale-105' : ''
                      }`}
                      style={{
                        background: newExpense.category === cat
                          ? `${categoryColors[cat]}25`
                          : isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                        color: newExpense.category === cat ? categoryColors[cat] : mutedColor,
                        border: newExpense.category === cat ? `1px solid ${categoryColors[cat]}50` : `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  className="flex-1 py-3 rounded-xl gradient-expense text-white text-sm font-semibold shadow-lg shadow-expense-500/25"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm glass-strong" style={{ background: isDark ? '#1e293b' : '#ffffff' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: textColor }}>Monthly Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium" style={{ color: mutedColor }}>Total monthly budget</label>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={e => setBudgetInput(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-expense-500/30"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { updateExpenseBudget({ monthly: budgetInput }); setShowBudgetModal(false); }}
                  className="flex-1 py-3 rounded-xl gradient-expense text-white text-sm font-semibold shadow-lg shadow-expense-500/25"
                >
                  Save Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
