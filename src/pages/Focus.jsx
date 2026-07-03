import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Plus, Minus, Flame,
  CheckCircle2, Clock, Target, ChevronRight, X
} from "lucide-react";
import axios from "axios";

const API = "https://life-os-backend-production-63db.up.railway.app/api/v1";

const PRESETS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "60 min", seconds: 60 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];

const SESSION_TAGS = ["trabajo", "estudio", "lectura", "codigo", "diseño", "otro"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// ─── RING PROGRESS ────────────────────────────────────────────────────────────
function RingTimer({ progress, timeLeft, isRunning, isPaused }) {
  const r = 110;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  const ringColor = isRunning
    ? "#22D3EE"
    : isPaused
    ? "#FB923C"
    : "#6366F1";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <div
        className="absolute rounded-full opacity-20 blur-2xl"
        style={{
          width: 200,
          height: 200,
          background: ringColor,
          transition: "background 0.5s",
        }}
      />
      <svg width={280} height={280} className="-rotate-90">
        <circle cx={140} cy={140} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
        <motion.circle
          cx={140}
          cy={140}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.5s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white tracking-tighter font-mono">
          {formatSeconds(timeLeft)}
        </span>
        <span className="text-xs uppercase tracking-widest text-white/40 mt-1">
          {isRunning ? "en sesión" : isPaused ? "pausado" : "listo"}
        </span>
      </div>
    </div>
  );
}

// ─── MODAL GUARDAR SESIÓN ─────────────────────────────────────────────────────
function SaveSessionModal({ duration, onSave, onDiscard }) {
  const [tag, setTag] = useState("trabajo");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    await onSave({ tag, note, duration_seconds: duration });
    setIsSaving(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-sm rounded-3xl p-6 z-10"
        style={{ background: "#141728", border: "1px solid rgba(255,255,255,0.1)" }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-cyan-500/15">
            <CheckCircle2 size={20} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold">¡Sesión completada!</p>
            <p className="text-[#8B8E9E] text-xs">{formatDuration(duration)} de enfoque</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
            Categoría
          </label>
          <div className="flex flex-wrap gap-2">
            {SESSION_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: tag === t ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)",
                  border: tag === t ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: tag === t ? "#22D3EE" : "#8B8E9E",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
            Nota (opcional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="¿En qué trabajaste?"
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white/40 transition-colors hover:text-white/60"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Descartar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#22D3EE" }}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const TIMER_KEY = "focus_timer_state";

const loadTimerState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (!saved) return null;
    if (saved.isRunning && saved.savedAt) {
      const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
      const newTimeLeft = Math.max(0, saved.timeLeft - elapsed);
      const newElapsed = saved.elapsedSeconds + elapsed;
      return {
        ...saved,
        timeLeft: newTimeLeft,
        elapsedSeconds: newElapsed,
        isRunning: newTimeLeft > 0,
        showSave: newTimeLeft === 0,
      };
    }
    return saved;
  } catch { return null; }
};

