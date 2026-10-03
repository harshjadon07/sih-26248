import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, Home, Settings } from 'lucide-react';

export function Shell() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-cyan-500 tracking-wider">COMMAND-X</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-800 rounded transition-colors text-gray-300 hover:text-white">
            <Home size={18} /> Dashboard
          </button>
          <button onClick={() => navigate('/scenarios')} className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-800 rounded transition-colors text-gray-300 hover:text-white">
            <Settings size={18} /> Scenarios
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-800 rounded transition-colors text-red-400 hover:text-red-300">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
}
