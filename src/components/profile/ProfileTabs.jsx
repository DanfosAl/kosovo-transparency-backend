/**
 * ProfileTabs — sticky tab navigation bar on the profile page.
 *
 * Props:
 *  tabs:      { id, label, icon }[]
 *  activeTab: string  (tab id)
 *  onChange:  (id: string) => void
 */
export default function ProfileTabs({ tabs, activeTab, onChange }) {
  return (
    <nav className="sticky top-16 z-30 bg-surface-container-lowest border-b border-outline-variant w-full overflow-x-auto no-scrollbar shadow-sm">
      <ul className="flex min-w-max px-container-margin h-14 items-center gap-lg font-label-caps text-label-caps">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <li
              key={tab.id}
              className={`h-full flex items-center ${
                isActive
                  ? "border-b-2 border-primary text-primary relative top-[1px]"
                  : "text-on-surface-variant hover:text-on-surface transition-colors"
              }`}
            >
              <button
                onClick={() => onChange(tab.id)}
                className="px-sm py-sm flex items-center gap-xs hover:bg-surface-container-low transition-colors rounded-t-DEFAULT"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
