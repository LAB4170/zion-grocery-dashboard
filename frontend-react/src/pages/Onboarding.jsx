import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Loader2, Store, LogOut, Sun, Moon } from 'lucide-react';

export default function Onboarding() {
  const { logout } = useAuth();
  const { business, needsOnboarding, setBusiness, setNeedsOnboarding } = useBusiness();
  const { isDarkMode, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // If already has a business, redirect to dashboard
  if (business && !needsOnboarding) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/business', { name });
      
      setBusiness(response.data.data);
      setNeedsOnboarding(false);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="login-page" style={{ position: 'relative' }}>
      
      {/* Theme Toggle Top Bar */}
      <div style={{ position: 'absolute', top: 32, right: 32, zIndex: 10 }}>
        <button 
          onClick={toggleTheme}
          style={{ background: 'transparent', color: 'var(--text-muted)', padding: 0 }}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <div className="login-card glass">
        <div className="login-header">
           <div className="login-logo">
             <Store size={40} />
           </div>
           <h1>Welcome to NexusPOS</h1>
           <p>Let's get your workspace set up.</p>
        </div>

        <form onSubmit={handleCreateBusiness} style={{ width: '100%' }}>
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-muted)' }}>
              Business Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-premium"
              placeholder="e.g. Alpha Retail"
            />
          </div>

          {error && (
            <div className="settings-alert error" style={{ padding: '10px 14px', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="hero-btn-primary"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, padding: '12px' }}
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={20} /> Provisioning Workspace...</>
            ) : (
              'Create Workspace'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              marginTop: 16, 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <LogOut size={16} />
            Sign Out Instead
          </button>
        </form>
      </div>
    </div>
  );
}
