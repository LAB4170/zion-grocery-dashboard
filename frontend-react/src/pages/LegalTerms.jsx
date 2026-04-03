import React from 'react';

const LegalTerms = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">Terms of Service</h1>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-800">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Nexus POS, you agree to comply with and be bound by these Terms of Service. 
              Our service is provided to businesses in Kenya and across the globe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Service Access</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nexus POS is currently provided as a free service for all micro-businesses.</li>
              <li>You can create one workspace per account with full access to all features.</li>
              <li>Future premium features may be introduced, but existing core POS features will remain accessible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">3. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for 
              all activities that occur under your account. You must ensure that your use of the service 
              complies with local tax and business regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Limitation of Liability</h2>
            <p>
              Nexus POS is provided "as is". While we strive for 100% uptime and data integrity, we are 
              not liable for any data loss, profit loss, or business interruptions caused by the use of this service.
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

export default LegalTerms;
