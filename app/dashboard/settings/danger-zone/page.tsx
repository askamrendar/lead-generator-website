import { TriangleAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DangerZoneSettingsPage() {
  return (
    <Card className="border-red-500/30 p-6">
      <div className="flex items-center gap-2">
        <TriangleAlert className="size-4 text-red-600 dark:text-red-400" aria-hidden />
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Delete organization</p>
          <p className="text-sm text-muted-fg">
            Permanently remove this organization and all its workspaces, projects, and websites.
          </p>
        </div>
        <Button type="button" variant="outline" disabled title="Available in a later milestone">
          Delete
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-fg">
        Organization deletion is gated behind ownership safeguards and lands with Team management.
      </p>
    </Card>
  );
}
