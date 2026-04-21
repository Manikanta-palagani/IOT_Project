const tones = {
  emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
  red: 'from-rose-50 to-rose-100 border-rose-200 text-rose-700',
  amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
  slate: 'from-slate-50 to-slate-100 border-slate-200 text-slate-700',
  cyan: 'from-sky-50 to-sky-100 border-sky-200 text-sky-700',
};

const StatCard = ({ label, value, detail, tone = 'slate', emphasis }) => {
  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
        </div>
        {emphasis ? <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-600 shadow-sm">{emphasis}</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
};

export default StatCard;