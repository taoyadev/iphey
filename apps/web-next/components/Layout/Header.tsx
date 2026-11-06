import Link from 'next/link';
export const Header = () => (
  <header className="border-b border-white/10 bg-surface">
    <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="min-h-11 py-2 text-2xl font-semibold text-accent" href="/">
          IPhey
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-1">
          {[
            ['/', 'My check'],
            ['/ip', 'IP lookup'],
            ['/leaks', 'Leak test'],
            ['/compare', 'Compare'],
          ].map(([href, label]) => (
            <Link
              key={href}
              className="min-h-11 rounded-lg px-3 py-3 text-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-accent"
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <nav aria-label="More tools and help" className="flex flex-wrap gap-x-5 text-sm text-slate-400">
        {[
          ['/asn', 'ASN lookup'],
          ['/guides', 'Guides'],
          ['/docs', 'Help'],
          ['/api-reference', 'API'],
          ['/privacy', 'Privacy'],
        ].map(([href, label]) => (
          <Link key={href} className="min-h-11 py-3 hover:text-white" href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  </header>
);
