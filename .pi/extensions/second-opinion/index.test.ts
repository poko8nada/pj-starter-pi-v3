import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { DEFAULT_QUESTION } from './answer.ts';
import { type AgentMessage, type Held } from './conversation.ts';
import { DEFAULT_MESSAGES, TOOL_NAME, parseCommandArgs, runOpinion, toRequest } from './index.ts';

// 子を走らせない分だけを試す（文字列の組み立て）。子の起動は Slice 4 の統合で扱う。

describe('toRequest', () => {
  it('既定の質問と件数 20（何も渡さない）', () => {
    expect(toRequest({})).toEqual({});
    expect(DEFAULT_MESSAGES).toBe(20);
  });

  it('focus の上書き', () => {
    expect(toRequest({ focus: 'is this consistent?' })).toEqual({ focus: 'is this consistent?' });
  });

  it('空の focus は指定なしとみなす', () => {
    expect(toRequest({ focus: '   ' })).toEqual({});
  });

  it('messages の上書き', () => {
    expect(toRequest({ messages: 5 })).toEqual({ messages: 5 });
  });

  it('道具の名前は opinion', () => {
    expect(TOOL_NAME).toBe('opinion');
  });
});

describe('parseCommandArgs', () => {
  it('先頭が数字なら件数、残りが質問', () => {
    expect(parseCommandArgs('10 is this consistent?')).toEqual({
      messages: 10,
      focus: 'is this consistent?',
    });
  });

  it('数字だけなら件数だけ', () => {
    expect(parseCommandArgs('10')).toEqual({ messages: 10 });
  });

  it('数字でなければ質問だけ', () => {
    expect(parseCommandArgs('is this consistent?')).toEqual({ focus: 'is this consistent?' });
  });

  it('空なら既定の質問（空の依頼）', () => {
    expect(parseCommandArgs('')).toEqual({});
    expect(parseCommandArgs('   ')).toEqual({});
  });
});

// 統合: `.pi/test/pi` の偽で子を走らせる。本物の pi も worktree も要らない。

/** owner の発言だけの会話 */
function heldOf(...texts: string[]): Held {
  return {
    messages: texts.map((text, index): AgentMessage => ({
      role: 'user',
      content: text,
      timestamp: index,
    })),
  };
}

/** 偽の pi を指す環境。`FAKE_PI_TEXT` が子の本文になる */
function fakeEnv(bin: string, text: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `${bin}:${process.env.PATH ?? ''}`,
    FAKE_PI_MODE: 'exit',
    FAKE_PI_TEXT: text,
  };
}

/** 引数と stdin を記録して偽の pi に渡す wrapper の `pi` を置く */
function placeWrapper(bin: string, argsFile: string, stdinFile: string): void {
  const fake = join(process.cwd(), '.pi/test/pi');
  writeFileSync(
    join(bin, 'pi'),
    `#!/bin/sh\nprintf '%s\\n' "$@" > "${argsFile}"\ntee "${stdinFile}" | exec "${fake}" "$@"\n`,
  );
  chmodSync(join(bin, 'pi'), 0o755);
}

describe('runOpinion: 偽の pi で子を走らせる', () => {
  it('ツールが子の本文をそのまま返す', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    placeWrapper(bin, join(bin, 'args.txt'), join(bin, 'stdin.txt'));
    const body = await runOpinion(
      { cwd: dir, env: fakeEnv(bin, 'Consistent: yes') },
      heldOf('we keep changing our minds', 'which plan is right?'),
      {},
    );
    expect(body).toBe('Consistent: yes');
  });

  it('子の起動引数に --no-session とロールの道具一覧が入る', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    const argsFile = join(bin, 'args.txt');
    placeWrapper(bin, argsFile, join(bin, 'stdin.txt'));
    await runOpinion(
      { cwd: dir, env: fakeEnv(bin, 'Consistent: yes') },
      heldOf('we keep changing our minds'),
      {},
    );
    const args = readFileSync(argsFile, 'utf8').split('\n');
    expect(args).toContain('--no-session');
    expect(args[args.indexOf('--tools') + 1]).toBe('read,ls,find,grep,web_search,fetch_content');
  });

  it('子の答えは加工せずそのまま返る', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    placeWrapper(bin, join(bin, 'args.txt'), join(bin, 'stdin.txt'));
    const body = await runOpinion(
      { cwd: dir, env: fakeEnv(bin, 'Holes: none...  (read 2)') },
      heldOf('is this consistent?'),
      { focus: 'check this' },
    );
    expect(body).toBe('Holes: none...  (read 2)');
  });

  it('会話が空のまま呼ぶ → 既定の質問だけで走る', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    const stdinFile = join(bin, 'stdin.txt');
    placeWrapper(bin, join(bin, 'args.txt'), stdinFile);
    const body = await runOpinion(
      { cwd: dir, env: fakeEnv(bin, 'Consistent: yes') },
      { messages: [] },
      {},
    );
    expect(body).toBe('Consistent: yes');
    expect(readFileSync(stdinFile, 'utf8')).toBe(DEFAULT_QUESTION);
  });

  it('pi が無い PATH → 例外を投げ、黙って空を返さない', async () => {
    const dir = tmpDir();
    const emptyBin = tmpDir();
    await expect(
      runOpinion({ cwd: dir, env: { ...process.env, PATH: emptyBin } }, heldOf('hi'), {}),
    ).rejects.toThrow(/did not finish/);
  });
});
