import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, Activity, CheckCircle2, X, Flame, Minus, ThumbsUp } from "lucide-react";
import axios from "axios";
import useStore from "../store/useStore";

// Función inteligente que divide el entrenamiento en bloques visuales
const getWorkoutBreakdown = (workout) => {
  if (!workout || workout.distance_km === 0) return null;

  if (workout.type === 'intervals') {
    // Busca el "5x400m" o "6x1000m" dentro de la descripción
    const main = workout.description.includes('x') 
      ? workout.description.split(' ').find(w => w.includes('x')) 
      : 'Series';
    
    return [
      { label: "2-3 km", sub: "Calentamiento", color: "bg-emerald-500" },
      { label: main.replace('*', 'x'), sub: "Intervalos", color: "bg-rose-500" },
      { label: "2-3 km", sub: "Enfriamiento", color: "bg-blue-500" }
    ];
  }

  if (workout.type === 'tempo') {
    // Busca el kilometraje del tempo, ej: "4-5 km"
    const match = workout.description.match(/\d+(-\d+)?\s*km/i);
    const main = match ? match[0] : `${Math.floor(workout.distance_km * 0.6)} km`;
    
    return [
      { label: "2 km", sub: "Calentamiento", color: "bg-emerald-500" },
      { label: main, sub: "Ritmo Fuerte", color: "bg-amber-500" },
      { label: "1-2 km", sub: "Enfriamiento", color: "bg-blue-500" }
    ];
  }

  if (workout.type === 'long_run') {
    return [
      { label: `${workout.distance_km} km`, sub: "Distancia Continua", color: "bg-purple-500" }
    ];
  }

  if (workout.type === 'easy') {
    return [
      { label: `${workout.distance_km} km`, sub: "Rodaje Suave", color: "bg-cyan-500" }
    ];
  }

  return null;
};

