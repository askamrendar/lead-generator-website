import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { favoriteWebsites, pinnedWebsites, recentWebsites } from '@/lib/productivity/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { WebsiteGrid } from '@/components/productivity/WebsiteGrid';

export const metadata: Metadata = { title: 'Favorites & Pinned' };

export default async function FavoritesPage() {
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return <EmptyState icon={Star} title="No workspace selected" description="Select a workspace to see favorites." />;
  }
  const wsId = ctx.currentWorkspace.id;
  const [pinned, favorites, recent] = await Promise.all([
    pinnedWebsites(wsId),
    favoriteWebsites(wsId),
    recentWebsites(wsId),
  ]);

  return (
    <PageContainer>
      <PageHeader title="Favorites & Pinned" description="Quick access to the websites you work on most." />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Pinned</h2>
        <WebsiteGrid websites={pinned} emptyTitle="No pinned websites" emptyDescription="Pin a website to keep it at the top." />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Favorites</h2>
        <WebsiteGrid websites={favorites} emptyTitle="No favorites yet" emptyDescription="Star a website to add it here." />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recent</h2>
        <WebsiteGrid websites={recent} emptyTitle="No recent websites" emptyDescription="Websites you open will appear here." />
      </section>
    </PageContainer>
  );
}
