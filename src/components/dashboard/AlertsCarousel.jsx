import AlertCard from "./AlertCard";

/**
 * AlertsCarousel — horizontal scroll row of watchdog alert cards.
 *
 * Props:
 *  alerts: Alert[]
 */
export default function AlertsCarousel({ alerts }) {
  return (
    <section className="py-xl">
      <div className="px-container-margin mb-sm flex justify-between items-end">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Live Watchdog Alerts
        </h2>
      </div>

      <div className="flex overflow-x-auto gap-container-margin px-container-margin pb-sm snap-x snap-mandatory hide-scrollbar">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </section>
  );
}
