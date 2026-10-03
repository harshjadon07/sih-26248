import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Radio, Clock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

interface Message {
  type: string;
  sender?: string;
  content?: string;
  sim_time?: number;
  message?: string;
  event_id?: number;
}

export function Workspace() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [rationale, setRationale] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !exerciseId) return;

    const connect = () => {
      setStatus('connecting');
      ws.current = new WebSocket(`ws://localhost:8000/ws/exercise/${exerciseId}?token=${token}`);

      ws.current.onopen = () => setStatus('connected');
      ws.current.onclose = () => {
        setStatus('disconnected');
        setTimeout(connect, 3000);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      };
    };

    connect();
    return () => { ws.current?.close(); };
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
    setDecisionSubmitted(true);
    setTimeout(() => setDecisionSubmitted(false), 3000);
    setRationale('');
  };

  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500',
  };

  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="text-cyan-400" size={14} /> Exercise #{exerciseId}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <span className="text-xs text-gray-400">{statusLabels[status]}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className="flex flex-col flex-1 border-r border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Communications</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-sm py-8">
                <Clock className="mx-auto mb-2 text-gray-700" size={24} />
                Waiting for messages...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`rounded-lg p-3 text-sm ${
                m.type === 'system' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                m.type === 'chat' ? 'bg-gray-800 border border-gray-700' :
                'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}>
                {m.type === 'chat' && (
                  <>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-cyan-400">{m.sender}</span>
                      <span className="text-gray-500">{m.sim_time !== undefined ? `T+${(m.sim_time / 1000).toFixed(1)}s` : ''}</span>
                    </div>
                    <p className="text-gray-200">{m.content}</p>
                  </>
                )}
                {m.type === 'system' && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} />
                    <span className="text-xs">{m.message}</span>
                  </div>
                )}
                {m.type === 'decision_submitted' && (
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle size={12} />
                    Decision recorded
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 flex gap-2 bg-gray-900/50">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={status !== 'connected'}
            />
            <button
              type="submit"
              disabled={status !== 'connected'}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Decision Panel */}
        <div className="w-80 bg-gray-900 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Decision Report</h2>
          </div>

          <form onSubmit={submitDecision} className="flex-1 p-4 flex flex-col gap-4">
            {decisionSubmitted && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 flex items-center gap-2">
                <CheckCircle size={14} /> Decision submitted successfully
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Situation Assessment & Rationale</label>
              <textarea
                value={rationale}
                onChange={e => setRationale(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 h-40 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Describe the current situation and your reasoning..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-gray-400 font-medium">Confidence Level</label>
                <span className={`text-sm font-bold ${
                  confidence >= 75 ? 'text-green-400' : confidence >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{confidence}%</span>
              </div>
              <input
                type="range"
                min="0" max="100"
                value={confidence}
                onChange={e => setConfidence(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>Low</span><span>Moderate</span><span>High</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={status !== 'connected'}
              className="mt-auto bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-bold text-sm transition-colors"
            >
              Submit Decision
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
