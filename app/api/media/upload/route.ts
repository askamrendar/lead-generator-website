import { NextResponse } from 'next/server';
import { accessErrorResponse } from '@/lib/auth/access';
import { serverError, enforceRateLimit } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';
import { uploadAsset } from '@/lib/media/service';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file

/**
 * Media upload — multipart POST. Workspace-scoped (tenant-access enforced in the
 * service). Accepts one or more `file` fields + a `workspaceId` (and optional
 * `folderId`). Stores via the active StorageProvider (Local by default).
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'media-upload', LIMITS.generate());
  if (limited) return limited;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const workspaceId = String(form.get('workspaceId') ?? '');
  const folderId = form.get('folderId') ? String(form.get('folderId')) : null;
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

  const files = form.getAll('file').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'No files' }, { status: 400 });

  try {
    const uploaded = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `${file.name} exceeds 20 MB` }, { status: 413 });
      }
      const data = new Uint8Array(await file.arrayBuffer());
      const asset = await uploadAsset(workspaceId, {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        data,
        folderId,
      });
      uploaded.push(asset);
    }
    return NextResponse.json({ ok: true, uploaded });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unsupported file type.') {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 415 });
    }
    return accessErrorResponse(err) ?? serverError('media/upload', err);
  }
}
