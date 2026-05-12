/**
 * AssetBreakdownChart — horizontal bar chart comparing an asset category
 * across two years.
 *
 * Props:
 *  asset:      { id, label, icon, displayA, displayB, barPctA, barPctB }
 *  yearA:      string  e.g. "2022"
 *  yearB:      string  e.g. "2024"
 */
export default function AssetBreakdownChart({ asset, yearA, yearB }) {
  return (
    <div>
      {/* Header row */}
      <div className="flex justify-between items-center mb-sm">
        <p className="font-body-md text-body-md font-semibold text-on-surface">
          {asset.label}
        </p>
        <span className="material-symbols-outlined text-outline-variant text-[18px]">
          {asset.icon}
        </span>
      </div>

      {/* Year A bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-sm">
          <span className="font-data-mono text-[10px] text-on-surface-variant w-8">
            {yearA}
          </span>
          <div className="h-3 bg-surface-container-high rounded-full flex-1 overflow-hidden">
            <div
              className="h-full bg-outline rounded-full"
              style={{ width: `${asset.barPctA}%` }}
            />
          </div>
          <span className="font-data-mono text-data-mono text-on-surface w-20 text-right">
            {asset.displayA}
          </span>
        </div>

        {/* Year B bar */}
        <div className="flex items-center gap-sm">
          <span className="font-data-mono text-[10px] text-on-surface-variant w-8">
            {yearB}
          </span>
          <div className="h-3 bg-surface-container-high rounded-full flex-1 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${asset.barPctB}%` }}
            />
          </div>
          <span className="font-data-mono text-data-mono text-on-surface w-20 text-right font-bold">
            {asset.displayB}
          </span>
        </div>
      </div>
    </div>
  );
}
