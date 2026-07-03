import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, X, Smartphone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const API = "https://life-os-backend-production-63db.up.railway.app/api/v1/social";

const SOCIAL_APPS = [
  { name: "Instagram", limit: 60, color: "#E1306C" },
  { name: "TikTok", limit: 30, color: "#94A3B8" },
  { name: "WhatsApp", limit: 90, color: "#25D366" },
  { name: "Facebook", limit: 30, color: "#1877F2" },
  { name: "Netflix", limit: 120, color: "#E50914" },
  { name: "YouTube", limit: 60, color: "#FF0000" },
  { name: "Clash Royale", limit: 45, color: "#FACC15" },
  { name: "Otra", limit: 60, color: "#8B5CF6" },
];

const totalDailyLimit = SOCIAL_APPS.reduce((a, b) => a + b.limit, 0);

export default function Social() {
  const [logs, setLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [formApp, setFormApp] = useState(SOCIAL_APPS[0].name);
  const [formMinutes, setFormMinutes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/logs`);
      setLogs(res.data);
    } catch (e) { console.error(e); }
  };

  const handleSaveLog = async () => {
    if (!formMinutes || isNaN(formMinutes) || isSaving) return;
    setIsSaving(true);
    try {
      await axios.post(`${API}/logs`, {
        app_name: formApp,
        minutes: parseInt(formMinutes)
      });
      setShowLogModal(false);
      setFormMinutes("");
      await fetchLogs();
      window.showToast?.({ message: 'Registro guardado', type: 'success' });
    } catch (e) {
      console.error(e);
      window.showToast?.({ message: 'Error al guardar registro', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.date === todayStr);
  const totalMinsToday = todayLogs.reduce((a, b) => a + b.minutes, 0);
  const isOverLimit = totalMinsToday > totalDailyLimit;
  const usagePercent = Math.min((totalMinsToday / totalDailyLimit) * 100, 100);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const weekData = last7Days.map(dateStr => {
    const d = new Date(dateStr + "T12:00:00");
    const label = d.toLocaleDateString("es-MX", { weekday: "short" });
    const min = logs
      .filter(l => l.date === dateStr)
      .reduce((a, b) => a + b.minutes, 0);
    return { day: label, min };
  });

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        
        <div className="flex justify-between items-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight text-white">Uso de Pantalla</h1>
            <p className="text-[#8B8E9E] text-sm font-medium tracking-wide uppercase mt-1">Control de Dopamina</p>
          </motion.div>
          <div className={`px-4 py-2.5 rounded-2xl font-medium flex items-center gap-1.5 text-sm border ${isOverLimit ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            <Clock size={16} />
            {Math.floor(totalMinsToday / 60)}h {totalMinsToday % 60}m
          </div>
        </div>

        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${isOverLimit ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
          {isOverLimit ? <AlertTriangle className="text-red-400 mt-0.5" size={20} /> : <CheckCircle2 className="text-emerald-400 mt-0.5" size={20} />}
          <div>
            <h3 className={`font-bold ${isOverLimit ? 'text-red-400' : 'text-emerald-400'}`}>
              {isOverLimit ? 'Límite de pantalla excedido' : 'Buen control digital hoy'}
            </h3>
            <p className="text-[#8B8E9E] text-sm mt-1">
              {isOverLimit 
                ? `Te has pasado de tu presupuesto de ${Math.floor(totalDailyLimit/60)}h diarias. Es momento de alejar el celular.` 
                : 'Mantienes tu consumo de dopamina barata bajo control. Sigue así.'}
              {usagePercent > 80 && !isOverLimit && (
                <span className="block mt-1 text-amber-400">Estás cerca del límite diario ({Math.round(usagePercent)}%).</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-white">Consumo Hoy</h2>
              <button onClick={() => setShowLogModal(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Plus size={12} /> Check-in manual
              </button>
            </div>
            
            <div className="space-y-6">
              {SOCIAL_APPS.map((app, i) => {
                const todayLog = todayLogs.find(l => l.app_name === app.name);
                const usedMins = todayLog ? todayLog.minutes : 0;
                
                const over = usedMins > app.limit;
                const pct = Math.min((usedMins / app.limit) * 100, 100);
                
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-white/90">{app.name}</span>
                      <div className="text-right">
                        <span className={`font-bold ${over ? 'text-red-400' : 'text-white'}`}>{usedMins}m</span>
                        <span className="text-[#8B8E9E]"> / {app.limit}m</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: over ? '#F43F5E' : app.color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.08 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {weekData.length > 0 && (
            <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
              <h2 className="font-semibold text-lg text-white mb-6">Uso Semanal (Minutos Totales)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8B8E9E", fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="min" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLogModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-3xl p-6 bg-[#141728] border border-white/10" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-bold flex items-center gap-2"><Smartphone size={18} /> Registrar Tiempo</h3>
                <button onClick={() => setShowLogModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              
              <label className="text-xs text-[#8B8E9E] uppercase font-bold tracking-widest mb-2 block">Aplicación</label>
              <select value={formApp} onChange={e => setFormApp(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 outline-none">
                {SOCIAL_APPS.map(app => <option key={app.name} value={app.name} className="bg-[#141728]">{app.name}</option>)}
              </select>
              
              <label className="text-xs text-[#8B8E9E] uppercase font-bold tracking-widest mb-2 block">Minutos usados hoy</label>
              <input type="number" value={formMinutes} onChange={e => setFormMinutes(e.target.value)} placeholder="Ej: 45" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 outline-none font-mono focus:border-indigo-500" />
              
              <button onClick={handleSaveLog} disabled={isSaving} className="w-full py-3 rounded-2xl font-bold text-white bg-indigo-500 hover:bg-indigo-400 transition-colors disabled:opacity-50">
                {isSaving ? "Guardando..." : "Guardar Registro"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}