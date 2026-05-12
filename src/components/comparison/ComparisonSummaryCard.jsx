/**
 * ComparisonSummaryCard — side-by-side year comparison of total assets & debt.
 *
 * Props:
 *  comparison: { yearA, yearB, totalAssetsA, totalAssetsB, totalDebtA, totalDebtB }
 */
export default function ComparisonSummaryCard({ comparison }) {
  const fmt = (n) => `€ ${n.toLocaleString()}`;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
      <h3 className="font-label-caps text-label-caps text-on-surface mb-md">
        {comparison.yearA} vs {comparison.yearB}
      </h3>

      <div className="grid grid-cols-2 gap-md relative">
        {/* Vertical divider */}
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-outline-variant/30 transform -translate-x-1/2" />

        {/* Year A */}
        <div className="space-y-sm pr-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant text-center">
            {comparison.yearA}
          </p>
          <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
            <p className="font-body-md text-body-md text-on-surface-variant mb-xs">
              Total Assets
            </p>
            <p className="font-data-mono text-data-mono text-on-surface">
              {fmt(comparison.totalAssetsA)}
            </p>
          </div>
          <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
            <p className="font-body-md text-body-md text-on-surface-variant mb-xs">
              Total Debt
            </p>
            <p className="font-data-mono text-data-mono text-on-surface">
              {fmt(comparison.totalDebtA)}
            </p>
          </div>
        </div>

        {/* Year B */}
        <div className="space-y-sm pl-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant text-center">
            {comparison.yearB}
          </p>
          <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
            <p className="font-body-md text-body-md text-on-surface-variant mb-xs">
              Total Assets
            </p>
            <p className="font-data-mono text-data-mono text-on-surface">
              {fmt(comparison.totalAssetsB)}
            </p>
          </div>
          <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
            <p className="font-body-md text-body-md text-on-surface-variant mb-xs">
              Total Debt
            </p>
            <p className="font-data-mono text-data-mono text-on-surface">
              {fmt(comparison.totalDebtB)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
