import { PageLayout } from '@/components/Layout/PageLayout';
import { HomeServerShell } from '@/components/home/HomeServerShell';
import DeferredHomeInteractive from '@/components/home/DeferredHomeInteractive';

export default function HomePage() {
  return (
    <PageLayout>
      <DeferredHomeInteractive />
      <HomeServerShell />
    </PageLayout>
  );
}
