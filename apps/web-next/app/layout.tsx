import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  other: { 'iphey-release': process.env.NEXT_PUBLIC_RELEASE_SHA ?? 'development' },
  title: {
    default: `${SITE_NAME} - Browser and Connection Checks`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Check your browser and connection, inspect observed evidence and compare changes on this device.',
  keywords: [
    'browser fingerprinting',
    'digital privacy',
    'IP reputation',
    'fingerprint detection',
    'online tracking',
    'privacy tool',
    'browser tracking',
    'digital identity',
    'proxy testing',
    'VPN testing',
    'anti-fingerprinting',
    'browser diagnostics',
    'canvas fingerprinting',
    'WebGL fingerprinting',
  ],
  authors: [{ name: `${SITE_NAME} Team`, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    title: `${SITE_NAME} - Browser and Connection Checks`,
    description:
      'Inspect browser and connection observations, their sources and limitations, and compare saved measurements.',
    siteName: SITE_NAME,
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Browser and Connection Checks`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Browser and Connection Checks`,
    description:
      'Inspect browser and connection observations, their sources and limitations, and compare saved measurements.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Enhanced Structured Data for SEO with FAQs
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Check browser and connection observations, inspect evidence and compare saved measurements.',
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className="antialiased bg-background text-foreground">{children}</body>
    </html>
  );
}
