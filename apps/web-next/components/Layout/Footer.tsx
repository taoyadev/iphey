'use client';
import { motion } from 'framer-motion';
import { Shield, ExternalLink } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api-reference' },
      { label: 'GitHub Repository', href: 'https://github.com/taoyadev/iphey', external: true },
    ],
    creditTo: [
      { label: 'CreepJS Checker', href: 'https://creepjs.org/checker', external: true },
      { label: 'IPBot', href: 'https://www.ipbot.com', external: true },
      { label: 'BrowserLeaks', href: 'https://browserleaks.io', external: true },
    ],
  };

  return (
    <footer className="relative mt-20 border-t border-white/5 bg-surface/60 backdrop-blur-sm">
      {/* Gradient accent border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full" />
                <Shield className="relative h-8 w-8 text-accent" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">IPhey</span>
                <span className="text-[10px] text-slate-400 -mt-1 tracking-wider uppercase">Identity Intelligence</span>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sm text-slate-400 leading-relaxed max-w-md mb-4"
            >
              Advanced browser fingerprint intelligence service providing digital identity analysis through IP
              reputation, location fidelity, and browser consistency.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Contact</h3>
              <a
                href="mailto:hello@iphey.com"
                className="text-sm text-slate-400 hover:text-accent transition-colors inline-flex items-center gap-2"
              >
                hello@iphey.com
              </a>
            </motion.div>
          </div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-slate-400 hover:text-accent transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    {link.external ? (
                      <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        →
                      </motion.span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Credit To Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Credit to</h3>
            <ul className="space-y-3">
              {footerLinks.creditTo.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-slate-400 hover:text-accent transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    {link.external && (
                      <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="py-6 border-t border-white/5"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-xs text-slate-500 text-center">
              © {currentYear} IPhey Identity Intelligence. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
