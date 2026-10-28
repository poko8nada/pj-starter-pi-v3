import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../test/temp-dir.ts';
import { labels, plan, remove, skeletonFor } from './targets.mjs';

function writeAt(root: string, rel: string): void {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x\n');
}

function makeCycleNames(): readonly string[] {
  return ['001-a', '002-b'];
}

function cycleAt(name: string): string {
  return join('cycles', name);
}

describe('plan', () => {
  it('cycles の 2 件を集め、README は入れない', () => {
    const names = makeCycleNames();
    const root = tempDir();
    for (const name of names) {
      mkdirSync(join(root, cycleAt(name)), { recursive: true });
    }
    writeAt(root, join('cycles', 'README.md'));
    const found = plan(root);
    expect(found).toHaveLength(names.length);
    for (const name of names) {
      const at = cycleAt(name);
      expect(found).toContainEqual({ action: 'remove', label: 'cycles', at, path: join(root, at) });
    }
  });

  it("plan(root, 'cycles') → cycles の行だけ", () => {
    const only = 'cycles';
    const name = '001-a';
    const root = tempDir();
    mkdirSync(join(root, cycleAt(name)), { recursive: true });
    const at = cycleAt(name);
    expect(plan(root, only)).toEqual([{ action: 'remove', label: only, at, path: join(root, at) }]);
  });

  it("plan(root, 'harness')（知らない label）→ []", () => {
    const unknown = 'harness';
    const root = tempDir();
    mkdirSync(join(root, cycleAt('001-a')), { recursive: true });
    expect(plan(root, unknown)).toEqual([]);
  });

  it('何も無い root → []', () => {
    const root = tempDir();
    expect(plan(root)).toEqual([]);
  });

  it('無い root → 投げる', () => {
    expect(() => plan(join(tempDir(), 'no-such-root'))).toThrow();
  });

  it('at の昇順（作った順が逆でも）', () => {
    const names = ['b', 'a'];
    const root = tempDir();
    for (const name of names) {
      mkdirSync(join(root, cycleAt(name)), { recursive: true });
    }
    const found = plan(root);
    const sorted = [...names].toSorted();
    expect(found).toEqual(
      sorted.map((name) => {
        const at = cycleAt(name);
        return { action: 'remove', label: 'cycles', at, path: join(root, at) };
      }),
    );
    expect(found.map((entry) => entry.at).toSorted()).toEqual(found.map((entry) => entry.at));
  });
});

describe('replace', () => {
  it('ROADMAP.md がある → 差し替える 1 行と、その雛形', () => {
    const root = tempDir();
    writeAt(root, 'ROADMAP.md');
    writeAt(root, 'rules/roadmap.md');
    const found = plan(root);
    expect(found).toEqual([
      { action: 'replace', label: 'replace', at: 'ROADMAP.md', path: join(root, 'ROADMAP.md') },
    ]);
    expect(skeletonFor(root, 'ROADMAP.md')).toEqual({
      file: 'rules/roadmap.md',
      heading: '## Skeleton',
      part: { kind: 'whole' },
    });
  });

  it('DEFINITION.md は見出しで差し替える', () => {
    const root = tempDir();
    writeAt(root, 'DEFINITION.md');
    writeAt(root, 'rules/definition.format.md');
    expect(skeletonFor(root, 'DEFINITION.md')).toEqual({
      file: 'rules/definition.format.md',
      heading: '## Skeleton',
      part: { kind: 'sections', headings: ['## Product', '### What'] },
    });
  });

  it("plan(root, 'replace') → 差し替える行だけ", () => {
    const root = tempDir();
    mkdirSync(join(root, cycleAt('001-a')), { recursive: true });
    writeAt(root, 'ROADMAP.md');
    const found = plan(root, 'replace');
    expect(found.map((entry) => entry.at)).toEqual(['ROADMAP.md']);
  });

  it('ROADMAP.md が無い → 差し替える行を返さない', () => {
    const root = tempDir();
    writeAt(root, 'rules/roadmap.md');
    expect(plan(root, 'replace')).toEqual([]);
  });

  it('雛形のファイルが無い → その道を入れて投げる', () => {
    const root = tempDir();
    writeAt(root, 'ROADMAP.md');
    expect(() => skeletonFor(root, 'ROADMAP.md')).toThrow(/rules\/roadmap\.md/);
  });

  it('表に無い at → 投げる', () => {
    const root = tempDir();
    expect(() => skeletonFor(root, 'package.json')).toThrow('no skeleton for: package.json');
  });
});

describe('labels', () => {
  it('labels(undefined) → 消す物と差し替える物の並び', () => {
    expect(labels(undefined)).toEqual([
      { label: 'cycles', verb: 'remove' },
      { label: 'replace', verb: 'replace' },
    ]);
  });

  it("labels('cycles') → その名前と動詞", () => {
    const only = 'cycles';
    expect(labels(only)).toEqual([{ label: only, verb: 'remove' }]);
  });
});

describe('remove', () => {
  it('消した at を返し、2回目は []', () => {
    const root = tempDir();
    mkdirSync(join(root, cycleAt('001-a')), { recursive: true });
    const removing = plan(root).filter((entry) => entry.action === 'remove');
    expect(remove(removing)).toEqual(removing.map((entry) => entry.at));
    expect(plan(root)).toEqual([]);
    expect(remove(removing)).toEqual([]);
  });
});
