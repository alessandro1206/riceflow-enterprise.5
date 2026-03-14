import React from 'react';
import { BarChart3, AlertCircle, Clock, CheckCircle2, Printer, Banknote } from 'lucide-react';

interface FinanceDashboardProps {
  state: any;
  onMarkPaid: (id: string) => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  state,
  onMarkPaid,
}) => {
  const closedTickets = (state.tickets || []).filter((t: any) => t.status === 'CLOSED');

  // 1. Belum Diberi Harga
  const unpricedItems = closedTickets.filter((t: any) => !t.price);

  // 2. Pembayaran H-1 (Jatuh tempo hari ini atau besok, dan belum lunas)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const h1Payments = closedTickets.filter((t: any) => {
    if (!t.dueDate || t.paid) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    // Include past due, today, and tomorrow
    return due <= tomorrow;
  }).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // 3. Riwayat Lunas (Lunas hari ini)
  const todayStr = new Date().toISOString().split('T')[0];
  const paidToday = closedTickets.filter((t: any) => t.paid && t.paidDate === todayStr);

  const totalUnpriced = unpricedItems.reduce((sum: number, t: any) => sum + (t.netWeight || 0), 0);
  const totalH1Amount = h1Payments.reduce((sum: number, t: any) => sum + ((t.netWeight || 0) * (t.price || 0)), 0);
  const totalPaidAmount = paidToday.reduce((sum: number, t: any) => sum + ((t.netWeight || 0) * (t.price || 0)), 0);

  const handlePrintH1 = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-emerald-600" />
            Dasbor Keuangan
          </h2>
          <p className="text-slate-500 font-medium mt-1">Ringkasan tagihan dan rencana pembayaran</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom 1: Belum Diberi Harga */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
              Belum Diberi Harga
            </h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">{unpricedItems.length} Tiket</span>
          </div>
          <div className="text-sm text-slate-500 mb-4">
            Total Tonase: <strong className="text-amber-600">{totalUnpriced.toLocaleString('id-ID')} KG</strong>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {unpricedItems.map((t: any) => (
              <div key={t.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-amber-200 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-700 block">{t.supplierName}</span>
                    <span className="text-xs text-slate-400 font-mono">{t.nopol} | {t.dateOut}</span>
                  </div>
                  <span className="font-bold font-mono text-emerald-600">{t.netWeight?.toLocaleString('id-ID')} KG</span>
                </div>
              </div>
            ))}
            {unpricedItems.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">Semua tiket telah diberi harga.</div>
            )}
          </div>
        </div>

        {/* Kolom 2: Pembayaran H-1 */}
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-emerald-500 flex flex-col h-[500px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-[100px] -z-10"></div>
          
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-emerald-600" />
              Prioritas H-1 & Tempo
            </h3>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Tagihan (Rp)</p>
            <p className="text-3xl font-black text-emerald-700 font-mono tracking-tighter">
              {totalH1Amount.toLocaleString('id-ID')}
            </p>
            <button 
              onClick={handlePrintH1}
              className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center print:hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Rekap Cek H-1
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-6">
            {h1Payments.map((t: any) => {
              const total = (t.netWeight || 0) * (t.price || 0);
              const isPastDue = new Date(t.dueDate) < today;
              
              return (
                <div key={t.id} className={`rounded-xl p-3 border transition-colors ${isPastDue ? 'bg-red-50 border-red-200' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-slate-800 block">{t.supplierName}</span>
                      <span className={`text-xs font-bold ${isPastDue ? 'text-red-500' : 'text-emerald-600'}`}>
                        Jatuh Tempo: {t.dueDate}
                      </span>
                    </div>
                    <span className="font-black font-mono text-emerald-800">{total.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5">
                    <span className="text-xs font-mono text-slate-500">{t.netWeight?.toLocaleString('id-ID')} KG x {t.price?.toLocaleString('id-ID')}</span>
                    <button
                      onClick={() => onMarkPaid(t.id)}
                      className="print:hidden bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-bold py-1 px-3 rounded-lg flex items-center transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Tandai Lunas
                    </button>
                  </div>
                </div>
              );
            })}
            {h1Payments.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">Tidak ada tagihan jatuh tempo terdekat.</div>
            )}
          </div>
        </div>

        {/* Kolom 3: Riwayat Lunas */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center">
              <Banknote className="w-5 h-5 mr-2 text-slate-400" />
              Lunas Hari Ini
            </h3>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{paidToday.length} Tiket</span>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Dibayar (Rp)</p>
            <p className="text-2xl font-black text-slate-700 font-mono tracking-tighter">
              {totalPaidAmount.toLocaleString('id-ID')}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {paidToday.map((t: any) => {
              const total = (t.netWeight || 0) * (t.price || 0);
              return (
                <div key={t.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 opacity-70">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-700 block line-through">{t.supplierName}</span>
                      <span className="text-xs text-emerald-500 font-bold flex items-center mt-1">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Lunas
                      </span>
                    </div>
                    <span className="font-bold font-mono text-slate-500">{total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
            {paidToday.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">Belum ada pembayaran lunas hari ini.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
