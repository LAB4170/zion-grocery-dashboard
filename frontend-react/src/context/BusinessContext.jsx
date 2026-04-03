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

  useEffect(() => {
    let isMounted = true;
    
    const fetchBusiness = async () => {
      if (!currentUser) {
        setBusiness(null);
        setNeedsOnboarding(false);
        setLoadingBusiness(false);
        return;
      }

      try {
        setLoadingBusiness(true);
        // Add a brief delay to ensure Firebase token is ready in the api interceptor
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await api.get('/business/me');
        if (isMounted) {
          setBusiness(response.data.data);
          setNeedsOnboarding(false);
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
    if (!business) return false;
    const now = new Date();
    if (business.subscription_status === 'active') {
      return !business.subscription_ends_at || new Date(business.subscription_ends_at) > now;
    }
    if (business.subscription_status === 'trial') {
      return business.trial_ends_at && new Date(business.trial_ends_at) > now;
    }
    return false;
  };

  const getDaysRemaining = () => {
    if (!business || business.subscription_status !== 'trial' || !business.trial_ends_at) return null;
    const ends = new Date(business.trial_ends_at);
    const now = new Date();
    const diffTime = ends - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const value = {
    business,
    loadingBusiness,
    needsOnboarding,
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
