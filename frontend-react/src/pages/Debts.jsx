import { Calendar } from 'lucide-react';

export default function Debts() {
  return (
    <div className="page-container glass">
      <header>
        <div className="icon-box"><Calendar size={24} /></div>
        <h2>Customer Debts</h2>
      </header>
      <p>The debt management and tracking module is being migrated to POS V2.</p>
      
      <style jsx>{`
        .page-container {
          padding: 48px;
          border-radius: var(--radius-lg);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .icon-box {
          width: 64px;
          height: 64px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        h2 { font-size: 24px; color: var(--text); }
        p { color: var(--text-muted); font-weight: 500; }
      `}</style>
    </div>
  );
}
