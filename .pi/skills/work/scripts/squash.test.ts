import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { execute, makeGit, main, parseArgs, planSquash } from './squash.mjs';

// git を実際に打つ。書き込む先は毎回の一時ディレクトリ（自分の repo・config・HOME）に固定する。

const repos: string[] = [];

afterEach(() => {
  for (const dir of repos.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

interface Repo {
  readonly dir: string;
  /** 潰す範囲の親（チケットを置いたコミット） */
  readonly base: string;
  /** 潰す範囲（step のコミット、古い順） */
  readonly hashes: string[];
  readonly cycle: string;
  readonly ticket: string;
  readonly git: (args: string[]) => { stdout: string; status: number | null };
}

/**
 * git を打つときの環境。`GIT_*` を落とし、`HOME` を一時ディレクトリに向ける。
 *
 * これをしないと、フック（lefthook）の中で走ったときに実リポジトリの config を書き換える
 * （2026-09-27 に踏んだ: `core.bare` と `user.*` が実リポジトリに入った。`consult/run/git-env.ts` と同じ理由）。
 */
function gitEnv(home: string): NodeJS.ProcessEnv {
  const cleaned: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('GIT_')) {
      cleaned[key] = value;
    }
  }
  return { ...cleaned, HOME: home, XDG_CONFIG_HOME: join(home, '.config') };
}

/** 試験用のリポジトリ。チケットのコミットの上に、step のコミットを数件置く */
function makeRepo(overrides: { steps?: number } = {}): Repo {
  const dir = mkdtempSync(join(tmpdir(), 'squash-'));
  repos.push(dir);
  const home = join(dir, 'home');
  mkdirSync(home, { recursive: true });
  const env = gitEnv(home);
  const git = (args: string[]) => {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8', env });
    return { stdout: result.stdout ?? '', status: result.status };
  };
  git(['init', '-q']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'test']);
  git(['config', 'commit.gpgsign', 'false']);

  const cycle = join(dir, 'cycles', '999-2026-01-01');
  mkdirSync(join(cycle, 'tickets'), { recursive: true });
  const ticket = join(cycle, 'tickets', '01-a.md');
  writeFileSync(
    ticket,
    `# a\n\n## Verify\n\n### read\n\n- 何か\n\n## Notes\n\n### Findings\n\n- なし\n\nCommit: \n`,
  );
  git(['add', '-A']);
  git(['commit', '-q', '-m', '999: the tickets']);
  const base = git(['rev-parse', '--short', 'HEAD']).stdout.trim();

  const hashes: string[] = [];
  for (let index = 1; index <= (overrides.steps ?? 3); index += 1) {
    writeFileSync(join(dir, `file${index}.txt`), `x${index}\n`);
    git(['add', '-A']);
    git(['commit', '-q', '-m', `999 step ${index}: change ${index}`]);
    hashes.push(git(['rev-parse', '--short', 'HEAD']).stdout.trim());
  }
  return { dir, base, hashes, cycle, ticket, git };
}

function options(repo: Repo, hashes: string[] = repo.hashes) {
  return { cycleDir: repo.cycle, base: repo.base, hashes };
}

describe('parseArgs', () => {
  it('足りない引数は使い方を出して投げる', () => {
    expect(() => parseArgs(['cycles/999', 'abc1234'])).toThrow(/usage/);
  });

  it('run が最後でなければ投げる', () => {
    expect(() => parseArgs(['run', 'cycles/999', 'abc1234', 'def5678'])).toThrow(/run/);
  });
});

describe('planSquash', () => {
  it('乾燥は何も変えず、潰す一覧とメッセージと書き換え先を出す', () => {
    const repo = makeRepo();
    const before = repo.git(['rev-parse', 'HEAD']).stdout;
    const plan = planSquash(makeGit(repo.dir), options(repo));

    expect(plan.range).toEqual(repo.hashes);
    expect(plan.message.subject).toBe('999 step 1: change 1');
    expect(plan.message.body).toBe('- 999 step 2: change 2\n- 999 step 3: change 3');
    expect(plan.tickets).toEqual([]);
    expect(repo.git(['rev-parse', 'HEAD']).stdout).toBe(before);
  });

  it('潰す対象が 0 件なら何もせず、そう言う', () => {
    const repo = makeRepo();
    expect(() =>
      planSquash(makeGit(repo.dir), { ...options(repo), base: repo.hashes.at(-1) }),
    ).toThrow(/0 件/);
  });
});

describe('execute', () => {
  it('run は 1 コミットにまとめ、チケットの Commit: を新しいハッシュに書き換える', () => {
    const repo = makeRepo();
    // チケットに、潰す前のハッシュを書いたコミットを 1 つ足す（作業ツリーはきれいなままにする）
    writeFileSync(
      repo.ticket,
      readFileSync(repo.ticket, 'utf8').replace(
        'Commit: ',
        `Commit: ${repo.hashes[1]}（注記つき）`,
      ),
    );
    repo.git(['add', '-A']);
    repo.git(['commit', '-q', '-m', '999 step 4: the ticket names its commit']);
    const withTicket = [...repo.hashes, repo.git(['rev-parse', '--short', 'HEAD']).stdout.trim()];

    const done = execute(makeGit(repo.dir), {
      cycleDir: repo.cycle,
      base: repo.base,
      hashes: withTicket,
    });

    expect(done.squash).toMatch(/^[0-9a-f]{7,}$/);
    expect(done.changes).toHaveLength(1);
    expect(done.changes[0]?.from).toBe(repo.hashes[1]);
    // チケットのコミット + まとめた 1 本
    expect(repo.git(['log', '--format=%h']).stdout.trim().split('\n')).toHaveLength(2);
    expect(readFileSync(repo.ticket, 'utf8')).toContain(`Commit: ${done.squash}（注記つき）`);
  });

  it('空の Commit: のチケットだけなら、何も書き換えずに通る', () => {
    const repo = makeRepo();
    const done = execute(makeGit(repo.dir), options(repo));
    expect(done.changes).toEqual([]);
  });

  it('一覧が base..HEAD と違えば中止する', () => {
    const repo = makeRepo();
    expect(() =>
      execute(makeGit(repo.dir), { ...options(repo), hashes: [repo.hashes[0], repo.hashes[2]] }),
    ).toThrow(/一覧/);
  });

  it('作業ツリーが汚れていれば中止し、退避タグも打たない', () => {
    const repo = makeRepo();
    writeFileSync(join(repo.dir, 'dirty.txt'), 'x\n');
    expect(() => execute(makeGit(repo.dir), options(repo))).toThrow(/汚れている/);
    expect(repo.git(['tag', '--list', 'squash-backup-*']).stdout.trim()).toBe('');
  });
});

describe('main', () => {
  it('乾燥は 0 で予定を出し、知らない引数は 2 で使い方を出す', () => {
    const repo = makeRepo();
    expect(main([repo.cycle, repo.base, ...repo.hashes], repo.dir)).toBe(0);
    expect(main(['oops'], repo.dir)).toBe(2);
  });
});
