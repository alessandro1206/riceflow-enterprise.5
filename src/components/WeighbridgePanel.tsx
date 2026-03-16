import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Scale, Truck, CheckCircle2, User, Database, Clock, Camera, RefreshCw, Settings, Monitor, Wifi, WifiOff, Zap } from 'lucide-react';
import Tesseract from 'tesseract.js';
import Webcam from 'react-webcam';

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

  // Camera & ALPR State
  const [cameraType, setCameraType] = useState<'ip' | 'local'>('ip');
  const [cameraSettings, setCameraSettings] = useState({
    ip: '192.168.1.190',
    user: 'admin',
    pass: 'Admin123',
    showSettings: false
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [liveFeedUrl, setLiveFeedUrl] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

  // Scale State
  const [liveWeight, setLiveWeight] = useState<number>(0);
  const [scaleStable, setScaleStable] = useState(false);
  const [scaleConnected, setScaleConnected] = useState(false);
  const [scaleUnit, setScaleUnit] = useState('KG');
  
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDiagnosticLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };
  
  const webcamRef = useRef<Webcam>(null);
  
  // Sync Camera Auth with Electron Main Process
  useEffect(() => {
    if ((window as any).electron?.send) {
      (window as any).electron.send('set-camera-auth', {
        user: cameraSettings.user,
        pass: cameraSettings.pass
      });
    }
  }, [cameraSettings.user, cameraSettings.pass]);

  // Listen for scale data from Electron IPC
  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron?.on) return;

    electron.on('scale-data', (data: any) => {
      setLiveWeight(data.weight);
      setScaleStable(data.stable);
      setScaleUnit(data.unit || 'KG');
      setScaleConnected(true);
    });

    electron.on('scale-status', (status: any) => {
      setScaleConnected(status.connected);
      if (status.connected) {
        addLog(`Timbangan CAS 200i terhubung di ${status.port}`);
      } else {
        addLog(`Timbangan terputus: ${status.error || 'Disconnected'}`);
      }
    });

    electron.on('live-feed-stopped', () => {
      setShowLiveFeed(false);
      setLiveFeedUrl(null);
      addLog('Live feed berhenti.');
    });

    electron.on('live-feed-error', (msg: string) => {
      addLog(`Error Live Feed: ${msg}`);
      setOcrStatus(msg);
      setShowLiveFeed(false);
      setLiveFeedUrl(null);
    });
  }, []);

  // Use current scale weight for the form
  const useCurrentWeight = () => {
    if (liveWeight <= 0) return;
    if (activeSubTab === 'open') {
      setOpenForm(prev => ({ ...prev, grossWeight: String(liveWeight) }));
      addLog(`Berat Kotor diisi dari timbangan: ${liveWeight} KG`);
    } else {
      setCloseForm(prev => ({ ...prev, tareWeight: String(liveWeight) }));
      addLog(`Berat Kosong diisi dari timbangan: ${liveWeight} KG`);
    }
  };

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
    setLastSnapshot(null);
    setOcrStatus('');
    alert('Tiket Berhasil Dibuka!');
  };

  const captureAndScan = useCallback(async () => {
    setIsScanning(true);
    setOcrStatus('Mengambil Gambar...');
    addLog('Mulai capture snapshot...');

    let imageToScan: string | null = null;

    if (cameraType === 'local') {
      addLog('Mengambil dari Webcam Lokal...');
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        imageToScan = imageSrc;
        setLastSnapshot(imageSrc);
        addLog('Webcam snapshot berhasil.');
      } else {
        addLog('Error: Gagal mengambil gambar dari webcam.');
        setOcrStatus('Gagal mengambil gambar dari webcam.');
        setIsScanning(false);
        return;
      }
    } else {
      // IP Camera Snapshot via Electron IPC
      addLog(`Minta snapshot IP via Electron: ${cameraSettings.ip}`);
      
      try {
        if (!(window as any).electron?.invoke) {
          throw new Error('Electron API IPC invoke tidak tersedia.');
        }

        const base64Image = await (window as any).electron.invoke('get-snapshot', cameraSettings.ip);
        
        if (!base64Image) {
           throw new Error('Gagal mendownload gambar dari kamera.');
        }

        imageToScan = base64Image;
        setLastSnapshot(imageToScan);
        addLog('IP Camera snapshot via Electron berhasil.');
      } catch (err: any) {
        console.error(err);
        addLog(`Error IP Dahua: ${err.message}`);
        setOcrStatus('Gagal terhubung ke Kamera IP Dahua.');
        setIsScanning(false);
        return;
      }
    }

    if (imageToScan) {
      try {
        addLog('Mulai AI OCR Tesseract...');
        setOcrStatus('Mengenali Plat Nomor (AI)...');
        const { data: { text } } = await Tesseract.recognize(imageToScan, 'eng');
        addLog(`OCR Raw Output: ${text.replace(/\n/g, ' ')}`);

        const cleanPlate = text.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
        const match = cleanPlate.match(/[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}/);

        if (match) {
          const plateNumber = match[0];
          addLog(`Plat Terdeteksi: ${plateNumber}`);
          if (activeSubTab === 'open') {
            setOpenForm(prev => ({ ...prev, nopol: plateNumber }));
            setOcrStatus(`Berhasil! Plat: ${plateNumber}`);
          } else {
            const openTicks = state.tickets?.filter((t: any) => t.status === 'OPEN') || [];
            const found = openTicks.find((t: any) => 
              t.nopol.replace(/\s/g, '') === plateNumber.replace(/\s/g, '')
            );
            if (found) {
              setCloseForm(prev => ({ ...prev, ticketId: found.id }));
              setOcrStatus(`Berhasil! Tiket: ${plateNumber}`);
            } else {
              addLog(`Warning: Plat ${plateNumber} tidak ada di tiket OPEN.`);
              setOcrStatus(`Plat ${plateNumber} tidak ada di tiket.`);
            }
          }
        } else {
          addLog('Info: Plat tidak terbaca jelas oleh AI.');
          setOcrStatus('Plat tidak terbaca jelas.');
        }
      } catch (err: any) {
        addLog(`Error AI: ${err.message}`);
        setOcrStatus('Gagal proses AI.');
      }
    }
    setIsScanning(false);
  }, [cameraType, cameraSettings, activeSubTab, state.tickets]);

  // Toggle RTSP live feed
  const toggleLiveFeed = async () => {
    const electron = (window as any).electron;
    if (showLiveFeed) {
      setShowLiveFeed(false);
      setLiveFeedUrl(null);
      if (electron?.invoke) {
        await electron.invoke('stop-live-feed');
      }
      addLog('Live feed dihentikan.');
    } else {
      if (electron?.invoke) {
        addLog('Memulai RTSP live feed via ffmpeg...');
        const result = await electron.invoke('start-live-feed', cameraSettings.ip);
        if (result.success) {
          setLiveFeedUrl(result.url);
          setShowLiveFeed(true);
          addLog(`Live feed aktif: ${result.url}`);
        } else {
          addLog(`Gagal start live feed: ${result.error}`);
          setOcrStatus('Gagal memulai live feed. Pastikan ffmpeg ter-install.');
        }
      } else {
        // Fallback: direct MJPEG URL for browser
        setShowLiveFeed(true);
        addLog('Live feed via direct URL (browser mode).');
      }
    }
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
        <button 
          type="button"
          onClick={() => setCameraSettings({...cameraSettings, showSettings: !cameraSettings.showSettings})}
          className="p-3 bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shadow-sm flex items-center font-bold text-sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Setelan Kamera Layimbang
        </button>
      </div>

      {/* ================================================================= */}
      {/* LIVE WEIGHT DISPLAY - CAS 200i                                     */}
      {/* ================================================================= */}
      <div className={`rounded-3xl p-6 shadow-lg border-2 transition-all ${
        scaleConnected 
          ? scaleStable 
            ? 'bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-500/50' 
            : 'bg-gradient-to-r from-slate-900 to-slate-800 border-amber-500/50'
          : 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Scale className="w-5 h-5 text-white/70" />
            <span className="text-xs font-black uppercase tracking-widest text-white/60">
              CAS 200i — Timbangan Live
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {scaleStable && scaleConnected && (
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                STABIL
              </span>
            )}
            {scaleConnected && !scaleStable && (
              <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/30 animate-pulse">
                BERGERAK
              </span>
            )}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              scaleConnected 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {scaleConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{scaleConnected ? 'COM4 OK' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline space-x-2">
            <span className={`font-mono font-black tracking-tight transition-all ${
              scaleConnected ? 'text-7xl text-white' : 'text-7xl text-slate-600'
            }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {scaleConnected ? liveWeight.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '---'}
            </span>
            <span className="text-2xl font-black text-white/40">{scaleUnit}</span>
          </div>

          <button
            type="button"
            onClick={useCurrentWeight}
            disabled={!scaleConnected || liveWeight <= 0}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
          >
            <Zap className="w-4 h-4" />
            <span>GUNAKAN BERAT INI</span>
          </button>
        </div>
      </div>

      {cameraSettings.showSettings && (
        <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl flex gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <div className="flex-1">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">IP Camera Dahua</label>
             <input value={cameraSettings.ip} onChange={e => setCameraSettings({...cameraSettings, ip: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono" />
          </div>
          <div className="flex-1">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Username</label>
             <input value={cameraSettings.user} onChange={e => setCameraSettings({...cameraSettings, user: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono" />
          </div>
          <div className="flex-1">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Password</label>
             <input type="password" value={cameraSettings.pass} onChange={e => setCameraSettings({...cameraSettings, pass: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono" />
          </div>
          <button onClick={() => setCameraSettings({...cameraSettings, showSettings: false})} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 py-3 rounded-xl">Tutup</button>
        </div>
      )}

      {cameraSettings.showSettings && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 animate-in fade-in slide-in-from-top-4 mt-2">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-emerald-500" />
              Diagnostic Logs (Troubleshooting)
            </h4>
            <button onClick={() => setDiagnosticLogs([])} className="text-[10px] text-slate-500 hover:text-white font-bold">CLEAR LOGS</button>
          </div>
          <div className="bg-black/50 p-4 rounded-2xl font-mono text-[10px] space-y-1 h-32 overflow-y-auto border border-white/5 shadow-inner">
            {diagnosticLogs.length === 0 ? (
              <div className="text-slate-600 italic">Antri log aktivitas...</div>
            ) : (
              diagnosticLogs.map((log, i) => (
                <div key={i} className={log.includes('Error') ? 'text-red-400' : log.includes('Berhasil') || log.includes('OK') || log.includes('terhubung') ? 'text-emerald-400' : 'text-slate-300'}>
                  {log}
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-[10px] text-slate-500 font-medium bg-slate-800/50 p-3 rounded-xl border border-white/5">
            <p>💡 <span className="text-slate-300">TIPS:</span> Pastikan ffmpeg ter-install untuk Live Feed RTSP. Snapshot tetap bisa tanpa ffmpeg.</p>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Kamera & ALPR Feed Section */}
          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
              <button 
                onClick={() => setCameraType('ip')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${cameraType === 'ip' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                <Database className="w-3 h-3" />
                <span>KAMERA IP</span>
              </button>
              <button 
                onClick={() => setCameraType('local')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${cameraType === 'local' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                <Monitor className="w-3 h-3" />
                <span>WEBCAM LOKAL</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-3xl p-2 relative shadow-inner overflow-hidden border-4 border-slate-800 ring-1 ring-white/5">
              {cameraType === 'local' ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full aspect-video object-cover rounded-xl"
                  videoConstraints={{ facingMode: 'environment' }}
                />
              ) : (
                <>
                  {showLiveFeed && liveFeedUrl ? (
                    <img 
                      src={liveFeedUrl}
                      alt="Live Feed"
                      className="w-full aspect-video object-cover rounded-xl"
                      onError={() => setOcrStatus('Stream Error. Pastikan ffmpeg & kamera aktif.')}
                    />
                  ) : showLiveFeed ? (
                    <img 
                      src={`http://${cameraSettings.ip}/cgi-bin/mjpg/video.cgi?subtype=1`}
                      alt="Live Feed"
                      className="w-full aspect-video object-cover rounded-xl"
                      onError={() => setOcrStatus('Stream IP Error. Pastikan IP & Auth benar.')}
                    />
                  ) : lastSnapshot ? (
                    <img src={lastSnapshot} alt="Snapshot" className="w-full aspect-video object-cover rounded-xl" />
                  ) : (
                    <div className="w-full aspect-video bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600">
                      <Camera className="w-12 h-12 mb-2 opacity-50" />
                      <span className="font-bold text-sm text-slate-500 uppercase tracking-widest">Kamera IP Standby</span>
                    </div>
                  )}
                </>
              )}
              
              {(showLiveFeed || cameraType === 'local') && (
                <div className="absolute top-6 left-6 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center z-10 shadow-lg border border-red-500/50">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  LIVE FEED
                </div>
              )}
              
              {ocrStatus && (
                <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl text-emerald-400 p-4 rounded-2xl text-[11px] font-mono font-black flex items-center shadow-2xl border border-white/10 z-10 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex-1 flex items-center">
                    {isScanning && <RefreshCw className="w-4 h-4 mr-3 animate-spin text-emerald-500" />}
                    <span className="uppercase tracking-tight">{ocrStatus}</span>
                  </div>
                  {lastSnapshot && !isScanning && (
                    <button onClick={() => setLastSnapshot(null)} className="ml-2 text-slate-500 hover:text-white transition-colors">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={captureAndScan}
                disabled={isScanning}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isScanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <span>{isScanning ? 'Membaca Plat...' : 'Ambil Snapshot & AI Scan'}</span>
              </button>
              <button
                type="button"
                onClick={toggleLiveFeed}
                className={`px-6 py-4 rounded-2xl font-black flex items-center justify-center transition-all shadow-md ${
                  showLiveFeed ? 'bg-red-50 text-red-600 border-2 border-red-100' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${showLiveFeed ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`}></div>
                {showLiveFeed ? 'STOP' : 'LIVE'}
              </button>
            </div>
          </div>

          <div>
          {activeSubTab === 'open' ? (
            <form onSubmit={handleOpenSubmit} className="space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                    <Truck className="w-3 h-3 mr-1" />
                    Plat Nomor Truk (Nopol)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: L 1234 AB"
                    value={openForm.nopol}
                    onChange={e => setOpenForm({...openForm, nopol: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xl tracking-wider focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-black text-slate-800 shadow-inner"
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
                <div className="flex space-x-2">
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={openForm.grossWeight}
                    onChange={e => setOpenForm({...openForm, grossWeight: e.target.value})}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-lg"
                  />
                  {scaleConnected && (
                    <button
                      type="button"
                      onClick={useCurrentWeight}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 rounded-xl font-bold text-xs transition-all flex items-center space-x-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>TIMBANGAN</span>
                    </button>
                  )}
                </div>
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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-xl tracking-widest mt-auto mb-2"
              >
                BUKA TIKET TIMBANGAN
              </button>
            </form>
          ) : (
            <form onSubmit={handleCloseSubmit} className="space-y-6 flex flex-col justify-between h-full">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                    <Camera className="w-3 h-3 mr-1" />
                    Plat Nomor Terdeteksi (Otomatis dari Snapshot)
                  </label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <span className="font-mono font-black text-xl text-slate-800 tracking-wider">
                      {state.tickets?.find((t:any) => t.id === closeForm.ticketId)?.nopol || 'BELUM SCAN PLAT NOMOR'}
                    </span>
                    {closeForm.ticketId && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  </div>
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
                        value={state.tickets?.find((t:any) => t.id === closeForm.ticketId)?.grossWeight || ''}
                        className="w-full bg-slate-200 border border-slate-300 rounded-xl p-3 text-slate-600 font-mono text-lg cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center text-amber-600">
                        <Scale className="w-3 h-3 mr-1" />
                        Berat Kosong (Tare) - KG
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="0"
                          value={closeForm.tareWeight}
                          onChange={e => setCloseForm({...closeForm, tareWeight: e.target.value})}
                          className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-lg text-amber-900"
                        />
                        {scaleConnected && (
                          <button
                            type="button"
                            onClick={useCurrentWeight}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 rounded-xl font-bold text-xs transition-all flex items-center space-x-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>TIMBANGAN</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {closeForm.tareWeight && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex justify-between items-center">
                        <span className="font-bold text-emerald-800">Estimasi Tonase Bersih (Netto):</span>
                        <span className="font-black text-2xl text-emerald-600 font-mono flex items-center">
                          {(state.tickets?.find((t:any) => t.id === closeForm.ticketId)?.grossWeight || 0) - parseFloat(closeForm.tareWeight)} 
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
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl transition-all shadow-xl tracking-widest mt-auto mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                TUTUP TIKET & HITUNG TONASE
              </button>
            </form>
          )}
          </div>
        </div>
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
