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
        
        <button onClick={handleGoogleLogin} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontWeight: 'bold' }}>Sign in with Google</button>
      </div>
    </div>
  );
}
