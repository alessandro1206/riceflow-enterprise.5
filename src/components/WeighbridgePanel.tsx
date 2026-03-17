import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Scale, Truck, CheckCircle2, User, Database, Clock, Camera, RefreshCw, Settings, Monitor, Wifi, WifiOff, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
    port: '80',
    user: 'admin',
    pass: 'Admin123',
    showSettings: false
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [liveFeedUrl, setLiveFeedUrl] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
  const [lastProcessedSnapshot, setLastProcessedSnapshot] = useState<string | null>(null);
  const [lastInvertedSnapshot, setLastInvertedSnapshot] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [showAIVision, setShowAIVision] = useState(false);
  const [aiSensitivity, setAiSensitivity] = useState(130);
  const [aiInvert, setAiInvert] = useState(false);
  const [isExpertAILoading, setIsExpertAILoading] = useState(false);
  const [hfToken, setHfToken] = useState<string>(localStorage.getItem('hf_token') || '');
  const [useLocalSmartAI, setUseLocalSmartAI] = useState<boolean>(localStorage.getItem('use_local_ai') === 'true');

  // Persist HF Token & Local AI toggle
  useEffect(() => {
    localStorage.setItem('hf_token', hfToken);
    localStorage.setItem('use_local_ai', useLocalSmartAI.toString());
  }, [hfToken, useLocalSmartAI]);
  const [lastClosedTicket, setLastClosedTicket] = useState<any | null>(null);

  // Video Devices State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(localStorage.getItem('selected_webcam') || undefined);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices]
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  useEffect(() => {
    if (selectedDeviceId) {
      localStorage.setItem('selected_webcam', selectedDeviceId);
    }
  }, [selectedDeviceId]);

  // Scale State
  const [liveWeight, setLiveWeight] = useState<number>(0);
  const [scaleStable, setScaleStable] = useState(false);
  const [scaleConnected, setScaleConnected] = useState(false);
  const [scaleError, setScaleError] = useState<string | null>(null);
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
        setScaleError(null);
        addLog(`Timbangan CAS 200i terhubung di ${status.port}`);
      } else {
        setScaleError(status.error || 'Terputus');
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

    electron.on('diagnostic-log', (msg: string) => {
      addLog(msg);
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

  const retryScaleConnection = () => {
    if ((window as any).electron?.send) {
      addLog('Mencoba menghubungkan ulang timbangan...');
      setScaleError('Menghubungkan...');
      (window as any).electron.send('retry-scale');
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

  // Revised Preprocessing: Adaptive Contrast, Grayscale, Inversion, and SMART-CROP with Region selection
  const preprocessImage = async (base64Str: string, contrastBoost = 2.0, threshold = 130, invert = false, region: 'center' | 'top' | 'bottom' | 'all' = 'center'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64Str); return; }

        let sX = 0, sY = 0, sW = img.width, sH = img.height;
        
        if (region === 'center') {
          sW = img.width * 0.7; sH = img.height * 0.5;
          sX = (img.width - sW) / 2; sY = (img.height - sH) / 2;
        } else if (region === 'top') {
          sW = img.width * 0.8; sH = img.height * 0.4;
          sX = (img.width - sW) / 2; sY = img.height * 0.1;
        } else if (region === 'bottom') {
          sW = img.width * 0.8; sH = img.height * 0.4;
          sX = (img.width - sW) / 2; sY = img.height * 0.5;
        }

        canvas.width = sW;
        canvas.height = sH;
        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, sW, sH);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          let b = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
          let v = (b - 128) * contrastBoost + 128;
          v = v > threshold ? 255 : 0;
          if (invert) v = 255 - v;
          data[i] = data[i+1] = data[i+2] = v;
        }
        ctx.putImageData(imageData, 0, 0);
        const processed = canvas.toDataURL('image/jpeg', 0.85);
        if (invert) setLastInvertedSnapshot(processed);
        else setLastProcessedSnapshot(processed);
        resolve(processed);
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  };

  // Hugging Face Expert AI Call
  const callExpertAI = async (base64Str: string): Promise<string | null> => {
    if (!base64Str) return null;
    setIsExpertAILoading(true);
    addLog('Expert AI: Mengirim foto ke Cloud (Qwen-2-VL)...');

    try {
      if (!hfToken || !hfToken.startsWith('hf_')) {
        addLog('Expert AI Warning: Token HF tidak valid atau kosong. Silakan isi di input Token.');
      }

      const actualBase64 = base64Str.split(',')[1];
      const response = await fetch("https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-7B-Instruct", {
        headers: {
          "Authorization": `Bearer ${hfToken || "hf_YmNNoVofkYFpQeYqXkZpGZkGnGzGzGzGzGzGz"}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: {
            image: actualBase64,
            prompt: "Identify the vehicle license plate number in this image. Precise plate number only."
          }
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.error || errJson.message || 'Unknown Error';
        addLog(`Cloud AI Error (${response.status}): ${errMsg}`);
        if (response.status === 401) addLog('Saran: Periksa Hugging Face Token Anda.');
        if (response.status === 503) addLog('Saran: Server sedang sibuk/loading. Tunggu 30 detik lalu coba lagi.');
        return null;
      }

      const result = await response.json();
      const text = (Array.isArray(result) ? result[0]?.generated_text : result?.generated_text || result?.error || JSON.stringify(result)) || '';
      
      addLog(`Cloud AI Raw Response: ${text.substring(0, 50)}...`);

      const match = text.toUpperCase().replace(/[^A-Z0-9\s]/g, '').match(/[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}/);
      if (match) {
        const foundPlate = match[0].replace(/\s+/g, ' ');
        return foundPlate;
      }
      return null;
    } catch (err: any) {
      addLog(`Expert AI Cloud Exception: ${err.message}`);
      return null;
    } finally {
      setIsExpertAILoading(false);
    }
  };

  // Local AI (YOLOv10 + EasyOCR) Call
  const runLocalSmartAI = async (base64Str: string): Promise<string | null> => {
    if (!base64Str) return null;
    try {
      addLog('Local Smart AI: Mengolah gambar (YOLOv10)...');
      const result = await (window as any).electron.invoke('run-local-ai', base64Str);
      if (result.success && result.plate) {
        return result.plate;
      }
      if (result.error) addLog(`Local AI Error: ${result.error}`);
      return null;
    } catch (err: any) {
      addLog(`Local AI Exception: ${err.message}`);
      return null;
    }
  };

  const installAIDependencies = async () => {
    const confirm = window.confirm("Ini akan men-download ~2GB library AI (PyTorch, YOLO, EasyOCR). Lanjutkan?");
    if (!confirm) return;
    
    addLog("Memulai instalasi library AI... Cek terminal/logs.");
    // In a real app we'd trigger the .bat via electron. 
    // For now we'll assume the user runs the .bat manually or we can try spawn.
    alert("Silakan buka folder 'WEIGHBRIDGE_FOR_USB' dan jalankan 'install_ai.bat' sebagai Administrator.");
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

        const base64Image = await (window as any).electron.invoke('get-snapshot', cameraSettings.ip, cameraSettings.port);
        
        if (!base64Image) {
           throw new Error('Gagal mendownload gambar dari kamera.');
        }

        imageToScan = base64Image;
        setLastSnapshot(imageToScan);
        addLog('IP Camera snapshot via Electron berhasil.');
      } catch (err: any) {
        console.error(err);
        addLog(`Error IP Dahua: ${err.message}`);
        setOcrStatus(`Gagal Snapshot: ${err.message}`);
        setIsScanning(false);
        return;
      }
    }

    if (imageToScan) {
      try {
        let plateCandidate: string | null = null;

        // --- PASS 1: LOCAL SMART AI (Prioritized if enabled) ---
        if (useLocalSmartAI) {
          setOcrStatus('Mencoba Local Smart AI (YOLOv10)...');
          addLog('ALPR: Menggunakan Local Smart AI sebagai engine utama...');
          const localResult = await runLocalSmartAI(imageToScan);
          if (localResult) {
            plateCandidate = localResult;
            addLog(`Local Smart AI Sukses: ${plateCandidate}`);
          }
        }

        // --- PASS 2: EXPERT CLOUD AI (Secondary / Fallback if level 1 fails) ---
        if (!plateCandidate) {
          setOcrStatus('Menghubungi Cloud AI (Qwen-VL High-Accuracy)...');
          addLog('ALPR: Mencoba Cloud AI (Expert)...');
          const cloudResult = await callExpertAI(imageToScan);
          if (cloudResult) {
            plateCandidate = cloudResult;
            addLog(`Cloud AI Sukses: ${plateCandidate}`);
          }
        }

        // --- PASS 3: OFFLINE FALLBACK (Tesseract) ---
        if (!plateCandidate) {
          addLog('Cloud/Smart AI Gagal. Switching to Offline Deep-Scan...');
          setOcrStatus('Mencoba Offline Deep-Scan...');
          
          const optS = {
            // @ts-ignore
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            tessedit_pageseg_mode: '7'
          };

          const passes = [
            { region: 'center', inv: aiInvert },
            { region: 'center', inv: !aiInvert },
            { region: 'bottom', inv: aiInvert },
            { region: 'all', inv: false }
          ];

          for (let i = 0; i < passes.length; i++) {
            const pass = passes[i];
            addLog(`Offline Pass ${i+1}: Scan ${pass.region}...`);
            // @ts-ignore
            const proc = await preprocessImage(imageToScan, 2.5, aiSensitivity, pass.inv, pass.region);
            // @ts-ignore
            const res = await Tesseract.recognize(proc, 'eng', { ...optS });
            const raw = res.data.text.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
            const match = raw.match(/[A-Z]{1,2}\d{1,4}[A-Z]{1,3}/);
            if (match) {
              plateCandidate = match[0];
              addLog(`Offline Pass ${i+1} Berhasil: ${plateCandidate}`);
              break;
            }
          }
        }

        // --- FINAL RESULT HANDLING ---
        if (plateCandidate) {
          const plateNumber = plateCandidate;
          if (activeSubTab === 'open') {
            setOpenForm(prev => ({ ...prev, nopol: plateNumber }));
            setOcrStatus(`Berhasil! Plat: ${plateNumber}`);
            addLog(`ALPR Sukses (Open): ${plateNumber}`);
          } else {
            const openTicks = state.tickets?.filter((t: any) => t.status === 'OPEN') || [];
            const found = openTicks.find((t: any) => 
              t.nopol.replace(/\s/g, '') === plateNumber.replace(/\s/g, '')
            );
            if (found) {
              setCloseForm(prev => ({ ...prev, ticketId: found.id }));
              setOcrStatus(`Berhasil! Menemukan Tiket: ${found.id}`);
              addLog(`ALPR Sukses (Close): Tiket ${found.id} ditemukan.`);
            } else {
              setOcrStatus(`Plat ${plateNumber} terdeteksi, tapi tiket tidak ditemukan.`);
              addLog(`ALPR Warning: Plat ${plateNumber} tidak punya tiket OPEN.`);
            }
          }
        } else {
          setOcrStatus('Tidak ada plat terdeteksi.');
          addLog('Semua Pass (Cloud & Offline) Gagal. Periksa kamera.');
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

    setLastClosedTicket({
      ...ticket,
      dateOut: new Date().toISOString().split('T')[0],
      timeOut: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      tareWeight: tare,
      netWeight: netWeight,
    });

    setCloseForm({ ticketId: '', tareWeight: '' });
    // alert(`Tiket Ditutup! Tonase Bersih: ${netWeight} KG`);
  };

  const handlePrint = () => {
    window.print();
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
            <div className="flex flex-col items-end">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                scaleConnected 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {scaleConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{scaleConnected ? 'COM4 OK' : 'OFFLINE'}</span>
              </div>
              {!scaleConnected && (
                <button 
                  onClick={retryScaleConnection}
                  className="mt-2 text-[9px] font-bold text-white/40 hover:text-emerald-400 underline decoration-white/10 transition-colors uppercase tracking-widest"
                >
                  Coba Hubungkan Lagi
                </button>
              )}
            </div>
          </div>
        </div>

        {scaleError && !scaleConnected && (
          <div className="px-6 mb-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] font-medium text-red-300 leading-relaxed">
                <span className="font-black">ERROR TIMBANGAN:</span> {scaleError}
              </p>
            </div>
          </div>
        )}

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
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
          {/* Camera Auth Settings */}
          <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl flex gap-4 items-end">
            <div className="w-40">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Port (HTTP)</label>
               <input value={cameraSettings.port} onChange={e => setCameraSettings({...cameraSettings, port: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono text-white" />
            </div>
            <div className="flex-1">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">IP Camera Dahua</label>
               <input value={cameraSettings.ip} onChange={e => setCameraSettings({...cameraSettings, ip: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono" />
            </div>
            <div className="flex-1">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Username</label>
               <input value={cameraSettings.user} onChange={e => setCameraSettings({...cameraSettings, user: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono" />
            </div>
            <div className="flex-1">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Pilih Webcam Lokal</label>
               <select 
                 value={selectedDeviceId} 
                 onChange={e => setSelectedDeviceId(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono text-white"
               >
                 <option value="">Default Camera</option>
                 {devices.map((device, key) => (
                   <option key={key} value={device.deviceId}>
                     {device.label || `Camera ${key + 1}`}
                   </option>
                 ))}
               </select>
            </div>
            <div className="flex-1">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Password</label>
               <input type="password" value={cameraSettings.pass} onChange={e => setCameraSettings({...cameraSettings, pass: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:border-emerald-500 font-mono" />
            </div>
            <div className="flex gap-2">
              <button onClick={captureAndScan} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-3 rounded-xl flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Test Snapshot
              </button>
              <button onClick={() => setCameraSettings({...cameraSettings, showSettings: false})} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 py-3 rounded-xl">Tutup</button>
            </div>
          </div>

          {/* Diagnostic Logs & AI Vision Preview Section */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 text-emerald-500" />
                Diagnostic Logs & AI Vision
              </h4>
              <button onClick={() => setDiagnosticLogs([])} className="text-[10px] text-slate-500 hover:text-white font-bold">CLEAR LOGS</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
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
                 
                 <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Sensitivitas AI</span>
                       <span className="text-emerald-500">{aiSensitivity}</span>
                    </div>
                    <input 
                      type="range" min="50" max="220" value={aiSensitivity} 
                      onChange={(e) => setAiSensitivity(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    
                    <button 
                      type="button"
                      onClick={() => setAiInvert(!aiInvert)}
                      className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center border transition-all ${aiInvert ? 'bg-emerald-600 border-white/20 text-white shadow-lg' : 'bg-slate-700 border-white/5 text-slate-400'}`}
                    >
                       <RefreshCw className={`w-3 h-3 mr-2 ${aiInvert ? 'animate-spin-slow' : ''}`} />
                       {aiInvert ? 'Mode: Plat Hitam (Invert)' : 'Mode: Plat Putih (Normal)'}
                    </button>
                    
                    <button 
                        type="button"
                        disabled={isExpertAILoading}
                        onClick={async () => {
                          if (lastSnapshot) {
                            const res = await callExpertAI(lastSnapshot);
                            if (res) {
                              setOpenForm(prev => ({ ...prev, nopol: res }));
                              setOcrStatus(`Berhasil! (Manual AI): ${res}`);
                              alert(`AI Berhasil Mendeteksi: ${res}`);
                            } else {
                              alert("AI tidak dapat menemukan plat.");
                            }
                          }
                        }}
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center border transition-all ${isExpertAILoading ? 'bg-slate-800 text-slate-500 opacity-50' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-indigo-500/20 border-white/10'}`}
                    >
                        <Zap className={`w-3 h-3 mr-2 ${isExpertAILoading ? 'animate-pulse' : 'text-yellow-400'}`} />
                        {isExpertAILoading ? 'AI Expert Sedang Berpikir...' : 'Gunakan AI Pintar (Cloud)'}
                    </button>

                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setShowAIVision(!showAIVision)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center border border-white/5 transition-all shadow-md"
                        >
                            {showAIVision ? <EyeOff className="w-3 h-3 mr-2 text-red-400" /> : <Eye className="w-3 h-3 mr-2 text-emerald-400" />}
                            {showAIVision ? 'Asli' : 'Filter AI'}
                        </button>
                        <input 
                          type="password"
                          placeholder="HF Token..."
                          value={hfToken}
                          onChange={(e) => setHfToken(e.target.value)}
                          className="w-1/3 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[8px] text-white focus:border-violet-500 outline-none transition-all"
                          title="Hugging Face API Token (Free)"
                        />
                      </div>
                      <a 
                        href="https://huggingface.co/settings/tokens" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[7px] text-violet-400 hover:text-violet-300 text-right pr-1"
                      >
                        Cara dpt Token Qwen (Hugging Face) →
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-300 font-bold">AI LOKAL (YOLO+OCR)</span>
                            <span className="text-[8px] text-emerald-500 font-medium">Dataset: INDONESIA PLAT (B, L, D...)</span>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                type="button"
                                onClick={installAIDependencies}
                                className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[8px] font-bold rounded-lg transition-colors"
                             >
                                INSTALL AI
                             </button>
                             <button 
                                type="button"
                                onClick={() => setUseLocalSmartAI(!useLocalSmartAI)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${useLocalSmartAI ? 'bg-emerald-500' : 'bg-slate-600'}`}
                             >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useLocalSmartAI ? 'right-1' : 'left-1'}`} />
                             </button>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden h-[285px] relative group cursor-crosshair">
                 {!lastSnapshot && <div className="text-slate-600 text-[10px] uppercase font-bold animate-pulse">Preview AI Kosong...</div>}
                 {lastSnapshot && !showAIVision && (
                   <img src={lastSnapshot} className="w-full h-full object-contain opacity-80" alt="Snapshot Raw" />
                 )}
                 {(lastProcessedSnapshot || lastInvertedSnapshot) && showAIVision && (
                   <div className="w-full h-full relative">
                     <img src={aiInvert ? lastInvertedSnapshot : lastProcessedSnapshot} className="w-full h-full object-contain" alt="Snapshot Processed" />
                     <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[8px] px-2 py-1 rounded-full font-black uppercase shadow-lg">AI Vision Active</div>
                   </div>
                 )}
                 {lastSnapshot && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white/40 text-[8px] px-2 py-1 rounded-full font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                       {showAIVision ? (aiInvert ? 'AI INVERTED VIEW' : 'AI FILTERED VIEW') : 'RAW CAMERA VIEW'}
                    </div>
                 )}
              </div>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 font-medium bg-slate-800/50 p-3 rounded-xl border border-white/5">
              <p>💡 <span className="text-slate-300 font-black">KALIBRASI:</span> Jika plate sulit terbaca, gunakan "AI Vision" untuk melihat apakah gambar terlalu gelap atau silau.</p>
            </div>
          </div>
        </div>
      )}

      {/* OCR CALIBRATION TIPS */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
        <div className="text-xs text-emerald-800 leading-relaxed">
          <p className="font-black uppercase tracking-widest mb-1">Tips Kalibrasi AI (OCR)</p>
          <ul className="list-disc list-inside space-y-0.5 opacity-80">
            <li>Pastikan plat nomor terlihat jelas dan tidak tertutup bayangan gelap.</li>
            <li>Sudut kamera sebaiknya tegak lurus (straight) terhadap plat.</li>
            <li>Bila salah baca (misal B jadi 8), cek <strong>Raw Output</strong> di log untuk penyesuaian posisi kamera.</li>
          </ul>
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
                  videoConstraints={{ 
                    facingMode: 'environment',
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                  }}
                  onUserMediaError={() => {
                    addLog('Camera Error: Gagal mengakses webcam.');
                    setOcrStatus('Error: Webcam tidak dapat diakses.');
                  }}
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
              {cameraType === 'ip' && (
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
              )}
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

      {/* PRINT TICKET MODAL / OVERLAY */}
      {lastClosedTicket && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-t-8 border-emerald-500 print:shadow-none print:border-0 print:rounded-none">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start print:hidden">
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  TIKET BERHASIL DITUTUP
                </div>
                <button 
                  onClick={() => setLastClosedTicket(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <RefreshCw className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black text-slate-800">BUKTI TIMBANGAN</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">PT. BUMI MAS GROUP</p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm py-6 border-y border-slate-100 font-medium">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-black uppercase">NOMOR TIKET</span>
                    <span className="text-slate-700 font-bold">#{lastClosedTicket.id.substring(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-black uppercase">PLAT NOMOR</span>
                    <span className="text-slate-700 font-bold text-lg">{lastClosedTicket.nopol}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-black uppercase">SUPPLIER</span>
                    <span className="text-slate-700 font-bold">{lastClosedTicket.supplierName}</span>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-black uppercase">WAKTU MASUK</span>
                    <span className="text-slate-700 font-bold">{lastClosedTicket.dateIn} {lastClosedTicket.timeIn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-black uppercase">WAKTU KELUAR</span>
                    <span className="text-slate-700 font-bold">{lastClosedTicket.dateOut} {lastClosedTicket.timeOut}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-3 font-mono">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-xs font-bold uppercase">BERAT KOTOR (GROSS)</span>
                  <span className="text-lg font-black">{lastClosedTicket.grossWeight.toLocaleString('id-ID')} KG</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-xs font-bold uppercase">BERAT KOSONG (TARE)</span>
                  <span className="text-lg font-black">{lastClosedTicket.tareWeight.toLocaleString('id-ID')} KG</span>
                </div>
                <div className="pt-3 border-t-2 border-dashed border-slate-200 flex justify-between items-center text-emerald-600">
                  <span className="text-sm font-black uppercase">BERAT BERSIH (NETTO)</span>
                  <span className="text-3xl font-black">{lastClosedTicket.netWeight.toLocaleString('id-ID')} KG</span>
                </div>
              </div>

              <div className="flex gap-4 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl"
                >
                  <RefreshCw className="w-4 h-4" /> {/* Placeholder for Printer Icon if needed, or stick to text */}
                  <span>CETAK TIKET (PRINT)</span>
                </button>
                <button
                  onClick={() => setLastClosedTicket(null)}
                  className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-xl transition-all"
                >
                  TUTUP
                </button>
              </div>

              <div className="hidden print:block text-center pt-8 space-y-4">
                <div className="flex justify-between pt-12">
                   <div className="text-center">
                      <p className="text-xs font-bold mb-12">SUPPLIER</p>
                      <p className="text-xs border-t border-slate-400 pt-1 w-32 mx-auto">( .................... )</p>
                   </div>
                   <div className="text-center">
                      <p className="text-xs font-bold mb-12">OPERATOR</p>
                      <p className="text-xs border-t border-slate-400 pt-1 w-32 mx-auto">( .................... )</p>
                   </div>
                </div>
                <p className="text-[8px] text-slate-400 pt-4">Dicetak secara otomatis oleh Sistem Timbangan Bumi Mas</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
