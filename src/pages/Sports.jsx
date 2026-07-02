import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Gym from './Gym';
import Running from './Running';
import axios from 'axios';
import { Dumbbell, Footprints, History as HistoryIcon, Calendar } from 'lucide-react';

const GYM_DAYS = [5, 6];

const getLocalISO = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

export default function Sports() {
  const todayDay = new Date().getDay();
  const [tab, setTab] = useState(GYM_DAYS.includes(todayDay) ? 'gym' : 'running');

  const today = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  const formattedDate = today.toLocaleDateString('es-MX', options);

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans text-white">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
              Rendimiento
            </h1>
            <p className="text-[#8B8E9E] text-xs font-semibold uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <Calendar size={12} className="text-cyan-400" /> {formattedDate}
            </p>
          </motion.div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl flex p-1 self-start sm:self-center backdrop-blur-xl">
            {[
              { id: 'running', label: 'Running', icon: Footprints },
              { id: 'gym', label: 'Gym', icon: Dumbbell },
              { id: 'history', label: 'Historial', icon: HistoryIcon }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                  tab === t.id 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5' 
                    : 'text-[#8B8E9E] hover:text-white'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {tab === 'gym' && <Gym tab={tab} setTab={setTab} />}
          {tab === 'running' && <Running tab={tab} setTab={setTab} />}
          {tab === 'history' && <SportsHistory />}
        </motion.div>

      </div>
    </div>
  );
}

function SportsHistory() {
  const [gymSessionLogs, setGymSessionLogs] = useState([]);
  const [runningLogs, setRunningLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Pedimos ahora las sesiones de gym guardadas en su nueva tabla
        const [resGym, resRun] = await Promise.all([
          axios.get("http://192.168.1.72:8000/api/v1/gym/session-history"),
          axios.get("http://192.168.1.72:8000/api/v1/running/history")
        ]);
        setGymSessionLogs(resGym.data);
        setRunningLogs(resRun.data);
      } catch (error) {
        console.error("Error cargando historiales", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const gymSessionByDate = gymSessionLogs.reduce((acc, log) => { acc[log.date] = log; return acc; }, {});
  const runningByDate = runningLogs.reduce((acc, log) => { acc[log.date] = log; return acc; }, {});

  const todayStr = getLocalISO(new Date());

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return getLocalISO(d);
  });

  const DAY_NAMES_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const GYM_DAYS_SET = new Set([5, 6]);

  const STATUS_UI = {
    completed: { dot: 'bg-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20', text: 'Cumplido' },
    pending:   { dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', text: 'Pendiente' },
    untracked: { dot: 'bg-neutral-600', badge: 'bg-white/5 text-[#8B8E9E] border border-white/10', text: 'Sin registro' }
  };

  const sessions = last14.map(dateStr => {
    const d = new Date(dateStr + "T12:00:00");
    const dayIdx = d.getDay();
    const isFuture = dateStr > todayStr;
    const isToday  = dateStr === todayStr;

    if (isFuture) return null;

    const label = `${DAY_NAMES_ES[dayIdx]} ${d.getDate()} ${d.toLocaleDateString("es-MX", { month: "short" })}`;

    if (GYM_DAYS_SET.has(dayIdx)) {
      const gymLog = gymSessionByDate[dateStr];
      const gymDone = !!gymLog;
      return {
        date: label, type: "Fuerza",
        name: gymDone ? "Bitácora de fuerza guardada" : "Gym",
        // Ahora inyectamos la data real de esfuerzo y tonelaje
        target: gymDone 
          ? `Tonelaje: ${gymLog.tonnage.toLocaleString()}kg · RPE: ${gymLog.rpe}/10 · ${gymLog.feeling}` 
          : (dayIdx === 5 ? "Pierna" : "Superior"),
        status: gymDone ? "completed" : (isToday ? "pending" : "untracked"),
      };
    } else {
      const runLog = runningByDate[dateStr];
      const runningDone = !!runLog;
      const expectedTarget = [0,3].includes(dayIdx) ? "Easy" : dayIdx === 2 ? "Intervalos" : dayIdx === 4 ? "Tempo" : "Long Run";
      
      return {
        date: label, type: "Running",
        name: runningDone ? "Sesión completada" : "Running",
        target: runningDone 
          ? `${runLog.workout_type.replace('_', ' ')} · RPE: ${runLog.rpe}/10 · ${runLog.feeling}` 
          : expectedTarget,
        status: runningDone ? "completed" : (isToday ? "pending" : "untracked"),
      };
    }
  }).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
        <h3 className="font-bold text-lg text-white mb-1">Bitácora de Carga</h3>
        <p className="text-xs text-[#8B8E9E]">Últimas 2 semanas · datos reales de esfuerzo</p>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="mt-6 relative border-l-2 border-white/5 pl-4 space-y-4">
            {sessions.map((session, idx) => {
              const ui = STATUS_UI[session.status];
              return (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-[#0B0E1A] ${ui.dot}`} />
                  <div className="flex justify-between items-start bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition shadow-sm">
                    <div>
                      <span className="text-[10px] text-[#8B8E9E] font-bold">{session.date}</span>
                      <h4 className="font-bold text-sm text-white mt-0.5">{session.name}</h4>
                      <p className={`text-xs mt-1 capitalize font-medium ${session.status === 'untracked' ? 'text-white/30' : 'text-white/60'}`}>
                        {session.type} · {session.target}
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-xl shrink-0 ml-3 ${ui.badge}`}>
                      {ui.text}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}