const saveTimerState = (state) => {
  localStorage.setItem(TIMER_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
};

const clearTimerState = () => localStorage.removeItem(TIMER_KEY);

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Focus() {
  const saved = loadTimerState();

  const [customMinutes, setCustomMinutes] = useState(saved?.customMinutes ?? 25);
  const [totalSeconds, setTotalSeconds] = useState(saved?.totalSeconds ?? 25 * 60);
  const [timeLeft, setTimeLeft] = useState(saved?.timeLeft ?? 25 * 60);
  const [isRunning, setIsRunning] = useState(saved?.isRunning ?? false);
  const [isPaused, setIsPaused] = useState(saved?.isPaused ?? false);
  const [elapsedSeconds, setElapsedSeconds] = useState(saved?.elapsedSeconds ?? 0);
  const [showSave, setShowSave] = useState(saved?.showSave ?? false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    saveTimerState({ customMinutes, totalSeconds, timeLeft, isRunning, isPaused, elapsedSeconds, showSave });
  }, [customMinutes, totalSeconds, timeLeft, isRunning, isPaused, elapsedSeconds, showSave]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/focus/sessions`);
      setSessions(res.data);
    } catch {
      // backend no disponible aún
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setShowSave(true);
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(totalSeconds);
    setElapsedSeconds(0);
    setShowSave(false);
    clearTimerState();
  };

  const applyPreset = (seconds) => {
    if (isRunning) return;
    setTotalSeconds(seconds);
    setTimeLeft(seconds);
    setCustomMinutes(Math.floor(seconds / 60));
    setElapsedSeconds(0);
    setIsPaused(false);
  };

  const adjustMinutes = (delta) => {
    if (isRunning) return;
    const newMin = Math.max(1, Math.min(180, customMinutes + delta));
    setCustomMinutes(newMin);
    setTotalSeconds(newMin * 60);
    setTimeLeft(newMin * 60);
    setElapsedSeconds(0);
    setIsPaused(false);
  };

  const handleSaveSession = async ({ tag, note, duration_seconds }) => {
    try {
      await axios.post(`${API}/focus/sessions`, { tag, note, duration_seconds });
      await fetchSessions();
      window.showToast?.({ message: `Sesión de ${formatDuration(duration_seconds)} guardada`, type: 'success' });
    } catch (e) {
      console.error("Error guardando sesión:", e);
      window.showToast?.({ message: 'Error al guardar sesión', type: 'error' });
    }
    setShowSave(false);
    clearTimerState();
    handleReset();
  };

  const handleDiscard = () => {
    setShowSave(false);
    clearTimerState();
    handleReset();
  };

  const progress = totalSeconds > 0 ? 1 - timeLeft / totalSeconds : 1;

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const todayMinutes = Math.floor(
    todaySessions.reduce((a, s) => a + (s.duration_seconds || 0), 0) / 60
  );
  const totalSessions = sessions.length;

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Enfoque</h1>
              <p className="text-[#8B8E9E] text-sm font-medium tracking-wide uppercase mt-1">
                Timer de Concentración
              </p>
            </div>
            {todayMinutes > 0 && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
              >
                <Flame size={16} className="text-cyan-400" />
                <span className="text-cyan-400 font-semibold text-sm">{todayMinutes} min hoy</span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sesiones hoy", value: todaySessions.length, icon: Target, color: "#22D3EE" },
            { label: "Minutos hoy", value: todayMinutes, icon: Clock, color: "#C084FC" },
            { label: "Total sesiones", value: totalSessions, icon: CheckCircle2, color: "#4ADE80" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3 flex flex-col items-center gap-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Icon size={16} style={{ color }} />
              <p className="text-white font-bold text-lg leading-none">{value}</p>
              <p className="text-[#8B8E9E] text-[10px] text-center leading-tight">{label}</p>
            </div>
          ))}
        </div>

        <motion.div
          className="rounded-3xl p-8 flex flex-col items-center gap-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <RingTimer
            progress={progress}
            timeLeft={timeLeft}
            isRunning={isRunning}
            isPaused={isPaused}
          />

          {!isRunning && !isPaused && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => adjustMinutes(-5)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Minus size={16} className="text-white" />
              </button>
              <span className="text-white/60 text-sm font-medium w-20 text-center">
                {customMinutes} minutos
              </span>
              <button
                onClick={() => adjustMinutes(5)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          )}

          {!isRunning && !isPaused && (
            <div className="flex gap-2 flex-wrap justify-center">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.seconds)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background:
                      totalSeconds === p.seconds
                        ? "rgba(99,102,241,0.25)"
                        : "rgba(255,255,255,0.06)",
                    border:
                      totalSeconds === p.seconds
                        ? "1px solid rgba(99,102,241,0.5)"
                        : "1px solid rgba(255,255,255,0.08)",
                    color: totalSeconds === p.seconds ? "#818CF8" : "#8B8E9E",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <RotateCcw size={18} className="text-white/60" />
            </button>

            {!isRunning && !isPaused && (
              <motion.button
                onClick={handleStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #22D3EE, #6366F1)" }}
              >
                <Play size={28} className="text-white ml-1" />
              </motion.button>
            )}
            {isRunning && (
              <motion.button
                onClick={handlePause}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #FB923C, #EF4444)" }}
              >
                <Pause size={28} className="text-white" />
              </motion.button>
            )}
            {isPaused && (
              <motion.button
                onClick={handleResume}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #22D3EE, #6366F1)" }}
              >
                <Play size={28} className="text-white ml-1" />
              </motion.button>
            )}

            <div className="w-12 h-12" />
          </div>
        </motion.div>

        {todaySessions.length > 0 && (
          <div
            className="rounded-3xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h2 className="text-white font-semibold mb-4">Sesiones de hoy</h2>
            <div className="space-y-2">
              {[...todaySessions]
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .map((s, i) => (
                  <div
                    key={s.id || i}
                    className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#22D3EE" }}
                      />
                      <div>
                        <p className="text-white text-sm font-medium capitalize">{s.tag}</p>
                        {s.note && <p className="text-[#8B8E9E] text-xs">{s.note}</p>}
                      </div>
                    </div>
                    <span className="text-[#8B8E9E] text-xs font-mono">
                      {formatDuration(s.duration_seconds)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {sessions.filter((s) => s.date !== todayStr).length > 0 && (
          <div
            className="rounded-3xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h2 className="text-white font-semibold mb-4">Historial reciente</h2>
            <div className="space-y-2">
              {sessions
                .filter((s) => s.date !== todayStr)
                .slice(0, 5)
                .map((s, i) => (
                  <div
                    key={s.id || i}
                    className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Clock size={14} className="text-white/30" />
                      <div>
                        <p className="text-white/70 text-sm capitalize">{s.tag}</p>
                        <p className="text-[#8B8E9E] text-xs">{s.date}</p>
                      </div>
                    </div>
                    <span className="text-[#8B8E9E] text-xs font-mono">
                      {formatDuration(s.duration_seconds)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSave && (
          <SaveSessionModal
            duration={elapsedSeconds}
            onSave={handleSaveSession}
            onDiscard={handleDiscard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}