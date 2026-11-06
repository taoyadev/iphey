import Link from 'next/link';

interface StatItem {
  label: string;
  value: string;
  hint?: string;
}

interface RelatedLink {
  href: string;
  label: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface SeoPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  liveNote?: string;
  stats?: StatItem[];
  relatedLinks?: RelatedLink[];
  faqs?: FaqItem[];
  ctaTitle?: string;
  ctaDescription?: string;
  ctaHref?: string;
  ctaLabel?: string;
  children: React.ReactNode;
}

export function SeoPageShell({
  eyebrow,
  title,
  description,
  liveNote = 'Static page with live analysis links back to the main tool.',
  stats = [],
  relatedLinks = [],
  faqs = [],
  ctaTitle = 'Run a live scan',
  ctaDescription = 'Open the main inspector to compare live fingerprint, IP, ASN, and privacy signals.',
  ctaHref = '/',
  ctaLabel = 'Open the inspector',
  children,
}: SeoPageShellProps) {
  return (
    <article className="space-y-10">
      <section className="rounded-[2rem] border border-white/10 bg-surface/70 p-8 shadow-xl shadow-black/10 backdrop-blur-sm md:p-12">
        <div className="max-w-3xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
          <p className="text-lg leading-8 text-slate-300">{description}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-accent">{liveNote}</span>
          <Link
            href={ctaHref}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
          >
            {ctaLabel}
          </Link>
        </div>

        {stats.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(stat => (
              <div key={stat.label} className="rounded-3xl border border-white/5 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                {stat.hint && <p className="mt-2 text-sm leading-6 text-slate-400">{stat.hint}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">{children}</div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/5 bg-surface/60 p-6">
            <h2 className="text-lg font-semibold text-white">{ctaTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{ctaDescription}</p>
            <Link
              href={ctaHref}
              className="mt-5 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-accent/90"
            >
              {ctaLabel}
            </Link>
          </section>

          {relatedLinks.length > 0 && (
            <section className="rounded-3xl border border-white/5 bg-surface/60 p-6">
              <h2 className="text-lg font-semibold text-white">Related routes</h2>
              <div className="mt-4 space-y-3">
                {relatedLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-accent/30 hover:bg-white/5"
                  >
                    <p className="font-medium text-white">{link.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{link.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {faqs.length > 0 && (
            <section className="rounded-3xl border border-white/5 bg-surface/60 p-6">
              <h2 className="text-lg font-semibold text-white">FAQ</h2>
              <div className="mt-4 space-y-4">
                {faqs.map(faq => (
                  <div key={faq.question} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <h3 className="font-medium text-white">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
