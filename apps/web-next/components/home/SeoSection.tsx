import Link from 'next/link';

const linkGroups = [
  {
    title: 'Guides',
    description: 'Long-form content for VPN leak testing, browser uniqueness, and IPhey methodology.',
    links: [
      { href: '/guides/how-to-test-vpn-leaks', label: 'How to test VPN leaks' },
      { href: '/guides/browser-fingerprinting-explained', label: 'Browser fingerprinting explained' },
      { href: '/guides/how-iphey-scores-digital-identity', label: 'How IPhey scores digital identity' },
    ],
  },
  {
    title: 'Fingerprinting topics',
    description: 'Technique-specific landing pages that connect theory to live scan workflows.',
    links: [
      { href: '/fingerprinting/canvas', label: 'Canvas fingerprinting' },
      { href: '/fingerprinting/webgl', label: 'WebGL fingerprinting' },
      { href: '/fingerprinting/webrtc', label: 'WebRTC leaks' },
    ],
  },
  {
    title: 'Comparisons',
    description: 'Position IPhey against browser-only tools and privacy scorecards.',
    links: [
      { href: '/vs/browserleaks', label: 'IPhey vs BrowserLeaks' },
      { href: '/vs/whoer', label: 'IPhey vs WHOER' },
      { href: '/vs/cover-your-tracks', label: 'IPhey vs Cover Your Tracks' },
    ],
  },
];

export default function SeoSection() {
  return (
    <section
      className="rounded-[2rem] border border-white/10 bg-surface/80 p-8 md:p-12"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Explore further</p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Move from one live scan into targeted guides and route pages
        </h2>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          The homepage now keeps the first visit lightweight. Deeper educational content lives in dedicated guides,
          fingerprinting topics, comparisons, and seed IP / ASN landing pages.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {linkGroups.map(group => (
          <div key={group.title} className="rounded-3xl border border-white/5 bg-black/20 p-6">
            <h3 className="text-xl font-semibold text-white">{group.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{group.description}</p>
            <div className="mt-5 space-y-3">
              {group.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className="block rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:border-accent/30 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
