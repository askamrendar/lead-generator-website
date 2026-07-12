// Phase 8.5 — Internal event bus. In-process pub/sub used to decouple modules
// (deployment/AI/blog emit events; subscribers enqueue follow-up jobs or notify).

export type EventName =
  | 'deployment.succeeded'
  | 'deployment.failed'
  | 'ai.generated'
  | 'blog.generated'
  | 'job.failed'
  | 'job.succeeded';

export interface AppEvent {
  name: EventName;
  workspaceId?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

type Subscriber = (event: AppEvent) => void | Promise<void>;

const subscribers = new Map<EventName, Set<Subscriber>>();

export function on(name: EventName, fn: Subscriber): () => void {
  const set = subscribers.get(name) ?? new Set<Subscriber>();
  set.add(fn);
  subscribers.set(name, set);
  return () => set.delete(fn);
}

/** Emit an event; subscriber errors are isolated so one bad listener can't break others. */
export async function emit(event: AppEvent): Promise<void> {
  const set = subscribers.get(event.name);
  if (!set) return;
  await Promise.all(
    [...set].map(async (fn) => {
      try {
        await fn(event);
      } catch {
        // Swallow: the bus must never throw into the emitter.
      }
    }),
  );
}
