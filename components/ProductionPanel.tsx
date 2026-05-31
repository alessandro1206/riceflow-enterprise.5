
import React, { useState } from 'react';
import { Building2, Scale, RefreshCcw, Package, Wallet, Plus, Trash2, Combine, PackageOpen } from 'lucide-react';

export const ProductionPanel = ({ state, onMillingSubmit, onAddExpense }: any) => {
  const [activeTab, setActiveTab] = useState('giling');
  const [millInputs, setMillInputs] = useState([{ pileId: 'A', weight: 0 }]);
  const [millOutputs, setMillOutputs] = useState([{ productId: 'p1', weight: 0 }]);

  const addInput = () => {
    if(millInputs.length < 15) setMillInputs([...millInputs, { pileId: 'A', weight: 0 }]);
  };

  const addOutput = () => {
    setMillOutputs([...millOutputs, { productId: 'p1', weight: 0 }]);
  };

  const totalInput = millInputs.reduce((a, b) => a + b.weight, 0);
  const totalOutput = millOutputs.reduce((a, b) => a + b.weight, 0);

  return (
    <div className="space-y-6">
      <header className="flex bg-white p-2 rounded-2xl border shadow-sm w-fit">
        {['timbangan', 'giling', 'biaya', 'stok'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === t ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            {t === 'giling' ? 'PROSES GILING (MIXING)' : t.toUpperCase()}
          </button>
        ))}
      </header>

      {activeTab === 'giling' && (
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b pb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Mixing & Giling Pro</h3>
                <p className="text-slate-500 text-sm">Input pencampuran tumpukan dan hasil produksi variatif.</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-right">
                <p className="text-[10px] font-black text-amber-600 uppercase">Total Input</p>
                <p className="text-3xl font-black text-amber-700">{totalInput.toLocaleString()} kg</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-700 text-xs uppercase flex items-center"><Combine className="mr-2 w-4 h-4 text-emerald-500" /> Input Tumpukan (Max 15)</h4>
                  <button onClick={addInput} className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg font-black hover:bg-emerald-200">+ TAMBAH TUMPUKAN</button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {millInputs.map((inp, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border animate-fade-in">
                      <select className="flex-1 p-3 bg-white border rounded-xl font-bold text-sm" value={inp.pileId} onChange={e => {
                        const n = [...millInputs]; n[idx].pileId = e.target.value; setMillInputs(n);
                      }}>
                        {state.piles.map((p: any) => <option key={p.id} value={p.id}>Pile {p.id} ({p.currentWeight.toLocaleString()} kg)</option>)}
                      </select>
                      <input type="number" placeholder="Qty kg" className="w-32 p-3 bg-white border rounded-xl font-black text-center" value={inp.weight || ''} onChange={e => {
                        const n = [...millInputs]; n[idx].weight = Number(e.target.value); setMillInputs(n);
                      }} />
                      <button onClick={() => setMillInputs(millInputs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6 border-l lg:pl-12">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-700 text-xs uppercase flex items-center"><PackageOpen className="mr-2 w-4 h-4 text-blue-500" /> Hasil Beras & Limbah</h4>
                  <button onClick={addOutput} className="text-[10px] bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-black hover:bg-blue-200">+ TAMBAH HASIL</button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {millOutputs.map((out, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-blue-50/50 p-3 rounded-2xl border animate-fade-in">
                      <select className="flex-1 p-3 bg-white border rounded-xl font-bold text-sm" value={out.productId} onChange={e => {
                        const n = [...millOutputs]; n[idx].productId = e.target.value; setMillOutputs(n);
                      }}>
                        {state.inventory.map((i: any) => <option key={i.id} value={i.id}>{i.productName}</option>)}
                      </select>
                      <input type="number" placeholder="Hasil kg" className="w-32 p-3 bg-white border rounded-xl font-black text-center text-blue-700" value={out.weight || ''} onChange={e => {
                        const n = [...millOutputs]; n[idx].weight = Number(e.target.value); setMillOutputs(n);
                      }} />
                      <button onClick={() => setMillOutputs(millOutputs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                  <div className="flex justify-between mb-2"><span className="text-[10px] font-black uppercase text-slate-400">Total Output</span><span className="font-black">{totalOutput.toLocaleString()} kg</span></div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-[10px] font-black uppercase text-slate-400">Rendemen Akhir</span>
                    <span className="text-3xl font-black text-emerald-400">{totalInput > 0 ? ((totalOutput/totalInput)*100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="pt-8 border-t flex justify-center">
              <button onClick={() => {
                onMillingSubmit(millInputs, millOutputs);
                setMillInputs([{ pileId: 'A', weight: 0 }]);
                setMillOutputs([{ productId: 'p1', weight: 0 }]);
                alert("Produksi Berhasil di Posting ke Gudang!");
              }} className="bg-slate-900 text-white px-16 py-5 rounded-2xl font-black text-xl hover:bg-emerald-900 shadow-2xl transition-all">POSTING PRODUKSI KE GUDANG</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stok' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          {state.piles.map((p: any) => (
            <div key={p.id} className="bg-white p-6 rounded-3xl border shadow-sm text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase">Pile {p.id}</p>
               <p className="text-2xl font-black text-slate-800">{p.currentWeight.toLocaleString()} <small className="text-xs">kg</small></p>
            </div>
          ))}
          {state.inventory.map((i: any) => (
            <div key={i.id} className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
               <p className="text-[10px] font-black text-indigo-600 uppercase">{i.productName}</p>
               <p className="text-2xl font-black text-indigo-900">{i.quantity.toLocaleString()} <small className="text-xs">kg</small></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
