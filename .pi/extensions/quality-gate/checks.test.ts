/**
 * 品質ゲートの実行の分岐を、偽の `exec` で確かめる。
 *
 * pnpm と git は起動しない。`exec` に打たれた command と args を記録し、戻り値はテストが決める。
 * pnpm の戻り値はスクリプトごとに決められる。fix 相だけを赤にできる。
 * ファイルは `tempDir()` に本物を作る（`prepareTargets` は `existsSync` を見るので、存在の制御が要る）。
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../test/temp-dir.ts';
import { runChecks, toRelative } from './checks.ts';
import type { ExecPort } from './checks.ts';

interface ExecCall {
  readonly command: string;
  readonly args: string[];
}

interface ScriptResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface FakePi {
  readonly pi: ExecPort;
  readonly calls: readonly ExecCall[];
  /** `git check-ignore` の exit code。既定は 1（無視されたファイルなし） */
  setCheckIgnoreCode: (code: number) => void;
  /** `git check-ignore` が標準出力に書く（無視されたパス） */
  setIgnoredStdout: (stdout: string) => void;
  /** スクリプトごとの pnpm の結果を決める */
  setScriptResult: (script: string, result: ScriptResult) => void;
  /** すべての pnpm の結果をまとめて決める */
  setAllPnpm: (result: ScriptResult) => void;
}

/** exec を記録するだけの偽。pnpm / git は起動しない */
function fakePi(): FakePi {
  const calls: ExecCall[] = [];
  let checkIgnoreCode = 1;
  let ignoredStdout = '';
  let defaultPnpm: ScriptResult = { code: 0, stdout: '', stderr: '' };
  const overrides = new Map<string, ScriptResult>();
  const pi: ExecPort = {
    exec: (command, args) => {
      calls.push({ command, args });
      if (command === 'git') {
        return Promise.resolve({
          stdout: ignoredStdout,
          stderr: '',
          code: checkIgnoreCode,
          killed: false,
        });
      }
      const script = args[1] ?? '';
      const result = overrides.get(script) ?? defaultPnpm;
      return Promise.resolve({ ...result, killed: false });
    },
  };
  return {
    pi,
    calls,
    setCheckIgnoreCode: (code) => {
      checkIgnoreCode = code;
    },
    setIgnoredStdout: (stdout) => {
      ignoredStdout = stdout;
    },
    setScriptResult: (script, result) => {
      overrides.set(script, result);
    },
    setAllPnpm: (result) => {
      defaultPnpm = result;
    },
  };
}

/** 1 つの ts ファイルを作り、絶対パスを返す */
function tsFile(dir: string, name: string): string {
  const file = join(dir, name);
  writeFileSync(file, 'x\n');
  return file;
}

describe('toRelative', () => {
  it('cwd からの相対を返す', () => {
    const cwd = '/repo';
    const name = 'src/a.ts';
    const absolute = join(cwd, name);
    expect(toRelative(cwd, absolute)).toBe(name);
  });

  it('空になる（path が cwd 自身）ときは元のパスを返す', () => {
    const cwd = '/repo';
    expect(toRelative(cwd, cwd)).toBe(cwd);
  });
});

describe('prepareTargets（runChecks 越しに見る）', () => {
  it('削除済みのファイルは check に含めず skipped に入れる', async () => {
    const dir = tempDir();
    const live = tsFile(dir, 'live.ts');
    const deadName = 'deleted.ts';
    const dead = join(dir, deadName);
    const fake = fakePi();

    const run = await runChecks(fake.pi, { cwd: dir }, [live, dead]);

    // git に渡るのは存在している分だけ
    expect(fake.calls.map((call) => call.args)).toContainEqual(['check-ignore', '--', live]);
    expect(run.skipped).toEqual([dead]);
    // pnpm に渡る対象にも deleted は入らない
    const scripts = fake.calls.filter((call) => call.command === 'pnpm').map((call) => call.args);
    expect(scripts.length).toBeGreaterThan(0);
    for (const args of scripts) {
      expect(args).not.toContain(dead);
    }
  });

  it('全部削除済み → git を打たず、skipped に全部', async () => {
    const dir = tempDir();
    const first = join(dir, 'a.ts');
    const second = join(dir, 'b.ts');
    const targets = [first, second];
    const fake = fakePi();

    const run = await runChecks(fake.pi, { cwd: dir }, targets);

    expect(fake.calls.map((call) => call.command)).not.toContain('git');
    expect(run.skipped).toEqual(targets);
  });

  it('.gitignore 対象は check に含めず skipped に入れる', async () => {
    const dir = tempDir();
    const src = tsFile(dir, 'src.ts');
    const dist = tsFile(dir, 'dist.ts');
    const fake = fakePi();
    fake.setCheckIgnoreCode(0);
    const ignored = `${dist}\n`;
    fake.setIgnoredStdout(ignored);

    const run = await runChecks(fake.pi, { cwd: dir }, [src, dist]);

    expect(run.skipped).toEqual([dist]);
    // pnpm に渡る対象には src だけが残り、dist は入らない
    const scripts = fake.calls.filter((call) => call.command === 'pnpm').map((call) => call.args);
    for (const args of scripts) {
      expect(args).toContain(src);
      expect(args).not.toContain(dist);
    }
  });

  it('git check-ignore が非 0 でも無視されたパスの出力があれば除外なし', async () => {
    async function assertNoExclusion(code: number): Promise<void> {
      const dir = tempDir();
      const file = tsFile(dir, 'a.ts');
      const fake = fakePi();
      fake.setCheckIgnoreCode(code);
      const ignored = `${file}\n`;
      fake.setIgnoredStdout(ignored);

      const run = await runChecks(fake.pi, { cwd: dir }, [file]);

      expect(run.skipped).toEqual([]);
      const gitCall = fake.calls.find((call) => call.command === 'git');
      expect(gitCall?.args).toEqual(['check-ignore', '--', file]);
    }

    await assertNoExclusion(1);
    await assertNoExclusion(128);
  });
});

