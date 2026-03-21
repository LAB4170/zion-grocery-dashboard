import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import { Loader2, Store, LogOut } from 'lucide-react';

export default function Onboarding() {
  const { logout } = useAuth();
  const { business, needsOnboarding, setBusiness, setNeedsOnboarding } = useBusiness();
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Store className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Welcome to NexusPOS
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Let's get your business set up.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleCreateBusiness}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Business Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. Zion Grocery, Downtown Cafe"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  'Create Business'
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out instead
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
