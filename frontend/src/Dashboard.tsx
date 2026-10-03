import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Map, Activity, Users, Clock, Shield } from 'lucide-react';

interface UserInfo {
  username: string;
  role_id: number;
}

interface Exercise {
  id: number;
  scenario_id: number;
  status: string;
  started_at: string | null;
  accumulated_sim_time: number;
}

interface Scenario {
  id: number;
  name: string;
}

export function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    // Fetch user
    fetch('http://localhost:8000/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.detail) { localStorage.removeItem('token'); navigate('/login'); } else setUser(data); })
      .catch(() => navigate('/login'));

    // Fetch exercises
    fetch('http://localhost:8000/exercises/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setExercises(data); })
      .catch(() => {});

    // Fetch scenarios (instructors)
    fetch('http://localhost:8000/scenarios/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setScenarios(data); })
      .catch(() => {});
  }, [navigate, token]);

  if (!user) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );

  const isInstructor = user.role_id === 1;
  const roleLabel = isInstructor ? 'Instructor' : user.role_id === 2 ? 'Team Leader' : 'Team Member';
  const activeExercises = exercises.filter(e => e.status === 'active');
  const totalExercises = exercises.length;

  const getScenarioName = (scenarioId: number) => {
    const s = scenarios.find(sc => sc.id === scenarioId);
    return s ? s.name : `Scenario #${scenarioId}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-cyan-900/40 to-gray-900 border border-cyan-800/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, <span className="text-cyan-400">{user.username}</span></h1>
            <p className="text-gray-400 mt-1">You are signed in as <span className={`font-semibold ${isInstructor ? 'text-amber-400' : 'text-blue-400'}`}>{roleLabel}</span></p>
          </div>
          <Shield className="text-cyan-500/30" size={48} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-green-500/10 p-3 rounded-lg"><Radio className="text-green-400" size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-white">{activeExercises.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active Exercises</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-lg"><Clock className="text-blue-400" size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-white">{totalExercises}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Exercises</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-purple-500/10 p-3 rounded-lg"><Map className="text-purple-400" size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-white">{scenarios.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Scenarios</p>
          </div>
        </div>
      </div>

      {/* Active Exercises — Quick Join */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-white flex items-center gap-2"><Activity size={16} className="text-cyan-400" /> Active Exercises</h2>
          {isInstructor && (
            <button onClick={() => navigate('/scenarios')} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
              + New Scenario
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-800">
          {activeExercises.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Radio className="text-gray-700 mx-auto mb-3" size={32} />
              <p className="text-gray-500 text-sm">No active exercises right now.</p>
              {isInstructor && <p className="text-gray-600 text-xs mt-1">Go to <button onClick={() => navigate('/scenarios')} className="text-cyan-400 underline">Scenarios</button> to create and start one.</p>}
            </div>
          ) : (
            activeExercises.map(ex => (
              <div key={ex.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500/20 p-2 rounded-lg"><Radio className="text-green-400" size={14} /></div>
                  <div>
                    <p className="font-medium text-white text-sm">{getScenarioName(ex.scenario_id)}</p>
                    <p className="text-xs text-gray-500">Exercise #{ex.id} · Started {ex.started_at ? new Date(ex.started_at).toLocaleTimeString() : '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold uppercase">Live</span>
                  <button
                    onClick={() => navigate(`/workspace/${ex.id}`)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    Join Exercise →
                  </button>
                  {isInstructor && (
                    <button
                      onClick={() => navigate(`/instructor-room?exercise=${ex.id}`)}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors"
                    >
                      Control →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {isInstructor && (
          <button onClick={() => navigate('/scenarios')} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-cyan-500/30 transition-colors group">
            <Map className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-bold text-white text-sm">Manage Scenarios</h3>
            <p className="text-xs text-gray-500 mt-1">Create, edit, and launch training scenarios</p>
          </button>
        )}
        <button onClick={() => navigate('/exercises')} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-cyan-500/30 transition-colors group">
          <Users className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={24} />
          <h3 className="font-bold text-white text-sm">Browse Exercises</h3>
          <p className="text-xs text-gray-500 mt-1">View all exercises and join active ones</p>
        </button>
        {isInstructor && (
          <button onClick={() => navigate('/instructor-room')} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-cyan-500/30 transition-colors group">
            <Activity className="text-amber-400 mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-bold text-white text-sm">Instructor Control Room</h3>
            <p className="text-xs text-gray-500 mt-1">Monitor exercises, review AAR, and export reports</p>
          </button>
        )}
      </div>
    </div>
  );
}
