import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Check credentials or Firebase Auth rules.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Google Sign-In failed.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0E14', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'rgba(21, 26, 35, 0.7)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '440px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', background: 'linear-gradient(to right, #FFF, #9D84FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem' }}>Zion Grocery</h2>
        <p style={{ textAlign: 'center', color: '#8F9BB3', marginBottom: '2rem' }}>Premium React POS System</p>
        
        {error && <div style={{ color: '#FF3D71', backgroundColor: 'rgba(255, 61, 113, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
             <label style={{ display: 'block', fontSize: '0.9rem', color: '#8F9BB3', marginBottom: '0.5rem' }}>Email Address</label>
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }} />
          </div>
          <div>
             <label style={{ display: 'block', fontSize: '0.9rem', color: '#8F9BB3', marginBottom: '0.5rem' }}>Password</label>
             <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }} />
          </div>
          
          <button type="submit" style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6B48FF 0%, #5134d1 100%)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>Sign In to Dashboard</button>
        </form>
        
        <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: '#8F9BB3', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}></div>
          <span style={{ margin: '0 1rem' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}></div>
        </div>
        
        <button 
          onClick={handleGoogleLogin} 
          style={{ 
            width: '100%', 
            padding: '0.85rem', 
            borderRadius: '12px', 
            background: '#FFFFFF', 
            color: '#1F1F1F', 
            border: '1px solid #dadce0', 
            cursor: 'pointer', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '15px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f8f8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34a853"/>
            <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.588.102-1.166.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#fbbc05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.038.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#ea4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
