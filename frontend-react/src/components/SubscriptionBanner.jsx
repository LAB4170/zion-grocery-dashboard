import React from 'react';
import { AlertCircle, Clock, CreditCard } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export default function SubscriptionBanner() {
  const { business, getDaysRemaining, isSubscriptionActive } = useBusiness();
  const daysLeft = getDaysRemaining();
  const active = isSubscriptionActive();

  if (!business) return null;

  // Case 1: Trial is active and has days left
  if (business.subscription_status === 'trial' && daysLeft !== null) {
    const isUrgent = daysLeft <= 3;
    
    return (
      <div className={`billing-banner ${isUrgent ? 'urgent' : 'info'}`} style={{
        margin: '0 0 20px 0',
        padding: '12px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: 500,
        backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
        color: isUrgent ? '#ef4444' : '#3b82f6'
      }}>
        {isUrgent ? <AlertCircle size={20} /> : <Clock size={20} />}
        <div style={{ flex: 1 }}>
          <strong>Free Trial:</strong> You have <strong>{daysLeft} days</strong> left in your trial. 
          {isUrgent && ' Upgrade soon to avoid service interruption.'}
        </div>
        <button 
          className="btn-primary" 
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            borderRadius: '6px',
            backgroundColor: isUrgent ? '#ef4444' : '#3b82f6',
            borderColor: isUrgent ? '#ef4444' : '#3b82f6'
          }}
          onClick={() => window.location.hash = '/app/settings'}
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  // Case 2: Trial or Subscription expired
  if (!active && business.subscription_status !== 'active') {
    return (
      <div className="billing-banner error" style={{
        margin: '0 0 20px 0',
        padding: '12px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: 600,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#b91c1c'
      }}>
        <AlertCircle size={20} />
        <div style={{ flex: 1 }}>
          <strong>Action Required:</strong> Your access has expired. Please subscribe to reactivate your workspace.
        </div>
        <button 
          className="btn-primary" 
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
          onClick={() => window.location.hash = '/app/settings'}
        >
          Subscribe Now
        </button>
      </div>
    );
  }

  return null;
}
