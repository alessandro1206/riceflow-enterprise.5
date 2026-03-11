import { useState, useRef } from 'react';
import { 
  Signature, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  FileText,
  Clock,
  History
} from 'lucide-react';

export const SignPanel = () => {
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeDoc, setActiveDoc] = useState('SJ-2024-001');

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setIsSigned(false);
  };

  const handleSign = () => {
    setIsSigned(true);
    // Logic for saving signature would go here
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex justify-between items-end no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center uppercase">
            <Signature className="mr-3 text-emerald-600 w-8 h-8" /> DIGITAL APPROVAL
          </h2>
          <p className="text-slate-500 font-medium">
            Otoritas Pengesahan Dokumen Elektronik Bumi Mas
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button className="px-6 py-2.5 bg-white text-emerald-700 shadow-sm rounded-xl font-black text-xs uppercase tracking-tight transition-all">
            Antrean Tanda Tangan
          </button>
          <button className="px-6 py-2.5 text-slate-400 hover:text-slate-600 rounded-xl font-black text-xs uppercase tracking-tight transition-all">
            Riwayat Persetujuan
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* DOCUMENT LIST */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dokumen Menunggu</h3>
          {[
            { id: 'SJ-2024-001', type: 'Surat Jalan', vendor: 'CV. Maju Jaya', time: '10:30' },
            { id: 'SJ-2024-002', type: 'Surat Jalan', vendor: 'UD. Sumber Tani', time: '11:15' },
            { id: 'PO-2024-089', type: 'Purchase Order', vendor: 'Logistik Pusat', time: '14:20' },
          ].map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`w-full text-left p-6 rounded-[32px] transition-all border ${
                activeDoc === doc.id
                  ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-900/5'
                  : 'bg-slate-50 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  activeDoc === doc.id ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {doc.type}
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> {doc.time}
                </span>
              </div>
              <h4 className="font-black text-slate-800 tracking-tight">{doc.id}</h4>
              <p className="text-xs text-slate-500 font-medium">{doc.vendor}</p>
            </button>
          ))}
        </div>

        {/* SIGNATURE AREA */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-10 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full translate-x-32 -translate-y-32"></div>
            
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                   Konfirmasi Tanda Tangan
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Dokumen: {activeDoc}</p>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-widest uppercase">Secured by RiceFlow</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 relative group overflow-hidden">
               <div className="p-12 text-center pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-opacity opacity-20 group-hover:opacity-10">
                  <Signature className="w-20 h-20 text-slate-300 mb-4" />
                  <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-sm">Goreskan Tanda Tangan di Sini</p>
               </div>
               
               <canvas 
                 ref={canvasRef}
                 className="w-full h-[300px] relative z-10 cursor-crosshair"
                 width={800}
                 height={300}
                 onMouseDown={() => setIsSigned(true)}
               />
               
               <div className="absolute bottom-6 right-8 z-20 flex space-x-3">
                  <button 
                    onClick={clearSignature}
                    className="p-3 bg-white text-slate-400 rounded-2xl shadow-lg border border-slate-100 hover:text-red-500 hover:scale-110 transition-all"
                    title="Ulangi"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
               </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                 <div className="flex items-center space-x-3 mb-4">
                    <History className="text-emerald-600 w-5 h-5" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Metadata Digital</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold">
                       <span className="text-slate-400 uppercase">Timestamp</span>
                       <span className="text-slate-800">{new Date().toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                       <span className="text-slate-400 uppercase">IP Address</span>
                       <span className="text-slate-800">192.168.1.45</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                       <span className="text-slate-400 uppercase">Operator ID</span>
                       <span className="text-emerald-700 font-black">SUPERVISOR-01</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleSign}
                disabled={!isSigned}
                className={`w-full h-full rounded-[32px] font-black text-lg transition-all flex items-center justify-center space-x-3 shadow-2xl ${
                  isSigned 
                    ? 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-900/20' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                {isSigned ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span>KONFIRMASI & KIRIM</span>
                  </>
                ) : (
                  <span>GORESKAN TANDA TANGAN</span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-6 text-slate-400">
             <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Lampiran: Surat_Jalan_102.pdf</span>
             </div>
             <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
             <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Verified by Amich Infra</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
