import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ProductionPanel } from './components/ProductionPanel.tsx';
import { TradingPanel } from './components/TradingPanel.tsx';
import { DirectSalesPanel } from './components/DirectSalesPanel.tsx';
import { FinancePanel } from './components/FinancePanel.tsx';
import { BusinessState, JournalLine, JournalEntry } from './types.ts';

const INITIAL_STATE: BusinessState = {
  piles: [
    { id: 'A', currentWeight: 50000, type: 'GKG' }, 
    { id: 'B', currentWeight: 30000, type: 'GKG' }, 
    { id: 'C', currentWeight: 20000, type: 'GKP' },
    { id: 'D', currentWeight: 10000, type: 'GKG' }
  ], 
  inventory: [
    { id: 'p1', productName: 'Beras Premium', quantity: 0 },
    { id: 'p2', productName: 'Beras Medium', quantity: 0 },
    { id: 'p3', productName: 'Broken/Patah', quantity: 0 },
    { id: 'p4', productName: 'Menir', quantity: 0 },
    { id: 'p5', productName: 'Katul/Dedak', quantity: 0 }
  ], 
  masterSuppliers: [], 
  masterCustomers: [
    { id: 'c1', name: 'Distributor Jakarta Raya', code: 'DJR' },
    { id: 'c2', name: 'Toko Makmur Jaya', code: 'TMJ' },
    { id: 'cash', name: 'Penjualan Tunai Pabrik', code: 'CASH' }
  ], 
  purchaseBook: [], 
  productionBook: [], 
  salesBook: [],
  directSalesBook: [],
  expenseBook: [],
  accounts: [
    { code: '11001', name: 'Kas & Bank', type: 'ASSET' },
    { code: '12001', name: 'Persediaan Gabah', type: 'ASSET' },
    { code: '12002', name: 'Persediaan Beras Jadi', type: 'ASSET' },
    { code: '13001', name: 'Piutang Dagang', type: 'ASSET' },
    { code: '21001', name: 'Utang Dagang', type: 'LIABILITY' },
    { code: '41001', name: 'Pendapatan Jual Trading', type: 'REVENUE' },
    { code: '41002', name: 'Pendapatan Jual Langsung', type: 'REVENUE' },
    { code: '61001', name: 'Biaya Solar & Listrik', type: 'EXPENSE' }
  ], 
  journal: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<BusinessState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from PythonAnywhere on mount
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/state`)
      .then(res => res.json())
      .then(data => {
        if (data) setState(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load from cloud, using initial state", err);
        setIsLoading(false);
      });
  }, []);

  // Save state to PythonAnywhere on change
  useEffect(() => {
    if (isLoading) return; // Don't save back while still loading initial state
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(err => console.error("Failed to sync to cloud", err));
  }, [state, isLoading]);

  const addJournalEntry = (desc: string, lines: JournalLine[]) => {
    const newEntry: JournalEntry = {
      id: `JRN-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: desc,
      lines
    };
    setState(prev => ({ ...prev, journal: [...prev.journal, newEntry] }));
  };

  const onMillingSubmit = (inputs: any[], outputs: any[]) => {
    const totalInput = inputs.reduce((a, b) => a + b.weight, 0);
    const totalOutput = outputs.reduce((a, b) => a + b.weight, 0);
    const yieldPct = (totalOutput / totalInput) * 100;

    const record = {
      id: `MILL-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      inputs,
      outputs,
      totalInputWeight: totalInput,
      totalOutputWeight: totalOutput,
      yieldPercentage: yieldPct
    };

    setState(prev => {
      const newPiles = [...prev.piles];
      inputs.forEach(inp => {
        const idx = newPiles.findIndex(p => p.id === inp.pileId);
        if(idx !== -1) newPiles[idx].currentWeight -= inp.weight;
      });

      const newInv = [...prev.inventory];
      outputs.forEach(out => {
        const idx = newInv.findIndex(i => i.id === out.productId);
        if(idx !== -1) newInv[idx].quantity += out.weight;
      });

      return { ...prev, piles: newPiles, inventory: newInv, productionBook: [...prev.productionBook, record] };
    });

    addJournalEntry(`Produksi Giling: Mixing Pabrik`, [
      { accountId: '12002', debit: totalInput * 6000, credit: 0 },
      { accountId: '12001', debit: 0, credit: totalInput * 6000 }
    ]);
  };

  const onSaleSubmit = (order: any, isTrading: boolean) => {
    setState(prev => {
      const newInv = [...prev.inventory];
      order.items.forEach((item: any) => {
        const idx = newInv.findIndex(i => i.id === item.productId);
        if(idx !== -1) newInv[idx].quantity -= item.quantity;
      });
      
      return { 
        ...prev, 
        inventory: newInv, 
        salesBook: isTrading ? [...prev.salesBook, order] : prev.salesBook,
        directSalesBook: !isTrading ? [...prev.directSalesBook, order] : prev.directSalesBook
      };
    });

    addJournalEntry(`Penjualan ${isTrading ? 'Trading' : 'Langsung'} - ${order.customerName}`, [
      { accountId: order.isCredit ? '13001' : '11001', debit: order.totalValue, credit: 0 },
      { accountId: isTrading ? '41001' : '41002', debit: 0, credit: order.totalValue }
    ]);
  };

  if (isLoading) return <div style={{ padding: '20px' }}>Menghubungkan ke Cloud Database...</div>;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard state={state} setActiveTab={setActiveTab} />}
      {activeTab === 'production' && (
        <ProductionPanel 
          state={state} 
          onMillingSubmit={onMillingSubmit}
          onAddExpense={(cat: any, desc: any, amt: any, acc: any) => {
            addJournalEntry(`Biaya: ${desc}`, [{ accountId: acc, debit: amt, credit: 0 }, { accountId: '11001', debit: 0, credit: amt }]);
          }}
        />
      )}
      {activeTab === 'direct_sales' && <DirectSalesPanel state={state} onSaleSubmit={(order: any) => onSaleSubmit(order, false)} />}
      {activeTab === 'trading' && <TradingPanel state={state} onSaleSubmit={(order: any) => onSaleSubmit(order, true)} />}
      {activeTab === 'finance' && <FinancePanel state={state} />}
    </Layout>
  );
}
