import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { AIChat } from '../components/ai';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://iphey.org'),
  title: {
    default: 'IPhey - Browser Fingerprint & Digital Identity Inspector',
    template: '%s | IPhey',
  },
  description:
    'Free browser fingerprinting tool and digital identity inspector. Test your online privacy, analyze IP reputation, detect tracking, and understand what websites see about you. Used by security professionals, privacy enthusiasts, and developers.',
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
    'GDPR compliance',
    'canvas fingerprinting',
    'WebGL fingerprinting',
  ],
  authors: [{ name: 'IPhey Team', url: 'https://iphey.org' }],
  creator: 'IPhey',
  publisher: 'IPhey',
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
    url: 'https://iphey.org',
    title: 'IPhey - Browser Fingerprint & Digital Identity Inspector',
    description:
      'Free browser fingerprinting tool and digital identity inspector. Test your online privacy, analyze IP reputation, and understand what websites see about you.',
    siteName: 'IPhey',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'IPhey — Browser Fingerprint & Digital Identity Inspector',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPhey - Browser Fingerprint & Digital Identity Inspector',
    description:
      'Free browser fingerprinting tool and digital identity inspector. Test your online privacy, analyze IP reputation, and understand what websites see about you.',
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
    canonical: 'https://iphey.org',
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
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://iphey.org/#software',
        name: 'IPhey',
        applicationCategory: 'SecurityApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'Free browser fingerprinting tool and digital identity inspector. Test your online privacy, analyze IP reputation, detect tracking, and understand what websites see about you.',
        operatingSystem: 'Web Browser',
        url: 'https://iphey.org',
        author: {
          '@type': 'Organization',
          name: 'IPhey',
          url: 'https://iphey.org',
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'hello@iphey.com',
            contactType: 'Customer Support',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1250',
        },
        featureList: [
          'Browser fingerprinting detection',
          'IP reputation analysis',
          'Digital identity inspection',
          'Privacy toolkit',
          'Real-time monitoring',
          'ASN analysis',
          'Threat intelligence',
        ],
      },
      {
        '@type': 'Organization',
        '@id': 'https://iphey.org/#organization',
        name: 'IPhey',
        url: 'https://iphey.org',
        logo: 'https://iphey.org/iphey.svg',
        sameAs: ['https://github.com/7and1/iphey'],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@iphey.com',
          contactType: 'Customer Support',
          availableLanguage: 'English',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://iphey.org/#website',
        url: 'https://iphey.org',
        name: 'IPhey - Browser Fingerprint & Digital Identity Inspector',
        description:
          'Free browser fingerprinting tool and digital identity inspector. Test your online privacy, analyze IP reputation, and understand what websites see about you.',
        publisher: {
          '@id': 'https://iphey.org/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://iphey.org/?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://iphey.org/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is browser fingerprinting?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Browser fingerprinting is a tracking technique that collects information about your browser configuration, device characteristics, and system settings to create a unique identifier. This includes canvas fingerprinting, WebGL data, fonts, screen resolution, timezone, and other attributes that make your browser uniquely identifiable.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is IPhey free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, IPhey is completely free with no hidden fees or premium tiers. All features including browser fingerprinting analysis, IP intelligence, threat detection, and privacy recommendations are available at no cost.',
            },
          },
          {
            '@type': 'Question',
            name: 'How accurate is browser fingerprinting?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'According to research, 99.24% of users can be uniquely identified when combining browser and device fingerprints, and 80-90% of browser fingerprints are unique enough for accurate tracking. The Electronic Frontier Foundation found that 94% of browsers are uniquely identifiable.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does IPhey store my data?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. IPhey does not store your fingerprints, track you across sessions, or sell your data. All analysis happens in your browser, and the results are yours alone. We prioritize your privacy and transparency.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I use IPhey to test my VPN or proxy?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. IPhey is commonly used by security professionals and privacy enthusiasts to test proxy setups, verify VPN connections, and detect fingerprint leaks. You can compare your fingerprint with and without privacy tools to see how effective they are.',
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          {children}
          <AIChat />
        </ThemeProvider>
      </body>
    </html>
  );
}
