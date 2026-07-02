import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, Circle, Activity, Flame, Minus, ThumbsUp, Zap, Plus, Scale, X, 
  Stethoscope, ChevronDown, ChevronUp, ChevronRight, ChevronLeft
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import axios from "axios";

// ─── RUTINA HÍBRIDA PARA MARATONISTAS (75 min Max) ───────────────────────────
const GYM_PLAN = {
  5: { // Viernes
    id: "fri_lower",
    name: "Fuerza Inferior + Blindaje",
    desc: "Sentadillas y unilaterales para cuidar las rodillas al correr",
    exercises: [
      { id: "leg_01", name: "Sentadilla Libre", block: "primary", sets: 4, reps: "6-8", defaultWeight: 70, affects: ["Piernas", "Core"] },
      { id: "leg_02", name: "Peso Muerto Rumano", block: "primary", sets: 3, reps: "10", defaultWeight: 60, affects: ["Piernas", "Espalda"] },
      { id: "leg_03", name: "Desplante Búlgaro", block: "accessory", sets: 3, reps: "10", defaultWeight: 20, affects: ["Piernas", "Core"] },
      { id: "leg_04", name: "Elevación Pantorrilla", block: "accessory", sets: 4, reps: "15", defaultWeight: 40, affects: ["Piernas"] },
      { id: "mob_01", name: "Rotaciones de Cadera 90/90", block: "core_mobility", sets: 2, reps: "60s", defaultWeight: 0, isBW: true, affects: ["Core"] },
      { id: "mob_02", name: "Estiramiento Psoas", block: "core_mobility", sets: 2, reps: "45s", defaultWeight: 0, isBW: true, affects: ["Core"] }
    ]
  },
  6: { // Sábado
    id: "sat_upper",
    name: "Tren Superior (V-Taper)",
    desc: "Pecho marcado y brazos fuertes sin volumen excesivo",
    exercises: [
      { id: "up_01", name: "Press Banca Plano/Inclinado", block: "primary", sets: 4, reps: "8-10", defaultWeight: 60, affects: ["Pecho", "Hombros", "Brazos"] },
      { id: "up_02", name: "Dominadas o Jalón al Pecho", block: "primary", sets: 4, reps: "8-10", defaultWeight: 50, affects: ["Espalda", "Brazos"] },
      { id: "up_03", name: "Elevaciones Laterales", block: "accessory", sets: 4, reps: "15", defaultWeight: 10, affects: ["Hombros"] },
      { id: "up_04", name: "Curl Bíceps + Copa Tríceps", block: "accessory", sets: 3, reps: "12", defaultWeight: 15, affects: ["Brazos"] },
      { id: "core_01", name: "Plancha Abdominal", block: "core_mobility", sets: 3, reps: "60s", defaultWeight: 0, isBW: true, affects: ["Core"] },
      { id: "mob_03", name: "Movilidad Torácica", block: "core_mobility", sets: 2, reps: "10x", defaultWeight: 0, isBW: true, affects: ["Espalda"] }
    ]
  },
  "opcional": {
    id: "opt_home",
    name: "Mantenimiento en Casa (Opcional)",
    desc: "Rutina suave de 30 min sin equipo pesado",
    exercises: [
      { id: "opt_01", name: "Flexiones (Push-ups)", block: "primary", sets: 3, reps: "Al fallo", defaultWeight: 0, isBW: true, affects: ["Pecho", "Brazos"] },
      { id: "opt_02", name: "Sentadilla Búlgara Corporal", block: "primary", sets: 3, reps: "15", defaultWeight: 0, isBW: true, affects: ["Piernas"] },
      { id: "opt_03", name: "Puente de Glúteo Unilateral", block: "accessory", sets: 3, reps: "15", defaultWeight: 0, isBW: true, affects: ["Piernas", "Core"] },
      { id: "mob_05", name: "Liberación con Foam Roller", block: "core_mobility", sets: 1, reps: "5 min", defaultWeight: 0, isBW: true, affects: ["Piernas", "Espalda"] }
    ]
  }
};

