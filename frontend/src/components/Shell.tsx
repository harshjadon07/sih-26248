import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Map, Radio, Shield, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserInfo {
  username: string;
  role_id: number;
  role_name?: string;
}

export function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:8000/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.detail) {
          // Map role_id to name for display
          const roleMap: Record<number, string> = { 1: 'Instructor', 2: 'Team Leader', 3: 'Team Member' };
          setUser({ ...data, role_name: roleMap[data.role_id] || `Role ${data.role_id}` });
        }
      })
      .catch(() => {});
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItemClass = (path: string) =>
    `flex items-center gap-3 w-full px-3 py-2.5 text-left rounded-lg transition-all text-sm font-medium ${
      isActive(path)
        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
        : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200 border border-transparent'
    }`;

  const isInstructor = user?.role_id === 1;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield className="text-cyan-500" size={22} />
            <h1 className="text-lg font-bold text-cyan-400 tracking-wider">COMMAND-X</h1>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Training Platform</p>
        </div>

        {/* User info */}
        {user && (
          <div className="px-5 py-3 border-b border-gray-800">
            <p className="text-sm font-medium text-gray-200">{user.username}</p>
            <span className={`inline-block mt-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
              isInstructor ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {user.role_name}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold px-3 pt-2 pb-1">General</p>
          <button onClick={() => navigate('/dashboard')} className={navItemClass('/dashboard')}>
            <LayoutDashboard size={16} /> Dashboard
          </button>

          {isInstructor && (
            <>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold px-3 pt-4 pb-1">Instructor</p>
              <button onClick={() => navigate('/scenarios')} className={navItemClass('/scenarios')}>
                <Map size={16} /> Scenarios
              </button>
              <button onClick={() => navigate('/instructor-room')} className={navItemClass('/instructor-room')}>
                <Activity size={16} /> Control Room
              </button>
            </>
          )}

          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold px-3 pt-4 pb-1">Exercise</p>
          <button onClick={() => navigate('/exercises')} className={navItemClass('/exercises')}>
            <Radio size={16} /> Active Exercises
          </button>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-left rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
