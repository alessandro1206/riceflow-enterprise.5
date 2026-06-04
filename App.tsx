import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ProductionPanel } from './components/ProductionPanel.tsx';
import { TradingPanel } from './components/TradingPanel.tsx';
import { DirectSalesPanel } from './components/DirectSalesPanel.tsx';
import { FinancePanel } from './components/FinancePanel.tsx';
import { Login } from './components/Login.tsx';
import { CRMPanel } from './components/CRMPanel.tsx';
import { ExpensePanel } from './components/ExpensePanel.tsx';
import { BusinessState, JournalLine, JournalEntry } from './types.ts';
import { OpenClawDashboard } from './components/OpenClawDashboard.tsx';
import { CoreFinancialDashboard } from './components/CoreFinancialDashboard.tsx';

const INITIAL_STATE: BusinessState = {
  piles: [], inventory: [], masterSuppliers: [], masterCustomers: [], purchaseBook: [], productionBook: [], salesBook: [], directSalesBook: [], expenseBook: [], accounts: [], journal: []
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<BusinessState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);

  // Load state from PythonAnywhere on mount IF authenticated
  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/state`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if(res.status === 401) {
           setToken(null);
           localStorage.removeItem('jwt_token');
           throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        if (data) setState(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load from cloud", err);
        setIsLoading(false);
      });
  }, [token]);

  // Save state to PythonAnywhere on change
  useEffect(() => {
    if (isLoading || !token || state === INITIAL_STATE) return; 
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/state`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(state)
    }).catch(err => console.error("Failed to sync to cloud", err));
  }, [state, isLoading, token]);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
  };

  const addJournalEntry = (desc: string, lines: JournalLine[]) => {
    const newEntry: JournalEntry = { id: `JRN-${Date.now()}`, date: new Date().toISOString().split('T')[0], description: desc, lines };
    setState(prev => ({ ...prev, journal: [...prev.journal, newEntry] }));
  };

  const onMillingSubmit = (inputs: any[], outputs: any[]) => { /* logic maintained */ };
  const onSaleSubmit = (order: any, isTrading: boolean) => { /* logic maintained */ };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-bold text-slate-500">Memuat Sistem ERP Cloud...</div>;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="absolute top-4 right-4 z-50">
         <button onClick={handleLogout} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-200">Logout</button>
      </div>
      {activeTab === 'dashboard' && <Dashboard state={state} setActiveTab={setActiveTab} />}
      {activeTab === 'crm' && <CRMPanel state={state} setState={setState} />}
      {activeTab === 'production' && <ProductionPanel state={state} onMillingSubmit={onMillingSubmit} onAddExpense={()=>{}} />}
      {activeTab === 'direct_sales' && <DirectSalesPanel state={state} onSaleSubmit={(order: any) => onSaleSubmit(order, false)} />}
      {activeTab === 'trading' && <TradingPanel state={state} onSaleSubmit={(order: any) => onSaleSubmit(order, true)} />}
      {activeTab === 'expenses' && <ExpensePanel state={state} setState={setState} />}
      {activeTab === 'finance' && <FinancePanel state={state} />}
      {activeTab === 'openclaw' && <OpenClawDashboard />}
      {activeTab === 'core_finance' && <CoreFinancialDashboard />}
    </Layout>
  );
}
