import useStore from '../../store/useStore';
import { translations } from '../../i18n/translations';
import {
  LayoutDashboard, CircleDot, Activity,
  BookOpen, Zap, Brain, CreditCard, Smartphone, Target,
  TrendingUp
} from 'lucide-react';

const NAV = [
  { id: 'main', label: { es: 'Principal', en: 'Main' }, items: [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
    { id: 'habits',    icon: Zap,             label: 'Hábitos' },
    { id: 'sports',    icon: Activity,        label: 'Deporte' },
    { id: 'finance',   icon: CreditCard,      label: 'Finanzas' },
    { id: 'trends',    icon: TrendingUp,      label: 'Tendencias' },
  ]},
  { id: 'tools', label: { es: 'Herramientas', en: 'Tools' }, items: [
    { id: 'focus',        icon: CircleDot,  label: 'Enfoque' },
    { id: 'study',        icon: BookOpen,   label: 'Estudio' },
    { id: 'mental',       icon: Brain,      label: 'Mental' },
    { id: 'social',       icon: Smartphone, label: 'Social' },
    { id: 'productivity', icon: Target,     label: 'Tareas' },
  ]}
];

export default function Sidebar() {
  const { lang, currentPage, setCurrentPage } = useStore();
  
  return (
    <aside className="hidden md:flex flex-col h-screen w-[220px] lg:w-[240px] border-r border-white/5 bg-[#0B0E1A]/80 backdrop-blur-xl">
      {/* Logo - versión compacta para móvil/tablet */}
      <div className="px-4 lg:px-6 pt-6 pb-4 flex items-center gap-2 lg:gap-3">
        <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <span className="text-white font-bold text-sm lg:text-xl">L</span>
        </div>
        <div>
          <p className="font-bold text-lg lg:text-2xl tracking-tighter text-white">Life OS</p>
          <p className="text-[9px] lg:text-[10px] text-[#8B8E9E] -mt-0.5 font-medium tracking-wide uppercase">Personal System</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 lg:px-3 overflow-y-auto no-scrollbar pb-4">
        {NAV.map((section) => (
          <div key={section.id} className="mb-6 lg:mb-8">
            <p className="px-3 lg:px-4 mb-2 lg:mb-3 text-[9px] lg:text-[10px] font-bold tracking-widest text-[#8B8E9E] uppercase">
              {section.label[lang] || section.label.en}
            </p>
            <div className="space-y-0.5 lg:space-y-1">
              {section.items.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl transition-all text-sm lg:text-base ${
                      active 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                        : 'border border-transparent hover:bg-white/5 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} className="lg:w-5 lg:h-5" />
                    <span className="font-medium text-sm lg:text-base">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      {/* Footer - sin "Pro Plan" */}
      <div className="m-3 lg:m-4 p-3 lg:p-4 rounded-xl lg:rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-xl lg:rounded-2xl flex items-center justify-center text-sm lg:text-lg font-bold text-white shadow-lg">
            O
          </div>
          <div>
            <p className="font-semibold text-white text-sm lg:text-base">Oiram</p>
            <p className="text-[10px] lg:text-xs text-[#8B8E9E] font-medium">Usuario</p>
          </div>
        </div>
      </div>
    </aside>
  );
}