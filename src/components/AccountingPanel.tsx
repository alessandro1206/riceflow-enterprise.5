import React from 'react';
import {
  BookOpen,
  Calculator,
  Save,
  AlertCircle,
  DownloadCloud,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AccountingPanel = ({ state, onYearEndClose }: any) => {
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
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center">
            <BookOpen className="mr-3 text-emerald-600" /> PUSAT AKUNTANSI
          </h2>
          <p className="text-slate-500">
            Jurnal Umum, Neraca, & Standar Akuntansi (SAK)
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-black shadow-sm border border-emerald-200 hover:bg-emerald-200 flex items-center transition-colors"
        >
          <DownloadCloud className="w-5 h-5 mr-2" /> UNDUH EXCEL (SAK)
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
    </div>
  );
};
