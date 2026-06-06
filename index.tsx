
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as Lucide from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

const API_BASE = 'https://sabrent.pythonanywhere.com';

// --- KONFIGURASI AKUNTANSI (CHART OF ACCOUNTS) ---
const COA = [
  { code: '11001', name: 'Kas & Bank', type: 'ASSET' },
  { code: '12001', name: 'Persediaan Gabah', type: 'ASSET' },
  { code: '12002', name: 'Persediaan Beras Jadi', type: 'ASSET' },
  { code: '13001', name: 'Piutang Dagang', type: 'ASSET' },
  { code: '21001', name: 'Utang Dagang (Petani)', type: 'LIABILITY' },
  { code: '31001', name: 'Modal Pemilik', type: 'EQUITY' },
  { code: '41001', name: 'Pendapatan Penjualan', type: 'REVENUE' },
  { code: '51001', name: 'HPP (Harga Pokok Penjualan)', type: 'EXPENSE' },
  { code: '61001', name: 'Biaya Listrik & Solar', type: 'EXPENSE' },
  { code: '61002', name: 'Biaya Gaji Borongan', type: 'EXPENSE' },
  { code: '61003', name: 'Biaya Perawatan Mesin', type: 'EXPENSE' }
];

const INITIAL_STATE = {
  piles: [
    { id: 'A', currentWeight: 10000, type: 'GKG' }, 
    { id: 'B', currentWeight: 15000, type: 'GKG' }, 
    { id: 'C', currentWeight: 8000, type: 'GKP' },
    { id: 'D', currentWeight: 5000, type: 'GKG' },
    { id: 'E', currentWeight: 12000, type: 'GKG' }
  ],
  inventory: [
    { id: 'p1', name: 'Beras Premium (Kepala)', quantity: 0, unit: 'kg' },
    { id: 'p2', name: 'Beras Medium', quantity: 0, unit: 'kg' },
    { id: 'p3', name: 'Broken (Patah)', quantity: 0, unit: 'kg' },
    { id: 'p4', name: 'Menir', quantity: 0, unit: 'kg' },
    { id: 'p5', name: 'Katul / Dedak', quantity: 0, unit: 'kg' }
  ],
  masterSuppliers: [],
  masterCustomers: [],
  purchaseBook: [],
  productionBook: [],
  salesBook: [],
  expenseBook: [],
  journal: [],
  accounts: COA
};

const fCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

