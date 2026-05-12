import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

/**
 * AppLayout wraps every page.
 * - Renders the persistent top Navbar and mobile bottom nav.
 * - `activeNav` lets a page override which nav item appears active.
 */
export default function AppLayout({ children, activeNav }) {
  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col pb-24 md:pb-0">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto md:px-container-margin">
        {children}
      </main>
      <MobileNav activeId={activeNav} />
    </div>
  );
}
