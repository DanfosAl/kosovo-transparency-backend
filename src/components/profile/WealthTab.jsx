/**
 * WealthTab — "Wealth Timeline" tab content on the profile page.
 *
 * Props:
 *  politician: { declaredAssets, liabilities }
 */
export default function WealthTab({ politician }) {
  const assets = politician.declaredAssets;
  const liabilities = politician.liabilities;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter max-w-7xl mx-auto">
      {/* Net Worth Progression chart placeholder */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow lg:col-span-2">
        <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
          <span className="material-symbols-outlined text-secondary">
            trending_up
          </span>
          <h2 className="font-label-caps text-label-caps text-on-surface">
            Net Worth Progression
          </h2>
        </div>
        <div className="h-48 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant border-dashed">
          <span className="font-body-md text-on-surface-variant">
            [Data Visualization Chart]
          </span>
        </div>
      </div>

      {/* Declared Assets */}
      {assets && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
            <span className="material-symbols-outlined text-secondary">
              real_estate_agent
            </span>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              Declared Assets
            </h2>
          </div>
          <ul className="space-y-sm">
            <li className="flex justify-between items-center py-sm border-b border-surface-variant">
              <span className="font-body-md text-on-surface">Real Estate</span>
              <span className="font-data-mono text-data-mono text-primary">
                €{assets.realEstate.toLocaleString()}
              </span>
            </li>
            <li className="flex justify-between items-center py-sm border-b border-surface-variant">
              <span className="font-body-md text-on-surface">Vehicles</span>
              <span className="font-data-mono text-data-mono text-primary">
                €{assets.vehicles.toLocaleString()}
              </span>
            </li>
            <li className="flex justify-between items-center py-sm">
              <span className="font-body-md text-on-surface">Liquid Funds</span>
              <span className="font-data-mono text-data-mono text-primary">
                €{assets.liquidFunds.toLocaleString()}
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Liabilities */}
      {liabilities && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
            <span className="material-symbols-outlined text-secondary">
              account_balance
            </span>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              Liabilities
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center h-full pb-xl">
            <span className="font-display-lg text-display-lg text-error mb-xs">
              €{liabilities.outstandingLoans.toLocaleString()}
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              Outstanding Loans
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
