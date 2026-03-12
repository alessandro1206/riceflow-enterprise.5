import {
  useState,
  useEffect
} from 'react';
import {
  Scale,
  Printer,
  Truck,
  User,
  Save,
  Combine,
  Plus,
  Trash2,
  Camera,
  RefreshCw,
  Settings,
} from 'lucide-react';
import Tesseract from 'tesseract.js';

export const ProductionPanel = ({
  state,
  onMillingSubmit,
  onAddExpense
}: any) => {
  const [activeTab, setActiveTab] = useState('timbangan');
  const [ticket, setTicket] = useState({
    nopol: '',
    driver: '',
    material: 'GKG',
    gross: 0,
    tare: 0,
    netto: 0,
  });

  // Camera & ALPR State
  const [cameraSettings, setCameraSettings] = useState({
    ip: '192.168.31.190',
    user: 'admin',
    pass: 'Admin123',
    showSettings: false
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState('');

  // State Baru Giling Multiple Input & Output
  const [millInputs, setMillInputs] = useState([{
    pileId: 'A',
    weight: 0
  }]);
  const [millOutputs, setMillOutputs] = useState([{
    productId: 'p1',
    weight: 0
  }]);

  // State Biaya
  const [exp, setExp] = useState({ desc: '', amount: 0, cat: '61001' });

  // --- INTEGRATED SCALE LISTENER ---
  useEffect(() => {
    // Listens for 'scale-data' events from the Electron wrapper
    if ((window as any).electron) {
      (window as any).electron.on('scale-data', (weight: string) => {
        setTicket((prev) => ({ ...prev, gross: Number(weight) }));
      });
    }
  }, []);

  // Automatic Netto Calculation
  useEffect(() => {
    setTicket((prev) => ({ ...prev, netto: prev.gross - prev.tare }));
  }, [ticket.gross, ticket.tare]);

  const handlePrint = () => {
    window.print();
  };

  const handleGilingMixing = () => {
    const totalInput = millInputs.reduce((acc, cur) => acc + cur.weight, 0);
    const totalOutput = millOutputs.reduce((acc, cur) => acc + cur.weight, 0);

    if (totalInput <= 0) return alert("Input giling tidak boleh kosong!");
    if (totalOutput <= 0) return alert("Output giling tidak boleh kosong!");

    // Validasi stok tumpukan
    for (const input of millInputs) {
      const pile = state.piles.find((p: any) => p.id === input.pileId);
      if (!pile || pile.currentWeight < input.weight) {
        return alert(`Stok Tumpukan ${input.pileId} tidak cukup!`);
      }
    }

    onMillingSubmit(millInputs, millOutputs);
    alert("Proses Giling Mixing Berhasil!");
    setMillInputs([{ pileId: 'A', weight: 0 }]);
    setMillOutputs([{ productId: 'p1', weight: 0 }]);
  };

  const handleExpense = () => {
    if (!exp.amount || !exp.desc) return alert("Data biaya tidak lengkap!");
    onAddExpense(exp);
    setExp({ desc: '', amount: 0, cat: '61001' });
    alert("Biaya Operasional Tercatat!");
  };

  const handleSaveTicket = async () => {
    if (!ticket.nopol || ticket.netto <= 0) return alert('Data tidak lengkap!');

    const response = await fetch(
      'https://sabrent.pythonanywhere.com/api/scale/ticket',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      }
    );

    if (response.ok) {
      alert('Tiket Berhasil Disimpan!');
      setTicket({
        nopol: '',
        driver: '',
        material: 'GKG',
        gross: 0,
        tare: 0,
        netto: 0,
      });
      setLastSnapshot(null);
    }
  };

  const captureAndScan = async () => {
    setIsScanning(true);
    setOcrStatus('Mengambil Gambar...');
    
    // Dahua Snapshot URL
    const snapshotUrl = `http://${cameraSettings.ip}/cgi-bin/snapshot.cgi?loginuse=${cameraSettings.user}&loginpas=${cameraSettings.pass}`;
    
    try {
      const response = await fetch(snapshotUrl);
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setLastSnapshot(imageUrl);

      setOcrStatus('Mengenali Plat Nomor (Local AI)...');
      
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
        logger: m => console.log(m)
      });

      // Filter for Indonesian Plate Pattern (simplified: capital letters and numbers)
      const cleanPlate = text.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
      const match = cleanPlate.match(/[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}/);
      
      if (match) {
        setTicket(prev => ({ ...prev, nopol: match[0] }));
        setOcrStatus('Berhasil!');
      } else {
        setOcrStatus('Plat tidak terdeteksi, silakan coba lagi.');
      }
    } catch (err) {
      console.error(err);
      setOcrStatus('Gagal mengambil gambar dari kamera.');
      alert('Pastikan kamera terhubung di IP ' + cameraSettings.ip);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex justify-between items-end no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Scale className="mr-3 text-emerald-600" /> TIMBANGAN & GILING
          </h2>
          <p className="text-slate-500 font-medium">
            Pusat Pengawasan Infrastruktur & Produksi Bumi Mas
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {['timbangan', 'giling', 'biaya'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-tight transition-all ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'biaya' ? 'BIAYA OPS' : tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'timbangan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="glass-panel p-10 no-print">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Registrasi Tiket</h3>
              <button 
                onClick={() => setCameraSettings({...cameraSettings, showSettings: !cameraSettings.showSettings})}
                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Nomor Polisi</label>
                  <div className="relative group">
                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      className="w-full p-4 pl-12 glass-input font-black text-xl uppercase"
                      value={ticket.nopol}
                      onChange={(e) => setTicket({ ...ticket, nopol: e.target.value.toUpperCase() })}
                      placeholder="L 1234 AB"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Nama Sopir</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      className="w-full p-4 pl-12 glass-input font-bold"
                      value={ticket.driver}
                      onChange={(e) => setTicket({ ...ticket, driver: e.target.value })}
                      placeholder="Input Nama"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Jenis Material</label>
                  <select
                    className="w-full p-4 glass-input font-bold"
                    value={ticket.material}
                    onChange={(e) => setTicket({ ...ticket, material: e.target.value })}
                  >
                    <option value="GKG">Gabah Giling (GKG)</option>
                    <option value="GKP">Gabah Panen (GKP)</option>
                    <option value="RICE">Beras Setengah Jadi</option>
                  </select>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 flex items-center justify-between">
                   <div>
                     <p className="text-[10px] font-black text-emerald-700 uppercase mb-1">Live Scale</p>
                     <p className="text-2xl font-black text-emerald-900">{ticket.gross.toLocaleString()}<small className="text-xs ml-1">KG</small></p>
                   </div>
                   <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                   </div>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                {showLiveFeed && (
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-inner">
                    <img 
                      src={`http://${cameraSettings.ip}/cgi-bin/mjpg/video.cgi?subtype=1&loginuse=${cameraSettings.user}&loginpas=${cameraSettings.pass}`}
                      alt="Live Feed"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      LIVE
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={captureAndScan}
                    disabled={isScanning}
                    className="flex-1 bg-slate-900 text-white py-5 rounded-3xl font-black flex items-center justify-center space-x-3 hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50"
                  >
                    {isScanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <span>{isScanning ? 'SCAN' : 'AMBIL SNAPSHOT'}</span>
                  </button>
                  <button
                    onClick={() => setShowLiveFeed(!showLiveFeed)}
                    className={`px-6 py-5 rounded-3xl font-black flex items-center justify-center transition-all shadow-xl ${
                      showLiveFeed ? 'bg-red-50 text-red-600 border-2 border-red-100' : 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100 hover:bg-emerald-100'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mr-2 ${showLiveFeed ? 'bg-red-600 animate-pulse' : 'bg-emerald-400'}`}></div>
                    {showLiveFeed ? 'STOP' : 'LIVE'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
             {/* TICKET PREVIEW */}
            <div className="glass-panel p-10 bg-white relative overflow-hidden shadow-2xl shadow-emerald-900/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 -translate-y-10 translate-x-10 rounded-full blur-3xl"></div>
              
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div className="flex items-center space-x-4">
                  <img src="/weighbridge_icon.png" alt="Logo" className="w-14 h-14 rounded-2xl shadow-xl" />
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">PP BUMI MAS</h1>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enterprise Infrastructure</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-black text-slate-900 uppercase">TIKET TIMBANGAN</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Cloud ID: RF-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-10">
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">NOMOR POLISI</span>
                    <span className="text-sm font-black text-slate-800">{ticket.nopol || '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">DRIVER</span>
                    <span className="text-sm font-black text-slate-800">{ticket.driver || '---'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">MATERIAL</span>
                    <span className="text-sm font-black text-emerald-700">{ticket.material}</span>
                  </div>
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">TANGGAL</span>
                    <span className="text-sm font-black text-slate-800">{new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="p-4 bg-slate-50 rounded-2xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-center">BRUTO</p>
                   <p className="text-xl font-black text-center text-slate-900">{ticket.gross.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-center">TARA</p>
                   <p className="text-xl font-black text-center text-slate-900">{ticket.tare.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20">
                   <p className="text-[9px] font-black text-emerald-100 uppercase mb-1 text-center font-bold">NETTO</p>
                   <p className="text-xl font-black text-center text-white">{ticket.netto.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 text-center mt-12 pb-4">
                <div>
                   <div className="h-16 border-b border-slate-200 mb-2"></div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pihak Sopir</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-emerald-600 mb-2 uppercase tracking-[0.2em]">Validated by</p>
                  <p className="font-black text-xs text-slate-800 mb-1 border-b inline-block px-4">AMICH ENTERPRISE</p>
                </div>
              </div>

              <div className="mt-10 no-print flex space-x-4">
                <button
                  onClick={handleSaveTicket}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>SIMPAN TICKET</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-6 border-2 border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'giling' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
           <div className="glass-panel p-10">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10">Konfigurasi Penggilingan</h3>
              <div className="space-y-8">
                 <div className="p-8 bg-emerald-50/50 rounded-[40px] border border-emerald-100/50">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Input Gabah (Bahan)</p>
                      <button onClick={() => setMillInputs([...millInputs, { pileId: 'A', weight: 0 }])} className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm hover:scale-110 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {millInputs.map((input, idx) => (
                        <div key={idx} className="flex space-x-4 animate-fade-in">
                          <select 
                            className="flex-1 p-4 glass-input font-bold text-sm"
                            value={input.pileId}
                            onChange={(e) => {
                              const newInputs = [...millInputs];
                              newInputs[idx].pileId = e.target.value;
                              setMillInputs(newInputs);
                            }}
                          >
                            {state.piles.map((p: any) => (
                              <option key={p.id} value={p.id}>TUMPUKAN {p.id} ({p.type})</option>
                            ))}
                          </select>
                          <input 
                            type="number"
                            className="w-32 p-4 glass-input font-black text-sm text-center"
                            placeholder="KG"
                            value={input.weight || ''}
                            onChange={(e) => {
                              const newInputs = [...millInputs];
                              newInputs[idx].weight = Number(e.target.value);
                              setMillInputs(newInputs);
                            }}
                          />
                          {millInputs.length > 1 && (
                            <button onClick={() => setMillInputs(millInputs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="p-8 bg-slate-50 rounded-[40px] border border-white">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Produksi (Jadi)</p>
                      <button onClick={() => setMillOutputs([...millOutputs, { productId: 'p1', weight: 0 }])} className="p-2 bg-white text-slate-600 rounded-xl shadow-sm hover:scale-110 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {millOutputs.map((output, idx) => (
                        <div key={idx} className="flex space-x-4 animate-fade-in">
                          <select 
                            className="flex-1 p-4 glass-input font-bold text-sm"
                            value={output.productId}
                            onChange={(e) => {
                              const newOutputs = [...millOutputs];
                              newOutputs[idx].productId = e.target.value;
                              setMillOutputs(newOutputs);
                            }}
                          >
                            {state.inventory.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.productName}</option>
                            ))}
                          </select>
                          <input 
                            type="number"
                            className="w-32 p-4 glass-input font-black text-sm text-center"
                            placeholder="KG"
                            value={output.weight || ''}
                            onChange={(e) => {
                              const newOutputs = [...millOutputs];
                              newOutputs[idx].weight = Number(e.target.value);
                              setMillOutputs(newOutputs);
                            }}
                          />
                           {millOutputs.length > 1 && (
                            <button onClick={() => setMillOutputs(millOutputs.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 <button 
                   onClick={handleGilingMixing}
                   className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center space-x-3 group"
                 >
                   <Combine className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                   <span className="tracking-tighter text-lg uppercase">EKSEKUSI PROSES PRODUKSI</span>
                 </button>
              </div>
           </div>

           <div className="space-y-10">
              <div className="bg-[#1E293B] p-10 rounded-[48px] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full translate-x-32 -translate-y-32"></div>
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 relative z-10">Kalkulasi Rendemen</h4>
                 <div className="grid grid-cols-2 gap-10 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Total Input</p>
                      <p className="text-3xl font-black tracking-tighter">{millInputs.reduce((a, b) => a + b.weight, 0).toLocaleString()} <small className="text-sm font-bold text-slate-500">KG</small></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-2 italic">Rendemen Akurat</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                        {millInputs.reduce((a, b) => a + b.weight, 0) > 0 
                          ? ((millOutputs.reduce((a, b) => a + b.weight, 0) / millInputs.reduce((a, b) => a + b.weight, 0)) * 100).toFixed(1) 
                          : '0.0'}%
                      </p>
                    </div>
                 </div>
                 <p className="mt-10 text-xs text-slate-400 font-medium leading-relaxed relative z-10">
                   Persentase rendemen dihitung secara otomatis berdasarkan perbandingan input bahan baku dan output produk jadi.
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'biaya' && (
        <div className="max-w-2xl mx-auto animate-fade-in">
           <div className="glass-panel p-12">
              <div className="text-center mb-12">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-2">Pencatatan Biaya</h3>
                <p className="text-slate-400 text-xs font-medium">Buku Kas Operasional Bumi Mas Group</p>
              </div>
              <div className="space-y-8">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Keterangan Pengeluaran</label>
                   <input 
                     type="text"
                     className="w-full p-6 glass-input font-bold text-slate-800"
                     placeholder="contoh: Pembelian Solar Mesin Giling 200L"
                     value={exp.desc}
                     onChange={(e) => setExp({...exp, desc: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Jumlah (IDR)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                        <input 
                          type="number"
                          className="w-full p-6 pl-14 glass-input font-black text-emerald-700 text-xl"
                          value={exp.amount || ''}
                          onChange={(e) => setExp({...exp, amount: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Kategori Akun</label>
                      <select 
                        className="w-full p-6 glass-input font-black text-sm cursor-pointer"
                        value={exp.cat}
                        onChange={(e) => setExp({...exp, cat: e.target.value})}
                      >
                         <option value="61001">Solar & Energi</option>
                         <option value="61002">Gaji Borongan</option>
                         <option value="61003">Mekanik & Suku Cadang</option>
                         <option value="61004">Logistik & Distribusi</option>
                      </select>
                    </div>
                 </div>
                 <button 
                  onClick={handleExpense}
                  className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black shadow-2xl hover:bg-emerald-700 transition-all mt-6 uppercase tracking-widest text-sm"
                 >
                   SIMPAN TRANSAKSI BIAYA
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
