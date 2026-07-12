/**
 * Generic bounded undo/redo history — pure and value-typed, so it works for the
 * page state (or any immutable snapshot) and is unit-testable
 * (tests/builder-history.test.mjs). The editor pushes a new snapshot after each
 * committed operation; undo/redo return a new history + the current value.
 */

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  limit: number;
}

export function initHistory<T>(present: T, limit = 50): History<T> {
  return { past: [], present, future: [], limit };
}

/** Commit a new present; clears the redo stack; drops oldest past beyond `limit`. */
export function push<T>(history: History<T>, next: T): History<T> {
  const past = [...history.past, history.present];
  const overflow = past.length - history.limit;
  return {
    past: overflow > 0 ? past.slice(overflow) : past,
    present: next,
    future: [],
    limit: history.limit,
  };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1]!;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
    limit: history.limit,
  };
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history;
  const next = history.future[0]!;
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
    limit: history.limit,
  };
}
