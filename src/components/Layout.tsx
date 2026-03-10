import React, { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Briefcase,
  BarChart3,
  Menu,
  X,
  Wheat,
  Building2,
  Store,
  BookOpen,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSaveData: () => void;
  onLoadData: (file: File) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard & AI',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'production',
      label: 'PP BUMI MAS',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      id: 'direct_sales',
      label: 'Penjualan Langsung',
      icon: <Store className="w-5 h-5" />,
    },
    {
      id: 'trading',
      label: 'CV. Trading Makmur',
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      id: 'accounting',
      label: 'Pusat Akuntansi',
      icon: <BookOpen className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row font-sans text-stone-800">
      <div className="md:hidden glass-dark text-stone-50 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Wheat className="w-6 h-6" />
          <span className="font-bold text-lg">RiceFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside
        className={`glass-dark text-slate-100 w-full md:w-64 flex-shrink-0 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden'
          } md:block transition-all duration-300 z-40`}
      >
        <div className="p-6 hidden md:flex items-center space-x-2 border-b border-emerald-500/20 bg-transparent">
          <Wheat className="w-8 h-8 text-yellow-400" />
          <div>
            <span className="font-bold text-xl tracking-tight block leading-none text-stone-50">
              RiceFlow
            </span>
            <span className="text-[10px] text-amber-400/90 uppercase tracking-widest font-bold">
              Bumi Mas Group
            </span>
          </div>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                ? 'bg-emerald-500/40 text-white shadow-lg translate-x-1 backdrop-blur-md border border-emerald-400/30'
                : 'hover:bg-emerald-500/20 text-emerald-50 hover:translate-x-1'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
