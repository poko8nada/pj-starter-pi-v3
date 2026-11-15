/**
 * `scripts/checks/typecheck.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake root にツリーを作り、`node_modules/.bin/tsc` にスタブを置く。
 * スタブは渡された `-p` を出して、`STUB_FAIL` に含まれる所だけ exit 1 で落とす。
 * これで、回した所の名前・渡された `-p` のパス・exit を stdout で見る。
 * 表示の行は `test/scripts.fixture.ts` から組み立てる。
 */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FAILED,
  INVALID_LIST_LINE,
  OK,
  fakeRoot,
  statusLine,
  writeFile,
} from '../../test/scripts.fixture.ts';
import { stubTsc, writeScopes } from './checks.fixture.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'typecheck.mjs');

interface RunOut {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(root: string, env: Record<string, string> = {}): RunOut {
  const result = spawnSync('node', [SCRIPT], {
    encoding: 'utf8',
    cwd: root,
    env: { ...process.env, ...env },
  });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

describe('typecheck', () => {
  it('一覧の全部に tsconfig がある → どの範囲も ok の行を出す', () => {
    const scope = '.pi';
    const rootName = 'root';
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    writeFile(root, join(scope, 'tsconfig.json'), '{}');
    writeScopes(root, [scope]);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(statusLine(rootName, OK));
    expect(out.stdout).toContain(statusLine(scope, OK));
    expect(out.stdout).toContain(join(root, 'tsconfig.json'));
    expect(out.stdout).toContain(join(root, scope, 'tsconfig.json'));
  });

  it('1 つの範囲が失敗する → その範囲だけ failed の行を出す', () => {
    const scope = '.pi';
    const rootName = 'root';
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    writeFile(root, join(scope, 'tsconfig.json'), '{}');
    writeScopes(root, [scope]);
    const out = run(root, { STUB_FAIL: scope });
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(statusLine(rootName, OK));
    expect(out.stdout).toContain(statusLine(scope, FAILED));
  });

  it('一覧にある範囲でも tsconfig が無ければ、その行を出さない', () => {
    const scope = '.pi';
    const missing = '.opencode';
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    writeFile(root, join(scope, 'tsconfig.json'), '{}');
    writeScopes(root, [scope, missing]);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(statusLine(scope, OK));
    expect(out.stdout).not.toContain(missing);
  });

  it('一覧が空、または一覧のファイルが無い → root の行だけを出し、exit 0', () => {
    const scope = '.pi';
    const rootName = 'root';
    for (const form of ['empty', 'missing']) {
      const root = fakeRoot();
      stubTsc(root);
      writeFile(root, 'tsconfig.json', '{}');
      writeFile(root, join(scope, 'tsconfig.json'), '{}');
      if (form === 'empty') writeScopes(root, []);
      const out = run(root);
      expect(out.status).toBe(0);
      expect(out.stdout).toContain(statusLine(rootName, OK));
      expect(out.stdout).not.toContain(scope);
    }
  });

  it('scopes.json が JSON でない → exit 1 と理由の行', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    writeFile(root, join('scripts', 'checks', 'scopes.json'), '{not json');
    const out = run(root);
    expect(out.status).toBe(1);
    expect(`${out.stdout}\n${out.stderr}`).toContain(INVALID_LIST_LINE);
  });
});
