'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/auth/FormField';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import type { WebsiteSummary } from '@/lib/websites/types';
import {
  renameWebsiteAction,
  setWebsiteTemplateAction,
  archiveWebsiteAction,
  restoreWebsiteAction,
  deleteWebsiteAction,
} from '@/app/dashboard/websites/actions';

/** Display options mirroring templates/html/registry (kept local — importing the
 *  registry would ship every pack's markup to the client bundle). */
const TEMPLATE_OPTIONS = [
  { id: 'template-1', label: 'Template 1 — Classic contractor (light)' },
  { id: 'template-2', label: 'Template 2 — Modern emergency service (dark)' },
] as const;

/** Legacy stored id → canonical (mirrors the registry's alias). */
const currentTemplateId = (raw: string | null): string =>
  raw === 'royal-oak' || !raw ? 'template-1' : raw;

/** Website settings: rename + design (template) + danger zone (archive/restore, delete). */
export function WebsiteSettings({ website }: { website: WebsiteSummary }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState(website.name);
  const [templateId, setTemplateId] = React.useState(currentTemplateId(website.templateId));
  const [pending, setPending] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const isArchived = website.status === 'ARCHIVED';

  function save() {
    setPending(true);
    void (async () => {
      const res = await renameWebsiteAction(website.id, name);
      setPending(false);
      if (res.ok) {
        toast({ variant: 'success', title: 'Saved' });
        router.refresh();
      } else {
        toast({ variant: 'error', title: 'Save failed', description: res.error });
      }
    })();
  }

  function saveTemplate() {
    setPending(true);
    void (async () => {
      const res = await setWebsiteTemplateAction(website.id, templateId);
      setPending(false);
      if (res.ok) {
        toast({ variant: 'success', title: 'Template updated' });
        router.refresh();
      } else {
        toast({ variant: 'error', title: 'Save failed', description: res.error });
      }
    })();
  }

  function toggleArchive() {
    setPending(true);
    void (async () => {
      const res = isArchived
        ? await restoreWebsiteAction(website.id)
        : await archiveWebsiteAction(website.id);
      setPending(false);
      if (res.ok) {
        toast({ variant: 'success', title: isArchived ? 'Restored' : 'Archived' });
        router.refresh();
      } else {
        toast({ variant: 'error', title: 'Action failed', description: res.error });
      }
    })();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground">General</h2>
        <div className="mt-4 space-y-4">
          <FormField id="ws-name" label="Website name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField id="ws-slug" label="Slug" hint="The slug is generated and stable.">
            <Input value={website.slug} readOnly disabled />
          </FormField>
          <LoadingButton type="button" loading={pending} onClick={save}>
            Save changes
          </LoadingButton>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground">Design</h2>
        <div className="mt-4 space-y-4">
          <FormField
            id="ws-template"
            label="Template"
            hint="Changes apply immediately to the live site, preview, and exports."
          >
            <select
              id="ws-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <LoadingButton type="button" loading={pending} onClick={saveTemplate}>
            Save template
          </LoadingButton>
        </div>
      </Card>

      <Card className="border-red-500/30 p-6">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {isArchived ? 'Restore website' : 'Archive website'}
              </p>
              <p className="text-sm text-muted-fg">
                {isArchived
                  ? 'Make this website active again.'
                  : 'Hide this website from the active list. You can restore it later.'}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={toggleArchive} disabled={pending}>
              {isArchived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
              {isArchived ? 'Restore' : 'Archive'}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">Delete website</p>
              <p className="text-sm text-muted-fg">Permanently remove this website. This cannot be undone.</p>
            </div>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-600/90"
              onClick={() => setDeleteOpen(true)}
              disabled={pending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          const res = await deleteWebsiteAction(website.id);
          if (res.ok) {
            toast({ variant: 'success', title: 'Website deleted' });
            router.push('/dashboard/websites');
          } else {
            toast({ variant: 'error', title: 'Delete failed', description: res.error });
          }
        }}
        title={`Delete "${website.name}"?`}
        description="This permanently removes the website and its configuration."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
