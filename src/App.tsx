import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProductionPanel } from './components/ProductionPanel';
import { TradingPanel } from './components/TradingPanel';
import { DirectSalesPanel } from './components/DirectSalesPanel';
import { AccountingPanel } from './components/AccountingPanel';
import { PricePanel } from './components/PricePanel';
import { UserManagementPanel } from './components/UserManagementPanel';
import { Login } from './components/Login';
import { WeighbridgePanel } from './components/WeighbridgePanel';
import { PurchasingBook } from './components/PurchasingBook';
import { FinanceDashboard } from './components/FinanceDashboard';
import { CalendarPanel } from './components/CalendarPanel';

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
  schedules: [], // Deprecated in favor of custom tickets / tickets
  tickets: [], // Master list for Weighbridge and Finance
  userList: [
    { username: 'admin', password: 'admin123', name: 'Admin', role: 'Admin' },
    { username: 'erfi', password: 'operator123', name: 'Erfi', role: 'Operator' },
    { username: 'emak', password: 'finance123', name: 'Emak', role: 'Finance' },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('riceflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('riceflow_auth') === 'true';
  });
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('riceflow_v13_closing');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure userList exists (for backward compatibility with old local storage)
      if (!parsed.userList) {
        parsed.userList = INITIAL_STATE.userList;
      }
      return parsed;
    }
    return INITIAL_STATE;
  });

  // --- THE CLOUD CONNECTION ---
  useEffect(() => {
    // Fetch users (available even if not logged in for the login screen)
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://sabrent.pythonanywhere.com/api/auth/users');
        if (response.ok) {
          const cloudUsers = await response.json();
          setState((prev: any) => ({ ...prev, userList: cloudUsers }));
        }
      } catch (error) {
        console.error('Failed to fetch user list from cloud:', error);
      }
    };
    fetchUsers();

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

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('riceflow_auth', 'true');
    localStorage.setItem('riceflow_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('riceflow_auth');
    localStorage.removeItem('riceflow_user');
  };

  const onAddUser = async (userData: any) => {
    // Always update local state first for responsiveness and offline support
    setState((prev: any) => ({
      ...prev,
      userList: [...prev.userList, userData]
    }));

    try {
      const response = await fetch('https://sabrent.pythonanywhere.com/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        console.warn('Gagal sinkron user baru ke cloud (Cloud Offline).');
      }
    } catch (e) {
      console.warn('Error koneksi cloud saat menambah user (Cloud Offline).');
    }
  };

  const onRemoveUser = async (username: string) => {
    // Always update local state first
    setState((prev: any) => ({
      ...prev,
      userList: prev.userList.filter((u: any) => u.username !== username)
    }));

    try {
      const response = await fetch(`https://sabrent.pythonanywhere.com/api/auth/users/${username}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.warn('Gagal menghapus user dari cloud (Cloud Offline).');
      }
    } catch (e) {
      console.warn('Error koneksi cloud saat menghapus user (Cloud Offline).');
    }
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
          id: expense.id || `EXP-${Date.now()}`,
          date: expense.date || new Date().toISOString().split('T')[0],
        },
      ],
    }));

    if (expense.lines) {
      const debitLines = expense.lines.map((l: any) => ({
        accountId: l.accountId,
        debit: l.amount,
        credit: 0
      }));
      addJournalEntry(`Kas Keluar: ${expense.desc} (${expense.id || 'Manual'})`, [
        ...debitLines,
        { accountId: expense.sourceAccount || '11001', debit: 0, credit: expense.amount },
      ]);
    } else {
      addJournalEntry(`Buku Biaya: ${expense.desc}`, [
        { accountId: expense.cat, debit: expense.amount, credit: 0 },
        { accountId: '11001', debit: 0, credit: expense.amount },
      ]);
    }
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
  
  const onAddSchedule = (schedule: any) => {
    setState((prev: any) => ({
      ...prev,
      schedules: [...prev.schedules, { ...schedule, id: `S${Date.now()}` }]
    }));
  };

  const onDeleteSchedule = (id: string) => {
    setState((prev: any) => ({
      ...prev,
      schedules: prev.schedules.filter((s: any) => s.id !== id)
    }));
  };

  // --- WEIGHBRIDGE & FINANCE ACTIONS ---
  const onOpenTicket = (ticketData: any) => {
    setState((prev: any) => ({
      ...prev,
      tickets: [...(prev.tickets || []), { ...ticketData, id: ticketData.id || `TRK-${Date.now()}` }]
    }));
  };

  const onCloseTicket = (ticketId: string, closeData: any) => {
    setState((prev: any) => {
      // Find the ticket being closed to get its netWeight and pile assignment
      const ticketToClose = prev.tickets?.find((t: any) => t.id === ticketId);
      
      // Update the specific Pile (Tumpukan) weight
      let newPiles = prev.piles ? [...prev.piles] : [];
      if (ticketToClose && ticketToClose.pile && closeData.netWeight) {
        newPiles = newPiles.map((p: any) => 
          p.id === ticketToClose.pile 
            ? { ...p, currentWeight: p.currentWeight + closeData.netWeight } 
            : p
        );
      }

      return {
        ...prev,
        piles: newPiles,
        tickets: (prev.tickets || []).map((t: any) =>
          t.id === ticketId ? { ...t, ...closeData, status: 'CLOSED' } : t
        )
      };
    });
  };

  const onUpdateTicketFinancials = (ticketId: string, financials: any) => {
    setState((prev: any) => ({
      ...prev,
      tickets: (prev.tickets || []).map((t: any) =>
        t.id === ticketId ? { ...t, ...financials } : t
      )
    }));
  };

  const onMarkPaid = (ticketId: string) => {
    setState((prev: any) => {
      const ticket = prev.tickets?.find((t:any) => t.id === ticketId);
      if (ticket) {
        const totalAmount = (ticket.netWeight || 0) * (ticket.price || 0);
        // Automatically log the Final Entry to the Journal
        // Debiting Persediaan Gabah (increasing inventory value) and Crediting Kas & Bank (decreasing cash)
        const newEntry = {
          id: `JRN-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: `Pembayaran Lunas: Tagihan ${ticket.supplierName} (Tiket ${ticket.id})`,
          lines: [
            { accountId: '12001', debit: totalAmount, credit: 0 },
            { accountId: '11001', debit: 0, credit: totalAmount }
          ]
        };
        
        return {
          ...prev,
          journal: [...(prev.journal || []), newEntry],
          tickets: (prev.tickets || []).map((t: any) =>
            t.id === ticketId ? { ...t, paid: true, paidDate: new Date().toISOString().split('T')[0] } : t
          )
        };
      }
      return prev;
    });
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'dashboard_full') {
      setState((prev: any) => ({ ...prev, showFullAnalysis: true }));
      setActiveTab('dashboard');
    } else if (tab === 'dashboard_brief') {
      setState((prev: any) => ({ ...prev, showFullAnalysis: false }));
      setActiveTab('dashboard');
    } else {
      setActiveTab(tab);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} userList={state.userList} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      onSaveData={() => { }}
      onLogout={handleLogout}
      user={user}
    >
      {activeTab === 'dashboard' && (
        <Dashboard state={state} setActiveTab={handleTabChange} user={user} />
      )}
      {activeTab === 'weighbridge' && (
        <WeighbridgePanel 
          state={state} 
          onOpenTicket={onOpenTicket}
          onCloseTicket={onCloseTicket}
        />
      )}
      {activeTab === 'finance_dashboard' && (
        <FinanceDashboard 
          state={state} 
          onMarkPaid={onMarkPaid}
        />
      )}
      {activeTab === 'purchasing_book' && (
        <PurchasingBook 
          state={state} 
          onUpdateTicketFinancials={onUpdateTicketFinancials}
        />
      )}
      {activeTab === 'calendar' && (
        <CalendarPanel 
          state={state} 
          onOpenTicket={onOpenTicket}
          onCloseTicket={onCloseTicket}
          onUpdateTicketFinancials={onUpdateTicketFinancials}
        />
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
          onAddSchedule={onAddSchedule}
          onDeleteSchedule={onDeleteSchedule}
        />
      )}
      {activeTab === 'prices' && (
        <PricePanel state={state} onUpdatePrice={onUpdatePrice} />
      )}
      {activeTab === 'accounting' && (
        <AccountingPanel 
          state={state} 
          onYearEndClose={onYearEndClose} 
          onAddExpense={onAddExpense}
        />
      )}
      {activeTab === 'settings' && (
        <UserManagementPanel 
          userList={state.userList} 
          onAddUser={onAddUser} 
          onRemoveUser={onRemoveUser} 
        />
      )}
    </Layout>
  );
}
