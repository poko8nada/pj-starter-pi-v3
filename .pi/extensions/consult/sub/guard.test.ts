import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import {
  commandAllowed,
  isSecretPath,
  judgeToolCall,
  parseLimits,
  pathAllowed,
  type Limits,
} from './guard.ts';

/**
 * 実ファイルで確かめる。`isSecretPath` は realpath を使うので、
 * 存在しないパスでは判断の意味が変わる（それはそれで 1 つのケース）。
 *
 * 置き場は `test/temp-dir.ts` の helper。テストごとに作り直し、後始末は helper がする。
 */
let dir = '';

beforeEach(() => {
  dir = tempDir();
  mkdirSync(join(dir, 'sub/dir'), { recursive: true });
  mkdirSync(join(dir, 'node_modules/react'), { recursive: true });
  writeFileSync(join(dir, '.env'), 'SECRET=1\n');
  writeFileSync(join(dir, 'sub/dir/.envrc'), 'x\n');
  writeFileSync(join(dir, 'README.md'), 'x\n');
  writeFileSync(join(dir, '.env.bak'), 'x\n');
  writeFileSync(join(dir, '.ENV'), 'x\n');
  writeFileSync(join(dir, 'foo.env'), 'x\n');
  symlinkSync(join(dir, '.env'), join(dir, 'link-to-env'));
});

describe('isSecretPath', () => {
  it('名前で決める（入力と真偽の表から取る）', () => {
    const cases: Array<{ path: string; cwd: string; expected: boolean }> = [
      { path: join(dir, '.env'), cwd: dir, expected: true },
      { path: join(dir, 'sub/dir/.envrc'), cwd: dir, expected: true },
      { path: '../../.env', cwd: join(dir, 'sub/dir'), expected: true },
      { path: join(dir, 'link-to-env'), cwd: dir, expected: true },
      { path: join(dir, 'sub/not-yet/.env'), cwd: dir, expected: true },
      { path: join(dir, 'README.md'), cwd: dir, expected: false },
      { path: join(dir, '.ENV'), cwd: dir, expected: false },
      { path: join(dir, 'foo.env'), cwd: dir, expected: false },
      { path: join(dir, 'id.key.bak'), cwd: dir, expected: false },
      { path: join(dir, '.env.bak'), cwd: dir, expected: false },
      { path: '', cwd: dir, expected: false },
      { path: join(dir, 'does-not-exist'), cwd: dir, expected: false },
      { path: join(dir, 'node_modules/react/index.js'), cwd: dir, expected: false },
    ];
    for (const entry of cases) {
      expect(isSecretPath(entry.path, entry.cwd)).toBe(entry.expected);
    }
  });
});