describe('runCheck（runChecks 越しに見る）', () => {
  it('typecheck は拡張子で絞らない（md も渡る）', async () => {
    const dir = tempDir();
    const ts = tsFile(dir, 'a.ts');
    const mdName = 'b.md';
    const md = join(dir, mdName);
    writeFileSync(md, 'x\n');
    const fake = fakePi();

    await runChecks(fake.pi, { cwd: dir }, [ts, md]);

    // typecheck:staged は ts と md の両方を渡す
    const typecheck = fake.calls.find((call) => call.args.includes('typecheck:staged'));
    expect(typecheck?.args).toContain(ts);
    expect(typecheck?.args).toContain(md);
  });

  it('format は md を渡し、lint は md を渡さない', async () => {
    const dir = tempDir();
    const ts = tsFile(dir, 'a.ts');
    const md = join(dir, 'b.md');
    writeFileSync(md, 'x\n');
    const fake = fakePi();

    await runChecks(fake.pi, { cwd: dir }, [ts, md]);

    const format = fake.calls.find((call) => call.args.includes('format'));
    expect(format?.args).toContain(md);
    const lint = fake.calls.find((call) => call.args.includes('lint'));
    expect(lint?.args).toContain(ts);
    expect(lint?.args).not.toContain(md);
  });

  it('対象拡張子が無い → そのチェックは打たれない（残る 1 件だけ）', async () => {
    const dir = tempDir();
    const png = join(dir, 'a.png');
    writeFileSync(png, 'x\n');
    const fake = fakePi();

    const run = await runChecks(fake.pi, { cwd: dir }, [png]);

    // png は format にも lint にも通らない。打たれるのは typecheck だけ
    const scripts = fake.calls
      .filter((call) => call.command === 'pnpm')
      .map((call) => call.args[1]);
    const expectedScripts = ['typecheck:staged'];
    expect(scripts).toEqual(expectedScripts);
    const expectedLabels = ['typecheck'];
    expect(run.outcomes.map((outcome) => outcome.label)).toEqual(expectedLabels);
  });

  it('pnpm が失敗 → failed で、stdout と stderr を改行でつなぐ', async () => {
    const dir = tempDir();
    const file = tsFile(dir, 'a.ts');
    const fake = fakePi();
    const stdout = 'fail-out';
    const stderr = 'fail-err';
    const code = 2;
    fake.setAllPnpm({ code, stdout, stderr });

    const run = await runChecks(fake.pi, { cwd: dir }, [file]);

    const expectedOutput = `${stdout}\n${stderr}`;
    const verify = run.outcomes.filter((outcome) => outcome.failed);
    expect(verify.length).toBeGreaterThan(0);
    for (const outcome of verify) {
      expect(outcome.output).toBe(expectedOutput);
    }
  });
});

describe('runChecks（2フェーズ）', () => {
  it('fix 相だけが失敗しても verify 相の結果はすべて成功', async () => {
    const dir = tempDir();
    const file = tsFile(dir, 'a.ts');
    const fake = fakePi();
    const fixStdout = 'fix-out';
    const fixStderr = 'fix-err';
    const fixCode = 1;
    fake.setScriptResult('lint:fix', { code: fixCode, stdout: fixStdout, stderr: fixStderr });
    fake.setScriptResult('format', { code: fixCode, stdout: fixStdout, stderr: fixStderr });

    const run = await runChecks(fake.pi, { cwd: dir }, [file]);

    expect(run.outcomes.length).toBeGreaterThan(0);
    expect(run.outcomes.every((outcome) => !outcome.failed)).toBe(true);
  });
});
