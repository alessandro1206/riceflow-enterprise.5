import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as Lucide from 'lucide-react';

const localizer = momentLocalizer(moment);

export interface LogisticsEvent {
  id: string;
  title: string; // Nopol/Driver
  material: string; // Beras Premium dll
  tons: number;
  start: Date;
  end: Date;
}

export default function TradingCalendar() {
  const [events, setEvents] = useState<LogisticsEvent[]>([
    {
      id: '1',
      title: 'B 1234 CD / Budi',
      material: 'Beras Premium',
      tons: 10,
      start: new Date(),
      end: new Date()
    }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Form State
  const [nopol, setNopol] = useState('');
  const [driver, setDriver] = useState('');
  const [material, setMaterial] = useState('Beras Premium');
  const [tons, setTons] = useState(0);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedDate(slotInfo.start);
    setShowModal(true);
  };

  const handleSaveEvent = () => {
    if (!nopol || !driver || tons <= 0) return alert('Lengkapi data pengiriman!');
    
    const newEvent: LogisticsEvent = {
      id: Date.now().toString(),
      title: `${nopol.toUpperCase()} / ${driver}`,
      material,
      tons,
      start: selectedDate,
      end: selectedDate
    };

    setEvents([...events, newEvent]);
    setShowModal(false);
    
    // Reset form
    setNopol('');
    setDriver('');
    setTons(0);
    setMaterial('Beras Premium');
  };

  // Custom Event Component
  const EventComponent = ({ event }: { event: LogisticsEvent }) => (
    <div className="p-1">
      <div className="font-bold text-xs truncate">{event.title}</div>
      <div className="text-[10px] truncate opacity-90">{event.material} ({event.tons} Ton)</div>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px] w-full relative">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
         <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
               <Lucide.CalendarDays className="w-6 h-6 text-emerald-600" />
               Jadwal Pengiriman (Logistics)
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-1">Kelola jadwal muat dan bongkar armada pengiriman.</p>
         </div>
         <button onClick={() => { setSelectedDate(new Date()); setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
            <Lucide.Plus className="w-4 h-4" /> Tambah Jadwal
         </button>
      </div>

      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden custom-scrollbar">
         {/* Min-width ensures no weird squishing on mobile, allowing horizontal scroll if needed */}
         <div className="h-full min-w-[700px] calendar-wrapper">
            <Calendar
               localizer={localizer}
               events={events}
               startAccessor="start"
               endAccessor="end"
               views={[Views.MONTH, Views.AGENDA]}
               defaultView={Views.MONTH}
               selectable
               onSelectSlot={handleSelectSlot}
               components={{
                  event: EventComponent
               }}
               className="font-sans"
            />
         </div>
      </div>

      {/* Tailwind overrrides for react-big-calendar to match our theme */}
      <style>{`
         .calendar-wrapper .rbc-calendar { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
         .calendar-wrapper .rbc-header { padding: 10px; font-weight: 900; color: #475569; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; }
         .calendar-wrapper .rbc-month-view { border: none; }
         .calendar-wrapper .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9; }
         .calendar-wrapper .rbc-month-row + .rbc-month-row { border-top: 1px solid #f1f5f9; }
         .calendar-wrapper .rbc-event { background-color: #10b981; border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); font-family: 'Plus Jakarta Sans', sans-serif; transition: transform 0.2s; }
         .calendar-wrapper .rbc-event:hover { transform: translateY(-1px); background-color: #059669; }
         .calendar-wrapper .rbc-today { background-color: #f0fdf4; }
         .calendar-wrapper .rbc-toolbar button { border-radius: 8px; font-weight: 700; color: #64748b; border-color: #e2e8f0; font-family: 'Plus Jakarta Sans', sans-serif; }
         .calendar-wrapper .rbc-toolbar button.rbc-active { background-color: #10b981; color: white; border-color: #10b981; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); }
         .calendar-wrapper .rbc-toolbar button:hover:not(.rbc-active) { background-color: #f1f5f9; }
      `}</style>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-up">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-slate-800 text-xl">Buat Jadwal Pengiriman</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Lucide.X className="w-5 h-5"/></button>
            </div>
            
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3">
               <Lucide.Calendar className="w-5 h-5 text-emerald-500" />
               <span className="font-bold">{moment(selectedDate).format('dddd, DD MMMM YYYY')}</span>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Plat Nopol</label>
                     <input value={nopol} onChange={e => setNopol(e.target.value)} placeholder="B 1234 CD" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-400 uppercase" />
                  </div>
                  <div>
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Nama Supir</label>
                     <input value={driver} onChange={e => setDriver(e.target.value)} placeholder="Budi" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-400" />
                  </div>
               </div>
               
               <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Barang (Material)</label>
                  <select value={material} onChange={e => setMaterial(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-400">
                     <option value="Beras Premium">Beras Premium</option>
                     <option value="Beras Medium">Beras Medium</option>
                     <option value="Beras Patah (Broken)">Beras Patah (Broken)</option>
                     <option value="Menir">Menir</option>
                     <option value="Katul">Katul</option>
                  </select>
               </div>

               <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Jumlah (Ton)</label>
                  <input type="number" value={tons || ''} onChange={e => setTons(Number(e.target.value))} placeholder="10" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-600 focus:ring-2 focus:ring-emerald-400" />
               </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">Batal</button>
              <button onClick={handleSaveEvent} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95">Simpan Jadwal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
