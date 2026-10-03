import { useState } from 'react';

interface Event {
  id: number;
  event_type: string;
  actual_time: number | null;
  payload: string;
  delivery_time: string | null;
}

export function InstructorDashboard() {
  const [exerciseId, setExerciseId] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState('');

  const loadAAR = async () => {
    try {
      const res = await fetch(`http://localhost:8000/exercises/${exerciseId}/aar`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setError('');
      } else {
        setError('Exercise not found or forbidden');
        setEvents([]);
      }
    } catch {
      setError('Connection error');
    }
  };

  const handleDownloadCSV = () => {
    window.open(`http://localhost:8000/exercises/${exerciseId}/export/csv?token=${localStorage.getItem('token')}`);
  };

  const handleDownloadPDF = () => {
    window.open(`http://localhost:8000/exercises/${exerciseId}/export/pdf?token=${localStorage.getItem('token')}`);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Instructor Control & AAR</h2>
      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          value={exerciseId} 
          onChange={e => setExerciseId(e.target.value)} 
          placeholder="Exercise ID" 
          className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
        <button onClick={loadAAR} className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded px-4">
          Load AAR
        </button>
        <button onClick={handleDownloadCSV} disabled={!events.length} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded px-4 disabled:opacity-50">
          Export CSV
        </button>
        <button onClick={handleDownloadPDF} disabled={!events.length} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded px-4 disabled:opacity-50">
          Export PDF
        </button>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      <div className="flex-1 bg-gray-800 rounded shadow p-4 overflow-y-auto">
        <h3 className="font-bold text-lg mb-3 border-b border-gray-700 pb-2">Event Timeline</h3>
        {events.length === 0 ? <p className="text-gray-400">No events loaded.</p> : (
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="py-2">ID</th>
                <th className="py-2">Type</th>
                <th className="py-2">Sim Time (ms)</th>
                <th className="py-2">Delivery Time</th>
                <th className="py-2">Payload</th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                  <td className="py-2">{e.id}</td>
                  <td className="py-2">{e.event_type}</td>
                  <td className="py-2">{e.actual_time ?? '-'}</td>
                  <td className="py-2">{e.delivery_time ? new Date(e.delivery_time).toLocaleTimeString() : 'Dropped/Pending'}</td>
                  <td className="py-2 font-mono text-xs">{e.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
