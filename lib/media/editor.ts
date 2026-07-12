/**
 * Image-editor operation catalog (pure). Describes the transforms the editor UI
 * offers. Actual pixel processing requires an image pipeline (sharp) or a cloud
 * transform service — not present here — so operations are captured as intents and
 * marked `awaitingInfra`. This keeps the UX + contract ready without faking output.
 */
export type EditorOpId =
  | 'crop'
  | 'resize'
  | 'rotate'
  | 'flip'
  | 'background-remove'
  | 'ai-enhance'
  | 'to-webp'
  | 'to-avif';

export interface EditorOp {
  id: EditorOpId;
  label: string;
  /** Needs an image-processing backend that isn't wired yet. */
  awaitingInfra: boolean;
}

export const EDITOR_OPS: EditorOp[] = [
  { id: 'crop', label: 'Crop', awaitingInfra: true },
  { id: 'resize', label: 'Resize', awaitingInfra: true },
  { id: 'rotate', label: 'Rotate', awaitingInfra: true },
  { id: 'flip', label: 'Flip', awaitingInfra: true },
  { id: 'background-remove', label: 'Remove background', awaitingInfra: true },
  { id: 'ai-enhance', label: 'AI enhance', awaitingInfra: true },
  { id: 'to-webp', label: 'Convert to WebP', awaitingInfra: true },
  { id: 'to-avif', label: 'Convert to AVIF', awaitingInfra: true },
];
