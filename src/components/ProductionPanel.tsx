import { useState, useEffect } from 'react';
import { Scale, Printer, Truck, User, Save, Combine, Plus, Trash2, PackageOpen } from 'lucide-react';

export const ProductionPanel = ({ state, onMillingSubmit, onAddExpense }: any) => {
  const [activeTab, setActiveTab] = useState('timbangan');
  const [ticket, setTicket] = useState({
    nopol: '',
    driver: '',
    material: 'GKG',
    gross: 0,
    tare: 0,
    netto: 0,
  });

  // State Baru Giling Multiple Input & Output
  const [millInputs, setMillInputs] = useState([{ pileId: 'A', weight: 0 }]);
  const [millOutputs, setMillOutputs] = useState([{ productId: 'p1', weight: 0 }]);

  // State Biaya
  const [exp, setExp] = useState({ desc: '', amount: 0, cat: '61001' });

  // --- INTEGRATED SCALE LISTENER ---
  useEffect(() => {
    // Listens for 'scale-data' events from the Electron wrapper
    if ((window as any).electron) {
      (window as any).electron.on('scale-data', (weight: string) => {
        setTicket((prev) => ({ ...prev, gross: Number(weight) }));
      });
    }
  }, []);

  // Automatic Netto Calculation
  useEffect(() => {
    setTicket((prev) => ({ ...prev, netto: prev.gross - prev.tare }));
  }, [ticket.gross, ticket.tare]);

  const handlePrint = () => {
    window.print();
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

    onMillingSubmit(millInputs, millOutputs);
    alert("Proses Giling Mixing Berhasil!");
    setMillInputs([{ pileId: 'A', weight: 0 }]);
    setMillOutputs([{ productId: 'p1', weight: 0 }]);
  };

  const handleExpense = () => {
    if (!exp.amount || !exp.desc) return alert("Data biaya tidak lengkap!");
    onAddExpense(exp);
    setExp({ desc: '', amount: 0, cat: '61001' });
    alert("Biaya Operasional Tercatat!");
  };

  const handleSaveTicket = async () => {
    if (!ticket.nopol || ticket.netto <= 0) return alert('Data tidak lengkap!');

    const response = await fetch(
      'https://sabrent.pythonanywhere.com/api/scale/ticket',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      }
    );

    if (response.ok) {
      alert('Tiket Berhasil Disimpan!');
      setTicket({
        nopol: '',
        driver: '',
        material: 'GKG',
        gross: 0,
        tare: 0,
        netto: 0,
      });
    }
  };

  return (
    <div className="space-y-6 text-stone-800">
      <header className="flex glass-panel p-2 rounded-2xl w-fit no-print border-amber-200/50">
        {['timbangan', 'giling', 'biaya', 'stok'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === t
              ? 'bg-amber-700/80 text-white shadow-lg backdrop-blur-md'
              : 'text-stone-500 hover:bg-stone-100/50'
              }`}
          >
            {t === 'giling' ? 'PROSES GILING (MIXING)' : t.toUpperCase()}
          </button>
        ))}
      </header>

      {activeTab === 'timbangan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 glass border-amber-200/30 p-8 rounded-3xl space-y-6 no-print">
            <h3 className="text-xl font-black text-stone-800 flex items-center">
              <Scale className="mr-2 text-amber-600" /> Input Timbangan Masuk
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Nomor Polisi (Nopol)
                </label>
                <div className="relative">
                  <Truck className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                  <input
                    className="w-full p-4 pl-12 bg-slate-50 border rounded-2xl font-black text-lg uppercase"
                    value={ticket.nopol}
                    onChange={(e) =>
                      setTicket({
                        ...ticket,
                        nopol: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="L 1234 AB"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Nama Sopir
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                  <input
                    className="w-full p-4 pl-12 bg-slate-50 border rounded-2xl font-bold"
                    value={ticket.driver}
                    onChange={(e) =>
                      setTicket({ ...ticket, driver: e.target.value })
                    }
                    placeholder="Nama Sopir"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <label className="text-[10px] font-black text-blue-600 uppercase">
                  Berat Gross (kg)
                </label>
                <input
                  type="number"
                  className="w-full bg-transparent text-4xl font-black text-blue-900 outline-none"
                  value={ticket.gross || ''}
                  onChange={(e) =>
                    setTicket({ ...ticket, gross: Number(e.target.value) })
                  }
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border">
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Berat Tare (kg)
                </label>
                <input
                  type="number"
                  className="w-full bg-transparent text-4xl font-black text-slate-600 outline-none"
                  value={ticket.tare || ''}
                  onChange={(e) =>
                    setTicket({ ...ticket, tare: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSaveTicket}
                className="flex-1 bg-stone-800/90 backdrop-blur-sm border border-stone-600 text-amber-50 py-5 rounded-2xl font-black text-lg flex justify-center items-center hover:bg-stone-900 transition-colors shadow-lg"
              >
                <Save className="mr-2" /> SIMPAN DATA
              </button>
              <button
                onClick={handlePrint}
                className="px-8 glass hover:bg-white/80 border-2 border-stone-800 text-stone-800 py-5 rounded-2xl font-black text-lg flex justify-center items-center transition-colors shadow-sm"
              >
                <Printer className="mr-2" /> CETAK
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border shadow-lg border-emerald-100 print:shadow-none print:border-none print:fixed print:inset-0 print:z-[100] print:bg-white">
            <div className="text-center border-b-2 border-dashed pb-4 mb-4">
              <h2 className="font-black text-xl text-emerald-800">
                PP BUMI MAS
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Jembatan Timbang Digital - Surabaya
              </p>
            </div>
            <div className="space-y-4 py-4 border-b-2 border-dashed">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold">NOPOL:</span>
                <span className="font-black">{ticket.nopol || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold">SOPIR:</span>
                <span className="font-black">{ticket.driver || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold">TANGGAL:</span>
                <span className="font-black">
                  {new Date().toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
            <div className="py-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>GROSS</span>
                <span className="font-bold">
                  {ticket.gross.toLocaleString()} kg
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TARE</span>
                <span className="font-bold">
                  {ticket.tare.toLocaleString()} kg
                </span>
              </div>
              <div className="flex justify-between text-xl font-black pt-4 border-t">
                <span>NETTO</span>
                <span className="text-emerald-600">
                  {ticket.netto.toLocaleString()} kg
                </span>
              </div>
            </div>
            <div className="mt-10 text-center">
              <div className="h-20 w-32 border-b border-slate-300 mx-auto"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">
                Tanda Tangan Sopir
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'giling' && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 animate-fade-in no-print">
          <div className="glass border-amber-200/30 p-10 rounded-3xl space-y-10">
            <div className="flex justify-between items-center border-b border-stone-300/30 pb-6">
              <div>
                <h3 className="font-black text-stone-800 text-2xl">Form Giling (Mixing & Blending)</h3>
                <p className="text-sm text-stone-600">Input tumpukan gabah dan hasil beras secara variatif.</p>
              </div>
              <div className="text-right bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm min-w-[200px]">
                <p className="text-[10px] font-black text-amber-600 uppercase mb-1 drop-shadow-sm">Total Input Produksi</p>
                <p className="text-3xl font-black text-amber-700 drop-shadow-sm">{millInputs.reduce((a, b) => a + b.weight, 0).toLocaleString()} <small className="text-sm">kg</small></p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* BAGIAN INPUT GABAH (MIXING) */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center">
                    <Combine className="mr-2 w-4 h-4 text-emerald-500" /> Input Tumpukan (Max 15)
                  </h4>
                  <button onClick={() => setMillInputs([...millInputs, { pileId: 'A', weight: 0 }])} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-black hover:bg-emerald-200 flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> TAMBAH TUMPUKAN
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {millInputs.map((inp, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 animate-fade-in">
                      <select className="flex-1 p-3 bg-white border rounded-xl font-bold text-sm text-slate-500" value={inp.pileId}
                        onChange={e => {
                          const newIn = [...millInputs];
                          newIn[idx].pileId = e.target.value;
                          setMillInputs(newIn);
                        }}>
                        {state.piles.map((p: any) => <option key={p.id} value={p.id}>Pile {p.id} (Sisa: {p.currentWeight} kg)</option>)}
                      </select>
                      <input type="number" placeholder="Qty kg" className="w-32 p-3 bg-white border rounded-xl font-black text-center text-slate-500" value={inp.weight || ''}
                        onChange={e => {
                          const newIn = [...millInputs];
                          newIn[idx].weight = Number(e.target.value);
                          setMillInputs(newIn);
                        }} />
                      <button onClick={() => setMillInputs(millInputs.filter((_, i) => i !== idx))} className="p-3 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BAGIAN HASIL BERAS (OUTPUT) */}
              <div className="space-y-6 border-l lg:pl-12">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center">
                    <PackageOpen className="mr-2 w-4 h-4 text-blue-500" /> Hasil Produksi (Barang Jadi)
                  </h4>
                  <button onClick={() => setMillOutputs([...millOutputs, { productId: 'p1', weight: 0 }])} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-black hover:bg-blue-200 flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> TAMBAH PRODUK
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {millOutputs.map((out, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 animate-fade-in">
                      <select className="flex-1 p-3 bg-white border rounded-xl font-bold text-sm text-slate-500" value={out.productId}
                        onChange={e => {
                          const newOut = [...millOutputs];
                          newOut[idx].productId = e.target.value;
                          setMillOutputs(newOut);
                        }}>
                        {state.inventory.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.name || inv.productName}</option>)}
                      </select>
                      <input type="number" placeholder="Qty kg" className="w-32 p-3 bg-white border rounded-xl font-black text-center text-slate-500" value={out.weight || ''}
                        onChange={e => {
                          const newOut = [...millOutputs];
                          newOut[idx].weight = Number(e.target.value);
                          setMillOutputs(newOut);
                        }} />
                      <button onClick={() => setMillOutputs(millOutputs.filter((_, i) => i !== idx))} className="p-3 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Ringkasan Rendemen */}
                <div className="mt-8 p-6 glass-dark border-r-0 border-l border-amber-500/20 bg-stone-900/80 rounded-3xl text-stone-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-stone-400">Total Output Hasil</span>
                    <span className="font-black text-xl text-amber-100">{millOutputs.reduce((a, b) => a + b.weight, 0).toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-[10px] font-black uppercase text-stone-400">Rendemen Giling</span>
                    <span className="text-3xl font-black text-amber-400">
                      {millInputs.reduce((a, b) => a + b.weight, 0) > 0 ? ((millOutputs.reduce((a, b) => a + b.weight, 0) / millInputs.reduce((a, b) => a + b.weight, 0)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-stone-300/30 flex justify-center">
              <button onClick={handleGilingMixing} className="bg-amber-700/90 text-stone-50 px-20 py-5 rounded-2xl font-black text-xl hover:bg-amber-800 shadow-xl transform active:scale-95 transition-all border border-amber-600/50 backdrop-blur-sm">
                POSTING PRODUKSI (TUTUP HARI)
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'biaya' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in no-print">
          <div className="glass p-8 rounded-3xl space-y-6">
            <h3 className="font-black text-slate-800 text-lg">Input Pengeluaran</h3>
            <div className="space-y-4">
              <select className="w-full p-4 glass-input rounded-2xl text-slate-700 font-bold" value={exp.cat} onChange={e => setExp({ ...exp, cat: e.target.value })}>
                <option value="61001">Listrik & Solar</option>
                <option value="61002">Gaji Borongan</option>
                <option value="61003">Perawatan Mesin</option>
              </select>
              <input placeholder="Keterangan" className="w-full p-4 bg-[#3E3D40] text-white border-none rounded-2xl placeholder-[#969599]" value={exp.desc} onChange={e => setExp({ ...exp, desc: e.target.value })} />
              <input type="number" placeholder="Rp" className="w-full p-4 bg-[#FFF5F5] border-none rounded-2xl font-black text-xl text-[#E53935] placeholder-[#FFD6D6]" value={exp.amount || ''} onChange={e => setExp({ ...exp, amount: Number(e.target.value) })} />
              <button onClick={handleExpense} className="w-full bg-[#D32F2F] text-white py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition-colors shadow-sm">POSTING BIAYA</button>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl overflow-hidden flex flex-col">
            <h3 className="font-bold text-slate-700 mb-4 px-2">Log Buku Biaya</h3>
            <div className="flex-1 overflow-y-auto space-y-3 px-2">
              {state.expenseBook.slice().reverse().map((e: any) => (
                <div key={e.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center">
                  <div><p className="font-black text-slate-800">{e.desc}</p><p className="text-[10px] text-slate-400 uppercase">{e.date}</p></div>
                  <p className="font-black text-red-600">-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(e.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stok' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in no-print">
          {state.piles.map((p: any) => (
            <div key={p.id} className="glass p-6 rounded-3xl text-center hover:scale-[1.02] transition-transform">
              <p className="text-[10px] font-black text-slate-500 uppercase">Pile {p.id}</p>
              <p className="text-2xl font-black text-slate-800">{p.currentWeight.toLocaleString()} <small className="text-xs">kg</small></p>
            </div>
          ))}
          {state.inventory.map((i: any) => (
            <div key={i.id} className="glass p-6 rounded-3xl text-center border-indigo-200/50 hover:scale-[1.02] transition-transform">
              <p className="text-[10px] font-black text-indigo-500 uppercase">{i.name || i.productName}</p>
              <p className="text-2xl font-black text-indigo-900">{i.quantity.toLocaleString()} <small className="text-xs">kg</small></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
