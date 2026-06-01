import React, { useState } from 'react';
import { Users, Truck, Plus, Search, Building2 } from 'lucide-react';

export const CRMPanel = ({ state, setState }: any) => {
  const [activeTab, setActiveTab] = useState('customers'); // customers or suppliers
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', contact: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev: any) => {
      const isCustomer = activeTab === 'customers';
      const listKey = isCustomer ? 'masterCustomers' : 'masterSuppliers';
      const newItem = {
        id: `${isCustomer ? 'CUST' : 'SUPP'}-${Date.now()}`,
        name: formData.name,
        code: formData.code,
        contact_info: formData.contact
      };
      return { ...prev, [listKey]: [...prev[listKey], newItem] };
    });
    setShowModal(false);
    setFormData({ name: '', code: '', contact: '' });
  };

  const list = activeTab === 'customers' ? state.masterCustomers : state.masterSuppliers;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">CRM & Rekanan</h2>
          <p className="text-slate-500">Kelola data pelanggan dan pemasok gabah.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          TAMBAH REKANAN
        </button>
      </div>

      <div className="flex space-x-4 bg-white p-2 rounded-2xl w-fit border border-slate-100">
        <button 
          onClick={() => setActiveTab('customers')}
          className={`flex items-center px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'customers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Building2 className="w-5 h-5 mr-2" /> Distributor (Beras)
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'suppliers' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Truck className="w-5 h-5 mr-2" /> Petani / Pemasok (Gabah)
        </button>
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama rekanan..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="pb-4 font-bold pl-4">Kode</th>
                <th className="pb-4 font-bold">Nama Rekanan</th>
                <th className="pb-4 font-bold">Kontak</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-slate-500">Belum ada data.</td></tr>
              ) : (
                list.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pl-4 font-mono text-sm text-slate-500">{item.code || item.id}</td>
                    <td className="py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="py-4 text-slate-600">{item.contact_info || item.contact || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black mb-6">Tambah {activeTab === 'customers' ? 'Pelanggan' : 'Pemasok'}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Nama Perusahaan / Petani</label>
                <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Kode Unik (Singkatan)</label>
                <input type="text" required value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Kontak / No. HP</label>
                <input type="text" value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 mt-1" />
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
