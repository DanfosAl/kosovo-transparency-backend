import { useNavigate } from "react-router-dom";

/**
 * Returns the badge styling based on the transparency score.
 * High  ≥ 70  → green
 * Mid   40-69 → neutral
 * Low   < 40  → red
 */
function scoreBadgeClass(score) {
  if (score >= 70)
    return "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant border border-tertiary-fixed-dim/30";
  if (score >= 40)
    return "bg-surface-tint/10 text-on-surface border border-outline-variant";
  return "bg-error-container text-on-error-container border border-error/30";
}

/**
 * ProfileRow — one row inside the "Top Profiles Monitored" list.
 *
 * Props:
 *  politician: { id, name, title, score, avatarUrl }
 *  isLast: boolean
 */
export default function ProfileRow({ politician, isLast }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/profile/${politician.id}`)}
      className={`flex items-center justify-between w-full p-container-margin ${
        isLast ? "" : "border-b border-outline-variant/30"
      } hover:bg-surface-container-lowest transition-colors cursor-pointer bg-surface-container-lowest text-left ${
        isLast ? "rounded-b-xl" : ""
      }`}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-md">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant border border-outline-variant flex-shrink-0 flex items-center justify-center">
          {politician.avatarUrl ? (
            <img
              src={politician.avatarUrl}
              alt={`Profile of ${politician.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-outline">
              person
            </span>
          )}
        </div>
        <div>
          <div className="font-body-lg text-body-lg font-semibold text-on-surface">
            {politician.name}
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant">
            {politician.title}
          </div>
        </div>
      </div>

      {/* Score badge */}
      <div className="flex flex-col items-end">
        <div
          className={`px-2 py-1 rounded-full font-data-mono text-data-mono font-bold ${scoreBadgeClass(
            politician.score
          )}`}
        >
          {politician.score}/100
        </div>
        <div className="font-label-caps text-label-caps text-on-surface-variant mt-1 text-[10px]">
          Score
        </div>
      </div>
    </button>
  );
}
