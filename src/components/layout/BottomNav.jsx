import useStore from '../../store/useStore';
import { LayoutDashboard, Zap, Activity, CreditCard, MoreHorizontal } from 'lucide-react';

const ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { id: 'habits',    icon: Zap,             label: 'Hábitos' },
  { id: 'sports',    icon: Activity,        label: 'Deporte' }, 
  { id: 'finance',   icon: CreditCard,      label: 'Finanzas' },
  { id: 'more',      icon: MoreHorizontal,  label: 'Más' },
];

export default function BottomNav() {
  const { currentPage, setCurrentPage, setMobileMenuOpen } = useStore();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-8 bg-gradient-to-t from-[#0B0E1A] via-[#0B0E1A]/90 to-transparent">
      <div className="rounded-3xl border backdrop-blur-xl bg-white/5 border-white/10 flex items-center justify-between py-2 px-2 shadow-2xl relative z-10">
        {ITEMS.map((item) => {
          const active = currentPage === item.id && item.id !== 'more';
          return (
            <button 
              key={item.id} 
              onClick={() => item.id === 'more' ? setMobileMenuOpen(true) : setCurrentPage(item.id)}
              className={`flex-1 flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${active ? 'text-cyan-400' : 'text-[#8B8E9E] hover:text-white/70'}`}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} className={active ? "drop-shadow-[0_0_8px_rgb(34,211,238)]" : ""} />
              <span className="text-[10px] mt-1 font-medium tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}