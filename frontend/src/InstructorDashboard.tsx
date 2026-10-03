import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Download, FileText, Play, Pause, StopCircle, Zap, Radio, Clock } from 'lucide-react';

interface Event {
  id: number;
  event_type: string;
  actual_time: number | null;
  scheduled_time: number | null;
  payload: string;
  generation_time: string | null;
  delivery_time: string | null;
}

interface Exercise {
  id: number;
  scenario_id: number;
  status: string;
  started_at: string | null;
  accumulated_sim_time: number;
}

export function InstructorDashboard() {
  const [searchParams] = useSearchParams();
  const [exerciseId, setExerciseId] = useState(searchParams.get('exercise') || '');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');
  const [triggerResult, setTriggerResult] = useState('');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:8000/exercises/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setExercises(data); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const eid = searchParams.get('exercise');
    if (eid) {
      setExerciseId(eid);
      loadAAR(eid);
    }
  }, [searchParams]);

  const loadAAR = async (eid?: string) => {
    const id = eid || exerciseId;
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/exercises/${id}/aar`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      } else {
        setError('Exercise not found or access denied');
        setEvents([]);
      }
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  const controlExercise = async (action: string) => {
    if (!exerciseId) return;
    try {
      await fetch(`http://localhost:8000/exercises/${exerciseId}/${action}`, { method: 'POST', headers });
      // Refresh exercises list
      const res = await fetch('http://localhost:8000/exercises/', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setExercises(data);
    } catch { /* ignore */ }
  };

  const triggerEvent = async () => {
    if (!exerciseId || !triggerMsg.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/exercises/${exerciseId}/trigger_event`, {
        method: 'POST', headers,
        body: JSON.stringify({ message: triggerMsg })
      });
      const data = await res.json();
      setTriggerResult(data.dropped ? `⛔ Message DROPPED by disruption engine` : `✓ Delivered (delay: ${data.delay_ms}ms)`);
      setTriggerMsg('');
      loadAAR();
    } catch {
      setTriggerResult('Error sending event');
    }
  };

  const handleDownload = (format: 'csv' | 'pdf') => {
    if (!exerciseId) return;
    const url = `http://localhost:8000/exercises/${exerciseId}/export/${format}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `exercise_${exerciseId}_aar.${format}`;
        a.click();
      });
  };

  const currentExercise = exercises.find(e => e.id === parseInt(exerciseId));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Activity className="text-amber-400" size={20} /> Instructor Control Room
      </h1>

      {/* Exercise Selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">Select Exercise</p>
        <div className="flex gap-2 flex-wrap">
          {exercises.length === 0 ? (
            <p className="text-gray-500 text-sm">No exercises available. Create one from Scenarios.</p>
          ) : (
            exercises.map(ex => (
              <button key={ex.id} onClick={() => { setExerciseId(String(ex.id)); loadAAR(String(ex.id)); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  exerciseId === String(ex.id)
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}>
                <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ex.status === 'active' ? 'bg-green-500' : ex.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                  Exercise #{ex.id}
                  <span className="text-[10px] uppercase opacity-60">{ex.status}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {exerciseId && (
        <div className="grid grid-cols-3 gap-5">
          {/* Controls */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exercise Controls</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => controlExercise('start')} className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                <Play size={12} /> Start
              </button>
              <button onClick={() => controlExercise('pause')} className="flex items-center justify-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                <Pause size={12} /> Pause
              </button>
              <button onClick={() => controlExercise('resume')} className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                <Play size={12} /> Resume
              </button>
              <button disabled className="flex items-center justify-center gap-1.5 bg-gray-700 text-gray-400 py-2 rounded-lg text-xs font-bold cursor-not-allowed">
                <StopCircle size={12} /> End
              </button>
            </div>
            {currentExercise && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <div className="flex justify-between"><span>Status:</span><span className="text-white font-medium">{currentExercise.status}</span></div>
                <div className="flex justify-between"><span>Sim Time:</span><span className="text-white font-medium">{(currentExercise.accumulated_sim_time / 1000).toFixed(1)}s</span></div>
              </div>
            )}
          </div>

          {/* Inject Event */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Zap size={12} className="text-amber-400" /> Inject Event</h2>
            <input
              type="text"
              value={triggerMsg}
              onChange={e => setTriggerMsg(e.target.value)}
              placeholder="e.g. Radar contact lost in sector 7..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button onClick={triggerEvent} disabled={!triggerMsg.trim()} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-bold transition-colors">
              Send to Simulation Engine
            </button>
            {triggerResult && <p className="text-xs text-gray-400 bg-gray-800 rounded-lg p-2">{triggerResult}</p>}
          </div>

          {/* Export */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Export AAR Report</h2>
            <button onClick={() => loadAAR()} className="w-full flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">
              <Radio size={12} /> Load Event Log
            </button>
            <button onClick={() => handleDownload('csv')} disabled={!events.length} className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-bold transition-colors">
              <Download size={12} /> Export CSV
            </button>
            <button onClick={() => handleDownload('pdf')} disabled={!events.length} className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-bold transition-colors">
              <FileText size={12} /> Export PDF
            </button>
          </div>
        </div>
      )}

      {/* Event Timeline */}
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

      {exerciseId && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Clock size={12} /> Event Timeline</h2>
            <span className="text-xs text-gray-500">{events.length} events</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">No events recorded yet. Inject an event or wait for trainee activity.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/50">
                  <tr className="text-[10px] text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">ID</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Sim Time</th>
                    <th className="px-4 py-2.5">Delivery</th>
                    <th className="px-4 py-2.5">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {events.map(e => (
                    <tr key={e.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{e.id}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          e.event_type === 'chat' ? 'bg-blue-500/20 text-blue-400' :
                          e.event_type === 'instructor_trigger' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>{e.event_type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 text-xs font-mono">{e.actual_time != null ? `${(e.actual_time / 1000).toFixed(1)}s` : '—'}</td>
                      <td className="px-4 py-2.5 text-xs">
                        {e.delivery_time ? (
                          <span className="text-green-400">{new Date(e.delivery_time).toLocaleTimeString()}</span>
                        ) : (
                          <span className="text-red-400">Dropped / Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 font-mono text-xs max-w-xs truncate">{e.payload}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
