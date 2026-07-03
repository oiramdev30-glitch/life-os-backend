import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Plus, Smile, Frown, Meh, SmilePlus } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const API = "https://life-os-backend-production-63db.up.railway.app/api/v1";

const moods = [
  { icon: Frown, label: "Muy bajo", value: 1, color: "#EF4444" },
  { icon: Meh, label: "Bajo", value: 2, color: "#FB923C" },
  { icon: Smile, label: "Neutro", value: 3, color: "#FACC15" },
  { icon: SmilePlus, label: "Bien", value: 4, color: "#22D3EE" },
  { icon: Sparkles, label: "Excelente", value: 5, color: "#4ADE80" },
];

export default function Mental() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [showJournal, setShowJournal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/mental`);
      setLogs(res.data);
    } catch (e) { console.error(e); }
  };

  const handleSaveEntry = async () => {
    if (!selectedMood && !journalText) return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      await axios.post(`${API}/mental`, {
        mood_value: selectedMood || 3,
        journal_text: journalText
      });
      setJournalText("");
      setSelectedMood(null);
      setShowJournal(false);
      await fetchLogs();
      window.showToast?.({ message: 'Entrada guardada', type: 'success' });
    } catch (e) {
      console.error(e);
      window.showToast?.({ message: 'Error al guardar', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMoodOnly = async () => {
    if (!selectedMood) return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      await axios.post(`${API}/mental`, { mood_value: selectedMood, journal_text: "" });
      setSelectedMood(null);
      await fetchLogs();
      window.showToast?.({ message: 'Estado de ánimo registrado', type: 'success' });
    } catch (e) {
      console.error(e);
      window.showToast?.({ message: 'Error al guardar', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Agrupar datos por día para la gráfica (últimos 7 días reales) ---
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    // Agrupar logs por fecha, tomando el último registro de cada día
    const dailyMap = new Map();
    logs.forEach(log => {
      const date = log.date;
      if (!dailyMap.has(date) || new Date(log.id) > new Date(dailyMap.get(date).id)) {
        dailyMap.set(date, log);
      }
    });

    return last7Days.map(date => {
      const log = dailyMap.get(date);
      return {
        day: date.split("-")[2],
        mood: log ? log.mood_value : null,
      };
    });
  }, [logs]);

  // Promedio de los últimos 7 días (solo días con datos)
  const avgMood = useMemo(() => {
    const valid = chartData.filter(d => d.mood !== null);
    if (valid.length === 0) return 0;
    return (valid.reduce((a, d) => a + d.mood, 0) / valid.length).toFixed(1);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-xl border backdrop-blur-xl bg-white/10 border-white/20 p-3">
          <p className="text-xs text-[#8B8E9E]">Día {label}</p>
          <p className="text-xl font-bold text-white">Nivel: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-white">Salud Mental</h1>
          <p className="text-[#8B8E9E] text-sm font-medium tracking-wide uppercase mt-1">Revisión y Diario</p>
        </motion.div>

        <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
          <h2 className="text-center text-lg font-semibold mb-6 text-white">¿Cómo te sientes hoy?</h2>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m) => (
              <motion.button key={m.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedMood(m.value)}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${selectedMood === m.value ? 'bg-white/10 border-white/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                <m.icon size={28} style={{ color: m.color }} />
                <span className="text-[10px] sm:text-xs text-center font-semibold uppercase tracking-wider text-[#8B8E9E]">{m.label}</span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selectedMood && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveMoodOnly}
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                    style={{
                      background: `${moods.find(m => m.value === selectedMood)?.color}20`,
                      border: `1px solid ${moods.find(m => m.value === selectedMood)?.color}40`,
                      color: moods.find(m => m.value === selectedMood)?.color,
                    }}
                  >
                    {isSaving ? "Guardando..." : "Guardar estado de ánimo"}
                  </button>
                  <button
                    onClick={() => setShowJournal(true)}
                    className="px-4 py-3 rounded-2xl font-bold text-sm text-[#8B8E9E] transition-all hover:text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    + Diario
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-lg text-white">Tendencia (últimos 7 días)</h2>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm px-3 py-1 rounded-full">
              {avgMood > 0 ? `${avgMood} promedio` : "Sin datos"}
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8B8E9E", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mood" stroke="#22D3EE" strokeWidth={3} fill="url(#moodGrad)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-lg text-white">Diario Personal</h2>
            <button onClick={() => setShowJournal(!showJournal)} className="flex items-center gap-1.5 text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-cyan-400/20 transition">
              <Plus size={16} /> Nueva Entrada
            </button>
          </div>

          <AnimatePresence>
            {showJournal && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="¿Qué pasó hoy? ¿Cómo te sentiste?"
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 outline-none resize-none text-white placeholder:text-[#8B8E9E]" />
                <button onClick={handleSaveEntry} disabled={isSaving} className="mt-3 w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-2xl font-bold transition disabled:opacity-50">
                  {isSaving ? "Guardando..." : "Guardar Entrada"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-4">
            {logs.filter(l => l.journal_text).map(entry => {
              const moodDef = moods.find(m => m.value === entry.mood_value) || moods[2];
              return (
                <div key={entry.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <moodDef.icon size={24} style={{ color: moodDef.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white/90 text-sm">{entry.date} <span className="text-[#8B8E9E]">• {entry.time}</span></p>
                      <p className="text-sm text-neutral-300 mt-2 leading-relaxed">{entry.journal_text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}