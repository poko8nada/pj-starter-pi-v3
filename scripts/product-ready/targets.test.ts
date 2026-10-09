import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { findCycles, findTests, removeCycles, removeTests } from './targets.mjs';

function writeFile(path: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, 'x\n');
}

function writeBase(root: string): {
  readonly piX: string;
  readonly piY: string;
  readonly readyZ: string;
  readonly env: string;
} {
  const piX = join(root, '.pi', 'x.test.ts');
  const piY = join(root, '.pi', 'dir', 'y.test.ts');
  const readyZ = join(root, 'scripts', 'product-ready', 'z.test.ts');
  const env = join(root, 'test', 'env.test.ts');
  writeFile(piX);
  writeFile(piY);
  writeFile(readyZ);
  writeFile(env);
  return { piX, piY, readyZ, env };
}

describe('findTests', () => {
  it('名指しの3つ（.pi/・scripts/product-ready/・test/env.test.ts）を返す', () => {
    const root = tmpDir();
    const base = writeBase(root);
    const found = findTests(root);
    expect(found).toHaveLength(4);
    expect(found).toContain(base.piX);
    expect(found).toContain(base.piY);
    expect(found).toContain(base.readyZ);
    expect(found).toContain(base.env);
  });

  it('名指しの外（test/keep.test.ts・src/keep.test.ts）は食わない', () => {
    const root = tmpDir();
    writeBase(root);
    writeFile(join(root, 'test', 'keep.test.ts'));
    writeFile(join(root, 'src', 'keep.test.ts'));
    const found = findTests(root);
    expect(found).toHaveLength(4);
    expect(found).not.toContain(join(root, 'test', 'keep.test.ts'));
    expect(found).not.toContain(join(root, 'src', 'keep.test.ts'));
  });

  it('名指しの外（node_modules/・.git/）は返らない', () => {
    const root = tmpDir();
    const base = writeBase(root);
    writeFile(join(root, 'node_modules', 'a.test.ts'));
    writeFile(join(root, '.git', 'b.test.ts'));
    const found = findTests(root);
    expect(found).toHaveLength(4);
    expect(found).toContain(base.piX);
    expect(found).not.toContain(join(root, 'node_modules', 'a.test.ts'));
    expect(found).not.toContain(join(root, '.git', 'b.test.ts'));
  });

  it('名指しの内側の node_modules/ は返らない', () => {
    const root = tmpDir();
    writeBase(root);
    writeFile(join(root, '.pi', 'node_modules', 'a.test.ts'));
    const found = findTests(root);
    expect(found).toHaveLength(4);
    expect(found).not.toContain(join(root, '.pi', 'node_modules', 'a.test.ts'));
  });

  it('名指しの内側の .git/ は返らない', () => {
    const root = tmpDir();
    writeBase(root);
    writeFile(join(root, '.pi', '.git', 'a.test.ts'));
    const found = findTests(root);
    expect(found).toHaveLength(4);
    expect(found).not.toContain(join(root, '.pi', '.git', 'a.test.ts'));
  });

  it('無い対象は飛ばす（test/env.test.ts だけ無い木 → 残りを返す）', () => {
    const root = tmpDir();
    const piX = join(root, '.pi', 'x.test.ts');
    const piY = join(root, '.pi', 'dir', 'y.test.ts');
    const readyZ = join(root, 'scripts', 'product-ready', 'z.test.ts');
    writeFile(piX);
    writeFile(piY);
    writeFile(readyZ);
    const found = findTests(root);
    expect(found).toHaveLength(3);
    expect(found).toContain(piX);
    expect(found).toContain(piY);
    expect(found).toContain(readyZ);
  });

  it('vitest の既定 include（.spec.ts）も拾う', () => {
    const root = tmpDir();
    const base = writeBase(root);
    const spec = join(root, 'scripts', 'product-ready', 'z.spec.ts');
    writeFile(spec);
    const found = findTests(root);
    expect(found).toHaveLength(5);
    expect(found).toContain(base.piX);
    expect(found).toContain(base.readyZ);
    expect(found).toContain(base.env);
    expect(found).toContain(spec);
  });

  it('テストでない名指し（test/setup.ts）は拾わない', () => {
    const root = tmpDir();
    writeFile(join(root, 'test', 'setup.ts'));
    expect(findTests(root, ['test/setup.ts'])).toEqual([]);
  });

  it('対象が何も無い root → []（投げない）', () => {
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
