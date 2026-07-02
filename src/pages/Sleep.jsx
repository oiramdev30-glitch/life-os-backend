import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const weekSleep = [
  { day: "L", h: 7.2, quality: 82 }, { day: "M", h: 6.5, quality: 68 },
  { day: "X", h: 7.8, quality: 88 }, { day: "J", h: 5.8, quality: 55 },
  { day: "V", h: 7.0, quality: 76 }, { day: "S", h: 8.5, quality: 92 },
  { day: "D", h: 8.2, quality: 90 },
];

const getQualityColor = (q) => q >= 85 ? "#22D3EE" : q >= 70 ? "#67E8F9" : q >= 60 ? "#FB923C" : "#F43F5E";

export default function Sleep() {
  const lastNight = weekSleep[weekSleep.length - 1];

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-36 px-4 pt-6 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        
        <div className="flex justify-between items-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight text-white">Sueño</h1>
            <p className="text-[#8B8E9E] text-sm font-medium tracking-wide uppercase mt-1">Análisis Semanal</p>
          </motion.div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-1.5 text-emerald-400 font-medium text-sm">
            <Star size={16} /> 78 pts
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Última Noche */}
          <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-8 flex flex-col items-center justify-center text-center">
            <h2 className="font-semibold text-lg text-white mb-6">Anoche</h2>
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke={getQualityColor(lastNight.quality)} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - lastNight.quality / 100)}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - lastNight.quality / 100) }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white">{lastNight.h}</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#8B8E9E] mt-1">horas</span>
              </div>
            </div>
          </div>

          {/* Horas de Sueño */}
          <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 p-6">
            <h2 className="font-semibold text-lg text-white mb-6">Horas de Sueño</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekSleep}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8B8E9E", fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="h" radius={[6, 6, 0, 0]}>
                    {weekSleep.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getQualityColor(entry.quality)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}