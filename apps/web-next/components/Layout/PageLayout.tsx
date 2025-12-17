'use client';
import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SkipToContentLink } from '@/components/Accessibility/ScreenReaderAnnouncer';
import { CookieConsent } from '@/components/CookieConsent';

interface PageLayoutProps {
  children: ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipToContentLink targetId="main-content" />
      <Header />
      <main id="main-content" className="flex-1 px-4 py-10 md:px-8" role="main" aria-label="Main content">
        <div className="mx-auto max-w-7xl space-y-10">{children}</div>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
};