// --- LAYOUT ---
const Layout = ({ children, activeTab, setActiveTab }: any) => (
  <div className="min-h-screen bg-[#f4f7f6] flex flex-col md:flex-row font-sans selection:bg-emerald-200">
    <aside className="w-full md:w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 text-slate-800 flex flex-col z-50 soft-shadow">
      <div className="p-8 flex items-center space-x-4 border-b border-slate-100">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200">
          <Lucide.Wheat className="text-white w-7 h-7" />
        </div>
        <div>
          <h1 className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-900 to-emerald-600">RiceFlow</h1>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">BUMI MAS GROUP</p>
        </div>
      </div>
      <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
          <Lucide.LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>
        <div className="pt-8 pb-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operasional</div>
        <button onClick={() => setActiveTab('production')} className={`w-full flex items-center space-x-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === 'production' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
          <Lucide.Building2 className="w-5 h-5" />
          <span>PP BUMI MAS</span>
        </button>
        <button onClick={() => setActiveTab('trading')} className={`w-full flex items-center space-x-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === 'trading' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
          <Lucide.ShoppingCart className="w-5 h-5" />
          <span>Penjualan</span>
        </button>
        <button onClick={() => setActiveTab('accounting')} className={`w-full flex items-center space-x-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === 'accounting' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
          <Lucide.BookOpen className="w-5 h-5" />
          <span>Pusat Akuntansi</span>
        </button>
        <div className="pt-8 pb-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keuangan & AI</div>
        <button onClick={() => setActiveTab('core_finance')} className={`w-full flex items-center space-x-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === 'core_finance' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
          <Lucide.Banknote className="w-5 h-5" />
          <span>CoreTax Finance</span>
        </button>
        <button onClick={() => setActiveTab('ask-riceflow')} className={`w-full flex items-center space-x-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === 'ask-riceflow' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
          <Lucide.Bot className="w-5 h-5" />
          <span>Ask RiceFlow AI</span>
        </button>
        <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center space-x-3 p-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === 'payments' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'}`}>
          <Lucide.AlarmClock className="w-5 h-5" />
          <span>Tagihan & Reorder</span>
        </button>
      </nav>
      <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100">
         <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
               <Lucide.User className="w-5 h-5 text-slate-500" />
            </div>
            <div>
               <p className="font-bold text-sm text-slate-800">Admin Utama</p>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</p>
            </div>
         </div>
      </div>
    </aside>
    <main className="flex-1 overflow-y-auto h-screen p-4 md:p-10">{children}</main>
  </div>
);

// --- DASHBOARD ---
const Dashboard = ({ state }: any) => {
  const totalGabah = state.piles.reduce((acc: number, p: any) => acc + p.currentWeight, 0);
  const totalBeras = state.inventory.reduce((acc: number, i: any) => acc + i.quantity, 0);
  
  const getBalance = (code: string) => {
    return state.journal.reduce((acc: number, j: any) => {
        return acc + j.lines.reduce((lacc: number, l: any) => {
            if (l.accountId === code) return l.debit - l.credit;
            return 0;
        }, 0);
    }, 0);
  };

  const totalRevenue = Math.abs(getBalance('41001'));
  const totalExpenses = state.accounts.filter((a: any) => a.type === 'EXPENSE')
    .reduce((acc: number, a: any) => acc + Math.abs(getBalance(a.code)), 0);

  const stats = [
    { label: 'Kas & Bank', value: fCurrency(getBalance('11001')), icon: <Lucide.Wallet className="text-blue-500 w-6 h-6" /> },
    { label: 'Piutang Jual', value: fCurrency(getBalance('13001')), icon: <Lucide.ArrowUpCircle className="text-emerald-500 w-6 h-6" /> },
    { label: 'Total Gabah', value: `${(totalGabah/1000).toFixed(1)} Ton`, icon: <Lucide.Layers className="text-amber-500 w-6 h-6" /> },
    { label: 'Stok Beras', value: `${(totalBeras/1000).toFixed(1)} Ton`, icon: <Lucide.Package className="text-indigo-500 w-6 h-6" /> }
  ];

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen RiceFlow</h2>
        <p className="text-sm font-bold text-slate-500 mt-1">Monitoring Multicompany Real-time</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`bg-white p-6 rounded-3xl border border-slate-100 soft-shadow hover-lift flex items-center justify-between stagger-${(i%3)+1} animate-fade-up`}>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">{s.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PP BUMI MAS (OPERASIONAL) ---
const ProductionPanel = ({ state, setState }: any) => {
  const [tab, setTab] = useState('timbangan');
  
  // State Baru Giling Multiple Input & Output
  const [millInputs, setMillInputs] = useState([{ pileId: 'A', weight: 0 }]);
  const [millOutputs, setMillOutputs] = useState([{ productId: 'p1', weight: 0 }]);
  
  const [wb, setWb] = useState({ plate: '', sup: '', gross: 0, tare: 0, price: 6000, pile: 'A' });
  const [exp, setExp] = useState({ desc: '', amount: 0, cat: '61001' });

  const addJournal = (desc: string, lines: any[]) => {
    const entry = {
        id: `JRN-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: desc,
        lines
    };
    setState((prev: any) => ({ ...prev, journal: [...prev.journal, entry] }));
  };

  const handleTimbangan = () => {
    const net = wb.gross - wb.tare;
    if (net <= 0) return alert("Netto tidak valid!");
    const total = net * wb.price;

    setState((prev: any) => ({
      ...prev,
      piles: prev.piles.map((p: any) => p.id === wb.pile ? { ...p, currentWeight: p.currentWeight + net } : p),
      purchaseBook: [...prev.purchaseBook, { ...wb, id: Date.now(), net, total, date: new Date().toISOString().split('T')[0] }]
    }));

    addJournal(`Buku Beli: Gabah ${wb.plate} - ${wb.sup}`, [
      { accountId: '12001', debit: total, credit: 0 },
      { accountId: '21001', debit: 0, credit: total }
    ]);

    setWb({ plate: '', sup: '', gross: 0, tare: 0, price: 6000, pile: 'A' });
    alert("Gabah Masuk Tercatat!");
  };

  const handleGilingMixing = () => {
    const totalInput = millInputs.reduce((acc, cur) => acc + cur.weight, 0);
    const totalOutput = millOutputs.reduce((acc, cur) => acc + cur.weight, 0);

    if (totalInput <= 0) return alert("Input giling tidak boleh kosong!");
    if (totalOutput <= 0) return alert("Output giling tidak boleh kosong!");

    // Validasi stok tumpukan
    for (const input of millInputs) {
        const pile = state.piles.find((p: any) => p.id === input.pileId);
        if (!pile || pile.currentWeight < input.weight) {
            return alert(`Stok Tumpukan ${input.pileId} tidak cukup!`);
        }
    }

    setState((prev: any) => {
        const newPiles = [...prev.piles];
        const newInventory = [...prev.inventory];

        // Kurangi Stok Gabah (Multiple Piles)
        millInputs.forEach(inp => {
            const idx = newPiles.findIndex(p => p.id === inp.pileId);
            newPiles[idx] = { ...newPiles[idx], currentWeight: newPiles[idx].currentWeight - inp.weight };
        });

        // Tambah Stok Beras (Multiple Products)
        millOutputs.forEach(out => {
            const idx = newInventory.findIndex(p => p.id === out.productId);
            newInventory[idx] = { ...newInventory[idx], quantity: newInventory[idx].quantity + out.weight };
        });

        return {
            ...prev,
            piles: newPiles,
            inventory: newInventory,
            productionBook: [...prev.productionBook, { 
                id: Date.now(), 
                inputs: millInputs, 
                outputs: millOutputs, 
                totalInput, 
                totalOutput, 
                date: new Date().toISOString().split('T')[0] 
            }]
        };
    });

    // AKUNTANSI: Dr Persediaan Beras Jadi, Cr Persediaan Gabah
    // Nilai estimasi: total input x 6000 (biaya rata-rata gabah)
    const totalValue = totalInput * 6000;
    addJournal(`Buku Produksi: Giling Mixing (${millInputs.length} Pile)`, [
        { accountId: '12002', debit: totalValue, credit: 0 },
        { accountId: '12001', debit: 0, credit: totalValue }
    ]);

    alert("Proses Giling Mixing Berhasil!");
    setMillInputs([{ pileId: 'A', weight: 0 }]);
    setMillOutputs([{ productId: 'p1', weight: 0 }]);
  };

  const handleExpense = () => {
    if(!exp.amount || !exp.desc) return alert("Data biaya tidak lengkap!");
    setState((prev: any) => ({
      ...prev,
      expenseBook: [...prev.expenseBook, { ...exp, id: Date.now(), date: new Date().toISOString().split('T')[0] }]
    }));
    addJournal(`Buku Biaya: ${exp.desc}`, [
      { accountId: exp.cat, debit: exp.amount, credit: 0 },
      { accountId: '11001', debit: 0, credit: exp.amount }
    ]);
    setExp({ desc: '', amount: 0, cat: '61001' });
    alert("Biaya Operasional Tercatat!");
  };

  return (
    <div className="space-y-6">
       <div className="flex bg-white p-1.5 rounded-2xl border w-fit shadow-sm overflow-x-auto no-scrollbar">
          {['timbangan', 'giling', 'biaya', 'stok'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${tab === t ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
              {t === 'giling' ? 'PROSES GILING (MIXING)' : t.toUpperCase()}
            </button>
          ))}
       </div>

       {tab === 'timbangan' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
               <h3 className="font-black text-slate-800 flex items-center text-lg"><Lucide.Scale className="mr-2 text-emerald-500" /> Timbangan Manual</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <input placeholder="Nama Petani / Supplier" className="w-full p-4 bg-slate-50 border rounded-2xl" value={wb.sup} onChange={e => setWb({...wb, sup: e.target.value})} />
                  </div>
                  <input placeholder="Nopol Truk" className="p-4 bg-slate-50 border rounded-2xl" value={wb.plate} onChange={e => setWb({...wb, plate: e.target.value.toUpperCase()})} />
                  <select className="p-4 bg-slate-50 border rounded-2xl font-bold" value={wb.pile} onChange={e => setWb({...wb, pile: e.target.value})}>
                     {state.piles.map((p: any) => <option key={p.id} value={p.id}>Pile {p.id}</option>)}
                  </select>
                  <input type="number" placeholder="Gross" className="p-4 bg-blue-50 border rounded-2xl font-black text-xl" value={wb.gross || ''} onChange={e => setWb({...wb, gross: Number(e.target.value)})} />
                  <input type="number" placeholder="Tare" className="p-4 bg-slate-50 border rounded-2xl font-black text-xl" value={wb.tare || ''} onChange={e => setWb({...wb, tare: Number(e.target.value)})} />
               </div>
               <button onClick={handleTimbangan} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-900">SIMPAN PENERIMAAN</button>
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm overflow-hidden flex flex-col">
               <h3 className="font-bold text-slate-700 mb-4 px-2">Log Penerimaan Terakhir</h3>
               <div className="flex-1 overflow-y-auto space-y-2 px-2">
                  {state.purchaseBook.slice().reverse().map((b: any) => (
                    <div key={b.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center">
                       <div><p className="font-black text-slate-800">{b.sup}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{b.date} • {b.plate}</p></div>
                       <p className="font-black text-emerald-600">{b.net.toLocaleString()} kg</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       )}

       {tab === 'giling' && (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 animate-fade-in">
             <div className="bg-white p-10 rounded-3xl border shadow-sm space-y-10">
                <div className="flex justify-between items-center border-b pb-6">
                   <div>
                      <h3 className="font-black text-slate-800 text-2xl">Form Giling (Mixing & Blending)</h3>
                      <p className="text-sm text-slate-500">Input tumpukan gabah dan hasil beras secara variatif.</p>
                   </div>
                   <div className="text-right bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Total Input Produksi</p>
                      <p className="text-3xl font-black text-amber-700">{millInputs.reduce((a,b)=>a+b.weight,0).toLocaleString()} <small className="text-xs">kg</small></p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   {/* BAGIAN INPUT GABAH (MIXING) */}
                   <div className="space-y-6">
                      <div className="flex justify-between items-center">
                         <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center">
                            <Lucide.Combine className="mr-2 w-4 h-4 text-emerald-500" /> Input Tumpukan (Max 15)
                         </h4>
                         <button onClick={() => setMillInputs([...millInputs, { pileId: 'A', weight: 0 }])} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-black hover:bg-emerald-200 flex items-center">
                            <Lucide.Plus className="w-3 h-3 mr-1" /> TAMBAH TUMPUKAN
                         </button>
                      </div>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {millInputs.map((inp, idx) => (
                           <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 animate-fade-in">
                              <select className="flex-1 p-3 bg-white border rounded-xl font-bold text-sm" value={inp.pileId} 
                                onChange={e => {
                                  const newIn = [...millInputs];
                                  newIn[idx].pileId = e.target.value;
                                  setMillInputs(newIn);
                                }}>
                                 {state.piles.map((p: any) => <option key={p.id} value={p.id}>Pile {p.id} (Sisa: {p.currentWeight} kg)</option>)}
                              </select>
                              <input type="number" placeholder="Qty kg" className="w-32 p-3 bg-white border rounded-xl font-black text-center" value={inp.weight || ''} 
                                onChange={e => {
                                  const newIn = [...millInputs];
                                  newIn[idx].weight = Number(e.target.value);
                                  setMillInputs(newIn);
                                }} />
                              <button onClick={() => setMillInputs(millInputs.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                 <Lucide.Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* BAGIAN HASIL BERAS (OUTPUT) */}
                   <div className="space-y-6 border-l lg:pl-12">
                      <div className="flex justify-between items-center">
                         <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center">
                            <Lucide.PackageOpen className="mr-2 w-4 h-4 text-blue-500" /> Hasil Produksi (Barang Jadi)
                         </h4>
                         <button onClick={() => setMillOutputs([...millOutputs, { productId: 'p1', weight: 0 }])} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-black hover:bg-blue-200 flex items-center">
                            <Lucide.Plus className="w-3 h-3 mr-1" /> TAMBAH PRODUK
                         </button>
                      </div>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {millOutputs.map((out, idx) => (
                           <div key={idx} className="flex items-center space-x-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 animate-fade-in">
                              <select className="flex-1 p-3 bg-white border rounded-xl font-bold text-sm" value={out.productId} 
                                onChange={e => {
                                  const newOut = [...millOutputs];
                                  newOut[idx].productId = e.target.value;
                                  setMillOutputs(newOut);
                                }}>
                                 {state.inventory.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                              </select>
                              <input type="number" placeholder="Qty kg" className="w-32 p-3 bg-white border rounded-xl font-black text-center text-blue-700" value={out.weight || ''} 
                                onChange={e => {
                                  const newOut = [...millOutputs];
                                  newOut[idx].weight = Number(e.target.value);
                                  setMillOutputs(newOut);
                                }} />
                              <button onClick={() => setMillOutputs(millOutputs.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                 <Lucide.Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                         ))}
                      </div>
                      
                      {/* Ringkasan Rendemen */}
                      <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase text-slate-400">Total Output Hasil</span>
                            <span className="font-black text-xl">{millOutputs.reduce((a,b)=>a+b.weight,0).toLocaleString()} kg</span>
                         </div>
                         <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <span className="text-[10px] font-black uppercase text-slate-400">Rendemen Giling</span>
                            <span className="text-3xl font-black text-emerald-400">
                               {millInputs.reduce((a,b)=>a+b.weight,0) > 0 ? ((millOutputs.reduce((a,b)=>a+b.weight,0) / millInputs.reduce((a,b)=>a+b.weight,0)) * 100).toFixed(1) : 0}%
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t flex justify-center">
                   <button onClick={handleGilingMixing} className="bg-slate-900 text-white px-20 py-5 rounded-2xl font-black text-xl hover:bg-emerald-900 shadow-2xl transform active:scale-95 transition-all">
                      POSTING PRODUKSI (TUTUP HARI)
                   </button>
                </div>
             </div>
          </div>
       )}

       {tab === 'biaya' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
               <h3 className="font-black text-slate-800 text-lg">Input Pengeluaran</h3>
               <div className="space-y-4">
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={exp.cat} onChange={e => setExp({...exp, cat: e.target.value})}>
                    <option value="61001">Listrik & Solar</option>
                    <option value="61002">Gaji Borongan</option>
                    <option value="61003">Perawatan Mesin</option>
                  </select>
                  <input placeholder="Keterangan" className="w-full p-4 border rounded-2xl" value={exp.desc} onChange={e => setExp({...exp, desc: e.target.value})} />
                  <input type="number" placeholder="Rp" className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl font-black text-xl" value={exp.amount || ''} onChange={e => setExp({...exp, amount: Number(e.target.value)})} />
                  <button onClick={handleExpense} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg">POSTING BIAYA</button>
               </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm overflow-hidden flex flex-col">
               <h3 className="font-bold text-slate-700 mb-4 px-2">Log Buku Biaya</h3>
               <div className="flex-1 overflow-y-auto space-y-3 px-2">
                  {state.expenseBook.slice().reverse().map((e: any) => (
                    <div key={e.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center">
                       <div><p className="font-black text-slate-800">{e.desc}</p><p className="text-[10px] text-slate-400 uppercase">{e.date}</p></div>
                       <p className="font-black text-red-600">-{fCurrency(e.amount)}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       )}

       {tab === 'stok' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {state.piles.map((p: any, i: number) => (
               <div key={p.id} className={`bg-white p-6 rounded-3xl border border-slate-100 soft-shadow hover-lift text-center stagger-${(i%3)+1} animate-fade-up`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pile {p.id}</p>
                  <p className="text-3xl font-black text-slate-800 mt-2">{p.currentWeight.toLocaleString()} <small className="text-sm font-bold text-slate-400">kg</small></p>
               </div>
             ))}
             {state.inventory.map((i: any, idx: number) => (
               <div key={i.id} className={`bg-gradient-to-b from-indigo-50/50 to-white p-6 rounded-3xl border border-indigo-100 soft-shadow hover-lift text-center stagger-${(idx%3)+1} animate-fade-up`}>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{i.name}</p>
                  <p className="text-3xl font-black text-indigo-900 mt-2">{i.quantity.toLocaleString()} <small className="text-sm font-bold text-indigo-400">kg</small></p>
               </div>
             ))}
          </div>
        )}
    </div>
  );
};

// --- TRADING & SURAT JALAN ---
const TradingPanel = ({ state, setState }: any) => {
  const [formData, setFormData] = useState({ 
    noSj: `SJ-${Date.now().toString().slice(-6)}`, 
    customer: '', 
    address: '', 
    expedition: '',
    handler: '',
    driver: '', 
    platNo: '', 
    items: [{ id: 1, name: 'Beras Premium', qty: 0, unit: 'Sak', weight: 25 }] 
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* HEADER */}
      <div className="p-8 bg-white border-b flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Surat Jalan Generator</h2>
          <p className="text-slate-500 font-bold mt-1">Buat dan cetak Surat Jalan pengiriman barang</p>
        </div>
        <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 transition-all flex items-center gap-2">
          <Lucide.Printer className="w-5 h-5" /> CETAK PDF
        </button>
      </div>

      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto print:p-0 print:block">
        {/* INPUT FORM */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6 print:hidden">
          <h3 className="font-black text-xl text-slate-800 border-b pb-4">Data Pengiriman</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">No. Surat Jalan</label>
              <input value={formData.noSj} onChange={e => setFormData({...formData, noSj: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Tanggal</label>
              <input value={new Date().toLocaleDateString('id-ID')} disabled className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Tujuan / Pelanggan Akhir</label>
              <input value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} placeholder="PT. Distributor Makmur" className="w-full p-4 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Alamat Pengiriman</label>
              <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Jl. Raya Perdagangan No. 123" className="w-full p-4 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Nama Ekspedisi</label>
              <input value={formData.expedition} onChange={e => setFormData({...formData, expedition: e.target.value})} placeholder="Karya Indah Cargo" className="w-full p-4 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Pengurus Ekspedisi</label>
              <input value={formData.handler} onChange={e => setFormData({...formData, handler: e.target.value})} placeholder="Pak Budi Ekspedisi" className="w-full p-4 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Nama Supir</label>
              <input value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} placeholder="Budi" className="w-full p-4 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Plat Nomor</label>
              <input value={formData.platNo} onChange={e => setFormData({...formData, platNo: e.target.value})} placeholder="B 1234 CD" className="w-full p-4 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-400 uppercase" />
            </div>
          </div>

          <h3 className="font-black text-xl text-slate-800 border-b pb-4 pt-4">Rincian Barang</h3>
          {formData.items.map((item, index) => (
            <div key={item.id} className="flex gap-4 items-center">
              <div className="flex-1">
                <input value={item.name} onChange={e => {
                  const newItems = [...formData.items];
                  newItems[index].name = e.target.value;
                  setFormData({...formData, items: newItems});
                }} className="w-full p-4 border border-slate-200 rounded-2xl font-bold" />
              </div>
              <div className="w-32">
                <input type="number" placeholder="Qty" value={item.qty || ''} onChange={e => {
                  const newItems = [...formData.items];
                  newItems[index].qty = Number(e.target.value);
                  setFormData({...formData, items: newItems});
                }} className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-center" />
              </div>
              <div className="w-24">
                <select value={item.unit} onChange={e => {
                  const newItems = [...formData.items];
                  newItems[index].unit = e.target.value;
                  setFormData({...formData, items: newItems});
                }} className="w-full p-4 border border-slate-200 rounded-2xl font-bold bg-slate-50">
                  <option value="Sak">Sak</option>
                  <option value="Ton">Ton</option>
                  <option value="Kg">Kg</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* PRINTABLE PREVIEW */}
        <div className="bg-white p-12 rounded-none shadow-2xl border flex-col aspect-[1/1.414] mx-auto w-full max-w-3xl transform scale-100 origin-top print:shadow-none print:border-none print:p-0">
          {/* KOP SURAT */}
          <div className="flex justify-between items-center border-b-4 border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                <Lucide.Wheat className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter">BUMI MAS GROUP</h1>
                <p className="text-sm font-bold text-slate-500">Pabrik Penggilingan Padi & Perdagangan Beras</p>
                <p className="text-xs text-slate-400">Jl. Raya Pantura KM 12, Jawa Tengah | Telp: (021) 555-0123</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-indigo-600 tracking-tighter border-2 border-indigo-600 px-4 py-2 rounded-xl inline-block transform -rotate-2">SURAT JALAN</h2>
            </div>
          </div>

          {/* META INFO */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase mb-1">Tujuan / Pelanggan:</p>
              <p className="text-lg font-black text-slate-800">{formData.customer || '_______________________'}</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{formData.address || '_______________________'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border">
              <div className="flex justify-between mb-2 border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-slate-500 uppercase">No. Dokumen</span>
                <span className="font-black text-slate-800">{formData.noSj}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase">Tanggal</span>
                <span className="font-black text-slate-800">{new Date().toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase">Ekspedisi</span>
                <span className="font-black text-slate-800">{formData.expedition || '-'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase">Pengurus</span>
                <span className="font-black text-slate-800">{formData.handler || '-'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase">Supir</span>
                <span className="font-black text-slate-800">{formData.driver || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-black text-slate-500 uppercase">Kendaraan</span>
                <span className="font-black text-slate-800">{formData.platNo || '-'}</span>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <table className="w-full mb-8">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-3 px-4 text-left font-black w-16">NO</th>
                <th className="py-3 px-4 text-left font-black">NAMA BARANG</th>
                <th className="py-3 px-4 text-center font-black w-32">QUANTITY</th>
                <th className="py-3 px-4 text-center font-black w-32">SATUAN</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={idx} className="border-b-2 border-slate-100">
                  <td className="py-4 px-4 font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-4 px-4 font-black text-slate-800 text-lg">{item.name}</td>
                  <td className="py-4 px-4 font-black text-center text-xl text-indigo-600">{item.qty || 0}</td>
                  <td className="py-4 px-4 font-bold text-center text-slate-500">{item.unit}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="py-4 px-4 font-black text-right text-slate-500 uppercase tracking-widest">Total Muatan</td>
                <td colSpan={2} className="py-4 px-4 font-black text-center text-xl bg-slate-50">
                  {formData.items.map(i => `${i.qty || 0} ${i.unit}`).join(' + ')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* SIGNATURES */}
          <div className="grid grid-cols-4 gap-4 mt-auto pt-16">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 mb-20">Pelanggan,</p>
              <p className="font-black text-slate-800 border-b-2 border-slate-800 inline-block px-4 w-full">( {formData.customer || '          '} )</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 mb-20">Pengurus Expedisi,</p>
              <p className="font-black text-slate-800 border-b-2 border-slate-800 inline-block px-4 w-full">( {formData.handler || '          '} )</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 mb-20">Supir Expedisi,</p>
              <p className="font-black text-slate-800 border-b-2 border-slate-800 inline-block px-4 w-full">( {formData.driver || '          '} )</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 mb-20">Gudang / Muat,</p>
              <p className="font-black text-slate-800 border-b-2 border-slate-800 inline-block px-4 w-full">( Bag. Pengiriman )</p>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan tanpa perjanjian.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountingPanel = ({ state }: any) => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acctTab, setAcctTab] = useState<'jurnal'|'neraca'|'buku_besar'>('neraca');
  const [bbAccount, setBbAccount] = useState('pembelian');

  useEffect(() => {
    const h = { 'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}` };
    Promise.all([
      fetch(`${API_BASE}/api/finance/purchases`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_BASE}/api/finance/sales`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_BASE}/api/finance/expenses`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([p, s, e]) => { setPurchases(p); setSales(s); setExpenses(e); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalPendapatan = sales.reduce((a, s) => a + (s.total_amount || 0), 0);
  const totalPembelian = purchases.reduce((a, p) => a + (p.total_amount || 0), 0);
  const totalPembelianDP = purchases.filter(p => p.payment_status === 'DP').reduce((a, p) => a + (p.total_amount || 0), 0);
  const totalBiaya = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const labaBersih = totalPendapatan - totalPembelian - totalBiaya;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800 flex items-center"><Lucide.BookOpen className="w-8 h-8 mr-3 text-blue-600" />Pusat Akuntansi</h2>
        <p className="text-slate-500 mt-1">Terhubung langsung ke data CoreTax Finance</p>
      </div>
      <div className="flex gap-2">
        {([['neraca','Neraca Saldo'],['jurnal','Jurnal Umum'],['buku_besar','Buku Besar']] as const).map(([id,label]) => (
          <button key={id} onClick={() => setAcctTab(id)} className={`px-5 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all ${acctTab === id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>{label}</button>
        ))}
      </div>

      {acctTab === 'neraca' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ASET */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-blue-600 text-white"><h3 className="font-black text-lg">ASET</h3></div>
            <div className="divide-y">
              <div className="p-4 flex justify-between"><span className="text-slate-600">Piutang Dagang (Penjualan)</span><span className="font-mono font-bold text-blue-700">Rp {totalPendapatan.toLocaleString('id-ID')}</span></div>
              <div className="p-4 flex justify-between bg-blue-50"><span className="font-black text-slate-800">Total Aset</span><span className="font-mono font-black text-blue-800">Rp {totalPendapatan.toLocaleString('id-ID')}</span></div>
            </div>
          </div>
          {/* LIABILITAS + MODAL */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-rose-600 text-white"><h3 className="font-black text-lg">LIABILITAS & MODAL</h3></div>
            <div className="divide-y">
              <div className="p-4 flex justify-between"><span className="text-slate-600">Utang Dagang (Pembelian DP)</span><span className="font-mono font-bold text-rose-600">Rp {totalPembelianDP.toLocaleString('id-ID')}</span></div>
              <div className="p-4 flex justify-between"><span className="text-slate-600">Total Biaya</span><span className="font-mono font-bold text-rose-600">Rp {totalBiaya.toLocaleString('id-ID')}</span></div>
              <div className="p-4 flex justify-between"><span className="text-slate-600">Laba Ditahan (Saldo)</span><span className={`font-mono font-bold ${labaBersih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Rp {labaBersih.toLocaleString('id-ID')}</span></div>
              <div className="p-4 flex justify-between bg-rose-50"><span className="font-black text-slate-800">Total Liabilitas + Modal</span><span className="font-mono font-black text-rose-800">Rp {totalPendapatan.toLocaleString('id-ID')}</span></div>
            </div>
          </div>
          {/* Summary */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {label:'Total Penjualan', val: totalPendapatan, color:'emerald'},
              {label:'Total Pembelian', val: totalPembelian, color:'amber'},
              {label:'Total Biaya', val: totalBiaya, color:'rose'},
              {label:'Laba Bersih', val: labaBersih, color: labaBersih>=0?'blue':'red'},
            ].map((s,i) => (
              <div key={i} className={`bg-gradient-to-br from-white to-slate-50/50 rounded-3xl border border-slate-100 p-6 soft-shadow hover-lift stagger-${(i%3)+1} animate-fade-up`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                <p className={`text-2xl font-black text-${s.color}-600 font-mono tracking-tighter`}>Rp {s.val.toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {acctTab === 'jurnal' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100"><h3 className="font-black text-slate-800">Jurnal Otomatis (dari CoreTax Data)</h3></div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {purchases.map((p,i) => (
              <div key={`p-${i}`} className="p-4">
                <div className="flex justify-between mb-1"><span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{new Date(p.date).toLocaleDateString('id-ID')}</span><span className="text-xs italic text-slate-400">Pembelian: {p.supplier_name}</span></div>
                <div className="pl-4 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800"><span>Persediaan Bahan</span><span>{p.total_amount?.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between pl-6 text-slate-500"><span>Utang Dagang</span><span>{p.total_amount?.toLocaleString('id-ID')}</span></div>
                </div>
              </div>
            ))}
            {sales.map((s,i) => (
              <div key={`s-${i}`} className="p-4">
                <div className="flex justify-between mb-1"><span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{new Date(s.date).toLocaleDateString('id-ID')}</span><span className="text-xs italic text-slate-400">Penjualan: {s.customer_name}</span></div>
                <div className="pl-4 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800"><span>Piutang Dagang</span><span>{s.total_amount?.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between pl-6 text-slate-500"><span>Pendapatan Penjualan</span><span>{s.total_amount?.toLocaleString('id-ID')}</span></div>
                </div>
              </div>
            ))}
            {expenses.map((e,i) => (
              <div key={`e-${i}`} className="p-4">
                <div className="flex justify-between mb-1"><span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded">{new Date(e.date).toLocaleDateString('id-ID')}</span><span className="text-xs italic text-slate-400">Biaya: {e.description}</span></div>
                <div className="pl-4 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800"><span>{e.category}</span><span>{e.amount?.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between pl-6 text-slate-500"><span>Kas & Bank</span><span>{e.amount?.toLocaleString('id-ID')}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {acctTab === 'buku_besar' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[['pembelian','Pembelian'],['penjualan','Penjualan'],['biaya','Biaya']].map(([id,label]) => (
              <button key={id} onClick={() => setBbAccount(id)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${bbAccount === id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>{label}</button>
            ))}
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-slate-500 font-bold"><th className="px-6 py-4 text-left">Tanggal</th><th className="px-6 py-4 text-left">Keterangan</th><th className="px-6 py-4 text-right">Debet</th><th className="px-6 py-4 text-right">Kredit</th><th className="px-6 py-4 text-right">Saldo</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {bbAccount === 'pembelian' && purchases.map((p,i) => { const run = purchases.slice(0,i+1).reduce((a,x) => a+(x.total_amount||0),0); return <tr key={i} className="hover:bg-slate-50"><td className="px-6 py-3 text-slate-500">{new Date(p.date).toLocaleDateString('id-ID')}</td><td className="px-6 py-3">{p.supplier_name} — {p.item_name}</td><td className="px-6 py-3 text-right font-mono text-amber-600">{p.total_amount?.toLocaleString('id-ID')}</td><td className="px-6 py-3 text-right font-mono text-slate-400">-</td><td className="px-6 py-3 text-right font-mono font-bold">{run.toLocaleString('id-ID')}</td></tr>; })}
                {bbAccount === 'penjualan' && sales.map((s,i) => { const run = sales.slice(0,i+1).reduce((a,x) => a+(x.total_amount||0),0); return <tr key={i} className="hover:bg-slate-50"><td className="px-6 py-3 text-slate-500">{new Date(s.date).toLocaleDateString('id-ID')}</td><td className="px-6 py-3">{s.customer_name} — {s.brand_name}</td><td className="px-6 py-3 text-right font-mono text-slate-400">-</td><td className="px-6 py-3 text-right font-mono text-emerald-600">{s.total_amount?.toLocaleString('id-ID')}</td><td className="px-6 py-3 text-right font-mono font-bold">{run.toLocaleString('id-ID')}</td></tr>; })}
                {bbAccount === 'biaya' && expenses.map((e,i) => { const run = expenses.slice(0,i+1).reduce((a,x) => a+(x.amount||0),0); return <tr key={i} className="hover:bg-slate-50"><td className="px-6 py-3 text-slate-500">{new Date(e.date).toLocaleDateString('id-ID')}</td><td className="px-6 py-3">{e.category} — {e.description}</td><td className="px-6 py-3 text-right font-mono text-rose-600">{e.amount?.toLocaleString('id-ID')}</td><td className="px-6 py-3 text-right font-mono text-slate-400">-</td><td className="px-6 py-3 text-right font-mono font-bold">{run.toLocaleString('id-ID')}</td></tr>; })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ASK RICEFLOW AI ASSISTANT ---
const AskRiceFlowPanel = () => {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    {role: 'ai', text: 'Halo! Saya adalah Asisten AI RiceFlow. Ada yang bisa saya bantu terkait data stok, penjualan, atau keuangan hari ini?'}
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    const userQ = query;
    setQuery('');
    setChatHistory(prev => [...prev, {role: 'user', text: userQ}]);
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('jwt_token') || '';
      const res = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQ })
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, {role: 'ai', text: data.answer}]);
      } else {
        setError(data.error || 'Gagal menghubungi AI.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-3xl flex justify-between items-center shadow-lg shadow-emerald-900/20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Lucide.Bot className="w-8 h-8 text-white" /></div>
          <div><h2 className="text-3xl font-black text-white">Ask RiceFlow <span className="text-emerald-200">AI</span></h2><p className="text-emerald-100">Asisten cerdas untuk ERP Anda</p></div>
        </div>
      </div>
      
      {error && <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 font-bold">{error}</div>}
      
      <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-5 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'} shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  {msg.role === 'ai' ? <Lucide.Bot className="w-4 h-4 text-emerald-500" /> : <Lucide.User className="w-4 h-4 text-emerald-200" />}
                  <span className="font-bold text-xs uppercase tracking-widest opacity-80">{msg.role === 'ai' ? 'RiceFlow AI' : 'Anda'}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed font-medium text-sm">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-100 text-slate-500 p-5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <Lucide.Loader2 className="w-5 h-5 animate-spin" /> <span className="font-bold">AI sedang berpikir...</span>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleAsk} className="p-4 bg-slate-50 border-t border-slate-100 flex gap-4">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            placeholder="Tanyakan sesuatu tentang stok, hutang, atau penjualan..."
            className="flex-1 p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all disabled:opacity-50 click-squish shadow-md shadow-emerald-200 flex items-center gap-2"
          >
            <Lucide.Send className="w-5 h-5" /> Kirim
          </button>
        </form>
      </div>
    </div>
  );
};

const CoreFinancePanel = () => {
  const [tab, setTab] = useState<'laba_rugi' | 'pembelian' | 'penjualan' | 'biaya'>('laba_rugi');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'Maintenance Mesin', description: '', payment_type: 'Tunai', amount: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplier: '', item: 'Beras Gabah', qty: '', price: '', payment_status: 'DP', transfer_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 86400000*7).toISOString().split('T')[0] });
  const [saleForm, setSaleForm] = useState({ customer: '', brand: 'Beras Premium 25kg', qty: '', price: '', payment_status: 'DP', transfer_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 86400000*7).toISOString().split('T')[0] });

  const h = { 'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pR, sR, eR] = await Promise.all([
        fetch(`${API_BASE}/api/finance/purchases`, { headers: h }),
        fetch(`${API_BASE}/api/finance/sales`, { headers: h }),
        fetch(`${API_BASE}/api/finance/expenses`, { headers: h })
      ]);
      if (pR.ok) { const d = await pR.json(); setPurchases(Array.isArray(d) ? d : []); }
      if (sR.ok) { const d = await sR.json(); setSales(Array.isArray(d) ? d : []); }
      if (eR.ok) { const d = await eR.json(); setExpenses(Array.isArray(d) ? d : []); }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) return alert('Mohon isi keterangan dan nominal.');
    setSavingExpense(true);
    try {
      const res = await fetch(`${API_BASE}/api/finance/expenses`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) })
      });
      if (res.ok) {
        setExpenseForm({ category: 'Maintenance Mesin', description: '', payment_type: 'Tunai', amount: '' });
        fetchData();
      }
    } catch(e) { console.error(e); }
    setSavingExpense(false);
  };

  const handleAddPurchase = async () => {
    if (!purchaseForm.supplier || !purchaseForm.qty || !purchaseForm.price) return alert('Mohon isi supplier, qty, dan harga.');
    try {
      const res = await fetch(`${API_BASE}/api/finance/purchases`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ 
          supplier_name: purchaseForm.supplier, 
          item_name: purchaseForm.item, 
          qty_kg: parseFloat(purchaseForm.qty), 
          price_per_kg: parseFloat(purchaseForm.price),
          total_amount: parseFloat(purchaseForm.qty) * parseFloat(purchaseForm.price),
          payment_status: purchaseForm.payment_status,
          check_number: purchaseForm.payment_status === 'Lunas' ? `Trf: ${purchaseForm.transfer_date}` : '',
          due_date: purchaseForm.payment_status === 'DP' ? purchaseForm.due_date : ''
        })
      });
      if (res.ok) {
        setPurchaseForm({ supplier: '', item: 'Beras Gabah', qty: '', price: '', payment_status: 'DP', transfer_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 86400000*7).toISOString().split('T')[0] });
        fetchData();
      }
    } catch(e) { console.error(e); }
  };

  const handleAddSale = async () => {
    if (!saleForm.customer || !saleForm.qty || !saleForm.price) return alert('Mohon isi customer, qty, dan harga.');
    try {
      const res = await fetch(`${API_BASE}/api/finance/sales`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ 
          customer_name: saleForm.customer, 
          brand_name: saleForm.brand, 
          qty_zak: parseFloat(saleForm.qty), 
          total_amount: parseFloat(saleForm.qty) * parseFloat(saleForm.price),
          payment_status: saleForm.payment_status,
          check_number: saleForm.payment_status === 'Lunas' ? `Trf: ${saleForm.transfer_date}` : '',
          due_date: saleForm.payment_status === 'DP' ? saleForm.due_date : ''
        })
      });
      if (res.ok) {
        setSaleForm({ customer: '', brand: 'Beras Premium 25kg', qty: '', price: '', payment_status: 'DP', transfer_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 86400000*7).toISOString().split('T')[0] });
        fetchData();
      }
    } catch(e) { console.error(e); }
  };

  const safeSales = Array.isArray(sales) ? sales : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const totalPendapatan = safeSales.reduce((a, s) => a + (Number(s.total_amount) || 0), 0);
  const pembelianBeras = safePurchases.filter(p => String(p.item_name || '').toLowerCase().includes('beras')).reduce((a, p) => a + (Number(p.total_amount) || 0), 0);
  const pembelianKemasan = safePurchases.filter(p => String(p.item_name || '').toLowerCase().includes('kemasan') || String(p.item_name || '').toLowerCase().includes('zak')).reduce((a, p) => a + (Number(p.total_amount) || 0), 0);
  const ongkosKuli = safeExpenses.filter(e => String(e.category || '').toLowerCase().includes('kuli')).reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const ongkosTruk = safeExpenses.filter(e => String(e.category || '').toLowerCase().includes('truk')).reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const biayaUtilitas = safeExpenses.filter(e => String(e.category || '').toLowerCase().includes('pln') || String(e.category || '').toLowerCase().includes('pdam')).reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const totalHPP = pembelianBeras + pembelianKemasan + ongkosKuli + ongkosTruk + biayaUtilitas;
  const labaBruto = totalPendapatan - totalHPP;
  const biayaOps = safeExpenses.filter(e => !String(e.category || '').toLowerCase().includes('kuli') && !String(e.category || '').toLowerCase().includes('truk') && !String(e.category || '').toLowerCase().includes('pln') && !String(e.category || '').toLowerCase().includes('pdam')).reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const labaBersih = labaBruto - biayaOps;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-black text-slate-800 flex items-center"><Lucide.BarChart className="w-8 h-8 mr-3 text-emerald-600" />CoreTax Finance ERP</h2><p className="text-slate-500 mt-1">Sistem Keuangan SAK & Pelaporan Pajak CoreTax</p></div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([['laba_rugi','Laba Rugi (Live)'],['pembelian','Buku Pembelian'],['penjualan','Buku Penjualan'],['biaya','Buku Biaya']] as const).map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${tab === id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>{label}</button>
        ))}
      </div>

      {tab === 'laba_rugi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6"><h3 className="text-emerald-800 font-bold mb-2">Total Pendapatan</h3><p className="text-4xl font-black text-emerald-600">Rp {totalPendapatan.toLocaleString('id-ID')}</p></div>
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6"><h3 className="text-amber-800 font-bold mb-2">HPP</h3><p className="text-4xl font-black text-amber-600">Rp {totalHPP.toLocaleString('id-ID')}</p></div>
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6"><h3 className="text-blue-800 font-bold mb-2">Laba Bersih</h3><p className="text-4xl font-black text-blue-600">Rp {labaBersih.toLocaleString('id-ID')}</p></div>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 flex items-center"><Lucide.Calculator className="w-5 h-5 mr-2 text-slate-400" /> Rincian Laba Rugi (SAK)</h3>
              <button onClick={() => window.open(`${API_BASE}/api/finance/export/laba-rugi`, '_blank')} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                <Lucide.FileText className="w-4 h-4" /> Export CoreTax (.xlsx)
              </button>
            </div>
            <div className="p-6">
              <table className="w-full text-sm"><tbody>
                <tr className="font-black text-slate-800 text-lg"><td className="py-3">PENDAPATAN</td><td /></tr>
                <tr><td className="py-2 pl-4 text-slate-600">Peredaran Bruto Usaha</td><td className="text-right font-mono font-bold">{totalPendapatan.toLocaleString('id-ID')}</td></tr>
                <tr className="font-black text-slate-800 text-lg"><td className="py-3 pt-6">HARGA POKOK PENJUALAN (HPP)</td><td /></tr>
                <tr><td className="py-2 pl-4 text-slate-600">Pembelian Beras</td><td className="text-right font-mono">{pembelianBeras.toLocaleString('id-ID')}</td></tr>
                <tr><td className="py-2 pl-4 text-slate-600">Pembelian Kemasan</td><td className="text-right font-mono">{pembelianKemasan.toLocaleString('id-ID')}</td></tr>
                <tr><td className="py-2 pl-4 text-slate-600">Ongkos Kuli</td><td className="text-right font-mono">{ongkosKuli.toLocaleString('id-ID')}</td></tr>
                <tr><td className="py-2 pl-4 text-slate-600">Ongkos Truk</td><td className="text-right font-mono">{ongkosTruk.toLocaleString('id-ID')}</td></tr>
                <tr><td className="py-2 pl-4 text-slate-600 border-b border-slate-200">Biaya Utilitas (PLN/PDAM)</td><td className="text-right font-mono border-b border-slate-200">{biayaUtilitas.toLocaleString('id-ID')}</td></tr>
                <tr className="bg-slate-50"><td className="py-3 pl-4 font-bold text-slate-800">Total HPP</td><td className="text-right font-mono font-bold text-amber-600">({totalHPP.toLocaleString('id-ID')})</td></tr>
                <tr className="bg-emerald-50"><td className="py-4 font-black text-emerald-800 text-lg">LABA BRUTO USAHA</td><td className="text-right font-mono font-black text-emerald-600 text-lg">{labaBruto.toLocaleString('id-ID')}</td></tr>
                <tr className="font-black text-slate-800 text-lg"><td className="py-3 pt-6">BIAYA & ADMINISTRASI</td><td /></tr>
                <tr><td className="py-2 pl-4 text-slate-600 border-b border-slate-200">Biaya Operasional Lainnya</td><td className="text-right font-mono border-b border-slate-200">{biayaOps.toLocaleString('id-ID')}</td></tr>
                <tr className="bg-blue-50"><td className="py-4 font-black text-blue-800 text-xl">LABA BERSIH SEBELUM PAJAK</td><td className="text-right font-mono font-black text-blue-600 text-xl">{labaBersih.toLocaleString('id-ID')}</td></tr>
              </tbody></table>
            </div>
          </div>
        </div>
      )}
      {tab === 'pembelian' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4 h-fit">
            <h3 className="font-black text-slate-800 flex items-center gap-2"><Lucide.PlusCircle className="w-5 h-5 text-emerald-500" /> Input Pembelian</h3>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Supplier / Petani</label>
              <input value={purchaseForm.supplier} onChange={e => setPurchaseForm({...purchaseForm, supplier: e.target.value})} placeholder="Nama Supplier" className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Barang</label>
              <input value={purchaseForm.item} onChange={e => setPurchaseForm({...purchaseForm, item: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Qty (KG)</label>
                <input type="number" value={purchaseForm.qty} onChange={e => setPurchaseForm({...purchaseForm, qty: e.target.value})} placeholder="0" className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Harga / KG</label>
                <input type="number" value={purchaseForm.price} onChange={e => setPurchaseForm({...purchaseForm, price: e.target.value})} placeholder="Rp" className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Status Pembayaran</label>
              <div className="flex gap-2">
                <select value={purchaseForm.payment_status} onChange={e => setPurchaseForm({...purchaseForm, payment_status: e.target.value})} className="flex-1 p-3 border border-slate-200 rounded-xl font-bold">
                  <option value="Lunas">Lunas</option>
                  <option value="DP">DP / Hutang</option>
                </select>
              </div>
            </div>
            {purchaseForm.payment_status === 'Lunas' && (
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Tgl Transfer Lunas</label>
                <input type="date" value={purchaseForm.transfer_date} onChange={e => setPurchaseForm({...purchaseForm, transfer_date: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
              </div>
            )}
            {purchaseForm.payment_status === 'DP' && (
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Tgl Jatuh Tempo (Schedule)</label>
                <input type="date" value={purchaseForm.due_date} onChange={e => setPurchaseForm({...purchaseForm, due_date: e.target.value})} className="w-full p-3 border border-amber-200 bg-amber-50 rounded-xl font-bold" />
              </div>
            )}
            <button onClick={handleAddPurchase} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-200 click-squish">SIMPAN PEMBELIAN</button>
          </div>
          <div className="lg:col-span-2 bg-transparent overflow-x-auto p-1">
            <table className="w-full text-sm text-left border-separate border-spacing-y-3"><thead className="text-slate-400 font-bold text-xs uppercase tracking-widest"><tr><th className="px-6 py-2">Tanggal</th><th className="px-6 py-2">Supplier</th><th className="px-6 py-2">Barang</th><th className="px-6 py-2">Qty KG</th><th className="px-6 py-2">Status</th><th className="px-6 py-2 text-right">Total (Rp)</th></tr></thead>
            <tbody>{safePurchases.map((p, i) => (<tr key={i} className="bg-white hover:bg-slate-50/80 transition-colors shadow-sm rounded-2xl group"><td className="px-6 py-5 text-slate-500 rounded-l-2xl">{new Date(p.date || Date.now()).toLocaleDateString('id-ID')}</td><td className="px-6 py-5 font-bold text-slate-800">{p.supplier_name || '-'}</td><td className="px-6 py-5 text-slate-600">{p.item_name || '-'}</td><td className="px-6 py-5 font-bold text-slate-700">{Number(p.qty_kg || 0).toLocaleString('id-ID')}</td><td className="px-6 py-5"><span className={`px-3 py-1.5 rounded-xl text-xs font-black ${p.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.payment_status || 'DP'}</span></td><td className="px-6 py-5 text-right font-mono font-black text-slate-800 rounded-r-2xl">{Number(p.total_amount || 0).toLocaleString('id-ID')}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'penjualan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4 h-fit">
            <h3 className="font-black text-slate-800 flex items-center gap-2"><Lucide.PlusCircle className="w-5 h-5 text-indigo-500" /> Input Penjualan</h3>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Customer</label>
              <input value={saleForm.customer} onChange={e => setSaleForm({...saleForm, customer: e.target.value})} placeholder="Nama Customer" className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Brand / Barang</label>
              <input value={saleForm.brand} onChange={e => setSaleForm({...saleForm, brand: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Qty (Zak)</label>
                <input type="number" value={saleForm.qty} onChange={e => setSaleForm({...saleForm, qty: e.target.value})} placeholder="0" className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Harga / Zak</label>
                <input type="number" value={saleForm.price} onChange={e => setSaleForm({...saleForm, price: e.target.value})} placeholder="Rp" className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Status Pembayaran</label>
              <div className="flex gap-2">
                <select value={saleForm.payment_status} onChange={e => setSaleForm({...saleForm, payment_status: e.target.value})} className="flex-1 p-3 border border-slate-200 rounded-xl font-bold">
                  <option value="Lunas">Lunas</option>
                  <option value="Piutang">Piutang</option>
                </select>
              </div>
            </div>
            {saleForm.payment_status === 'Lunas' && (
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Tgl Terima Transfer</label>
                <input type="date" value={saleForm.transfer_date} onChange={e => setSaleForm({...saleForm, transfer_date: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
              </div>
            )}
            {saleForm.payment_status === 'Piutang' && (
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Tgl Jatuh Tempo (Schedule)</label>
                <input type="date" value={saleForm.due_date} onChange={e => setSaleForm({...saleForm, due_date: e.target.value})} className="w-full p-3 border border-amber-200 bg-amber-50 rounded-xl font-bold" />
              </div>
            )}
            <button onClick={handleAddSale} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-200 click-squish">SIMPAN PENJUALAN</button>
          </div>
          <div className="lg:col-span-2 bg-transparent overflow-x-auto p-1">
            <table className="w-full text-sm text-left border-separate border-spacing-y-3"><thead className="text-slate-400 font-bold text-xs uppercase tracking-widest"><tr><th className="px-6 py-2">Tanggal</th><th className="px-6 py-2">Customer</th><th className="px-6 py-2">Brand</th><th className="px-6 py-2">Qty Zak</th><th className="px-6 py-2 text-right">Total (Rp)</th></tr></thead>
            <tbody>{safeSales.map((s, i) => (<tr key={i} className="bg-white hover:bg-slate-50/80 transition-colors shadow-sm rounded-2xl group"><td className="px-6 py-5 text-slate-500 rounded-l-2xl">{new Date(s.date || Date.now()).toLocaleDateString('id-ID')}</td><td className="px-6 py-5 font-bold text-slate-800">{s.customer_name || '-'}</td><td className="px-6 py-5 text-slate-600">{s.brand_name || '-'}</td><td className="px-6 py-5 font-bold text-slate-700">{s.qty_zak || 0}</td><td className="px-6 py-5 text-right font-mono font-black text-slate-800 rounded-r-2xl">{Number(s.total_amount || 0).toLocaleString('id-ID')}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'biaya' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Expense Form */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2"><Lucide.PlusCircle className="w-5 h-5 text-rose-500" /> Tambah Pengeluaran</h3>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Kategori</label>
              <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700">
                <option>Maintenance Mesin</option>
                <option>Pembelian Kebutuhan Maintenance</option>
                <option>Ongkos Kuli</option>
                <option>Ongkos Truk</option>
                <option>PLN</option>
                <option>PDAM</option>
                <option>Gaji Karyawan</option>
                <option>Perlengkapan Kantor</option>
                <option>Lain-lain</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Keterangan</label>
              <input value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="Contoh: Beli oli mesin, Ganti belt..." className="w-full p-3 border border-slate-200 rounded-xl text-slate-700" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Tipe Pembayaran</label>
              <div className="flex gap-2">
                {['Tunai', 'Cek', 'Transfer'].map(t => (
                  <button key={t} onClick={() => setExpenseForm({...expenseForm, payment_type: t})} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${expenseForm.payment_type === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Nominal (Rp)</label>
              <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0" className="w-full p-3 border border-slate-200 rounded-xl font-black text-slate-700 text-xl" />
            </div>
            <button onClick={handleAddExpense} disabled={savingExpense} className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black rounded-xl transition-all shadow-lg shadow-rose-200 click-squish flex items-center justify-center gap-2 disabled:opacity-50">
              {savingExpense ? <Lucide.Loader2 className="w-5 h-5 animate-spin" /> : <Lucide.Save className="w-5 h-5" />}
              Simpan Pengeluaran
            </button>
          </div>
          {/* Expense List */}
          <div className="lg:col-span-2 bg-transparent">
            <div className="mb-4 flex justify-between items-center px-2">
              <h3 className="font-black text-slate-800 text-lg">Riwayat Pengeluaran</h3>
              <span className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-black text-sm">Total: Rp {expenses.reduce((a,e) => a+(e.amount||0),0).toLocaleString('id-ID')}</span>
            </div>
            <div className="overflow-x-auto p-1">
              <table className="w-full text-sm text-left border-separate border-spacing-y-3"><thead className="text-slate-400 font-bold text-xs uppercase tracking-widest"><tr><th className="px-6 py-2">Tanggal</th><th className="px-6 py-2">Kategori</th><th className="px-6 py-2">Keterangan</th><th className="px-6 py-2">Bayar</th><th className="px-6 py-2 text-right">Nominal</th></tr></thead>
              <tbody>{expenses.map((e, i) => (<tr key={i} className="bg-white hover:bg-slate-50/80 transition-colors shadow-sm rounded-2xl group"><td className="px-6 py-5 text-slate-500 text-xs rounded-l-2xl">{new Date(e.date).toLocaleDateString('id-ID')}</td><td className="px-6 py-5"><span className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-black text-slate-700">{e.category}</span></td><td className="px-6 py-5 text-slate-600 font-medium">{e.description}</td><td className="px-6 py-5 text-slate-500 font-bold">{e.payment_type}</td><td className="px-6 py-5 text-right font-mono font-black text-rose-600 rounded-r-2xl">Rp {e.amount?.toLocaleString('id-ID')}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- PAYMENTS & REORDER PANEL ---
const PaymentsPanel = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [reorders, setReorders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);
  const [dueDateModal, setDueDateModal] = useState<any>(null);
  const [dueDateInput, setDueDateInput] = useState('');

  const headers = { 'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/api/finance/payments/pending`, { headers }),
        fetch(`${API_BASE}/api/finance/reorder-suggestions`, { headers })
      ]);
      if (pRes.ok) setPayments(await pRes.json());
      if (rRes.ok) setReorders(await rRes.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkPaid = async (id: number) => {
    setPaying(id);
    try {
      const res = await fetch(`${API_BASE}/api/finance/purchases/${id}/pay`, { method: 'POST', headers });
      if (res.ok) { setPayments(prev => prev.filter(p => p.id !== id)); }
    } catch(e) { console.error(e); }
    setPaying(null);
  };

  const handleSetDueDate = async () => {
    if (!dueDateModal || !dueDateInput) return;
    try {
      await fetch(`${API_BASE}/api/finance/purchases/${dueDateModal.id}/due-date`, {
        method: 'POST', headers, body: JSON.stringify({ due_date: dueDateInput })
      });
      setDueDateModal(null);
      fetchData();
    } catch(e) { console.error(e); }
  };

  const totalTagihan = payments.reduce((a, p) => a + (p.total_amount || 0), 0);
  const overdueCount = payments.filter(p => p.is_overdue).length;
  const urgentCount = payments.filter(p => p.is_urgent && !p.is_overdue).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center"><Lucide.AlarmClock className="w-8 h-8 mr-3 text-rose-500" />Tagihan & Reorder</h2>
          <p className="text-slate-500 mt-1">Kelola pembayaran ke supplier & saran restok barang</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
          <Lucide.RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Tagihan Belum Bayar</p>
          <p className="text-3xl font-black text-slate-800">Rp {totalTagihan.toLocaleString('id-ID')}</p>
          <p className="text-sm text-slate-500 mt-1">{payments.length} transaksi belum lunas</p>
        </div>
        <div className={`rounded-3xl border p-6 shadow-sm ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Sudah Lewat Jatuh Tempo</p>
          <p className="text-3xl font-black text-red-600">{overdueCount} Tagihan</p>
          <p className="text-sm text-red-400 mt-1">Segera bayar!</p>
        </div>
        <div className={`rounded-3xl border p-6 shadow-sm ${urgentCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Jatuh Tempo H-1</p>
          <p className="text-3xl font-black text-amber-600">{urgentCount} Tagihan</p>
          <p className="text-sm text-amber-400 mt-1">Bayar hari ini atau besok</p>
        </div>
      </div>

      {/* Pending Payments List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Lucide.CreditCard className="w-5 h-5 text-rose-500" />
          <h3 className="font-black text-slate-800">Daftar Tagihan Belum Lunas</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {payments.length === 0 && <div className="p-12 text-center text-slate-400 font-medium">✅ Semua tagihan sudah lunas!</div>}
          {payments.map(p => (
            <div key={p.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors ${p.is_overdue ? 'bg-red-50/50' : p.is_urgent ? 'bg-amber-50/50' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-slate-800 text-lg">{p.supplier_name}</span>
                  {p.is_overdue && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-black rounded-full">LEWAT TEMPO</span>}
                  {p.is_urgent && !p.is_overdue && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-black rounded-full">H-1</span>}
                </div>
                <p className="text-sm text-slate-500">{p.item_name} • {p.qty_kg?.toLocaleString('id-ID')} kg • Cek: {p.check_number || '-'}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Jatuh Tempo: {p.due_date ? new Date(p.due_date).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) : <span className="italic">Belum diset</span>}
                  {p.days_until_due !== null && p.days_until_due !== undefined && (
                    <span className={`ml-2 font-bold ${p.is_overdue ? 'text-red-500' : p.is_urgent ? 'text-amber-500' : 'text-slate-500'}`}>
                      ({p.is_overdue ? `${Math.abs(p.days_until_due)} hari lewat` : `${p.days_until_due} hari lagi`})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xl font-black text-slate-800 font-mono">Rp {p.total_amount?.toLocaleString('id-ID')}</span>
                <button onClick={() => { setDueDateModal(p); setDueDateInput(''); }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors">
                  📅 Set Jatuh Tempo
                </button>
                <button
                  onClick={() => handleMarkPaid(p.id)}
                  disabled={paying === p.id}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {paying === p.id ? <Lucide.Loader2 className="w-4 h-4 animate-spin" /> : <Lucide.CheckCircle2 className="w-4 h-4" />}
                  Tandai Lunas
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reorder Suggestions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Lucide.PackageSearch className="w-5 h-5 text-blue-500" />
          <h3 className="font-black text-slate-800">Saran Reorder Barang</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {reorders.length === 0 && <div className="p-12 text-center text-slate-400 font-medium">✅ Semua stok masih aman!</div>}
          {reorders.map((r, i) => (
            <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-50/30 hover:bg-blue-50 transition-colors">
              <div>
                <p className="font-black text-slate-800 text-lg">{r.item_name}</p>
                <p className="text-sm text-slate-500">Stok saat ini: <strong className="text-red-600">{r.current_qty?.toLocaleString('id-ID')} kg</strong> • Min threshold: {r.minimum_threshold?.toLocaleString('id-ID')} kg</p>
                <p className="text-xs text-blue-600 mt-1 font-bold">Supplier terakhir: {r.last_supplier} — Harga: Rp {r.last_price_per_kg?.toLocaleString('id-ID')}/kg</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-slate-400 uppercase font-bold">Kekurangan</p>
                <p className="text-2xl font-black text-blue-600">{r.shortage?.toLocaleString('id-ID')} kg</p>
                <p className="text-xs text-slate-500 mt-1">Est. biaya: Rp {(r.shortage * r.last_price_per_kg)?.toLocaleString('id-ID')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Due Date Modal */}
      {dueDateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-slate-800 text-xl mb-2">Set Jatuh Tempo</h3>
            <p className="text-slate-500 mb-6">{dueDateModal.supplier_name} — Rp {dueDateModal.total_amount?.toLocaleString('id-ID')}</p>
            <input type="date" value={dueDateInput} onChange={e => setDueDateInput(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setDueDateModal(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl">Batal</button>
              <button onClick={handleSetDueDate} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- LANDING PAGE ---
const LandingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="min-h-screen bg-[#f4f7f6] selection:bg-emerald-200 font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-300/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-300/20 blur-[120px] rounded-full"></div>
      
      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200">
            <Lucide.Wheat className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-900 to-emerald-600">RiceFlow</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Enterprise</p>
          </div>
        </div>
        <div>
          <button onClick={onGetStarted} className="px-6 py-3 bg-white/80 backdrop-blur-md text-emerald-700 font-bold rounded-2xl shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-all">
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm mb-8 animate-fade-up">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-slate-600 tracking-wide">Sistem ERP Pertanian Modern</span>
        </div>
        
        <h2 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter max-w-4xl leading-[1.1] animate-fade-up stagger-1">
          Otomatisasi Pabrik Beras <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Didukung AI.</span>
        </h2>
        
        <p className="mt-6 text-lg md:text-xl text-slate-500 font-medium max-w-2xl animate-fade-up stagger-2">
          Platform manajemen komprehensif untuk penggilingan padi, persediaan gabah, keuangan CoreTax, dan prediksi rendemen otomatis.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-up stagger-3">
          <button onClick={onGetStarted} className="px-8 py-4 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95">
            Mulai Sekarang <Lucide.ArrowRight className="w-5 h-5" />
          </button>
          <a href="#features" className="px-8 py-4 bg-white/50 backdrop-blur-md text-slate-700 hover:bg-white/80 border border-slate-200 font-bold rounded-2xl transition-all">
            Pelajari Fitur
          </a>
        </div>
        
        {/* Mockup Preview */}
        <div className="mt-16 w-full max-w-5xl rounded-t-[2.5rem] bg-white/40 backdrop-blur-xl border-t border-l border-r border-white/60 shadow-2xl p-4 md:p-8 animate-fade-up stagger-3">
          <div className="w-full h-[28rem] md:h-[40rem] rounded-2xl bg-[#f4f7f6] border border-slate-200 shadow-inner overflow-hidden relative flex flex-col">
            {/* Fake Browser Window Header */}
            <div className="absolute top-0 left-0 w-full h-12 bg-white/90 backdrop-blur border-b flex items-center px-4 space-x-2 z-20">
               <div className="w-3 h-3 rounded-full bg-red-400"></div>
               <div className="w-3 h-3 rounded-full bg-amber-400"></div>
               <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            </div>
            
            {/* Real Dashboard Preview */}
            <div className="w-full h-full pt-12 overflow-hidden pointer-events-none select-none mask-image-bottom-fade">
              <div className="transform scale-[0.65] md:scale-[0.85] origin-top w-[153%] md:w-[117%] p-8">
                <Dashboard state={INITIAL_STATE} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-fade-up">
            <h3 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Semua Fitur dalam Satu Platform</h3>
            <p className="mt-4 text-lg text-slate-500 font-medium">Modul lengkap untuk menunjang operasional pabrik beras Anda dari hulu ke hilir.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Lucide.Building2 className="w-8 h-8 text-emerald-500" />, title: 'Manajemen Giling & Timbangan', desc: 'Sistem timbangan otomatis dan pencatatan rendemen giling beras secara real-time.' },
              { icon: <Lucide.ShoppingCart className="w-8 h-8 text-blue-500" />, title: 'Surat Jalan & Trading', desc: 'Pembuatan surat jalan instan dan manajemen penjualan beras ke berbagai distributor.' },
              { icon: <Lucide.BookOpen className="w-8 h-8 text-indigo-500" />, title: 'Akuntansi & Neraca', desc: 'Pembukuan otomatis dengan Chart of Accounts standar untuk melacak laba-rugi pabrik.' },
              { icon: <Lucide.Banknote className="w-8 h-8 text-rose-500" />, title: 'CoreTax Finance', desc: 'Integrasi langsung ke sistem perpajakan CoreTax untuk efisiensi pelaporan.' },
              { icon: <Lucide.Bot className="w-8 h-8 text-teal-500" />, title: 'Ask RiceFlow AI', desc: 'Asisten cerdas berbasis AI untuk menganalisa data pabrik dan memberikan rekomendasi.' },
              { icon: <Lucide.AlarmClock className="w-8 h-8 text-amber-500" />, title: 'Tagihan & Reorder', desc: 'Sistem notifikasi cerdas untuk tagihan jatuh tempo dan saran reorder stok gabah.' },
            ].map((f, i) => (
              <div key={i} className={`p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-xl hover:bg-white hover:-translate-y-2 transition-all duration-300 animate-fade-up stagger-${(i%3)+1}`}>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-24 bg-slate-900 text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <Lucide.Wheat className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">Siap Mengoptimalkan Pabrik Anda?</h2>
          <p className="text-xl text-slate-400 mb-10">Tinggalkan pencatatan manual dan beralih ke otomatisasi AI penuh bersama RiceFlow Enterprise.</p>
          <button onClick={onGetStarted} className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all transform hover:scale-105 active:scale-95">
            Masuk ke Aplikasi
          </button>
        </div>
      </section>
    </div>
  );
};

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin, onBack }: { onLogin: (token: string) => void, onBack: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) return setError('Masukkan username dan password.');
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem('jwt_token', data.access_token);
        onLogin(data.access_token);
      } else {
        setError(data.message || 'Username atau password salah.');
      }
    } catch(e) { setError('Tidak dapat terhubung ke server.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4 lg:p-8 font-sans selection:bg-emerald-200">
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden flex flex-col md:flex-row">
        
        {/* Branding Sidebar */}
        <div className="md:w-5/12 bg-slate-900 p-10 flex flex-col relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent"></div>
          <button onClick={onBack} className="relative z-10 w-fit p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors mb-12">
            <Lucide.ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative z-10 mt-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/30">
              <Lucide.Wheat className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">RiceFlow.</h1>
            <p className="text-slate-400 font-medium">Bumi Mas Group Core ERP System.</p>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Login Form */}
        <div className="md:w-7/12 p-8 md:p-16 flex flex-col justify-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Selamat Datang Kembali</h2>
          <p className="text-slate-500 font-medium mb-8">Masuk ke akun Anda untuk mengelola operasional.</p>
          
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold p-4 rounded-2xl mb-6 flex items-center gap-2"><Lucide.AlertCircle className="w-5 h-5"/> {error}</div>}
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="admin" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 flex justify-between">
                <span>Password</span>
                <a href="#" className="text-emerald-600 hover:text-emerald-700 normal-case tracking-normal">Lupa password?</a>
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all" />
            </div>
            <button onClick={handleLogin} disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 transform active:scale-95">
              {loading ? <Lucide.Loader2 className="w-5 h-5 animate-spin" /> : <Lucide.LogIn className="w-5 h-5" />}
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [view, setView] = useState<'landing' | 'login' | 'app'>(token ? 'app' : 'landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('riceflow_v10');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  useEffect(() => { 
    localStorage.setItem('riceflow_v10', JSON.stringify(state)); 
  }, [state]);

  const handleLoginSuccess = (t: string) => {
    setToken(t);
    setView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setView('landing');
  };

  if (view === 'landing') return <LandingPage onGetStarted={() => setView('login')} />;
  if (view === 'login') return <LoginScreen onLogin={handleLoginSuccess} onBack={() => setView('landing')} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="absolute top-4 right-4 z-50">
        <button onClick={handleLogout} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-200 flex items-center gap-2 shadow-sm transition-colors">
          <Lucide.LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>
      {activeTab === 'dashboard' && <Dashboard state={state} />}
      {activeTab === 'production' && <ProductionPanel state={state} setState={setState} />}
      {activeTab === 'trading' && <TradingPanel state={state} setState={setState} />}
      {activeTab === 'accounting' && <AccountingPanel state={state} />}
      {activeTab === 'core_finance' && <CoreFinancePanel />}
      {activeTab === 'ask-riceflow' && <AskRiceFlowPanel />}
      {activeTab === 'payments' && <PaymentsPanel />}
    </Layout>
  );
}

class ErrorBoundary extends React.Component<{children: any}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 border-4 border-red-500 rounded-xl">
          <h1 className="text-3xl font-black text-red-600 mb-4">CRASH DETECTED</h1>
          <p className="text-xl font-bold font-mono text-red-800 break-words">{this.state.error?.toString()}</p>
          <pre className="mt-4 p-4 bg-white rounded overflow-auto text-sm">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root')!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);
