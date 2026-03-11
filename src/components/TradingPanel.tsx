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

export const TradingPanel = ({ state, onAddSchedule, onDeleteSchedule }: any) => {
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuratJalan, setShowSuratJalan] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  
  const [newSchedule, setNewSchedule] = useState({
    nopol: '',
    driver: '',
    destination: '',
    vessel: '',
    tons: 0,
    material: 'Beras Premium',
  });

  const schedules = state.schedules || [];
  const selectedSchedules = schedules.filter((s: any) => s.date === selectedDate);

  const handleCreateSchedule = () => {
    if (!newSchedule.nopol || !newSchedule.driver) return alert("Nopol dan Driver harus diisi!");
    onAddSchedule({ ...newSchedule, date: selectedDate });
    setShowAddForm(false);
    setNewSchedule({
      nopol: '',
      driver: '',
      destination: '',
      vessel: '',
      tons: 0,
      material: 'Beras Premium',
    });
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
        <div className={`${isExpanded ? 'h-fit' : 'h-fit'} glass-panel p-8 no-print transition-all`}>
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
          <div className="grid grid-cols-7 gap-3">
            {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-300 pb-2">{day}</div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const daySchedules = schedules.filter((s: any) => s.date === day);
              const hasSchedule = daySchedules.length > 0;
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square min-h-[60px] rounded-2xl text-sm font-black transition-all flex flex-col items-start p-3 relative group
                      ${selectedDate === day
                      ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-900/20 scale-105 z-10'
                      : 'bg-white/50 text-slate-400 hover:bg-white hover:text-emerald-700 hover:shadow-lg'
                    }`}
                >
                  <span>{day}</span>
                  {hasSchedule && (
                    <div className="mt-1 w-full space-y-1">
                      {isExpanded ? (
                        daySchedules.slice(0, 2).map((s: any, idx: number) => (
                           <div key={idx} className={`text-[8px] truncate px-1 rounded ${selectedDate === day ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                             {s.material.split(' ')[0]} {s.tons}T
                           </div>
                        ))
                      ) : (
                        <div className={`w-full h-1 rounded-full ${selectedDate === day ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                      )}
                      {isExpanded && daySchedules.length > 2 && <div className="text-[8px] opacity-50">+{daySchedules.length - 2} more</div>}
                    </div>
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
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`p-3 rounded-xl shadow-lg transition-all ${showAddForm ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white hover:scale-105'}`}
                >
                  {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {showAddForm && (
                <div className="mb-8 p-8 bg-slate-50 rounded-[32px] border border-slate-200 animate-in slide-in-from-top-4">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Tambah Jadwal Pengiriman</h4>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Material & QTY (Ton)</label>
                      <div className="flex space-x-2">
                        <select 
                          className="flex-1 p-4 glass-input font-bold text-sm"
                          value={newSchedule.material}
                          onChange={e => setNewSchedule({...newSchedule, material: e.target.value})}
                        >
                          <option value="Beras Premium">Beras Premium</option>
                          <option value="Beras Medium">Beras Medium</option>
                          <option value="Sekam">Sekam</option>
                        </select>
                        <input 
                          type="number"
                          className="w-24 p-4 glass-input font-black text-center"
                          placeholder="TON"
                          value={newSchedule.tons || ''}
                          onChange={e => setNewSchedule({...newSchedule, tons: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tujuan & Kapal</label>
                      <div className="flex space-x-2">
                        <input 
                          className="flex-1 p-4 glass-input font-bold"
                          placeholder="Tujuan"
                          value={newSchedule.destination}
                          onChange={e => setNewSchedule({...newSchedule, destination: e.target.value})}
                        />
                         <input 
                          className="flex-1 p-4 glass-input font-bold"
                          placeholder="Kapal"
                          value={newSchedule.vessel}
                          onChange={e => setNewSchedule({...newSchedule, vessel: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nomor Polisi</label>
                      <input 
                        className="w-full p-4 glass-input font-black uppercase"
                        placeholder="L 1234 AB"
                        value={newSchedule.nopol}
                        onChange={e => setNewSchedule({...newSchedule, nopol: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nama Sopir</label>
                      <input 
                        className="w-full p-4 glass-input font-bold"
                        placeholder="Input Nama"
                        value={newSchedule.driver}
                        onChange={e => setNewSchedule({...newSchedule, driver: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleCreateSchedule}
                    className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-600 transition-all"
                  >
                    SIMPAN JADWAL
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {selectedSchedules.map((s: any) => (
                  <div key={s.id} className="group bg-white/50 border border-white/60 p-6 rounded-3xl hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                          <Ship className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg uppercase leading-none">{s.vessel || 'TANPA KAPAL'}</p>
                          <div className="flex items-center text-slate-400 text-xs font-bold mt-2">
                            <MapPin className="w-3 h-3 mr-1" /> {s.destination || 'Belum diatur'}
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
                          onClick={() => onDeleteSchedule(s.id)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/40">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Item & Kuantitas</p>
                        <p className="font-black text-sm text-emerald-700">{s.material} - {s.tons} TON</p>
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
                <div className="h-24 border-b border-slate-200 mb-4 mx-8 font-black text-slate-800 flex items-center justify-center relative">
                   <span className="font-['Dancing_Script'] text-3xl text-emerald-800/80 transform -rotate-6 absolute -top-2">H. Moch. Amich</span>
                   <div className="absolute top-0 w-20 h-20 opacity-10 border-4 border-emerald-600 rounded-full flex items-center justify-center text-[10px] font-black uppercase text-emerald-600 border-dashed animate-spin-slow">Bumi Mas Official</div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">PP BUMI MAS (Digital Approved)</p>
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
              <div><div className="h-24 border-b border-slate-200 mb-4 mx-8 font-black flex items-center justify-center relative"><span className="font-['Dancing_Script'] text-2xl text-emerald-800/80 -rotate-3">H. Moch. Amich</span></div><p className="text-[10px] font-black uppercase text-emerald-600">PP BUMI MAS (Approved)</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
