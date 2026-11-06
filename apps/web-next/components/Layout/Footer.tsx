import { Shield, ExternalLink } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    resources: [
      { label: 'Help', href: '/docs' },
      { label: 'Privacy and data handling', href: '/privacy' },
      { label: 'API Reference', href: '/api-reference' },
      { label: 'GitHub Repository', href: 'https://github.com/taoyadev/iphey', external: true },
    ],
    creditTo: [
      { label: 'CreepJS Checker', href: 'https://creepjs.org/checker', external: true },
      { label: 'IPBot', href: 'https://ipbot.com', external: true },
      { label: 'BrowserLeaks', href: 'https://browserleaks.io', external: true },
      { label: 'Is It Down Or Just Me', href: 'https://isitdownorjustme.net/', external: true },
      { label: 'Volatile', href: 'https://volatile.sh/', external: true },
    ],
  };

  return (
    <footer
      className="relative mt-20 border-t border-white/5 bg-surface/70"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '480px' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full" />
                <Shield className="relative h-8 w-8 text-accent" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">IPhey</span>
                <span className="text-[10px] text-slate-400 -mt-1 tracking-wider uppercase">
                  Browser and connection checks
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-4">
              Check browser and connection observations, inspect their sources and limits, and compare changes on this
              device.
            </p>

            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Project</h3>
              <a
                href="https://github.com/taoyadev/iphey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 hover:text-accent transition-colors inline-flex items-center gap-2"
              >
                GitHub repository
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            </div>
          </div>

          <div>
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
                      <span className="opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all">
                        →
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
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
          </div>
        </div>

        <div className="py-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-xs text-slate-500 text-center">
              © {currentYear} IPhey Browser and connection checks. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
