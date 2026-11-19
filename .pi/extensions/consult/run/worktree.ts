/**
 * unit ごとのワークツリー（worktree）。
 *
 * 既定で残る。消すのは `removeWorktree` を明示的に呼んだときだけ。サブエージェントが何をしたかは worktree に残るので、diff や ref で受け渡さない。
 *
 * 保存場所の既定はリポジトリの外（macOS の `os.tmpdir()` はメインエージェントの権限から見えない）:
 *   `/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/<unit>/wt`
 * 起動時に `deps.root` で渡し、`CONSULT_ROOT` 環境変数で上書きできる。
 * ブランチは `consult/<unit>`。base の既定は HEAD で、`main` を仮定しない。
 *
 * 台帳ファイルは持たない。一覧は `git worktree list` と `consult/*` ブランチから作る。
 */

import { mkdirSync, realpathSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { Git } from './run.ts';

/** consult のワークツリーをまとめる場所 */
export const CONSULT_ROOT = '/tmp/pi-consult';

/** worktree の関数が使う git と保存先のルート */
export interface WorktreeDeps {
  readonly git: Git;
  readonly root: string;
}

/** 1 つのワークツリー。`unitDir` は unit のディレクトリ（記録と会話ファイルをここに置く） */
export interface Worktree {
  readonly id: string;
  readonly branch: string;
  /** worktree の実体。`<unitDir>/wt` */
  readonly path: string;
  /** unit のディレクトリ（`<runRoot>/<id>`）。記録と会話ファイルがここに住む */
  readonly unitDir: string;
}

export interface WorktreeRow extends Worktree {
  /** 実行のルート（`<project>-<stamp>`）。1 回の実行に複数の unit が同居しうる */
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

/** worktree のブランチ名。unit の id がそのまま入る */
export function branchFor(id: string): ConsultBranch {
  return `consult/${id}`;
}

/** `YYYYMMDD-HHMM`。ワークツリーの root に 1 回だけ付く */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function stamp(now: Date): string {
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

/** リポジトリのルート。project の名前はここから取る */
export function topLevel(cwd: string, deps: WorktreeDeps): string {
  const result = deps.git(cwd, ['rev-parse', '--show-toplevel']);
  if (result.status !== 0) {
    throw new Error(`not a git repository: ${(result.stderr || result.error || '').trim()}`);
  }
  return result.stdout.trim();
}

/** 実体のパスに揃える。ない場合はそのまま返す（比較の文字列を作るだけなので、投げない） */
export function resolveReal(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

/**
 * 実行のルート（runRoot）を読み取るだけ。作らない。
 *
 * 既に consult の worktree があれば、その実行のルートを返す。なければ `undefined`
 *（読む経路が保存場所を作ると、呼ぶたびに場所が変わり、記録を読む側が迷子になる）。
 */
export function rootFor(cwd: string, deps: WorktreeDeps): string | undefined {
  const base = resolveReal(deps.root);
  // git は /private/tmp のように実体のパスを返す（macOS の /tmp は symlink）。文字列で比べると、
  // 同じ保存場所を別ものと見てしまう（記録を読む側が迷子になる）。
  return parseWorktrees(cwd, deps).find((row) => resolveReal(row.path).startsWith(`${base}/`))
    ?.runRoot;
}

/**
 * 実行のルート（runRoot）を決める。1 回だけ作る。
 *
 * 既に consult の worktree があれば、その実行のルートを引き継ぐ（reload や別のセッションから来ても同じ場所を使う）。なければ今の時刻で 1 つ作る。unit のディレクトリは `Worktree.unitDir` で、その下に並ぶ。記録はここにはない。
 */
export function ensureRoot(cwd: string, deps: WorktreeDeps, now: Date): string {
  const existing = rootFor(cwd, deps);
  if (existing !== undefined) {
    return existing;
  }
  const base = resolveReal(deps.root);
  const dir = join(base, `${basename(topLevel(cwd, deps))}-${stamp(now)}`);
  mkdirSync(dir, { recursive: true });
  // 実体のパスで持つ（git が返すパスと、そのまま比べられるように）
  return resolveReal(dir);
}

/** `git worktree list --porcelain` の 1 ブロックから、consult のものだけを拾う */
function parseWorktrees(cwd: string, deps: WorktreeDeps): WorktreeRow[] {
  const result = deps.git(cwd, ['worktree', 'list', '--porcelain']);
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
    const status = deps.git(path, ['status', '--porcelain']);
    rows.push({
      id: branch.slice(prefix.length),
      branch: branch.slice('refs/heads/'.length),
      path,
      // 実行のルート（runRoot）と unit のディレクトリ（unitDir）を分けて持つ。
      // worktree のパスは <runRoot>/<unit>/wt なので、1 つ上が unit、もう 1 つ上が実行のルート
      runRoot: dirname(dirname(path)),
      unitDir: dirname(path),
      dirty: status.stdout.trim() !== '',
    });
  }
  return rows;
}

/** ワークツリーの一覧。台帳は持たず、git から毎回作る */
export function listWorktrees(cwd: string, deps: WorktreeDeps): WorktreeRow[] {
  return parseWorktrees(cwd, deps);
}

/** unit のワークツリー。なければ undefined */
export function findWorktree(cwd: string, deps: WorktreeDeps, id: string): WorktreeRow | undefined {
  return parseWorktrees(cwd, deps).find((row) => row.id === id);
}

/**
 * unit のワークツリーを作る。既にあれば同じものを返す（2 回呼んでも増えない）。
 *
 * base の既定は HEAD。`main` を仮定しない。
 */
export function createWorktree(input: {
  readonly cwd: string;
  readonly deps: WorktreeDeps;
  readonly id: string;
  readonly base?: string;
  readonly now: Date;
}): Worktree {
  const { cwd, deps, id, base = 'HEAD', now } = input;
  const existing = findWorktree(cwd, deps, id);
  if (existing !== undefined) {
    return existing;
  }
  const runRoot = ensureRoot(cwd, deps, now);
  const path = join(runRoot, id, 'wt');
  const branch = branchFor(id);
  const result = deps.git(cwd, ['worktree', 'add', '-b', branch, path, base]);
  if (result.status !== 0) {
    rmSync(join(runRoot, id), { recursive: true, force: true });
    throw new Error(
      `could not create the worktree ${id}: ${(result.stderr || result.error || '').trim()}`,
    );
  }
  return { id, branch, path, unitDir: join(runRoot, id) };
}

/** `git worktree list --porcelain` の出力から、実体のない登録のパスを抜く（純粋関数） */
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

/** 実体のない登録のパス（`prune` の前後で比べる元） */
function listPrunablePaths(cwd: string, deps: WorktreeDeps): string[] {
  const result = deps.git(cwd, ['worktree', 'list', '--porcelain']);
  if (result.status !== 0) {
    return [];
  }
  return prunablePathsIn(result.stdout);
}

/**
 * 実体のない登録を `prune` で落とす。消えたパスを返す。
 *
 * 失敗したら例外を投げる（`createWorktree` と同じ形。成功として扱わない）。
 */
function pruneWorktrees(cwd: string, deps: WorktreeDeps): string[] {
  const before = listPrunablePaths(cwd, deps);
  const result = deps.git(cwd, ['worktree', 'prune']);
  if (result.status !== 0) {
    throw new Error(
      `could not prune the worktrees: ${(result.stderr || result.error || '').trim()}`,
    );
  }
  return before;
}

/** `for-each-ref` の出力から、どのワークツリーにも checkout されていない `consult/*` を抜く（純粋関数） */
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

/** どのワークツリーにも checkout されていない `consult/*`。`%(worktreepath)` が空のもの（git 2.23+） */
function listOrphanBranches(cwd: string, deps: WorktreeDeps): ConsultBranch[] {
  const result = deps.git(cwd, [
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
 * ブランチの掃除。取り込み済み → 消して `removed`、未マージ → 残して `kept` / `unmerged`。
 *
 * `forceBranch` だけは `force` の対象として捨て（`-D`）、`removed` として報告に入れる。
 * `-d` は「HEAD（または upstream）に取り込まれていなければ断る」ので、未マージの仕事をここで消さない。
 */
function sweepBranches(
  cwd: string,
  deps: WorktreeDeps,
  forceBranch?: ConsultBranch,
): OrphanBranch[] {
  const report: OrphanBranch[] = [];
  for (const branch of listOrphanBranches(cwd, deps)) {
    if (forceBranch !== undefined && branch === forceBranch) {
      const deleted = deps.git(cwd, ['branch', '-D', branch]);
      if (deleted.status !== 0) {
        throw new Error(
          `could not delete the branch ${branch}: ${(deleted.stderr || deleted.error || '').trim()}`,
        );
      }
      report.push({ state: 'removed', branch });
      continue;
    }
    const deleted = deps.git(cwd, ['branch', '-d', branch]);
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
 * 掃除だけを単独で呼べる形（`removeWorktree` の中と同じものを使う）。
 *
 * 実体のない登録を `prune` で落とし、どのワークツリーにも checkout されていない `consult/*` のうち
 * 取り込み済みを消す。未マージは残して報告する。走っているサブエージェントのワークツリーは checkout 中なので触らない
 * （登録もブランチも残る）。git が断ったら例外にする。
 */
export function cleanWorktrees(cwd: string, deps: WorktreeDeps): CleanupReport {
  const pruned = pruneWorktrees(cwd, deps);
  const branches = sweepBranches(cwd, deps);
  return { pruned, branches };
}

/**
 * ワークツリーを消す。サブエージェントが動いているときは消さない（busy）。掃除もしない。
 *
 * 順序は prune → 掃除 → 登録の再確認（prune で消えた登録は `missing` になる）。ブランチの掃除は
 * `busy` 以外のどの経路でも走る（`missing` でも `dirty` でも、孤児のブランチは片付ける）。変更が
 * 残っているときは `force` を要求する（未コミットの作業を消さない）。登録を消してから入れものを
 * 消す（順序を逆にすると登録が残る）。ブランチの運命は掃除が決める（この関数は自分のブランチを直接消さない）。
 * `prune` と `worktree remove` の失敗は例外にする（成功として扱わない）。
 */
export function removeWorktree(
  cwd: string,
  deps: WorktreeDeps,
  id: string,
  options: RemoveOptions = {},
): RemoveResult {
  if (options.busy === true) {
    return { outcome: 'busy', cleanup: emptyCleanup() };
  }
  const pruned = pruneWorktrees(cwd, deps);
  // `force` はこの unit のブランチだけを捨てる印。実体がなくても、ブランチが残っていれば効かせる
  const forceBranch = options.force === true ? branchFor(id) : undefined;
  const found = findWorktree(cwd, deps, id);
  if (found === undefined) {
    return {
      outcome: 'missing',
      cleanup: { pruned, branches: sweepBranches(cwd, deps, forceBranch) },
    };
  }
  if (found.dirty && options.force !== true) {
    return { outcome: 'dirty', cleanup: { pruned, branches: sweepBranches(cwd, deps) } };
  }
  const removed = deps.git(cwd, ['worktree', 'remove', '--force', found.path]);
  if (removed.status !== 0) {
    throw new Error(
      `could not remove the worktree ${id}: ${(removed.stderr || removed.error || '').trim()}`,
    );
  }
  rmSync(found.unitDir, { recursive: true, force: true });
  const branches = sweepBranches(cwd, deps, forceBranch);
  return { outcome: 'removed', cleanup: { pruned, branches } };
}
