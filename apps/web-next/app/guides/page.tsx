import type { Metadata } from 'next';
import Link from 'next/link';
import { PageLayout } from '@/components/Layout/PageLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { getAllGuides } from '@/lib/guides';

export const metadata: Metadata = buildPageMetadata({
  title: 'Guides',
  description: 'Long-form guides on browser fingerprinting, VPN leak testing, IP reputation, and IPhey methodology.',
  path: '/guides',
  keywords: ['browser fingerprinting guides', 'VPN leak guide', 'IP reputation guide', 'fingerprint privacy'],
});

const breadcrumb = buildBreadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/guides' },
]);

const article = buildArticleJsonLd({
  title: 'IPhey guides',
  description: 'Long-form guides on browser fingerprinting, VPN leak testing, and digital identity scoring.',
  path: '/guides',
});

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <PageLayout>
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />

      <div className="space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-surface/70 p-8 shadow-xl shadow-black/10 backdrop-blur-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Guides</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Practical guides for browser fingerprinting and network identity
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            These guides are written for people who need operational answers: what changed, why it matters, and how to
            test the next step without guessing.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {guides.map(guide => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="rounded-3xl border border-white/5 bg-surface/60 p-6 transition hover:border-accent/30 hover:bg-white/5"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  {guide.category}
                </span>
                <span className="text-xs text-slate-500">{guide.publishedAt}</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">{guide.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{guide.description}</p>
              <div className="mt-5 space-y-2">
                {guide.summaries.map(summary => (
                  <p key={summary} className="text-sm leading-7 text-slate-300">
                    {summary}
                  </p>
                ))}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </PageLayout>
  );
}
