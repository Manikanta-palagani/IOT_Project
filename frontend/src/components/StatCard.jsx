const tones = {
  emerald: 'from-emerald-500/20 to-emerald-950/40 border-emerald-400/25 text-emerald-100',
  red: 'from-red-500/20 to-red-950/40 border-red-400/25 text-red-100',
  amber: 'from-amber-500/20 to-amber-950/40 border-amber-400/25 text-amber-100',
  slate: 'from-slate-500/20 to-slate-950/40 border-white/10 text-slate-100',
  cyan: 'from-cyan-500/20 to-cyan-950/40 border-cyan-400/25 text-cyan-100',
};

const StatCard = ({ label, value, detail, tone = 'slate', emphasis }) => {
  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/55">{label}</p>
          <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
        </div>
        {emphasis ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">{emphasis}</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-white/65">{detail}</p>
    </div>
  );
};

export default StatCard;