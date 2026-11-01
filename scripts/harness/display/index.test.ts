/**
 * `scripts/harness/display/index.mjs` の振る舞いを試す。
 *
 * `formatLines` は純粋に表示の行を作る。期待はテストが渡した値から組み立てる。
 */

import { describe, expect, it } from 'vitest';
import {
  countLine,
  indented,
  MISSING,
  COPY,
  pullLine,
  pushLine,
} from '../../../test/scripts.fixture.ts';
import { formatLines } from './index.mjs';

describe('formatLines', () => {
  it('missing と copy がある → 見出し、missing (n):、copy (n): の順に出る', () => {
    const starter = '/tmp/origin';
    const root = '/tmp/local';
    const missing = '.pi/b.ts';
    const rel = '.pi/a.ts';
    const lines = formatLines('pull', starter, root, { copy: [rel], missing: [missing] });
    expect(lines[0]).toBe(pullLine(starter, root));
    expect(lines[1]).toBe(countLine(MISSING, 1));
    expect(lines[2]).toBe(indented(missing));
    expect(lines[3]).toBe(countLine(COPY, 1));
    expect(lines[4]).toBe(indented(rel));
  });

  it('missing も copy も空 → no files missing と no files to copy が出る', () => {
    const lines = formatLines('pull', '/tmp/origin', '/tmp/local', { copy: [], missing: [] });
    expect(lines).toContain('no files missing');
    expect(lines).toContain('no files to copy');
  });

  it('push → push: の見出しになる', () => {
    const starter = '/tmp/origin';
    const root = '/tmp/local';
    const lines = formatLines('push', starter, root, { copy: [], missing: [] });
    expect(lines[0]).toBe(pushLine(root, starter));
  });
});
