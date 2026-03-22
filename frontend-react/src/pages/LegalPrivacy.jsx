import React from 'react';

const LegalPrivacy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">Privacy Policy</h1>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-800">Effective Date: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Compliance with Kenya Data Protection Act (2019)</h2>
            <p>
              Nexus POS is committed to protecting the privacy and security of your personal data in accordance with 
              the Data Protection Act, 2019 of the Laws of Kenya. This policy explains how we collect, use, and safeguard 
              your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Business Name and Contact Information</li>
              <li>User Login Credentials (managed via Firebase Authentication)</li>
              <li>Transaction Records (Sales, Expenses, Debts)</li>
              <li>Inventory Data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Purpose of Processing</h2>
            <p>
              We process your data solely to provide the Point of Sale services, calculate business analytics, 
              and maintain your financial records. We do not sell your personal or business data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Data Security</h2>
            <p>
              We implement industry-standard technical and organizational measures to secure your data, 
              including encryption in transit (SSL/TLS) and secure database backups.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Your Rights</h2>
            <p>
              Under the Data Protection Act, you have the right to access, rectify, or erase your personal data, 
              as well as the right to object to processing. To exercise these rights, please contact our support.
            </p>
          </section>

          <div className="pt-8 border-t border-slate-100 flex justify-center">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPrivacy;
