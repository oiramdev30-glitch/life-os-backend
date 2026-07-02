import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon, Calendar } from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';

const API = 'http://localhost:8000/api/v1';

export default function Trends() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week'); // 'week' | 'month'
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  
  const { habits, financeTransactions, mentalLogs, runningLogs, gymSessions } = useStore();

  useEffect(() => {
    generateTrends();
  }, [habits, financeTransactions, mentalLogs, runningLogs, gymSessions, period]);

  const generateTrends = () => {
    const today = new Date();
    const days = period === 'week' ? 7 : 30;
    const dates = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Hábitos completados por día
    const habitCompletions = {};
    habits.forEach(h => {
      (h.logs || []).forEach(date => {
        if (dates.includes(date)) {
          habitCompletions[date] = (habitCompletions[date] || 0) + 1;
        }
      });
    });

    // Gastos por día
    const spendingByDay = {};
    financeTransactions.filter(t => t.tx_type === 'gasto').forEach(t => {
      if (dates.includes(t.date)) {
        spendingByDay[t.date] = (spendingByDay[t.date] || 0) + t.amount;
      }
    });

    // Estado de ánimo por día
    const moodByDay = {};
    mentalLogs.forEach(m => {
      if (dates.includes(m.date)) {
        moodByDay[m.date] = m.mood_value;
      }
    });

    // Sesiones de running y gym por día
    const runsByDay = {};
    runningLogs.forEach(r => {
      if (dates.includes(r.date)) {
        runsByDay[r.date] = (runsByDay[r.date] || 0) + 1;
      }
    });
    const gymsByDay = {};
    gymSessions.forEach(g => {
      if (dates.includes(g.date)) {
        gymsByDay[g.date] = (gymsByDay[g.date] || 0) + 1;
      }
    });

    const data = dates.map(date => ({
      day: new Date(date).toLocaleDateString('es-MX', { weekday: 'short' }),
      habits: habitCompletions[date] || 0,
      spending: spendingByDay[date] || 0,
      mood: moodByDay[date] || null,
      runs: runsByDay[date] || 0,
      gyms: gymsByDay[date] || 0,
    }));
    setWeeklyData(data);

    // Datos por categoría de gastos (últimos 30 días)
    const monthStart = new Date(today);
    monthStart.setDate(monthStart.getDate() - 30);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    
    const catData = {};
    financeTransactions
      .filter(t => t.tx_type === 'gasto' && t.date >= monthStartStr)
      .forEach(t => {
        catData[t.category] = (catData[t.category] || 0) + t.amount;
      });
    
    const colors = ['#22D3EE', '#C084FC', '#FB923C', '#4ADE80', '#F87171', '#FACC15', '#818CF8'];
    const catArray = Object.entries(catData).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
    setCategoryData(catArray);

    // Datos de estado de ánimo mensual
    const moodCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    mentalLogs.filter(m => m.date >= monthStartStr).forEach(m => {
      if (moodCount[m.mood_value] !== undefined) {
        moodCount[m.mood_value]++;
      }
    });
    const moodLabels = ['Muy bajo', 'Bajo', 'Neutro', 'Bien', 'Excelente'];
    const moodColors = ['#EF4444', '#FB923C', '#FACC15', '#22D3EE', '#4ADE80'];
    const moodArray = Object.entries(moodCount).map(([value, count]) => ({
      label: moodLabels[parseInt(value) - 1] || 'Desconocido',
      count,
      color: moodColors[parseInt(value) - 1] || '#8B8E9E'
    }));
    setMoodData(moodArray);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Tendencias</h1>
            <p className="text-[#8B8E9E] text-sm font-medium tracking-wide uppercase mt-1">
              Análisis de tu progreso
            </p>
          </div>
          <div className="flex gap-2">
            {['week', 'month'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  period === p
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-[#8B8E9E] border border-white/10 hover:bg-white/10'
                }`}
              >
                {p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfica de hábitos y estado de ánimo */}
        <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-cyan-400" />
            <h2 className="font-semibold text-white">Hábitos completados</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fill: '#8B8E9E', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8B8E9E', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#141728', border: 'none', borderRadius: 12 }} />
              <Line type="monotone" dataKey="habits" stroke="#22D3EE" strokeWidth={2} dot={{ fill: '#22D3EE' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de gastos */}
        <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-emerald-400" />
            <h2 className="font-semibold text-white">Gastos diarios</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fill: '#8B8E9E', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8B8E9E', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#141728', border: 'none', borderRadius: 12 }} />
              <Bar dataKey="spending" fill="#F87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de gastos por categoría */}
        {categoryData.length > 0 && (
          <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon size={16} className="text-purple-400" />
              <h2 className="font-semibold text-white">Gastos por categoría</h2>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141728', border: 'none', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                      <span className="text-white/80">{cat.name}</span>
                    </div>
                    <span className="text-white font-medium">${cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Distribución de estado de ánimo */}
        {moodData.some(m => m.count > 0) && (
          <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-amber-400" />
              <h2 className="font-semibold text-white">Estado de ánimo (30 días)</h2>
            </div>
            <div className="space-y-2">
              {moodData.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[#8B8E9E] w-20">{m.label}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${moodData.length ? (m.count / Math.max(...moodData.map(x => x.count)) * 100) : 0}%`,
                        background: m.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/60 w-8 text-right">{m.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sesiones de deporte */}
        <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-orange-400" />
            <h2 className="font-semibold text-white">Sesiones de deporte</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fill: '#8B8E9E', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8B8E9E', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#141728', border: 'none', borderRadius: 12 }} />
              <Bar dataKey="runs" fill="#22D3EE" radius={[4,4,0,0]} name="Running" />
              <Bar dataKey="gyms" fill="#C084FC" radius={[4,4,0,0]} name="Gym" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}