import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/10" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded-lg w-3/4" />
          <div className="h-3 bg-white/10 rounded-lg w-1/2 mt-1" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded-lg w-full" />
        <div className="h-3 bg-white/10 rounded-lg w-5/6" />
        <div className="h-3 bg-white/10 rounded-lg w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonHabits() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white/10" />
            <div className="h-4 bg-white/10 rounded-lg w-24" />
          </div>
          <div className="h-3 bg-white/10 rounded-lg w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTasks() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded-lg w-3/4" />
            <div className="h-3 bg-white/10 rounded-lg w-1/2 mt-1" />
          </div>
          <div className="w-5 h-5 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}