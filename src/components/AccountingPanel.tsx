import { useState } from 'react';
import {
  BookOpen,
  Calculator,
  Save,
  DownloadCloud,
  Plus,
  Trash2,
  FileText,
  CreditCard,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AccountingPanel = ({ state, onYearEndClose, onAddExpense }: any) => {
  const [activeTab, setActiveTab] = useState('jurnal');
  const [kkForm, setKkForm] = useState({
    id: `KK-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    desc: '',
    sourceAccount: '11001',
    lines: [{ accountId: '61001', desc: '', amount: 0 }]
  });

  const handleKasKeluarSubmit = (e: any) => {
    e.preventDefault();
    const totalAmount = kkForm.lines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    if (totalAmount <= 0) return alert('Total jumlah kas keluar harus lebih dari 0');
    if (!kkForm.desc) return alert('Keterangan utama transaksi harus diisi');
    
    for(const l of kkForm.lines) {
      if (!l.amount || l.amount <= 0) return alert('Ada baris dengan nominal 0');
    }

    onAddExpense({
       id: kkForm.id,
       date: kkForm.date,
       desc: kkForm.desc,
       sourceAccount: kkForm.sourceAccount,
       amount: totalAmount,
       lines: kkForm.lines
    });

    alert('Form Kas Keluar Berhasil Dicatat ke Jurnal Umum!');
    setKkForm({
      id: `KK-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      desc: '',
      sourceAccount: '11001',
      lines: [{ accountId: '61001', desc: '', amount: 0 }]
    });
  };
  // --- CORE ACCOUNTING CALCULATIONS ---
  const getBalance = (code: string) => {
    return state.journal.reduce((acc: number, j: any) => {
      return (
        acc +
        j.lines.reduce((lacc: number, l: any) => {
          if (l.accountId === code) return lacc + (l.credit - l.debit);
          return lacc;
        }, 0)
      );
    }, 0);
  };

  const getDebitBalance = (code: string) => {
    return state.journal.reduce((acc: number, j: any) => {
      return (
        acc +
        j.lines.reduce((lacc: number, l: any) => {
          if (l.accountId === code) return lacc + (l.debit - l.credit);
          return lacc;
        }, 0)
      );
    }, 0);
  };

  const directSalesRev = getBalance('41002');
  const tradingRev = getBalance('41001');
  const expenses = getDebitBalance('61001');
  const netIncome = directSalesRev + tradingRev - expenses;

  // --- EXCEL EXPORT SAK INDONESIA ---
  const exportToExcel = () => {
    if (state.journal.length === 0)
      return alert('Belum ada data jurnal untuk diekspor.');

    // 1. Format Laporan Laba Rugi (Income Statement)
    const labaRugiData = [
      { 'LAPORAN LABA RUGI': 'PENDAPATAN', 'NILAI (Rp)': '' },
      {
        'LAPORAN LABA RUGI': 'Pendapatan Jual Langsung',
        'NILAI (Rp)': directSalesRev,
      },
      {
        'LAPORAN LABA RUGI': 'Pendapatan Trading Luar Pulau',
        'NILAI (Rp)': tradingRev,
      },
      {
        'LAPORAN LABA RUGI': 'TOTAL PENDAPATAN',
        'NILAI (Rp)': directSalesRev + tradingRev,
      },
      { 'LAPORAN LABA RUGI': '', 'NILAI (Rp)': '' },
      { 'LAPORAN LABA RUGI': 'BEBAN OPERASIONAL', 'NILAI (Rp)': '' },
      {
        'LAPORAN LABA RUGI': 'Biaya Solar, Listrik & Gaji',
        'NILAI (Rp)': expenses,
      },
      { 'LAPORAN LABA RUGI': 'TOTAL BEBAN', 'NILAI (Rp)': expenses },
      { 'LAPORAN LABA RUGI': '', 'NILAI (Rp)': '' },
      {
        'LAPORAN LABA RUGI': 'LABA BERSIH TAHUN BERJALAN',
        'NILAI (Rp)': netIncome,
      },
    ];

    // 2. Format Neraca Saldo (Trial Balance)
    const neracaData = state.accounts.map((acc: any) => {
      const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
      const rawBalance = isDebitNormal
        ? getDebitBalance(acc.code)
        : getBalance(acc.code);

      let debit = 0;
      let kredit = 0;
      if (isDebitNormal) {
        if (rawBalance > 0) debit = rawBalance;
        else kredit = Math.abs(rawBalance);
      } else {
        if (rawBalance > 0) kredit = rawBalance;
        else debit = Math.abs(rawBalance);
      }

      return {
        'KODE AKUN': acc.code,
        'NAMA AKUN': acc.name,
        'DEBIT (Rp)': debit,
        'KREDIT (Rp)': kredit,
      };
    });

    // 3. Format Jurnal Umum (General Journal)
    const jurnalData: any[] = [];
    state.journal.forEach((j: any) => {
      j.lines.forEach((l: any, index: number) => {
        jurnalData.push({
          TANGGAL: index === 0 ? j.date : '',
          KETERANGAN: index === 0 ? j.description : '',
          'KODE AKUN': l.accountId,
          'NAMA AKUN':
            state.accounts.find((a: any) => a.code === l.accountId)?.name || '',
          'DEBIT (Rp)': l.debit || 0,
          'KREDIT (Rp)': l.credit || 0,
        });
      });
    });

    // Build the Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(labaRugiData),
      'Laba Rugi'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(neracaData),
      'Neraca Saldo'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(jurnalData),
      'Jurnal Umum'
    );

    // Download the file
    XLSX.writeFile(
      wb,
      `Laporan_Keuangan_BumiMas_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center">
            <BookOpen className="mr-3 text-emerald-600" /> PUSAT AKUNTANSI
          </h2>
          <p className="text-slate-500 mt-1">
            Jurnal Umum, Kas Keluar, & Laporan Keuangan
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
          {['jurnal', 'kas_keluar'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-tight transition-all ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'jurnal' ? 'JURNAL UMUM & LAPORAN' : 'FORM KAS KELUAR'}
            </button>
          ))}
        </div>
      </header>
      
      {activeTab === 'jurnal' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        <div className="lg:col-span-3 flex justify-end">
          <button
            onClick={exportToExcel}
            className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-black shadow-sm border border-emerald-200 hover:bg-emerald-200 flex items-center transition-colors"
          >
            <DownloadCloud className="w-5 h-5 mr-2" /> UNDUH EXCEL (SAK)
          </button>
        </div>
        {/* WIDGET TUTUP BUKU */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <h3 className="font-black text-lg mb-6 flex items-center z-10 relative">
              <Calculator className="mr-2 text-emerald-400" /> Tutup Buku (Akhir
              Tahun)
            </h3>

            <div className="space-y-3 z-10 relative">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pendapatan Jual Langsung</span>
                <span className="font-bold text-emerald-400">
                  Rp {directSalesRev.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pendapatan Trading</span>
                <span className="font-bold text-emerald-400">
                  Rp {tradingRev.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-700 pb-3">
                <span className="text-slate-400">Total Biaya Operasional</span>
                <span className="font-bold text-red-400">
                  - Rp {expenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-lg pt-2">
                <span className="font-black">Laba Bersih</span>
                <span className="font-black text-white">
                  Rp {netIncome.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (netIncome === 0)
                  return alert('Tidak ada saldo pendapatan untuk ditutup!');
                if (
                  confirm(
                    'Anda yakin ingin melakukan Tutup Buku Akhir Tahun? Laba Bersih akan dipindah ke Modal Pemilik.'
                  )
                ) {
                  onYearEndClose(
                    directSalesRev,
                    tradingRev,
                    expenses,
                    netIncome
                  );
                  alert(
                    'Tutup Buku Berhasil! Saldo Laba telah dipindah ke Modal Pemilik.'
                  );
                }
              }}
              className="w-full mt-8 bg-emerald-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-emerald-500 z-10 relative flex justify-center items-center"
            >
              <Save className="w-5 h-5 mr-2" /> POSTING TUTUP BUKU
            </button>
          </div>
        </div>

        {/* LOG JURNAL UMUM */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="font-black text-slate-800 mb-6 border-b pb-4">
            Buku Jurnal Umum (Double Entry)
          </h3>
          <div className="divide-y max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {state.journal
              .slice()
              .reverse()
              .map((j: any) => (
                <div key={j.id} className="py-6 animate-fade-in">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                      {j.date}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {j.description}
                    </span>
                  </div>
                  <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl">
                    {j.lines.map((l: any, idx: number) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-4 text-sm ${
                          l.credit > 0
                            ? 'pl-8 text-slate-600'
                            : 'font-black text-slate-800'
                        }`}
                      >
                        <span className="col-span-2">
                          {state.accounts.find(
                            (a: any) => a.code === l.accountId
                          )?.name || `Akun ${l.accountId}`}
                        </span>
                        <span className="text-right">
                          {l.debit > 0 ? `Rp ${l.debit.toLocaleString()}` : ''}
                        </span>
                        <span className="text-right">
                          {l.credit > 0
                            ? `Rp ${l.credit.toLocaleString()}`
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {state.journal.length === 0 && (
              <p className="text-center text-slate-400 py-10">
                Belum ada transaksi tercatat.
              </p>
            )}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'kas_keluar' && (
        <div className="animate-fade-in space-y-8 pb-10">
          <form onSubmit={handleKasKeluarSubmit} className="glass-panel p-8 md:p-12 relative overflow-hidden bg-white shadow-xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 -translate-y-32 translate-x-32 rounded-full blur-3xl"></div>
             
             <div className="flex items-center space-x-4 mb-10 border-b border-slate-100 pb-6 relative z-10">
               <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-lg transform -rotate-6">
                 <CreditCard className="w-8 h-8 text-emerald-400" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-800">Bukti Kas Keluar</h3>
                  <p className="text-slate-500 font-medium mt-1">Pencatatan Biaya Operasional & Pengeluaran Kas/Bank</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
               <div className="space-y-6">
                 <div>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">No Transaksi (Auto)</label>
                   <input 
                     type="text" 
                     readOnly 
                     value={kkForm.id}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono font-bold text-slate-500 cursor-not-allowed"
                   />
                 </div>
                 <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Tanggal</label>
                    <input 
                      type="date"
                      required
                      value={kkForm.date}
                      onChange={e => setKkForm({...kkForm, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Keluar Dari Akun (Sumber Dana)</label>
                    <select
                      value={kkForm.sourceAccount}
                      onChange={e => setKkForm({...kkForm, sourceAccount: e.target.value})}
                      className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      {state.accounts.filter((a:any) => a.type === 'ASSET' && (a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank'))).map((a:any) => (
                        <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                 </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Keterangan Utama</label>
                 <textarea
                   required
                   placeholder="Contoh: Pembayaran operasional kantor minggu ke-2..."
                   value={kkForm.desc}
                   onChange={e => setKkForm({...kkForm, desc: e.target.value})}
                   className="w-full flex-1 bg-white border border-slate-200 rounded-2xl p-4 font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none min-h-[120px]"
                 ></textarea>
               </div>
             </div>

             <div className="mb-10 relative z-10">
               <div className="flex justify-between items-end mb-4 px-2">
                 <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
                   <FileText className="w-4 h-4 mr-2 text-slate-400" /> Detail Alokasi Biaya
                 </h4>
               </div>
               
               <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-inner">
                 <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-100 text-xs font-black text-slate-500 uppercase tracking-widest">
                   <div className="col-span-3">Kode Akun (Beban)</div>
                   <div className="col-span-4">Keterangan Rinci</div>
                   <div className="col-span-4 text-right">Nominal (Rp)</div>
                   <div className="col-span-1 text-center">Aksi</div>
                 </div>
                 
                 <div className="divide-y divide-slate-100">
                   {kkForm.lines.map((line, idx) => (
                     <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center bg-white hover:bg-slate-50 transition-colors">
                       <div className="col-span-3">
                         <select
                           value={line.accountId}
                           onChange={e => {
                             const newLines = [...kkForm.lines];
                             newLines[idx].accountId = e.target.value;
                             setKkForm({...kkForm, lines: newLines});
                           }}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                         >
                           {state.accounts.map((a:any) => (
                             <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                           ))}
                         </select>
                       </div>
                       <div className="col-span-4">
                         <input
                           type="text"
                           placeholder="Rincian..."
                           value={line.desc}
                           onChange={e => {
                             const newLines = [...kkForm.lines];
                             newLines[idx].desc = e.target.value;
                             setKkForm({...kkForm, lines: newLines});
                           }}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                         />
                       </div>
                       <div className="col-span-4 relative group">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</div>
                         <input
                           type="number"
                           required
                           min="0"
                           value={line.amount || ''}
                           onChange={e => {
                             const newLines = [...kkForm.lines];
                             newLines[idx].amount = Number(e.target.value);
                             setKkForm({...kkForm, lines: newLines});
                           }}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-right font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                         />
                       </div>
                       <div className="col-span-1 flex justify-center">
                         <button
                           type="button"
                           onClick={() => {
                             if (kkForm.lines.length > 1) {
                               const newLines = kkForm.lines.filter((_, i) => i !== idx);
                               setKkForm({...kkForm, lines: newLines});
                             }
                           }}
                           disabled={kkForm.lines.length === 1}
                           className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-200">
                   <button
                     type="button"
                     onClick={() => setKkForm({...kkForm, lines: [...kkForm.lines, { accountId: '61001', desc: '', amount: 0 }]})}
                     className="text-sm font-black text-emerald-600 bg-emerald-100/50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors flex items-center"
                   >
                     <Plus className="w-4 h-4 mr-1" /> TAMBAH BARIS
                   </button>
                   <div className="flex items-center space-x-4 pr-12">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Keseluruhan:</span>
                     <span className="text-2xl font-black font-mono text-emerald-600 underline decoration-emerald-200 underline-offset-4">
                       Rp {kkForm.lines.reduce((s, l) => s + Number(l.amount || 0), 0).toLocaleString()}
                     </span>
                   </div>
                 </div>
               </div>
             </div>

             <button
               type="submit"
               className="w-full mt-8 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-600 transition-all flex justify-center items-center group relative z-10"
             >
               <Save className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" /> 
               SIMPAN BUKTI KAS KELUAR
             </button>
          </form>
        </div>
      )}
    </div>
  );
};
