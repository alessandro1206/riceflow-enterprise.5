import React, { useState } from 'react';
import { Lock, User, Wheat, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: { name: string; role: string }) => void;
  userList?: { username: string; password: string; name: string; role: string }[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, userList = [] }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hardcoded fallback users in case userList prop is empty
  const fallbackUsers = [
    { username: 'admin', password: 'admin123', name: 'Admin', role: 'Admin' },
    { username: 'erfi', password: 'operator123', name: 'Erfi', role: 'Operator' },
    { username: 'emak', password: 'finance123', name: 'Emak', role: 'Finance' }
  ];

  const localAuth = (uname: string, pass: string): { name: string; role: string } | null => {
    const allUsers = userList.length > 0 ? userList : fallbackUsers;
    const user = allUsers.find(u => u.username === uname && u.password === pass);
    return user ? { name: user.name, role: user.role } : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Step 1: Try cloud login
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('https://sabrent.pythonanywhere.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
        return;
      }

      // Cloud responded but rejected credentials — still try local as fallback
      // (the cloud might not have the user registered)
    } catch (err) {
      // Cloud unreachable — continue to local fallback
      console.log('Cloud login unavailable, falling back to local auth.');
    }

    // Step 2: Automatic local fallback
    const localUser = localAuth(username, password);
    if (localUser) {
      onLogin(localUser);
      return;
    }

    // Both cloud and local failed
    setError('Username atau password salah. Silakan coba lagi.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#064E3B]">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[150px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="glass p-10 rounded-[40px] border border-white/20 shadow-2xl backdrop-blur-3xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 border border-emerald-400/30">
              <Wheat className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight text-center">
              RiceFlow <span className="text-amber-400">Enterprise</span>
            </h1>
            <p className="text-emerald-100/60 text-sm mt-2 font-medium">Bumi Mas Group Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <User className="absolute left-4 top-4 w-5 h-5 text-emerald-300/50 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="text"
                placeholder="Username"
                className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder-emerald-100/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-4 w-5 h-5 text-emerald-300/50 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder-emerald-100/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center text-red-100 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center group shadow-xl shadow-amber-900/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-emerald-950/20 border-t-emerald-950 rounded-full animate-spin"></div>
              ) : (
                <>
                  MASUK
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-emerald-100/40 font-bold uppercase tracking-widest">
              Secured by RiceFlow Cloud Infrastructure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
