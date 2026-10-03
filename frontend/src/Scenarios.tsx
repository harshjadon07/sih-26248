import { useEffect, useState } from 'react';

interface Scenario {
  id: number;
  name: string;
  description: string;
  is_template: boolean;
  configuration: string;
}

export function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState('{"communication_disruptions": {"dropout_rate": 0.1, "delay_ms": 500}}');

  const fetchScenarios = () => {
    fetch('http://localhost:8000/scenarios/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setScenarios(data);
      });
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:8000/scenarios/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name, description, is_template: false, configuration: config })
    });
    setName('');
    setDescription('');
    fetchScenarios();
  };

  const handleInstantiate = async (scenarioId: number) => {
    const res = await fetch(`http://localhost:8000/exercises/${scenarioId}?seed=42`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Exercise instantiated! Exercise ID: ${data.id}\nShare this ID with trainees.`);
      // Auto-start it
      await fetch(`http://localhost:8000/exercises/${data.id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`Exercise ${data.id} has been started!`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Scenario Management</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded shadow">
          <h3 className="text-lg font-bold mb-3 text-cyan-400">Create New Scenario</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
              required 
            />
            <textarea 
              placeholder="Description" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
            <textarea 
              placeholder="Configuration JSON" 
              value={config} 
              onChange={e => setConfig(e.target.value)}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white font-mono h-32"
              required 
            />
            <button type="submit" className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold text-white transition-colors">
              Save Scenario
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-4 rounded shadow">
          <h3 className="text-lg font-bold mb-3 text-cyan-400">Existing Scenarios</h3>
          {scenarios.length === 0 ? <p className="text-gray-400">No scenarios found.</p> : (
            <ul className="space-y-3">
              {scenarios.map(s => (
                <li key={s.id} className="p-3 bg-gray-900 rounded border border-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold">{s.name}</div>
                    <button onClick={() => handleInstantiate(s.id)} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 text-xs rounded font-bold">
                      Start Exercise
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">{s.description}</div>
                  <pre className="text-xs text-gray-500 bg-black p-2 rounded overflow-x-auto">{s.configuration}</pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
