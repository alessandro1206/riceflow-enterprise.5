import { useState } from 'react';
import {
  Calendar,
  Printer,
  FileText,
  Ship,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Plus,
  Clock,
  MapPin,
} from 'lucide-react';

export const TradingPanel = ({ state, _onSaleSubmit }: any) => {
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuratJalan, setShowSuratJalan] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([
    {
      id: 'S1',
      date: new Date().getDate(),
      nopol: 'L 9876 BM',
      driver: 'Budi Santoso',
      destination: 'Banjarmasin (Pelabuhan)',
      vessel: 'KM Dharma Rucitra',
      tons: 25,
      material: 'Beras Premium',
    },
    {
      id: 'S2',
      date: new Date().getDate() + 1,
      nopol: 'B 1234 XY',
      driver: 'Agus Triono',
      destination: 'Sampit (Gudang)',
      vessel: 'KM Satya Kencana',
      tons: 20,
      material: 'Beras Medium',
    }
  ]);

  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const selectedSchedules = schedules.filter(s => s.date === selectedDate);

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Hapus jadwal pengiriman ini?')) {
      setSchedules(schedules.filter(s => s.id !== id));
      if (currentOrder?.id === id) setShowSuratJalan(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-end no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Calendar className="mr-3 text-emerald-600" /> LOGISTIK & TRADING
          </h2>
          <p className="text-slate-500">
            Jadwal Kapal & Manajemen Surat Jalan Antar Pulau
          </p>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="glass-panel px-6 py-3 border-emerald-500/20 text-emerald-700 font-black text-xs flex items-center hover:bg-emerald-50 transition-all"
        >
          {isExpanded ? <><Minimize2 className="w-4 h-4 mr-2" /> COLLAPSE</> : <><Maximize2 className="w-4 h-4 mr-2" /> EXPAND CALENDAR</>}
        </button>
      </header>

      <div className={`grid grid-cols-1 ${isExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8 transition-all duration-500`}>
        {/* CALENDAR VIEW */}
        <div className={`${isExpanded ? 'h-[600px]' : 'h-fit'} glass-panel p-8 no-print transition-all`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-[0.2em]">
              Maret 2026
            </h3>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">SCHED</span>
              </div>
            </div>
          </div>
          <div className={`grid grid-cols-7 gap-3 ${isExpanded ? 'h-[450px]' : ''}`}>
            {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-300 pb-2">{day}</div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const hasSchedule = schedules.some(s => s.date === day);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-2xl text-sm font-black transition-all flex flex-col items-center justify-center relative group
                      ${selectedDate === day
                      ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-900/20 scale-105 z-10'
                      : 'bg-white/50 text-slate-400 hover:bg-white hover:text-emerald-700 hover:shadow-lg'
                    }`}
                >
                  {day}
                  {hasSchedule && (
                    <div
                      className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${selectedDate === day ? 'bg-amber-400' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'}`}
                    ></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* DAILY SCHEDULES */}
        {!isExpanded && (
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 no-print">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">
                    Jadwal: {selectedDate} Maret
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    Terdapat {selectedSchedules.length} pengiriman terdaftar
                  </p>
                </div>
                <button className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedSchedules.map((s) => (
                  <div key={s.id} className="group bg-white/50 border border-white/60 p-6 rounded-3xl hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                          <Ship className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg uppercase leading-none">{s.vessel}</p>
                          <div className="flex items-center text-slate-400 text-xs font-bold mt-2">
                            <MapPin className="w-3 h-3 mr-1" /> {s.destination}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setCurrentOrder(s);
                            setShowSuratJalan(true);
                          }}
                          className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSchedule(s.id)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/40">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Kuantitas</p>
                        <p className="font-black text-lg text-emerald-700">{s.tons} TON</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Driver</p>
                        <p className="font-bold text-sm text-slate-600">{s.driver}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Nopol</p>
                        <p className="font-bold text-sm text-slate-600">{s.nopol}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {selectedSchedules.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                    <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-300 text-lg uppercase tracking-widest">Tidak Ada Jadwal</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SURAT JALAN PRINT VIEW */}
      {showSuratJalan && currentOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-10 no-print animate-in fade-in zoom-in-95">
          <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative p-12">
            <button 
              onClick={() => setShowSuratJalan(false)}
              className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="flex justify-between items-center mb-10 no-print">
               <h3 className="text-2xl font-black text-slate-900">Preview Surat Jalan</h3>
               <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center"
                >
                  <Printer className="w-5 h-5 mr-3" /> PRINT DOCUMENT
                </button>
            </div>

            {/* KOP SURAT */}
            <div className="border-b-[6px] border-slate-900 pb-10 mb-12 flex justify-between items-center">
              <div>
                <img src="/weighbridge_icon.png" alt="Logo" className="w-16 h-16 rounded-2xl mb-4" />
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                  PP BUMI MAS
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                  Pabrik Penggilingan Padi & Perdagangan Beras
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                  Surabaya, Jawa Timur - Indonesia
                </p>
              </div>
              <div className="text-right border-l-2 pl-10 h-24 flex flex-col justify-center">
                <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">
                  SURAT JALAN
                </h2>
                <p className="text-sm font-bold text-emerald-600 mt-2">
                  NO: SJ/BM/2026/{currentOrder.date}03/{currentOrder.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-16">
              <div className="space-y-6">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">NOMOR POLISI</span>
                  <span className="text-lg font-black text-slate-800">{currentOrder.nopol}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">NAMA SOPIR</span>
                  <span className="text-lg font-black text-slate-800">{currentOrder.driver}</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">TANGGAL</span>
                  <span className="text-lg font-black text-slate-800">{currentOrder.date} Mar 2026</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">TUJUAN</span>
                  <span className="text-lg font-black text-slate-800">{currentOrder.destination}</span>
                </div>
              </div>
            </div>

            <table className="w-full mb-20 border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest">NAMA BARANG</th>
                  <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest">QTY (TON)</th>
                  <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest">PENGIRIMAN</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-slate-100">
                  <td className="p-6 font-black text-xl text-slate-800">{currentOrder.material}</td>
                  <td className="p-6 text-right font-black text-2xl text-emerald-600">{currentOrder.tons}</td>
                  <td className="p-6 text-right font-bold text-sm italic text-slate-400">{currentOrder.vessel}</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-3 gap-12 text-center mt-32">
              <div>
                <div className="h-24 border-b border-slate-200 mb-4 mx-8"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sopir / Pembawa</p>
              </div>
              <div>
                <div className="h-24 border-b border-slate-200 mb-4 mx-8"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penerima Cabang</p>
              </div>
              <div>
                <div className="h-24 border-b border-slate-200 mb-4 mx-8 font-black text-slate-800 flex items-end justify-center pb-2">H. Moch. Amich</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">PP BUMI MAS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT-ONLY VIEW */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[200]">
        {/* Same as modal content above but without close buttons/scrolling */}
        {currentOrder && (
          <div className="p-0">
             {/* Repeat the structure for high quality print output */}
             <div className="border-b-[6px] border-slate-900 pb-10 mb-12 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">PP BUMI MAS</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Pabrik Penggilingan Padi & Perdagangan Beras</p>
              </div>
              <div className="text-right border-l-2 pl-10 h-24 flex flex-col justify-center">
                <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">SURAT JALAN</h2>
                <p className="text-sm font-bold text-emerald-600">NO: SJ/BM/2026/{currentOrder.date}03/{currentOrder.id}</p>
              </div>
            </div>
            {/* ... simplified for print ... */}
            <div className="grid grid-cols-2 gap-16 mb-16">
              <div className="space-y-6">
                <div className="flex justify-between border-b pb-3"><span className="text-[10px] font-black uppercase">NOPOL</span><span className="text-lg font-black">{currentOrder.nopol}</span></div>
                <div className="flex justify-between border-b pb-3"><span className="text-[10px] font-black uppercase">SOPIR</span><span className="text-lg font-black">{currentOrder.driver}</span></div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between border-b pb-3"><span className="text-[10px] font-black uppercase">TANGGAL</span><span className="text-lg font-black">{currentOrder.date} Mar 2026</span></div>
                <div className="flex justify-between border-b pb-3"><span className="text-[10px] font-black uppercase">TUJUAN</span><span className="text-lg font-black">{currentOrder.destination}</span></div>
              </div>
            </div>
            <table className="w-full mb-20">
              <tr className="bg-slate-900 text-white">
                <th className="p-5 text-left text-[10px] font-black uppercase">NAMA BARANG</th>
                <th className="p-5 text-right text-[10px] font-black uppercase">QTY (TON)</th>
                <th className="p-5 text-right text-[10px] font-black uppercase">KETERANGAN</th>
              </tr>
              <tr className="border-b-2">
                <td className="p-6 font-black text-xl">{currentOrder.material}</td>
                <td className="p-6 text-right font-black text-2xl">{currentOrder.tons}</td>
                <td className="p-6 text-right font-bold text-sm italic">{currentOrder.vessel}</td>
              </tr>
            </table>
            <div className="grid grid-cols-3 gap-12 text-center mt-32">
              <div><div className="h-24 border-b border-slate-200 mb-4 mx-8"></div><p className="text-[10px] font-black uppercase">Sopir</p></div>
              <div><div className="h-24 border-b border-slate-200 mb-4 mx-8"></div><p className="text-[10px] font-black uppercase">Penerima</p></div>
              <div><div className="h-24 border-b border-slate-200 mb-4 mx-8 font-black flex items-end justify-center pb-2">H. Moch. Amich</div><p className="text-[10px] font-black uppercase">PP BUMI MAS</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
