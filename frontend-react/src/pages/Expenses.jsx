import { ArrowRightLeft } from 'lucide-react';

export default function Expenses() {
  return (
    <div className="page-container glass">
      <header>
        <div className="icon-box"><ArrowRightLeft size={24} /></div>
        <h2>Business Expenses</h2>
      </header>
      <p>Expense tracking and categorization module is being prepared for V2.</p>
      
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
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
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
