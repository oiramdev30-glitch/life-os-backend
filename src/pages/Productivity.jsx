import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, ChevronRight, Flag, Clock,
  Trash2, Pencil, CheckCircle2, Circle, ArrowRight
} from "lucide-react";
import axios from "axios";
import useStore from "../store/useStore";

const API = "http://192.168.1.72:8000/api/v1";

const COLUMNS = [
  { id: "backlog",  label: "Backlog",      color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  { id: "todo",     label: "Por hacer",    color: "#FB923C", bg: "rgba(251,146,60,0.12)"  },
  { id: "doing",    label: "En progreso",  color: "#22D3EE", bg: "rgba(34,211,238,0.12)"  },
  { id: "done",     label: "Completado",   color: "#4ADE80", bg: "rgba(74,222,128,0.12)"  },
];

const PRIORITY_CONFIG = {
  low:    { label: "Baja",   color: "#64748B" },
  medium: { label: "Media",  color: "#FB923C" },
  high:   { label: "Alta",   color: "#F43F5E" },
};

const TAGS_OPTIONS = ["dev", "diseño", "estudio", "personal", "trabajo", "otro"];

// ─── MODAL NUEVA / EDITAR TAREA ───────────────────────────────────────────────
function TaskModal({ onClose, onSave, editTask, defaultColumn }) {
  const [title, setTitle] = useState(editTask?.title || "");
  const [column, setColumn] = useState(editTask?.column_id || defaultColumn || "todo");
  const [priority, setPriority] = useState(editTask?.priority || "medium");
  const [tags, setTags] = useState(editTask?.tags ? editTask.tags.split(",").filter(Boolean) : []);
  const [estimate, setEstimate] = useState(editTask?.estimate || "");
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (t) =>
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    await onSave({
      ...(editTask || {}),
      title: title.trim(),
      column_id: column,
      priority,
      tags: tags.join(","),
      estimate,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-3xl p-6 z-10"
        style={{ background: "#141728", border: "1px solid rgba(255,255,255,0.1)" }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold text-lg">
            {editTask ? "Editar tarea" : "Nueva tarea"}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
            Título
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="¿Qué hay que hacer?"
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
              Columna
            </label>
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "#141728" }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k} style={{ background: "#141728" }}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
            Estimación (ej: 2h, 30min)
          </label>
          <input
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="ej: 1h 30min"
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        </div>

        <div className="mb-5">
          <label className="text-[#8B8E9E] text-xs uppercase tracking-wide mb-2 block">
            Etiquetas
          </label>
          <div className="flex flex-wrap gap-2">
            {TAGS_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className="px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: tags.includes(t) ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                  border: tags.includes(t)
                    ? "1px solid rgba(99,102,241,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: tags.includes(t) ? "#818CF8" : "#8B8E9E",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
        >
          {isSaving ? "Guardando..." : editTask ? "Guardar cambios" : "Crear tarea"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── TARJETA DE TAREA ─────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onMove, colId }) {
  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const tagList = task.tags ? task.tags.split(",").filter(Boolean) : [];
  const isDone = colId === "done";

  const nextCol = COLUMNS[COLUMNS.findIndex((c) => c.id === colId) + 1];

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      onDelete(task.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl p-4 group relative"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
      whileHover={{ borderColor: "rgba(255,255,255,0.15)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: pCfg.color }}
          />
          <p
            className={`text-sm font-medium leading-snug ${isDone ? "line-through text-white/40" : "text-white/90"}`}
          >
            {task.title}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-2">
        {tagList.map((t) => (
          <span
            key={t}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ background: "rgba(255,255,255,0.08)", color: "#8B8E9E" }}
          >
            {t}
          </span>
        ))}
        {task.estimate && (
          <span className="flex items-center gap-1 text-[10px] text-[#8B8E9E]">
            <Clock size={10} />
            {task.estimate}
          </span>
        )}
        <span
          className="text-[10px] font-semibold ml-auto"
          style={{ color: pCfg.color }}
        >
          {pCfg.label}
        </span>
      </div>

      {nextCol && (
        <button
          onClick={() => onMove(task, nextCol.id)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
          style={{
            background: `${nextCol.color}15`,
            border: `1px solid ${nextCol.color}30`,
            color: nextCol.color,
          }}
        >
          Mover a {nextCol.label}
          <ArrowRight size={12} />
        </button>
      )}
    </motion.div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Productivity() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [defaultColumn, setDefaultColumn] = useState("todo");

  const { fetchLifeScore } = useStore();

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(res.data);
    } catch {
      // backend no disponible
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API}/tasks`, data);
      await fetchTasks();
      await fetchLifeScore();
      window.showToast?.({ message: 'Tarea creada', type: 'success' });
    } catch (e) {
      console.error(e);
      window.showToast?.({ message: 'Error al crear tarea', type: 'error' });
    }
  };

  const handleUpdate = async (data) => {
    try {
      await axios.put(`${API}/tasks/${data.id}`, data);
      await fetchTasks();
      await fetchLifeScore();
      window.showToast?.({ message: 'Tarea actualizada', type: 'success' });
    } catch (e) {
      console.error(e);
      window.showToast?.({ message: 'Error al actualizar tarea', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/tasks/${id}`);
      await fetchTasks();
      await fetchLifeScore();
      window.showToast?.({ message: 'Tarea eliminada', type: 'info' });
    } catch (e) {
      console.error(e);
      window.showToast?.({ message: 'Error al eliminar tarea', type: 'error' });
    }
  };

  const handleMove = async (task, newColId) => {
    try {
      await axios.put(`${API}/tasks/${task.id}`, { ...task, column_id: newColId });
      await fetchTasks();
      await fetchLifeScore();
    } catch (e) {
      console.error(e);
      window.showToast?.({ message: 'Error al mover tarea', type: 'error' });
    }
  };

  const handleSave = (data) => {
    if (data.id) {
      return handleUpdate(data);
    } else {
      return handleCreate(data);
    }
  };

  const openNew = (colId = "todo") => {
    setDefaultColumn(colId);
    setEditTask(null);
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.column_id === "done").length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Tareas</h1>
            <p className="text-[#8B8E9E] text-sm font-medium tracking-wide uppercase mt-1">
              Sprint Semanal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{
                background: progressPct === 100
                  ? "rgba(74,222,128,0.15)"
                  : "rgba(99,102,241,0.15)",
                border: progressPct === 100
                  ? "1px solid rgba(74,222,128,0.3)"
                  : "1px solid rgba(99,102,241,0.3)",
                color: progressPct === 100 ? "#4ADE80" : "#818CF8",
              }}
            >
              {doneTasks}/{totalTasks} · {progressPct}%
            </div>
            <button
              onClick={() => openNew()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              <Plus size={16} />
              Nueva
            </button>
          </div>
        </motion.div>

        {totalTasks > 0 && (
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #6366F1, #22D3EE)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        )}

        <div className="flex flex-col gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.column_id === col.id);
            return (
              <motion.div
                key={col.id}
                className="rounded-3xl p-5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: col.color }}
                    />
                    <h3 className="font-semibold text-white">{col.label}</h3>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${col.color}20`, color: col.color }}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNew(col.id)}
                    className="text-white/30 hover:text-white/70 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="space-y-2 min-h-[60px]">
                  <AnimatePresence>
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        colId={col.id}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onMove={handleMove}
                      />
                    ))}
                  </AnimatePresence>

                  {colTasks.length === 0 && (
                    <button
                      onClick={() => openNew(col.id)}
                      className="w-full py-5 rounded-2xl text-xs text-white/20 hover:text-white/40 transition-colors text-center"
                      style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
                    >
                      + Agregar tarea aquí
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <TaskModal
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            editTask={editTask}
            defaultColumn={defaultColumn}
          />
        )}
      </AnimatePresence>
    </div>
  );
}