/**
 * 品質ゲートの実行の分岐を、偽の `exec` で確かめる。
 *
 * pnpm と git は起動しない。`exec` に渡された command と args を記録し、戻り値はテストが決める。
 * pnpm の戻り値はスクリプトごとに決められる。fix フェーズだけを失敗にできる。
 * ファイルは `tempDir()` に実際に作る（`prepareTargets` は `existsSync` を見るため、存在の制御が必要である）。
 * 前提は `checks.fixture.ts` の `checksSetup()` が組み立てる。
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runChecks, toRelative } from './checks.ts';
import { checksSetup } from './checks.fixture.ts';

async function assertNoExclusion(code: number): Promise<void> {
  const setup = checksSetup();
  const file = setup.tsFile('a.ts');
  setup.fake.setCheckIgnoreCode(code);
  const ignored = `${file}\n`;
  setup.fake.setIgnoredStdout(ignored);

  const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [file]);

  expect(run.skipped).toEqual([]);
  const gitCall = setup.fake.calls.find((call) => call.command === 'git');
  expect(gitCall?.args).toEqual(['check-ignore', '--', file]);
  const pnpmArgs = setup.fake.calls
    .filter((call) => call.command === 'pnpm')
    .map((call) => call.args);
  expect(pnpmArgs.length).toBeGreaterThan(0);
  for (const args of pnpmArgs) {
    expect(args).toContain(file);
  }
}

describe('toRelative', () => {
  it('cwd からの相対を返す', () => {
    const cwd = '/repo';
    const name = 'src/a.ts';
    const absolute = join(cwd, name);
    expect(toRelative(cwd, absolute)).toBe(name);
  });
});

describe('prepareTargets（runChecks 越しに見る）', () => {
  it('削除済みのファイルはチェックに含めず skipped に入れる', async () => {
    const setup = checksSetup();
    const live = setup.tsFile('live.ts');
    const deadName = 'deleted.ts';
    const dead = join(setup.dir, deadName);

    const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [live, dead]);

    // git に渡るのは存在している分だけである。
    expect(setup.fake.calls.map((call) => call.args)).toContainEqual(['check-ignore', '--', live]);
    expect(run.skipped).toEqual([dead]);
    // pnpm に渡る対象にも deleted は入らない。
    const scripts = setup.fake.calls
      .filter((call) => call.command === 'pnpm')
      .map((call) => call.args);
    expect(scripts.length).toBeGreaterThan(0);
    for (const args of scripts) {
      expect(args).not.toContain(dead);
    }
  });

  it('すべて削除済みなら git を実行せず skipped にすべて入る', async () => {
    const setup = checksSetup();
    const first = join(setup.dir, 'a.ts');
    const second = join(setup.dir, 'b.ts');
    const targets = [first, second];

    const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, targets);

    expect(setup.fake.calls.map((call) => call.command)).not.toContain('git');
    expect(run.skipped).toEqual(targets);
  });

  it('.gitignore の対象だけを skipped に入れ、check-ignore が 0 以外でも出力があれば除外しない', async () => {
    const setup = checksSetup();
    const src = setup.tsFile('src.ts');
    const dist = setup.tsFile('dist.ts');
    setup.fake.setCheckIgnoreCode(0);
    const ignored = `${dist}\n`;
    setup.fake.setIgnoredStdout(ignored);

    const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [src, dist]);

    expect(run.skipped).toEqual([dist]);
    // pnpm に渡る対象には src だけが残り、dist は入らない。
    const scripts = setup.fake.calls
      .filter((call) => call.command === 'pnpm')
      .map((call) => call.args);
    for (const args of scripts) {
      expect(args).toContain(src);
      expect(args).not.toContain(dist);
    }

    await assertNoExclusion(1);
  });
});

describe('runCheck（runChecks 越しに見る）', () => {
  it('typecheck は拡張子で絞らず md も渡す', async () => {
    const setup = checksSetup();
    const ts = setup.tsFile('a.ts');
    const mdName = 'b.md';
    const md = join(setup.dir, mdName);
    writeFileSync(md, 'x\n');

    await runChecks(setup.fake.pi, { cwd: setup.dir }, [ts, md]);

    // typecheck:staged は ts と md の両方を渡す。
    const typecheck = setup.fake.calls.find((call) => call.args.includes('typecheck:staged'));
    expect(typecheck?.args).toContain(ts);
    expect(typecheck?.args).toContain(md);
  });

  it('format は md を渡し lint は md を渡さない', async () => {
    const setup = checksSetup();
    const ts = setup.tsFile('a.ts');
    const md = join(setup.dir, 'b.md');
    writeFileSync(md, 'x\n');

    await runChecks(setup.fake.pi, { cwd: setup.dir }, [ts, md]);

    const format = setup.fake.calls.find((call) => call.args.includes('format'));
    expect(format?.args).toContain(md);
    const lint = setup.fake.calls.find((call) => call.args.includes('lint'));
    expect(lint?.args).toContain(ts);
    expect(lint?.args).not.toContain(md);
  });

  it('対象拡張子がない場合はそのチェックを実行せず 1 件だけ残る', async () => {
    const setup = checksSetup();
    const png = join(setup.dir, 'a.png');
    writeFileSync(png, 'x\n');

    const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [png]);

    // png は format にも lint にも通らない。実行されるのは typecheck だけである。
    const scripts = setup.fake.calls
      .filter((call) => call.command === 'pnpm')
      .map((call) => call.args[1]);
    const expectedScripts = ['typecheck:staged'];
    expect(scripts).toEqual(expectedScripts);
    const expectedLabels = ['typecheck'];
    expect(run.outcomes.map((outcome) => outcome.label)).toEqual(expectedLabels);
  });

  it('pnpm が失敗すれば failed になり stdout と stderr を改行でつなぐ', async () => {
    const setup = checksSetup();
    const file = setup.tsFile('a.ts');
    const stdout = 'fail-out';
    const stderr = 'fail-err';
    const code = 2;
    setup.fake.setAllPnpm({ code, stdout, stderr });

    const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [file]);

    const expectedOutput = `${stdout}\n${stderr}`;
    const verify = run.outcomes.filter((outcome) => outcome.failed);
    expect(verify.length).toBeGreaterThan(0);
    for (const outcome of verify) {
      expect(outcome.output).toBe(expectedOutput);
    }
  });
});

describe('runChecks（2フェーズ）', () => {
  it('fix フェーズだけが失敗しても verify フェーズの結果はすべて成功する', async () => {
    const setup = checksSetup();
    const file = setup.tsFile('a.ts');
    const fixStdout = 'fix-out';
    const fixStderr = 'fix-err';
    const fixCode = 1;
    setup.fake.setScriptResult('lint:fix', { code: fixCode, stdout: fixStdout, stderr: fixStderr });
    setup.fake.setScriptResult('format', { code: fixCode, stdout: fixStdout, stderr: fixStderr });

    const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [file]);

    expect(run.outcomes.length).toBeGreaterThan(0);
    expect(run.outcomes.every((outcome) => !outcome.failed)).toBe(true);
  });
});
