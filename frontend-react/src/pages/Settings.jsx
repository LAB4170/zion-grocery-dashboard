import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { Store, User, Mail, ShieldCheck, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const { business, setBusiness } = useBusiness();
  const { currentUser } = useAuth();
  
  const [name, setName] = useState(business?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      const response = await api.put('/business/me', { name });
      setBusiness(response.data.data);
      setMessage({ text: 'Business profile updated successfully.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Business Settings</h1>
        <p>Manage your store profile, tenant data, and configurations.</p>
      </div>

      <div className="settings-grid">
        
        {/* Profile Card */}
        <div className="settings-card glass" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <Store size={24} color="var(--accent)" />
            <h2>Store Profile</h2>
          </div>
          
          <form onSubmit={handleUpdate} className="settings-form">
            <div className="form-group">
              <label>Business Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="input-premium"
                placeholder="e.g. Nexus Retails"
              />
              <span className="input-hint">This name appears on receipts, invoices, and reports.</span>
            </div>

            {message.text && (
              <div className={`settings-alert ${message.type}`}>
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {message.text}
              </div>
            )}

            <button type="submit" className="btn-primary btn-save" disabled={saving || !name.trim() || name === business?.name}>
              {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          </form>
        </div>

        {/* Tenant Information (Read Only) */}
        <div className="settings-card glass">
          <div className="card-header">
             <User size={24} color="var(--accent-secondary)" />
             <h2>Owner Details</h2>
          </div>
          <div className="info-list">
             <div className="info-item">
               <Mail size={16} />
               <div className="info-text">
                 <span>Email Address</span>
                 <strong>{currentUser?.email}</strong>
               </div>
             </div>
             <div className="info-item">
               <ShieldCheck size={16} />
               <div className="info-text">
                 <span>Authentication Provider</span>
                 <strong>Google OAuth / Firebase</strong>
               </div>
             </div>
          </div>
        </div>

        {/* Subscription Engine for Daraja MPesa API */}
        <SubscriptionCard business={business} setBusiness={setBusiness} />
      </div>
    </div>
  );
}

function SubscriptionCard({ business, setBusiness }) {
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const handleSTKPush = async (e) => {
    e.preventDefault();
    if (!phone) return;

    try {
      setProcessing(true);
      setStatusMsg({ text: 'Initiating M-Pesa STK Push...', type: 'info' });

      // Trigger the backend Daraja API integration
      const response = await api.post('/payments/pay', { phone, amount: 1500 });
      
      // Update local tenant UI to clear the "Trial" status instantly based on prototype mock response
      if (response.data.success) {
        setBusiness({ ...business, subscription_status: 'active', subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
        setStatusMsg({ text: response.data.message, type: 'success' });
        setPhone('');
      }
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'M-Pesa payment failed.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const isTrial = business?.subscription_status === 'trial';
  const isActive = business?.subscription_status === 'active';
  const isPastDue = business?.subscription_status === 'past_due';

  const formatEnd = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';

  return (
    <div className={`settings-card glass subscription-card ${isPastDue ? 'past-due' : isActive ? 'active-sub' : ''}`}>
      <div className="card-header">
         <Store size={24} color={isActive ? "#10B981" : "#F59E0B"} />
         <h2>Subscription Details</h2>
      </div>
      <div className="subscription-status">
         {isTrial && <span className="badge-pro">14-Day Free Trial</span>}
         {isActive && <span className="badge-pro" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>Active Pro Plan</span>}
         {isPastDue && <span className="badge-pro" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Subscription Expired</span>}
         
         <div className="billing-dates" style={{ marginTop: 12, marginBottom: 20, color: 'var(--text-muted)' }}>
           {isTrial && <p>Your automated free trial ends on <strong>{formatEnd(business?.trial_ends_at)}</strong>.</p>}
           {isActive && <p>Your workspace is active until <strong>{formatEnd(business?.subscription_ends_at)}</strong>.</p>}
           {isPastDue && <p style={{ color: 'var(--danger)' }}>Workspace is locked to Read-Only mode. Please renew to continue making sales.</p>}
         </div>

         {!isActive && (
           <form onSubmit={handleSTKPush} className="mpesa-form">
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Safaricom M-Pesa Number</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="2547XXXXXXXX" 
                  className="input-premium"
                  style={{ flex: 1 }}
                />
              </div>
              
              {statusMsg.text && (
                <div style={{ fontSize: 13, padding: '8px 12px', background: statusMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: statusMsg.type === 'error' ? 'var(--danger)' : 'var(--accent)', borderRadius: 6, marginBottom: 16 }}>
                  {statusMsg.text}
                </div>
              )}

              <button type="submit" className="hero-btn-primary" disabled={processing || !phone} style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: 8, position: 'relative' }}>
                {processing ? 'Processing...' : 'Pay KSh 1,500 via M-Pesa'}
              </button>
           </form>
         )}
      </div>
    </div>
  );
}
