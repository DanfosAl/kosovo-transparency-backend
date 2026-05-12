import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ComparisonPage from "./pages/ComparisonPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/profile/:id/comparison" element={<ComparisonPage />} />
        <Route path="/watchdog" element={<DashboardPage />} />
        <Route path="/profiles" element={<DashboardPage />} />
        <Route path="/reports" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
