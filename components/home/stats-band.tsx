import { HOME_STATS } from "@/lib/home-data";

export function StatsBand() {
  return (
    <div className="relative overflow-hidden border-y border-line bg-[linear-gradient(180deg,#06060a,#0c0c14)] px-8 py-15 before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(80%_60%_at_50%_50%,rgba(245,255,0,0.06),transparent_70%)]">
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-3 gap-8 max-[720px]:grid-cols-1">
        {HOME_STATS.map((stat, i) => (
          <div
            key={stat.unit}
            style={{ transitionDelay: `${i * 90}ms` }}
            className="border-l border-line p-5 text-center first:border-l-0 max-[720px]:border-t max-[720px]:border-l-0 max-[720px]:first:border-t-0"
          >
            <div className="neon-yellow font-pixel text-[clamp(32px,5vw,56px)] tracking-[0.04em]">
              {stat.n}
            </div>
            <div className="mt-[10px] font-pixel text-[13px] leading-[1.25] tracking-[0.18em] text-ink uppercase">
              {stat.unit}
            </div>
            <div className="mt-2 font-mono text-[11px] tracking-[0.16em] text-ink-faint uppercase">
              {stat.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
