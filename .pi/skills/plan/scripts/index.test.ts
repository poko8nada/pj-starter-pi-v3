import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { filesTree, parseArgs, planSkeleton } from './plan.mjs';

describe('parseArgs', () => {
  it('plan id、order、place、entries を読む', () => {
    const args = parseArgs([
      'xxx-update',
      '--order',
      '1',
      '--place',
      'worktree',
      '--entries',
      '01,02',
    ]);
    expect(args.id).toBe('xxx-update');
    expect(args.order).toBe('01');
    expect(args.place).toBe('worktree');
    expect(args.entries).toEqual(['01', '02']);
  });

  it('-w / -b を place として読む', () => {
    expect(parseArgs(['xxx', '-w', '--order', '1', '--entries', '01']).place).toBe('worktree');
    expect(parseArgs(['xxx', '-b', '--order', '1', '--entries', '01']).place).toBe('base');
  });

  it('--root を読む', () => {
    expect(
      parseArgs([
        'xxx',
        '--root',
        '/tmp/x',
        '--order',
        '1',
        '--place',
        'worktree',
        '--entries',
        '01',
      ]).root,
    ).toBe('/tmp/x');
  });

  it('plan id がない → 投げる', () => {
    expect(() => parseArgs(['--order', '1', '--place', 'worktree', '--entries', '01'])).toThrow(
      /missing plan id/,
    );
  });

  it('order がない → 投げる', () => {
    expect(() => parseArgs(['xxx', '--place', 'worktree', '--entries', '01'])).toThrow(
      /missing --order/,
    );
  });

  it('place がない → 投げる', () => {
    expect(() => parseArgs(['xxx', '--order', '1', '--entries', '01'])).toThrow(/missing --place/);
  });

  it('entries がない → 投げる', () => {
    expect(() => parseArgs(['xxx', '--order', '1', '--place', 'worktree'])).toThrow(
      /missing --entries/,
    );
  });

  it('order が数でない → 投げる', () => {
    expect(() =>
      parseArgs(['xxx', '--order', 'x', '--place', 'worktree', '--entries', '01']),
    ).toThrow(/not an order/);
  });

  it('place が worktree / base でない → 投げる', () => {
    expect(() => parseArgs(['xxx', '--order', '1', '--place', 'x', '--entries', '01'])).toThrow(
      /not a place/,
    );
  });

  it('entries が数の並びでない → 投げる', () => {
    expect(() =>
      parseArgs(['xxx', '--order', '1', '--place', 'worktree', '--entries', '01,x']),
    ).toThrow(/not an entry list/);
  });

  it('place を2回書く → 投げる', () => {
    expect(() =>
      parseArgs(['xxx', '--order', '1', '--place', 'worktree', '-b', '--entries', '01']),
    ).toThrow(/too many places/);
  });

  it('未知の引数 → 投げる', () => {
    expect(() => parseArgs(['xxx', '--unknown'])).toThrow(/unknown argument/);
  });
});

describe('filesTree', () => {
  it('dir と file をツリーにする', () => {
    expect(
      filesTree([
        { path: 'src/a.ts', dir: false },
        { path: 'src/b', dir: true },
        { path: 'src/b/c.ts', dir: false },
      ]),
    ).toBe('src/\n  b/\n    c.ts\n  a.ts');
  });

  it('空 → なし', () => {
    expect(filesTree([])).toBe('なし');
  });

  it('ルートの file を置く', () => {
    expect(filesTree([{ path: 'README.md', dir: false }])).toBe('README.md');
  });
});

describe('planSkeleton', () => {
  it('見出しと値を入れる', () => {
    const markdown = planSkeleton({
      id: 'xxx-update',
      entries: ['01', '02'],
      place: 'worktree',
      files: 'src/\n  a.ts',
    });
    expect(markdown).toContain('# PLAN `xxx-update`');
    expect(markdown).toContain('- No: 01, 02');
    expect(markdown).toContain('- Place: worktree');
    expect(markdown).toContain('- Boundary Plans:');
    expect(markdown).toContain('## Goal');
    expect(markdown).toContain('## Design');
    expect(markdown).toContain('```text\nsrc/\n  a.ts\n```');
    expect(markdown).toContain('## Slices');
    expect(markdown).toContain('## Work Review');
    expect(markdown).toContain('## Acceptance');
  });
});

