import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Unable to connect to the server');
    }
    setLoading(false);
  };

  const quickLogin = (user: string) => {
    setUsername(user);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-2xl mb-4">
            <Shield className="text-cyan-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">COMMAND-X</h1>
          <p className="text-sm text-gray-500 mt-1">Training Simulation Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-wait text-white py-2.5 rounded-lg font-bold text-sm transition-colors"
            >
              <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick Login Buttons */}
        <div className="mt-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 text-center">Demo Accounts</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => quickLogin('instructor1')} className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 py-2 rounded-lg text-xs font-bold transition-colors">
              Instructor
            </button>
            <button onClick={() => quickLogin('leader1')} className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 py-2 rounded-lg text-xs font-bold transition-colors">
              Leader
            </button>
            <button onClick={() => quickLogin('member1')} className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 py-2 rounded-lg text-xs font-bold transition-colors">
              Member
            </button>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-2">Click a role, then press Sign In</p>
        </div>
      </div>
    </div>
  );
}
