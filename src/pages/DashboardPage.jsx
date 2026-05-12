import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import AlertsCarousel from "../components/dashboard/AlertsCarousel";
import TopProfilesList from "../components/dashboard/TopProfilesList";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

const SEVERITY_MAP = {
  CRITICAL: { priority: "high", icon: "warning" },
  HIGH:     { priority: "high", icon: "gavel" },
  MEDIUM:   { priority: "medium", icon: "receipt_long" },
  LOW:      { priority: "low", icon: "info" },
};

function mapAlert(a) {
  const { priority, icon } = SEVERITY_MAP[a.severity] ?? SEVERITY_MAP.LOW;
  return {
    id: a.id,
    priority,
    icon,
    categoryLabel: a.politician?.name ?? "Unknown",
    title: a.title,
    href: a.url,
    live: !a.isResolved,
  };
}

export default function DashboardPage() {
  const [politicians, setPoliticians] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/alerts`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setAlerts(data.map(mapAlert)))
      .catch(() => {});
  }, []);

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
      <AlertsCarousel alerts={alerts} />
      <TopProfilesList politicians={politicians} />
    </AppLayout>
  );
}
