import React, { useState } from 'react';
import { Receipt, Save, Edit3, X, FileSpreadsheet } from 'lucide-react';

interface PurchasingBookProps {
  state: any;
  onUpdateTicketFinancials: (id: string, data: any) => void;
}

export const PurchasingBook: React.FC<PurchasingBookProps> = ({
  state,
  onUpdateTicketFinancials,
}) => {
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  
  const defaultEditForm = {
    settlementDate: '',
    notes: '',
    price: '',
    cashPaid: '',
    checkAmount: '',
    checkNumber: '',
    checkDate: '',
    dpDate: '',
    dpCheckNumber: '',
    dpAmount: '',
  };
  
  const [editForm, setEditForm] = useState(defaultEditForm);

  // Only show closed tickets
  const closedTickets = (state.tickets || []).filter((t: any) => t.status === 'CLOSED').sort((a: any, b: any) => {
    return new Date(`${b.dateOut}T${b.timeOut}`).getTime() - new Date(`${a.dateOut}T${a.timeOut}`).getTime();
  });

  const handleEdit = (ticket: any) => {
    setEditingTicketId(ticket.id);
    setEditForm({
      settlementDate: ticket.settlementDate || '',
      notes: ticket.notes || '',
      price: ticket.price ? ticket.price.toString() : '',
      cashPaid: ticket.cashPaid ? ticket.cashPaid.toString() : '',
      checkAmount: ticket.checkAmount ? ticket.checkAmount.toString() : '',
      checkNumber: ticket.checkNumber || '',
      checkDate: ticket.checkDate || '',
      dpDate: ticket.dpDate || '',
      dpCheckNumber: ticket.dpCheckNumber || '',
      dpAmount: ticket.dpAmount ? ticket.dpAmount.toString() : '',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicketId) return;

    onUpdateTicketFinancials(editingTicketId, {
      settlementDate: editForm.settlementDate,
      notes: editForm.notes,
      price: parseFloat(editForm.price) || 0,
      cashPaid: parseFloat(editForm.cashPaid) || 0,
      checkAmount: parseFloat(editForm.checkAmount) || 0,
      checkNumber: editForm.checkNumber,
      checkDate: editForm.checkDate,
      dpDate: editForm.dpDate,
      dpCheckNumber: editForm.dpCheckNumber,
      dpAmount: parseFloat(editForm.dpAmount) || 0,
      // Backup mapping for main dashboard generic features
      dueDate: editForm.checkDate || editForm.settlementDate, 
    });

    setEditingTicketId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <FileSpreadsheet className="w-8 h-8 mr-3 text-emerald-600" />
            Buku Bantu Pembelian
          </h2>
          <p className="text-slate-500 font-medium mt-1">Daftar rinci pembelian dan histori pembayaran</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1500px]">
            <thead className="bg-slate-100">
              <tr className="border-b-2 border-slate-300 text-[11px] text-slate-600 uppercase tracking-wider font-extrabold">
                <th className="p-3 border-r border-slate-200">tgl terima</th>
                <th className="p-3 border-r border-slate-200">tgl totalan</th>
                <th className="p-3 border-r border-slate-200">keterangan</th>
                <th className="p-3 border-r border-slate-200">supplier/konsumen</th>
                <th className="p-3 border-r border-slate-200 text-right">harga</th>
                <th className="p-3 border-r border-slate-200 text-right">ton</th>
                <th className="p-3 border-r border-slate-200 text-right">jumlah</th>
                <th className="p-3 border-r border-slate-200 text-right">total</th>
                <th className="p-3 border-r border-slate-200 text-right">tunai</th>
                <th className="p-3 border-r border-slate-200 text-right">cek</th>
                <th className="p-3 border-r border-slate-200">no cek</th>
                <th className="p-3 border-r border-slate-200">tgl cek</th>
                <th className="p-3 border-r border-slate-200">tgl dp</th>
                <th className="p-3 border-r border-slate-200">no cek dp</th>
                <th className="p-3 border-r border-slate-200 text-right">jumlah dp</th>
                <th className="p-3 text-center sticky right-0 bg-slate-100 border-l-2 border-slate-300 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.05)]">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {closedTickets.map((t: any, idx: number) => {
                const isEditing = editingTicketId === t.id;
                const netWeight = t.netWeight || 0;
                const price = t.price || 0;
                const jumlah = netWeight * price;
                const bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

                const renderInput = (field: keyof typeof defaultEditForm, type: 'text' | 'number' | 'date' = 'text', placeholder = '') => (
                  <input
                    type={type}
                    value={editForm[field]}
                    placeholder={placeholder}
                    onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                    className="w-full border border-emerald-400 bg-white rounded p-1.5 focus:ring-2 focus:ring-emerald-500 font-medium text-xs shadow-inner"
                  />
                );

                if (isEditing) {
                  return (
                    <tr key={t.id} className="bg-emerald-50/80 border-y-2 border-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.1)] relative z-20">
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-600">{t.dateOut}</td>
                      <td className="p-2 border-r border-slate-200 w-32">{renderInput('settlementDate', 'date')}</td>
                      <td className="p-2 border-r border-slate-200 w-40">{renderInput('notes', 'text', 'Ket...')}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-emerald-900">{t.supplierName}</td>
                      <td className="p-2 border-r border-slate-200 w-28">{renderInput('price', 'number', '0')}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">{netWeight.toLocaleString('id-ID')}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800 bg-emerald-100/50">
                        {(netWeight * (parseFloat(editForm.price)||0)).toLocaleString('id-ID')}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono bg-emerald-100/50 text-slate-400">-</td>
                      <td className="p-2 border-r border-slate-200 w-32">{renderInput('cashPaid', 'number', '0')}</td>
                      <td className="p-2 border-r border-slate-200 w-32">{renderInput('checkAmount', 'number', '0')}</td>
                      <td className="p-2 border-r border-slate-200 w-28">{renderInput('checkNumber', 'text', 'No Cek')}</td>
                      <td className="p-2 border-r border-slate-200 w-32">{renderInput('checkDate', 'date')}</td>
                      <td className="p-2 border-r border-slate-200 w-32">{renderInput('dpDate', 'date')}</td>
                      <td className="p-2 border-r border-slate-200 w-28">{renderInput('dpCheckNumber', 'text', 'No Cek DP')}</td>
                      <td className="p-2 border-r border-slate-200 w-32">{renderInput('dpAmount', 'number', '0')}</td>
                      <td className="p-2 text-center sticky right-0 bg-emerald-100 border-l border-emerald-300 z-10 shadow-[-4px_0_12px_rgba(16,185,129,0.15)] flex justify-center gap-1.5 h-full items-center">
                        <button onClick={handleSave} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow flex items-center h-full" title="Simpan">
                          <Save className="w-4 h-4 mr-1" /> Simpan
                        </button>
                        <button onClick={() => setEditingTicketId(null)} className="p-1.5 bg-slate-300 text-slate-700 rounded hover:bg-slate-400 h-full" title="Batal">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={t.id} className={`group border-b border-slate-200 last:border-0 hover:bg-slate-100 transition-colors ${bgClass}`}>
                    <td className="p-2 px-3 border-r border-slate-200 font-medium text-slate-700">{t.dateOut}</td>
                    <td className="p-2 px-3 border-r border-slate-200 text-slate-600">{t.settlementDate || '-'}</td>
                    <td className="p-2 px-3 border-r border-slate-200 text-slate-600 truncate max-w-[150px]" title={t.notes}>{t.notes || '-'}</td>
                    <td className="p-2 px-3 border-r border-slate-200 font-bold text-slate-800">{t.supplierName}</td>
                    
                    <td className="p-2 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                      {t.price ? t.price.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="p-2 px-3 border-r border-slate-200 text-right font-mono text-slate-600">
                      {netWeight.toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 px-3 border-r border-slate-200 text-right font-mono font-bold bg-slate-100/30">
                      {t.price ? jumlah.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="p-2 px-3 border-r border-slate-200 text-right font-mono text-slate-400 bg-slate-100/30">-</td>
                    
                    <td className="p-2 px-3 border-r border-slate-200 text-right font-mono text-slate-700">
                      {t.cashPaid ? t.cashPaid.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="p-2 px-3 border-r border-slate-200 text-right font-mono text-slate-700">
                      {t.checkAmount ? t.checkAmount.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="p-2 px-3 border-r border-slate-200 text-slate-600">{t.checkNumber || '-'}</td>
                    <td className="p-2 px-3 border-r border-slate-200 text-slate-600">{t.checkDate || '-'}</td>
                    
                    <td className="p-2 px-3 border-r border-slate-200 text-slate-600">{t.dpDate || '-'}</td>
                    <td className="p-2 px-3 border-r border-slate-200 text-slate-600">{t.dpCheckNumber || '-'}</td>
                    <td className="p-2 px-3 border-r border-slate-200 text-right font-mono text-slate-700">
                      {t.dpAmount ? t.dpAmount.toLocaleString('id-ID') : '-'}
                    </td>
                    
                    <td className={`p-2 px-3 text-center sticky right-0 ${bgClass} border-l border-slate-200 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.02)] group-hover:bg-slate-100`}>
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center justify-center w-full"
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {closedTickets.length === 0 && (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400 font-medium">Buku Pembelian Kosong.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
