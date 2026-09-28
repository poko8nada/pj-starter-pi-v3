/**
 * 止まった子の worktree を扱う。
 *
 * `list` は `git worktree list --porcelain` から、consult が作った物だけを拾い、記録（`stopped.json`）を読む。
 * `run` はその worktree をそのまま `cwd` にして子を走らせる（`createWorktree` は呼ばない。依存は既に入っている）。
 * `remove` は worktree と、その親（記録もそこにある）を消す。
 *
 * worktree の形は `run/run.ts` の `createWorktree` が決める: `<tmp>/consult-XXXX/wt`。親の名前が id。
 */
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { gitEnv } from './run.ts';
import { readStopped, type StoppedRecord } from './stopped.ts';

export interface StoppedWorktree {
  /** 親に見せる id（worktree の親ディレクトリ名、`consult-XXXX`） */
  readonly id: string;
  readonly dir: string;
  readonly parent: string;
  readonly record?: StoppedRecord;
}

export interface WorktreeEntry {
  readonly dir: string;
  readonly detached: boolean;
}

function git(cwd: string, args: readonly string[]): string {
  const result = spawnSync('git', [...args], { cwd, encoding: 'utf8', env: gitEnv() });
  return result.stdout ?? '';
}

/** `git worktree list --porcelain` を読む。空行で 1 件が終わる */
export function parseWorktreeList(text: string): WorktreeEntry[] {
  const entries: WorktreeEntry[] = [];
  let dir: string | undefined;
  let detached = false;
  const flush = () => {
    if (dir !== undefined) {
      entries.push({ dir, detached });
    }
    dir = undefined;
    detached = false;
  };
  for (const line of text.split('\n')) {
    if (line.startsWith('worktree ')) {
      flush();
      dir = line.slice('worktree '.length).trim();
    } else if (line === 'detached') {
      detached = true;
    } else if (line === '') {
      flush();
    }
  }
  flush();
  return entries;
}

/** consult が作った worktree か。親の名前が `consult-` で始まり、中身は `wt` */
function isConsultWorktree(dir: string): boolean {
  return basename(dir) === 'wt' && basename(dirname(dir)).startsWith('consult-');
}

/** 残っている worktree を、記録と一緒に返す */
export function stoppedWorktrees(cwd: string): StoppedWorktree[] {
  const entries: StoppedWorktree[] = [];
  for (const entry of parseWorktreeList(git(cwd, ['worktree', 'list', '--porcelain']))) {
    if (!isConsultWorktree(entry.dir)) {
      continue;
    }
    const parent = dirname(entry.dir);
    const record = readStopped({ parent, dir: entry.dir, cwd: entry.dir });
    entries.push({
      id: basename(parent),
      dir: entry.dir,
      parent,
      ...(record === undefined ? {} : { record }),
    });
  }
  return entries;
}

/** 1 つ消す。worktree を外し、親ごと消す（記録もそこにある） */
export function removeStopped(cwd: string, id: string): StoppedWorktree | undefined {
  const found = stoppedWorktrees(cwd).find((entry) => entry.id === id);
  if (found === undefined) {
    return undefined;
  }
  git(cwd, ['worktree', 'remove', '--force', found.dir]);
  rmSync(found.parent, { recursive: true, force: true });
  return found;
}
