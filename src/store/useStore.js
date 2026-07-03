import { create } from 'zustand';
import axios from 'axios';

const isNetworkError = (err) =>
  !err.response && (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED' || err.message === 'Network Error');

const getLocalDateStr = (d = new Date()) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const today = getLocalDateStr();
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = getLocalDateStr(tomorrowDate);

// ─── LIFE SCORE ────────────────────────────────────────────────────────────
const SCORE_WEIGHTS = { habits: 40, tasks: 30, focus: 20, garmin: 10 };

const computeLifeScore = ({ habits, taskSummary, focusSummary, metrics }) => {
  const totalH   = habits.length;
  const doneH    = habits.filter(h => h.done).length;
  const habitScore  = totalH > 0 ? (doneH / totalH) * 100 : 50;
  const taskScore   = taskSummary?.completion_rate  != null ? taskSummary.completion_rate  : 50;
  const focusMins   = focusSummary?.today_minutes   ?? 0;
  const focusScore  = Math.min((focusMins / 60) * 100, 100);
  const garminScore = metrics?.body_battery ?? 50;

  const raw =
    (habitScore  * SCORE_WEIGHTS.habits  +
     taskScore   * SCORE_WEIGHTS.tasks   +
     focusScore  * SCORE_WEIGHTS.focus   +
     garminScore * SCORE_WEIGHTS.garmin) / 100;

  return Math.round(Math.max(0, Math.min(100, raw)));
};

const useStore = create((set, get) => ({
  lang: 'es', 
  setLang: (lang) => set({ lang }),
  currentPage: 'dashboard', 
  setCurrentPage: (page) => set({ currentPage: page }),
  mobileMenuOpen: false, 
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  backendOnline: null,
  
  // ─── ESTADOS DE CARGA Y ERROR ─────────────────────────────────────────────
  isLoading: false,
  error: null,
  setError: (message) => set({ error: message }),
  clearError: () => set({ error: null }),

  // ─── HÁBITOS ───────────────────────────────────────────────────────────────
  habits: [],

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get('https://life-os-backend-production-63db.up.railway.app/api/v1/habits', { timeout: 4000 });
      set({ habits: res.data, backendOnline: true, isLoading: false });
    } catch (err) {
      const msg = isNetworkError(err) ? 'No hay conexión con el servidor' : 'Error al cargar hábitos';
      set({ error: msg, backendOnline: false, isLoading: false });
      window.showToast?.({ message: msg, type: 'error' });
    }
  },

  addHabit: async (newHabit) => {
    try {
      const res = await axios.post('https://life-os-backend-production-63db.up.railway.app/api/v1/habits', newHabit, { timeout: 4000 });
      set((state) => ({ habits: [...state.habits, res.data], backendOnline: true }));
      window.showToast?.({ message: 'Hábito agregado', type: 'success' });
      return res.data;
    } catch (err) {
      const msg = isNetworkError(err) ? 'Sin conexión al servidor' : 'Error al agregar hábito';
      if (isNetworkError(err)) set({ backendOnline: false });
      window.showToast?.({ message: msg, type: 'error' });
      throw err;
    }
  },

  toggleHabit: async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const todayStrLocal = getLocalDateStr();
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id === id) {
          const newLogs = newStatus
            ? [...(h.logs || []), todayStrLocal]
            : (h.logs || []).filter(d => d !== todayStrLocal);
          return { ...h, done: newStatus, streak: newStatus ? h.streak + 1 : Math.max(0, h.streak - 1), logs: newLogs };
        }
        return h;
      }),
    }));
    try {
      await axios.patch(`https://life-os-backend-production-63db.up.railway.app/api/v1/habits/${id}`, { done: newStatus }, { timeout: 4000 });
      set({ backendOnline: true });
    } catch (err) {
      if (isNetworkError(err)) set({ backendOnline: false });
      window.showToast?.({ message: 'Error al actualizar hábito', type: 'error' });
    }
  },

  editHabit: async (id, updatedData) => {
    set((state) => ({ habits: state.habits.map((h) => h.id === id ? { ...h, ...updatedData } : h) }));
    try {
      await axios.put(`https://life-os-backend-production-63db.up.railway.app/api/v1/habits/${id}`, updatedData, { timeout: 4000 });
      set({ backendOnline: true });
      window.showToast?.({ message: 'Hábito actualizado', type: 'success' });
    } catch (err) {
      if (isNetworkError(err)) set({ backendOnline: false });
      window.showToast?.({ message: 'Error al actualizar hábito', type: 'error' });
    }
  },

  deleteHabit: async (id) => {
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }));
    try {
      await axios.delete(`https://life-os-backend-production-63db.up.railway.app/api/v1/habits/${id}`, { timeout: 4000 });
      set({ backendOnline: true });
      window.showToast?.({ message: 'Hábito eliminado', type: 'info' });
    } catch (err) {
      if (isNetworkError(err)) set({ backendOnline: false });
      window.showToast?.({ message: 'Error al eliminar hábito', type: 'error' });
    }
  },

  // ─── TAREAS (Dashboard quick-add) ──────────────────────────────────────────
  taskList: [],
  tasks: {},

  addTask: (title) => set((state) => {
    const newTask = { id: `t${Date.now()}`, title, color: '#6366F1', date: getLocalDateStr(), note: '', isFocus: false };
    return { taskList: [...state.taskList, newTask], tasks: { ...state.tasks, [newTask.id]: false } };
  }),

  toggleTask: (id) => set((state) => ({ tasks: { ...state.tasks, [id]: !state.tasks[id] } })),

  updateTaskDetails: (id, newNote, newDate) => set((state) => ({
    taskList: state.taskList.map(t => t.id === id ? { ...t, note: newNote, date: newDate } : t)
  })),

  toggleFocusTask: (id) => set((state) => ({
    taskList: state.taskList.map(t => ({ ...t, isFocus: t.id === id ? !t.isFocus : false }))
  })),

  fetchTaskSummary: async () => {
    try {
      const res = await axios.get('https://life-os-backend-production-63db.up.railway.app/api/v1/tasks/summary', { timeout: 4000 });
      set({ taskSummary: res.data });
    } catch { /* usa el valor anterior si falla */ }
  },

  // ─── LIFE SCORE DINÁMICO ───────────────────────────────────────────────────
  lifeScore: null,
  taskSummary: null,
  focusSummary: null,

  fetchLifeScore: async () => {
    const { habits, metrics } = get();
    try {
      const [resTask, resFocus] = await Promise.allSettled([
        axios.get('https://life-os-backend-production-63db.up.railway.app/api/v1/tasks/summary', { timeout: 4000 }),
        axios.get('https://life-os-backend-production-63db.up.railway.app/api/v1/focus/summary', { timeout: 4000 }),
      ]);
      const taskSummary  = resTask.status  === 'fulfilled' ? resTask.value.data  : null;
      const focusSummary = resFocus.status === 'fulfilled' ? resFocus.value.data : null;

      const taskSummaryNorm = taskSummary
        ? { ...taskSummary, completion_rate: taskSummary.progress_pct ?? 0 }
        : null;

      const score = computeLifeScore({ habits, taskSummary: taskSummaryNorm, focusSummary, metrics });
      
      const currentState = get();
      if (
        currentState.lifeScore !== score ||
        JSON.stringify(currentState.taskSummary) !== JSON.stringify(taskSummary) ||
        JSON.stringify(currentState.focusSummary) !== JSON.stringify(focusSummary)
      ) {
        set({ lifeScore: score, taskSummary, focusSummary });
      }
    } catch {
      const score = computeLifeScore({ habits, taskSummary: null, focusSummary: null, metrics });
      const currentState = get();
      if (currentState.lifeScore !== score) {
        set({ lifeScore: score });
      }
    }
  },

  // ─── GARMIN ────────────────────────────────────────────────────────────────
  metrics: { body_battery: 0, vo2Max: 0, productivity: 74 },
  isSyncingGarmin: false,
  garminError: null,
  checkedInToday: false,

  setSubjectiveMetrics: (sleep, energy) => set((state) => ({
    metrics: { ...state.metrics, sleepQuality: sleep, energy: energy },
    checkedInToday: true,
  })),

  syncGarminData: async () => {
    if (get().isSyncingGarmin) return;
    set({ isSyncingGarmin: true, garminError: null });
    try {
      const res = await axios.get('https://life-os-backend-production-63db.up.railway.app/api/v1/garmin/sync', { timeout: 40000 });
      const data = res.data?.data;
      if (data) {
        set((state) => ({
          metrics: {
            ...state.metrics,
            body_battery: data.body_battery ?? state.metrics.body_battery,
            vo2Max:       data.vo2Max       ?? state.metrics.vo2Max,
          },
          backendOnline: true,
          garminError: null,
        }));
        get().fetchLifeScore();
        window.showToast?.({ message: 'Datos de Garmin sincronizados', type: 'success' });
      }
    } catch (err) {
      const msg = err.response?.data?.detail
        || (isNetworkError(err) ? 'Backend offline — arranca el servidor' : 'Error al conectar con Garmin');
      set({ garminError: msg, backendOnline: isNetworkError(err) ? false : true });
      window.showToast?.({ message: msg, type: 'error' });
    } finally {
      set({ isSyncingGarmin: false });
    }
  },
}));

export default useStore;