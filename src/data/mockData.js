// ─────────────────────────────────────────────
// MOCK DATA — Kosovo Transparency
// Replace each fetch() call in the service layer
// with the equivalent API endpoint when the
// Node.js backend is ready.
// ─────────────────────────────────────────────

// GET /api/alerts
export const alerts = [
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

// GET /api/politicians
export const politicians = [
  {
    id: "albin-kurti",
    name: "Albin Kurti",
    title: "Prime Minister",
    party: "Lëvizja Vetëvendosje",
    score: 85,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD98tkri1OMU3BBVCrodwioZMpL5TV2JDrfZj8v3KjeIhcnd0yWl-4ZMtzXtRryWcKdugOZdK7cU5Oguo4bc18I24hs5VvOhu2FBDdXUYICcIOKby3z6jEEx7w-zFtRxNbjq_X5qyz600uOml-Xf0aKMtKe2EM4HztWW3fSrMTfROeKD_OAVn40wumZKxdPe10Af6g6n7Et7CwLhAT87dBM7-j2wgIR_a3yWULh-wuRxl-l9hlfnmqH0RrZD23RqS68Y5b5MmOjmFQ",
    declaredAssets: {
      realEstate: 125000,
      vehicles: 24500,
      liquidFunds: 18200,
    },
    liabilities: {
      outstandingLoans: 45000,
    },
    financialComparison: {
      yearA: "2022",
      yearB: "2024",
      totalAssetsA: 420500,
      totalAssetsB: 512000,
      totalDebtA: 15000,
      totalDebtB: 8000,
      discrepancies: [
        {
          id: "disc-001",
          type: "error",
          icon: "warning",
          message:
            "Unexplained asset increase of €85,000 detected in 2024 declaration.",
        },
        {
          id: "disc-002",
          type: "success",
          icon: "check_circle",
          message:
            "Cash flow for 2022-2023 matches official salary records.",
        },
      ],
      assetBreakdown: [
        {
          id: "asset-real-estate",
          label: "Real Estate",
          icon: "home",
          valueA: 300000,
          valueB: 380000,
          displayA: "€300k",
          displayB: "€380k",
          barPctA: 65,
          barPctB: 80,
        },
        {
          id: "asset-vehicles",
          label: "Vehicles",
          icon: "directions_car",
          valueA: 35000,
          valueB: 45000,
          displayA: "€35k",
          displayB: "€45k",
          barPctA: 15,
          barPctB: 20,
        },
        {
          id: "asset-bank-cash",
          label: "Bank Cash",
          icon: "account_balance",
          valueA: 85500,
          valueB: 87000,
          displayA: "€85.5k",
          displayB: "€87k",
          barPctA: 25,
          barPctB: 25,
        },
      ],
    },
  },
  {
    id: "vjosa-osmani",
    name: "Vjosa Osmani",
    title: "President",
    party: "Partia Guxo",
    score: 40,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDS_gKcQ4Lfw5jZ1BodJWz8pQig2mGxiKYNzo2E18g7K9gIk0LsW_c_aQwjXSW0oohNAcGSAWcNeglMFfGIzuZ0JQneq8gmKUq9C6jQSF6Q-SKm-bZ2M88XkPLwanYXx1zvWD6zMv1O3tiiQ_TyHwdakW7lECgICtjLsbqkdqUcpTN_a7IsmDFLajL2b32tS1FUDv2hO1hTYL7pGER04ZfyoKaq5TgFI43dL-c8ZppKJPeFaCLbgjJUdE7jfF1rq0fEQie6hYD1xOg",
    declaredAssets: null,
    liabilities: null,
    financialComparison: null,
  },
  {
    id: "glauk-konjufca",
    name: "Glauk Konjufca",
    title: "Speaker of Assembly",
    party: "Lëvizja Vetëvendosje",
    score: 65,
    avatarUrl: null,
    declaredAssets: null,
    liabilities: null,
    financialComparison: null,
  },
];

// GET /api/nav-items
export const navItems = [
  { id: "home", label: "Home", icon: "dashboard", path: "/" },
  { id: "watchdog", label: "Watchdog", icon: "visibility", path: "/watchdog" },
  { id: "profiles", label: "Profiles", icon: "groups", path: "/profiles" },
  { id: "reports", label: "Reports", icon: "assessment", path: "/reports" },
];

// GET /api/profile-tabs
export const profileTabs = [
  { id: "wealth", label: "Wealth Timeline", icon: "account_balance_wallet" },
  { id: "cv", label: "CV & Background", icon: "contact_page" },
  { id: "watchdog", label: "Watchdog Alerts", icon: "warning" },
];
