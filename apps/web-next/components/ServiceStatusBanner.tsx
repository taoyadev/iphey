'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Activity } from 'lucide-react';
import { useTranslations } from '@/lib/translations';
import type { ServiceStatus } from '@/types/report';

interface ServiceStatusBannerProps {
  status?: ServiceStatus;
  isLoading?: boolean;
  onDismiss?: () => void;
}

const ServiceStatusBannerComponent = ({ status, isLoading, onDismiss }: ServiceStatusBannerProps) => {
  const t = useTranslations('services');
  if (isLoading) {
    return (
      <motion.div
        className="mb-6 rounded-2xl border border-white/5 bg-blue-500/5 backdrop-blur-sm p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Activity className="text-blue-300" size={20} />
          </motion.div>
          <p className="text-sm text-blue-200">Checking service status...</p>
        </div>
      </motion.div>
    );
  }

  if (!status) {
    return null;
  }

  const services = [
    { key: 'geolocation', label: 'Geolocation', enabled: status.geolocation },
    { key: 'threat_intelligence', label: 'Threat Intelligence', enabled: status.threat_intelligence },
    { key: 'asn_analysis', label: 'ASN Analysis', enabled: status.asn_analysis },
  ];

  const allEnabled = services.every(s => s.enabled);
  const someDisabled = services.some(s => !s.enabled);
  const allDisabled = services.every(s => !s.enabled);

  // Don't show banner if all services are enabled
  if (allEnabled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`mb-6 rounded-2xl border backdrop-blur-sm p-4 ${
          allDisabled ? 'bg-rose-500/5 border-rose-400/20' : 'bg-amber-500/5 border-amber-400/20'
        }`}
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {allDisabled ? (
              <XCircle className="text-rose-300 flex-shrink-0" size={24} strokeWidth={2} />
            ) : (
              <AlertCircle className="text-amber-300 flex-shrink-0" size={24} strokeWidth={2} />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold mb-2 ${allDisabled ? 'text-rose-200' : 'text-amber-200'}`}>
              {allDisabled ? t('allUnavailable') : t('someUnavailable')}
            </h3>
            <p className={`text-sm mb-3 ${allDisabled ? 'text-rose-100/80' : 'text-amber-100/80'}`}>
              {allDisabled ? t('noBackend') : t('limitedFeatures')}
            </p>

            {/* Service Status List */}
            <div className="grid gap-2">
              {services.map((service, index) => (
                <motion.div
                  key={service.key}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    service.enabled
                      ? 'bg-emerald-500/10 border border-emerald-400/20'
                      : 'bg-slate-500/10 border border-slate-400/20'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {service.enabled ? (
                    <CheckCircle2 className="text-emerald-300 flex-shrink-0" size={16} />
                  ) : (
                    <XCircle className="text-slate-400 flex-shrink-0" size={16} />
                  )}
                  <span className={service.enabled ? 'text-emerald-100' : 'text-slate-300'}>{service.label}</span>
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      service.enabled ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {service.enabled ? 'Active' : 'Unavailable'}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Help Text */}
            {someDisabled && (
              <motion.p
                className="text-xs text-slate-400 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Configure API keys in the backend .env file to enable all services.
              </motion.p>
            )}
          </div>

          {/* Dismiss Button */}
          {onDismiss && (
            <motion.button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white transition-colors p-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XCircle size={20} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const ServiceStatusBanner = memo(ServiceStatusBannerComponent);
