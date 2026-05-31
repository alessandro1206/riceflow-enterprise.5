const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let cameraCredentials = { user: 'admin', pass: 'Admin123' };
let ffmpegProcess = null;
let mjpegServer = null;
let scalePort = null;
const MJPEG_PORT = 9876;

// Helper to send logs to renderer
function sendLog(msg) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('diagnostic-log', msg);
    }
    console.log(`[MAIN] ${msg}`);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "BUMI MAS GROUP - Weighbridge System",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });

    // Receive credentials from the renderer via IPC
    ipcMain.on('set-camera-auth', (event, creds) => {
        console.log('[MAIN] Updating camera credentials via IPC:', creds.user);
        cameraCredentials = creds;
    });

    // =========================================================================
    // DAHUA CAMERA - Digest Auth Helpers (Improved)
    // =========================================================================
    const parseDigestChallenge = (header) => {
        const result = {};
        const digestString = header.replace(/^Digest\s+/i, '');
        
        // Improved regex to handle parts better (handling both quoted and unquoted values)
        const regex = /([a-z]+)=("[^"]*"|[^,]*)/gi;
        let match;
        while ((match = regex.exec(digestString)) !== null) {
            let key = match[1].toLowerCase();
            let value = match[2].replace(/^"|"$/g, '');
            result[key] = value;
        }
        return result;
    };

    const generateDigestAuthHeader = (method, uri, challenge, user, pass) => {
        const ha1 = crypto.createHash('md5').update(`${user}:${challenge.realm}:${pass}`).digest('hex');
        const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex');
        
        const cnonce = crypto.randomBytes(8).toString('hex');
        const nc = '00000001';
        let response = '';
        let authHeader = `Digest username="${user}", realm="${challenge.realm}", nonce="${challenge.nonce}", uri="${uri}"`;

        if (challenge.qop) {
            const qopList = challenge.qop.split(',').map(q => q.trim().replace(/^"|"$/g, ''));
            if (qopList.includes('auth')) {
                // IMPORTANT: qop and nc should NOT be quoted according to RFC 2617
                response = crypto.createHash('md5').update(`${ha1}:${challenge.nonce}:${nc}:${cnonce}:auth:${ha2}`).digest('hex');
                authHeader += `, qop=auth, nc=${nc}, cnonce="${cnonce}"`;
            } else {
                response = crypto.createHash('md5').update(`${ha1}:${challenge.nonce}:${ha2}`).digest('hex');
            }
        } else {
            response = crypto.createHash('md5').update(`${ha1}:${challenge.nonce}:${ha2}`).digest('hex');
        }

        authHeader += `, response="${response}"`;
        if (challenge.opaque) authHeader += `, opaque="${challenge.opaque}"`;
        if (challenge.algorithm) authHeader += `, algorithm="${challenge.algorithm}"`;

        return authHeader;
    };

    // =========================================================================
    // DAHUA CAMERA - Snapshot via Digest Auth (IPC)
    // =========================================================================
    ipcMain.handle('get-snapshot', async (event, ip, port = 80) => {
        const httpPort = parseInt(port) || 80;
        sendLog(`Mulai ambil snapshot dari ${ip}:${httpPort}...`);
        
        return new Promise((resolve, reject) => {
            const snapshotPath = '/cgi-bin/snapshot.cgi?channel=1';
            const options = {
                host: ip,
                port: httpPort,
                path: snapshotPath,
                method: 'GET',
                timeout: 10000
            };

            const makeRequest = (authHeader = null, isRetry = false) => {
                const reqOptions = { ...options };
                if (authHeader) reqOptions.headers = { 'Authorization': authHeader };
                
                console.log(`[MAIN] snapshot req -> http://${ip}:${httpPort}${snapshotPath} (Auth: ${authHeader ? 'YES' : 'NO'})`);
                
                const req = http.request(reqOptions, (res) => {
                    console.log(`[MAIN] snapshot res -> Status: ${res.statusCode}`);
                    
                    if (res.statusCode === 401) {
                        if (isRetry) {
                            sendLog('Error: Autentikasi tetap gagal setelah retry (401).');
                            reject(new Error('Gagal Login (401). Periksa username/password.'));
                            return;
                        }

                        const challengeHeader = res.headers['www-authenticate'] || res.headers['WWW-Authenticate'];
                        if (!challengeHeader) {
                            sendLog('Warning: 401 tanpa WWW-Authenticate. Mencoba Basic Auth...');
                            const basic = 'Basic ' + Buffer.from(`${cameraCredentials.user}:${cameraCredentials.pass}`).toString('base64');
                            makeRequest(basic, true);
                            return;
                        }
                        
                        sendLog(`Challenge diterima (${challengeHeader.substring(0, 15)}...). Menghitung response...`);
                        
                        if (challengeHeader.toLowerCase().startsWith('digest')) {
                            const challenge = parseDigestChallenge(challengeHeader);
                            const newAuthHeader = generateDigestAuthHeader('GET', snapshotPath, challenge, cameraCredentials.user, cameraCredentials.pass);
                            sendLog(`Mencoba ulang dengan Digest Auth...`);
                            makeRequest(newAuthHeader, true);
                        } else if (challengeHeader.toLowerCase().startsWith('basic')) {
                            sendLog(`Mencoba ulang dengan Basic Auth...`);
                            const basic = 'Basic ' + Buffer.from(`${cameraCredentials.user}:${cameraCredentials.pass}`).toString('base64');
                            makeRequest(basic, true);
                        } else {
                            reject(new Error(`Metode Auth tidak didukung: ${challengeHeader}`));
                        }
                        return;
                    }
                    
                    if (res.statusCode !== 200) {
                        sendLog(`Error Kamera: HTTP ${res.statusCode}`);
                        reject(new Error(`Kamera mengembalikan error HTTP ${res.statusCode}`));
                        return;
                    }

                    const data = [];
                    res.on('data', (chunk) => data.push(chunk));
                    res.on('end', () => {
                        const buffer = Buffer.concat(data);
                        console.log(`[MAIN] snapshot -> Success, data length: ${buffer.length}`);
                        sendLog(`Snapshot Berhasil! (${(buffer.length / 1024).toFixed(1)} KB)`);
                        resolve(`data:image/jpeg;base64,${buffer.toString('base64')}`);
                    });
                });

                req.on('error', (err) => {
                    console.log(`[MAIN] snapshot -> Network Error: ${err.message}`);
                    let friendlyMsg = `Koneksi Gagal: ${err.message}`;
                    if (err.message.includes('ECONNREFUSED')) friendlyMsg = `Koneksi Ditolak (IP/Port salah?)`;
                    else if (err.message.includes('ETIMEDOUT')) friendlyMsg = `Waktu tunggu habis (Timeout)`;
                    
                    sendLog(`Network Error: ${friendlyMsg}`);
                    reject(new Error(friendlyMsg));
                });
                
                req.on('timeout', () => {
                    req.destroy();
                    sendLog('Error: Timeout saat mengambil snapshot.');
                    reject(new Error('Waktu tunggu habis (Timeout)'));
                });
                
                req.end();
            };

            makeRequest();
        });
    });

    // =========================================================================
    // DAHUA CAMERA - RTSP Live Feed via ffmpeg → MJPEG local server
    // =========================================================================
    ipcMain.handle('start-live-feed', async (event, ip) => {
        console.log(`[MAIN] Starting RTSP live feed for: ${ip}`);
        stopLiveFeed(); // Stop any existing feed

        return new Promise((resolve) => {
            const rtspUrl = `rtsp://${cameraCredentials.user}:${cameraCredentials.pass}@${ip}:554/cam/realmonitor?channel=1&subtype=1`;
            
            // Store MJPEG data for connected clients
            let mjpegClients = [];
            
            // Start MJPEG HTTP server
            mjpegServer = http.createServer((req, res) => {
                res.writeHead(200, {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
                    'Pragma': 'no-cache',
                    'Connection': 'close',
                    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
                    'Access-Control-Allow-Origin': '*'
                });
                mjpegClients.push(res);
                req.on('close', () => {
                    mjpegClients = mjpegClients.filter(c => c !== res);
                });
            });

            mjpegServer.listen(MJPEG_PORT, '127.0.0.1', () => {
                console.log(`[MAIN] MJPEG server running on http://127.0.0.1:${MJPEG_PORT}`);
            });

            // Spawn ffmpeg to convert RTSP to MJPEG frames
            try {
                ffmpegProcess = spawn('ffmpeg', [
                    '-rtsp_transport', 'tcp',
                    '-i', rtspUrl,
                    '-f', 'mjpeg',
                    '-q:v', '5',           // Quality (lower = better, 2-8 recommended)
                    '-r', '10',            // 10 fps for efficiency
                    '-s', '640x480',       // Scale down for performance
                    '-an',                 // No audio
                    'pipe:1'               // Output to stdout
                ], { stdio: ['ignore', 'pipe', 'pipe'] });

                // Parse MJPEG frames from ffmpeg stdout
                let buffer = Buffer.alloc(0);
                const JPEG_START = Buffer.from([0xFF, 0xD8]);
                const JPEG_END = Buffer.from([0xFF, 0xD9]);

                ffmpegProcess.stdout.on('data', (chunk) => {
                    buffer = Buffer.concat([buffer, chunk]);
                    
                    let startIdx = 0;
                    while (true) {
                        const start = buffer.indexOf(JPEG_START, startIdx);
                        if (start === -1) break;
                        const end = buffer.indexOf(JPEG_END, start + 2);
                        if (end === -1) break;
                        
                        const frame = buffer.slice(start, end + 2);
                        
                        // Send frame to all connected MJPEG clients
                        mjpegClients.forEach(client => {
                            try {
                                client.write(`--myboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
                                client.write(frame);
                                client.write('\r\n');
                            } catch (e) { /* client disconnected */ }
                        });

                        // Also send latest frame as base64 to renderer for snapshot
                        if (mainWindow) {
                            mainWindow.webContents.send('live-frame', `data:image/jpeg;base64,${frame.toString('base64')}`);
                        }

                        startIdx = end + 2;
                    }
                    // Keep only unprocessed data
                    if (startIdx > 0) {
                        buffer = buffer.slice(startIdx);
                    }
                    // Prevent memory buildup
                    if (buffer.length > 5 * 1024 * 1024) {
                        buffer = Buffer.alloc(0);
                    }
                });

                ffmpegProcess.stderr.on('data', (data) => {
                    const msg = data.toString();
                    if (msg.includes('Error') || msg.includes('error')) {
                        console.log('[FFMPEG ERROR]', msg.trim());
                    }
                });

                ffmpegProcess.on('close', (code) => {
                    console.log(`[MAIN] ffmpeg exited with code ${code}`);
                    if (mainWindow) {
                        mainWindow.webContents.send('live-feed-stopped');
                    }
                });

                ffmpegProcess.on('error', (err) => {
                    console.log('[MAIN] ffmpeg spawn error:', err.message);
                    if (mainWindow) {
                        mainWindow.webContents.send('live-feed-error', 'ffmpeg tidak ditemukan. Pastikan ffmpeg sudah ter-install.');
                    }
                });

                resolve({ success: true, url: `http://127.0.0.1:${MJPEG_PORT}` });
            } catch (err) {
                console.log('[MAIN] Failed to start ffmpeg:', err.message);
                resolve({ success: false, error: err.message });
            }
        });
    });

    ipcMain.handle('stop-live-feed', async () => {
        stopLiveFeed();
        return { success: true };
    });

    function stopLiveFeed() {
        if (ffmpegProcess) {
            try { ffmpegProcess.kill('SIGTERM'); } catch (e) {}
            ffmpegProcess = null;
        }
        if (mjpegServer) {
            try { mjpegServer.close(); } catch (e) {}
            mjpegServer = null;
        }
    }

    // AUTO-AUTHENTICATE camera requests (Digest/Basic Auth)
    mainWindow.webContents.on('login', (event, details, authInfo, callback) => {
        event.preventDefault();
        console.log(`[MAIN] Auth Challenge from: ${authInfo.host} (${authInfo.scheme})`);
        callback(cameraCredentials.user, cameraCredentials.pass);
    });

    // Tell the renderer it is running inside Electron
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            window.__ELECTRON__ = true;
            window.dispatchEvent(new Event('electron-ready'));
        `);
    });

    const indexPath = path.join(__dirname, 'web', 'index.html');
    mainWindow.loadFile(indexPath);

    // =========================================================================
    // CAS 200i SCALE READER - Improved with error reporting
    // =========================================================================
    function initScalePort() {
        if (scalePort && scalePort.isOpen) {
            scalePort.close();
        }

        const PORT_NAME = 'COM4';
        console.log(`[SCALE] Attempting to connect to ${PORT_NAME}...`);

        try {
            scalePort = new SerialPort({ 
                path: PORT_NAME, 
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                autoOpen: false 
            });

            const parser = scalePort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

            scalePort.open((err) => {
                if (err) {
                    console.log(`[SCALE] Failed to open ${PORT_NAME}:`, err.message);
                    SerialPort.list().then(ports => {
                        const portList = ports.map(p => p.path).join(', ');
                        if (mainWindow) {
                            mainWindow.webContents.send('scale-status', { 
                                connected: false, 
                                error: `Gagal membuka ${PORT_NAME}: ${err.message}. Port tersedia: ${portList || 'None'}`
                            });
                        }
                    });
                    return;
                }
                
                console.log(`[SCALE] CAS 200i connected on ${PORT_NAME} @ 9600 baud`);
                if (mainWindow) {
                    mainWindow.webContents.send('scale-status', { connected: true, port: PORT_NAME });
                }
            });

            parser.on('data', (rawData) => {
                const trimmed = rawData.trim();
                const match = trimmed.match(/([+-]?\d+\.?\d*)/);
                if (match) {
                    const weight = parseFloat(match[1]);
                    if (!isNaN(weight) && mainWindow) {
                        const isStable = trimmed.includes('ST') || !trimmed.includes('US');
                        mainWindow.webContents.send('scale-data', { 
                            weight: weight, 
                            raw: trimmed,
                            stable: isStable,
                            unit: 'KG'
                        });
                    }
                }
            });

            scalePort.on('error', (err) => {
                console.log('[SCALE] Error event:', err.message);
                if (mainWindow) {
                    mainWindow.webContents.send('scale-status', { connected: false, error: err.message });
                }
            });

            scalePort.on('close', () => {
                console.log('[SCALE] Port closed');
                if (mainWindow) {
                    mainWindow.webContents.send('scale-status', { connected: false });
                }
            });

        } catch (err) {
            console.log('[SCALE] Initialization Error:', err.message);
            if (mainWindow) {
                mainWindow.webContents.send('scale-status', { connected: false, error: err.message });
            }
        }
    }

    setTimeout(() => initScalePort(), 2000);

    ipcMain.on('retry-scale', () => {
        console.log('[MAIN] Manual scale retry requested');
        initScalePort();
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    stopLiveFeed();
    if (scalePort && scalePort.isOpen) {
        scalePort.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function stopLiveFeed() {
    if (ffmpegProcess) {
        try { ffmpegProcess.kill('SIGTERM'); } catch (e) {}
        ffmpegProcess = null;
    }
    if (mjpegServer) {
        try { mjpegServer.close(); } catch (e) {}
        mjpegServer = null;
    }
}
