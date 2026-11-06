'use client';
import { PageLayout } from '@/components/Layout/PageLayout';
import CheckWorkspace from '@/components/check/CheckWorkspace';
export default function LeakAnalyzerPage() {
  return (
    <PageLayout>
      <CheckWorkspace initialPreset="vpn" fixed />
    </PageLayout>
  );
}
