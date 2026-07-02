import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import { translations } from '../../i18n/translations';
import { Search, CloudSun, Menu, Plus, CreditCard, Target, Zap, X } from 'lucide-react';

export default function Topbar() {
  const { lang, setMobileMenuOpen, setCurrentPage } = useStore();
  const t = (key) => translations[lang]?.[key] || key;
  const [searchVal, setSearchVal] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [weather, setWeather] = useState(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSearchMobile, setShowSearchMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch clima
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=20.66&longitude=-103.35&current=temperature_2m&temperature_unit=celsius')
      .then(r => r.json())
      .then(d => setWeather(Math.round(d.current.temperature_2m)))
      .catch(() => setWeather(null));
  }, []);

  const PAGE_MAP = {
    'inicio': 'dashboard', 'dashboard': 'dashboard',
    'hábitos': 'habits', 'habitos': 'habits',
    'deporte': 'sports', 'running': 'sports', 'gym': 'sports',
    'finanzas': 'finance', 'dinero': 'finance',
    'enfoque': 'focus', 'focus': 'focus', 'pomodoro': 'focus',
    'estudio': 'study', 'study': 'study',
    'mental': 'mental', 'ánimo': 'mental',
    'social': 'social',
    'tareas': 'productivity', 'productividad': 'productivity',
  };

  const handleSearch = (e) => {
    if (e.key !== 'Enter') return;
    const key = searchVal.trim().toLowerCase();
    const target = PAGE_MAP[key];
    if (target) { 
      setCurrentPage(target); 
      setSearchVal('');
      setShowSearchMobile(false);
    }
  };

  const quickActions = [
    { id: 'finance', icon: CreditCard, label: 'Nuevo Gasto', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'productivity', icon: Target, label: 'Nueva Tarea', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'habits', icon: Zap, label: 'Check-in Hábito', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  const handleQuickAction = (pageId) => {
    setCurrentPage(pageId);
    setShowQuickMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 md:h-16 flex items-center px-3 md:px-6 border-b border-white/5 bg-[#0B0E1A]/80 backdrop-blur-xl">
        {/* Mobile: Menú + Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="rounded-xl border backdrop-blur-xl bg-white/5 border-white/10 w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 transition"
          >
            <Menu size={18} />
          </button>
          <span className="font-bold text-lg tracking-tighter text-white">Life OS</span>
        </div>

        {/* Desktop: Logo (solo escritorio) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-bold text-xl tracking-tighter text-white">Life OS</span>
        </div>

        {/* Barra de búsqueda - Desktop siempre visible, Mobile toggle */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className={`rounded-2xl border backdrop-blur-xl bg-white/5 border-white/10 flex items-center gap-3 px-4 py-2 w-full transition-all ${searchFocus ? 'ring-1 ring-cyan-400/50 border-cyan-500/30 bg-white/10' : ''}`}>
            <Search size={18} className="text-[#8B8E9E]" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Buscar página..."
              className="bg-transparent outline-none flex-1 text-sm text-white placeholder:text-[#8B8E9E]"
            />
            {searchVal && (
              <span className="text-[10px] text-[#8B8E9E] font-bold bg-white/5 px-2 py-0.5 rounded-lg">Enter ↵</span>
            )}
          </div>
        </div>

        {/* Mobile: Botón de búsqueda */}
        <div className="flex md:hidden items-center gap-1 ml-auto">
          <button
            onClick={() => setShowSearchMobile(!showSearchMobile)}
            className="rounded-xl border backdrop-blur-xl bg-white/5 border-white/10 w-9 h-9 flex items-center justify-center text-[#8B8E9E] hover:text-white hover:bg-white/10 transition"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Lado Derecho: Clima y Captura Rápida */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {/* Clima - siempre visible */}
          {weather !== null && (
            <div className="flex items-center gap-1.5 md:gap-2 rounded-xl md:rounded-2xl border backdrop-blur-xl bg-white/5 border-white/10 px-2.5 py-1.5 md:px-4 md:py-2">
              <CloudSun className="text-amber-400" size={isMobile ? 14 : 18} />
              <span className="text-white text-xs md:text-sm font-medium">{weather}°</span>
              {!isMobile && <span className="text-[#8B8E9E] text-xs">GDL</span>}
            </div>
          )}

          {/* Botón de Captura Rápida */}
          <button 
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="rounded-xl md:rounded-2xl bg-cyan-500 text-black w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] z-50"
          >
            <Plus size={isMobile ? 18 : 20} strokeWidth={2.5} className={`transition-transform duration-300 ${showQuickMenu ? 'rotate-45' : ''}`} />
          </button>
        </div>

        {/* Menú Desplegable de Captura Rápida */}
        <AnimatePresence>
          {showQuickMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowQuickMenu(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 md:top-14 right-0 w-48 md:w-52 bg-[#111520] border border-white/10 rounded-xl md:rounded-2xl shadow-2xl z-50 overflow-hidden p-2"
              >
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-2 pt-1">Captura Rápida</p>
                <div className="flex flex-col gap-1">
                  {quickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 hover:bg-white/5 rounded-xl transition-colors text-left"
                    >
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center ${action.bg}`}>
                        <action.icon size={isMobile ? 14 : 16} className={action.color} />
                      </div>
                      <span className="text-sm font-medium text-white/90">{action.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile: Barra de búsqueda desplegable */}
      <AnimatePresence>
        {showSearchMobile && isMobile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/5 bg-[#0B0E1A]/95 backdrop-blur-xl px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border backdrop-blur-xl bg-white/5 border-white/10 flex items-center gap-2 px-3 py-2">
                <Search size={16} className="text-[#8B8E9E]" />
                <input
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Buscar página..."
                  className="bg-transparent outline-none flex-1 text-sm text-white placeholder:text-[#8B8E9E]"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setShowSearchMobile(false)}
                className="text-[#8B8E9E] hover:text-white p-2"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}