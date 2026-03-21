import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Debts from './pages/Debts';
import Reports from './pages/Reports';
import SalesRecords from './pages/SalesRecords';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { loadingBusiness, needsOnboarding, business } = useBusiness();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (loadingBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 text-sm">Loading workspace...</p>
      </div>
    );
  }

  if (needsOnboarding || !business) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// Onboarding Route Guard
function OnboardingRoute({ children }) {
  const { currentUser } = useAuth();
  const { loadingBusiness, needsOnboarding } = useBusiness();

  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (loadingBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  // If they don't need onboarding, push them back to app
  if (!needsOnboarding) return <Navigate to="/app/dashboard" replace />;
  
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BusinessProvider>
          <SocketProvider>
            <Router>
              <Routes>
                {/* Public Route */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                
                {/* Onboarding Route */}
                <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
              
                {/* Protected App Routes */}
                <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="sales/history" element={<SalesRecords />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="debts" element={<Debts />} />
                  <Route path="reports" element={<Reports />} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </Router>
        </SocketProvider>
      </BusinessProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
