const SectionCard = ({ title, subtitle, children, action }) => {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">{subtitle}</p>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
};

export default SectionCard;