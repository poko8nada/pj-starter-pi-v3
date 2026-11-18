/**
 * consult の git の使い方を模す偽物。
 *
 * 何をする物か
 * - `createWorktreeGit()` は、consult が呼ぶ8つの命令（`rev-parse`・`worktree list/add/prune/remove`・`for-each-ref`・`branch -d`・`status`）の意味を持つ。
 * - worktree の一覧の組み立て、orphan（どのワークツリーにも checkout されていない `consult/*`）、未マージ、dirty、最後の `worktree add` の引数を状態として持つ。
 * - 汎用の偽 git（`test/fake-git.fixture.ts`）に、この状態の関数を `handle` として渡す。
 *
 * どう使うか
 * - テストは `fake.fail('worktree add')` や `fake.print('worktree list', …)` のように、consult の命令名で前提を述べる。
 * - 状態を変えるのは `makeDirty`・`addOrphan`・`markUnmerged`。振る舞いで前提を述べるためのつまみ。
 */
import { existsSync, mkdirSync } from 'node:fs';
import { createFakeGit, type GitResult } from '../../../../test/fake-git.fixture.ts';

/** consult が呼ぶ git の命令。偽物が意味を持つ単位 */
export type GitCommand =
  | 'rev-parse'
  | 'worktree list'
  | 'worktree add'
  | 'worktree prune'
  | 'worktree remove'
  | 'for-each-ref'
  | 'branch -d'
  | 'status';

/** 偽物の状態。外には出さない */
interface State {
  readonly entries: { readonly path: string; readonly ref: string }[];
  readonly orphans: Map<string, boolean>;
  readonly unmerged: Set<string>;
  readonly dirtyPaths: Set<string>;
  last: LastAdd | null;
}

export interface LastAdd {
  readonly branch: string;
  readonly path: string;
  readonly base: string;
}

export interface WorktreeGit {
  readonly git: (cwd: string, args: readonly string[]) => GitResult;
  readonly fail: (command: GitCommand, status?: number) => void;
  readonly print: (command: GitCommand, output: string) => void;
  readonly makeDirty: (path: string) => void;
  readonly addOrphan: (branch: string, merged: boolean) => void;
  readonly markUnmerged: (branch: string) => void;
  readonly lastAdd: () => LastAdd | undefined;
}

/** `args` から命令の名を作る。知らない形は undefined */
function commandName(args: readonly string[]): GitCommand | undefined {
  if (args[0] === 'rev-parse') {
    return 'rev-parse';
  }
  if (args[0] === 'worktree' && args[1] === 'list') {
    return 'worktree list';
  }
  if (args[0] === 'worktree' && args[1] === 'add') {
    return 'worktree add';
  }
  if (args[0] === 'worktree' && args[1] === 'prune') {
    return 'worktree prune';
  }
  if (args[0] === 'worktree' && args[1] === 'remove') {
    return 'worktree remove';
  }
  if (args[0] === 'for-each-ref') {
    return 'for-each-ref';
  }
  if (args[0] === 'branch' && (args[1] === '-d' || args[1] === '-D')) {
    return 'branch -d';
  }
  if (args[0] === 'status') {
    return 'status';
  }
  return undefined;
}

/** `args` から命令の名を作る。知らない形は投げる */
function commandOf(args: readonly string[]): GitCommand {
  const name = commandName(args);
  if (name === undefined) {
    throw new Error(`fake git: unknown command: ${args.join(' ')}`);
  }
  return name;
}

function revParse(cwd: string): GitResult {
  return { status: 0, stdout: `${cwd}\n`, stderr: '' };
}

function worktreeList(state: State): GitResult {
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

function statusOf(state: State, cwd: string): GitResult {
  if (state.dirtyPaths.has(cwd)) {
    return { status: 0, stdout: '?? dirty\n', stderr: '' };
  }
  return { status: 0, stdout: '', stderr: '' };
}

function worktreeAdd(state: State, args: readonly string[]): GitResult {
  const branch = args[3] ?? '';
  const path = args[4] ?? '';
  const base = args[5] ?? '';
  state.last = { branch, path, base };
  if (branch.includes(' ') || branch.includes('\n')) {
    // git が保存場所を作ってから失敗した形にする。作らなければ `createWorktree` の後始末が何も消さず、テストが空振りになる。
    mkdirSync(path, { recursive: true });
    return { status: 1, stdout: '', stderr: 'fatal: bad branch' };
  }
  mkdirSync(path, { recursive: true });
  state.entries.push({ path, ref: `refs/heads/${branch}` });
  return { status: 0, stdout: '', stderr: '' };
}

function worktreePrune(state: State): GitResult {
  const removed = state.entries.filter((entry) => !existsSync(entry.path));
  for (const gone of removed) {
    const short = gone.ref.replace(/^refs\/heads\//, '');
    if (!state.orphans.has(short)) {
      state.orphans.set(short, !state.unmerged.has(short));
    }
  }
  const kept = state.entries.filter((entry) => existsSync(entry.path));
  state.entries.splice(0, state.entries.length, ...kept);
  return { status: 0, stdout: '', stderr: '' };
}

function worktreeRemove(state: State, args: readonly string[]): GitResult {
  const path = args[3] ?? '';
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

function forEachRef(state: State): GitResult {
  const checkedOut = new Set(state.entries.map((entry) => entry.ref.replace(/^refs\/heads\//, '')));
  const lines = [...state.orphans.keys()]
    .filter((branch) => !checkedOut.has(branch))
    .map((branch) => `refs/heads/${branch} `);
  return { status: 0, stdout: lines.length > 0 ? `${lines.join('\n')}\n` : '', stderr: '' };
}

function branchDelete(state: State, args: readonly string[]): GitResult {
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

/** その命令かどうかを見る関数 */
function matchOf(command: GitCommand): (args: readonly string[]) => boolean {
  return (args) => commandName(args) === command;
}

/** consult の git の使い方を模す偽物を作る */
export function createWorktreeGit(): WorktreeGit {
  const state: State = {
    entries: [],
    orphans: new Map(),
    unmerged: new Set(),
    dirtyPaths: new Set(),
    last: null,
  };
  const handle = (cwd: string, args: readonly string[]): GitResult => {
    const command = commandOf(args);
    if (command === 'rev-parse') {
      return revParse(cwd);
    }
    if (command === 'worktree list') {
      return worktreeList(state);
    }
    if (command === 'status') {
      return statusOf(state, cwd);
    }
    if (command === 'worktree add') {
      return worktreeAdd(state, args);
    }
    if (command === 'worktree prune') {
      return worktreePrune(state);
    }
    if (command === 'worktree remove') {
      return worktreeRemove(state, args);
    }
    if (command === 'for-each-ref') {
      return forEachRef(state);
    }
    return branchDelete(state, args);
  };
  const base = createFakeGit(handle);
  return {
    git: base.git,
    fail: (command, status) => {
      base.fail(matchOf(command), status);
    },
    print: (command, output) => {
      base.print(matchOf(command), output);
    },
    makeDirty: (path) => {
      state.dirtyPaths.add(path);
    },
    addOrphan: (branch, merged) => {
      state.orphans.set(branch, merged);
      if (merged) {
        state.unmerged.delete(branch);
      } else {
        state.unmerged.add(branch);
      }
    },
    markUnmerged: (branch) => {
      state.unmerged.add(branch);
      if (state.orphans.has(branch)) {
        state.orphans.set(branch, false);
      }
    },
    lastAdd: () => state.last ?? undefined,
  };
}
