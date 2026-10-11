/**
 * 品質ゲートの実行の分岐を、偽の `exec` で確かめる。
 *
 * pnpm と git は起動しない。`exec` に打たれたcommandとargsを記録し、戻り値はテストが決める。
 * ファイルは `tmpDir()` に本物を作る（`prepareTargets` は `existsSync` を見るので、存在の制御が要る）。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import { runChecks, toRelative } from './checks.ts';
import type { ExecPort } from './checks.ts';

interface ExecCall {
  readonly command: string;
  readonly args: string[];
}

interface FakePi {
  readonly pi: ExecPort;
  readonly calls: readonly ExecCall[];
  /** `git check-ignore` の exit code。既定は 1（無視されたファイルなし） */
  setCheckIgnoreCode: (code: number) => void;
  /** `git check-ignore` が標準出力に書く（無視されたパス） */
  setIgnoredStdout: (stdout: string) => void;
  /** pnpm の exit code。既定は 0（緑） */
  setPnpmCode: (code: number) => void;
}

/** exec を記録するだけの偽。pnpm / git は起動しない */
function fakePi(): FakePi {
  const calls: ExecCall[] = [];
  let checkIgnoreCode = 0;
  let ignoredStdout = '';
  let pnpmCode = 0;
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
      return Promise.resolve({ stdout: 'out', stderr: 'err', code: pnpmCode, killed: false });
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
    setPnpmCode: (code) => {
      pnpmCode = code;
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
    expect(toRelative('/repo', '/repo/src/a.ts')).toBe('src/a.ts');
  });

  it('空になる（path が cwd 自身）ときは元のパスを返す', () => {
    expect(toRelative('/repo', '/repo')).toBe('/repo');
  });
});

describe('prepareTargets（runChecks 越しに見る）', () => {
  it('削除済みのファイルは check に含めず skipped に入れる', async () => {
    const dir = tmpDir();
    const live = tsFile(dir, 'live.ts');
    const dead = join(dir, 'deleted.ts');
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
    const dir = tmpDir();
    const a = join(dir, 'a.ts');
    const b = join(dir, 'b.ts');
    const fake = fakePi();

    const run = await runChecks(fake.pi, { cwd: dir }, [a, b]);

    expect(fake.calls.map((call) => call.command)).not.toContain('git');
    expect(run.skipped).toEqual([a, b]);
  });

  it('.gitignore 対象は check に含めず skipped に入れる', async () => {
    const dir = tmpDir();
    const src = tsFile(dir, 'src.ts');
    const dist = tsFile(dir, 'dist.ts');
    const fake = fakePi();
    fake.setIgnoredStdout(`${dist}\n`);

    const run = await runChecks(fake.pi, { cwd: dir }, [src, dist]);

    expect(run.skipped).toEqual([dist]);
    // pnpm に渡る対象には src だけが残り、dist は入らない
    const scripts = fake.calls.filter((call) => call.command === 'pnpm').map((call) => call.args);
    for (const args of scripts) {
      expect(args).toContain(src);
      expect(args).not.toContain(dist);
    }
  });

  it('git check-ignore が 1（無視されたファイルなし）→ 除外なし', async () => {
    const dir = tmpDir();
    const a = tsFile(dir, 'a.ts');
    const fake = fakePi();
    fake.setCheckIgnoreCode(1);

    const run = await runChecks(fake.pi, { cwd: dir }, [a]);

    expect(run.skipped).toEqual([]);

    const gitCall = fake.calls.find((call) => call.command === 'git');
    expect(gitCall?.args).toEqual(['check-ignore', '--', a]);
  });

  it('git check-ignore が 128（git 管理外）→ 除外なし', async () => {
    const dir = tmpDir();
    const a = tsFile(dir, 'a.ts');
    const fake = fakePi();
    fake.setCheckIgnoreCode(128);

    const run = await runChecks(fake.pi, { cwd: dir }, [a]);

    expect(run.skipped).toEqual([]);

    const gitCall = fake.calls.find((call) => call.command === 'git');
    expect(gitCall?.args).toEqual(['check-ignore', '--', a]);
  });
});

