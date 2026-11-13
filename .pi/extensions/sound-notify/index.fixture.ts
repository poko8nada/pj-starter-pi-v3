/**
 * sound-notify のテストの前提を組み立てる fixture である。
 *
 * `recordingPi()` は、`handlers` と `calls` を記録する偽の `pi` を返す。
 * この fixture はテストの中だけで使う。テストの外でも止まらない。
 */

import type { EntryPiPort } from './index.ts';

export interface RecordingPi {
  readonly pi: EntryPiPort;
  readonly handlers: ReadonlyMap<string, (...args: unknown[]) => unknown>;
  readonly calls: readonly { readonly command: string; readonly args: readonly string[] }[];
}

function isHandler(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function recordingPi(): RecordingPi {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const calls: Array<{ command: string; args: string[] }> = [];
  const pi: EntryPiPort = {
    on: (...args: unknown[]) => {
      const [event, handler] = args;
      if (typeof event === 'string' && isHandler(handler)) {
        handlers.set(event, handler);
      }
      return () => undefined;
    },
    exec: async (command: string, args: string[]) => {
      calls.push({ command, args });
      return undefined;
    },
  };
  return { pi, handlers, calls };
}
