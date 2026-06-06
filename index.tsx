
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
  <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
    <aside className="w-full md:w-64 bg-emerald-900 text-white flex flex-col shadow-2xl z-50">
      <div className="p-6 bg-emerald-950 flex items-center space-x-3 border-b border-emerald-800">
        <Lucide.Wheat className="text-yellow-400 w-8 h-8" />
        <div>
          <h1 className="font-black text-xl tracking-tight">RiceFlow</h1>
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">BUMI MAS GROUP</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
          <Lucide.LayoutDashboard className="w-5 h-5" />
          <span className="font-bold text-sm">Dashboard</span>
        </button>
        <div className="pt-6 pb-2 px-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Operasional</div>
        <button onClick={() => setActiveTab('production')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === 'production' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
          <Lucide.Building2 className="w-5 h-5" />
          <span className="font-bold text-sm">PP BUMI MAS</span>
        </button>
        <button onClick={() => setActiveTab('trading')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === 'trading' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
          <Lucide.ShoppingCart className="w-5 h-5" />
          <span className="font-bold text-sm">Penjualan</span>
        </button>
        <button onClick={() => setActiveTab('accounting')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === 'accounting' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
          <Lucide.BookOpen className="w-5 h-5" />
          <span className="font-bold text-sm">Pusat Akuntansi</span>
        </button>
        <div className="pt-6 pb-2 px-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Keuangan & AI</div>
        <button onClick={() => setActiveTab('core_finance')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === 'core_finance' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
          <Lucide.Banknote className="w-5 h-5" />
          <span className="font-bold text-sm">CoreTax Finance</span>
        </button>
        <button onClick={() => setActiveTab('openclaw')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === 'openclaw' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
          <Lucide.Terminal className="w-5 h-5" />
          <span className="font-bold text-sm">AI Audit Log</span>
        </button>
        <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === 'payments' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
          <Lucide.AlarmClock className="w-5 h-5" />
          <span className="font-bold text-sm">Tagihan & Reorder</span>
        </button>
      </nav>
      <div className="p-4 bg-emerald-950/50 border-t border-emerald-800 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
        Integrated Rice System
      </div>
    </aside>
    <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">{children}</main>
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
    { label: 'Kas & Bank', value: fCurrency(getBalance('11001')), icon: <Lucide.Wallet className="text-blue-500" /> },
    { label: 'Piutang Jual', value: fCurrency(getBalance('13001')), icon: <Lucide.ArrowUpCircle className="text-emerald-500" /> },
    { label: 'Total Gabah', value: `${(totalGabah/1000).toFixed(1)} Ton`, icon: <Lucide.Layers className="text-amber-500" /> },
    { label: 'Stok Beras', value: `${(totalBeras/1000).toFixed(1)} Ton`, icon: <Lucide.Package className="text-indigo-500" /> }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-black text-slate-800">Manajemen RiceFlow</h2>
        <p className="text-slate-500">Monitoring Multicompany</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-xl font-black text-slate-800">{s.value}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">{s.icon}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
             {state.piles.map((p: any) => (
               <div key={p.id} className="bg-white p-6 rounded-3xl border shadow-sm text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Pile {p.id}</p>
                  <p className="text-2xl font-black text-slate-800">{p.currentWeight.toLocaleString()} <small className="text-xs">kg</small></p>
               </div>
             ))}
             {state.inventory.map((i: any) => (
               <div key={i.id} className="bg-white p-6 rounded-3xl border shadow-sm text-center border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase">{i.name}</p>
                  <p className="text-2xl font-black text-indigo-800">{i.quantity.toLocaleString()} <small className="text-xs">kg</small></p>
               </div>
             ))}
          </div>
       )}
    </div>
  );
};

// --- TRADING & AKUNTANSI (PENYEDERHANAAN UNTUK PREVIEW) ---
const TradingPanel = ({ state, setState }: any) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-20 text-center space-y-4">
        <Lucide.ShoppingCart className="w-16 h-16 text-indigo-200" />
        <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Modul Trading Makmur</h3>
        <p className="text-slate-400 max-w-md">Modul ini digunakan untuk penjualan stok beras ke distributor luar pulau.</p>
    </div>
  );
};

