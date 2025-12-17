'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('cookie-consent');
    if (!consentGiven) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('cookie-consent', 'essential-only');
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-surface/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <Cookie className="h-6 w-6 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-white">Cookie Consent</h3>
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                    We use cookies to enhance your browsing experience and analyze our traffic. By clicking &quot;Accept
                    All&quot;, you consent to our use of cookies. You can also choose to reject non-essential cookies.
                    We do not store your fingerprint data or track you across sessions. All analysis happens client-side
                    in your browser. For more information, see our privacy practices in our{' '}
                    <a href="/docs" className="text-accent hover:underline">
                      documentation
                    </a>
                    .
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 bg-accent text-slate-900 hover:bg-accent/90 h-9 rounded-lg px-4"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={handleRejectNonEssential}
                      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white h-9 rounded-lg px-4 text-slate-300"
                    >
                      Reject Non-Essential
                    </button>
                    <a href="/docs">
                      <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 hover:bg-white/5 hover:text-white h-9 rounded-lg px-4 text-slate-400">
                        Privacy Policy
                      </button>
                    </a>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close cookie banner"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
