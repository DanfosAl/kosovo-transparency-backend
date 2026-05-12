import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileTabs from "../components/profile/ProfileTabs";
import WealthTab from "../components/profile/WealthTab";
import MobileNav from "../components/layout/MobileNav";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

const PROFILE_TABS = [
  { id: "wealth", label: "Wealth Timeline", icon: "account_balance_wallet" },
  { id: "cv", label: "CV & Background", icon: "contact_page" },
  { id: "watchdog", label: "Watchdog Alerts", icon: "warning" },
];

/** Derive WealthTab-compatible shapes from the most recent declaration. */
function deriveWealthData(latestDecl) {
  if (!latestDecl) return { declaredAssets: null, liabilities: null };

  const sum = (arr, pred) => arr.filter(pred).reduce((s, a) => s + a.declaredValue, 0);

  return {
    declaredAssets: {
      realEstate: sum(latestDecl.assets, (a) => a.category === "REAL_ESTATE"),
      vehicles: sum(latestDecl.assets, (a) => a.category === "VEHICLE"),
      liquidFunds: sum(latestDecl.assets, (a) => ["CASH", "CRYPTO"].includes(a.category)),
    },
    liabilities: {
      outstandingLoans: latestDecl.liabilities.reduce((s, l) => s + l.remainingAmount, 0),
    },
  };
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("wealth");
  const [politician, setPolitician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch profile (with alerts) and comparison (for wealth tab data) in parallel.
    Promise.all([
      fetch(`${API_BASE}/politicians/${id}`).then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE}/politicians/${id}/comparison`).then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      }),
    ])
      .then(([profileData, comparisonData]) => {
        const { declaredAssets, liabilities } = deriveWealthData(
          comparisonData.declarations?.[0] ?? null
        );
        setPolitician({
          ...profileData,
          title: profileData.currentRole,
          party: profileData.partyAffiliation,
          score: profileData.transparencyScore,
          avatarUrl: profileData.avatarUrl ?? null,
          declaredAssets,
          liabilities,
        });
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

  if (error || !politician) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-body-lg text-on-surface-variant">
          {error ?? "Politician not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col pb-24 md:pb-0">
      {/* Top bar */}
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 flex justify-between items-center w-full px-container-margin h-16">
        <button
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 hover:bg-surface-container-high transition-colors rounded-full text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="font-headline-md text-headline-md font-bold text-on-surface truncate flex-1 text-center px-4">
          Kosovo Transparency
        </div>
        <button
          aria-label="Search"
          className="flex items-center justify-center w-10 h-10 hover:bg-surface-container-high transition-colors rounded-full text-on-surface-variant"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </header>

      {/* Hero */}
      <ProfileHero politician={politician} />

      {/* Tab navigation */}
      <ProfileTabs
        tabs={PROFILE_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab content */}
      <section className="flex-1 bg-background p-container-margin">
        {activeTab === "wealth" && <WealthTab politician={politician} />}
        {activeTab === "cv" && (
          <p className="font-body-md text-on-surface-variant">
            CV &amp; Background — coming soon.
          </p>
        )}
        {activeTab === "watchdog" && (
          <p className="font-body-md text-on-surface-variant">
            Watchdog Alerts — coming soon.
          </p>
        )}
      </section>

      <MobileNav activeId="profiles" />
    </div>
  );
}
