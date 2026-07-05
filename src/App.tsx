import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WaterTracker from './components/WaterTracker';
import ExpenseTracker from './components/ExpenseTracker';
import Settings from './components/Settings';

type Page = 'dashboard' | 'water' | 'expenses' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setCurrentPage(page)} />;
      case 'water':
        return <WaterTracker />;
      case 'expenses':
        return <ExpenseTracker />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={(page) => setCurrentPage(page)} />;
    }
  };

  return (
    <ThemeProvider>
      <DataProvider>
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          {renderPage()}
        </Layout>
      </DataProvider>
    </ThemeProvider>
  );
}
