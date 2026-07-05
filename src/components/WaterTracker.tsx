import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Droplets, Plus, Minus, Trash2, GlassWater, CupSoda,
  FlaskConical, Clock, Target, Award, Flame
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

const quickAddAmounts = [
  { amount: 150, label: 'Cup', icon: CupSoda, type: 'cup' as const },
  { amount: 250, label: 'Glass', icon: GlassWater, type: 'glass' as const },
  { amount: 500, label: 'Bottle', icon: FlaskConical, type: 'bottle' as const },
];

export default function WaterTracker() {
  const { isDark } = useTheme();
  const {
    waterEntries, waterGoal, todayWaterTotal,
    weekWaterData, addWaterEntry, deleteWaterEntry, updateWaterGoal,
  } = useData();

  const [customAmount, setCustomAmount] = useState(250);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(waterGoal.daily);
  const [showHistory, setShowHistory] = useState(false);

  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  const waterPercent = Math.min((todayWaterTotal / waterGoal.daily) * 100, 100);
  const remaining = Math.max(waterGoal.daily - todayWaterTotal, 0);
  const todayEntries = waterEntries.filter(e => e.timestamp.startsWith(new Date().toISOString().split('T')[0]));

  // Circle progress
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (waterPercent / 100) * circumference;

  // Streak calculation
  const streak = (() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const total = waterEntries
        .filter(e => e.timestamp.startsWith(dateStr))
        .reduce((s, e) => s + e.amount, 0);
      if (total >= waterGoal.daily) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        if (i === 0) { d.setDate(d.getDate() - 1); continue; } // today might not be done
        break;
      }
    }
    return count;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2" style={{ color: textColor }}>
            <Droplets className="w-7 h-7 text-water-500" />
            Water Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: mutedColor }}>Stay hydrated, stay healthy</p>
        </div>
        <button
          onClick={() => setShowGoalModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:scale-105"
          style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
        >
          <Target className="w-4 h-4" />
          Set Goal
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Circle */}
        <div className="rounded-2xl p-6 glass flex flex-col items-center justify-center" style={{
          background: isDark ? 'rgba(8, 145, 178, 0.1)' : 'rgba(6, 182, 212, 0.05)',
        }}>
          <div className="relative">
            <svg width="200" height="200" className="-rotate-90">
              <circle cx="100" cy="100" r={radius} fill="none"
                stroke={isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)'} strokeWidth="12" />
              <circle cx="100" cy="100" r={radius} fill="none"
                stroke="url(#waterProgress)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                className="progress-ring" />
              <defs>
                <linearGradient id="waterProgress" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: textColor }}>
                {(todayWaterTotal / 1000).toFixed(1)}L
              </span>
              <span className="text-xs mt-1" style={{ color: mutedColor }}>
                of {(waterGoal.daily / 1000).toFixed(1)}L
              </span>
              <span className="text-sm font-semibold mt-1 text-water-500">
                {waterPercent.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm" style={{ color: mutedColor }}>
              {remaining > 0 ? `${(remaining / 1000).toFixed(1)}L remaining` : '🎉 Goal reached!'}
            </p>
          </div>

          {/* Streaks */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' }}>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-500">{streak} day streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)' }}>
              <Award className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-500">{todayEntries.length} drinks</span>
            </div>
          </div>
        </div>

        {/* Quick Add */}
        <div className="rounded-2xl p-5 glass space-y-4" style={{ background: cardBg }}>
          <h3 className="font-semibold text-sm" style={{ color: textColor }}>Quick Add</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickAddAmounts.map(item => (
              <button
                key={item.amount}
                onClick={() => addWaterEntry(item.amount, item.type)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.06)' }}
              >
                <item.icon className="w-6 h-6 text-water-500" />
                <span className="text-lg font-bold text-water-500">{item.amount}</span>
                <span className="text-[10px]" style={{ color: mutedColor }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <h4 className="text-xs font-medium mb-2" style={{ color: mutedColor }}>Custom Amount</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomAmount(Math.max(50, customAmount - 50))}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-water-500">{customAmount}</span>
                <span className="text-xs ml-1" style={{ color: mutedColor }}>ml</span>
              </div>
              <button
                onClick={() => setCustomAmount(Math.min(2000, customAmount + 50))}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => addWaterEntry(customAmount, 'custom')}
              className="w-full mt-3 py-3 rounded-xl gradient-water text-white font-semibold text-sm shadow-lg shadow-water-500/25 hover:scale-[1.02] transition-transform active:scale-95"
            >
              Add {customAmount}ml
            </button>
          </div>
        </div>

        {/* Today's Log */}
        <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: textColor }}>Today's Log</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              background: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)',
              color: '#06b6d4',
            }}>
              {todayEntries.length} entries
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {todayEntries.length === 0 ? (
              <div className="text-center py-8">
                <Droplets className="w-8 h-8 mx-auto mb-2 text-water-300" />
                <p className="text-sm" style={{ color: mutedColor }}>No entries yet today</p>
                <p className="text-xs" style={{ color: mutedColor }}>Start by adding your first drink!</p>
              </div>
            ) : (
              todayEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-xl group"
                  style={{ background: isDark ? 'rgba(6, 182, 212, 0.06)' : 'rgba(6, 182, 212, 0.03)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-water flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: textColor }}>{entry.amount}ml</p>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: mutedColor }} />
                        <p className="text-[10px]" style={{ color: mutedColor }}>
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
                      background: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                      color: '#06b6d4',
                    }}>
                      {entry.type}
                    </span>
                    <button
                      onClick={() => deleteWaterEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="font-semibold text-sm mb-4" style={{ color: textColor }}>Weekly Overview</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekWaterData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
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
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#06b6d4" />
              <Bar dataKey="goal" radius={[8, 8, 0, 0]} fill={isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full History */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: textColor }}>Full History</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-medium text-water-500"
          >
            {showHistory ? 'Show Less' : 'Show All'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Date</th>
                <th className="text-left text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Time</th>
                <th className="text-left text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Amount</th>
                <th className="text-left text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Type</th>
                <th className="text-right text-[10px] font-medium pb-2" style={{ color: mutedColor }}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ '--tw-divide-opacity': '0.05', borderColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.05)' } as React.CSSProperties}>
              {(showHistory ? waterEntries : waterEntries.slice(0, 10)).map(entry => (
                <tr key={entry.id} className="group">
                  <td className="py-2 text-xs" style={{ color: textColor }}>
                    {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2 text-xs" style={{ color: mutedColor }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 text-xs font-medium" style={{ color: textColor }}>{entry.amount}ml</td>
                  <td className="py-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
                      background: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                      color: '#06b6d4',
                    }}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => deleteWaterEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm glass-strong" style={{ background: isDark ? '#1e293b' : '#ffffff' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: textColor }}>Set Daily Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium" style={{ color: mutedColor }}>Daily water goal (ml)</label>
                <input
                  type="number"
                  value={goalInput}
                  onChange={e => setGoalInput(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-water-500/30"
                  style={{
                    background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { updateWaterGoal({ daily: goalInput }); setShowGoalModal(false); }}
                  className="flex-1 py-3 rounded-xl gradient-water text-white text-sm font-semibold shadow-lg shadow-water-500/25"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
