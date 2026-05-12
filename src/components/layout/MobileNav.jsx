import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { id: "home",     label: "Home",     icon: "dashboard",  path: "/" },
  { id: "watchdog", label: "Watchdog", icon: "visibility", path: "/watchdog" },
  { id: "profiles", label: "Profiles", icon: "groups",     path: "/profiles" },
  { id: "reports",  label: "Reports",  icon: "assessment", path: "/reports" },
];

export default function MobileNav({ activeId }) {
  const location = useLocation();
  const navigate = useNavigate();

  const resolveActive = (item) => {
    if (activeId) return item.id === activeId;
    return location.pathname === item.path;
  };

  return (
    <nav className="md:hidden bg-surface-container border-t border-outline-variant shadow-sm rounded-t-xl fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = resolveActive(item);
        return (
          <button
            key={item.id}
            aria-label={item.label}
            onClick={() => navigate(item.path)}
            className={
              isActive
                ? "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 transition-colors"
                : "flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-variant transition-colors"
            }
          >
            <span
              className="material-symbols-outlined mb-1"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="font-label-caps text-label-caps">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
