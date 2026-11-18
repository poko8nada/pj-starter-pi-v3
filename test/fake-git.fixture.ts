/**
 * fakeのgit。命令の意味は呼ぶ側が決める。
 *
 * 何をする物か
 * - `createFakeGit(handle)` は、渡した `handle` が結果を決める偽の git を作る。`fail` と `print` は `handle` より先に効く。
 * - コマンドの意味（worktree とは何か、orphan とは何か）は何も知らない。git の出力の形だけを持つ。
 *
 * どう使うか
 * - `fail((args) => …, 128)` で、その命令を失敗させる。`print((args) => …, '出力')` で、その命令の出力を差し替える。
 * - 状態を持つ偽物が要るなら、`handle` に閉包を渡す（consult の `run/worktree.fixture.ts` がそうしている）。
 */

/** git 1 回分の出力。git の形で、どの実装のものでもない */
export interface GitResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}

/** 結果を決める関数。命令の意味は呼ぶ側が決める */
export type GitHandle = (cwd: string, args: readonly string[]) => GitResult;

/** `args` を見て、その命令かどうかを決める */
export type GitMatch = (args: readonly string[]) => boolean;

export interface FakeGit {
  readonly git: (cwd: string, args: readonly string[]) => GitResult;
  readonly fail: (match: GitMatch, status?: number) => void;
  readonly print: (match: GitMatch, output: string) => void;
}

/** 渡した `handle` が結果を決める偽の git。`fail` と `print` が先に効く */
export function createFakeGit(handle: GitHandle): FakeGit {
  const failures: { readonly match: GitMatch; readonly status: number }[] = [];
  const prints: { readonly match: GitMatch; readonly output: string }[] = [];
  const git = (cwd: string, args: readonly string[]): GitResult => {
    const failure = failures.find((entry) => entry.match(args));
    if (failure !== undefined) {
      return { status: failure.status, stdout: '', stderr: `${args.join(' ')} failed` };
    }
    const printed = prints.find((entry) => entry.match(args));
    if (printed !== undefined) {
      return { status: 0, stdout: printed.output, stderr: '' };
    }
    return handle(cwd, args);
  };
  return {
    git,
    fail: (match, status = 1) => {
      failures.push({ match, status });
    },
    print: (match, output) => {
      prints.push({ match, output });
    },
  };
}
