# Zion Grocery Dashboard (React Shift) - Roadmap

## Phase 1: Archiving & React Scaffolding
- [ ] Backup current `frontend` directory to `frontend-legacy`.
- [ ] Initialize Vite React project in `frontend`.
- [ ] Clean up Vite boilerplate and install dependencies (React Router, Axios, Firebase, Icon sets).

## Phase 2: React Infrastructure & Firebase
- [ ] Scaffold `AuthContext.jsx` to manage user sessions via Firebase `onAuthStateChanged`.
- [ ] Configure `api.js` (Axios interceptors) to attach the Firebase ID token silently to backend requests.
- [ ] Update Node.js `server.js` CORS settings to communicate smoothly with Vite's Dev Server port.

## Phase 3: Premium UI & Component Construction
- [ ] Build the Glassmorphic `LoginPage.jsx` with Auth Providers.
- [ ] Build the `DashboardLayout.jsx` core wrapper (Sidebar, Topnav).
- [ ] Engineer React Router to protect the Dashboard routes.

## Phase 4: Feature Parity & API Hook Up
- [ ] Convert Products dashboard into React.
- [ ] Convert Sales & POS module into React.
- [ ] Convert Expenses and Debts modules into React.
- [ ] Final end-to-end testing between React Client and Node API.
