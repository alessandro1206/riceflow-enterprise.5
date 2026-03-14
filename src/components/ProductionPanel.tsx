import {
  useState,
} from 'react';
import {
  Combine,
  Plus,
  Trash2,
  Scale,
} from 'lucide-react';

export const ProductionPanel = ({
  state,
  onMillingSubmit,
  onAddExpense
}: any) => {
const [activeTab, setActiveTab] = useState('giling');

  // State Baru Giling Multiple Input & Output
  const [millInputs, setMillInputs] = useState([{
    pileId: 'A',
    weight: 0
  }]);
  const [millOutputs, setMillOutputs] = useState([{
    productId: 'p1',
    weight: 0
  }]);

  // State Biaya
  const [exp, setExp] = useState({ desc: '', amount: 0, cat: '61001' });

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



  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex justify-between items-end no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Scale className="mr-3 text-emerald-600" /> TIMBANGAN & GILING
          </h2>
          <p className="text-slate-500 font-medium">
            Pusat Pengawasan Infrastruktur & Produksi Bumi Mas
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {['giling', 'biaya'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-tight transition-all ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'biaya' ? 'BIAYA OPS' : tab}
            </button>
          ))}
        </div>
      </header>



      {activeTab === 'giling' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
           <div className="glass-panel p-10">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10">Konfigurasi Penggilingan</h3>
              <div className="space-y-8">
                 <div className="p-8 bg-emerald-50/50 rounded-[40px] border border-emerald-100/50">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Input Gabah (Bahan)</p>
                      <button onClick={() => setMillInputs([...millInputs, { pileId: 'A', weight: 0 }])} className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm hover:scale-110 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {millInputs.map((input, idx) => (
                        <div key={idx} className="flex space-x-4 animate-fade-in">
                          <select 
                            className="flex-1 p-4 glass-input font-bold text-sm"
                            value={input.pileId}
                            onChange={(e) => {
                              const newInputs = [...millInputs];
                              newInputs[idx].pileId = e.target.value;
                              setMillInputs(newInputs);
                            }}
                          >
                            {state.piles.map((p: any) => (
                              <option key={p.id} value={p.id}>TUMPUKAN {p.id} ({p.type})</option>
                            ))}
                          </select>
                          <input 
                            type="number"
                            className="w-32 p-4 glass-input font-black text-sm text-center"
                            placeholder="KG"
                            value={input.weight || ''}
                            onChange={(e) => {
                              const newInputs = [...millInputs];
                              newInputs[idx].weight = Number(e.target.value);
                              setMillInputs(newInputs);
                            }}
                          />
                          {millInputs.length > 1 && (
                            <button onClick={() => setMillInputs(millInputs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="p-8 bg-slate-50 rounded-[40px] border border-white">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Produksi (Jadi)</p>
                      <button onClick={() => setMillOutputs([...millOutputs, { productId: 'p1', weight: 0 }])} className="p-2 bg-white text-slate-600 rounded-xl shadow-sm hover:scale-110 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {millOutputs.map((output, idx) => (
                        <div key={idx} className="flex space-x-4 animate-fade-in">
                          <select 
                            className="flex-1 p-4 glass-input font-bold text-sm"
                            value={output.productId}
                            onChange={(e) => {
                              const newOutputs = [...millOutputs];
                              newOutputs[idx].productId = e.target.value;
                              setMillOutputs(newOutputs);
                            }}
                          >
                            {state.inventory.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.productName}</option>
                            ))}
                          </select>
                          <input 
                            type="number"
                            className="w-32 p-4 glass-input font-black text-sm text-center"
                            placeholder="KG"
                            value={output.weight || ''}
                            onChange={(e) => {
                              const newOutputs = [...millOutputs];
                              newOutputs[idx].weight = Number(e.target.value);
                              setMillOutputs(newOutputs);
                            }}
                          />
                           {millOutputs.length > 1 && (
                            <button onClick={() => setMillOutputs(millOutputs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 <button 
                   onClick={handleGilingMixing}
                   className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center space-x-3 group"
                 >
                   <Combine className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                   <span className="tracking-tighter text-lg uppercase">EKSEKUSI PROSES PRODUKSI</span>
                 </button>
              </div>
           </div>

           <div className="space-y-10">
              <div className="bg-[#1E293B] p-10 rounded-[48px] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full translate-x-32 -translate-y-32"></div>
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 relative z-10">Kalkulasi Rendemen</h4>
                 <div className="grid grid-cols-2 gap-10 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Total Input</p>
                      <p className="text-3xl font-black tracking-tighter">{millInputs.reduce((a, b) => a + b.weight, 0).toLocaleString()} <small className="text-sm font-bold text-slate-500">KG</small></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-2 italic">Rendemen Akurat</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                        {millInputs.reduce((a, b) => a + b.weight, 0) > 0 
                          ? ((millOutputs.reduce((a, b) => a + b.weight, 0) / millInputs.reduce((a, b) => a + b.weight, 0)) * 100).toFixed(1) 
                          : '0.0'}%
                      </p>
                    </div>
                 </div>
                 <p className="mt-10 text-xs text-slate-400 font-medium leading-relaxed relative z-10">
                   Persentase rendemen dihitung secara otomatis berdasarkan perbandingan input bahan baku dan output produk jadi.
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'biaya' && (
        <div className="max-w-2xl mx-auto animate-fade-in">
           <div className="glass-panel p-12">
              <div className="text-center mb-12">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-2">Pencatatan Biaya</h3>
                <p className="text-slate-400 text-xs font-medium">Buku Kas Operasional Bumi Mas Group</p>
              </div>
              <div className="space-y-8">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Keterangan Pengeluaran</label>
                   <input 
                     type="text"
                     className="w-full p-6 glass-input font-bold text-slate-800"
                     placeholder="contoh: Pembelian Solar Mesin Giling 200L"
                     value={exp.desc}
                     onChange={(e) => setExp({...exp, desc: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Jumlah (IDR)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                        <input 
                          type="number"
                          className="w-full p-6 pl-14 glass-input font-black text-emerald-700 text-xl"
                          value={exp.amount || ''}
                          onChange={(e) => setExp({...exp, amount: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Kategori Akun</label>
                      <select 
                        className="w-full p-6 glass-input font-black text-sm cursor-pointer"
                        value={exp.cat}
                        onChange={(e) => setExp({...exp, cat: e.target.value})}
                      >
                         <option value="61001">Solar & Energi</option>
                         <option value="61002">Gaji Borongan</option>
                         <option value="61003">Mekanik & Suku Cadang</option>
                         <option value="61004">Logistik & Distribusi</option>
                      </select>
                    </div>
                 </div>
                 <button 
                  onClick={handleExpense}
                  className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black shadow-2xl hover:bg-emerald-700 transition-all mt-6 uppercase tracking-widest text-sm"
                 >
                   SIMPAN TRANSAKSI BIAYA
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
