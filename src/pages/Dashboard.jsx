import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { translations } from '../i18n/translations';
import {
  TrendingUp, Zap, Target, Activity, Moon, Sparkles, Star,
  CheckCircle2, Plus, ChevronRight, Award, X, Calendar, AlignLeft, RefreshCw, Sliders
} from 'lucide-react';
import MorningBriefing from '../components/MorningBriefing';
import DataManager from '../components/DataManager';
import { SkeletonCard, SkeletonHabits, SkeletonTasks } from '../components/ui/SkeletonLoader';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }
});

export default function Dashboard() {
  const { 
    lang, habits, tasks, taskList, toggleTask, fetchHabits, fetchTaskSummary, addTask, 
    toggleHabit, updateTaskDetails, toggleFocusTask, metrics, 
    isSyncingGarmin, syncGarminData, checkedInToday, setSubjectiveMetrics,
    lifeScore, fetchLifeScore, focusSummary, taskSummary, isLoading
  } = useStore();
  
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  const [showLifeScoreDetails, setShowLifeScoreDetails] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskTab, setTaskTab] = useState('hoy'); 
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInSleep, setCheckInSleep] = useState(80);
  const [checkInEnergy, setCheckInEnergy] = useState(80);

  const [garminError, setGarminError] = useState(null);

  const handleSyncGarmin = async () => {
    setGarminError(null);
    try {
      await syncGarminData();
      await fetchLifeScore();
    } catch {
      setGarminError('No se pudo conectar con Garmin. Intenta de nuevo.');
      setTimeout(() => setGarminError(null), 4000);
    }
  };

  useEffect(() => { 
    fetchHabits(); 
    fetchTaskSummary();
    fetchLifeScore();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (habits.length > 0 || taskList.length > 0) {
        fetchLifeScore();
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [habits.length, taskList.length]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleExpand = (task) => {
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(task.id);
      setEditNote(task.note || '');
      setEditDate(task.date || '');
    }
  };

  const handleSaveTaskDetails = (id) => {
    updateTaskDetails(id, editNote, editDate);
    setExpandedTaskId(null);
  };

  const submitCheckIn = () => {
    setSubjectiveMetrics(Number(checkInSleep), Number(checkInEnergy));
    setShowCheckIn(false);
    window.showToast?.({ message: 'Reporte matutino guardado', type: 'success' });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  
  const sortedTasks = useMemo(() => {
    return [...taskList].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  }, [taskList]);

  const filteredTasks = useMemo(
    () => sortedTasks.filter(task => 
      taskTab === 'hoy' 
        ? (!task.date || task.date <= todayStr) 
        : task.date > todayStr
    ),
    [sortedTasks, taskTab, todayStr]
  );

  const currentFocusTask = useMemo(() => taskList.find(t => t.isFocus), [taskList]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('good_morning') : hour < 18 ? t('good_afternoon') : t('good_evening');
  
  const { habitsCompleted, totalHabits, profitPercent } = useMemo(() => {
    const habitsCompleted = habits.filter(h => h.done).length;
    const totalHabits     = habits.length;
    const profitPercent   = totalHabits ? Math.round((habitsCompleted / totalHabits) * 100) : 0;
    return { habitsCompleted, totalHabits, profitPercent };
  }, [habits]);

  const { totalTasks, completedTasks, taskPercent } = useMemo(() => {
    const totalTasks     = taskList.length;
    const completedTasks = taskList.filter(t => tasks[t.id]).length;
    const taskPercent    = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, taskPercent };
  }, [taskList, tasks]);

  // ─── Skeleton Loading ──────────────────────────────────────────────────────
  if (isLoading && habits.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-8 bg-white/5 rounded-2xl animate-pulse w-48" />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonHabits />
          <SkeletonTasks />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans selection:bg-purple-500/30">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <motion.div {...fade(0)} className="flex justify-between items-center">
          <div>
            <p className="text-[#8B8E9E] text-sm font-medium tracking-wide uppercase">
              {new Date().toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              {greeting}, Oiram!
            </h1>
          </div>
          
          <div className="flex gap-2">
            {!checkedInToday && (
              <button onClick={() => setShowCheckIn(true)} className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition touch-target">
                <Sliders size={28} /> Reporte Matutino
              </button>
            )}
            <div className="rounded-2xl border backdrop-blur-xl bg-white/5 border-white/10 p-3 shrink-0">
              <Sparkles size={24} className="text-cyan-400" />
            </div>
          </div>
        </motion.div>

        <MorningBriefing />

        <AnimatePresence>
          {showCheckIn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0F111A] border border-white/10 p-6 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2"><Sliders size={18} className="text-amber-400" /> Check-in de Hoy</h4>
                  <button onClick={() => setShowCheckIn(false)} className="text-[#8B8E9E] hover:text-white"><X size={18} /></button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-[#8B8E9E]"><span>¿Cómo te sientes de energía?</span><span className="text-amber-400 font-bold">{checkInEnergy}%</span></div>
                    <input type="range" min="10" max="100" value={checkInEnergy} onChange={(e) => setCheckInEnergy(e.target.value)} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-[#8B8E9E]"><span>Calidad de sueño percibida</span><span className="text-cyan-400 font-bold">{checkInSleep}%</span></div>
                    <input type="range" min="10" max="100" value={checkInSleep} onChange={(e) => setCheckInSleep(e.target.value)} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                </div>

                <button onClick={submitCheckIn} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-2xl shadow-lg hover:brightness-110 transition text-sm">
                  Guardar Reporte Diario
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.div {...fade(0.05)}>
          <div className="relative overflow-hidden rounded-3xl border backdrop-blur-xl p-6 transition-all hover:border-purple-500/30" 
               style={{ background: 'rgba(17, 21, 32, 0.7)', borderColor: 'rgba(124, 58, 237, 0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-purple-400" />
                  <p className="text-purple-400 text-xs uppercase tracking-wider font-semibold">Life Score</p>
                </div>
                {lifeScore === null ? (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-purple-400 animate-spin" />
                    <span className="text-white/40 text-sm">Calculando...</span>
                  </div>
                ) : (
                  <motion.p
                    key={lifeScore}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl font-bold text-white mt-1"
                  >
                    {lifeScore}
                  </motion.p>
                )}
                <div className={`flex items-center gap-1 mt-3 text-sm px-2 py-1 rounded-full w-fit ${
                  lifeScore >= 75 ? 'text-emerald-400 bg-emerald-400/10' :
                  lifeScore >= 50 ? 'text-amber-400 bg-amber-400/10' :
                  'text-rose-400 bg-rose-400/10'
                }`}>
                  <TrendingUp size={14} />
                  <span>{lifeScore >= 75 ? 'Excelente ritmo' : lifeScore >= 50 ? 'Progreso moderado' : 'Necesita atencion'}</span>
                </div>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-2xl shrink-0">
                <Award size={32} className="text-purple-400" />
              </div>
            </div>

            <AnimatePresence>
              {showLifeScoreDetails && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                    {[
                      { label: 'Habitos completados',   value: profitPercent,                                                              color: 'bg-emerald-400', weight: '40%' },
                      { label: 'Productividad (Tareas)', value: taskSummary?.progress_pct ?? taskPercent,                                  color: 'bg-cyan-400',    weight: '30%' },
                      { label: 'Sesiones de Focus',      value: Math.min(Math.round(((focusSummary?.today_minutes ?? 0) / 60) * 100), 100), color: 'bg-indigo-400',  weight: '20%' },
                      { label: 'Body Battery (Garmin)',  value: metrics?.body_battery ?? 0,                                                color: 'bg-purple-400',  weight: '10%' },
                    ].map(({ label, value, color, weight }) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-[#8B8E9E]">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white/30 text-[10px]">peso {weight}</span>
                            <span className="text-white">{value}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className={`${color} h-full rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={() => setShowLifeScoreDetails(!showLifeScoreDetails)} className="mt-6 w-full text-sm text-[#8B8E9E] hover:text-white border-t border-white/10 pt-4 flex justify-between items-center transition">
              {showLifeScoreDetails ? 'Ocultar detalles' : 'Ver detalle completo'}
              <ChevronRight size={16} className={`transition-transform duration-300 ${showLifeScoreDetails ? '-rotate-90' : 'rotate-0'}`} />
            </button>
          </div>
        </motion.div>

        <motion.div {...fade(0.1)}>
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-white/20 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-white/60 text-xs uppercase tracking-wide">Enfoque de hoy</span>
              <Star size={16} className="text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xl font-mono tracking-wide mt-3 text-white font-bold">
              {currentFocusTask ? currentFocusTask.title : "Fija tu objetivo principal usando la estrella"}
            </p>
            <div className="flex justify-between mt-5 text-white/50 text-xs items-center">
              <span className="bg-white/10 px-2 py-1 rounded font-bold tracking-wider">PRIORIDAD ALTA</span>
              <span className="font-bold text-white/80">LIFE·OS</span>
            </div>
          </div>
        </motion.div>

        <motion.div {...fade(0.15)}>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-[#8B8E9E] uppercase text-xs font-semibold tracking-wider">Estado actual</h3>
            <div className="flex flex-col items-end gap-1.5">
              <button onClick={handleSyncGarmin} disabled={isSyncingGarmin} className="text-xs text-cyan-400 font-bold flex items-center gap-1.5 hover:text-cyan-300 bg-cyan-400/5 px-2.5 py-1 rounded-xl border border-cyan-500/10 transition disabled:opacity-50 touch-target">
                <RefreshCw size={12} className={isSyncingGarmin ? "animate-spin" : ""} />
                {isSyncingGarmin ? 'Sincronizando...' : 'Sincronizar Garmin'}
              </button>
              <AnimatePresence>
                {garminError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl"
                  >
                    {garminError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, label: "Body Battery", value: metrics?.body_battery ?? 0, color: "#FACC15" },
              { icon: Target, label: "Productividad", value: `${taskPercent}%`, color: "#818CF8" },
              { icon: Activity, label: "VO2 Max", value: metrics?.vo2Max ?? 0, color: "#4ADE80" },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border backdrop-blur-xl p-5 bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#8B8E9E] text-xs mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-full shrink-0" style={{ background: `${stat.color}20` }}>
                    <stat.icon size={22} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fade(0.2)}>
          {(() => {
            const blockData   = (() => { try { return JSON.parse(localStorage.getItem('habits_block_data') || '{}'); } catch { return {}; } })();
            const currentHour = new Date().getHours();
            const activeBlock = currentHour >= 6 && currentHour < 12 ? 'mañana' : currentHour >= 12 && currentHour < 18 ? 'tarde' : 'noche';
            const blockLabels = { mañana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

            const blockHabits = habits.filter(h => {
              const assigned = blockData[h.id]?.timeBlock;
              return assigned ? assigned === activeBlock : activeBlock === 'mañana';
            });
            const pendingCount = blockHabits.filter(h => !h.done).length;

            return (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Hábitos de hoy</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8E9E] mt-0.5">
                      Bloque: {blockLabels[activeBlock]} · {pendingCount} pendientes
                    </p>
                  </div>
                  <div className="bg-emerald-500/20 px-3 py-1 rounded-full text-sm text-emerald-400 font-medium">
                    {habitsCompleted}/{totalHabits}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 space-y-1">
                  {blockHabits.length === 0 ? (
                    <p className="text-[#8B8E9E] text-sm text-center py-8">
                      {habits.length === 0 ? 'No hay hábitos configurados' : `Sin hábitos para esta ${blockLabels[activeBlock].toLowerCase()}`}
                    </p>
                  ) : (
                    blockHabits.map((h) => (
                      <div key={h.id} onClick={() => toggleHabit(h.id, h.done)}
                           className="flex justify-between items-center p-3 rounded-xl hover:bg-white/10 transition cursor-pointer touch-target">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${h.done ? 'bg-emerald-500/30' : 'bg-white/10'}`}>
                            {h.done ? <CheckCircle2 size={14} className="text-emerald-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                          </div>
                          <span className={`text-sm font-medium ${h.done ? 'text-white/70 line-through' : 'text-white'}`}>
                            {h.name}
                          </span>
                        </div>
                        <span className="text-xs text-[#8B8E9E] font-medium capitalize">{h.done ? 'completado' : 'pendiente'}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </motion.div>

        <motion.div {...fade(0.25)}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold text-lg">Tareas</h3>
            <div className="flex items-center gap-2">
              <div className="rounded-xl border backdrop-blur-xl bg-white/5 border-white/10 flex p-1">
                {['Hoy', 'Próximos'].map(tab => (
                  <button key={tab} onClick={() => setTaskTab(tab.toLowerCase())}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${taskTab === tab.toLowerCase() ? 'bg-cyan-500/20 text-cyan-400' : 'text-[#8B8E9E] hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsAddingTask(true)} className="text-cyan-400 text-xs flex items-center gap-1 bg-cyan-400/10 hover:bg-cyan-400/20 transition px-3 py-1.5 rounded-xl font-medium touch-target">
                <Plus size={14} /> Añadir
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isAddingTask && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden">
                <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 items-center">
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Nueva tarea..."
                    className="bg-transparent outline-none flex-1 px-3 text-sm text-white placeholder:text-[#8B8E9E]"
                  />
                  <button onClick={handleAddTask} className="bg-cyan-500/20 hover:bg-cyan-500/30 transition text-cyan-400 px-3 py-1.5 rounded-xl text-xs font-bold touch-target">
                    Guardar
                  </button>
                  <button onClick={() => setIsAddingTask(false)} className="text-[#8B8E9E] hover:text-white px-2 transition">
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <p className="text-[#8B8E9E] text-sm text-center py-6">No hay tareas</p>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20">
                  <div className="flex items-center gap-4 p-4">
                    <div 
                      onClick={() => toggleTask(task.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${tasks[task.id] ? 'bg-purple-500 border-purple-500' : 'border-white/40 hover:border-white/60'} touch-target`}
                    >
                      {tasks[task.id] && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: task.color }} />
                    <div onClick={() => handleExpand(task)} className="flex-1 cursor-pointer flex flex-col justify-center">
                      <span className={`text-sm font-medium ${tasks[task.id] ? 'line-through text-white/40' : 'text-white'}`}>
                        {task.title}
                      </span>
                      {task.note && !tasks[task.id] && <span className="text-xs text-[#8B8E9E] truncate mt-0.5">{task.note}</span>}
                      {task.date && (
                        <span className="text-[10px] text-[#8B8E9E] mt-0.5">
                          Fecha: {new Date(task.date).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    
                    <button onClick={() => toggleFocusTask(task.id)} className={`p-1 hover:scale-110 transition shrink-0 ${task.isFocus ? 'text-amber-400' : 'text-white/15 hover:text-white/40'} touch-target`}>
                      <Star size={16} className={task.isFocus ? "fill-amber-400" : ""} />
                    </button>

                    <div onClick={() => handleExpand(task)} className="cursor-pointer text-white/30 hover:text-white/70 p-1">
                      <ChevronRight size={18} className={`transition-transform duration-300 ${expandedTaskId === task.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedTaskId === task.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-black/20 border-t border-white/5 px-4 pb-4 pt-2">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5 border border-white/5">
                            <Calendar size={16} className="text-[#8B8E9E]" />
                            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-transparent outline-none text-sm text-white/90 font-medium w-full" style={{ colorScheme: 'dark' }} />
                          </div>
                          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-2.5 border border-white/5">
                            <AlignLeft size={16} className="text-[#8B8E9E] mt-0.5 shrink-0" />
                            <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Añadir detalles..." className="bg-transparent outline-none text-sm text-white/90 w-full resize-none min-h-[60px] placeholder:text-[#8B8E9E]" />
                          </div>
                          <div className="flex justify-end mt-1">
                            <button onClick={() => handleSaveTaskDetails(task.id)} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-1.5 rounded-xl text-xs font-bold transition touch-target">Guardar Cambios</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div {...fade(0.35)}>
          <DataManager />
        </motion.div>

        <div className="h-4" />
      </div>
    </div>
  );
}