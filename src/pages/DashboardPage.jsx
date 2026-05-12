import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import AlertsCarousel from "../components/dashboard/AlertsCarousel";
import TopProfilesList from "../components/dashboard/TopProfilesList";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// Global watchdog alerts have no dedicated API endpoint yet — kept as static data.
const STATIC_ALERTS = [
  {
    id: "alert-001",
    priority: "high",
    icon: "warning",
    categoryLabel: "High Priority",
    title: "New Unexplained Asset Flagged in Recent Declaration",
    href: "#",
    live: true,
  },
  {
    id: "alert-002",
    priority: "medium",
    icon: "receipt_long",
    categoryLabel: "Procurement",
    title: "Unusual Procurement Spike Detected in Ministry of Infrastructure",
    href: "#",
    live: true,
  },
  {
    id: "alert-003",
    priority: "low",
    icon: "update",
    categoryLabel: "Update",
    title: "Annual Budget Review Data Published for Q3",
    href: "#",
    live: false,
  },
];

export default function DashboardPage() {
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/politicians`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) =>
        setPoliticians(
          data.map((p) => ({
            ...p,
            title: p.currentRole,
            score: p.transparencyScore,
            avatarUrl: p.avatarUrl ?? null,
          }))
        )
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout activeNav="home">
        <div className="flex items-center justify-center py-24">
          <span className="font-body-lg text-on-surface-variant">Loading…</span>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout activeNav="home">
        <div className="flex items-center justify-center py-24">
          <span className="font-body-lg text-error">{error}</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="home">
      <AlertsCarousel alerts={STATIC_ALERTS} />
      <TopProfilesList politicians={politicians} />
    </AppLayout>
  );
}
