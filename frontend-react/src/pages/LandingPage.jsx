import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Store, BarChart3, Users, 
  ShieldCheck, Smartphone, Zap, CheckCircle2,
  Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    // Basic reveal animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleCTA = () => {
    if (currentUser) {
      navigate('/app/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="landing-root">
      {/* Navigation */}
      <nav className="landing-nav glass">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="landing-logo">
              <Store size={24} color="white" />
            </div>
            <span className="brand-text">NexusPOS</span>
          </div>
          <div className="landing-nav-links">
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-primary" onClick={handleCTA}>Get Started <ArrowRight size={16} /></button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background-glow"></div>
        <div className="hero-content reveal">
          <div className="hero-badge">Next-Generation POS Software</div>
          <h1 className="hero-title">
            Run Your Business <br /> <span className="text-gradient">Without the Chaos</span>
          </h1>
          <p className="hero-subtitle">
            The all-in-one Multi-Tenant Point of Sale built for modern retailers. Handle fractional sales, track outstanding debts, and monitor real-time revenues in one stunning dashboard.
          </p>
          <div className="hero-cta-group">
            <button className="hero-btn-primary" onClick={handleCTA}>
              Start for Free <ArrowRight size={20} />
            </button>
            <button className="hero-btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth'})}>
              View Features
            </button>
          </div>
          <div className="hero-stats">
             <div className="stat-item"><CheckCircle2 size={16} color="var(--accent)"/> 14-Day Free Trial</div>
             <div className="stat-item"><CheckCircle2 size={16} color="var(--accent)"/> No Credit Card Required</div>
             <div className="stat-item"><CheckCircle2 size={16} color="var(--accent)"/> Instant Setup</div>
          </div>
        </div>
        
        {/* Abstract 3D Hero Image Replacement (CSS Art) */}
        <div className="hero-visual reveal">
          <div className="mockup-window glass">
            <div className="mockup-header">
               <span className="dot red"></span>
               <span className="dot yellow"></span>
               <span className="dot green"></span>
            </div>
            <div className="mockup-body">
               <div className="mockup-sidebar"></div>
               <div className="mockup-content">
                  <div className="mockup-card line"></div>
                  <div className="mockup-grid">
                     <div className="mockup-card small"></div>
                     <div className="mockup-card small"></div>
                     <div className="mockup-card small"></div>
                  </div>
                  <div className="mockup-chart">
                     <div className="bar b1"></div>
                     <div className="bar b2"></div>
                     <div className="bar b3"></div>
                     <div className="bar b4"></div>
                     <div className="bar b5"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="features-header reveal">
          <h2>Enterprise-grade tools, <br/>built for growth.</h2>
          <p>Everything you need to manage your inventory, sales, and customers natively.</p>
        </div>
        <div className="features-grid">
          {[
            { icon: BarChart3, title: 'Real-time Analytics', desc: 'Watch your revenue grow in real-time with stunning, auto-updating charts and KPIs.' },
            { icon: Users, title: 'Customer Debts', desc: 'Never lose track of unpaid balances. Manage customer credit limits and partial repayments.' },
            { icon: Zap, title: 'Fractional Sales', desc: 'Sell by the kilogram, liter, or pieces. Native UoM support for extreme accuracy.' },
            { icon: ShieldCheck, title: 'Multi-Tenant Security', desc: 'True SaaS isolation ensures your data is hermetically sealed within your business scope.' },
            { icon: Store, title: 'Multi-Store Ready', desc: 'Easily expand across locations while maintaining central visibility into stock levels.' },
            { icon: Smartphone, title: 'Mobile Optimized', desc: 'Manage your store from your iPad or mobile device with a highly responsive glass-morphism UI.' }
          ].map((feature, i) => (
            <div key={i} className="feature-card glass reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="feature-icon-wrapper">
                <feature.icon size={24} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section id="pricing" className="pricing-section reveal">
        <div className="pricing-card glass">
          <h2>Ready to transform your retail operations?</h2>
          <p>Join hundreds of businesses scaling with NexusPOS today.</p>
          <div className="pricing-price">
            <span className="currency">KSh</span>
            <span className="amount">1,500</span>
            <span className="period">/ month</span>
          </div>
          <p className="pricing-note">Start your 14-day free trial today. Cancel anytime.</p>
          <button className="hero-btn-primary mx-auto" onClick={handleCTA} style={{ marginTop: '32px' }}>
            Start 14-Day Free Trial <ArrowRight size={20} />
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} NexusPOS SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
