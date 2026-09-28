/**
 * テストが使う一時ディレクトリ。
 *
 * 何をする物か
 * - `mkdtempSync(join(tmpdir(), 'pi-test-'))` で、OS の一時領域に 1 つ作って絶対パスを返す。
 * - リポジトリの中には作らない。テストの副産物が子のコミット（`git add -A`）に巻き込まれないようにする。
 *
 * どう呼ぶか
 * - テストファイルの上でこの helper を読み、テストの中か `beforeEach` で `const dir = tmpDir();` と書く。
 * - 1 つのテストの中で何度呼んでもよい。呼んだ数だけディレクトリができる。
 *
 * 後始末
 * - 呼んだ側は消さない。この helper が、読まれたテストファイルの `afterEach` で作った物をまとめて消す。
 * - だから `beforeAll` のようにテストの外で呼ぶと、最初のテストの後に消される。使うのはテストの中か `beforeEach`。
 * - 読まれたファイルごとに別の一覧を持つ（テストファイルは分離して走る）。
 *
 * なぜ helper を通すか
 * - 相対パスでリポジトリに書くテストが混ざっても、何も止められない（007 の `Carry over`）。
 *   書き込み先を 1 か所に集めると、レビューでは「helper を通しているか」だけを見ればよくなる。
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'vitest';

/** このテストファイルが作った一時ディレクトリ */
const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** 一時ディレクトリを 1 つ作り、その絶対パスを返す。後始末はこのファイルの `afterEach` がする */
export function tmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pi-test-'));
  dirs.push(dir);
  return dir;
}
