import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProductionPanel } from './components/ProductionPanel';
import { TradingPanel } from './components/TradingPanel';
import { DirectSalesPanel } from './components/DirectSalesPanel';
import { AccountingPanel } from './components/AccountingPanel';
import { PricePanel } from './components/PricePanel';
import { SignPanel } from './components/SignPanel';
import { Login } from './components/Login';

const INITIAL_STATE = {
  piles: [
    { id: 'A', currentWeight: 50000, type: 'GKG' },
    { id: 'B', currentWeight: 30000, type: 'GKG' },
    { id: 'C', currentWeight: 20000, type: 'GKP' },
    { id: 'D', currentWeight: 10000, type: 'GKG' },
  ],
  inventory: [
    { id: 'p1', productName: 'Beras Premium', quantity: 0, price: 12500 },
    { id: 'p2', productName: 'Beras Medium', quantity: 0, price: 11000 },
    { id: 'p3', productName: 'Broken/Patah', quantity: 0, price: 9000 },
    { id: 'p4', productName: 'Menir', quantity: 0, price: 7500 },
    { id: 'p5', productName: 'Katul/Dedak', quantity: 0, price: 5000 },
  ],
  masterSuppliers: [],
  masterCustomers: [
    { id: 'c1', name: 'Distributor Jakarta Raya', code: 'DJR' },
    { id: 'c2', name: 'Toko Makmur Jaya', code: 'TMJ' },
    { id: 'cash', name: 'Penjualan Tunai Pabrik', code: 'CASH' },
  ],
  purchaseBook: [],
  productionBook: [],
  salesBook: [],
  directSalesBook: [],
  expenseBook: [],
  // FULL CHART OF ACCOUNTS
  accounts: [
    { code: '11001', name: 'Kas & Bank', type: 'ASSET' },
    { code: '12001', name: 'Persediaan Gabah', type: 'ASSET' },
    { code: '12002', name: 'Persediaan Beras Jadi', type: 'ASSET' },
    { code: '13001', name: 'Piutang Dagang', type: 'ASSET' },
    { code: '21001', name: 'Utang Dagang', type: 'LIABILITY' },
    { code: '31001', name: 'Modal Pemilik', type: 'EQUITY' },
    { code: '41001', name: 'Pendapatan Jual Trading', type: 'REVENUE' },
    { code: '41002', name: 'Pendapatan Jual Langsung', type: 'REVENUE' },
    { code: '61001', name: 'Biaya Solar & Listrik', type: 'EXPENSE' },
    { code: '61002', name: 'Biaya Gaji Borongan', type: 'EXPENSE' },
    { code: '61003', name: 'Biaya Perawatan Mesin', type: 'EXPENSE' },
  ],
  journal: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('riceflow_auth') === 'true';
  });
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('riceflow_v13_closing');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // --- THE CLOUD CONNECTION ---
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchCloudData = async () => {
      try {
        const response = await fetch(
          'https://sabrent.pythonanywhere.com/api/hq/dashboard'
        );
        const cloudData = await response.json();

        setState((prevState: any) => {
          const updatedInventory = prevState.inventory.map((item: any) => {
            const cloudItem = cloudData.inventory.find(
              (ci: any) => ci.item_name === item.productName
            );
            return cloudItem ? { ...item, quantity: cloudItem.qty_kg } : item;
          });
          return { ...prevState, inventory: updatedInventory };
        });
      } catch (error) {
        console.error('Failed to connect to RiceFlow Cloud:', error);
      }
    };

    fetchCloudData();
    const interval = setInterval(fetchCloudData, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('riceflow_v13_closing', JSON.stringify(state));
  }, [state]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('riceflow_auth', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('riceflow_auth');
  };

  // --- ACCOUNTING AUTOMATION ENGINE ---
  const addJournalEntry = (desc: string, lines: any[]) => {
    const newEntry = {
      id: `JRN-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: desc,
      lines,
    };
    setState((prev: any) => ({
      ...prev,
      journal: [...prev.journal, newEntry],
    }));
  };

  const onYearEndClose = (
    directRev: number,
    tradingRev: number,
    expenses: number,
    netIncome: number
  ) => {
    // Memindahkan Laba ke Modal Pemilik
    addJournalEntry(
      `Tutup Buku Akhir Tahun (Laba Bersih: Rp ${netIncome.toLocaleString()})`,
      [
        { accountId: '41002', debit: directRev, credit: 0 },
        { accountId: '41001', debit: tradingRev, credit: 0 },
        { accountId: '61001', debit: 0, credit: expenses },
        { accountId: '31001', debit: 0, credit: netIncome },
      ]
    );
  };

  const onMillingSubmit = (inputs: any[], outputs: any[]) => {
    const totalInput = inputs.reduce((a, b) => a + b.weight, 0);
    const totalOutput = outputs.reduce((a, b) => a + b.weight, 0);
    const record = {
      id: `MILL-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      inputs,
      outputs,
      totalInputWeight: totalInput,
      totalOutputWeight: totalOutput,
      yieldPercentage: (totalOutput / totalInput) * 100,
    };

    setState((prev: any) => {
      const newPiles = [...prev.piles];
      inputs.forEach((inp) => {
        const idx = newPiles.findIndex((p) => p.id === inp.pileId);
        if (idx !== -1) newPiles[idx].currentWeight -= inp.weight;
      });
      const newInv = [...prev.inventory];
      outputs.forEach((out) => {
        const idx = newInv.findIndex((i) => i.id === out.productId);
        if (idx !== -1) newInv[idx].quantity += out.weight;
      });
      return {
        ...prev,
        piles: newPiles,
        inventory: newInv,
        productionBook: [...prev.productionBook, record],
      };
    });

    // Otomatis Jurnal Persediaan
    addJournalEntry(`Produksi Giling: Mixing Pabrik`, [
      { accountId: '12002', debit: totalInput * 6000, credit: 0 },
      { accountId: '12001', debit: 0, credit: totalInput * 6000 },
    ]);
  };

  const onAddExpense = (expense: any) => {
    setState((prev: any) => ({
      ...prev,
      expenseBook: [
        ...prev.expenseBook,
        {
          ...expense,
          id: `EXP-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
        },
      ],
    }));

    addJournalEntry(`Buku Biaya: ${expense.desc}`, [
      { accountId: expense.cat, debit: expense.amount, credit: 0 },
      { accountId: '11001', debit: 0, credit: expense.amount },
    ]);
  };

  const onSaleSubmit = (order: any, isTrading: boolean) => {
    setState((prev: any) => {
      const newInv = [...prev.inventory];
      order.items.forEach((item: any) => {
        const idx = newInv.findIndex((i) => i.id === item.productId);
        if (idx !== -1) newInv[idx].quantity -= item.quantity;
      });
      return {
        ...prev,
        inventory: newInv,
        salesBook: isTrading ? [...prev.salesBook, order] : prev.salesBook,
        directSalesBook: !isTrading
          ? [...prev.directSalesBook, order]
          : prev.directSalesBook,
      };
    });

    // Otomatis Jurnal Pendapatan
    addJournalEntry(
      `Penjualan ${isTrading ? 'Trading Luar Pulau' : 'Langsung Ritel'} - ${order.customerName
      }`,
      [
        {
          accountId: order.isCredit ? '13001' : '11001',
          debit: order.totalValue,
          credit: 0,
        },
        {
          accountId: isTrading ? '41001' : '41002',
          debit: 0,
          credit: order.totalValue,
        },
      ]
    );
  };

  const onUpdatePrice = (productId: string, newPrice: number) => {
    setState((prev: any) => {
      const newInv = prev.inventory.map((item: any) => 
        item.id === productId ? { ...item, price: newPrice } : item
      );
      return { ...prev, inventory: newInv };
    });
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onSaveData={() => { }}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <Dashboard state={state} setActiveTab={setActiveTab} />
      )}
      {activeTab === 'production' && (
        <ProductionPanel
          state={state}
          onMillingSubmit={onMillingSubmit}
          onAddExpense={onAddExpense}
        />
      )}
      {activeTab === 'direct_sales' && (
        <DirectSalesPanel
          state={state}
          onSaleSubmit={(order: any) => onSaleSubmit(order, false)}
        />
      )}
      {activeTab === 'trading' && (
        <TradingPanel
          state={state}
          onSaleSubmit={(order: any) => onSaleSubmit(order, true)}
        />
      )}
      {activeTab === 'prices' && (
        <PricePanel state={state} onUpdatePrice={onUpdatePrice} />
      )}
      {activeTab === 'sign' && (
        <SignPanel />
      )}
      {activeTab === 'accounting' && (
        <AccountingPanel state={state} onYearEndClose={onYearEndClose} />
      )}
    </Layout>
  );
}
