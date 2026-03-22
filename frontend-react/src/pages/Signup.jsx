import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowLeft, Sun, Moon, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address. Please log in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-up was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by your browser. Please allow popups for this site.';
      default:
        return 'Sign-up failed. Please verify your details and try again.';
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    
    try {
      setError('');
      setLoading(true);
      await signupWithEmail(email, password);
      // Immediately navigate to onboarding after successful creation
      navigate('/onboarding');
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      await loginWithGoogle();
      navigate('/onboarding');
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ position: 'relative' }}>
      {/* Top nav bar */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', zIndex: 10
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', color: 'var(--text-muted)',
            fontWeight: 600, fontSize: '14px', padding: '8px 4px'
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={toggleTheme}
          style={{ background: 'transparent', color: 'var(--text-muted)', padding: '8px' }}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>
      </div>

      {/* Signup card */}
      <div className="login-card glass">
        <div className="login-header">
          <div className="login-logo">
            <Store size={36} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>Create Account</h1>
          <p style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)' }}>Start managing your store today</p>
        </div>

        {error && (
          <div className="error-alert" role="alert" style={{
            fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
            lineHeight: '1.4', wordBreak: 'break-word'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignup} style={{ width: '100%' }}>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              autoComplete="email"
              style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)' }}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                minLength="6"
                style={{
                  paddingRight: '44px',
                  fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                  width: '100%', boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: '4px' }}>
            <label>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              minLength="6"
              style={{
                fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                width: '100%', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)'
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        <button
          onClick={handleGoogleSignup}
          className="btn-google"
          disabled={googleLoading}
          style={{
            opacity: googleLoading ? 0.7 : 1,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            fontSize: 'clamp(0.85rem, 3vw, 1rem)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '10px', width: '100%'
          }}
        >
          {googleLoading ? (
            <span>Connecting...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34a853"/>
                <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.588.102-1.166.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#fbbc05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.038.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#ea4335"/>
              </svg>
              Sign up with Google
            </>
          )}
        </button>
        
        <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}