export default function Running() {
  const { metrics } = useStore(); 
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal de esfuerzo percibido
  const [showRpeModal, setShowRpeModal] = useState(false);
  const [rpeValue, setRpeValue] = useState(5);
  const [feeling, setFeeling] = useState("Bien");

  // Íconos elegantes de Lucide en lugar de emojis
  const FEELINGS = [
    { label: "Agotado", icon: Flame, color: "text-rose-400" },
    { label: "Regular", icon: Minus, color: "text-amber-400" },
    { label: "Bien", icon: ThumbsUp, color: "text-cyan-400" },
    { label: "Increíble", icon: Zap, color: "text-purple-400" }
  ];

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const vo2 = metrics?.vo2Max || 50;
        const mhr = metrics?.max_hr || 190;
        const rhr = metrics?.resting_hr || 50;
        
        const res = await axios.get(`http://localhost:8000/api/v1/running/plan?vo2max=${vo2}&max_hr=${mhr}&rest_hr=${rhr}`);
        setPlanData(res.data);
      } catch (e) {
        console.error("Error cargando plan dinámico", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [metrics]);

  const handleSaveSession = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/running/log", {
        rpe: rpeValue,
        feeling: feeling,
        workout_type: planData.workout.type
      });
      setPlanData({ ...planData, is_done: true });
    } catch (e) {
      console.error(e);
    }
    setShowRpeModal(false);
  };

  if (loading || !planData) return <div className="text-white p-6">Cargando métricas biométricas...</div>;

  const { workout, zones, is_done, phase_name, weekly_km } = planData;
  const currentZone = workout.pace_zone ? zones[workout.pace_zone] : null;
  const breakdown = getWorkoutBreakdown(workout);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Tarjeta de Entrenamiento DINÁMICA */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
        className="relative rounded-3xl border backdrop-blur-xl bg-gradient-to-br from-cyan-950/40 to-blue-950/10 border-cyan-500/20 p-6 overflow-hidden shadow-2xl"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-xl border border-cyan-500/20">
              {phase_name}
            </span>
            <h2 className="text-3xl font-black text-white mt-4 capitalize tracking-tight">
              {workout.type === 'intervals' ? 'Intervalos' : 
               workout.type === 'tempo' ? 'Tempo Run' : 
               workout.type === 'long_run' ? 'Long Run' : 
               workout.type === 'easy' ? 'Easy Run' : workout.type.replace('_', ' ')}
            </h2>
          </div>
        </div>

        {/* BARRA DE DESGLOSE VISUAL (Basada en tu boceto) */}
        {breakdown ? (
          <div className="flex gap-2 sm:gap-3 mt-6 mb-2">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col">
                <span className="text-white font-black text-sm sm:text-base font-mono">{item.label}</span>
                <span className="text-[#8B8E9E] text-[9px] sm:text-[10px] uppercase tracking-wider mb-2 font-bold line-clamp-1">{item.sub}</span>
                <div className={`h-1.5 w-full rounded-full ${item.color} opacity-90`} />
              </div>
            ))}
          </div>
        ) : (
          // Vista para días de gimnasio o descanso
          <p className="text-cyan-100/60 text-sm mt-2 font-medium">{workout.description}</p>
        )}

        {currentZone ? (
          <div className="flex items-center gap-4 sm:gap-6 mt-8 bg-black/20 border border-white/5 rounded-2xl p-4 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[10px] text-cyan-300/60 font-bold uppercase tracking-wider">Ritmo Biométrico</span>
              <span className="text-base font-extrabold text-white mt-0.5 font-mono">{currentZone.pace}/km</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-4 sm:pl-6">
              <span className="text-[10px] text-rose-300/60 font-bold uppercase tracking-wider">Pulso (Zonas)</span>
              <span className="text-base font-extrabold text-rose-100 mt-0.5 font-mono">{currentZone.hr} bpm</span>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
             <Activity size={20} className="text-purple-400" />
             <span className="text-sm font-bold text-white">Sesión de Gimnasio o Descanso</span>
          </div>
        )}

        <button 
          onClick={() => !is_done && setShowRpeModal(true)}
          disabled={is_done}
          className={`mt-6 w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${is_done ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner cursor-default' : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/10 cursor-pointer'}`}
        >
          {is_done ? <><CheckCircle2 size={16} /> Sesión Analizada y Guardada</> : 'Marcar Sesión Completada'}
        </button>
      </motion.div>

      {/* Metas del Macrociclo */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Carga Semanal", val: weekly_km, unit: "km", color: "#22D3EE", icon: Activity },
          { label: "Objetivo GDL", val: "3:20", unit: "hrs", color: "#FACC15", icon: Target },
        ].map((s, i) => (
          <div key={i} className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-5 flex flex-col shadow-lg">
            <div className="flex items-center gap-1.5 text-[#8B8E9E] mb-2">
              <s.icon size={13} style={{ color: s.color }} />
              <p className="text-[9px] font-bold uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="text-2xl font-black text-white mt-1 font-mono">{s.val} <span className="text-xs font-semibold text-[#8B8E9E] font-sans">{s.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Modal de Esfuerzo Percibido (RPE) SIN EMOJIS */}
      <AnimatePresence>
        {showRpeModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-3xl p-6 bg-[#0F111A] border border-white/10 shadow-2xl" initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">Reporte de Sesión</h3>
                <button onClick={() => setShowRpeModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[#8B8E9E] text-xs uppercase tracking-wider font-bold mb-3 flex justify-between">
                    <span>Esfuerzo Percibido (RPE)</span>
                    <span className="text-cyan-400 text-sm">{rpeValue}/10</span>
                  </label>
                  <input type="range" min="1" max="10" value={rpeValue} onChange={(e) => setRpeValue(parseInt(e.target.value))} className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-white/40 mt-2 font-bold uppercase">
                    <span>Suave</span>
                    <span>Moderado</span>
                    <span>Máximo</span>
                  </div>
                </div>

                <div>
                  <label className="text-[#8B8E9E] text-xs uppercase tracking-wider font-bold mb-3 block">¿Cómo te sentiste?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEELINGS.map(f => (
                      <button key={f.label} onClick={() => setFeeling(f.label)} className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition-all ${feeling === f.label ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                        <f.icon size={18} className={feeling === f.label ? 'text-cyan-400' : f.color} />
                        <span className="text-xs font-bold">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveSession} className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 transition shadow-lg mt-2">
                  Guardar y Analizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}