import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Plus, Brain, BookOpen,
  Smartphone, Droplet, Dumbbell, X,
  MoreVertical, Edit2, Trash2, Sun, Sunset, Moon,
  Zap, TrendingUp, Target, Star, Flame, ChevronDown,
  Minus, Clock
} from "lucide-react";
import useStore from "../store/useStore";
import { translations } from "../i18n/translations";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

const TIME_BLOCKS = [
  { id: "mañana",  label: "Mañana",  icon: Sun,    range: "6–12h",  color: "#FACC15", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)" },
  { id: "tarde",   label: "Tarde",   icon: Sunset, range: "12–18h", color: "#FB923C", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)" },
  { id: "noche",   label: "Noche",   icon: Moon,   range: "18–24h", color: "#818CF8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.25)" },
  { id: "todo",    label: "Todo el día", icon: Clock, range: "Flexible", color: "#22D3EE", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.25)" },
];

const CATEGORY_COLORS = {
  Mental:  "#C084FC", Estudio: "#6366F1",
  Salud:   "#4ADE80", Fitness: "#FACC15", General: "#22D3EE",
};

const ICON_MAP = {
  Mental: Brain, Estudio: BookOpen, Social: Smartphone,
  Salud: Droplet, Fitness: Dumbbell,
};

// XP base por hábito completado
const XP_PER_HABIT = 50;
const XP_PER_LEVEL = 500;

// Niveles con nombres
const LEVEL_NAMES = [
  "Iniciado","Constante","Disciplinado","Forjado","Élite","Leyenda"
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

const getLocalDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const getLast7 = () => {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ dateStr: getLocalDateStr(d), label: DAY_NAMES[d.getDay()] });
  }
  return out;
};

const getDaysInMonth = () => {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const count = new Date(year, month+1, 0).getDate();
  const out = [];
  for (let d = 1; d <= count; d++) {
    out.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }
  return out;
};

const getCurrentBlock = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "mañana";
  if (h >= 12 && h < 18) return "tarde";
  return "noche";
};

// Calcular XP total desde habits
const calcXP = (habits) => {
  let xp = 0;
  habits.forEach(h => {
    const streak = h.streak || 0;
    const multiplier = streak >= 14 ? 3 : streak >= 7 ? 2 : streak >= 3 ? 1.5 : 1;
    if (h.done) xp += Math.round(XP_PER_HABIT * multiplier);
    xp += (h.logs?.length || 0) * 10;
  });
  return xp;
};

const getLevel = (xp) => {
  const level = Math.floor(xp / XP_PER_LEVEL);
  const cappedLevel = Math.min(level, LEVEL_NAMES.length - 1);
  const progress = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  return { level: cappedLevel + 1, name: LEVEL_NAMES[cappedLevel], progress };
};

// ─── STORAGE HELPERS (hábitos cuantitativos guardados local) ─────────────

const QUANT_KEY = "habits_quant_data";
const loadQuant = () => { try { return JSON.parse(localStorage.getItem(QUANT_KEY) || "{}"); } catch { return {}; } };
const saveQuant = (data) => localStorage.setItem(QUANT_KEY, JSON.stringify(data));