const AccountingPanel = ({ state }: any) => {
  return (
    <div className="space-y-6">
       <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="font-black text-slate-800 mb-6">Jurnal Umum (Automatic Double Entry)</h3>
          <div className="divide-y max-h-[500px] overflow-y-auto pr-4">
             {state.journal.slice().reverse().map((j: any) => (
               <div key={j.id} className="py-6">
                  <div className="flex justify-between mb-2">
                     <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{j.date}</span>
                     <span className="text-xs italic text-slate-400">{j.description}</span>
                  </div>
                  <div className="space-y-1">
                     {j.lines.map((l: any, idx: number) => (
                        <div key={idx} className={`grid grid-cols-4 text-xs ${l.credit > 0 ? 'pl-8 text-slate-500' : 'font-bold text-slate-800'}`}>
                           <span className="col-span-2">{state.accounts.find((a: any) => a.code === l.accountId)?.name}</span>
                           <span className="text-right">{l.debit > 0 ? fCurrency(l.debit) : ''}</span>
                           <span className="text-right">{l.credit > 0 ? fCurrency(l.credit) : ''}</span>
                        </div>
                     ))}
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
};

// --- OPENCLAW AUDIT LOG ---
const OpenClawPanel = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('jwt_token') || '';
      const res = await fetch(`${API_BASE}/api/logs/openclaw`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setLogs(d.logs || []); }
      else setError('Gagal memuat log. Pastikan Anda sudah login.');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); const i = setInterval(fetchLogs, 30000); return () => clearInterval(i); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 p-8 rounded-3xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl"><Lucide.Activity className="w-8 h-8 text-emerald-400" /></div>
          <div><h2 className="text-3xl font-black text-white">OpenClaw <span className="text-emerald-400">Audit Log</span></h2><p className="text-slate-400">Real-time monitoring of AI Orchestrator actions</p></div>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50">
          <Lucide.RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Memuat...' : 'Refresh Feed'}
        </button>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 font-medium">{error}</div>}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2 text-slate-300 font-bold"><Lucide.Terminal className="w-5 h-5 text-emerald-400" /> System Execution Log</div>
        <div className="divide-y divide-slate-800">
          {logs.length === 0 && !loading && <div className="p-12 text-center text-slate-500">Belum ada log OpenClaw.</div>}
          {logs.map(log => (
            <div key={log.id} className="p-6 hover:bg-slate-800/50 flex flex-col md:flex-row gap-4 md:items-start group">
              <span className="flex-shrink-0 inline-flex items-center px-3 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-lg border border-slate-700">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
              <div><h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{log.action}</h3><p className="text-slate-400 text-sm font-mono whitespace-pre-wrap">{log.details || 'No additional details.'}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- CORETAX FINANCE ERP ---
const CoreFinancePanel = () => {
  const [tab, setTab] = useState<'laba_rugi' | 'pembelian' | 'penjualan' | 'biaya'>('laba_rugi');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const h = { 'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}` };
      try {
        const [pR, sR, eR] = await Promise.all([
          fetch(`${API_BASE}/api/finance/purchases`, { headers: h }),
          fetch(`${API_BASE}/api/finance/sales`, { headers: h }),
          fetch(`${API_BASE}/api/finance/expenses`, { headers: h })
        ]);
        if (pR.ok) setPurchases(await pR.json());
        if (sR.ok) setSales(await sR.json());
        if (eR.ok) setExpenses(await eR.json());
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalPendapatan = sales.reduce((a, s) => a + (s.total_amount || 0), 0);
  const pembelianBeras = purchases.filter(p => p.item_name?.toLowerCase().includes('beras')).reduce((a, p) => a + (p.total_amount || 0), 0);
  const pembelianKemasan = purchases.filter(p => p.item_name?.toLowerCase().includes('kemasan') || p.item_name?.toLowerCase().includes('zak')).reduce((a, p) => a + (p.total_amount || 0), 0);
  const ongkosKuli = expenses.filter(e => e.category?.toLowerCase().includes('kuli')).reduce((a, e) => a + (e.amount || 0), 0);
  const ongkosTruk = expenses.filter(e => e.category?.toLowerCase().includes('truk')).reduce((a, e) => a + (e.amount || 0), 0);
  const biayaUtilitas = expenses.filter(e => e.category?.toLowerCase().includes('pln') || e.category?.toLowerCase().includes('pdam')).reduce((a, e) => a + (e.amount || 0), 0);
  const totalHPP = pembelianBeras + pembelianKemasan + ongkosKuli + ongkosTruk + biayaUtilitas;
  const labaBruto = totalPendapatan - totalHPP;
  const biayaOps = expenses.filter(e => !e.category?.toLowerCase().includes('kuli') && !e.category?.toLowerCase().includes('truk') && !e.category?.toLowerCase().includes('pln') && !e.category?.toLowerCase().includes('pdam')).reduce((a, e) => a + (e.amount || 0), 0);
  const labaBersih = labaBruto - biayaOps;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-black text-slate-800 flex items-center"><Lucide.BarChart3 className="w-8 h-8 mr-3 text-emerald-600" />CoreTax Finance ERP</h2><p className="text-slate-500 mt-1">Sistem Keuangan SAK & Pelaporan Pajak CoreTax</p></div>
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
                <Lucide.FileSpreadsheet className="w-4 h-4" /> Export CoreTax (.xlsx)
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
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold"><tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4">Barang</th><th className="px-6 py-4">Qty KG</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Total (Rp)</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{purchases.map((p, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-6 py-4 text-slate-600">{new Date(p.date).toLocaleDateString('id-ID')}</td><td className="px-6 py-4 font-bold">{p.supplier_name}</td><td className="px-6 py-4">{p.item_name}</td><td className="px-6 py-4">{p.qty_kg?.toLocaleString('id-ID')}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.payment_status}</span></td><td className="px-6 py-4 text-right font-mono font-bold">{p.total_amount?.toLocaleString('id-ID')}</td></tr>))}</tbody>
          </table>
        </div>
      )}
      {tab === 'penjualan' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold"><tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Brand</th><th className="px-6 py-4">Qty Zak</th><th className="px-6 py-4 text-right">Total (Rp)</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{sales.map((s, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-6 py-4 text-slate-600">{new Date(s.date).toLocaleDateString('id-ID')}</td><td className="px-6 py-4 font-bold">{s.customer_name}</td><td className="px-6 py-4">{s.brand_name}</td><td className="px-6 py-4">{s.qty_zak}</td><td className="px-6 py-4 text-right font-mono font-bold">{s.total_amount?.toLocaleString('id-ID')}</td></tr>))}</tbody>
          </table>
        </div>
      )}
      {tab === 'biaya' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold"><tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4">Keterangan</th><th className="px-6 py-4">Tipe Bayar</th><th className="px-6 py-4 text-right">Nominal (Rp)</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{expenses.map((e, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-6 py-4 text-slate-600">{new Date(e.date).toLocaleDateString('id-ID')}</td><td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold">{e.category}</span></td><td className="px-6 py-4">{e.description}</td><td className="px-6 py-4">{e.payment_type}</td><td className="px-6 py-4 text-right font-mono font-bold text-rose-600">{e.amount?.toLocaleString('id-ID')}</td></tr>))}</tbody>
          </table>
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

// --- MAIN APP ---
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('riceflow_v10');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  useEffect(() => { 
    localStorage.setItem('riceflow_v10', JSON.stringify(state)); 
  }, [state]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard state={state} />}
      {activeTab === 'production' && <ProductionPanel state={state} setState={setState} />}
      {activeTab === 'trading' && <TradingPanel state={state} setState={setState} />}
      {activeTab === 'accounting' && <AccountingPanel state={state} />}
      {activeTab === 'core_finance' && <CoreFinancePanel />}
      {activeTab === 'openclaw' && <OpenClawPanel />}
      {activeTab === 'payments' && <PaymentsPanel />}
    </Layout>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
