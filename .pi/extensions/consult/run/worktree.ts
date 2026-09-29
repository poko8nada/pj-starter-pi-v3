/**
 * unit ごとの作業場（worktree）。
 *
 * 既定で残る。消すのは `removeWorktree` を明示的に呼んだときだけ。子が何をしたかは worktree に残るので、diff や ref で受け渡さない。
 *
 * 置き場はリポジトリの外に固定する（macOS の `os.tmpdir()` は親の権限から見えない）:
 *   `/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/<unit>/wt`
 * ブランチは `consult/<unit>`。base は親の HEAD で、`main` を仮定しない。
 *
 * 台帳ファイルは持たない。一覧は `git worktree list` と `consult/*` ブランチから作る。
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, realpathSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { gitEnv } from './run.ts';

/** consult の作業場をまとめる場所 */
export const CONSULT_ROOT = '/tmp/pi-consult';

/** 1 つの作業場。`root` は unit の入れ物（記録をここに置く） */
export interface Worktree {
  readonly id: string;
  readonly branch: string;
  readonly path: string;
  readonly root: string;
}

export interface WorktreeRow extends Worktree {
  /** コミットしていない変更があるか */
  readonly dirty: boolean;
}

export type RemoveOutcome =
  | 'removed'
  /** worktree は消えたが、ブランチは取り込み済みでなかったので残した */
  | 'removed-branch-kept'
  | 'missing'
  | 'busy'
  | 'dirty';

function git(
  cwd: string,
  args: readonly string[],
): { status: number; stdout: string; stderr: string; error?: string } {
  const spawned = spawnSync('git', [...args], { cwd, encoding: 'utf8', env: gitEnv() });
  return {
    status: spawned.status ?? 1,
    stdout: spawned.stdout ?? '',
    stderr: spawned.stderr ?? '',
    ...(spawned.error === undefined ? {} : { error: spawned.error.message }),
  };
}

/** worktree のブランチ名。unit の id がそのまま入る */
export function branchFor(id: string): string {
  return `consult/${id}`;
}

/** unit の入れ物。worktree の外なので、記録を置いてもリポジトリを汚さない */
export function unitRoot(cwd: string, id: string): string {
  return join(rootFor(cwd), id);
}

/** `YYYYMMDD-HHMM`。作業場の root に 1 回だけ付く */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function stamp(now: Date = new Date()): string {
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
}

/** リポジトリの根。project の名前はここから取る */
export function topLevel(cwd: string): string {
  const result = git(cwd, ['rev-parse', '--show-toplevel']);
  if (result.status !== 0) {
    throw new Error(`not a git repository: ${(result.stderr || result.error || '').trim()}`);
  }
  return result.stdout.trim();
}

/**
 * 作業場の root。
 *
 * 既に consult の worktree があれば、その root を引き継ぐ（reload や別のセッションから来ても同じ場所を使う）。無ければ今の時刻で 1 つ作る。
 */
/** 実体のパスに揃える。無い場合はそのまま返す（比較の文字列を作るだけなので、投げない） */
function resolveReal(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

export function rootFor(cwd: string): string {
  const base = resolveReal(consultRoot());
  // git は /private/tmp のように実体のパスを返す（macOS の /tmp は symlink）。文字列で比べると、
  // 同じ置き場を別物と見て、呼ぶたびに新しい root を作ってしまう（記録を読む側が迷子になる）。
  const existing = parseWorktrees(cwd).find((row) => resolveReal(row.path).startsWith(`${base}/`));
  if (existing !== undefined) {
    return existing.root;
  }
  const dir = join(base, `${basename(topLevel(cwd))}-${stamp()}`);
  mkdirSync(dir, { recursive: true });
  // 実体のパスで持つ（git が返すパスと、そのまま比べられるように）
  return resolveReal(dir);
}

/** 置き場の大元。テストは `CONSULT_ROOT` で自分の一時ディレクトリに逃がす */
function consultRoot(): string {
  return process.env.CONSULT_ROOT ?? CONSULT_ROOT;
}

/** `git worktree list --porcelain` の 1 ブロックから、consult の物だけを拾う */
function parseWorktrees(cwd: string): WorktreeRow[] {
  const result = git(cwd, ['worktree', 'list', '--porcelain']);
  if (result.status !== 0) {
    return [];
  }
  const rows: WorktreeRow[] = [];
  for (const block of result.stdout.split('\n\n')) {
    const lines = block.split('\n');
    const path = lines.find((line) => line.startsWith('worktree '))?.slice('worktree '.length);
    const branch = lines.find((line) => line.startsWith('branch '))?.slice('branch '.length);
    if (path === undefined || branch === undefined) {
      continue;
    }
    const prefix = 'refs/heads/consult/';
    if (!branch.startsWith(prefix)) {
      continue;
    }
    const status = git(path, ['status', '--porcelain']);
    rows.push({
      id: branch.slice(prefix.length),
      branch: branch.slice('refs/heads/'.length),
      path,
      // 置き場の根。worktree のパスは <root>/<unit>/wt なので、unit の入れ物が並ぶ所まで 2 つ上がる
      root: dirname(dirname(path)),
      dirty: status.stdout.trim() !== '',
    });
  }
  return rows;
}

/** 作業場の一覧。台帳は持たず、git から毎回作る */
export function listWorktrees(cwd: string): WorktreeRow[] {
  return parseWorktrees(cwd);
}

/** unit の作業場。無ければ undefined */
export function findWorktree(cwd: string, id: string): WorktreeRow | undefined {
  return parseWorktrees(cwd).find((row) => row.id === id);
}

/**
 * unit の作業場を作る。既にあれば同じ物を返す（2 回呼んでも増えない）。
 *
 * base は既定で親の HEAD。`main` を仮定しない。
 */
export function createWorktree(cwd: string, id: string, base = 'HEAD'): Worktree {
  const existing = findWorktree(cwd, id);
  if (existing !== undefined) {
    return existing;
  }
  const root = rootFor(cwd);
  const path = join(root, id, 'wt');
  const branch = branchFor(id);
  const result = git(cwd, ['worktree', 'add', '-b', branch, path, base]);
  if (result.status !== 0) {
    rmSync(join(root, id), { recursive: true, force: true });
    throw new Error(
      `could not create the worktree ${id}: ${(result.stderr || result.error || '').trim()}`,
    );
  }
  return { id, branch, path, root: join(root, id) };
}

/**
 * 作業場を消す。子が動いているときは消さない（busy）。
 *
 * 変更が残っているときは `force` を要求する（未コミットの作業を消さない）。登録を消してから入れ物を消す
 * （順序を逆にすると登録が残る）。ブランチも片付けるが、未マージなら `force` 無しでは残す。
 */
export function removeWorktree(
  cwd: string,
  id: string,
  options: { readonly force?: boolean; readonly busy?: boolean } = {},
): RemoveOutcome {
  const found = findWorktree(cwd, id);
  if (found === undefined) {
    return 'missing';
  }
  if (options.busy === true) {
    return 'busy';
  }
  if (found.dirty && options.force !== true) {
    return 'dirty';
  }
  git(cwd, ['worktree', 'remove', '--force', found.path]);
  rmSync(found.root, { recursive: true, force: true });
  // ブランチも片付ける。`-d` は「HEAD（または upstream）に取り込まれていなければ断る」ので、
  // 未マージの仕事をここで消さない。捨てると決めたときだけ `-D`
  const branch =
    options.force === true
      ? git(cwd, ['branch', '-D', found.branch])
      : git(cwd, ['branch', '-d', found.branch]);
  return branch.status === 0 ? 'removed' : 'removed-branch-kept';
}
