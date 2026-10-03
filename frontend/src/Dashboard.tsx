import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  role_id: number;
}

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('http://localhost:8000/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.detail) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setUser(data);
        }
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="bg-gray-800 p-6 rounded-lg shadow">
        <p className="mb-2">Welcome, <span className="font-bold text-cyan-400">{user.username}</span>.</p>
        <p className="text-gray-400">Role ID: {user.role_id}</p>
      </div>
    </div>
  );
}
