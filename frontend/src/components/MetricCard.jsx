const MetricCard = ({ label, value, subtext, accent = 'emerald' }) => {
  const accentStyles = {
    emerald: 'from-emerald-400/20 to-emerald-500/5 border-emerald-400/20 text-emerald-200',
    red: 'from-red-400/20 to-red-500/5 border-red-400/20 text-red-200',
    amber: 'from-amber-400/20 to-amber-500/5 border-amber-400/20 text-amber-200',
    slate: 'from-slate-400/20 to-slate-500/5 border-slate-400/20 text-slate-100',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-xl backdrop-blur ${accentStyles[accent]}`}>
      <p className="text-sm uppercase tracking-[0.2em] text-white/60">{label}</p>
      <div className="mt-3 text-3xl font-bold text-white">{value}</div>
      <p className="mt-2 text-sm text-white/70">{subtext}</p>
    </div>
  );
};

export default MetricCard;
