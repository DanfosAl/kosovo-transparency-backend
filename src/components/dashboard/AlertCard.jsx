/**
 * AlertCard — single card in the Live Watchdog Alerts carousel.
 *
 * Props:
 *  alert: { id, priority, icon, categoryLabel, title, href, live }
 */
export default function AlertCard({ alert }) {
  const isHighPriority = alert.priority === "high";

  return (
    <div className="flex-none w-[280px] bg-surface-container-lowest border border-outline-variant rounded-xl p-md snap-center relative shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
      {/* Live pulsing dot */}
      {alert.live && (
        <div className="absolute top-md right-md flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
        </div>
      )}

      {/* Category row */}
      <div
        className={`flex items-center gap-xs mb-sm ${
          isHighPriority ? "text-error" : "text-on-surface-variant"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {alert.icon}
        </span>
        <span className="font-label-caps text-label-caps uppercase tracking-wider">
          {alert.categoryLabel}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-md line-clamp-2">
        {alert.title}
      </h3>

      {/* CTA */}
      <a
        href={alert.href}
        className="font-label-caps text-label-caps text-primary hover:text-surface-tint transition-colors flex items-center gap-xs"
      >
        Read More
        <span className="material-symbols-outlined text-[14px]">
          arrow_forward
        </span>
      </a>
    </div>
  );
}
