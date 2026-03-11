import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';

interface UserManagementPanelProps {
  userList: any[];
  onAddUser: (user: any) => void;
  onRemoveUser: (username: string) => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  userList,
  onAddUser,
  onRemoveUser,
}) => {
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'Operator',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) return;
    onAddUser(newUser);
    setNewUser({ username: '', password: '', name: '', role: 'Operator' });
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
          Setelan <span className="text-emerald-600">Akses User</span>
        </h2>
        <p className="text-slate-500 font-medium">Manajemen kredensial dan hak akses sistem</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ADD USER FORM */}
        <div className="glass-panel p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <UserPlus className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Tambah Akun Baru</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. joko_widodo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nama Lengkap</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Joko Widodo"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Role / Jabatan</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                <option value="Operator">Operator</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Direktur">Direktur</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/20"
            >
              SIMPAN USER
            </button>
          </form>
        </div>

        {/* USER LIST */}
        <div className="glass-panel p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Daftar Pengguna Aktif</h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {userList.map((user) => (
              <div
                key={user.username}
                className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 leading-none mb-1">{user.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</span>
                  </div>
                </div>
                {user.username !== 'admin' && (
                  <button
                    onClick={() => onRemoveUser(user.username)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
