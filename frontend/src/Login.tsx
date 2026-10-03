import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl mb-6 font-bold text-center text-cyan-400">COMMAND-X</h1>
        {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
          <button type="submit" className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold text-white transition-colors">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