describe('judgeToolCall', () => {
  it('読む道具と秘密の名前を拒む', () => {
    const cases: Array<{ name: string; input: Record<string, string>; expected: true }> = [
      { name: 'read', input: { path: join(dir, '.env') }, expected: true },
      { name: 'read', input: { path: join(dir, 'sub/dir/.envrc') }, expected: true },
      { name: 'grep', input: { path: join(dir, 'keys/server.pem') }, expected: true },
    ];
    for (const entry of cases) {
      expect(judgeToolCall(entry.name, entry.input, dir).block).toBe(entry.expected);
    }
    expect(judgeToolCall('read', { path: join(dir, '.env') }, dir)).toEqual({
      block: true,
      reason: expect.stringContaining('読めない'),
    });
  });

  it('bash + cat /dir/.env を拒む', () => {
    expect(judgeToolCall('bash', { command: `cat ${join(dir, '.env')}` }, dir).block).toBe(true);
  });

  it('bash のコマンド名（cat）では止めない', () => {
    expect(judgeToolCall('bash', { command: 'ls -la' }, dir)).toEqual({});
  });

  it('bash + 存在しないパス（/nonexistent/x.txt）でも止めない', () => {
    expect(judgeToolCall('bash', { command: 'cat /nonexistent/x.txt' }, dir)).toEqual({});
  });

  it('展開後の .env を拒む（組み立て・symlink・変数・置換は通さない）', () => {
    const commands = [
      `cat ${join(dir, '.e""nv')}`,
      `cat ${join(dir, 'link-to-env')}`,
      'cat $HOME/.env',
      'cat $UNSET/.env',
      'cat .e${X}nv',
      'cat `echo .env`',
      'cat $(echo .env)',
      'cat ${X:-.env}',
      "cat $'\\x2eenv'",
      'echo $?',
    ];
    for (const command of commands) {
      expect(judgeToolCall('bash', { command }, dir).block).toBe(true);
    }
  });

  it('bash + echo $PATH は通す（展開後も秘密の名前ではない）', () => {
    expect(judgeToolCall('bash', { command: 'echo $PATH' }, dir)).toEqual({});
  });

  it('bash + コマンド内の代入（FOO=.env; cat $FOO）は見ない（残る穴）', () => {
    expect(judgeToolCall('bash', { command: 'FOO=.env; cat $FOO' }, dir)).toEqual({});
  });

  it('read + README.md は通す', () => {
    expect(judgeToolCall('read', { path: join(dir, 'README.md') }, dir)).toEqual({});
  });

  it('ls + リポジトリ直は通す', () => {
    expect(judgeToolCall('ls', { path: dir }, dir)).toEqual({});
  });

  it('パスを取らない道具は通す', () => {
    expect(judgeToolCall('web_search', { query: 'hello' }, dir)).toEqual({});
  });

  it('空のパス・引数が空 → 通す', () => {
    expect(judgeToolCall('read', { path: '' }, dir)).toEqual({});
    expect(judgeToolCall('read', {}, dir)).toEqual({});
  });
});

describe('parseLimits', () => {
  it('何も渡されていない → 制限なし', () => {
    expect(parseLimits(undefined)).toEqual({ state: 'open' });
    expect(parseLimits('  ')).toEqual({ state: 'open' });
  });

  it('メインエージェントが渡した JSON → その値', () => {
    expect(parseLimits('{"paths":["cycles/*/plan/*.md"],"bash":["git"]}')).toEqual({
      state: 'set',
      paths: ['cycles/*/plan/*.md'],
      bash: ['git'],
    });
  });

  it('壊れた JSON / 形が違う → broken', () => {
    expect(parseLimits('{')).toEqual({ state: 'broken' });
    expect(parseLimits('{"paths":"x","bash":[]}')).toEqual({ state: 'broken' });
    expect(parseLimits('{"paths":[1],"bash":[]}')).toEqual({ state: 'broken' });
    expect(parseLimits('{"paths":[]}')).toEqual({ state: 'broken' });
  });
});

describe('pathAllowed', () => {
  it('空の一覧 → どこでも書ける', () => {
    expect(pathAllowed('src/a.ts', '/w', [])).toBe(true);
  });

  it('ファイルはそのまま、ディレクトリは下の全部', () => {
    expect(pathAllowed('src/a.ts', '/w', ['src/a.ts'])).toBe(true);
    expect(pathAllowed('src/b.ts', '/w', ['src'])).toBe(true);
    expect(pathAllowed('src/b.ts', '/w', ['src/a.ts'])).toBe(false);
    expect(pathAllowed('other/a.ts', '/w', ['src'])).toBe(false);
  });

  it('glob が効く（review は plan md だけ書ける）', () => {
    expect(pathAllowed('cycles/010-2026-09-29/plan/x.md', '/w', ['cycles/*/plan/*.md'])).toBe(true);
    expect(pathAllowed('cycles/010-2026-09-29/design.md', '/w', ['cycles/*/plan/*.md'])).toBe(
      false,
    );
  });

  it('worktree の外に出るパスは通さない', () => {
    expect(pathAllowed('../other/x.md', '/w', ['x.md'])).toBe(false);
    expect(pathAllowed('/etc/hosts', '/w', ['etc'])).toBe(false);
  });
});

