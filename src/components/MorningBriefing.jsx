import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CheckCircle2, Clock, AlertCircle, Sparkles, X } from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';

const API = 'https://life-os-backend-production-63db.up.railway.app/api/v1';
const BRIEFING_KEY = 'last_briefing_date';

export default function MorningBriefing() {
  const { habits, taskList, fetchTaskSummary, fetchLifeScore } = useStore();
  const [show, setShow] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateBriefing();
  }, []);

  const generateBriefing = async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastBriefing = localStorage.getItem(BRIEFING_KEY);

    // Si ya se mostró hoy, no mostrar
    if (lastBriefing === today) {
      setLoading(false);
      return;
    }

    // Obtener datos
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Hábitos pendientes de hoy
    const pendingHabits = habits.filter(h => !h.done);
    const doneHabits = habits.filter(h => h.done);
    
    // Tareas de hoy
    const todayTasks = taskList.filter(t => !t.date || t.date <= todayStr);
    const pendingTasks = todayTasks.filter(t => !taskList.find(tt => tt.id === t.id)?.done);
    
    // Recordatorios que vencen hoy
    let todayReminders = [];
    try {
      const res = await axios.get(`${API}/reminders?done=false`);
      todayReminders = res.data.filter(r => r.due_date === todayStr);
    } catch {}

    // Generar frase motivacional con IA (simple)
    let motivationalPhrase = '';
    try {
      const res = await axios.post(`${API}/coach/ask`, {
        user_message: 'Genera una frase motivacional corta para comenzar el día (máximo 10 palabras)',
        module: 'general',
        history: []
      });
      motivationalPhrase = res.data.response;
    } catch {
      motivationalPhrase = 'Cada día es una nueva oportunidad para mejorar.';
    }

    setBriefing({
      date: today,
      pendingHabits: pendingHabits.length,
      doneHabits: doneHabits.length,
      totalHabits: habits.length,
      pendingTasks: pendingTasks.length,
      totalTasks: todayTasks.length,
      reminders: todayReminders,
      motivationalPhrase,
      hasData: habits.length > 0 || taskList.length > 0 || todayReminders.length > 0,
    });

    setLoading(false);
    setShow(true);
  };

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(BRIEFING_KEY, today);
    setShow(false);
    // Actualizar datos
    fetchTaskSummary();
    fetchLifeScore();
  };

  if (loading) return null;
  if (!show || !briefing) return null;
  if (!briefing.hasData) {
    // Si no hay datos, no mostrar briefing
    localStorage.setItem(BRIEFING_KEY, new Date().toISOString().split('T')[0]);
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative overflow-hidden rounded-3xl p-6 mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.10))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        {/* Botón cerrar */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/20 border border-amber-500/30 flex-shrink-0">
            <Sun size={20} className="text-amber-400" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-white font-bold text-lg">Buenos días, Oiram</h3>
              <p className="text-sm text-white/60">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Frase motivacional */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/80 italic">{briefing.motivationalPhrase}</p>
              </div>
            </div>

            {/* Resumen de hábitos y tareas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Hábitos</span>
                  <span className="text-xs font-medium text-white/40">
                    {briefing.doneHabits}/{briefing.totalHabits}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-sm font-bold text-white">
                    {briefing.pendingHabits} pendientes
                  </span>
                </div>
              </div>
              
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Tareas</span>
                  <span className="text-xs font-medium text-white/40">
                    {briefing.totalTasks - briefing.pendingTasks}/{briefing.totalTasks}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 size={14} className="text-cyan-400" />
                  <span className="text-sm font-bold text-white">
                    {briefing.pendingTasks} pendientes
                  </span>
                </div>
              </div>
            </div>

            {/* Recordatorios de hoy */}
            {briefing.reminders.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-400" />
                  <span className="text-xs font-medium text-rose-300">
                    {briefing.reminders.length} recordatorio{briefing.reminders.length > 1 ? 's' : ''} para hoy:
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {briefing.reminders.map((r, i) => (
                    <span key={i} className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                      {r.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Botón para comenzar */}
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90"
            >
              Vamos a por ello
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}