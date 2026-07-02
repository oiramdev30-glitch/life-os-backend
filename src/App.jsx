import { useState, useEffect } from "react"
import { AnimatePresence, motion } from 'framer-motion'
import useStore from './store/useStore'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './pages/Dashboard'
import Sports from './pages/Sports'
import Study from './pages/Study'
import Habits from './pages/Habits'
import Finance from './pages/Finance'
import Social from './pages/Social'
import Mental from './pages/Mental'
import Focus from './pages/Focus'
import Productivity from './pages/Productivity'
import Trends from './pages/Trends'
import AICoach from './components/ui/AICoach'
import {
  LayoutDashboard, CircleDot, Activity,
  BookOpen, Zap, Brain, CreditCard, Smartphone, Target,
  WifiOff, CheckCircle2, AlertCircle, Info, X, TrendingUp
} from 'lucide-react'

const pages = {
  dashboard: Dashboard, sports: Sports,
  study: Study, habits: Habits, finance: Finance,
  social: Social, mental: Mental, focus: Focus,
  productivity: Productivity,
  trends: Trends,
}

// ─── TOAST SYSTEM ────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: CheckCircle2,
  error:   AlertCircle,
  info:    Info,
}
const TOAST_STYLES = {
  success: { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  color: '#4ADE80' },
  error:   { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.25)',   color: '#F43F5E' },
  info:    { bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.25)',  color: '#22D3EE' },
}

function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    window.showToast = ({ message, type = 'info', duration = 4000 }) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }
    return () => { delete window.showToast }
  }, [])

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map(toast => {
          const style  = TOAST_STYLES[toast.type] || TOAST_STYLES.info
          const Icon   = TOAST_ICONS[toast.type]  || Info
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 40,  scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto backdrop-blur-xl text-sm"
              style={{ 
                background: style.bg, 
                border: `1px solid ${style.border}`, 
                minWidth: 200, 
                maxWidth: 360,
                width: 'auto'
              }}
            >
              <Icon size={16} style={{ color: style.color, flexShrink: 0 }} />
              <p className="font-medium text-white flex-1 break-words">{toast.message}</p>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ─── OFFLINE BANNER ───────────────────────────────────────────────────────────
function OfflineBanner() {
  const { backendOnline } = useStore()
  if (backendOnline !== false) return null
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold text-amber-400 z-40"
      style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.2)' }}
    >
      <WifiOff size={13} />
      Backend sin conexión — los cambios no se guardarán
    </motion.div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { currentPage, mobileMenuOpen, setMobileMenuOpen, setCurrentPage, backendOnline } = useStore()
  const PageComponent = pages[currentPage] || Dashboard

  // ─── GESTOS TÁCTILES (Swipe) ──────────────────────────────────────────────
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      
      // Solo si es swipe horizontal y no es vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && !mobileMenuOpen) {
          // Swipe derecha → abrir drawer
          setMobileMenuOpen(true);
        } else if (diffX < 0 && mobileMenuOpen) {
          // Swipe izquierda → cerrar drawer
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mobileMenuOpen, setMobileMenuOpen]);

  return (
    <div className="flex flex-col h-[100dvh] text-white overflow-hidden bg-[#0B0E1A]">

      {/* Toast global */}
      <ToastContainer />

      {/* Banner offline */}
      <AnimatePresence>
        {backendOnline === false && <OfflineBanner key="offline" />}
      </AnimatePresence>

      {/* Fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[700px] h-[500px] -top-[15%] -left-[10%] bg-[radial-gradient(ellipse,rgba(59,130,246,0.15)_0%,transparent_65%)] blur-[60px]" />
        <div className="absolute w-[500px] h-[500px] -top-[5%] -right-[8%] bg-[radial-gradient(ellipse,rgba(99,102,241,0.12)_0%,transparent_65%)] blur-[70px]" />
        <div className="absolute w-[400px] h-[350px] bottom-[-5%] left-[35%] bg-[radial-gradient(ellipse,rgba(6,182,212,0.08)_0%,transparent_65%)] blur-[80px]" />
      </div>

      <div className="relative flex flex-1 min-h-0 z-10">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />

          <main 
            className="flex-1 overflow-y-auto no-scrollbar"
            ref={(el) => {
              if (el) {
                window.__mainScrollContainer = el;
              }
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="pb-32 md:pb-10"
                onAnimationComplete={() => {
                  const container = window.__mainScrollContainer;
                  if (container) {
                    container.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <PageComponent />
              </motion.div>
            </AnimatePresence>
          </main>

          <BottomNav />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />

          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.28 }}
            className="relative z-10 rounded-t-3xl p-6 overflow-y-auto"
            style={{ background: '#0F1015', borderTop: '1px solid rgba(255,255,255,0.08)', maxHeight: '85vh' }}>

            <div className="w-12 h-1.5 rounded-full mx-auto mb-8 bg-white/20" />

            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8E9E] mb-3">Principal</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
                { id: 'habits',    icon: Zap,             label: 'Hábitos' },
                { id: 'sports',    icon: Activity,        label: 'Deporte' },
                { id: 'finance',   icon: CreditCard,      label: 'Finanzas' },
                { id: 'trends',    icon: TrendingUp,      label: 'Tendencias' },
              ].map((item) => {
                const active = currentPage === item.id
                return (
                  <button key={item.id} onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false) }}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${active ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    <item.icon size={22} className={active ? 'text-cyan-400' : 'text-white/60'} />
                    <span className={`text-sm font-semibold ${active ? 'text-cyan-400' : 'text-white/90'}`}>{item.label}</span>
                  </button>
                )
              })}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8E9E] mb-3">Más Herramientas</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'focus',        icon: CircleDot,  label: 'Enfoque' },
                { id: 'study',        icon: BookOpen,   label: 'Estudio' },
                { id: 'mental',       icon: Brain,      label: 'Mental' },
                { id: 'social',       icon: Smartphone, label: 'Social' },
                { id: 'productivity', icon: Target,     label: 'Tareas' },
              ].map((item) => {
                const active = currentPage === item.id
                return (
                  <button key={item.id} onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false) }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${active ? 'bg-blue-500/15 border border-blue-500/30' : 'bg-transparent border border-white/5 hover:bg-white/5'}`}>
                    <item.icon size={18} className={active ? 'text-blue-400' : 'text-[#8B8E9E]'} />
                    <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-blue-400' : 'text-[#8B8E9E]'}`}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}

      <AICoach />
    </div>
  )
}