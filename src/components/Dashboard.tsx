import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Factory,
  Briefcase,
  Sparkles,
  TrendingUp,
  Store,
  ArrowRight,
} from 'lucide-react';

export const Dashboard = ({ state, setActiveTab }: any) => {
  const totalGabah = state.piles.reduce(
    (acc: number, p: any) => acc + p.currentWeight,
    0
  );
  const totalBeras = state.inventory.reduce(
    (acc: number, i: any) => acc + i.quantity,
    0
  );

  const stockData = [
    { name: 'Gabah (Bahan)', total: totalGabah, color: '#10B981' },
    { name: 'Beras (Jadi)', total: totalBeras, color: '#F59E0B' },
  ];

  const businessPerformance = [
    {
      title: 'PP BUMI MAS',
      desc: 'Produksi & Giling',
      val: `${state.productionBook.length} Sesi`,
      icon: <Factory className="text-emerald-500" />,
      tab: 'production',
      bg: 'glass-panel border-emerald-500/10',
    },
    {
      title: 'JUAL LANGSUNG',
      desc: 'Ritel Pabrik',
      val: `Rp ${state.directSalesBook
        .reduce((a: any, b: any) => a + b.totalValue, 0)
        .toLocaleString()}`,
      icon: <Store className="text-amber-500" />,
      tab: 'direct_sales',
      bg: 'glass-panel border-amber-500/10',
    },
    {
      title: 'TRADING MAKMUR',
      desc: 'Distribusi Luar',
      val: `Rp ${state.salesBook
        .reduce((a: any, b: any) => a + b.totalValue, 0)
        .toLocaleString()}`,
      icon: <Briefcase className="text-emerald-400" />,
      tab: 'trading',
      bg: 'glass-panel border-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 capitalize">
            Selamat Datang, <span className="text-emerald-600">Amich</span>
          </h2>
          <p className="text-slate-500 font-medium">
            RiceFlow <span className="text-emerald-700 font-bold">Enterprise</span> • Monitoring Multi-Business Unit
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Cluster Server Status
          </p>
          <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="font-black text-emerald-700 text-[10px] tracking-tight uppercase">CLOUD CONNECTED</span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {businessPerformance.map((item, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(item.tab)}
            className={`${item.bg} p-10 hover:shadow-2xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
            <div className="mb-6 bg-white p-4 rounded-2xl w-fit shadow-xl shadow-slate-900/5 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{item.title}</h4>
            <p className="text-xs text-slate-400 font-bold mb-6 tracking-wide">{item.desc}</p>
            <div className="flex justify-between items-end">
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{item.val}</p>
              <ArrowRight className="text-slate-300 group-hover:text-emerald-600 transition-colors w-5 h-5 group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-panel p-10">
          <h3 className="font-black text-slate-800 mb-10 flex items-center text-sm uppercase tracking-widest">
            <TrendingUp className="w-5 h-5 mr-3 text-emerald-500" /> Posisi Real-Time Inventori (kg)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  contentStyle={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                    padding: '20px',
                    fontWeight: 900
                  }}
                />
                <Bar dataKey="total" radius={[12, 12, 12, 12]} barSize={40}>
                  {stockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1E293B] p-10 rounded-[40px] text-white flex flex-col justify-center relative overflow-hidden transition-all duration-500">
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-emerald-500/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10">
            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-3xl w-fit mb-8">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tighter">AI Market Insights</h3>
            
            {state.showFullAnalysis ? (
              <div className="space-y-6">
                <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
                  <h4 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-3">Analisis Jawa Timur</h4>
                  <p className="text-sm text-slate-100 leading-relaxed font-medium">
                    Panen raya di Kediri & Nganjuk meningkatkan suplai Gabah Kering Giling (GKG) sebesar 15%. Harga diprediksi terkoreksi Rp 200/kg.
                  </p>
                </div>
                <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
                  <h4 className="text-amber-400 font-black text-xs uppercase tracking-widest mb-3">Rekomendasi Strategis</h4>
                  <p className="text-sm text-slate-100 leading-relaxed font-medium">
                    Segera tingkatkan penyerapan gabah minggu ini sebelum puncak musim hujan yang dapat menurunkan kualitas kadar air.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('dashboard_brief')}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  ← KEMBALI KE RINGKASAN
                </button>
              </div>
            ) : (
              <>
                <p className="text-slate-400 leading-relaxed font-medium mb-10">
                  Harga gabah di wilayah Jawa Timur diprediksi akan stabil dalam 7 hari ke depan. Disarankan untuk memprioritaskan inventory "Beras Premium" untuk meningkatkan margin profit.
                </p>
                <button 
                  onClick={() => setActiveTab('dashboard_full')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-2xl shadow-emerald-900/40"
                >
                  LIHAT ANALISA LENGKAP
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
