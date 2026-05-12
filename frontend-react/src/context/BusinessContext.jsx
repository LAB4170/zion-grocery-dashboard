import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const BusinessContext = createContext();

export function useBusiness() {
  return useContext(BusinessContext);
}

export function BusinessProvider({ children }) {
  const { currentUser } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchBusiness = async () => {
      if (!currentUser) {
        setBusiness(null);
        setNeedsOnboarding(false);
        setIsAdmin(false); // CRITICAL: Clear admin state on logout
        setLoadingBusiness(false);
        return;
      }

      try {
        setLoadingBusiness(true);
        
        // 1. Check if user is a Super Admin via Firebase Custom Claims
        const idTokenResult = await currentUser.getIdTokenResult(true);
        const isAdminUser = idTokenResult.claims.role === 'admin';
        
        if (isAdminUser) {
          console.log("🛡️ Admin session detected. Skipping standard merchant context.");
          setIsAdmin(true);
          setBusiness(null);
          setNeedsOnboarding(false);
          setLoadingBusiness(false);
          return;
        }

        setIsAdmin(false);

        const response = await api.get('/business/me');
        if (isMounted) {
          if (!response.data.data) {
            setNeedsOnboarding(true);
            setBusiness(null);
          } else {
            setBusiness(response.data.data);
            setNeedsOnboarding(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          if (error.response && (error.response.status === 404 || error.response.status === 403)) {
             setNeedsOnboarding(true);
          } else {
             console.error("Failed to fetch business context:", error);
          }
          setBusiness(null);
        }
      } finally {
        if (isMounted) setLoadingBusiness(false);
      }
    };

    fetchBusiness();

    return () => { isMounted = false; };
  }, [currentUser]);

  const isSubscriptionActive = () => {
    // With billing removed, any business is active.
    return !!business;
  };

  const getDaysRemaining = () => null; // Always null since trials are removed

  const value = {
    business,
    loadingBusiness,
    needsOnboarding,
    isAdmin,
    isSubscriptionActive,
    getDaysRemaining,
    setBusiness,
    setNeedsOnboarding
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}
