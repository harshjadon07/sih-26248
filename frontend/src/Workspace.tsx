import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

interface Message {
  sender: string;
  content: string;
  sim_time: number;
}

export function Workspace() {
  const { exerciseId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [rationale, setRationale] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [status, setStatus] = useState('Disconnected');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !exerciseId) return;

    const connect = () => {
      setStatus('Connecting...');
      ws.current = new WebSocket(`ws://localhost:8000/ws/exercise/${exerciseId}?token=${token}`);
      
      ws.current.onopen = () => setStatus('Connected');
      ws.current.onclose = () => {
        setStatus('Disconnected. Reconnecting in 3s...');
        setTimeout(connect, 3000);
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setMessages(prev => [...prev, data]);
        }
      };
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, [exerciseId]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'chat', content: input }));
    setInput('');
  };

  const submitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'decision', rationale, confidence }));
    setRationale('');
    alert("Decision submitted");
  };

  return (
    <div className="flex h-full p-4 gap-4">
      {/* Comms Panel */}
      <div className="flex flex-col w-1/2 bg-gray-800 rounded shadow">
        <div className="p-3 border-b border-gray-700 font-bold flex justify-between">
          <span>Comms Panel</span>
          <span className={`text-sm ${status === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>{status}</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, i) => (
            <div key={i} className="bg-gray-700 p-2 rounded">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{m.sender}</span>
                <span>T+{m.sim_time}ms</span>
              </div>
              <div className="text-white">{m.content}</div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="p-3 border-t border-gray-700 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type message..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded p-2 text-white"
          />
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded">Send</button>
        </form>
      </div>

      {/* Decision Panel */}
      <div className="flex flex-col w-1/2 gap-4">
        <div className="bg-gray-800 rounded p-4 shadow">
          <h3 className="font-bold mb-3 border-b border-gray-700 pb-2">Submit Decision</h3>
          <form onSubmit={submitDecision} className="flex flex-col gap-3">
            <label className="text-sm text-gray-400">Rationale / Situation Report</label>
            <textarea 
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              className="bg-gray-900 border border-gray-600 rounded p-2 text-white h-32"
              required
            />
            <label className="text-sm text-gray-400">Confidence Level: {confidence}%</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={confidence}
              onChange={e => setConfidence(parseInt(e.target.value))}
            />
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white p-2 rounded font-bold">
              Confirm Decision
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
