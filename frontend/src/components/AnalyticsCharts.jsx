const ChartCard = ({ title, subtitle, data, unitLabel = 'events' }) => {
  const max = Math.max(1, ...data.map((item) => item.count));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/55">{subtitle}</p>
      </div>
      <div className="flex h-56 items-end gap-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        {data.map((item) => {
          const heightPercent = (item.count / max) * 100;

          return (
            <div key={item.label} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-40 w-full items-end rounded-xl bg-slate-900/40 px-1">
                <div
                  className={`w-full rounded-xl ${item.count > 0 ? 'bg-gradient-to-t from-red-600 via-red-500 to-amber-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'bg-white/8'}`}
                  style={{ height: `${Math.max(6, heightPercent)}%` }}
                />
              </div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">{item.label}</span>
              <span className="text-xs text-white/70">{item.count} {unitLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AnalyticsCharts = ({ hourlyData, dailyData }) => {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Hourly intrusion analytics" subtitle="Intrusion distribution across the last 24 hours" data={hourlyData} unitLabel="alerts" />
      <ChartCard title="Daily intrusion analytics" subtitle="Intrusion distribution across the last 7 days" data={dailyData} unitLabel="alerts" />
    </div>
  );
};

export default AnalyticsCharts;