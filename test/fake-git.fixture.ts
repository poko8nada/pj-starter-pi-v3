import { existsSync, mkdirSync } from 'node:fs';

/** 偽物が返す git の結果。本物の `git()` と同じ形（`error?` を含む） */
export interface GitResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}

/**
 * 偽物の状態。テストが直接設定するので、フィールドは readonly にしない。
 * ADR 01 の Allowed（偽物の状態をテスト本体から設定・参照する）を満たすため。
 * 判別可能な union にしないのは、`listStatus` などの値が同時に成立するため（対義的な状態の集合ではない）。
 */
export interface FakeState {
  entries: { path: string; ref: string }[];
  orphans: Map<string, boolean>;
  unmerged: Set<string>;
  dirtyPaths: Set<string>;
  listStatus: number;
  listOverride: string | null;
  addStatus: number;
  removeStatus: number;
  pruneStatus: number;
  forEachRefStatus: number;
  lastAdd: { branch: string; path: string; base: string } | null;
}

/** 偽物の見せ方。状態と、状態を準備する3つの補助を持つ */
export interface FakeGit {
  readonly git: (cwd: string, args: readonly string[]) => GitResult;
  readonly state: FakeState;
  readonly makeDirty: (path: string) => void;
  readonly addOrphan: (branch: string, merged: boolean) => void;
  readonly markUnmerged: (branch: string) => void;
}

// eslint-disable-next-line max-lines-per-function -- plan の Steps が state を閉じる内側の4関数を決め、上限80を超えるため
export function createFakeGit(): FakeGit {
  const state: FakeState = {
    entries: [],
    orphans: new Map(),
    unmerged: new Set(),
    dirtyPaths: new Set(),
    listStatus: 0,
    listOverride: null,
    addStatus: 0,
    removeStatus: 0,
    pruneStatus: 0,
    forEachRefStatus: 0,
    lastAdd: null,
  };
  // eslint-disable-next-line max-lines-per-function -- 9つの分岐を写す plan の Steps のため、上限80を超える
  function git(cwd: string, args: readonly string[]): GitResult {
    if (args[0] === 'rev-parse') {
      return { status: 0, stdout: `${cwd}\n`, stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'list') {
      if (state.listStatus !== 0) {
        return { status: state.listStatus, stdout: '', stderr: 'not a repository' };
      }
      if (state.listOverride !== null) {
        return { status: 0, stdout: state.listOverride, stderr: '' };
      }
      const blocks = state.entries.map((entry) => {
        const prunable = !existsSync(entry.path);
        return prunable
          ? `worktree ${entry.path}\nbranch ${entry.ref}\nprunable`
          : `worktree ${entry.path}\nbranch ${entry.ref}`;
      });
      return {
        status: 0,
        stdout: blocks.length > 0 ? `${blocks.join('\n\n')}\n` : '',
        stderr: '',
      };
    }
    if (args[0] === 'status') {
      if (state.dirtyPaths.has(cwd)) {
        return { status: 0, stdout: '?? dirty\n', stderr: '' };
      }
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'add') {
      const branch = args[3] ?? '';
      const path = args[4] ?? '';
      const base = args[5] ?? '';
      state.lastAdd = { branch, path, base };
      if (branch.includes(' ') || branch.includes('\n') || state.addStatus !== 0) {
        // git が保存場所を作ってから失敗した形にする。作らなければ `createWorktree` の後始末が何も消さず、テストが空振りになる。
        mkdirSync(path, { recursive: true });
        return { status: 1, stdout: '', stderr: 'fatal: bad branch' };
      }
      mkdirSync(path, { recursive: true });
      state.entries.push({ path, ref: `refs/heads/${branch}` });
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'prune') {
      if (state.pruneStatus !== 0) {
        return { status: state.pruneStatus, stdout: '', stderr: 'prune failed' };
      }
      const removed = state.entries.filter((entry) => !existsSync(entry.path));
      for (const gone of removed) {
        const short = gone.ref.replace(/^refs\/heads\//, '');
        if (!state.orphans.has(short)) {
          state.orphans.set(short, !state.unmerged.has(short));
        }
      }
      state.entries = state.entries.filter((entry) => existsSync(entry.path));
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'remove') {
      const path = args[3] ?? '';
      if (state.removeStatus !== 0) {
        return { status: state.removeStatus, stdout: '', stderr: 'remove failed' };
      }
      const at = state.entries.findIndex((entry) => entry.path === path);
      if (at >= 0) {
        const removed = state.entries.splice(at, 1)[0];
        if (removed !== undefined) {
          const short = removed.ref.replace(/^refs\/heads\//, '');
          if (!state.orphans.has(short)) {
            state.orphans.set(short, !state.unmerged.has(short));
          }
        }
      }
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'for-each-ref') {
      if (state.forEachRefStatus !== 0) {
        return { status: state.forEachRefStatus, stdout: '', stderr: 'for-each-ref failed' };
      }
      const checkedOut = new Set(
        state.entries.map((entry) => entry.ref.replace(/^refs\/heads\//, '')),
      );
      const lines = [...state.orphans.keys()]
        .filter((branch) => !checkedOut.has(branch))
        .map((branch) => `refs/heads/${branch} `);
      return { status: 0, stdout: lines.length > 0 ? `${lines.join('\n')}\n` : '', stderr: '' };
    }
    if (args[0] === 'branch' && (args[1] === '-d' || args[1] === '-D')) {
      const branch = args[2] ?? '';
      if (args[1] === '-D') {
        state.orphans.delete(branch);
        state.unmerged.delete(branch);
        return { status: 0, stdout: '', stderr: '' };
      }
      if (state.unmerged.has(branch)) {
        return { status: 1, stdout: '', stderr: 'not fully merged' };
      }
      state.orphans.delete(branch);
      return { status: 0, stdout: '', stderr: '' };
    }
    return { status: 0, stdout: '', stderr: '' };
  }
  function makeDirty(path: string): void {
    state.dirtyPaths.add(path);
  }
  function addOrphan(branch: string, merged: boolean): void {
    state.orphans.set(branch, merged);
    if (merged) {
      state.unmerged.delete(branch);
    } else {
      state.unmerged.add(branch);
    }
  }
  function markUnmerged(branch: string): void {
    state.unmerged.add(branch);
    if (state.orphans.has(branch)) {
      state.orphans.set(branch, false);
    }
  }
  return { git, state, makeDirty, addOrphan, markUnmerged };
}