describe('commandAllowed', () => {
  it('空の一覧 → 何でも打てる', () => {
    expect(commandAllowed('rm -rf /', [])).toBe(true);
  });

  it('接頭辞は語として一致する（git は git status を通す）', () => {
    expect(commandAllowed('git status', ['git'])).toBe(true);
    expect(commandAllowed('git', ['git'])).toBe(true);
    expect(commandAllowed('gitfoo', ['git'])).toBe(false);
    expect(commandAllowed('pnpm run test:run', ['pnpm run test:run'])).toBe(true);
    expect(commandAllowed('pnpm install', ['pnpm run test:run'])).toBe(false);
  });
});

describe('judgeToolCall + 役割の許可', () => {
  const limits: Limits = { state: 'set', paths: ['cycles/*/plan/*.md'], bash: ['git'] };

  it('書く道具は許可された所だけ', () => {
    expect(judgeToolCall('edit', { path: 'cycles/010/plan/x.md' }, dir, limits)).toEqual({});
    expect(judgeToolCall('edit', { path: 'src/a.ts' }, dir, limits).block).toBe(true);
    expect(judgeToolCall('write', { path: 'src/a.ts' }, dir, limits).block).toBe(true);
    // ホストの編集道具も書く道具として扱う（この環境の `edit` はこれらに置き換わっている）
    expect(judgeToolCall('quick_edit', { path: 'src/a.ts' }, dir, limits).block).toBe(true);
    expect(judgeToolCall('target_edit', { path: 'src/a.ts' }, dir, limits).block).toBe(true);
    expect(judgeToolCall('quick_edit', { path: 'cycles/010/plan/x.md' }, dir, limits)).toEqual({});
  });

  it('読むのは縛らない', () => {
    expect(judgeToolCall('read', { path: 'src/a.ts' }, dir, limits)).toEqual({});
    expect(judgeToolCall('grep', { path: 'src' }, dir, limits)).toEqual({});
  });

  it('bash は許可された接頭辞だけ', () => {
    expect(judgeToolCall('bash', { command: 'git status' }, dir, limits)).toEqual({});
    expect(judgeToolCall('bash', { command: 'rm -rf src' }, dir, limits).block).toBe(true);
  });

  it('メインエージェントの許可が壊れている → 書く道具と bash を止める（読むのは通す）', () => {
    const broken: Limits = { state: 'broken' };
    expect(judgeToolCall('edit', { path: 'cycles/010/plan/x.md' }, dir, broken).block).toBe(true);
    expect(judgeToolCall('bash', { command: 'git status' }, dir, broken).block).toBe(true);
    expect(judgeToolCall('read', { path: 'src/a.ts' }, dir, broken)).toEqual({});
  });
});

describe('pathAllowed + proofreader（md だけ）', () => {
  it('cycles の adr.md は通す', () => {
    expect(pathAllowed('cycles/261026-042-dev/adr.md', '/w', ['**/*.md', '**/.*/**/*.md'])).toBe(
      true,
    );
  });

  it('.pi の SKILL.md は通す', () => {
    expect(pathAllowed('.pi/skills/adr/SKILL.md', '/w', ['**/*.md', '**/.*/**/*.md'])).toBe(true);
  });

  it('src の ts は止める', () => {
    expect(pathAllowed('src/a.ts', '/w', ['**/*.md', '**/.*/**/*.md'])).toBe(false);
  });
});

describe('judgeToolCall + proofreader の許可', () => {
  const proofreader: Limits = { state: 'set', paths: ['**/*.md', '**/.*/**/*.md'], bash: [] };

  it('md への write は通す', () => {
    expect(
      judgeToolCall('write', { path: 'cycles/261026-042-dev/design.md' }, '/w', proofreader),
    ).toEqual({});
  });

  it('md 以外への write は止める', () => {
    expect(judgeToolCall('write', { path: 'src/a.ts' }, '/w', proofreader).block).toBe(true);
  });
});

describe('judgeToolCall: OPEN（許可の設定が無い）', () => {
  it('書く道具も bash も通す（fail-closed は壊れた設定の時だけ）', () => {
    expect(judgeToolCall('edit', { path: 'x.txt' }, dir)).toEqual({});
    expect(judgeToolCall('bash', { command: 'echo hi' }, dir)).toEqual({});
  });
});
