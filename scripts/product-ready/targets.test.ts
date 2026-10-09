import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { findCycles, findTests, removeCycles, removeTests } from './targets.mjs';

function writeFile(path: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, 'x\n');
}

describe('findTests', () => {
  it('.pi/ の下だけを返す（test/ は対象外）', () => {
    const root = tmpDir();
    writeFile(join(root, '.pi', 'x.test.ts'));
    writeFile(join(root, '.pi', 'dir', 'y.test.ts'));
    writeFile(join(root, 'test', 'z.test.ts'));
    const found = findTests(root);
    expect(found).toHaveLength(2);
    expect(found).toContain(join(root, '.pi', 'x.test.ts'));
    expect(found).toContain(join(root, '.pi', 'dir', 'y.test.ts'));
  });

  it('.pi/ も cycles/ も無い root → []（投げない）', () => {
    const root = tmpDir();
    expect(findTests(root)).toEqual([]);
    expect(findCycles(root)).toEqual([]);
  });

  it('無い root → 投げる', () => {
    expect(() => findTests(join(tmpDir(), 'no-such-root'))).toThrow();
    expect(() => findCycles(join(tmpDir(), 'no-such-root'))).toThrow();
  });
});

describe('findCycles', () => {
  it('フォルダだけを返す（ファイルは対象外）', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    mkdirSync(join(root, 'cycles', '002-b'), { recursive: true });
    writeFile(join(root, 'cycles', 'README.md'));
    const found = findCycles(root);
    expect(found).toHaveLength(2);
    expect(found).toContain(join(root, 'cycles', '001-a'));
    expect(found).toContain(join(root, 'cycles', '002-b'));
  });
});

describe('removeTests / removeCycles', () => {
  it('removeTests を2回呼ぶ → 2回目は []', () => {
    const root = tmpDir();
    writeFile(join(root, '.pi', 'a.test.ts'));
    const targets = findTests(root);
    expect(targets).toHaveLength(1);
    expect(removeTests(root, targets)).toHaveLength(1);
    expect(findTests(root)).toEqual([]);
    expect(removeTests(root, targets)).toEqual([]);
  });

  it('removeCycles を2回呼ぶ → 2回目は []', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const targets = findCycles(root);
    expect(targets).toHaveLength(1);
    expect(removeCycles(root, targets)).toHaveLength(1);
    expect(findCycles(root)).toEqual([]);
    expect(removeCycles(root, targets)).toEqual([]);
  });
});