describe('runCheck（runChecks 越しに見る）', () => {
  it('typecheck は拡張子で絞らない（ts 系だけを通さない）', async () => {
    const dir = tmpDir();
    const ts = tsFile(dir, 'a.ts');
    const md = join(dir, 'b.md');
    writeFileSync(md, 'x\n');
    const fake = fakePi();

    await runChecks(fake.pi, { cwd: dir }, [ts, md]);

    // typecheck:staged は ts と md の両方を渡す
    const typecheck = fake.calls.find((call) => call.args.includes('typecheck:staged'));
    expect(typecheck?.args).toContain(ts);
    expect(typecheck?.args).toContain(md);
  });

  it('format は md と json を通し、lint は ts 系だけ通す', async () => {
    const dir = tmpDir();
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

  it('対象拡張子が無い → そのチェックは打たれない（lint:fix / format / lint）', async () => {
    const dir = tmpDir();
    const png = join(dir, 'a.png');
    writeFileSync(png, 'x\n');
    const fake = fakePi();

    const run = await runChecks(fake.pi, { cwd: dir }, [png]);

    // png は format にも lint にも通らない。打たれるのは typecheck だけ
    const scripts = fake.calls
      .filter((call) => call.command === 'pnpm')
      .map((call) => call.args[1]);
    expect(scripts).toEqual(['typecheck:staged']);
    expect(run.outcomes.map((outcome) => outcome.label)).toEqual(['typecheck']);
  });

  it('pnpm が失敗 → failed で、stdout と stderr を改行でつなぐ', async () => {
    const dir = tmpDir();
    const a = tsFile(dir, 'a.ts');
    const fake = fakePi();
    fake.setPnpmCode(2);

    const run = await runChecks(fake.pi, { cwd: dir }, [a]);

    const verify = run.outcomes.filter((outcome) => outcome.failed);
    expect(verify.length).toBeGreaterThan(0);
    for (const outcome of verify) {
      expect(outcome.output).toBe('out\nerr');
    }
  });
});

describe('runChecks（2フェーズ）', () => {
  it('fix 相（lint:fix / format）は outcomes に入れない', async () => {
    const dir = tmpDir();
    const a = tsFile(dir, 'a.ts');
    const fake = fakePi();

    const run = await runChecks(fake.pi, { cwd: dir }, [a]);

    const labels = run.outcomes.map((outcome) => outcome.label);
    expect(labels).toEqual(['lint', 'typecheck']);
  });

  it('fix 相が失敗しても、verify 相の結果だけを返す', async () => {
    const dir = tmpDir();
    const a = tsFile(dir, 'a.ts');
    const fake = fakePi();
    // 全部失敗させる（fix 相も）
    fake.setPnpmCode(1);

    const run = await runChecks(fake.pi, { cwd: dir }, [a]);

    expect(run.outcomes.map((outcome) => outcome.label)).toEqual(['lint', 'typecheck']);
    expect(run.outcomes.every((outcome) => outcome.failed)).toBe(true);
  });

  it('CHECK_SPECS の順に打つ（lint:fix → format → lint → typecheck）', async () => {
    const dir = tmpDir();
    const a = tsFile(dir, 'a.ts');
    const fake = fakePi();

    await runChecks(fake.pi, { cwd: dir }, [a]);

    const scripts = fake.calls
      .filter((call) => call.command === 'pnpm')
      .map((call) => call.args[1]);
    expect(scripts).toEqual(['lint:fix', 'format', 'lint', 'typecheck:staged']);
  });

  it('全部の pnpm 呼び出しに --no-error-on-unmatched-pattern が付く（typecheck は除く）', async () => {
    const dir = tmpDir();
    const a = tsFile(dir, 'a.ts');
    const fake = fakePi();

    await runChecks(fake.pi, { cwd: dir }, [a]);

    const pnpm = fake.calls.filter((call) => call.command === 'pnpm');
    for (const call of pnpm) {
      if (call.args.includes('typecheck:staged')) {
        expect(call.args).not.toContain('--no-error-on-unmatched-pattern');
      } else {
        expect(call.args).toContain('--no-error-on-unmatched-pattern');
      }
    }
  });

  it('ディレクトリの中も対象にできる', async () => {
    const dir = tmpDir();
    const nested = join(dir, 'sub', 'deep');
    mkdirSync(nested, { recursive: true });
    const file = join(nested, 'a.ts');
    writeFileSync(file, 'x\n');
    const fake = fakePi();

    await runChecks(fake.pi, { cwd: dir }, [file]);

    const lint = fake.calls.find((call) => call.args.includes('lint'));
    expect(lint?.args).toContain(file);
  });
});
