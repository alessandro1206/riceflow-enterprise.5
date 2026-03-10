import React from 'react';
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
  CheckCircle2,
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
    { name: 'Gabah (Bahan)', total: totalGabah, color: '#059669' },
    { name: 'Beras (Jadi)', total: totalBeras, color: '#4f46e5' },
  ];

  const businessPerformance = [
    {
      title: 'PP BUMI MAS',
      desc: 'Produksi & Giling',
      val: `${state.productionBook.length} Sesi`,
      icon: <Factory className="text-emerald-500" />,
      tab: 'production',
      bg: 'bg-emerald-50',
    },
    {
      title: 'JUAL LANGSUNG',
      desc: 'Ritel Pabrik',
      val: `Rp ${state.directSalesBook
        .reduce((a: any, b: any) => a + b.totalValue, 0)
        .toLocaleString()}`,
      icon: <Store className="text-amber-500" />,
      tab: 'direct_sales',
      bg: 'bg-amber-50',
    },
    {
      title: 'TRADING MAKMUR',
      desc: 'Distribusi Luar',
      val: `Rp ${state.salesBook
        .reduce((a: any, b: any) => a + b.totalValue, 0)
        .toLocaleString()}`,
      icon: <Briefcase className="text-indigo-500" />,
      tab: 'trading',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            RiceFlow Management
          </h2>
          <p className="text-slate-500">
            Monitoring Multi-Business Unit: Produksi, Ritel, & Trading
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">
            Status Sistem
          </p>
          <p className="flex items-center font-bold text-emerald-600">
            <CheckCircle2 className="w-4 h-4 mr-1" /> CLOUD AKTIF
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {businessPerformance.map((item, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(item.tab)}
            className={`${item.bg} p-8 rounded-[32px] border border-white shadow-sm hover:shadow-xl transition-all text-left group relative overflow-hidden`}
          >
            <div className="mb-4 bg-white p-3 rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <h4 className="font-black text-slate-800 text-lg">{item.title}</h4>
            <p className="text-xs text-slate-500 mb-4">{item.desc}</p>
            <p className="text-xl font-black text-slate-900">{item.val}</p>
            <ArrowRight className="absolute bottom-6 right-6 text-slate-300 group-hover:text-slate-800 transition-colors" />
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border shadow-sm">
          <h3 className="font-black text-slate-800 mb-8 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" /> Posisi
            Inventori (kg)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="total" radius={[12, 12, 0, 0]} barSize={60}>
                  {stockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
