import { DollarSign } from 'lucide-react';

export default function Sales() {
  return (
    <div className="page-container glass">
      <header>
        <div className="icon-box"><DollarSign size={24} /></div>
        <h2>Sales Point</h2>
      </header>
      <p>The new V2 Sales & Receipt interface is currently syncing. Check back shortly!</p>
      
      <style jsx>{`
        .page-container {
          padding: 48px;
          border-radius: var(--radius-lg);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          animation: fadeIn 0.4s ease-out;
        }
        .icon-box {
          width: 64px;
          height: 64px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        h2 { font-size: 24px; color: var(--text); }
        p { color: var(--text-muted); font-weight: 500; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
