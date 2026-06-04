import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    Download, 
    ShoppingCart, 
    TrendingUp, 
    WalletCards, 
    Calculator,
    AlertCircle,
    FileSpreadsheet,
    PackageSearch,
    Banknote
} from 'lucide-react';

export const CoreFinancialDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'buku_transaksi' | 'buku_biaya' | 'laba_rugi'>('laba_rugi');
    const [purchases, setPurchases] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` };
            
            const [pRes, sRes, eRes] = await Promise.all([
                fetch('https://sabrent.pythonanywhere.com/api/finance/purchases', { headers }),
                fetch('https://sabrent.pythonanywhere.com/api/finance/sales', { headers }),
                fetch('https://sabrent.pythonanywhere.com/api/finance/expenses', { headers })
            ]);

            if (pRes.ok) setPurchases(await pRes.json());
            if (sRes.ok) setSales(await sRes.json());
            if (eRes.ok) setExpenses(await eRes.json());
        } catch (error) {
            console.error("Failed to fetch finance data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        window.open('https://sabrent.pythonanywhere.com/api/finance/export/laba-rugi', '_blank');
    };

    // Calculation Helpers
    const totalPendapatan = sales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const pembelianBeras = purchases.filter(p => p.item_name?.toLowerCase().includes('beras')).reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const pembelianKemasan = purchases.filter(p => p.item_name?.toLowerCase().includes('kemasan') || p.item_name?.toLowerCase().includes('zak')).reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const ongkosKuli = expenses.filter(e => e.category?.toLowerCase().includes('kuli')).reduce((acc, e) => acc + (e.amount || 0), 0);
    const ongkosTruk = expenses.filter(e => e.category?.toLowerCase().includes('truk')).reduce((acc, e) => acc + (e.amount || 0), 0);
    const biayaUtilitas = expenses.filter(e => e.category?.toLowerCase().includes('pln') || e.category?.toLowerCase().includes('pdam')).reduce((acc, e) => acc + (e.amount || 0), 0);
    
    const totalHPP = pembelianBeras + pembelianKemasan + ongkosKuli + ongkosTruk + biayaUtilitas;
    const labaBruto = totalPendapatan - totalHPP;
    
    const biayaOperasional = expenses
        .filter(e => !e.category?.toLowerCase().includes('kuli') && !e.category?.toLowerCase().includes('truk') && !e.category?.toLowerCase().includes('pln') && !e.category?.toLowerCase().includes('pdam'))
        .reduce((acc, e) => acc + (e.amount || 0), 0);
        
    const labaBersih = labaBruto - biayaOperasional;

    const renderLabaRugi = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 relative overflow-hidden">
                    <TrendingUp className="absolute right-4 bottom-4 w-24 h-24 text-emerald-500/10" />
                    <h3 className="text-emerald-800 font-bold mb-2">Total Pendapatan</h3>
                    <p className="text-4xl font-black text-emerald-600">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 relative overflow-hidden">
                    <PackageSearch className="absolute right-4 bottom-4 w-24 h-24 text-amber-500/10" />
                    <h3 className="text-amber-800 font-bold mb-2">Harga Pokok Penjualan (HPP)</h3>
                    <p className="text-4xl font-black text-amber-600">Rp {totalHPP.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 relative overflow-hidden">
                    <Banknote className="absolute right-4 bottom-4 w-24 h-24 text-blue-500/10" />
                    <h3 className="text-blue-800 font-bold mb-2">Laba Bersih</h3>
                    <p className="text-4xl font-black text-blue-600">Rp {labaBersih.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800 flex items-center">
                        <Calculator className="w-5 h-5 mr-2 text-slate-400" /> Rincian Laba Rugi (SAK Format)
                    </h3>
                    <button onClick={handleExport} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        <FileSpreadsheet className="w-4 h-4" /> Export CoreTax (.xlsx)
                    </button>
                </div>
                <div className="p-6">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="font-black text-slate-800 text-lg"><td className="py-3">PENDAPATAN</td><td className="text-right"></td></tr>
                            <tr><td className="py-2 pl-4 text-slate-600">Peredaran Bruto Usaha</td><td className="text-right font-mono font-bold">{totalPendapatan.toLocaleString('id-ID')}</td></tr>
                            
                            <tr className="font-black text-slate-800 text-lg mt-4"><td className="py-3 pt-6">HARGA POKOK PENJUALAN (HPP)</td><td className="text-right"></td></tr>
                            <tr><td className="py-2 pl-4 text-slate-600">Pembelian Beras</td><td className="text-right font-mono">{pembelianBeras.toLocaleString('id-ID')}</td></tr>
                            <tr><td className="py-2 pl-4 text-slate-600">Pembelian Kemasan</td><td className="text-right font-mono">{pembelianKemasan.toLocaleString('id-ID')}</td></tr>
                            <tr><td className="py-2 pl-4 text-slate-600">Ongkos Kuli</td><td className="text-right font-mono">{ongkosKuli.toLocaleString('id-ID')}</td></tr>
                            <tr><td className="py-2 pl-4 text-slate-600">Ongkos Truk</td><td className="text-right font-mono">{ongkosTruk.toLocaleString('id-ID')}</td></tr>
                            <tr><td className="py-2 pl-4 text-slate-600">Biaya Utilitas (PLN/PDAM)</td><td className="text-right font-mono border-b border-slate-200">{biayaUtilitas.toLocaleString('id-ID')}</td></tr>
                            <tr className="bg-slate-50"><td className="py-3 pl-4 font-bold text-slate-800">Total HPP</td><td className="text-right font-mono font-bold text-amber-600">({totalHPP.toLocaleString('id-ID')})</td></tr>
                            
                            <tr className="bg-emerald-50"><td className="py-4 font-black text-emerald-800 text-lg">LABA BRUTO USAHA</td><td className="text-right font-mono font-black text-emerald-600 text-lg">{labaBruto.toLocaleString('id-ID')}</td></tr>

                            <tr className="font-black text-slate-800 text-lg mt-4"><td className="py-3 pt-6">BIAYA & ADMINISTRASI</td><td className="text-right"></td></tr>
                            <tr><td className="py-2 pl-4 text-slate-600">Biaya Operasional Lainnya</td><td className="text-right font-mono border-b border-slate-200">{biayaOperasional.toLocaleString('id-ID')}</td></tr>

                            <tr className="bg-blue-50"><td className="py-4 font-black text-blue-800 text-xl">LABA BERSIH SEBELUM PAJAK</td><td className="text-right font-mono font-black text-blue-600 text-xl">{labaBersih.toLocaleString('id-ID')}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderBukuTransaksi = () => (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-blue-500" /> Buku Pembelian</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                            <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4">Barang</th><th className="px-6 py-4 text-right">Total (Rp)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {purchases.map((p, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{new Date(p.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{p.supplier_name}</td>
                                    <td className="px-6 py-4 text-slate-500">{p.item_name} <br/><span className="text-xs">{p.qty_kg}kg @ {p.price_per_kg}</span></td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">{p.total_amount?.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-500" /> Buku Penjualan</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                            <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Brand</th><th className="px-6 py-4 text-right">Total (Rp)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sales.map((s, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{s.customer_name}</td>
                                    <td className="px-6 py-4 text-slate-500">{s.brand_name} <br/><span className="text-xs">{s.qty_zak}zak @ {s.price_per_kg}/kg</span></td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">{s.total_amount?.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderBukuBiaya = () => (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800 flex items-center"><WalletCards className="w-5 h-5 mr-2 text-rose-500" /> Buku Biaya (Pengeluaran)</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4">Keterangan</th><th className="px-6 py-4">Tipe Bayar</th><th className="px-6 py-4 text-right">Nominal (Rp)</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.map((e, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-600">{new Date(e.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 font-bold text-slate-700"><span className="bg-slate-100 px-2 py-1 rounded-lg text-xs">{e.category}</span></td>
                                <td className="px-6 py-4 text-slate-500">{e.description}</td>
                                <td className="px-6 py-4 text-slate-500">{e.payment_type}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">{e.amount?.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                        <BarChart3 className="w-8 h-8 mr-3 text-emerald-600" />
                        CoreTax Finance ERP
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Sistem Keuangan SAK & Pelaporan Pajak CoreTax</p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button onClick={() => setActiveTab('laba_rugi')} className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${activeTab === 'laba_rugi' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
                    Laba Rugi (Live)
                </button>
                <button onClick={() => setActiveTab('buku_transaksi')} className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${activeTab === 'buku_transaksi' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
                    Buku Pembelian & Penjualan
                </button>
                <button onClick={() => setActiveTab('buku_biaya')} className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${activeTab === 'buku_biaya' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
                    Buku Biaya
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="mt-6">
                    {activeTab === 'laba_rugi' && renderLabaRugi()}
                    {activeTab === 'buku_transaksi' && renderBukuTransaksi()}
                    {activeTab === 'buku_biaya' && renderBukuBiaya()}
                </div>
            )}
        </div>
    );
};
