import React, { useState } from 'react';
import { Tag, Save, TrendingUp, Info } from 'lucide-react';

interface PricePanelProps {
  state: any;
  onUpdatePrice: (productId: string, newPrice: number) => void;
}

export const PricePanel: React.FC<PricePanelProps> = ({ state, onUpdatePrice }) => {
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: number }>({});


  const handleSave = (productId: string) => {
    const newPrice = editedPrices[productId];
    if (newPrice !== undefined) {
      onUpdatePrice(productId, newPrice);
      alert('Price updated successfully!');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Tag className="mr-3 text-emerald-600" /> DAFTAR HARGA
          </h2>
          <p className="text-slate-500">
            Manajemen Harga Jual Produk Bumi Mas Group
          </p>
        </div>
        <div className="glass-panel px-6 py-3 border-emerald-500/20 bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" /> Live Market Rate: Rp 12.800/kg
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center">
            <Info className="w-5 h-5 mr-2 text-amber-500" /> Kontrol Harga Satuan
          </h3>
          <div className="space-y-4">
            {state.inventory.map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-6 bg-white/50 rounded-2xl border border-white/60 hover:border-emerald-500/30 transition-all group">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase">{product.id}</p>
                  <p className="font-bold text-slate-800">{product.productName}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      className="w-40 p-3 pl-10 glass-input font-black text-emerald-700"
                      value={editedPrices[product.id] !== undefined ? editedPrices[product.id] : product.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditedPrices(prev => ({ ...prev, [product.id]: val }));
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleSave(product.id)}
                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/10 opacity-0 group-hover:opacity-100"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1E293B] p-8 rounded-[32px] text-white overflow-hidden relative">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>
            <h4 className="text-amber-400 font-black text-xs uppercase tracking-widest mb-2 relative z-10">Strategi Harga</h4>
            <p className="text-2xl font-black text-white relative z-10">Margin Profit Beras Premium</p>
            <p className="text-slate-400 text-sm mt-4 relative z-10">
              Sistem secara otomatis menghitung estimasi keuntungan berdasarkan harga beli gabah rata-rata (HPP). Pastikan harga jual tetap kompetitif di area Jawa Timur.
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 relative z-10 flex justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Avg HPP</p>
                <p className="font-bold">Rp 8.900</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase italic">Target Profit</p>
                <p className="font-bold text-emerald-400">15 - 20%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
