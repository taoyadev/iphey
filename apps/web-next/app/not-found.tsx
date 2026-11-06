import Link from 'next/link';
import NotFoundTools from '@/components/check/NotFoundTools';
import { PageLayout } from '@/components/Layout/PageLayout';
export default function NotFound() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-semibold">404 · Page not found</h1>
      <p>
        Arbitrary IP and ASN addresses use the query tools. Your requested address may not have a static detail page.
      </p>
      <NotFoundTools />
      <nav className="flex flex-wrap gap-4">
        {[
          ['/ip', 'Look up an IP'],
          ['/asn', 'Look up an ASN'],
          ['/', 'Check this environment'],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-accent">
            {label}
          </Link>
        ))}
      </nav>
    </PageLayout>
  );
}
