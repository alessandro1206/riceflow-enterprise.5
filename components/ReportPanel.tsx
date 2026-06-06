import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';

const API_BASE = 'https://sabrent.pythonanywhere.com';
const fCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

interface ReportData {
  purchases: any[];
  sales: any[];
  expenses: any[];
}

export default function ReportPanel() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [data, setData] = useState<ReportData>({ purchases: [], sales: [], expenses: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const h = { 'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}` };
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/finance/purchases`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_BASE}/api/finance/sales`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_BASE}/api/finance/expenses`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([p, s, e]) => {
      setData({ purchases: p, sales: s, expenses: e });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filter data by period
  const filterByPeriod = (items: any[], dateField: string = 'created_at') => {
    const now = new Date();
    return items.filter(item => {
      const d = new Date(item[dateField] || item.date || item.created_at);
      if (period === 'weekly') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo && d <= now;
      } else {
        const [year, month] = selectedMonth.split('-').map(Number);
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
      }
    });
  };

  const filteredPurchases = filterByPeriod(data.purchases);
  const filteredSales = filterByPeriod(data.sales);
  const filteredExpenses = filterByPeriod(data.expenses);

  const totalPendapatan = filteredSales.reduce((a: number, s: any) => a + (s.total_amount || 0), 0);
  const totalHPP = filteredPurchases.reduce((a: number, p: any) => a + (p.total_amount || 0), 0);
  const totalBiaya = filteredExpenses.reduce((a: number, e: any) => a + (e.amount || 0), 0);
  const labaKotor = totalPendapatan - totalHPP;
  const labaBersih = labaKotor - totalBiaya;

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  filteredExpenses.forEach((e: any) => {
    const cat = e.category || e.description || 'Lain-lain';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.amount || 0);
  });

  const handlePrint = () => window.print();

  const periodLabel = period === 'weekly'
    ? `Minggu Ini (${new Date(Date.now() - 7 * 86400000).toLocaleDateString('id-ID')} - ${new Date().toLocaleDateString('id-ID')})`
    : new Date(`${selectedMonth}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Lucide.FileText className="w-8 h-8 text-indigo-600" />
            Laporan Keuangan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Laporan Laba Rugi (Income Statement)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700 shadow-sm">
            <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === 'weekly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              Mingguan
            </button>
            <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              Bulanan
            </button>
          </div>
          {period === 'monthly' && (
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200" />
          )}
          <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
            <Lucide.Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Printable Report */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Report Header */}
        <div className="p-8 border-b dark:border-slate-700 print:border-b-4 print:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-800 dark:bg-emerald-600 rounded-full flex items-center justify-center print:bg-slate-800">
                <Lucide.Wheat className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">BUMI MAS GROUP</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pabrik Penggilingan Padi & Perdagangan Beras</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Laporan Laba Rugi</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Periode: {periodLabel}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 print:hidden">
          {[
            { label: 'Pendapatan', value: totalPendapatan, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: <Lucide.TrendingUp className="w-5 h-5" /> },
            { label: 'HPP', value: totalHPP, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: <Lucide.Package className="w-5 h-5" /> },
            { label: 'Biaya Operasional', value: totalBiaya, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: <Lucide.Receipt className="w-5 h-5" /> },
            { label: 'Laba Bersih', value: labaBersih, color: labaBersih >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400', bg: labaBersih >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10', icon: <Lucide.Banknote className="w-5 h-5" /> },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} p-4 rounded-2xl border border-slate-100 dark:border-slate-700`}>
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{fCurrency(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Income Statement Table */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-600">
                <th className="text-left py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Keterangan</th>
                <th className="text-right py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200">
              {/* Revenue */}
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-4 font-black text-emerald-700 dark:text-emerald-400 text-lg">PENDAPATAN</td>
                <td></td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-3 pl-6">Penjualan Beras</td>
                <td className="py-3 text-right font-mono font-bold">{fCurrency(totalPendapatan)}</td>
              </tr>
              <tr className="border-b-2 border-slate-200 dark:border-slate-600 bg-emerald-50/50 dark:bg-emerald-500/5">
                <td className="py-3 font-black pl-6">Total Pendapatan</td>
                <td className="py-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">{fCurrency(totalPendapatan)}</td>
              </tr>

              {/* COGS */}
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-4 font-black text-blue-700 dark:text-blue-400 text-lg pt-6">HARGA POKOK PENJUALAN</td>
                <td></td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-3 pl-6">Pembelian Gabah</td>
                <td className="py-3 text-right font-mono font-bold">{fCurrency(totalHPP)}</td>
              </tr>
              <tr className="border-b-2 border-slate-200 dark:border-slate-600 bg-blue-50/50 dark:bg-blue-500/5">
                <td className="py-3 font-black pl-6">Total HPP</td>
                <td className="py-3 text-right font-mono font-black text-blue-700 dark:text-blue-400">({fCurrency(totalHPP)})</td>
              </tr>

              {/* Gross Profit */}
              <tr className="border-b-2 border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-700/50">
                <td className="py-4 font-black text-lg">LABA KOTOR</td>
                <td className={`py-4 text-right font-mono font-black text-xl ${labaKotor >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{fCurrency(labaKotor)}</td>
              </tr>

              {/* Operating Expenses */}
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-4 font-black text-amber-700 dark:text-amber-400 text-lg pt-6">BIAYA OPERASIONAL</td>
                <td></td>
              </tr>
              {Object.entries(expensesByCategory).map(([cat, amount], i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 pl-6">{cat}</td>
                  <td className="py-3 text-right font-mono font-bold">{fCurrency(amount)}</td>
                </tr>
              ))}
              {Object.keys(expensesByCategory).length === 0 && (
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 pl-6 text-slate-400 italic">Belum ada biaya tercatat</td>
                  <td className="py-3 text-right font-mono font-bold">{fCurrency(0)}</td>
                </tr>
              )}
              <tr className="border-b-2 border-slate-200 dark:border-slate-600 bg-amber-50/50 dark:bg-amber-500/5">
                <td className="py-3 font-black pl-6">Total Biaya Operasional</td>
                <td className="py-3 text-right font-mono font-black text-amber-700 dark:text-amber-400">({fCurrency(totalBiaya)})</td>
              </tr>

              {/* Net Profit */}
              <tr className={`${labaBersih >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                <td className="py-5 font-black text-xl">LABA BERSIH</td>
                <td className={`py-5 text-right font-mono font-black text-2xl ${labaBersih >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{fCurrency(labaBersih)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Transaction Details */}
        <div className="p-8 pt-0 print:pt-8">
          <h3 className="font-black text-slate-800 dark:text-white text-lg mb-4 flex items-center gap-2">
            <Lucide.List className="w-5 h-5 text-slate-400" />
            Detail Transaksi Periode Ini
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border dark:border-slate-600">
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">Penjualan ({filteredSales.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {filteredSales.length === 0 && <p className="text-sm text-slate-400 italic">Tidak ada data</p>}
                {filteredSales.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300 truncate mr-2">{s.customer_name || s.item_name || 'Penjualan'}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{fCurrency(s.total_amount || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border dark:border-slate-600">
              <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Pembelian ({filteredPurchases.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {filteredPurchases.length === 0 && <p className="text-sm text-slate-400 italic">Tidak ada data</p>}
                {filteredPurchases.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300 truncate mr-2">{p.supplier_name || p.item_name || 'Pembelian'}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{fCurrency(p.total_amount || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border dark:border-slate-600">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3">Biaya ({filteredExpenses.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {filteredExpenses.length === 0 && <p className="text-sm text-slate-400 italic">Tidak ada data</p>}
                {filteredExpenses.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300 truncate mr-2">{e.description || 'Biaya'}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{fCurrency(e.amount || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 print:bg-white">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400 font-bold">Dicetak oleh RiceFlow Enterprise pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <div className="text-center print:block hidden">
              <p className="text-xs text-slate-400 mb-12">Diketahui oleh,</p>
              <p className="font-black text-slate-800 border-b border-slate-800 px-8">( Direktur )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
