import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/Layout/PageLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { SeoPageShell } from '@/components/seo/SeoPageShell';
import { getGuideBySlug, GUIDES } from '@/lib/guides';
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';

type GuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES.find(entry => entry.slug === slug);

  if (!guide) {
    return {};
  }

  return buildPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: [guide.category.toLowerCase(), 'browser fingerprinting', 'IPhey guide'],
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guideMeta = GUIDES.find(entry => entry.slug === slug);

  if (!guideMeta) {
    notFound();
  }

  const guide = await getGuideBySlug(guideMeta.slug);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
    { name: guide.title, path: `/guides/${guide.slug}` },
  ]);

  const article = buildArticleJsonLd({
    type: 'TechArticle',
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    publishedTime: guide.publishedAt,
  });

  return (
    <PageLayout>
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />
      <JsonLd data={buildFaqJsonLd(guide.faq)} />

      <SeoPageShell
        eyebrow={`${guide.category} guide`}
        title={guide.title}
        description={guide.description}
        liveNote="Choose one task, inspect the evidence, then repeat the same scope."
        relatedLinks={guide.relatedRoutes}
        faqs={guide.faq}
        ctaHref={guide.relatedRoutes[0]?.href ?? '/'}
        ctaLabel={guide.relatedRoutes[0]?.label ?? 'Run a check'}
        ctaTitle="Try the described task"
        ctaDescription="Use the main tool to compare the guidance on this page against your real browser, IP, and ASN state."
      >
        <section className="rounded-3xl border border-white/5 bg-surface/60 p-6 md:p-8">
          <div className="space-y-3">
            {guide.summaries.map(summary => (
              <p key={summary} className="text-lg leading-8 text-slate-300">
                {summary}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-surface/60 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-white">Table of contents</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {guide.headings.map(heading => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-slate-300 transition hover:border-accent/30 hover:text-white"
              >
                {heading.text}
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-surface/60 p-6 md:p-8">
          <div className="space-y-6">
            <guide.Content />
          </div>
        </section>
      </SeoPageShell>
    </PageLayout>
  );
}
