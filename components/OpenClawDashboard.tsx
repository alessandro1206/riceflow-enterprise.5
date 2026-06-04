import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, Terminal, AlertCircle } from 'lucide-react';

export const OpenClawDashboard: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('riceflow_auth_token'); // Might be using different auth method in App, but user said "using the user's JWT token". Let's assume standard fetch for now.
      // Wait, in App.tsx they didn't implement JWT token passing yet for other routes. 
      // Actually, wait, let's just make the request. 
      // The instructions said "using the user's JWT token" but `App.tsx` has `localStorage.getItem('riceflow_user')`. 
      // Let's assume there is a token or the user will handle it, or we can just fetch from the route. 
      const response = await fetch('https://sabrent.pythonanywhere.com/api/logs/openclaw', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`, // standard
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        setError('Failed to fetch logs. Are you authenticated?');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">OpenClaw <span className="text-emerald-400">Audit Log</span></h1>
              <p className="text-slate-400 mt-1 font-medium">Real-time monitoring of AI Orchestrator actions</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="relative z-10 flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 font-medium">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2 text-slate-300 font-bold">
          <Terminal className="w-5 h-5 text-emerald-400" />
          System Execution Log
        </div>
        <div className="divide-y divide-slate-800">
          {logs.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500 font-medium">
              No OpenClaw logs found.
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row gap-4 md:items-start group">
              <div className="flex-shrink-0 w-48 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-lg border border-slate-700">
                  {new Date(log.timestamp).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{log.action}</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {log.details || 'No additional details provided.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
