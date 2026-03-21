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
    } catch (_err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (_err) {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass">
        <header>
          <h1>ZION</h1>
          <p>POS Dashboard v2.0</p>
        </header>

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

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-color: var(--bg);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border-radius: var(--radius-lg);
          transition: var(--transition);
        }
        header {
          text-align: center;
          margin-bottom: 32px;
        }
        header h1 {
          font-size: 42px;
          letter-spacing: -2px;
          margin-bottom: 4px;
        }
        header p {
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 500;
        }
        .error-alert {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 12px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          margin-bottom: 24px;
          text-align: center;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }
        input {
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          background-color: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: inherit;
          transition: var(--transition);
        }
        input:focus {
          border-color: var(--accent);
          outline: none;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }
        .btn-primary {
          background-color: var(--accent);
          color: white;
          padding: 14px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 16px;
          margin-top: 8px;
        }
        .btn-primary:hover {
          background-color: var(--accent-hover);
          transform: translateY(-1px);
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
        }
        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background-color: var(--border);
        }
        .divider span {
          margin: 0 16px;
        }
        .btn-google {
          width: 100%;
          padding: 12px;
          border-radius: var(--radius-md);
          background-color: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: var(--transition);
        }
        .btn-google:hover {
          background-color: var(--surface-hover);
        }
        @media (max-width: 480px) {
          .login-card {
            padding: 30px 20px;
          }
          header h1 {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
