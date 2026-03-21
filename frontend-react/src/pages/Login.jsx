import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, Sun, Moon } from 'lucide-react';

export default function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await loginWithEmail(email, password);
      navigate('/app/dashboard');
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
      navigate('/app/dashboard');
    } catch {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  return (
    <div className="login-page" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 32, left: 32, right: 32, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <button 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px', padding: 0 }}
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
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
          <h1>NexusPOS</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleEmailLogin}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="name@company.com"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn-primary">Sign In</button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleGoogleLogin} className="btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34a853"/>
            <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.588.102-1.166.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#fbbc05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.038.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#ea4335"/>
          </svg>
          Google Login
        </button>
      </div>

    </div>
  );
}
