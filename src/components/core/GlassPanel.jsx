export default function GlassPanel({ children, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 ${className}`}
      style={{
        background: 'rgba(17, 21, 32, 0.6)',
        borderColor: 'rgba(124, 58, 237, 0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        ...style,
      }}
    >
      {/* Brillo superior */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
        }}
      />
      {children}
    </div>
  );
}