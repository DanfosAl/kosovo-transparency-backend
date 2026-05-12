import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ComparisonSummaryCard from "../components/comparison/ComparisonSummaryCard";
import DiscrepancyBanner from "../components/comparison/DiscrepancyBanner";
import AssetBreakdownChart from "../components/comparison/AssetBreakdownChart";
import MobileNav from "../components/layout/MobileNav";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

const CATEGORY_META = {
  REAL_ESTATE:    { label: "Real Estate",     icon: "home" },
  VEHICLE:        { label: "Vehicles",        icon: "directions_car" },
  BUSINESS_EQUITY:{ label: "Business Equity", icon: "business" },
  CASH:           { label: "Cash & Savings",  icon: "account_balance" },
  CRYPTO:         { label: "Crypto",          icon: "currency_bitcoin" },
};

/** Format a EUR value for display, e.g. 85500 → "€85.5k", 1200000 → "€1.2M" */
function fmtEur(n) {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `€${(n / 1_000).toFixed(0)}k`;
  return `€${n}`;
}

/**
 * Derive the comparison shape expected by the child components from the
 * two declarations returned by GET /api/politicians/:id/comparison.
 * declarations[0] is the newer year (B), declarations[1] is the older (A).
 */
function buildComparison(declarations) {
  if (!declarations || declarations.length < 2) return null;

  const declB = declarations[0]; // newer
  const declA = declarations[1]; // older

  const yearA = String(declA.year);
  const yearB = String(declB.year);
  const totalAssetsA = declA.totalAssets;
  const totalAssetsB = declB.totalAssets;
  const totalDebtA   = declA.totalLiabilities;
  const totalDebtB   = declB.totalLiabilities;

  // --- Discrepancies ---
  const discrepancies = [];
  const assetDelta = totalAssetsB - totalAssetsA;
  const debtDelta  = totalDebtB  - totalDebtA;

  if (Math.abs(assetDelta) > 5_000) {
    discrepancies.push({
      id: "disc-assets",
      type: assetDelta > 0 ? "error" : "success",
      icon: assetDelta > 0 ? "warning" : "check_circle",
      message:
        assetDelta > 0
          ? `Unexplained asset increase of €${assetDelta.toLocaleString()} detected between ${yearA} and ${yearB}.`
          : `Asset base decreased by €${Math.abs(assetDelta).toLocaleString()} between ${yearA} and ${yearB}.`,
    });
  }

  if (Math.abs(debtDelta) > 1_000) {
    discrepancies.push({
      id: "disc-liabilities",
      type: debtDelta > 0 ? "error" : "success",
      icon: debtDelta > 0 ? "warning" : "check_circle",
      message:
        debtDelta > 0
          ? `Liabilities increased by €${debtDelta.toLocaleString()} between ${yearA} and ${yearB}.`
          : `Liabilities reduced by €${Math.abs(debtDelta).toLocaleString()} — debt serviced normally.`,
    });
  }

  // --- Asset breakdown by category ---
  const allCategories = [
    ...new Set([
      ...declA.assets.map((a) => a.category),
      ...declB.assets.map((a) => a.category),
    ]),
  ];

  const assetBreakdown = allCategories.map((cat) => {
    const sumCat = (decl) =>
      decl.assets
        .filter((a) => a.category === cat)
        .reduce((s, a) => s + a.declaredValue, 0);

    const valueA  = sumCat(declA);
    const valueB  = sumCat(declB);
    const maxValue = Math.max(valueA, valueB, 1); // avoid /0

    return {
      id: `asset-${cat.toLowerCase()}`,
      label: CATEGORY_META[cat]?.label ?? cat,
      icon:  CATEGORY_META[cat]?.icon  ?? "help",
      valueA, valueB,
      displayA: fmtEur(valueA),
      displayB: fmtEur(valueB),
      barPctA: Math.round((valueA / maxValue) * 100),
      barPctB: Math.round((valueB / maxValue) * 100),
    };
  });

  return { yearA, yearB, totalAssetsA, totalAssetsB, totalDebtA, totalDebtB, discrepancies, assetBreakdown };
}

export default function ComparisonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [politician, setPolitician] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/politicians/${id}/comparison`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPolitician({
          ...data,
          title: data.currentRole,
          avatarUrl: data.avatarUrl ?? null,
        });
        setComparison(buildComparison(data.declarations));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="font-body-lg text-on-surface-variant">Loading…</span>
      </div>
    );
  }

  if (error || !politician || !comparison) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-body-lg text-on-surface-variant">
          {error ?? "Comparison data not available."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col pb-safe">
      {/* Top bar */}
      <header className="flex justify-between items-center w-full px-container-margin h-16 bg-surface border-b border-outline-variant sticky top-0 z-40">
        <button
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="text-primary hover:bg-surface-container-high p-sm rounded-full transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
          Financial Comparison
        </h1>
        <div className="w-8" />
      </header>

      {/* Content */}
      <main className="flex-1 px-container-margin py-md space-y-lg pb-[100px]">
        {/* Profile intro */}
        <section className="flex items-center gap-md">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-outline-variant shrink-0 bg-surface-container-high">
            {politician.avatarUrl ? (
              <img
                src={politician.avatarUrl}
                alt={politician.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-outline">
                  person
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {politician.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {politician.title}
            </p>
          </div>
        </section>

        {/* Year comparison card */}
        <ComparisonSummaryCard comparison={comparison} />

        {/* Discrepancy banners */}
        <section className="space-y-sm">
          {comparison.discrepancies.map((d) => (
            <DiscrepancyBanner key={d.id} discrepancy={d} />
          ))}
        </section>

        {/* Asset breakdown bars */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <h3 className="font-label-caps text-label-caps text-on-surface mb-lg">
            Asset Breakdown Change
          </h3>
          <div className="space-y-lg">
            {comparison.assetBreakdown.map((asset) => (
              <AssetBreakdownChart
                key={asset.id}
                asset={asset}
                yearA={comparison.yearA}
                yearB={comparison.yearB}
              />
            ))}
          </div>
        </section>
      </main>

      <MobileNav activeId="profiles" />
    </div>
  );
}
