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

        {/* Subscription Engine Removed by User Request */}
        {/* <SubscriptionCard business={business} setBusiness={setBusiness} /> */}
      </div>
    </div>
  );
}

// Subscription UI Removed
/*
function SubscriptionCard({ business, setBusiness }) {
  ...
}
*/
