/**
 * `scripts/harness/path/index.mjs` の振る舞いを fake root で試す。
 *
 * `resolvePath` は純粋に `~` と相対を開いて絶対パスを返す。
 * `resolveStarter` は存在を確認して `self` か `other` を返す。
 */

import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../test/temp-dir.ts';
import { resolvePath, resolveStarter } from './index.mjs';

describe('resolvePath', () => {
  it('~ で始まる starter → HOME の下のパスになる', () => {
    const home = tempDir();
    const prev = process.env.HOME;
    process.env.HOME = home;
    try {
      expect(resolvePath(tempDir(), '~/starter')).toBe(join(home, 'starter'));
      expect(resolvePath(tempDir(), '~foo')).toBe(join(home, 'foo'));
    } finally {
      if (prev === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = prev;
      }
    }
  });

  it('相対の starter → ルートからの絶対パスになる', () => {
    const root = tempDir();
    expect(resolvePath(root, '../starter')).toBe(resolve(root, '../starter'));
    expect(resolvePath(root, 'sub')).toBe(resolve(root, 'sub'));
  });

  it('絶対の starter → そのパスになる', () => {
    const target = tempDir();
    expect(resolvePath(tempDir(), target)).toBe(resolve(target));
  });
});

describe('resolveStarter', () => {
  it('指されたパスがルートと同じ → self を返す', () => {
    const root = tempDir();
    expect(resolveStarter(root, root)).toEqual({ kind: 'self', path: resolve(root) });
  });

  it('指されたパスがルートと違う → other を返す', () => {
    const origin = tempDir();
    const local = tempDir();
    expect(resolveStarter(local, origin)).toEqual({ kind: 'other', path: resolve(origin) });
  });

  it('指されたパスがない → 1 行のエラーで投げる', () => {
    const local = tempDir();
    const missing = join(local, 'no-such-starter');
    let message = '';
    try {
      resolveStarter(local, missing);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain(missing);
    expect(message.trim().split('\n')).toHaveLength(1);
    expect(() => resolveStarter(local, missing)).toThrow();
  });
});
