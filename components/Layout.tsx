
import React, { ReactNode, useState } from 'react';
import { Factory, Briefcase, BarChart3, Menu, X, Wheat, Download, Upload, Wallet, Building2, HardDrive, ArrowRightLeft, Monitor, Info, FileCode, FolderTree, Store } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInstallCenter, setShowInstallCenter] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & AI', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'production', label: 'PP BUMI MAS', icon: <Building2 className="w-5 h-5" /> }, 
    { id: 'direct_sales', label: 'Penjualan Langsung', icon: <Store className="w-5 h-5" /> },
    { id: 'trading', label: 'CV. Trading Makmur', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'finance', label: 'Jurnal Keuangan', icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-emerald-700 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Wheat className="w-6 h-6" />
          <span className="font-bold text-lg">RiceFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        bg-emerald-900 text-slate-100 w-full md:w-64 flex-shrink-0 flex flex-col
        ${isMobileMenuOpen ? 'block' : 'hidden'} md:block
        transition-all duration-300 shadow-xl z-40
      `}>
        <div className="p-6 hidden md:flex items-center space-x-2 border-b border-emerald-800 bg-emerald-950">
          <Wheat className="w-8 h-8 text-yellow-400" />
          <div>
            <span className="font-bold text-xl tracking-tight block leading-none text-white">RiceFlow</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Bumi Mas Group</span>
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-emerald-600 text-white shadow-lg translate-x-1' 
                  : 'hover:bg-emerald-800 text-emerald-100 hover:translate-x-1'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-emerald-950 border-t border-emerald-800">
           <button 
             onClick={() => setShowInstallCenter(true)}
             className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-xs shadow-lg"
           >
             <Monitor className="w-4 h-4" />
             <span>PANDUAN OFFLINE</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
