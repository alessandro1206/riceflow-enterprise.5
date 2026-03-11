import React, { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Briefcase,
  BarChart3,
  Menu,
  X,
  Building2,
  Store,
  BookOpen,
  Tag,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSaveData: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onLogout,
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
      id: 'prices',
      label: 'Daftar Harga',
      icon: <Tag className="w-5 h-5" />,
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
          <img src="/weighbridge_icon.png" alt="Icon" className="w-8 h-8 rounded-lg border border-white/20 shadow-lg" />
          <span className="font-black text-lg tracking-tight">RiceFlow <span className="text-amber-400">Enterprise</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside
        className={`glass-dark text-slate-100 w-full md:w-72 flex-shrink-0 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden'
          } md:block transition-all duration-500 z-40 enterprise-shadow`}
      >
        <div className="p-8 hidden md:flex items-center space-x-3 border-b border-white/5">
          <div className="relative">
            <img src="/weighbridge_icon.png" alt="Logo" className="w-12 h-12 rounded-2xl shadow-2xl border border-white/10" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#064E3B] flex items-center justify-center">
              <ShieldCheck className="w-2 h-2 text-white" />
            </div>
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter block leading-none text-white">
              RiceFlow <span className="text-amber-400">Enterprise</span>
            </span>
            <span className="text-[9px] text-emerald-400/80 uppercase tracking-[0.2em] font-black mt-1 block">
              BUMI MAS INFRASTRUCTURE
            </span>
          </div>
        </div>

        <nav className="flex-1 mt-8 px-6 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-[20px] transition-all duration-300 font-bold text-sm ${activeTab === item.id
                ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 text-white shadow-xl translate-x-1 border border-emerald-400/20 backdrop-blur-md'
                : 'hover:bg-white/5 text-emerald-100/60 hover:text-white hover:translate-x-1'
                }`}
            >
              <div className={`${activeTab === item.id ? 'text-amber-400' : 'text-emerald-500/50'}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-4 px-5 py-4 rounded-[20px] text-emerald-100/40 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto h-screen relative custom-scrollbar">
        <div className="max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
