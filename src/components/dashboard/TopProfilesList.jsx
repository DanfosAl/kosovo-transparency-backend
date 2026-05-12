import ProfileRow from "./ProfileRow";

/**
 * TopProfilesList — "Top Profiles Monitored" section on the dashboard.
 *
 * Props:
 *  politicians: Politician[]
 */
export default function TopProfilesList({ politicians }) {
  return (
    <section className="py-lg bg-surface-container-low md:rounded-xl md:mb-xl">
      <div className="px-container-margin mb-md flex justify-between items-end">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Top Profiles Monitored
        </h2>
        <a
          href="#"
          className="font-label-caps text-label-caps text-primary hover:underline"
        >
          View All
        </a>
      </div>

      <div className="flex flex-col">
        {politicians.map((politician, index) => (
          <ProfileRow
            key={politician.id}
            politician={politician}
            isLast={index === politicians.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
