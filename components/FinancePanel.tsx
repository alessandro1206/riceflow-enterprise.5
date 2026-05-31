import React, { useState } from 'react';
import { Book, Plus, Save, X, FileText } from 'lucide-react';

export const FinancePanel = ({ purchases, accounts, onPostJournal }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ desc: '', acc: '11001', amount: 0, type: 'OUT' });

  const addItem = () => {
    if(!form.desc || form.amount <= 0) return;
    setItems([...items, { ...form, id: Date.now(), in: form.type === 'IN' ? form.amount : 0, out: form.type === 'OUT' ? form.amount : 0, date: new Date().toISOString().split('T')[0] }]);
    setForm({ desc: '', acc: '11001', amount: 0, type: 'OUT' });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center"><Book className="mr-2 text-emerald-600" /> Buku Kas Harian (Draft)</h3>
            <div className="flex gap-2">
               <input type="text" placeholder="Keterangan" className="p-2 border rounded-xl text-sm w-64" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
               <select className="p-2 border rounded-xl text-sm" value={form.acc} onChange={e => setForm({...form, acc: e.target.value})}>
                  {accounts.map((a: any) => <option key={a.code} value={a.code}>{a.name}</option>)}
               </select>
               <input type="number" placeholder="Rp" className="p-2 border rounded-xl text-sm w-32 font-bold" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
               <button onClick={addItem} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700"><Plus className="w-5 h-5" /></button>
            </div>
         </div>

         <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
               <tr>
                  <th className="p-3 text-left">Keterangan</th>
                  <th className="p-3 text-right text-emerald-600">Terima (+)</th>
                  <th className="p-3 text-right text-red-600">Bayar (-)</th>
                  <th className="p-3 w-10"></th>
               </tr>
            </thead>
            <tbody className="divide-y">
               {items.map(it => (
                  <tr key={it.id} className="hover:bg-slate-50">
                     <td className="p-3 font-medium">{it.desc}</td>
                     <td className="p-3 text-right text-emerald-600 font-bold">{it.in > 0 ? it.in.toLocaleString() : '-'}</td>
                     <td className="p-3 text-right text-red-600 font-bold">{it.out > 0 ? it.out.toLocaleString() : '-'}</td>
                     <td className="p-3"><button onClick={() => setItems(items.filter(x => x.id !== it.id))}><X className="w-4 h-4 text-slate-300" /></button></td>
                  </tr>
               ))}
               {items.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">Belum ada transaksi hari ini.</td></tr>}
            </tbody>
         </table>

         <div className="mt-6 flex justify-end">
            <button onClick={() => { onPostJournal(items); setItems([]); }} disabled={items.length === 0} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center disabled:opacity-50">
               <Save className="w-5 h-5 mr-2" /> TUTUP BUKU & POSTING
            </button>
         </div>
      </div>
    </div>
  );
};