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

/** 1 つの作業場。`unitDir` は unit のディレクトリ（記録と会話ファイルをここに置く） */
export interface Worktree {
  readonly id: string;
  readonly branch: string;
  /** worktree の実体。`<unitDir>/wt` */
  readonly path: string;
  /** unit のディレクトリ（`<runRoot>/<id>`）。記録と会話ファイルがここに住む */
  readonly unitDir: string;
}

export interface WorktreeRow extends Worktree {
  /** 実行の根（`<project>-<stamp>`）。1 回の実行に複数の unit が同居しうる */
  readonly runRoot: string;
  /** コミットしていない変更があるか */
  readonly dirty: boolean;
}

export type RemoveOutcome = 'removed' | 'missing' | 'busy' | 'dirty';

export type RemoveOptions = {
  readonly force?: boolean;
  readonly busy?: boolean;
};

export type RemoveResult = {
  readonly outcome: RemoveOutcome;
  readonly cleanup: CleanupReport;
};

export type ConsultBranch = `consult/${string}`;

export type OrphanBranch =
  | { readonly state: 'removed'; readonly branch: ConsultBranch }
  | { readonly state: 'kept'; readonly branch: ConsultBranch; readonly reason: 'unmerged' };

export type CleanupReport = {
  readonly pruned: readonly string[];
  readonly branches: readonly OrphanBranch[];
};

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
export function branchFor(id: string): ConsultBranch {
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

/** 実体のパスに揃える。無い場合はそのまま返す（比較の文字列を作るだけなので、投げない） */
function resolveReal(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

/**
 * 実行の根（runRoot）。
 *
 * 既に consult の worktree があれば、その実行の根を引き継ぐ（reload や別のセッションから来ても同じ場所を使う）。無ければ今の時刻で 1 つ作る。unit のディレクトリは `Worktree.unitDir` で、その下に並ぶ。
 */

export function rootFor(cwd: string): string {
  const base = resolveReal(consultRoot());
  // git は /private/tmp のように実体のパスを返す（macOS の /tmp は symlink）。文字列で比べると、
  // 同じ置き場を別物と見て、呼ぶたびに新しい root を作ってしまう（記録を読む側が迷子になる）。
  const existing = parseWorktrees(cwd).find((row) => resolveReal(row.path).startsWith(`${base}/`));
  if (existing !== undefined) {
    return existing.runRoot;
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
    if (lines.some((line) => line === 'prunable' || line.startsWith('prunable '))) {
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
      // 実行の根（runRoot）と unit のディレクトリ（unitDir）を分けて持つ。
      // worktree のパスは <runRoot>/<unit>/wt なので、1 つ上が unit、もう 1 つ上が実行の根
      runRoot: dirname(dirname(path)),
      unitDir: dirname(path),
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
  const runRoot = rootFor(cwd);
  const path = join(runRoot, id, 'wt');
  const branch = branchFor(id);
  const result = git(cwd, ['worktree', 'add', '-b', branch, path, base]);
  if (result.status !== 0) {
    rmSync(join(runRoot, id), { recursive: true, force: true });
    throw new Error(
      `could not create the worktree ${id}: ${(result.stderr || result.error || '').trim()}`,
    );
  }
  return { id, branch, path, unitDir: join(runRoot, id) };
}

/** `git worktree list --porcelain` の出力から、実体の無い登録のパスを抜く（純粋） */
export function prunablePathsIn(output: string): string[] {
  const pruned: string[] = [];
  for (const block of output.split('\n\n')) {
    const lines = block.split('\n');
    const path = lines.find((line) => line.startsWith('worktree '))?.slice('worktree '.length);
    if (path === undefined) {
      continue;
    }
    if (lines.some((line) => line === 'prunable' || line.startsWith('prunable '))) {
      pruned.push(path);
    }
  }
  return pruned;
}

/** 実体の無い登録のパス（`prune` の前後で比べる元） */
function listPrunablePaths(cwd: string): string[] {
  const result = git(cwd, ['worktree', 'list', '--porcelain']);
  if (result.status !== 0) {
    return [];
  }
  return prunablePathsIn(result.stdout);
}

/**
 * 実体の無い登録を `prune` で落とす。消えたパスを返す。
 *
 * 失敗したら例外を投げる（`createWorktree` と同じ形。成功として扱わない）。
 */
function pruneWorktrees(cwd: string): string[] {
  const before = listPrunablePaths(cwd);
  const result = git(cwd, ['worktree', 'prune']);
  if (result.status !== 0) {
    throw new Error(
      `could not prune the worktrees: ${(result.stderr || result.error || '').trim()}`,
    );
  }
  return before;
}

/** `for-each-ref` の出力から、どの作業場にも checkout されていない `consult/*` を抜く（純粋） */
export function orphanBranchesIn(output: string): ConsultBranch[] {
  const branches: ConsultBranch[] = [];
  for (const line of output.split('\n')) {
    if (line.trim() === '') {
      continue;
    }
    const space = line.indexOf(' ');
    const ref = space === -1 ? line : line.slice(0, space);
    const at = space === -1 ? '' : line.slice(space + 1).trim();
    if (at !== '') {
      continue;
    }
    const prefix = 'refs/heads/consult/';
    if (!ref.startsWith(prefix)) {
      continue;
    }
    const unit = ref.slice(prefix.length);
    if (unit !== '') {
      branches.push(`consult/${unit}`);
    }
  }
  return branches;
}

/** どの作業場にも checkout されていない `consult/*`。`%(worktreepath)` が空の物（git 2.23+） */
function listOrphanBranches(cwd: string): ConsultBranch[] {
  const result = git(cwd, [
    'for-each-ref',
    '--format=%(refname) %(worktreepath)',
    'refs/heads/consult/*',
  ]);
  if (result.status !== 0) {
    throw new Error(
      `could not list the orphan branches: ${(result.stderr || result.error || '').trim()}`,
    );
  }
  return orphanBranchesIn(result.stdout);
}

/**
 * 枝の掃除。取り込み済み → 消して `removed`、未マージ → 残して `kept` / `unmerged`。
 *
 * `forceBranch` だけは `force` の対象として捨て（`-D`）、`removed` として報告に入れる。
 * `-d` は「HEAD（または upstream）に取り込まれていなければ断る」ので、未マージの仕事をここで消さない。
 */
function sweepBranches(cwd: string, forceBranch?: ConsultBranch): OrphanBranch[] {
  const report: OrphanBranch[] = [];
  for (const branch of listOrphanBranches(cwd)) {
    if (forceBranch !== undefined && branch === forceBranch) {
      const deleted = git(cwd, ['branch', '-D', branch]);
      if (deleted.status !== 0) {
        throw new Error(
          `could not delete the branch ${branch}: ${(deleted.stderr || deleted.error || '').trim()}`,
        );
      }
      report.push({ state: 'removed', branch });
      continue;
    }
    const deleted = git(cwd, ['branch', '-d', branch]);
    if (deleted.status === 0) {
      report.push({ state: 'removed', branch });
    } else {
      report.push({ state: 'kept', branch, reason: 'unmerged' });
    }
  }
  return report;
}

/** 空の掃除報告（何も触っていないとき） */
function emptyCleanup(): CleanupReport {
  return { pruned: [], branches: [] };
}

/**
 * 掃除だけを単独で呼べる形（`removeWorktree` の中と同じ物を使う）。
 *
 * 実体の無い登録を `prune` で落とし、どの作業場にも checkout されていない `consult/*` のうち
 * 取り込み済みを消す。未マージは残して報告する。走っている子の作業場は checkout 中なので触らない
 * （登録も枝も残る）。git が断ったら例外にする。
 */
export function cleanWorktrees(cwd: string): CleanupReport {
  const pruned = pruneWorktrees(cwd);
  const branches = sweepBranches(cwd);
  return { pruned, branches };
}

/**
 * 作業場を消す。子が動いているときは消さない（busy）。掃除もしない。
 *
 * 順序は prune → 登録の再確認（prune で消えた登録は `missing` になる）。変更が残っているときは
 * `force` を要求する（未コミットの作業を消さない）。登録を消してから入れ物を消す
 * （順序を逆にすると登録が残る）。枝の運命は掃除が決める（この関数は自分の枝を直接消さない）。
 * `prune` と `worktree remove` の失敗は例外にする（成功として扱わない）。
 */
export function removeWorktree(cwd: string, id: string, options: RemoveOptions = {}): RemoveResult {
  if (options.busy === true) {
    return { outcome: 'busy', cleanup: emptyCleanup() };
  }
  const pruned = pruneWorktrees(cwd);
  const found = findWorktree(cwd, id);
  if (found === undefined) {
    return { outcome: 'missing', cleanup: { pruned, branches: [] } };
  }
  if (found.dirty && options.force !== true) {
    return { outcome: 'dirty', cleanup: { pruned, branches: [] } };
  }
  const removed = git(cwd, ['worktree', 'remove', '--force', found.path]);
  if (removed.status !== 0) {
    throw new Error(
      `could not remove the worktree ${id}: ${(removed.stderr || removed.error || '').trim()}`,
    );
  }
  rmSync(found.unitDir, { recursive: true, force: true });
  const forceBranch = options.force === true ? branchFor(id) : undefined;
  const branches = sweepBranches(cwd, forceBranch);
  return { outcome: 'removed', cleanup: { pruned, branches } };
}
