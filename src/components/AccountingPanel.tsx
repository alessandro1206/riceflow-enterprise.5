import { useState, useRef } from 'react';
import {
  BookOpen,
  Calculator,
  Save,
  DownloadCloud,
  Upload,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  BarChart3,
  FileSpreadsheet,
  DollarSign,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AccountingPanel = ({ state, onYearEndClose, onAddExpense, onImportJournal, onSetStartingBalance }: any) => {
  const [activeTab, setActiveTab] = useState('saldo');
  const [kkForm, setKkForm] = useState({
    id: `KK-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    desc: '',
    sourceAccount: '11001',
    lines: [{ accountId: '61001', desc: '', amount: 0 }]
  });
  const [editingBalances, setEditingBalances] = useState<Record<string, string>>({});
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const getStartingBalance = (code: string) => {
    return (state.startingBalances && state.startingBalances[code]) || 0;
  };

  const getAccountBalance = (acc: any) => {
    const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
    const starting = getStartingBalance(acc.code);
    const journalMovement = isDebitNormal ? getDebitBalance(acc.code) : getBalance(acc.code);
    return starting + journalMovement;
  };

  const directSalesRev = getBalance('41002');
  const tradingRev = getBalance('41001');
  const expenses = getDebitBalance('61001');
  const netIncome = directSalesRev + tradingRev - expenses;

  // --- HANDLE STARTING BALANCE SAVE ---
  const handleSaveStartingBalances = () => {
    const balances: Record<string, number> = {};
    for (const [code, val] of Object.entries(editingBalances)) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        balances[code] = num;
      }
    }
    if (Object.keys(balances).length === 0) {
      return alert('Tidak ada saldo awal yang diubah.');
    }
    onSetStartingBalance(balances);
    setEditingBalances({});
    alert('Saldo Awal berhasil disimpan!');
  };

  // --- HANDLE EXCEL IMPORT ---
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Membaca file Excel...');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Look for a sheet named "Jurnal" or use the first sheet
        const sheetName = workbook.SheetNames.find(
          (s) => s.toLowerCase().includes('jurnal') || s.toLowerCase().includes('journal')
        ) || workbook.SheetNames[0];
        
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          setImportStatus('File kosong atau format tidak dikenali.');
          return;
        }

        // Try to map the columns automatically
        // Expected columns: TANGGAL, KETERANGAN, KODE_AKUN, DEBIT, KREDIT
        // But also support flexible naming
        const entries: any[] = [];
        let currentEntry: any = null;

        for (const row of rows) {
          const tanggal = row['TANGGAL'] || row['Tanggal'] || row['DATE'] || row['Date'] || '';
          const keterangan = row['KETERANGAN'] || row['Keterangan'] || row['DESCRIPTION'] || row['Desc'] || '';
          const kodeAkun = row['KODE AKUN'] || row['KODE_AKUN'] || row['Kode Akun'] || row['Account'] || row['CODE'] || '';
          const debit = parseFloat(row['DEBIT (Rp)'] || row['DEBIT'] || row['Debit'] || '0') || 0;
          const kredit = parseFloat(row['KREDIT (Rp)'] || row['KREDIT'] || row['Kredit'] || row['CREDIT'] || row['Credit'] || '0') || 0;

          if (!kodeAkun) continue;

          const accountCode = String(kodeAkun).trim();
          
          // If there is a date, start a new journal entry
          if (tanggal && String(tanggal).trim()) {
            if (currentEntry && currentEntry.lines.length > 0) {
              entries.push(currentEntry);
            }
            currentEntry = {
              id: `IMP-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
              date: formatExcelDate(tanggal),
              description: String(keterangan).trim() || 'Import dari Excel',
              lines: []
            };
          }

          if (!currentEntry) {
            currentEntry = {
              id: `IMP-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
              date: new Date().toISOString().split('T')[0],
              description: String(keterangan).trim() || 'Import dari Excel',
              lines: []
            };
          }

          if (debit > 0 || kredit > 0) {
            currentEntry.lines.push({
              accountId: accountCode,
              debit: debit,
              credit: kredit
            });
          }
        }

        // Don't forget the last entry
        if (currentEntry && currentEntry.lines.length > 0) {
          entries.push(currentEntry);
        }

        if (entries.length === 0) {
          setImportStatus('Tidak ada entri jurnal valid ditemukan dalam file.');
          return;
        }

        onImportJournal(entries);
        setImportStatus(`Berhasil! ${entries.length} entri jurnal diimport dari "${sheetName}".`);
      } catch (err: any) {
        setImportStatus(`Error membaca file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatExcelDate = (raw: any): string => {
    if (!raw) return new Date().toISOString().split('T')[0];
    // If it's a number (Excel serial date), convert it
    if (typeof raw === 'number') {
      const date = new Date((raw - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    // Try to parse string date
    const str = String(raw).trim();
    // Check if it's already ISO format
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.split('T')[0];
    // Try DD/MM/YYYY
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (parseInt(y) > 100) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return str;
  };

  // --- EXCEL EXPORT SAK INDONESIA ---
  const exportToExcel = () => {
    if (state.journal.length === 0)
      return alert('Belum ada data jurnal untuk diekspor.');

    const labaRugiData = [
      { 'LAPORAN LABA RUGI': 'PENDAPATAN', 'NILAI (Rp)': '' },
      { 'LAPORAN LABA RUGI': 'Pendapatan Jual Langsung', 'NILAI (Rp)': directSalesRev },
      { 'LAPORAN LABA RUGI': 'Pendapatan Trading Luar Pulau', 'NILAI (Rp)': tradingRev },
      { 'LAPORAN LABA RUGI': 'TOTAL PENDAPATAN', 'NILAI (Rp)': directSalesRev + tradingRev },
      { 'LAPORAN LABA RUGI': '', 'NILAI (Rp)': '' },
      { 'LAPORAN LABA RUGI': 'BEBAN OPERASIONAL', 'NILAI (Rp)': '' },
      { 'LAPORAN LABA RUGI': 'Biaya Solar & Listrik', 'NILAI (Rp)': expenses },
      { 'LAPORAN LABA RUGI': 'TOTAL BEBAN', 'NILAI (Rp)': expenses },
      { 'LAPORAN LABA RUGI': '', 'NILAI (Rp)': '' },
      { 'LAPORAN LABA RUGI': 'LABA BERSIH TAHUN BERJALAN', 'NILAI (Rp)': netIncome },
    ];

    const neracaData = state.accounts.map((acc: any) => {
      const starting = getStartingBalance(acc.code);
      const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
      const journalMovement = isDebitNormal ? getDebitBalance(acc.code) : getBalance(acc.code);
      const total = starting + journalMovement;

      let debit = 0;
      let kredit = 0;
      if (isDebitNormal) {
        if (total > 0) debit = total;
        else kredit = Math.abs(total);
      } else {
        if (total > 0) kredit = total;
        else debit = Math.abs(total);
      }

      return {
        'KODE AKUN': acc.code,
        'NAMA AKUN': acc.name,
        'SALDO AWAL': starting,
        'DEBIT (Rp)': debit,
        'KREDIT (Rp)': kredit,
        'SALDO AKHIR': total,
      };
    });

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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(labaRugiData), 'Laba Rugi');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(neracaData), 'Neraca Saldo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jurnalData), 'Jurnal Umum');

    XLSX.writeFile(
      wb,
      `Laporan_Keuangan_BumiMas_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Group accounts by type for display
  const groupedAccounts = () => {
    const groups: Record<string, any[]> = {};
    for (const acc of state.accounts) {
      if (!groups[acc.type]) groups[acc.type] = [];
      groups[acc.type].push(acc);
    }
    return groups;
  };

  const typeLabels: Record<string, string> = {
    ASSET: 'ASET',
    LIABILITY: 'KEWAJIBAN',
    EQUITY: 'MODAL',
    REVENUE: 'PENDAPATAN',
    EXPENSE: 'BEBAN',
  };

  const typeColors: Record<string, string> = {
    ASSET: 'bg-blue-50 text-blue-700 border-blue-200',
    LIABILITY: 'bg-red-50 text-red-700 border-red-200',
    EQUITY: 'bg-purple-50 text-purple-700 border-purple-200',
    REVENUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    EXPENSE: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const tabs = [
    { id: 'saldo', label: 'NERACA SALDO', icon: <BarChart3 className="w-4 h-4 mr-1" /> },
    { id: 'jurnal', label: 'JURNAL UMUM', icon: <BookOpen className="w-4 h-4 mr-1" /> },
    { id: 'kas_keluar', label: 'FORM KAS KELUAR', icon: <CreditCard className="w-4 h-4 mr-1" /> },
    { id: 'import', label: 'IMPORT / EXPORT', icon: <FileSpreadsheet className="w-4 h-4 mr-1" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center">
            <BookOpen className="mr-3 text-emerald-600" /> PUSAT AKUNTANSI
          </h2>
          <p className="text-slate-500 mt-1">
            Neraca Saldo, Jurnal Umum, Kas Keluar, & Import Excel
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-tight transition-all flex items-center ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ================================================================ */}
      {/* NERACA SALDO TAB                                                   */}
      {/* ================================================================ */}
      {activeTab === 'saldo' && (
        <div className="space-y-8 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Aset', value: state.accounts.filter((a: any) => a.type === 'ASSET').reduce((s: number, a: any) => s + getAccountBalance(a), 0), color: 'text-blue-600' },
              { label: 'Total Kewajiban', value: state.accounts.filter((a: any) => a.type === 'LIABILITY').reduce((s: number, a: any) => s + getAccountBalance(a), 0), color: 'text-red-600' },
              { label: 'Total Pendapatan', value: state.accounts.filter((a: any) => a.type === 'REVENUE').reduce((s: number, a: any) => s + getAccountBalance(a), 0), color: 'text-emerald-600' },
              { label: 'Laba Bersih', value: netIncome, color: netIncome >= 0 ? 'text-emerald-600' : 'text-red-600' },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                <p className={`text-xl font-black font-mono ${card.color}`}>
                  Rp {card.value.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>

          {/* Saldo per Account with Starting Balance */}
          {Object.entries(groupedAccounts()).map(([type, accounts]) => (
            <div key={type} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`px-6 py-4 border-b ${typeColors[type] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                <h3 className="font-black text-sm uppercase tracking-widest">
                  {typeLabels[type] || type}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-3 font-bold">Kode</th>
                      <th className="px-6 py-3 font-bold">Nama Akun</th>
                      <th className="px-6 py-3 font-bold text-right">Saldo Awal</th>
                      <th className="px-6 py-3 font-bold text-right">Mutasi Jurnal</th>
                      <th className="px-6 py-3 font-bold text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(accounts as any[]).map((acc: any) => {
                      const starting = getStartingBalance(acc.code);
                      const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
                      const journalMovement = isDebitNormal ? getDebitBalance(acc.code) : getBalance(acc.code);
                      const total = starting + journalMovement;

                      return (
                        <tr key={acc.code} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-sm text-slate-500">{acc.code}</td>
                          <td className="px-6 py-4 font-bold text-sm text-slate-800">{acc.name}</td>
                          <td className="px-6 py-4 text-right">
                            {editingBalances.hasOwnProperty(acc.code) ? (
                              <input
                                type="number"
                                value={editingBalances[acc.code]}
                                onChange={(e) => setEditingBalances({ ...editingBalances, [acc.code]: e.target.value })}
                                className="w-32 text-right bg-amber-50 border border-amber-300 rounded-lg px-3 py-1 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="0"
                              />
                            ) : (
                              <button
                                onClick={() => setEditingBalances({ ...editingBalances, [acc.code]: String(starting) })}
                                className="font-mono text-sm text-slate-500 hover:text-amber-600 hover:bg-amber-50 px-3 py-1 rounded-lg transition-colors"
                                title="Klik untuk edit saldo awal"
                              >
                                {starting !== 0 ? `Rp ${starting.toLocaleString('id-ID')}` : '-'}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm">
                            <span className={journalMovement > 0 ? 'text-emerald-600' : journalMovement < 0 ? 'text-red-500' : 'text-slate-400'}>
                              {journalMovement !== 0 ? `Rp ${journalMovement.toLocaleString('id-ID')}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-mono font-black text-sm ${total > 0 ? 'text-slate-800' : total < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {total !== 0 ? `Rp ${total.toLocaleString('id-ID')}` : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Save Starting Balances Button */}
          {Object.keys(editingBalances).length > 0 && (
            <div className="flex justify-end space-x-3 animate-fade-in">
              <button
                onClick={() => setEditingBalances({})}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveStartingBalances}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Save className="w-5 h-5" />
                <span>SIMPAN SALDO AWAL</span>
              </button>
            </div>
          )}

          {/* Tutup Buku Widget */}
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <h3 className="font-black text-lg mb-6 flex items-center">
              <Calculator className="mr-2 text-emerald-400" /> Tutup Buku (Akhir Tahun)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pendapatan Jual Langsung</p>
                <p className="text-xl font-black text-emerald-400 font-mono">Rp {directSalesRev.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pendapatan Trading</p>
                <p className="text-xl font-black text-emerald-400 font-mono">Rp {tradingRev.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Biaya Operasional</p>
                <p className="text-xl font-black text-red-400 font-mono">- Rp {expenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Laba Bersih</p>
                <p className="text-2xl font-black text-white font-mono">Rp {netIncome.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (netIncome === 0) return alert('Tidak ada saldo pendapatan untuk ditutup!');
                if (confirm('Anda yakin ingin melakukan Tutup Buku Akhir Tahun? Laba Bersih akan dipindah ke Modal Pemilik.')) {
                  onYearEndClose(directSalesRev, tradingRev, expenses, netIncome);
                  alert('Tutup Buku Berhasil! Saldo Laba telah dipindah ke Modal Pemilik.');
                }
              }}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-emerald-500 flex justify-center items-center"
            >
              <Save className="w-5 h-5 mr-2" /> POSTING TUTUP BUKU
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* JURNAL UMUM TAB                                                    */}
      {/* ================================================================ */}
      {activeTab === 'jurnal' && (
        <div className="animate-fade-in">
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 border-b pb-4 flex items-center justify-between">
              <span>Buku Jurnal Umum (Double Entry)</span>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{state.journal.length} entri</span>
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

      {/* ================================================================ */}
      {/* KAS KELUAR TAB                                                     */}
      {/* ================================================================ */}
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

      {/* ================================================================ */}
      {/* IMPORT / EXPORT TAB                                                */}
      {/* ================================================================ */}
      {activeTab === 'import' && (
        <div className="animate-fade-in space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* IMPORT FROM EXCEL */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Upload className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Import dari Excel</h3>
                  <p className="text-slate-500 text-sm font-medium">Upload file .xlsx untuk menambah entri jurnal</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 mb-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Format Kolom yang Didukung:</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600">
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">TANGGAL</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">KETERANGAN</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">KODE AKUN</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">DEBIT (Rp)</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">KREDIT (Rp)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-3">
                  💡 Sheet bernama "Jurnal" akan diproses duluan. Jika tidak ada, sheet pertama yang digunakan.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>PILIH FILE EXCEL (.xlsx)</span>
              </button>

              {importStatus && (
                <div className={`mt-4 p-4 rounded-xl text-sm font-bold ${
                  importStatus.includes('Berhasil') 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : importStatus.includes('Error') || importStatus.includes('Tidak')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>

            {/* EXPORT TO EXCEL */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <DownloadCloud className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Export ke Excel</h3>
                  <p className="text-slate-500 text-sm font-medium">Unduh laporan keuangan lengkap (SAK Indonesia)</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: 'Laba Rugi', desc: 'Pendapatan, Beban, dan Laba Bersih' },
                  { label: 'Neraca Saldo', desc: 'Semua akun dengan saldo awal & akhir' },
                  { label: 'Jurnal Umum', desc: `${state.journal.length} entri jurnal lengkap` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <FileText className="w-5 h-5 text-slate-300" />
                  </div>
                ))}
              </div>

              <button
                onClick={exportToExcel}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <DownloadCloud className="w-5 h-5" />
                <span>UNDUH EXCEL (SAK)</span>
              </button>
            </div>
          </div>

          {/* Starting Balance Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Saldo Awal Akun</h3>
                <p className="text-slate-500 text-sm font-medium">Input saldo awal untuk setiap akun sebelum pencatatan dimulai</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.accounts.map((acc: any) => (
                <div key={acc.code} className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800">{acc.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{acc.code} — {typeLabels[acc.type] || acc.type}</p>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={editingBalances[acc.code] ?? (getStartingBalance(acc.code) || '')}
                      onChange={(e) => setEditingBalances({ ...editingBalances, [acc.code]: e.target.value })}
                      className="w-40 bg-white border border-slate-200 rounded-xl px-3 pl-8 py-2 text-right font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveStartingBalances}
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Save className="w-5 h-5" />
              <span>SIMPAN SALDO AWAL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
