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

  const value = {
    business,
    loadingBusiness,
    needsOnboarding,
    setBusiness,
    setNeedsOnboarding
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}
