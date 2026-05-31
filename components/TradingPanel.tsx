
import React, { useState } from 'react';
import { ShoppingCart, Briefcase, FileText, Plus, Trash2, Package } from 'lucide-react';

export const TradingPanel = ({ state, onSaleSubmit }: any) => {
  const [sale, setSale] = useState({ custId: 'c1', items: [{ productId: 'p1', quantity: 0, price: 12500 }], isCredit: false });

  const total = sale.items.reduce((a, b) => a + (b.quantity * b.price), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex items-center"><Briefcase className="mr-3 text-indigo-600" /> CV. TRADING MAKMUR</h2>
        <p className="text-slate-500">Penjualan Beras Hasil Produksi PP BUMI MAS</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <h3 className="font-black text-xl flex items-center"><ShoppingCart className="mr-2 text-indigo-500" /> Form Penjualan Distributor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Distributor</label>
              <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={sale.custId} onChange={e => setSale({...sale, custId: e.target.value})}>
                {state.masterCustomers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2 px-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5" checked={sale.isCredit} onChange={e => setSale({...sale, isCredit: e.target.checked})} />
                <span className="font-bold text-slate-600">Jual Tempo (Piutang)</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
             {sale.items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border">
                   <select className="flex-1 p-3 bg-white border rounded-xl font-bold" value={item.productId} onChange={e => {
                      const n = [...sale.items]; n[idx].productId = e.target.value; setSale({...sale, items: n});
                   }}>
                      {state.inventory.map((i: any) => <option key={i.id} value={i.id}>{i.productName} (Stok: {i.quantity}kg)</option>)}
                   </select>
                   <input type="number" placeholder="Qty kg" className="w-24 p-3 border rounded-xl font-black text-center" value={item.quantity || ''} onChange={e => {
                      const n = [...sale.items]; n[idx].quantity = Number(e.target.value); setSale({...sale, items: n});
                   }} />
                   <input type="number" placeholder="Harga" className="w-32 p-3 border rounded-xl font-black text-center text-indigo-600" value={item.price || ''} onChange={e => {
                      const n = [...sale.items]; n[idx].price = Number(e.target.value); setSale({...sale, items: n});
                   }} />
                   <button onClick={() => setSale({...sale, items: sale.items.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
             ))}
             <button onClick={() => setSale({...sale, items: [...sale.items, { productId: 'p1', quantity: 0, price: 12500 }]})} className="text-xs font-black text-indigo-600 flex items-center hover:underline"><Plus className="w-3 h-3 mr-1" /> TAMBAH PRODUK LAIN</button>
          </div>

          <div className="pt-6 border-t flex justify-between items-center">
             <div className="text-right flex-1 pr-6">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Invoice</p>
                <p className="text-2xl font-black text-slate-800">Rp {total.toLocaleString()}</p>
             </div>
             <button onClick={() => {
                const cust = state.masterCustomers.find((c: any) => c.id === sale.custId);
                onSaleSubmit({ ...sale, customerName: cust.name, totalValue: total, date: new Date().toISOString().split('T')[0], id: Date.now().toString() });
                setSale({ custId: 'c1', items: [{ productId: 'p1', quantity: 0, price: 12500 }], isCredit: false });
                alert("Penjualan Berhasil!");
             }} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700">SIMPAN PENJUALAN</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col">
           <h3 className="font-black text-slate-700 mb-4 px-2 flex items-center"><Package className="mr-2 w-4 h-4" /> Stok Siap Jual</h3>
           <div className="space-y-2">
              {state.inventory.map((i: any) => (
                <div key={i.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-center">
                   <span className="font-bold text-slate-600">{i.productName}</span>
                   <span className="font-black text-indigo-700">{i.quantity.toLocaleString()} kg</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
