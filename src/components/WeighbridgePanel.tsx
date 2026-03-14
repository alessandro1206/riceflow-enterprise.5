import React, { useState } from 'react';
import { Scale, Truck, CheckCircle2, User, Database, Clock } from 'lucide-react';

interface WeighbridgePanelProps {
  state: any;
  onOpenTicket: (ticket: any) => void;
  onCloseTicket: (id: string, closeData: any) => void;
}

export const WeighbridgePanel: React.FC<WeighbridgePanelProps> = ({
  state,
  onOpenTicket,
  onCloseTicket,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'close'>('open');
  const [openForm, setOpenForm] = useState({
    nopol: '',
    supplierName: '',
    pileId: state.piles[0]?.id || '',
    grossWeight: '',
  });

  const [closeForm, setCloseForm] = useState({
    ticketId: '',
    tareWeight: '',
  });

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.nopol || !openForm.supplierName || !openForm.grossWeight) return;
    
    onOpenTicket({
      status: 'OPEN',
      dateIn: new Date().toISOString().split('T')[0],
      timeIn: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nopol: openForm.nopol,
      supplierName: openForm.supplierName,
      pileId: openForm.pileId,
      grossWeight: parseFloat(openForm.grossWeight),
    });

    setOpenForm({
      nopol: '',
      supplierName: '',
      pileId: state.piles[0]?.id || '',
      grossWeight: '',
    });
    alert('Tiket Berhasil Dibuka!');
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeForm.ticketId || !closeForm.tareWeight) return;
    
    const ticket = state.tickets.find((t: any) => t.id === closeForm.ticketId);
    if (!ticket) return;

    const tare = parseFloat(closeForm.tareWeight);
    const netWeight = ticket.grossWeight - tare;

    onCloseTicket(closeForm.ticketId, {
      dateOut: new Date().toISOString().split('T')[0],
      timeOut: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      tareWeight: tare,
      netWeight: netWeight,
    });

    setCloseForm({ ticketId: '', tareWeight: '' });
    alert(`Tiket Ditutup! Tonase Bersih: ${netWeight} KG`);
  };

  const openTickets = state.tickets?.filter((t: any) => t.status === 'OPEN') || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <Scale className="w-8 h-8 mr-3 text-emerald-600" />
            Modul Timbangan
          </h2>
          <p className="text-slate-500 font-medium mt-1">Registrasi Truk Masuk & Keluar (Dua Langkah)</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('open')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center ${
            activeSubTab === 'open' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4 mr-2" />
          TAHAP 1: BUKA TIKET (Timbang Masuk)
        </button>
        <button
          onClick={() => setActiveSubTab('close')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center ${
            activeSubTab === 'close' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          TAHAP 2: TUTUP TIKET (Timbang Keluar)
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        {activeSubTab === 'open' ? (
          <form onSubmit={handleOpenSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                  <Truck className="w-3 h-3 mr-1" />
                  Plat Nomor Truk
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: L 1234 AB"
                  value={openForm.nopol}
                  onChange={e => setOpenForm({...openForm, nopol: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  Nama Supplier
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Sugeng"
                  value={openForm.supplierName}
                  onChange={e => setOpenForm({...openForm, supplierName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                  <Scale className="w-3 h-3 mr-1" />
                  Berat Kotor (Gross) - KG
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={openForm.grossWeight}
                  onChange={e => setOpenForm({...openForm, grossWeight: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                  <Database className="w-3 h-3 mr-1" />
                  Alokasi Tumpukan (Pile)
                </label>
                <select
                  value={openForm.pileId}
                  onChange={e => setOpenForm({...openForm, pileId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                >
                  {state.piles.map((p: any) => (
                    <option key={p.id} value={p.id}>Tumpukan {p.id} ({p.type})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              BUKA TIKET TIMBANGAN
            </button>
          </form>
        ) : (
          <form onSubmit={handleCloseSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Pilih Tiket Aktif (Truk di Dalam)
                </label>
                <select
                  required
                  value={closeForm.ticketId}
                  onChange={e => setCloseForm({...closeForm, ticketId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-bold"
                >
                  <option value="">-- Pilih Tiket / Plat Nomor --</option>
                  {openTickets.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.nopol} - {t.supplierName} (Masuk: {t.timeIn})
                    </option>
                  ))}
                </select>
                {openTickets.length === 0 && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Tidak ada truk yang sedang di dalam area (Buka Tiket kosong).</p>
                )}
              </div>

              {closeForm.ticketId && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                      <Scale className="w-3 h-3 mr-1" />
                      Berat Kotor Awal (Gross) - KG
                    </label>
                    <input
                      type="number"
                      disabled
                      value={state.tickets.find((t:any) => t.id === closeForm.ticketId)?.grossWeight || ''}
                      className="w-full bg-slate-200 border border-slate-300 rounded-xl p-3 text-slate-600 font-mono text-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center text-amber-600">
                      <Scale className="w-3 h-3 mr-1" />
                      Berat Kosong (Tare) - KG
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={closeForm.tareWeight}
                      onChange={e => setCloseForm({...closeForm, tareWeight: e.target.value})}
                      className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-lg text-amber-900"
                    />
                  </div>
                  
                  {closeForm.tareWeight && (
                    <div className="col-span-1 md:col-span-2 bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex justify-between items-center">
                      <span className="font-bold text-emerald-800">Estimasi Tonase Bersih (Netto):</span>
                      <span className="font-black text-2xl text-emerald-600 font-mono flex items-center">
                        {(state.tickets.find((t:any) => t.id === closeForm.ticketId)?.grossWeight || 0) - parseFloat(closeForm.tareWeight)} 
                        <span className="text-sm ml-1 text-emerald-500">KG</span>
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={!closeForm.ticketId || !closeForm.tareWeight}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              TUTUP TIKET & HITUNG TONASE
            </button>
          </form>
        )}
      </div>
      
      {/* List Recent Tickets */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mt-6">
        <h3 className="font-black text-slate-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-slate-400" />
          5 Tiket Terakhir
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-bold">Waktu Masuk</th>
                <th className="pb-3 font-bold">Plat Nomor</th>
                <th className="pb-3 font-bold">Supplier</th>
                <th className="pb-3 font-bold text-right">Netto (KG)</th>
                <th className="pb-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700">
              {(state.tickets || []).slice().reverse().slice(0, 5).map((t: any) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-3">
                    <div className="font-bold">{t.dateIn}</div>
                    <div className="text-xs text-slate-400">{t.timeIn}</div>
                  </td>
                  <td className="py-3 font-bold">{t.nopol}</td>
                  <td className="py-3">{t.supplierName}</td>
                  <td className="py-3 text-right font-mono">
                    {t.netWeight ? t.netWeight.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      t.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!state.tickets || state.tickets.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada data tiket.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
