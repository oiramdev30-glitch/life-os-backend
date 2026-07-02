import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Activity, BrainCircuit, Dumbbell, Zap, CreditCard, LayoutDashboard, Eraser, Calendar } from 'lucide-react';
import axios from 'axios';

const CHANNELS = [
  { id: 'general', icon: LayoutDashboard, label: 'General' },
  { id: 'habitos', icon: Zap, label: 'Hábitos' },
  { id: 'deporte', icon: Dumbbell, label: 'Deporte' },
  { id: 'finanzas', icon: CreditCard, label: 'Finanzas' },
];

const INITIAL_MESSAGES = {
  general:  [{ role: 'assistant', text: 'Núcleo central activo. ¿En qué te ayudo hoy?' }],
  habitos:  [{ role: 'assistant', text: 'Analizando tus rachas actuales. ¿Qué hábito te cuesta trabajo?' }],
  deporte:  [{ role: 'assistant', text: 'Conectado a tu plan de Maratón y base de datos de fuerza. Pregúntame sobre tus cargas.' }],
  finanzas: [{ role: 'assistant', text: 'Modo auditor financiero activo. ¿Analizamos tus gastos?' }],
};

const CHAN_KEY = 'aicoach_active_channel';
const MAX_HISTORY = 20;

export default function AICoach() {
  const [isOpen, setIsOpen] = useState(false);

  const [activeChannel, setActiveChannel] = useState(
    () => localStorage.getItem(CHAN_KEY) || 'general'
  );

  const [channelMessages, setChannelMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const messagesEndRef = useRef(null);

  const activeMessages = channelMessages[activeChannel];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isTyping, activeChannel]);

  useEffect(() => {
    if (isOpen) {
      fetchWeeklySummary();
    }
  }, [isOpen, activeChannel]);

  const fetchWeeklySummary = async () => {
    try {
      const res = await axios.get(`http://192.168.1.72:8000/api/v1/coach/weekly-summary`);
      if (res.data?.summary) {
        // Mostrar el resumen como un mensaje del asistente en el canal general
        setChannelMessages(prev => ({
          ...prev,
          general: [
            ...prev.general,
            { role: 'assistant', text: `📊 Resumen semanal: ${res.data.summary}` }
          ]
        }));
      }
    } catch {}
  };

  const generateWeeklySummary = async () => {
    setGeneratingSummary(true);
    try {
      await axios.post('http://192.168.1.72:8000/api/v1/coach/weekly-summary');
      await fetchWeeklySummary();
      window.showToast?.({ message: 'Resumen semanal generado', type: 'success' });
    } catch {
      window.showToast?.({ message: 'Error al generar resumen', type: 'error' });
    }
    setGeneratingSummary(false);
  };

  const handleChannelChange = (id) => {
    setActiveChannel(id);
    localStorage.setItem(CHAN_KEY, id);
  };

  const handleClearChat = () => {
    setChannelMessages(prev => ({
      ...prev,
      [activeChannel]: INITIAL_MESSAGES[activeChannel]
    }));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg    = input.trim();
    const currentChan = activeChannel;

    const updatedMessages = [
      ...channelMessages[currentChan],
      { role: 'user', text: userMsg },
    ];

    setChannelMessages(prev => ({ ...prev, [currentChan]: updatedMessages }));
    setInput('');
    setIsTyping(true);

    const fullHistory = updatedMessages
      .filter(m => m.role !== 'assistant' || updatedMessages.indexOf(m) > 0)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    const history = fullHistory.slice(-MAX_HISTORY);

    try {
      const res = await axios.post('http://192.168.1.72:8000/api/v1/coach/ask', {
        user_message: userMsg,
        module: currentChan,
        history,
      });

      setTimeout(() => {
        setChannelMessages(prev => ({
          ...prev,
          [currentChan]: [
            ...prev[currentChan],
            { role: 'assistant', text: res.data.response },
          ],
        }));
        setIsTyping(false);
      }, 400);

    } catch {
      setChannelMessages(prev => ({
        ...prev,
        [currentChan]: [
          ...prev[currentChan],
          { role: 'assistant', text: 'Sin conexión con el servidor. Intenta de nuevo.' },
        ],
      }));
      setIsTyping(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-28 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 z-40"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={24} className="text-white" />
              </motion.div>
            : <motion.div key="brain" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <BrainCircuit size={26} className="text-white" />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-44 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-[360px] h-[70vh] md:h-[500px] bg-[#0B0E1A]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-white/5 border-b border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Bot size={18} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Life OS Coach</h3>
                    <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase flex items-center gap-1">
                      <Activity size={10} /> Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateWeeklySummary}
                    disabled={generatingSummary}
                    className="text-[#8B8E9E] hover:text-white p-1.5 bg-white/5 rounded-full transition-colors disabled:opacity-50"
                    title="Generar resumen semanal"
                  >
                    {generatingSummary 
                      ? <Activity size={14} className="animate-spin" /> 
                      : <Calendar size={14} />
                    }
                  </button>
                  <button
                    onClick={handleClearChat}
                    className="text-[#8B8E9E] hover:text-white p-1.5 bg-white/5 rounded-full transition-colors"
                    title="Limpiar conversación"
                  >
                    <Eraser size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-[#8B8E9E] hover:text-white p-1.5 bg-white/5 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs de canales */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelChange(ch.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      activeChannel === ch.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-[#8B8E9E] hover:text-white border border-transparent'
                    }`}
                  >
                    <ch.icon size={12} /> {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {activeMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-500 text-black font-medium rounded-br-sm'
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-sm leading-relaxed'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div key={i} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay }}
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white/5 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Canal ${activeChannel}...`}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-[#8B8E9E] outline-none focus:border-cyan-500/50 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center text-black transition-colors shrink-0"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}