const BLOCK_CONFIG = {
  primary: { label: "FUERZA PRINCIPAL", color: "purple", iconColor: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/30", textClass: "text-purple-400", glowClass: "shadow-purple-500/15" },
  accessory: { label: "ACCESORIOS E HIPERTROFIA", color: "cyan", iconColor: "text-cyan-400", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/30", textClass: "text-cyan-400", glowClass: "shadow-cyan-500/15" },
  core_mobility: { label: "CORE Y MOVILIDAD", color: "indigo", iconColor: "text-indigo-400", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-500/30", textClass: "text-indigo-400", glowClass: "shadow-indigo-500/15" }
};

const FEELINGS = [
  { label: "Agotado", icon: Flame, color: "text-rose-400" },
  { label: "Regular", icon: Minus, color: "text-amber-400" },
  { label: "Bien", icon: ThumbsUp, color: "text-cyan-400" },
  { label: "Increíble", icon: Zap, color: "text-purple-400" }
];

// ─── COMPONENTE AVATAR MINIMALISTA (CÍRCULOS CON INICIALES) ─────────────
function MuscleTargetAvatar({ affects = [], blockColor = "cyan" }) {
  // Mapeo de grupos musculares a iniciales
  const muscleMap = {
    Piernas: "P",
    Core: "C", 
    Pecho: "P",
    Espalda: "E",
    Hombros: "H",
    Brazos: "B"
  };

  // Obtener las iniciales únicas y evitar duplicados
  const uniqueMuscles = [...new Set(affects)];
  const initials = uniqueMuscles.map(m => muscleMap[m] || m[0]).join("");

  // Colores según bloque
  const colorMap = {
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400"
  };

  const bgMap = {
    purple: "bg-purple-500/20",
    cyan: "bg-cyan-500/20",
    indigo: "bg-indigo-500/20"
  };

  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${colorMap[blockColor]} bg-gradient-to-br ${bgMap[blockColor]} shrink-0`}>
      <span className="text-xs font-black tracking-tighter">
        {initials || "—"}
      </span>
    </div>
  );
}

export default function Gym({ setTab }) {
  const todayDayIndex = new Date().getDay(); 
  const [activeRoutineId, setActiveRoutineId] = useState(GYM_PLAN[todayDayIndex] ? todayDayIndex : null);
  
  const [exercises, setExercises] = useState([]);
  const [muscleValues, setMuscleValues] = useState({ Pecho: 50, Espalda: 65, Hombros: 55, Brazos: 60, Core: 60, Piernas: 70 });

  // Alertas inteligentes
  const [biometricsAlert, setBiometricsAlert] = useState({ should_log: false, days_passed: 0 });
  const [descargaAlert, setDescargaAlert] = useState({ should_alert: false, workouts_since_last: 0 });

  // Modal de esfuerzo percibido
  const [showRpeModal, setShowRpeModal] = useState(false);
  const [rpeValue, setRpeValue] = useState(5);
  const [feeling, setFeeling] = useState("Bien");
  const [sessionDone, setSessionDone] = useState(false);

  // Estados del Modal de Biometría Wizard
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [biometricsStep, setBiometricsStep] = useState(1);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [metricsForm, setMetricsForm] = useState({
    weight: "", height: "", bmi: "", basal_metabolism: "",
    body_fat: "", muscle_mass: "", visceral_fat: "", body_water: "", skinfolds: "",
    chest: "", waist: "", hip: "", bicep: "", thigh: "", calf: ""
  });

  useEffect(() => {
    axios.get("http://localhost:8000/api/v1/gym/check-metrics").then(res => setBiometricsAlert(res.data)).catch(console.error);
    axios.get("http://localhost:8000/api/v1/gym/check-descarga").then(res => setDescargaAlert(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeRoutineId === null) return;
    const routine = GYM_PLAN[activeRoutineId];
    const todayStr = new Date().toISOString().split("T")[0];

    const initExercises = async () => {
      const base = routine.exercises.map(ex => ({ ...ex, done: false, weight: ex.isBW ? 0 : ex.defaultWeight }));
      try {
        const { data } = await axios.get("http://localhost:8000/api/v1/gym/history");
        const todayLogs = data.filter(log => log.date === todayStr);

        const hydrated = base.map(ex => {
          const logged = todayLogs.find(log => log.exercise_id === ex.id);
          if (!logged) return ex;
          return { ...ex, done: true, weight: logged.weight_logged === "BW" ? 0 : parseFloat(logged.weight_logged) };
        });
        setExercises(hydrated);

        const newValues = { Pecho: 50, Espalda: 65, Hombros: 55, Brazos: 60, Core: 60, Piernas: 70 };
        hydrated.filter(ex => ex.done).forEach(ex => {
          ex.affects.forEach(m => { newValues[m] = Math.min(newValues[m] + 8, 100); });
        });
        setMuscleValues(newValues);
      } catch { setExercises(base); }
    };
    initExercises();
  }, [activeRoutineId]);

  const adjustWeight = (index, amount) => {
    const updated = [...exercises];
    if (updated[index].isBW) return;
    updated[index].weight = Math.max(0, updated[index].weight + amount);
    setExercises(updated);
  };

  const toggleExercise = async (idx) => {
    const updated = [...exercises];
    const targetExercise = updated[idx];
    const newStatus = !targetExercise.done;
    
    targetExercise.done = newStatus;
    setExercises(updated);

    const factor = newStatus ? 8 : -8;
    const newValues = { ...muscleValues };
    targetExercise.affects.forEach(m => { newValues[m] = Math.min(Math.max(newValues[m] + factor, 0), 100); });
    setMuscleValues(newValues);

    try {
      if (newStatus) {
        await axios.post("http://localhost:8000/api/v1/gym/log", {
          exercise_id: targetExercise.id, exercise_name: targetExercise.name, weight_logged: targetExercise.isBW ? "BW" : `${targetExercise.weight}`
        });
      } else {
        await axios.delete(`http://localhost:8000/api/v1/gym/log/${targetExercise.id}`);
      }
    } catch (error) { console.error(error); }
  };

  const totalTonnage = useMemo(() => {
    return exercises.filter(e => e.done && !e.isBW).reduce((total, ex) => {
      const repsNum = parseInt(ex.reps.replace(/\D/g, '')) || 0;
      return total + (ex.sets * repsNum * ex.weight);
    }, 0);
  }, [exercises]);

  const handleSaveSession = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/gym/session-log", { rpe: rpeValue, feeling: feeling, total_tonnage: totalTonnage });
      setSessionDone(true);
      setShowRpeModal(false);
    } catch (e) { console.error(e); }
  };

  const handleMarcarDescarga = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/gym/log-descarga");
      setDescargaAlert({ should_alert: false, workouts_since_last: 0 });
    } catch (e) { console.error(e); }
  };

  const handleSaveBiometrics = async () => {
    try {
      if (!metricsForm.weight) return; 
      
      const parseField = (val) => val === "" ? null : parseFloat(val);

      await axios.post("http://localhost:8000/api/v1/gym/metrics", {
        weight: parseFloat(metricsForm.weight), height: parseField(metricsForm.height),
        bmi: parseField(metricsForm.bmi), basal_metabolism: parseField(metricsForm.basal_metabolism),
        body_fat: parseField(metricsForm.body_fat), muscle_mass: parseField(metricsForm.muscle_mass),
        visceral_fat: parseField(metricsForm.visceral_fat), body_water: parseField(metricsForm.body_water),
        skinfolds: parseField(metricsForm.skinfolds), chest: parseField(metricsForm.chest),
        waist: parseField(metricsForm.waist), hip: parseField(metricsForm.hip),
        bicep: parseField(metricsForm.bicep), thigh: parseField(metricsForm.thigh), calf: parseField(metricsForm.calf)
      });
      setShowBiometricsModal(false);
      setBiometricsAlert({ should_log: false, days_passed: 0 });
      setBiometricsStep(1);
      setShowAdvancedMetrics(false);
    } catch (e) { console.error("Error guardando biometría", e); }
  };

  const activeRoutine = GYM_PLAN[activeRoutineId];
  const doneCount = exercises.filter((e) => e.done).length;
  const progress = exercises.length > 0 ? (doneCount / exercises.length) * 100 : 0;
  const radarData = Object.entries(muscleValues).map(([muscle, value]) => ({ muscle, value }));

  const groupedExercises = { primary: [], accessory: [], core_mobility: [] };
  exercises.forEach((ex, i) => { 
    if (groupedExercises[ex.block]) groupedExercises[ex.block].push({ ...ex, originalIndex: i }); 
  });

  return (
    <div className="flex flex-col gap-6 pb-20">

      {/* ALERTAS INTELIGENTES */}
      <AnimatePresence>
        {descargaAlert.should_alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl bg-gradient-to-r from-blue-500/20 to-indigo-500/10 border border-blue-500/30 p-5 flex flex-col shadow-lg shadow-blue-500/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Activity size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-blue-400 font-bold text-sm">Descarga Muscular Recomendada</h3>
                <p className="text-blue-400/70 text-xs mt-0.5">Has acumulado {descargaAlert.workouts_since_last} entrenamientos intensos. Toca agendar masaje deportivo o sesión profunda de foam roller.</p>
              </div>
            </div>
            <button onClick={handleMarcarDescarga} className="mt-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold text-xs py-2 rounded-xl transition">
              Marcar como realizada
            </button>
          </motion.div>
        )}

        {biometricsAlert.should_log && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 p-5 flex flex-col shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Scale size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-amber-400 font-bold text-sm">Análisis Biométrico Requerido</h3>
                <p className="text-amber-400/70 text-xs mt-0.5">Pesaje Required para establecer tu base aeróbica y de fuerza de la Fase 2.</p>
              </div>
            </div>
            <button onClick={() => { setBiometricsStep(1); setShowBiometricsModal(true); }} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-3 rounded-xl transition">
              Comenzar Escaneo Corporal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {activeRoutine ? (
        <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-4 sm:p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-bold text-2xl text-white">{activeRoutine.name}</h2>
              <p className="text-[#8B8E9E] text-sm mt-1">{activeRoutine.desc}</p>
            </div>
            <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold font-mono">
              {doneCount}/{exercises.length}
            </span>
          </div>

          <div className="h-1.5 bg-white/5 rounded-full mb-8 overflow-hidden">
            <motion.div className="h-full bg-cyan-400" animate={{ width: `${progress}%` }} />
          </div>

          {/* ─── LISTA DE EJERCICIOS CON AVATARES MINIMALISTAS ─── */}
          <div className="flex flex-col gap-10">
            {Object.entries(groupedExercises).map(([blockKey, blockExercises]) => {
              if (blockExercises.length === 0) return null;
              const config = BLOCK_CONFIG[blockKey];

              return (
                <div key={blockKey} className="flex flex-col gap-5">
                  <h3 className={`text-[11px] sm:text-xs font-black uppercase tracking-widest ${config.textClass} border-b border-white/10 pb-2`}>
                    {config.label}
                  </h3>
                  
                  <div className="flex flex-col gap-5">
                    {blockExercises.map((ex) => {
                      const isDone = ex.done;
                      
                      return (
                        <div
                          key={ex.id}
                          className={`relative flex flex-col p-4 rounded-3xl transition-all border shadow-lg backdrop-blur-md
                            ${isDone 
                              ? `${config.bgClass} ${config.borderClass} shadow-inner` 
                              : "bg-[#0A0B10]/40 border-white/5 hover:border-white/10 shadow-sm"
                            }`}
                        >
                          {/* FILA SUPERIOR: Identidad (Avatar Minimalista + Nombre + Volumen) */}
                          <div className="flex items-start gap-4 mb-5 pb-5 border-b border-white/5">
                            
                            {/* Avatar Minimalista con Iniciales */}
                            <MuscleTargetAvatar affects={ex.affects} blockColor={config.color} />

                            {/* Nombre del Ejercicio y Sets/Reps */}
                            <div className="flex-1 min-w-0 pr-2 pt-1">
                              <h4 className={`font-bold text-base sm:text-lg leading-snug break-words line-clamp-2 ${isDone ? "text-white/50" : "text-white"}`}>
                                {ex.name}
                              </h4>
                              {/* Chip Premium de Sets/Reps */}
                              <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border
                                ${isDone ? `${config.bgClass} ${config.borderClass} opacity-80 ${config.textClass}` : "bg-white/5 border-white/10 text-white/70"}`}>
                                {ex.sets} sets × {ex.reps} reps
                              </div>
                            </div>
                            
                            {/* Checkbox */}
                            <div onClick={() => toggleExercise(ex.originalIndex)} className="cursor-pointer shrink-0 mt-1">
                              {isDone ? (
                                <CheckCircle2 size={26} className={`${config.textClass} drop-shadow-md`} />
                              ) : (
                                <Circle size={26} className="text-white/20 hover:text-white/40 transition-colors" />
                              )}
                            </div>
                          </div>

                          {/* FILA INFERIOR: Ejecución Estructurada */}
                          <div className="flex items-center justify-between pl-16 md:pl-[4.5rem]">
                            {/* Display de Peso Actual */}
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Carga</span>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-black font-mono tracking-tight ${isDone ? "text-white/50" : "text-white"}`}>
                                  {ex.isBW ? "BW" : ex.weight}
                                </span>
                                {!ex.isBW && <span className="text-xs font-bold text-white/40">kg</span>}
                              </div>
                            </div>

                            {/* Selector Minimalista de Ancho Fijo */}
                            {!ex.isBW && (
                              <div className="flex items-center bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-inner h-10 w-32 justify-between">
                                <button 
                                  onClick={() => adjustWeight(ex.originalIndex, -2.5)} 
                                  disabled={isDone}
                                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 disabled:opacity-10 transition-all text-white/70 font-bold text-lg"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest pointer-events-none select-none">
                                  Ajustar
                                </span>
                                <button 
                                  onClick={() => adjustWeight(ex.originalIndex, 2.5)} 
                                  disabled={isDone}
                                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 disabled:opacity-10 transition-all text-white/70 font-bold text-lg"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            )}

                            {/* Etiqueta Bodyweight */}
                            {ex.isBW && (
                              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Peso Corporal</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => !sessionDone && setShowRpeModal(true)}
            disabled={sessionDone}
            className={`mt-10 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${sessionDone ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner' : 'bg-white hover:bg-neutral-200 text-black shadow-lg shadow-white/10'}`}
          >
            {sessionDone ? <><CheckCircle2 size={16} /> Bitácora de Fuerza Guardada</> : 'Finalizar y Analizar Esfuerzo'}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6 flex flex-col gap-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 shrink-0">
              <Activity size={22} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Hoy toca correr</h2>
              <p className="text-[#8B8E9E] text-xs mt-0.5">El sistema prioriza tu base aeróbica hoy</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            <button onClick={() => setTab("running")} className="w-full text-xs font-bold text-black bg-cyan-400 py-3 rounded-xl hover:bg-cyan-300 transition-all">
              Ir al entrenamiento de Running
            </button>
            <button onClick={() => setActiveRoutineId("opcional")} className="w-full text-xs font-bold text-[#8B8E9E] bg-white/5 py-3 rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all">
              Hacer rutina de balance en casa (opcional)
            </button>
          </div>
        </div>
      )}

      {/* Gráfico de Radar */}
      <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6 shadow-xl mb-4">
        <div className="mb-4 flex justify-between items-end">
          <div>
            <h2 className="font-bold text-base text-white">Fatiga Localizada</h2>
            <p className="text-[11px] text-[#8B8E9E]">Monitoreo de estado neuromuscular</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Tonelaje Hoy</p>
            <p className="text-lg font-mono font-black text-white">{totalTonnage.toLocaleString()} kg</p>
          </div>
        </div>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="muscle" tick={{ fill: "#8B8E9E", fontSize: 11, fontWeight: 'bold' }} />
              <Radar name="Volumen" dataKey="value" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.15} strokeWidth={2.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODAL DE RPE (FUERZA) ─── */}
      <AnimatePresence>
        {showRpeModal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center p-4 pb-32 md:pb-10 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-3xl p-6 bg-[#0F111A] border border-white/10 shadow-2xl flex flex-col max-h-full" initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">Reporte de Fuerza</h3>
                <button onClick={() => setShowRpeModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#8B8E9E] uppercase tracking-wider">Tonelaje Total</span>
                  <span className="text-xl font-mono font-black text-white">{totalTonnage.toLocaleString()} kg</span>
                </div>

                <div>
                  <label className="text-[#8B8E9E] text-xs uppercase tracking-wider font-bold mb-3 flex justify-between">
                    <span>Esfuerzo Muscular (RPE)</span>
                    <span className="text-cyan-400 text-sm">{rpeValue}/10</span>
                  </label>
                  <input type="range" min="1" max="10" value={rpeValue} onChange={(e) => setRpeValue(parseInt(e.target.value))} className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-white/40 mt-2 font-bold uppercase">
                    <span>Ligero</span>
                    <span>Óptimo</span>
                    <span>Al Fallo</span>
                  </div>
                </div>

                <div>
                  <label className="text-[#8B8E9E] text-xs uppercase tracking-wider font-bold mb-3 block">Recuperación Articular</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEELINGS.map(f => (
                      <button key={f.label} onClick={() => setFeeling(f.label)} className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition-all ${feeling === f.label ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                        <f.icon size={18} className={feeling === f.label ? 'text-cyan-400' : f.color} />
                        <span className="text-xs font-bold">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 shrink-0 border-t border-white/10 mt-2">
                <button onClick={handleSaveSession} className="w-full py-4 rounded-2xl font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition shadow-lg">
                  Guardar Bitácora
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL BIOMÉTRICO REDISEÑADO: ESCANEO CORPORAL WIZARD ─── */}
      <AnimatePresence>
        {showBiometricsModal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center p-4 pb-32 md:pb-10 bg-black/85 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-md rounded-3xl p-6 bg-[#0F111A] border border-amber-500/20 shadow-2xl flex flex-col max-h-full" initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }}>
              
              {/* Header Principal */}
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
                    <Scale size={22} className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" /> 
                    {biometricsStep === 1 ? "Escaneo Corporal" : biometricsStep === 2 ? "Composición Corporal" : "Medidas Corporales"}
                  </h3>
                  <p className="text-amber-400/60 font-mono text-[10px] font-bold uppercase tracking-widest mt-0.5">Paso {biometricsStep} de 3</p>
                </div>
                <button onClick={() => setShowBiometricsModal(false)} className="text-white/40 hover:text-white p-1.5 hover:bg-white/5 rounded-xl transition"><X size={20} /></button>
              </div>

              {/* Barra de Progreso Superior Tipo Garmin/Oura */}
              <div className="flex gap-2 mb-6 shrink-0">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${s <= biometricsStep ? "bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.3)]" : "w-0"}`} />
                  </div>
                ))}
              </div>

              {/* Contenedor con Scroll y Animación de Contenido */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={biometricsStep}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    
                    {/* PASO 1: GENERALES / BÁSICOS */}
                    {biometricsStep === 1 && (
                      <div className="flex flex-col gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-amber-400/70 font-black uppercase tracking-wider block mb-1">Masa Total</span>
                            <span className="text-white font-bold text-sm">Peso Corporal *</span>
                          </div>
                          <div className="relative flex items-center">
                            <input type="number" placeholder="0.0" value={metricsForm.weight} onChange={(e) => setMetricsForm({...metricsForm, weight: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-right text-white font-mono font-black text-lg w-28 outline-none focus:border-amber-500/50" />
                            <span className="absolute left-3 text-xs font-bold text-white/30 font-sans pointer-events-none">kg</span>
                          </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-amber-400/70 font-black uppercase tracking-wider block mb-1">Estatura</span>
                            <span className="text-white font-bold text-sm">Altura Corporal</span>
                          </div>
                          <div className="relative flex items-center">
                            <input type="number" placeholder="0" value={metricsForm.height} onChange={(e) => setMetricsForm({...metricsForm, height: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-right text-white font-mono font-black text-lg w-28 outline-none focus:border-amber-500/50" />
                            <span className="absolute left-3 text-xs font-bold text-white/30 font-sans pointer-events-none">cm</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASO 2: COMPOSICIÓN CORPORAL */}
                    {biometricsStep === 2 && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "% Grasa", key: "body_fat", unit: "%" },
                            { label: "Masa Muscular", key: "muscle_mass", unit: "kg" },
                            { label: "Agua Corporal", key: "body_water", unit: "%" },
                            { label: "Grasa Visceral", key: "visceral_fat", unit: "lvl" }
                          ].map((field) => (
                            <div key={field.key} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/20 transition-all">
                              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block mb-2">{field.label}</span>
                              <div className="relative flex items-center w-full">
                                <input type="number" placeholder="--" value={metricsForm[field.key]} onChange={(e) => setMetricsForm({...metricsForm, [field.key]: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-white font-mono font-black text-base outline-none focus:border-amber-500/50 text-right" />
                                <span className="absolute right-3 text-xs font-bold text-white/30">{field.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* SECCIÓN COLAPSABLE: MÉTRICAS AVANZADAS */}
                        <div className="border border-white/5 rounded-2xl bg-black/20 overflow-hidden">
                          <button type="button" onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)} className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-amber-400/80 hover:bg-white/5 transition-all">
                            <span className="flex items-center gap-1.5">
                              <Activity size={14} /> {showAdvancedMetrics ? "Ocultar métricas avanzadas" : "Mostrar métricas avanzadas"}
                            </span>
                            {showAdvancedMetrics ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          
                          <AnimatePresence>
                            {showAdvancedMetrics && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4 border-t border-white/5 pt-3 grid grid-cols-2 gap-3 bg-white/[0.01]">
                                <div>
                                  <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1">Índice IMC</label>
                                  <input type="number" placeholder="--" value={metricsForm.bmi} onChange={(e) => setMetricsForm({...metricsForm, bmi: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-amber-500/40" />
                                </div>
                                <div>
                                  <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1">Metabolismo Basal</label>
                                  <div className="relative flex items-center">
                                    <input type="number" placeholder="--" value={metricsForm.basal_metabolism} onChange={(e) => setMetricsForm({...metricsForm, basal_metabolism: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-white font-mono font-bold text-sm outline-none focus:border-amber-500/40 text-right" />
                                    <span className="absolute right-2.5 text-[9px] font-bold text-white/20">kcal</span>
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1">Suma de Pliegues (Plicómetro)</label>
                                  <div className="relative flex items-center">
                                    <input type="number" placeholder="--" value={metricsForm.skinfolds} onChange={(e) => setMetricsForm({...metricsForm, skinfolds: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-white font-mono font-bold text-sm outline-none focus:border-amber-500/40 text-right" />
                                    <span className="absolute right-2.5 text-[9px] font-bold text-white/20">mm</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* PASO 3: PERÍMETROS CORPORALES */}
                    {biometricsStep === 3 && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Pecho", key: "chest" },
                          { label: "Cintura", key: "waist" },
                          { label: "Cadera", key: "hip" },
                          { label: "Brazo", key: "bicep" },
                          { label: "Muslo", key: "thigh" },
                          { label: "Pantorrilla", key: "calf" }
                        ].map((p) => (
                          <div key={p.key} className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-amber-500/20 transition-all">
                            <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1.5">{p.label}</label>
                            <div className="relative flex items-center">
                              <input type="number" placeholder="--" value={metricsForm[p.key]} onChange={(e) => setMetricsForm({...metricsForm, [p.key]: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-white font-mono font-black text-sm text-right outline-none focus:border-amber-500/50" />
                              <span className="absolute right-3 text-[10px] font-bold text-white/20">cm</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Panel de Botones de Navegación Estático */}
              <div className="pt-4 shrink-0 border-t border-white/10 mt-2 flex gap-3">
                {biometricsStep > 1 && (
                  <button type="button" onClick={() => setBiometricsStep(prev => prev - 1)} className="flex-1 py-3.5 rounded-2xl font-bold text-xs text-white/70 bg-white/5 hover:bg-white/10 border border-white/5 transition flex items-center justify-center gap-1.5">
                    <ChevronLeft size={16} /> Atrás
                  </button>
                )}
                
                {biometricsStep < 3 ? (
                  <button type="button" onClick={() => setBiometricsStep(prev => prev + 1)} disabled={biometricsStep === 1 && !metricsForm.weight} className="flex-1 py-3.5 rounded-2xl font-bold text-xs text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-40 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10">
                    Continuar <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSaveBiometrics} disabled={!metricsForm.weight} className="flex-1 py-3.5 rounded-2xl font-bold text-xs text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 disabled:opacity-40 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20">
                    Guardar análisis <CheckCircle2 size={16} />
                  </button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}