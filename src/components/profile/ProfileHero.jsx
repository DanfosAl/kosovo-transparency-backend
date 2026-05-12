/**
 * ProfileHero — large hero section at the top of a politician's profile page.
 *
 * Props:
 *  politician: { name, title, party, score, avatarUrl }
 */
export default function ProfileHero({ politician }) {
  return (
    <section className="bg-surface-container-lowest pt-xl pb-lg px-container-margin flex flex-col items-center justify-center relative border-b border-outline-variant">
      {/* Transparency score badge */}
      <div className="absolute top-md right-container-margin bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps px-sm py-base rounded-full flex items-center gap-xs shadow-sm border border-tertiary-fixed-dim">
        <span className="material-symbols-outlined text-[16px]">
          verified_user
        </span>
        <span>{politician.score}/100</span>
      </div>

      {/* Avatar */}
      <div className="relative w-32 h-32 mb-md">
        {politician.avatarUrl ? (
          <img
            src={politician.avatarUrl}
            alt={politician.name}
            className="w-full h-full object-cover rounded-full border-4 border-surface shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-full border-4 border-surface shadow-sm bg-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[64px] text-outline">
              person
            </span>
          </div>
        )}
      </div>

      {/* Name + title + party */}
      <h1 className="font-display-lg text-display-lg text-primary text-center mb-base">
        {politician.name}
      </h1>
      <p className="font-headline-sm text-headline-sm text-on-surface-variant text-center mb-sm">
        {politician.title}
      </p>
      <p className="font-body-md text-body-md text-secondary text-center px-md py-base bg-surface-container rounded-DEFAULT">
        {politician.party}
      </p>
    </section>
  );
}
