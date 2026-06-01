import React, { useState } from 'react';
import { Receipt, Plus, Search, Calendar, DollarSign, Briefcase } from 'lucide-react';

export const ExpensePanel = ({ state, setState }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const categories = ['Operasional Pabrik', 'Gaji Karyawan', 'Listrik & Air', 'Perawatan Mesin', 'Transportasi', 'Lain-lain'];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    
    // Add to ExpenseBook
    setState((prev: any) => {
      const newExpense = {
        id: `EXP-${Date.now()}`,
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: amount
      };

      // Create a Journal Entry as well
      const newJournal = {
        id: `JRN-${Date.now()}`,
        date: formData.date,
        description: `Biaya: ${formData.description} (${formData.category})`,
        lines: [
          { accountId: '61001', debit: amount, credit: 0 },
          { accountId: '11001', debit: 0, credit: amount }
        ]
      };

      return { 
        ...prev, 
        expenseBook: [...(prev.expenseBook || []), newExpense],
        journal: [...prev.journal, newJournal]
      };
    });

    setShowModal(false);
    setFormData({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const expenses = state.expenseBook || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expense Tracker</h2>
          <p className="text-slate-500">Pencatatan biaya operasional dan pengeluaran pabrik.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          CATAT PENGELUARAN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mr-4">
            <DollarSign className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm">Total Pengeluaran Bulan Ini</p>
            <p className="text-2xl font-black text-slate-800">
              Rp {expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari deskripsi pengeluaran..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="pb-4 font-bold pl-4">Tanggal</th>
                <th className="pb-4 font-bold">Kategori</th>
                <th className="pb-4 font-bold">Deskripsi</th>
                <th className="pb-4 font-bold text-right pr-4">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Belum ada pengeluaran tercatat.</td></tr>
              ) : (
                expenses.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pl-4 text-sm text-slate-600 font-medium">{item.date}</td>
                    <td className="py-4">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">{item.category}</span>
                    </td>
                    <td className="py-4 font-medium text-slate-800">{item.description}</td>
                    <td className="py-4 text-right pr-4 font-black text-rose-600">
                      Rp {item.amount.toLocaleString('id-ID')}
                    </td>
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
            <h3 className="text-2xl font-black mb-6">Catat Pengeluaran Baru</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Tanggal</label>
                <input type="date" required value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Kategori Biaya</label>
                <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 mt-1">
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Deskripsi Detail</label>
                <input type="text" required value={formData.description} placeholder="Contoh: Beli solar 50 liter" onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Nominal (Rp)</label>
                <input type="number" required value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 mt-1 font-mono text-lg" />
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg transition-colors">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