const setupCycle = () => {
  const root = tempDir();
  const cycleDir = join(root, 'cycles', '261111-064-dev');
  mkdirSync(join(cycleDir, 'affected'), { recursive: true });
  writeFileSync(join(cycleDir, 'adr.md'), '# ADR 064\n\n## 01: 一\n\n## 02: 二\n');
  writeFileSync(
    join(cycleDir, 'affected', '01.md'),
    `## 01: 一

### Code

- Path: \`src/a.ts\`
  - Kind: \`module\`
- Path: \`src/b/\`
  - Kind: \`dir\`
- Path: \`src/b/c.ts\`
  - Kind: \`module\`
`,
  );
  writeFileSync(
    join(cycleDir, 'affected', '02.md'),
    `## 02: 二

### Code

- Path: \`README.md\`
  - Kind: \`doc\`
`,
  );
  return { root, cycleDir };
};

describe('CLI', () => {
  const script = fileURLToPath(new URL('./index.mjs', import.meta.url));

  it('plan を作る', () => {
    const { root, cycleDir } = setupCycle();
    const done = spawnSync(
      process.execPath,
      [
        script,
        '--root',
        root,
        'xxx-update',
        '--order',
        '1',
        '--place',
        'worktree',
        '--entries',
        '01,02',
      ],
      { encoding: 'utf8' },
    );
    expect(done.status).toBe(0);
    const markdown = readFileSync(join(cycleDir, 'plan', '01-xxx-update.md'), 'utf8');
    expect(markdown).toContain('# PLAN `xxx-update`');
    expect(markdown).toContain('- No: 01, 02');
    expect(markdown).toContain('- Place: worktree');
    expect(markdown).toContain('```text\nsrc/\n  b/\n    c.ts\n  a.ts\nREADME.md\n```');
    expect(markdown).toContain('## Goal');
    expect(markdown).toContain('## Slices');
  });

  it('place が base の plan を作る', () => {
    const { root, cycleDir } = setupCycle();
    const done = spawnSync(
      process.execPath,
      [script, '--root', root, 'xxx', '-b', '--order', '1', '--entries', '01'],
      { encoding: 'utf8' },
    );
    expect(done.status).toBe(0);
    expect(readFileSync(join(cycleDir, 'plan', '01-xxx.md'), 'utf8')).toContain('- Place: base');
  });

  it('開いたサイクルがない → 止まる', () => {
    const root = tempDir();
    const done = spawnSync(
      process.execPath,
      [script, '--root', root, 'xxx', '--order', '1', '--place', 'worktree', '--entries', '01'],
      { encoding: 'utf8' },
    );
    expect(done.status).not.toBe(0);
    expect(`${done.stderr}${done.stdout}`).toMatch(/no open cycle/);
  });

  it('ADR にないエントリ → 止まる', () => {
    const { root } = setupCycle();
    const done = spawnSync(
      process.execPath,
      [script, '--root', root, 'xxx', '--order', '1', '--place', 'worktree', '--entries', '01,03'],
      { encoding: 'utf8' },
    );
    expect(done.status).not.toBe(0);
    expect(`${done.stderr}${done.stdout}`).toMatch(/entry not found: 03/);
  });

  it('plan が既にある → 止まる', () => {
    const { root } = setupCycle();
    const args = [
      script,
      '--root',
      root,
      'xxx',
      '--order',
      '1',
      '--place',
      'worktree',
      '--entries',
      '01',
    ];
    expect(spawnSync(process.execPath, args, { encoding: 'utf8' }).status).toBe(0);
    const done = spawnSync(process.execPath, args, { encoding: 'utf8' });
    expect(done.status).not.toBe(0);
    expect(`${done.stderr}${done.stdout}`).toMatch(/exists:/);
  });
});
