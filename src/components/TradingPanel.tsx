import { useState } from 'react';
import {
  Calendar,
  Printer,
  FileText,
  Ship,
} from 'lucide-react';

export const TradingPanel = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [showSuratJalan, setShowSuratJalan] = useState(false);
  const [currentOrder] = useState({
    nopol: 'L 9876 BM',
    driver: 'Budi Santoso',
    destination: 'Banjarmasin (Pelabuhan)',
    vessel: 'KM Dharma Rucitra',
    tons: 25,
    material: 'Beras Premium',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center">
            <Calendar className="mr-3 text-blue-600" /> JADWAL & SURAT JALAN
          </h2>
          <p className="text-slate-500">
            Manajemen Pengiriman Per Ton & Dokumen Jalan
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CALENDAR VIEW */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border shadow-sm no-print">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
              Maret 2026
            </h3>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-400">
                ORDER
              </span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(i + 1)}
                className={`aspect-square rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center
                    ${selectedDate === i + 1
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
              >
                {i + 1}
                {(i === 15 || i === 22) && (
                  <div
                    className={`w-1 h-1 rounded-full mt-1 ${selectedDate === i + 1 ? 'bg-white' : 'bg-blue-500'
                      }`}
                  ></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ORDER DETAILS & SURAT JALAN GENERATOR */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border shadow-sm no-print">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-black text-slate-800 text-lg">
                  Detail Pengiriman: {selectedDate} Maret
                </h3>
                <p className="text-sm text-slate-400">
                  Order ID: BM-2026-{selectedDate}
                </p>
              </div>
              <button
                onClick={() => setShowSuratJalan(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" /> BUAT SURAT JALAN
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Tujuan / Kapal
                </p>
                <p className="font-black text-slate-800 flex items-center">
                  <Ship className="w-4 h-4 mr-2 text-blue-500" />{' '}
                  {currentOrder.vessel}
                </p>
                <p className="text-sm font-bold text-slate-500 ml-6">
                  {currentOrder.destination}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Kuantitas (TON)
                </p>
                <p className="font-black text-2xl text-blue-600">
                  {currentOrder.tons} Ton
                </p>
                <p className="text-[10px] font-bold text-slate-400">
                  ≈ {(currentOrder.tons * 1000).toLocaleString()} KG
                </p>
              </div>
            </div>
          </div>

          {/* SURAT JALAN PRINT VIEW */}
          {showSuratJalan && (
            <div className="bg-white p-12 rounded-none border-2 border-slate-200 shadow-2xl relative print:fixed print:inset-0 print:border-none print:shadow-none print:m-0">
              <div className="absolute top-4 right-4 no-print">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Printer className="w-6 h-6" />
                </button>
              </div>

              {/* KOP SURAT */}
              <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    PP BUMI MAS
                  </h1>
                  <p className="text-xs font-bold text-slate-500">
                    Pabrik Penggilingan Padi & Perdagangan Beras
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                    Surabaya, Jawa Timur - Indonesia
                  </p>
                </div>
                <div className="text-right border-l-2 pl-6">
                  <h2 className="text-xl font-black uppercase text-slate-900">
                    SURAT JALAN
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    NO: SJ/BM/{new Date().getFullYear()}/{selectedDate}03
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-10">
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-400">
                      NOMOR POLISI:
                    </span>
                    <span className="text-sm font-black">
                      {currentOrder.nopol}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-400">
                      NAMA SOPIR:
                    </span>
                    <span className="text-sm font-black">
                      {currentOrder.driver}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-400">
                      TANGGAL:
                    </span>
                    <span className="text-sm font-black">
                      {selectedDate} Mar 2026
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-400">
                      TUJUAN:
                    </span>
                    <span className="text-sm font-black">
                      {currentOrder.destination}
                    </span>
                  </div>
                </div>
              </div>

              <table className="w-full mb-12 border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 text-left text-xs font-black">
                      NAMA BARANG
                    </th>
                    <th className="p-3 text-right text-xs font-black">
                      QTY (TON)
                    </th>
                    <th className="p-3 text-right text-xs font-black">
                      KETERANGAN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b-2">
                    <td className="p-4 font-black">{currentOrder.material}</td>
                    <td className="p-4 text-right font-black">
                      {currentOrder.tons}
                    </td>
                    <td className="p-4 text-right text-xs font-bold italic">
                      {currentOrder.vessel}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-3 gap-8 text-center mt-20">
                <div>
                  <div className="h-20 border-b border-slate-300 mb-2"></div>
                  <p className="text-[10px] font-black uppercase">
                    Sopir / Pembawa
                  </p>
                </div>
                <div>
                  <div className="h-20 border-b border-slate-300 mb-2"></div>
                  <p className="text-[10px] font-black uppercase">
                    Penerima Barangk
                  </p>
                </div>
                <div>
                  <div className="h-20 border-b border-slate-300 mb-2"></div>
                  <p className="text-[10px] font-black uppercase">
                    Hormat Kami, PP BUMI MAS
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
