import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-40">
      <div className="flex justify-between items-center w-full px-container-margin h-16 max-w-full mx-auto">
        {/* Menu button */}
        <button
          aria-label="Menu"
          className="flex items-center justify-center w-10 h-10 hover:bg-surface-container-high transition-colors rounded-full text-on-surface-variant"
          onClick={() => {}}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* App title */}
        <button
          className="font-headline-md text-headline-md font-bold text-on-surface truncate flex-1 text-center px-4"
          onClick={() => navigate("/")}
        >
          Kosovo Transparency
        </button>

        {/* Search toggle */}
        <button
          aria-label="Search"
          className="flex items-center justify-center w-10 h-10 hover:bg-surface-container-high transition-colors rounded-full text-on-surface-variant"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      {/* Integrated search bar */}
      {searchOpen && (
        <div className="px-container-margin pb-container-margin">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Search politicians, records, alerts..."
              type="text"
            />
          </div>
        </div>
      )}
    </header>
  );
}
