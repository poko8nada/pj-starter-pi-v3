import { existsSync, mkdirSync } from 'node:fs';
import type { GitOutput } from '../.pi/extensions/consult/run/run.ts';

/** 偽物の状態。外には出さない */
interface State {
  readonly entries: { readonly path: string; readonly ref: string }[];
  readonly orphans: Map<string, boolean>;
  readonly unmerged: Set<string>;
  readonly dirtyPaths: Set<string>;
  readonly failures: Map<GitCommand, number>;
  readonly prints: Map<GitCommand, string>;
  last: LastAdd | null;
}

interface LastAdd {
  readonly branch: string;
  readonly path: string;
  readonly base: string;
}

export type GitCommand =
  | 'rev-parse'
  | 'worktree list'
  | 'worktree add'
  | 'worktree prune'
  | 'worktree remove'
  | 'for-each-ref'
  | 'branch -d'
  | 'status';

export interface FakeGit {
  readonly git: (cwd: string, args: readonly string[]) => GitOutput;
  readonly fail: (command: GitCommand, status?: number) => void;
  readonly print: (command: GitCommand, output: string) => void;
  readonly makeDirty: (path: string) => void;
  readonly addOrphan: (branch: string, merged: boolean) => void;
  readonly markUnmerged: (branch: string) => void;
  readonly lastAdd: () => LastAdd | undefined;
}

/** `args` から偽物が分かるコマンド名を作る。知らない形は投げる */
function commandOf(args: readonly string[]): GitCommand {
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
  throw new Error(`fake git: unknown command: ${args.join(' ')}`);
}

function revParse(cwd: string): GitOutput {
  return { status: 0, stdout: `${cwd}\n`, stderr: '' };
}

function worktreeList(state: State): GitOutput {
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

function statusOf(state: State, cwd: string): GitOutput {
  if (state.dirtyPaths.has(cwd)) {
    return { status: 0, stdout: '?? dirty\n', stderr: '' };
  }
  return { status: 0, stdout: '', stderr: '' };
}

function worktreeAdd(state: State, args: readonly string[]): GitOutput {
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

function worktreePrune(state: State): GitOutput {
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

function worktreeRemove(state: State, args: readonly string[]): GitOutput {
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

function forEachRef(state: State): GitOutput {
  const checkedOut = new Set(state.entries.map((entry) => entry.ref.replace(/^refs\/heads\//, '')));
  const lines = [...state.orphans.keys()]
    .filter((branch) => !checkedOut.has(branch))
    .map((branch) => `refs/heads/${branch} `);
  return { status: 0, stdout: lines.length > 0 ? `${lines.join('\n')}\n` : '', stderr: '' };
}

function branchDelete(state: State, args: readonly string[]): GitOutput {
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

/** テストの前提を振る舞いで述べる偽物の git。状態は中に閉じる */
export function createFakeGit(): FakeGit {
  const state: State = {
    entries: [],
    orphans: new Map(),
    unmerged: new Set(),
    dirtyPaths: new Set(),
    failures: new Map(),
    prints: new Map(),
    last: null,
  };
  const git = (cwd: string, args: readonly string[]): GitOutput => {
    const command = commandOf(args);
    const failure = state.failures.get(command);
    if (failure !== undefined) {
      return { status: failure, stdout: '', stderr: `${command} failed` };
    }
    const printed = state.prints.get(command);
    if (printed !== undefined) {
      return { status: 0, stdout: printed, stderr: '' };
    }
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
  return {
    git,
    fail: (command, status = 1) => {
      state.failures.set(command, status);
    },
    print: (command, output) => {
      state.prints.set(command, output);
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
