'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/auth/LoadingButton';

/**
 * Confirmation dialog built on Modal. Supports an async `onConfirm` (shows a spinner
 * and closes on success) and a destructive variant. Generic — reused by any module
 * that needs a "are you sure?" step (delete/archive/etc.).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <LoadingButton
            type="button"
            variant={destructive ? 'accent' : 'primary'}
            loading={loading}
            onClick={handleConfirm}
            className={destructive ? 'bg-red-600 text-white hover:bg-red-600/90' : undefined}
          >
            {confirmLabel}
          </LoadingButton>
        </>
      }
    />
  );
}