const BLOCK_KEY = "habits_block_data";
const loadBlocks = () => { try { return JSON.parse(localStorage.getItem(BLOCK_KEY) || "{}"); } catch { return {}; } };
const saveBlocks = (data) => localStorage.setItem(BLOCK_KEY, JSON.stringify(data));

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function XPBar({ habits }) {
  const xp = calcXP(habits);
  const { level, name, progress } = getLevel(xp);
  const completed = habits.filter(h => h.done).length;
  const total = habits.length;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-white/10 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.2), rgba(251,146,60,0.2))", border: "1px solid rgba(250,204,21,0.3)" }}>
            <Star size={20} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8E9E]">Nivel {level}</p>
            <p className="text-lg font-bold text-white leading-tight">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{xp.toLocaleString()}<span className="text-sm font-normal text-[#8B8E9E] ml-1">XP</span></p>
          <p className="text-[10px] text-[#8B8E9E]">{XP_PER_LEVEL - (xp % XP_PER_LEVEL)} para nivel {level + 1}</p>
        </div>
      </div>

      {/* XP Bar */}
      <div className="px-5 pb-4">
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #FACC15, #FB923C)" }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-white/5">
        {[
          { label: "Hoy", value: `${completed}/${total}`, color: "#4ADE80", icon: Target },
          { label: "Mejor racha", value: `${bestStreak}d`, color: "#FACC15", icon: Flame },
          { label: "Multiplicador", value: bestStreak >= 7 ? "×2" : bestStreak >= 3 ? "×1.5" : "×1", color: "#C084FC", icon: Zap },
        ].map((s, i) => (
          <div key={i} className={`flex flex-col items-center py-3 gap-1 ${i < 2 ? "border-r border-white/5" : ""}`}>
            <s.icon size={14} style={{ color: s.color }} />
            <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] uppercase tracking-widest text-[#8B8E9E]">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MonthHeatmap({ habits }) {
  const days = getDaysInMonth();
  const today = getLocalDateStr();
  const totalHabits = habits.length;

  const dayIntensity = (dateStr) => {
    if (totalHabits === 0) return 0;
    const done = habits.filter(h => h.logs?.includes(dateStr)).length;
    return done / totalHabits;
  };

  const getColor = (intensity, dateStr) => {
    if (dateStr > today) return "rgba(255,255,255,0.03)";
    if (intensity === 0) return "rgba(255,255,255,0.06)";
    if (intensity < 0.34) return "rgba(34,211,238,0.25)";
    if (intensity < 0.67) return "rgba(34,211,238,0.55)";
    return "rgba(34,211,238,0.9)";
  };

  const monthName = new Date().toLocaleString("es-MX", { month: "long" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl border border-white/10 p-5"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#8B8E9E]">Disciplina</p>
          <p className="text-base font-bold text-white capitalize">{monthName}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#8B8E9E]">
          <div className="flex gap-1 items-center">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span>0%</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(34,211,238,0.5)" }} />
            <span>50%</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(34,211,238,0.9)" }} />
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-[3px] flex-wrap">
        {/* Padding para que empiece en el día correcto */}
        {Array.from({ length: new Date(days[0]).getDay() || 7 === 0 ? 0 : (new Date(days[0]).getDay() === 0 ? 6 : new Date(days[0]).getDay() - 1) }).map((_, i) => (
          <div key={`pad-${i}`} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg opacity-0" />
        ))}
        {days.map((dateStr, i) => {
          const intensity = dayIntensity(dateStr);
          const isToday = dateStr === today;
          const dayNum = parseInt(dateStr.split("-")[2]);
          return (
            <motion.div
              key={dateStr}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.012, duration: 0.2 }}
              title={`${dateStr}: ${Math.round(intensity * 100)}%`}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[9px] font-bold cursor-default transition-transform hover:scale-110 relative"
              style={{
                background: getColor(intensity, dateStr),
                color: intensity > 0.5 ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.3)",
                outline: isToday ? "2px solid rgba(34,211,238,0.7)" : "none",
                outlineOffset: "1px",
              }}
            >
              {dayNum}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function QuantProgress({ habitId, goal, unit, onUpdate }) {
  const quantData = loadQuant();
  const today = getLocalDateStr();
  const key = `${habitId}_${today}`;
  const current = quantData[key]?.current || 0;

  const handleStep = (dir) => {
    const step = goal / 4;
    const next = Math.max(0, Math.min(goal, current + dir * step));
    const updated = { ...quantData, [key]: { current: Math.round(next * 10) / 10 } };
    saveQuant(updated);
    onUpdate(next >= goal);
  };

  const pct = Math.min((current / goal) * 100, 100);

  return (
    <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <button onClick={() => handleStep(-1)}
          className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition">
          <Minus size={12} />
        </button>
        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: pct >= 100 ? "#4ADE80" : "linear-gradient(90deg, #22D3EE, #818CF8)" }}
          />
        </div>
        <button onClick={() => handleStep(1)}
          className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition">
          <Plus size={12} />
        </button>
      </div>
      <p className="text-[10px] text-center font-bold"
        style={{ color: pct >= 100 ? "#4ADE80" : "#8B8E9E" }}>
        {current} / {goal} {unit} {pct >= 100 ? "✓" : ""}
      </p>
    </div>
  );
}

function HabitCard({ h, onToggle, onEdit, onDelete, last7 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(h.name);
  const [editCat, setEditCat] = useState(h.category);
  const menuRef = useRef(null);

  const Icon = ICON_MAP[h.category] || Brain;
  const color = CATEGORY_COLORS[h.category] || "#6366F1";
  const streak = h.streak || 0;
  const multiplier = streak >= 14 ? "×3" : streak >= 7 ? "×2" : streak >= 3 ? "×1.5" : null;

  const activeDays = (h.frequency && h.frequency !== "diario")
    ? h.frequency.split(",").filter(d => !["mañana","tarde","noche"].includes(d))
    : [];

  // Cuantitativo: meta guardada en localStorage
  const quantData = loadQuant();
  const today = getLocalDateStr();
  const quantKey = `${h.id}_${today}`;
  const quantCurrent = quantData[quantKey]?.current || 0;
  const blockData = loadBlocks();
  const habitMeta = blockData[h.id] || {};
  const isQuant = !!habitMeta.goal;

  useEffect(() => {
    const handleClickOut = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOut);
    return () => document.removeEventListener("mousedown", handleClickOut);
  }, []);

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await onEdit(h.id, { name: editName, category: editCat });
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className={`relative rounded-3xl border backdrop-blur-xl p-4 flex flex-col gap-3 transition-all group ${
        h.done
          ? "bg-white/[0.02] border-white/5"
          : "bg-white/[0.05] border-white/10 hover:bg-white/[0.07]"
      }`}
    >
      {isEditing ? (
        <div className="space-y-3 p-1">
          <input
            value={editName} onChange={e => setEditName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none"
          />
          <div className="flex gap-2 flex-wrap">
            {Object.keys(CATEGORY_COLORS).map(cat => (
              <button key={cat} onClick={() => setEditCat(cat)}
                className="px-3 py-1 rounded-xl text-xs font-bold border transition-all"
                style={{
                  background: editCat === cat ? `${CATEGORY_COLORS[cat]}20` : "rgba(255,255,255,0.04)",
                  borderColor: editCat === cat ? `${CATEGORY_COLORS[cat]}50` : "rgba(255,255,255,0.08)",
                  color: editCat === cat ? CATEGORY_COLORS[cat] : "rgba(255,255,255,0.4)",
                }}>{cat}</button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-[#8B8E9E] bg-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10">Cancelar</button>
            <button onClick={handleSaveEdit} className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl hover:bg-purple-500/20">Guardar</button>
          </div>
        </div>
      ) : (
        <>
          {/* Main row */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggle(h.id, h.done)}>

            {/* Icon */}
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all"
              style={{ background: h.done ? `${color}08` : `${color}18`, border: `1px solid ${color}${h.done ? "20" : "35"}` }}>
              <Icon size={22} style={{ color: h.done ? `${color}60` : color }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm truncate ${h.done ? "line-through text-white/30" : "text-white"}`}>
                  {h.name}
                </p>
                {multiplier && !h.done && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg shrink-0"
                    style={{ background: "rgba(250,204,21,0.15)", color: "#FACC15", border: "1px solid rgba(250,204,21,0.3)" }}>
                    {multiplier} XP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{h.category}</span>
                {streak > 0 && (
                  <span className="text-[10px] text-[#8B8E9E] flex items-center gap-0.5">
                    <Flame size={10} className="text-orange-400" /> {streak}d
                  </span>
                )}
              </div>
            </div>

            {/* Check + menu */}
            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
              <motion.div
                whileTap={{ scale: 0.85 }}
                onClick={() => onToggle(h.id, h.done)}
                className="cursor-pointer"
              >
                {h.done
                  ? <CheckCircle2 size={26} className="text-emerald-400" />
                  : <Circle size={26} className="text-white/15 hover:text-white/40 transition-colors" />
                }
              </motion.div>

              {/* 3-dot menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onPointerDown={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
                  className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition opacity-0 group-hover:opacity-100">
                  <MoreVertical size={16} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -4 }}
                      className="absolute right-0 mt-1 w-36 rounded-2xl overflow-hidden z-30"
                      style={{ background: "#111520", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
                    >
                      <button onPointerDown={e => { e.stopPropagation(); setIsEditing(true); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-white/80 hover:bg-white/5 transition text-left">
                        <Edit2 size={13} /> Editar
                      </button>
                      <button onPointerDown={e => { e.stopPropagation(); onDelete(h.id); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition border-t border-white/5 text-left">
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Cuantitativo */}
          {isQuant && !h.done && (
            <QuantProgress
              habitId={h.id}
              goal={habitMeta.goal}
              unit={habitMeta.unit || ""}
              onUpdate={(reached) => { if (reached) onToggle(h.id, false); }}
            />
          )}

          {/* Historial 7 días */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
            <div className="flex gap-1.5">
              {last7.map((day, idx) => {
                const isDone = h.logs?.includes(day.dateStr);
                const isToday = day.dateStr === getLocalDateStr();
                const activeDaysArr = (h.frequency && h.frequency !== "diario")
                  ? h.frequency.split(",").filter(d => WEEK_DAYS.includes(d))
                  : WEEK_DAYS;
                const isActive = activeDaysArr.length === 0 || activeDaysArr.includes(day.label);

                let bg, border;
                if (isDone) { bg = `${color}30`; border = `${color}70`; }
                else if (!isActive) { bg = "transparent"; border = "rgba(255,255,255,0.06)"; }
                else if (isToday) { bg = "transparent"; border = "rgba(255,255,255,0.25)"; }
                else { bg = "rgba(244,63,94,0.1)"; border = "rgba(244,63,94,0.35)"; }

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className={`text-[8px] font-bold ${isActive ? "text-[#8B8E9E]" : "text-white/15"}`}>{day.label}</span>
                    <motion.div
                      initial={false}
                      animate={{ scale: isDone ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.25 }}
                      className="w-4 h-4 rounded-full border transition-all"
                      style={{ background: bg, borderColor: border }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="text-[9px] font-bold px-2.5 py-1 rounded-full text-[#8B8E9E]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              🔥 {streak}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function TimeBlock({ block, habits, last7, onToggle, onEdit, onDelete, isActive }) {
  const BlockIcon = block.icon;
  const blockHabits = habits.filter(h => {
    const blockMeta = loadBlocks()[h.id] || {};
    return blockMeta.timeBlock === block.id;
  });
  const noBlock = habits.filter(h => !loadBlocks()[h.id]?.timeBlock);
  const toShow = block.id === "mañana" ? [...blockHabits, ...noBlock.filter((_, i) => i === -1)] : blockHabits;
  // Show "sin bloque" only under "mañana" section when block has no assignment

  const done = toShow.filter(h => h.done).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Block header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: block.bg, border: `1px solid ${block.border}` }}>
          <BlockIcon size={16} style={{ color: block.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">{block.label}</p>
            <span className="text-[10px] text-[#8B8E9E] font-medium">{block.range}</span>
            {isActive && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${block.color}20`, color: block.color, border: `1px solid ${block.color}40` }}>
                AHORA
              </span>
            )}
          </div>
        </div>
        {toShow.length > 0 && (
          <span className="text-xs font-bold" style={{ color: done === toShow.length ? "#4ADE80" : block.color }}>
            {done}/{toShow.length}
          </span>
        )}
      </div>

      {/* Habits */}
      {toShow.length > 0 ? (
        <div className="flex flex-col gap-2 pl-0">
          <AnimatePresence>
            {toShow.map(h => (
              <HabitCard key={h.id} h={h} last7={last7}
                onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 flex items-center justify-center">
          <p className="text-xs text-[#8B8E9E]">Sin hábitos asignados a este bloque</p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Habits() {
  const { lang, habits, fetchHabits, addHabit, toggleHabit, editHabit, deleteHabit } = useStore();
  const t = (key) => translations[lang]?.[key] || translations["en"]?.[key] || key;

  const [isAdding, setIsAdding] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [view, setView] = useState("bloques"); // "bloques" | "heatmap"
  const [activeBlock, setActiveBlock] = useState(getCurrentBlock());
  const [, forceUpdate] = useState(0); // para re-render tras cambios de localStorage

  // Nuevo hábito
  const [newHabit, setNewHabit] = useState({ name: "", category: "Mental", duration_minutes: 30 });
  const [selectedDays, setSelectedDays] = useState(WEEK_DAYS);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState("mañana");
  const [isQuant, setIsQuant] = useState(false);
  const [quantGoal, setQuantGoal] = useState(2);
  const [quantUnit, setQuantUnit] = useState("L");

  const last7 = getLast7();

  useEffect(() => {
    const load = async () => {
      try { await fetchHabits(); setApiOnline(true); }
      catch { setApiOnline(false); }
    };
    load();
  }, []);

  // Reloj para actualizar bloque activo
  useEffect(() => {
    const interval = setInterval(() => setActiveBlock(getCurrentBlock()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async () => {
    if (!newHabit.name.trim()) return;
    try {
      const frequency = selectedDays.join(",");
      const saved = await addHabit({ ...newHabit, frequency });
      // Guardar metadatos en localStorage
      if (saved?.id) {
        const blocks = loadBlocks();
        blocks[saved.id] = {
          timeBlock: selectedTimeBlock,
          ...(isQuant ? { goal: quantGoal, unit: quantUnit } : {}),
        };
        saveBlocks(blocks);
        forceUpdate(n => n + 1);
      }
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
    setNewHabit({ name: "", category: "Mental", duration_minutes: 30 });
    setSelectedDays(WEEK_DAYS);
    setSelectedTimeBlock("mañana");
    setIsQuant(false);
    setIsAdding(false);
  };

  const handleToggle = async (id, done) => {
    try { await toggleHabit(id, done); forceUpdate(n => n + 1); }
    catch { setApiOnline(false); }
  };

  const handleEdit = async (id, data) => {
    try { await editHabit(id, data); setApiOnline(true); }
    catch { setApiOnline(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHabit(id);
      const blocks = loadBlocks();
      delete blocks[id];
      saveBlocks(blocks);
      const quant = loadQuant();
      Object.keys(quant).filter(k => k.startsWith(`${id}_`)).forEach(k => delete quant[k]);
      saveQuant(quant);
      forceUpdate(n => n + 1);
      setApiOnline(true);
    }
    catch { setApiOnline(false); }
  };

  // Separar hábitos con/sin bloque
  const getBlockHabits = (blockId) => {
    return habits.filter(h => {
      const meta = loadBlocks()[h.id] || {};
      return meta.timeBlock === blockId;
    });
  };
  const unassigned = habits.filter(h => !loadBlocks()[h.id]?.timeBlock);

  const toggleDay = (day) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  return (
    <div className="min-h-screen pb-36 px-4 pt-6 md:px-6 font-sans" style={{ background: "transparent" }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight text-white">{t("title_habits") || "Hábitos"}</h1>
            <p className="text-[#8B8E9E] text-xs font-bold tracking-widest uppercase mt-1">Sistema de disciplina</p>
          </motion.div>
          <div className="flex items-center gap-2">
            {!apiOnline && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                sin conexión
              </span>
            )}
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-2.5 rounded-2xl font-bold transition text-sm">
              <Plus size={16} /> Nuevo
            </button>
          </div>
        </div>

        {/* ── XP BAR ── */}
        <XPBar habits={habits} />

        {/* ── VIEW TABS ── */}
        <div className="flex gap-2 bg-white/[0.04] p-1 rounded-2xl border border-white/10">
          {[
            { id: "bloques", label: "Timeline", icon: Sun },
            { id: "heatmap", label: "Heatmap", icon: TrendingUp },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                view === tab.id
                  ? "bg-white/10 text-white border border-white/15"
                  : "text-[#8B8E9E] hover:text-white"
              }`}>
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ADD FORM ── */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="rounded-3xl border border-white/15 p-5 flex flex-col gap-4"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}
            >
              <input
                autoFocus
                placeholder="Nombre del hábito…"
                value={newHabit.name}
                onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/40 transition"
              />

              {/* Categoría */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8E9E] mb-2">Categoría</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <button key={cat} onClick={() => setNewHabit({ ...newHabit, category: cat })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        background: newHabit.category === cat ? `${CATEGORY_COLORS[cat]}20` : "rgba(255,255,255,0.04)",
                        borderColor: newHabit.category === cat ? `${CATEGORY_COLORS[cat]}50` : "rgba(255,255,255,0.08)",
                        color: newHabit.category === cat ? CATEGORY_COLORS[cat] : "rgba(255,255,255,0.4)",
                      }}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Bloque de tiempo */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8E9E] mb-2">Momento del día</p>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_BLOCKS.map(block => {
                    const BlockIcon = block.icon;
                    const isSelected = selectedTimeBlock === block.id;
                    return (
                      <button key={block.id} onClick={() => setSelectedTimeBlock(block.id)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all"
                        style={{
                          background: isSelected ? block.bg : "rgba(255,255,255,0.03)",
                          borderColor: isSelected ? block.border : "rgba(255,255,255,0.08)",
                        }}>
                        <BlockIcon size={18} style={{ color: isSelected ? block.color : "rgba(255,255,255,0.3)" }} />
                        <span className="text-[10px] font-bold leading-tight text-center" style={{ color: isSelected ? block.color : "rgba(255,255,255,0.4)" }}>{block.label}</span>
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{block.range}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Días */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8E9E] mb-2">Días</p>
                <div className="flex gap-2">
                  {WEEK_DAYS.map(day => {
                    const active = selectedDays.includes(day);
                    return (
                      <button key={day} onClick={() => toggleDay(day)}
                        className="w-9 h-9 rounded-full text-xs font-bold border transition-all"
                        style={{
                          background: active ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
                          borderColor: active ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.08)",
                          color: active ? "#22D3EE" : "rgba(255,255,255,0.3)",
                        }}>{day}</button>
                    );
                  })}
                </div>
              </div>

              {/* Cuantitativo toggle */}
              <div>
                <button onClick={() => setIsQuant(v => !v)}
                  className="flex items-center gap-2 text-xs font-bold text-[#8B8E9E] hover:text-white transition">
                  <div className={`w-8 h-4 rounded-full transition-all flex items-center ${isQuant ? "bg-cyan-500/40" : "bg-white/10"} px-0.5`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-all ${isQuant ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  Hábito cuantitativo (meta numérica)
                </button>
                <AnimatePresence>
                  {isQuant && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="flex gap-3 mt-3">
                        <div className="flex-1">
                          <p className="text-[10px] text-[#8B8E9E] mb-1">Meta</p>
                          <input type="number" min="0.5" step="0.5" value={quantGoal}
                            onChange={e => setQuantGoal(parseFloat(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-[#8B8E9E] mb-1">Unidad</p>
                          <input type="text" placeholder="L, km, págs…" value={quantUnit}
                            onChange={e => setQuantUnit(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 placeholder-white/20" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={handleAdd} disabled={!newHabit.name.trim()}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition hover:brightness-110 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #818CF8)" }}>
                  Guardar Hábito
                </button>
                <button onClick={() => setIsAdding(false)}
                  className="px-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CONTENT ── */}
        <AnimatePresence mode="wait">
          {view === "bloques" ? (
            <motion.div key="bloques" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-8">

              {/* Timeline vertical */}
              <div className="relative flex flex-col gap-8">
                {/* Línea vertical */}
                <div className="absolute left-[18px] top-8 bottom-8 w-px bg-gradient-to-b from-yellow-500/20 via-orange-500/20 to-purple-500/20" />

                {TIME_BLOCKS.filter(b => b.id !== "todo").map(block => {
                  const blockHabits = getBlockHabits(block.id);

                  return (
                    <div key={block.id} className="pl-10 flex flex-col gap-3">
                      {/* Dot en la línea */}
                      <div className="absolute left-[10px] w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          background: activeBlock === block.id ? block.bg : "#0B0E1A",
                          borderColor: block.border,
                          boxShadow: activeBlock === block.id ? `0 0 12px ${block.color}50` : "none",
                        }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: block.color, opacity: activeBlock === block.id ? 1 : 0.4 }} />
                      </div>

                      {/* Block header */}
                      <div className="flex items-center gap-3 mb-1">
                        <block.icon size={16} style={{ color: activeBlock === block.id ? block.color : "rgba(255,255,255,0.3)" }} />
                        <span className={`text-sm font-bold ${activeBlock === block.id ? "text-white" : "text-white/40"}`}>{block.label}</span>
                        <span className="text-[10px] text-[#8B8E9E]">{block.range}</span>
                        {activeBlock === block.id && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: `${block.color}20`, color: block.color, border: `1px solid ${block.color}40` }}>
                            AHORA
                          </span>
                        )}
                        {blockHabits.length > 0 && (
                          <span className="ml-auto text-xs font-bold" style={{ color: blockHabits.filter(h => h.done).length === blockHabits.length ? "#4ADE80" : block.color }}>
                            {blockHabits.filter(h => h.done).length}/{blockHabits.length}
                          </span>
                        )}
                      </div>

                      {/* Habits */}
                      {blockHabits.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          <AnimatePresence>
                            {blockHabits.map(h => (
                              <HabitCard key={h.id} h={h} last7={last7}
                                onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/8 px-4 py-3 text-center">
                          <p className="text-xs text-[#8B8E9E]/50">Sin hábitos para este bloque</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Sección "Todo el día" — siempre visible al final si hay hábitos ── */}
                {(() => {
                  const todoHabits = [...getBlockHabits("todo"), ...unassigned];
                  if (todoHabits.length === 0) return null;
                  const block = TIME_BLOCKS.find(b => b.id === "todo");
                  return (
                    <div className="pl-10 flex flex-col gap-3">
                      {/* Dot especial — sin pulso de "ahora" */}
                      <div className="absolute left-[10px] w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{ background: "#0B0E1A", borderColor: block.border }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: block.color, opacity: 0.6 }} />
                      </div>
                      <div className="flex items-center gap-3 mb-1">
                        <Clock size={16} style={{ color: block.color }} />
                        <span className="text-sm font-bold text-white/60">{block.label}</span>
                        <span className="text-[10px] text-[#8B8E9E]">{block.range}</span>
                        <span className="ml-auto text-xs font-bold" style={{ color: todoHabits.filter(h => h.done).length === todoHabits.length ? "#4ADE80" : block.color }}>
                          {todoHabits.filter(h => h.done).length}/{todoHabits.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <AnimatePresence>
                          {todoHabits.map(h => (
                            <HabitCard key={h.id} h={h} last7={last7}
                              onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>

          ) : (
            <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <MonthHeatmap habits={habits} />

              {/* Lista simple bajo el heatmap */}
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {habits.map(h => (
                    <HabitCard key={h.id} h={h} last7={last7}
                      onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {habits.length === 0 && !isAdding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <Zap size={28} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Sin hábitos aún</p>
              <p className="text-[#8B8E9E] text-sm mt-1">Crea tu primer hábito y empieza tu racha</p>
            </div>
            <button onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #22D3EE, #818CF8)" }}>
              <Plus size={16} /> Crear primer hábito
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}