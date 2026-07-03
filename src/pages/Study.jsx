import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, X, Pencil, Trash2, BookOpen, Trophy, Zap, Check } from "lucide-react";
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import axios from "axios";

const API = "https://life-os-backend-production-63db.up.railway.app/api/v1/study";

const SKILL_COLORS = ["#22D3EE", "#67E8F9", "#FB923C", "#C084FC", "#F43F5E", "#4ADE80", "#FACC15", "#818CF8"];
const PLATFORMS = ["Universidad", "Udemy", "Coursera", "YouTube", "Frontend Masters", "Libro", "Otro"];

// --- MODALES REUTILIZABLES ---
function SkillModal({ onClose, onSave, editItem }) {
  const [name, setName] = useState(editItem?.name || "");
  const [level, setLevel] = useState(editItem?.level || 50);
  const [target, setTarget] = useState(editItem?.target || 80);
  const [color, setColor] = useState(editItem?.color || SKILL_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    await onSave({ ...(editItem || {}), name: name.trim(), level, target, color });
    setIsSaving(false);
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-sm rounded-3xl p-6 bg-[#141728] border border-white/10" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold">{editItem ? "Editar skill" : "Nueva skill"}</h3>
          <button onClick={onClose} className="text-white/40"><X size={20} /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: React..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4" />
        <label className="text-xs text-white block mb-2">Nivel actual: {level}%</label>
        <input type="range" min={0} max={100} value={level} onChange={e => setLevel(+e.target.value)} className="w-full mb-4 accent-cyan-400" />
        <label className="text-xs text-white block mb-2">Meta: {target}%</label>
        <input type="range" min={0} max={100} value={target} onChange={e => setTarget(+e.target.value)} className="w-full mb-4 accent-purple-400" />
        <div className="flex gap-2 flex-wrap mb-5">
          {SKILL_COLORS.map(c => <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-xl" style={{ background: c, border: color === c ? "2px solid white" : "none" }} />)}
        </div>
        <button onClick={handleSave} disabled={isSaving} className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 disabled:opacity-50">
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function CourseModal({ onClose, onSave, editItem }) {
  const [title, setTitle] = useState(editItem?.title || "");
  const [platform, setPlatform] = useState(editItem?.platform || "Udemy");
  const [progress, setProgress] = useState(editItem?.progress || 0);
  const [color, setColor] = useState(editItem?.color || "#22D3EE");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    await onSave({ ...(editItem || {}), title: title.trim(), platform, progress, color });
    setIsSaving(false);
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-sm rounded-3xl p-6 bg-[#141728] border border-white/10" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold">{editItem ? "Editar curso" : "Nuevo curso"}</h3>
          <button onClick={onClose} className="text-white/40"><X size={20} /></button>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4" />
        <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4">
          {PLATFORMS.map(p => <option key={p} value={p} className="bg-[#141728]">{p}</option>)}
        </select>
        <label className="text-xs text-white block mb-2">Progreso: {progress}%</label>
        <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(+e.target.value)} className="w-full mb-4 accent-cyan-400" />
        <div className="flex gap-2 flex-wrap mb-5">
          {SKILL_COLORS.map(c => <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-xl" style={{ background: c, border: color === c ? "2px solid white" : "none" }} />)}
        </div>
        <button onClick={handleSave} disabled={isSaving} className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 disabled:opacity-50">
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function StudyLogModal({ onClose, onSave }) {
  const [hours, setHours] = useState(1);
  const [topic, setTopic] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    await onSave({ hours, topic });
    setIsSaving(false);
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-sm rounded-3xl p-6 bg-[#141728] border border-white/10" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold">Registrar sesión</h3>
          <button onClick={onClose} className="text-white/40"><X size={20} /></button>
        </div>
        <label className="text-xs text-white block mb-2">Horas: {hours}h</label>
        <input type="range" min={0.5} max={8} step={0.5} value={hours} onChange={e => setHours(+e.target.value)} className="w-full mb-4 accent-cyan-400" />
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Tema (opcional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-5" />
        <button onClick={handleSave} disabled={isSaving} className="w-full py-3 rounded-2xl font-bold text-black bg-cyan-400 disabled:opacity-50">
          {isSaving ? "Guardando..." : "Registrar"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- MAIN COMPONENT ---
export default function Study() {
  const [skills, setSkills] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studyLogs, setStudyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const [editSkill, setEditSkill] = useState(null);
  const [editCourse, setEditCourse] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resSkills, resCourses, resLogs] = await Promise.all([
        axios.get(`${API}/skills`),
        axios.get(`${API}/courses`),
        axios.get(`${API}/logs`)
      ]);
      setSkills(resSkills.data);
      setCourses(resCourses.data);
      setStudyLogs(resLogs.data);
      setApiError(false);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSkill = async (data) => {
    try {
      if (data.id) await axios.put(`${API}/skills/${data.id}`, data);
      else await axios.post(`${API}/skills`, data);
      await fetchData();
      window.showToast?.({ message: data.id ? 'Skill actualizada' : 'Skill agregada', type: 'success' });
    } catch { window.showToast?.({ message: 'Error al guardar skill', type: 'error' }); }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('¿Eliminar esta skill?')) return;
    try {
      await axios.delete(`${API}/skills/${id}`);
      await fetchData();
      window.showToast?.({ message: 'Skill eliminada', type: 'info' });
    } catch { window.showToast?.({ message: 'Error al eliminar', type: 'error' }); }
  };

  const handleSaveCourse = async (data) => {
    try {
      if (data.id) await axios.put(`${API}/courses/${data.id}`, data);
      else await axios.post(`${API}/courses`, data);
      await fetchData();
      window.showToast?.({ message: data.id ? 'Curso actualizado' : 'Curso agregado', type: 'success' });
    } catch { window.showToast?.({ message: 'Error al guardar curso', type: 'error' }); }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('¿Eliminar este curso?')) return;
    try {
      await axios.delete(`${API}/courses/${id}`);
      await fetchData();
      window.showToast?.({ message: 'Curso eliminado', type: 'info' });
    } catch { window.showToast?.({ message: 'Error al eliminar', type: 'error' }); }
  };

  const handleLogStudy = async (data) => {
    try {
      await axios.post(`${API}/logs`, data);
      await fetchData();
      window.showToast?.({ message: `Sesión de ${data.hours}h registrada`, type: 'success' });
    } catch { window.showToast?.({ message: 'Error al registrar sesión', type: 'error' }); }
  };

  const totalHours = studyLogs.reduce((a, s) => a + s.hours, 0).toFixed(1);
  const avgHours   = studyLogs.length ? (studyLogs.reduce((a, s) => a + s.hours, 0) / studyLogs.length).toFixed(1) : 0;
  const xp         = Math.round(parseFloat(totalHours) * 1000);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Aprendizaje</h1>
            <p className="text-[#8B8E9E] text-xs font-bold uppercase tracking-widest mt-1">Desarrollo Profesional</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Star size={16} className="text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{xp.toLocaleString()} XP</span>
          </div>
        </motion.div>

        {apiError && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2 text-sm"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <BookOpen size={15} className="text-rose-400 shrink-0" />
            <p className="text-rose-400">Sin conexión con el backend — los datos pueden no estar disponibles.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Horas Totales", value: `${totalHours}h`, color: "#22D3EE" },
            { label: "Promedio/día", value: `${avgHours}h`, color: "#C084FC" },
            { label: "Cursos activos", value: courses.length, color: "#4ADE80" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-3 flex flex-col items-center gap-1 bg-white/5 border border-white/10">
              <p className="text-white font-bold text-xl" style={{ color }}>{value}</p>
              <p className="text-[#8B8E9E] text-[10px] text-center">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-white">Cursos Activos</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowLogModal(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Zap size={12}/> Registrar</button>
              <button onClick={() => { setEditCourse(null); setShowCourseModal(true); }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Plus size={12}/> Curso</button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {courses.map(course => (
              <div key={course.id} className="rounded-2xl p-4 bg-white/5 border border-white/10 group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#8B8E9E]">{course.platform}</p>
                    <h3 className="font-medium text-white">{course.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{course.progress}%</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditCourse(course); setShowCourseModal(true); }} className="p-1 text-white/40 hover:text-white"><Pencil size={12} /></button>
                      <button onClick={() => handleDeleteCourse(course.id)} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${course.progress}%`, background: course.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-white">Árbol de Habilidades</h2>
            <button onClick={() => { setEditSkill(null); setShowSkillModal(true); }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Plus size={12}/> Skill</button>
          </div>
          <div className="space-y-5">
            {skills.map(sk => (
              <div key={sk.id} className="group">
                <div className="flex justify-between text-sm mb-2">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: sk.color }} /><span className="text-white">{sk.name}</span></div>
                  <div className="flex gap-3 items-center">
                    <div><span className="font-bold" style={{ color: sk.color }}>{sk.level}%</span><span className="text-gray-500 text-xs ml-1">/ {sk.target}%</span></div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => { setEditSkill(sk); setShowSkillModal(true); }} className="p-1 text-white/40 hover:text-white"><Pencil size={11} /></button>
                      <button onClick={() => handleDeleteSkill(sk.id)} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={11} /></button>
                    </div>
                  </div>
                </div>
                <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute h-full opacity-20" style={{ width: `${sk.target}%`, background: sk.color }} />
                  <div className="absolute h-full" style={{ width: `${sk.level}%`, background: sk.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSkillModal && <SkillModal onClose={() => setShowSkillModal(false)} onSave={handleSaveSkill} editItem={editSkill} />}
        {showCourseModal && <CourseModal onClose={() => setShowCourseModal(false)} onSave={handleSaveCourse} editItem={editCourse} />}
        {showLogModal && <StudyLogModal onClose={() => setShowLogModal(false)} onSave={handleLogStudy} />}
      </AnimatePresence>
    </div>
  );
}