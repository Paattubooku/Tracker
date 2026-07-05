import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Settings as SettingsIcon, Moon, Sun, Droplets, Wallet,
  Bell, Calendar, Globe, DollarSign, ChevronRight,
  Wifi, WifiOff, Database
} from 'lucide-react';

export default function Settings() {
  const { isDark, toggle } = useTheme();
  const { settings, updateSettings, waterGoal, updateWaterGoal, expenseBudget, updateExpenseBudget, dbStatus } = useData();

  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)';

  const configured = isSupabaseConfigured();

  const SettingRow = ({ icon: Icon, label, description, children }: {
    icon: typeof SettingsIcon;
    label: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)' }}>
          <Icon className="w-4 h-4 text-primary-500" />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: textColor }}>{label}</p>
          <p className="text-[10px]" style={{ color: mutedColor }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className="relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0"
      style={{ background: checked ? '#6366f1' : isDark ? '#334155' : '#e2e8f0' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  );

  const statusColors: Record<string, string> = {
    connected: '#22c55e',
    local: '#f59e0b',
    checking: '#6366f1',
  };

  const statusLabels: Record<string, string> = {
    connected: 'Connected to Supabase',
    local: 'Using local data',
    checking: 'Connecting...',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2" style={{ color: textColor }}>
          <SettingsIcon className="w-7 h-7 text-primary-500" />
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: mutedColor }}>Customize your experience</p>
      </div>

      {/* Connection Status */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: mutedColor }}>
          <Database className="w-3.5 h-3.5" /> Database
        </h3>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: dbStatus === 'connected'
                ? 'rgba(34, 197, 94, 0.15)'
                : dbStatus === 'checking'
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
            }}>
              {dbStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : dbStatus === 'checking' ? (
                <div className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: textColor }}>Supabase</p>
              <p className="text-[10px]" style={{ color: statusColors[dbStatus] }}>{statusLabels[dbStatus]}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{
            background: configured ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: configured ? '#22c55e' : '#f59e0b',
          }}>
            {configured ? 'Configured' : 'Not Configured'}
          </span>
        </div>

        {!configured && (
          <div className="mt-2 p-3 rounded-xl" style={{ background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
            <p className="text-[10px] leading-relaxed" style={{ color: mutedColor }}>
              To connect to Supabase, create a <code className="px-1 rounded" style={{ background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)' }}>.env</code> file with:
            </p>
            <pre className="mt-2 p-2 rounded-lg text-[10px] overflow-x-auto" style={{
              background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(0,0,0,0.03)',
              color: isDark ? '#67e8f9' : '#0891b2',
            }}>
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
            </pre>
            <p className="text-[10px] mt-2" style={{ color: mutedColor }}>
              Then run the SQL in <code className="px-1 rounded" style={{ background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)' }}>supabase-schema.sql</code> in your Supabase SQL Editor.
            </p>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: mutedColor }}>Appearance</h3>
        <SettingRow icon={isDark ? Moon : Sun} label="Dark Mode" description="Dark theme is recommended for the best experience">
          <Toggle checked={isDark} onChange={toggle} />
        </SettingRow>
      </div>

      {/* Water Settings */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: mutedColor }}>
          <Droplets className="w-3.5 h-3.5 text-water-500" /> Water Tracking
        </h3>
        <SettingRow icon={Droplets} label="Daily Goal" description={`${waterGoal.daily}ml per day`}>
          <select
            value={waterGoal.daily}
            onChange={e => updateWaterGoal({ daily: Number(e.target.value) })}
            className="text-xs font-medium px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            {[1500, 2000, 2500, 3000, 3500, 4000].map(v => (
              <option key={v} value={v}>{(v / 1000).toFixed(1)}L</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow icon={Bell} label="Reminders" description="Hydration reminders">
          <Toggle checked={settings.notifications} onChange={() => updateSettings({ notifications: !settings.notifications })} />
        </SettingRow>
        <SettingRow icon={Globe} label="Unit" description="Water measurement unit">
          <select
            value={settings.waterUnit}
            onChange={e => updateSettings({ waterUnit: e.target.value as 'ml' | 'oz' })}
            className="text-xs font-medium px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <option value="ml">ml</option>
            <option value="oz">oz</option>
          </select>
        </SettingRow>
      </div>

      {/* Expense Settings */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: mutedColor }}>
          <Wallet className="w-3.5 h-3.5 text-expense-500" /> Expense Tracking
        </h3>
        <SettingRow icon={DollarSign} label="Monthly Budget" description={`$${expenseBudget.monthly} per month`}>
          <select
            value={expenseBudget.monthly}
            onChange={e => updateExpenseBudget({ monthly: Number(e.target.value) })}
            className="text-xs font-medium px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            {[500, 1000, 1500, 2000, 2500, 3000, 4000, 5000].map(v => (
              <option key={v} value={v}>${v}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow icon={DollarSign} label="Currency" description="Display currency symbol">
          <select
            value={settings.currency}
            onChange={e => updateSettings({ currency: e.target.value })}
            className="text-xs font-medium px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <option value="$">$ (USD)</option>
            <option value="€">€ (EUR)</option>
            <option value="£">£ (GBP)</option>
            <option value="₹">₹ (INR)</option>
            <option value="¥">¥ (JPY)</option>
          </select>
        </SettingRow>
        <SettingRow icon={Calendar} label="Week Starts On" description="First day of the week">
          <select
            value={settings.weekStartsOn}
            onChange={e => updateSettings({ weekStartsOn: e.target.value as 'monday' | 'sunday' })}
            className="text-xs font-medium px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
        </SettingRow>
      </div>

      {/* About */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: mutedColor }}>About</h3>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: textColor }}>Trackr</p>
              <p className="text-[10px]" style={{ color: mutedColor }}>v2.0.0 — React + Supabase + Tailwind</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
            background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
          }}>
            Stable
          </span>
        </div>
        <div className="pt-2 border-t" style={{ borderColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.05)' }}>
          <p className="text-[10px] leading-relaxed" style={{ color: mutedColor }}>
            Trackr is a personal tracker for water intake and expenses. It uses Supabase for persistent cloud storage
            and real-time sync, with graceful fallback to local data when not configured.
          </p>
        </div>
      </div>

      {/* Scriptable Widgets */}
      <div className="rounded-2xl p-5 glass" style={{ background: cardBg }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: mutedColor }}>iPhone Widgets</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-water flex items-center justify-center">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: textColor }}>Water Widget</p>
                <p className="text-[10px]" style={{ color: mutedColor }}>Hydration progress on your home screen</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: mutedColor }} />
          </div>
          <div className="flex items-center justify-between py-2 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-expense flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: textColor }}>Expense Widget</p>
                <p className="text-[10px]" style={{ color: mutedColor }}>Daily spend & category highlights</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: mutedColor }} />
          </div>
          <p className="text-[10px]" style={{ color: mutedColor }}>
            Copy scripts from <code className="px-1 py-0.5 rounded" style={{ background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)' }}>scriptable/</code> into the Scriptable app. Update <code className="px-1 py-0.5 rounded" style={{ background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)' }}>SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded" style={{ background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)' }}>SUPABASE_ANON_KEY</code> in each script.
          </p>
        </div>
      </div>
    </div>
  );
}
