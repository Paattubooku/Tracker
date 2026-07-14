import { useState, type ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Droplets, Wallet, LayoutDashboard, Settings, Sun, Moon,
  Menu, X, ChevronRight, CheckSquare
} from 'lucide-react';

type Page = 'dashboard' | 'water' | 'expenses' | 'todos' | 'settings';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

const navItems: { id: Page; label: string; icon: typeof Droplets }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'todos', label: 'Todos', icon: CheckSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { isDark, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const sidebarBg = isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.8)';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="min-h-screen surface-secondary theme-transition" style={{
      background: isDark
        ? 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 flex-col glass z-30"
        style={{ background: sidebarBg }}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: textColor }}>Trackr</h1>
              <p className="text-xs" style={{ color: mutedColor }}>Stay balanced</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'gradient-primary text-white shadow-lg shadow-primary-500/25'
                    : 'hover:bg-white/5'
                }`}
                style={!isActive ? { color: mutedColor } : undefined}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 m-3 mt-2 rounded-xl" style={{ background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.8)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-primary-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span className="text-sm font-medium" style={{ color: mutedColor }}>
                {isDark ? 'Dark' : 'Light'}
              </span>
            </div>
            <button
              onClick={toggle}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{ background: isDark ? '#4f46e5' : '#e2e8f0' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300"
                style={{ transform: isDark ? 'translateX(26px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 glass"
        style={{ background: sidebarBg }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: textColor }}>Trackr</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)' }}
            >
              {isDark ? <Moon className="w-4 h-4 text-primary-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)', color: textColor }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1">
            {navItems.map(item => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    isActive ? 'gradient-primary text-white' : ''
                  }`}
                  style={!isActive ? { color: mutedColor } : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass"
        style={{ background: sidebarBg }}>
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-primary-500' : ''
                }`}
                style={!isActive ? { color: isDark ? '#64748b' : '#94a3b8' } : undefined}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
