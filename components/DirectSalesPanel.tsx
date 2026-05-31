
import React, { useState } from 'react';
import { ShoppingCart, Store, FileText, Plus, Trash2, Package, Banknote } from 'lucide-react';

export const DirectSalesPanel = ({ state, onSaleSubmit }: any) => {
  const [sale, setSale] = useState({ 
    customerName: 'Pembeli Umum', 
    items: [{ productId: 'p1', quantity: 0, price: 12500 }], 
    isCredit: false 
  });

  const total = sale.items.reduce((a, b) => a + (b.quantity * b.price), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex items-center">
          <Store className="mr-3 text-amber-600" /> PENJUALAN LANGSUNG (PABRIK)
        </h2>
        <p className="text-slate-500">Transaksi Ritel & Penjualan Tunai di Lokasi Produksi</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-amber-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="font-black text-xl flex items-center text-amber-800">
                <Banknote className="mr-2 text-amber-500" /> Kasir Ritel Pabrik
             </h3>
             <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Total Bayar</span>
                <span className="text-2xl font-black text-amber-600">Rp {total.toLocaleString()}</span>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Pembeli / Keterangan</label>
              <input 
                className="w-full p-4 bg-slate-50 border rounded-2xl font-bold focus:ring-2 focus:ring-amber-500 outline-none" 
                value={sale.customerName} 
                onChange={e => setSale({...sale, customerName: e.target.value})}
                placeholder="Misal: Bapak Sardi / Toko Pojok"
              />
            </div>

            <div className="space-y-3">
               {sale.items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-amber-50/30 p-4 rounded-2xl border border-amber-100 animate-fade-in">
                     <select className="flex-1 p-3 bg-white border rounded-xl font-bold text-sm" value={item.productId} onChange={e => {
                        const n = [...sale.items]; n[idx].productId = e.target.value; setSale({...sale, items: n});
                     }}>
                        {state.inventory.map((i: any) => <option key={i.id} value={i.id}>{i.productName} (Sisa: {i.quantity}kg)</option>)}
                     </select>
                     <input type="number" placeholder="Qty kg" className="w-24 p-3 border rounded-xl font-black text-center" value={item.quantity || ''} onChange={e => {
                        const n = [...sale.items]; n[idx].quantity = Number(e.target.value); setSale({...sale, items: n});
                     }} />
                     <input type="number" placeholder="Harga" className="w-32 p-3 border rounded-xl font-black text-center text-amber-700" value={item.price || ''} onChange={e => {
                        const n = [...sale.items]; n[idx].price = Number(e.target.value); setSale({...sale, items: n});
                     }} />
                     <button onClick={() => setSale({...sale, items: sale.items.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
               ))}
               <button onClick={() => setSale({...sale, items: [...sale.items, { productId: 'p1', quantity: 0, price: 12500 }]})} className="text-xs font-black text-amber-600 flex items-center hover:bg-amber-50 p-2 rounded-lg transition-colors">
                  <Plus className="w-3 h-3 mr-1" /> TAMBAH BARANG
               </button>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-center">
             <button onClick={() => {
                if(total <= 0) return alert("Total belanja nol!");
                onSaleSubmit({ ...sale, totalValue: total, date: new Date().toISOString().split('T')[0], id: Date.now().toString() });
                setSale({ customerName: 'Pembeli Umum', items: [{ productId: 'p1', quantity: 0, price: 12500 }], isCredit: false });
                alert("Nota Penjualan Langsung Berhasil Disimpan!");
             }} className="bg-amber-600 text-white px-20 py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-amber-700 active:scale-95 transition-all">
                SIMPAN & CETAK NOTA
             </button>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col">
              <h3 className="font-black text-slate-700 mb-4 px-2 flex items-center">
                 <Package className="mr-2 w-4 h-4 text-amber-500" /> Stok Gudang Pabrik
              </h3>
              <div className="space-y-2">
                 {state.inventory.map((i: any) => (
                   <div key={i.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-center">
                      <span className="font-bold text-slate-600 text-sm">{i.productName}</span>
                      <span className="font-black text-amber-700">{i.quantity.toLocaleString()} kg</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-amber-900 p-6 rounded-3xl text-white shadow-xl">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">Penjualan Hari Ini</h4>
              <div className="text-3xl font-black">
                 Rp {state.directSalesBook
                    .filter((s: any) => s.date === new Date().toISOString().split('T')[0])
                    .reduce((acc: number, cur: any) => acc + cur.totalValue, 0)
                    .toLocaleString()}
              </div>
              <p className="text-[10px] text-amber-200 mt-2 italic">*Hanya mencakup Penjualan Langsung Pabrik</p>
           </div>
        </div>
      </div>
    </div>
  );
};
