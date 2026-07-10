'use client';

import * as React from 'react';
import {
  Archive,
  ArchiveRestore,
  BarChart3,
  Copy,
  Download,
  Eye,
  FileText,
  History,
  Image,
  LayoutDashboard,
  Link2,
  Paintbrush,
  Pencil,
  Rocket,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ActionMenu, type ActionItem } from '@/components/ui/action-menu';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/auth/FormField';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { websiteHref } from '@/lib/websites/nav';
import type { WebsiteSummary } from '@/lib/websites/types';
import {
  renameWebsiteAction,
  duplicateWebsiteAction,
  archiveWebsiteAction,
  restoreWebsiteAction,
  deleteWebsiteAction,
} from '@/app/dashboard/websites/actions';

/**
 * Per-website overflow menu + its dialogs (rename, delete confirm). Real actions
 * (rename/duplicate/archive/restore/delete) call server actions through the service;
 * not-yet-built actions (preview/export/connect-domain) are marked disabled.
 */
export function WebsiteActions({ website }: { website: WebsiteSummary }) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [name, setName] = React.useState(website.name);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast({ variant: 'success', title: success });
      else toast({ variant: 'error', title: 'Action failed', description: res.error });
    });
  }

  const isArchived = website.status === 'ARCHIVED';

  const to = (segment: string) => websiteHref(website.id, segment);

  const items: ActionItem[] = [
    // Open / edit
    { label: 'Open dashboard', icon: LayoutDashboard, href: to('') },
    { label: 'Open Builder', icon: Paintbrush, href: to('builder') },
    { label: 'Generate content', icon: Sparkles, href: to('ai-generator') },
    { label: 'Preview', icon: Eye, disabled: true },
    // Modules (navigate to the website's tabs)
    { label: 'SEO', icon: Search, href: to('seo'), separatorBefore: true },
    { label: 'Pages', icon: FileText, href: to('pages') },
    { label: 'Deploy', icon: Rocket, href: to('deployments') },
    { label: 'Domains', icon: Link2, href: to('domains') },
    { label: 'Analytics', icon: BarChart3, href: to('analytics') },
    { label: 'Media', icon: Image, href: to('media') },
    { label: 'Versions', icon: History, href: to('versions') },
    // Manage
    { label: 'Rename', icon: Pencil, onSelect: () => setRenameOpen(true), separatorBefore: true },
    { label: 'Duplicate', icon: Copy, onSelect: () => run(() => duplicateWebsiteAction(website.id), 'Website duplicated') },
    isArchived
      ? { label: 'Restore', icon: ArchiveRestore, onSelect: () => run(() => restoreWebsiteAction(website.id), 'Website restored') }
      : { label: 'Archive', icon: Archive, onSelect: () => run(() => archiveWebsiteAction(website.id), 'Website archived') },
    { label: 'Download ZIP', icon: Download, disabled: true },
    { label: 'Delete', icon: Trash2, destructive: true, onSelect: () => setDeleteOpen(true), separatorBefore: true },
  ];

  async function submitRename() {
    const res = await renameWebsiteAction(website.id, name);
    if (res.ok) {
      toast({ variant: 'success', title: 'Website renamed' });
      setRenameOpen(false);
    } else {
      toast({ variant: 'error', title: 'Rename failed', description: res.error });
    }
  }

  return (
    <>
      <ActionMenu items={items} label={`Actions for ${website.name}`} />

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename website"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <LoadingButton type="button" loading={pending} onClick={() => startTransition(submitRename)}>
              Save
            </LoadingButton>
          </>
        }
      >
        <FormField id="website-name" label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          const res = await deleteWebsiteAction(website.id);
          if (res.ok) toast({ variant: 'success', title: 'Website deleted' });
          else toast({ variant: 'error', title: 'Delete failed', description: res.error });
        }}
        title={`Delete "${website.name}"?`}
        description="This permanently removes the website and its configuration. This cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
