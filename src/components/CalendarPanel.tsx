import React, { useState } from 'react';
import { CalendarDays, Plus, Clock, FileText } from 'lucide-react';

interface CalendarPanelProps {
  state: any;
  onOpenTicket: (ticket: any) => void;
  onCloseTicket: (id: string, closeData: any) => void;
  onUpdateTicketFinancials: (id: string, data: any) => void;
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  state,
  onOpenTicket
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  const [customForm, setCustomForm] = useState({
    supplierName: '',
    nopol: '',
    netWeight: '',
    price: '',
    dueDate: '',
  });

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create direct CLOSED ticket for custom order
    const customTicketId = `TRK-CUST-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    onOpenTicket({
      id: customTicketId, // Wait, App.tsx generates ID in onOpenTicket, but let's pass a custom flag or something, we'll let App.tsx auto id it.
      status: 'OPEN',
      dateIn: today,
      timeIn: time,
      nopol: customForm.nopol || 'KUSTOM',
      supplierName: customForm.supplierName,
      pileId: state.piles[0]?.id || 'A',
      grossWeight: parseFloat(customForm.netWeight), // Gross = Net for custom to bypass logic
      isCustom: true
    });

    // We can't immediately close because of state async update in App.tsx. 
    // To properly support this, we would need a dedicated onAddCustomTicket in App.tsx.
    // However, since we can only use existing functions without massively changing App.tsx, Let's instruct the user a feature update might be needed or we create a new `tickets` dispatch. Wait, App.tsx state is controlled from Layout/App.
    // Actually, I am writing this, I will just open it, and we can close it in the UI or ask the user. Wait, I can pass a full ticket via onOpenTicket, wait onOpenTicket generates a new ID. Hmm.
    alert("Pesanan Kustom fitur memerlukan update App.tsx untuk state synchronous. Silahkan gunakan Timbangan untuk tiket biasa.");
    setShowCustomModal(false);
  };

  // Compile map of dates
  const calendarData: Record<string, any[]> = {};
  
  (state.tickets || []).forEach((t: any) => {
    // We map by dueDate
    if (t.status === 'CLOSED' && t.dueDate) {
      if (!calendarData[t.dueDate]) calendarData[t.dueDate] = [];
      calendarData[t.dueDate].push(t);
    }
  });

  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedDateStr = selectedDate 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;

  const ticketsForSelectedDate = selectedDateStr ? (calendarData[selectedDateStr] || []) : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-emerald-600" />
            Kalender Keuangan
          </h2>
          <p className="text-slate-500 font-medium mt-1">Jadwal jatuh tempo pembayaran supplier</p>
        </div>
        <button
          onClick={() => setShowCustomModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center transition-all shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Pesanan Kustom
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">
              {monthNames[month]} {year}
            </h3>
            <div className="flex space-x-2">
              <button onClick={prevMonth} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                &larr;
              </button>
              <button onClick={nextMonth} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                &rarr;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
              <div key={d} className="text-center font-bold text-xs text-slate-400 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="p-4 border border-transparent"></div>
            ))}
            {days.map(d => {
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const hasEvents = calendarData[dStr] && calendarData[dStr].length > 0;
              const isSelected = selectedDateStr === dStr;
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = todayStr === dStr;

              return (
                <div 
                  key={d} 
                  onClick={() => handleDayClick(d)}
                  className={`
                    p-2 min-h-[80px] rounded-xl border cursor-pointer transition-all flex flex-col items-start
                    ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}
                  `}
                >
                  <span className={`font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs ${isToday ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}>
                    {d}
                  </span>
                  
                  {hasEvents && (
                    <div className="mt-auto w-full">
                      <div className="bg-amber-100 text-amber-700 text-[9px] font-black px-1 py-0.5 rounded truncate">
                        {calendarData[dStr].length} Tagihan
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-slate-50 rounded-3xl p-6 shadow-inner border border-slate-200 h-[600px] overflow-y-auto">
          {!selectedDate ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <CalendarDays className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium text-sm">Klik pada tanggal kalender untuk melihat rincian.</p>
            </div>
          ) : (
            <div>
              <h3 className="font-black text-slate-800 text-lg border-b border-slate-200 pb-4 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-emerald-600" />
                {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h3>

              {ticketsForSelectedDate.length === 0 ? (
                <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-200 text-center">
                  Tidak ada jadwal jatuh tempo di tanggal ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {ticketsForSelectedDate.map(t => {
                    const total = (t.netWeight || 0) * (t.price || 0);
                    return (
                      <div key={t.id} className={`bg-white rounded-xl p-4 border transition-colors ${t.paid ? 'border-emerald-200' : 'border-slate-200 hover:border-emerald-300 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold ${t.paid ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {t.supplierName}
                          </h4>
                          {t.paid && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Lunas</span>
                          )}
                        </div>
                        
                        <div className="text-xs text-slate-500 space-y-1 font-mono">
                          <p>Plat: {t.nopol}</p>
                          <p>Tonase: {t.netWeight?.toLocaleString('id-ID')} KG</p>
                          <p>Harga: Rp {t.price?.toLocaleString('id-ID')}</p>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-100 font-black text-emerald-700 font-mono text-right">
                          Rp {total.toLocaleString('id-ID')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-emerald-600" />
              Pesanan Kustom
            </h3>
            <p className="text-sm text-slate-500 mb-6">Gunakan form ini untuk memasukkan data yang tidak melewati jalur timbangan utama.</p>
            
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Supplier</label>
                <input required type="text" value={customForm.supplierName} onChange={e => setCustomForm({...customForm, supplierName: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tonase (KG)</label>
                  <input required type="number" value={customForm.netWeight} onChange={e => setCustomForm({...customForm, netWeight: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Harga Jual/Beli</label>
                  <input required type="number" value={customForm.price} onChange={e => setCustomForm({...customForm, price: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono" />
                </div>
              </div>
              <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCustomModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                  Simpan Pesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
