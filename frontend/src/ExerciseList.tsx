import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Clock, Play, Pause, ChevronRight } from 'lucide-react';

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

export function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchData = () => {
    if (!token) return;
    Promise.all([
      fetch('http://localhost:8000/exercises/', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://localhost:8000/scenarios/', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
    ]).then(([exData, scData]) => {
      if (Array.isArray(exData)) setExercises(exData);
      if (Array.isArray(scData)) setScenarios(scData);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const getScenarioName = (scenarioId: number) => {
    const s = scenarios.find(sc => sc.id === scenarioId);
    return s ? s.name : `Scenario #${scenarioId}`;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      paused: 'bg-yellow-500/20 text-yellow-400',
      planned: 'bg-blue-500/20 text-blue-400',
      ended: 'bg-gray-500/20 text-gray-400',
    };
    return (
      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${colors[status] || colors.ended}`}>
        {status}
      </span>
    );
  };

  const statusIcon = (status: string) => {
    if (status === 'active') return <Play className="text-green-400" size={14} />;
    if (status === 'paused') return <Pause className="text-yellow-400" size={14} />;
    return <Clock className="text-gray-500" size={14} />;
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-500">Loading exercises...</div></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Radio className="text-cyan-400" size={20} /> All Exercises</h1>
      </div>

      {exercises.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Radio className="text-gray-700 mx-auto mb-3" size={40} />
          <p className="text-gray-400">No exercises have been created yet.</p>
          <p className="text-gray-600 text-sm mt-1">Ask your instructor to start one, or go to Scenarios if you are an instructor.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map(ex => (
            <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${ex.status === 'active' ? 'bg-green-500/10' : 'bg-gray-800'}`}>
                  {statusIcon(ex.status)}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{getScenarioName(ex.scenario_id)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Exercise #{ex.id} · {ex.started_at ? `Started ${new Date(ex.started_at).toLocaleString()}` : 'Not started'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(ex.status)}
                {ex.status === 'active' && (
                  <button
                    onClick={() => navigate(`/workspace/${ex.id}`)}
                    className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    Join <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
