import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { DEFAULT_QUESTION } from './answer.ts';
import { type RunResult } from './run/run.ts';
import { ownerMessage, recordMessage, type AgentMessage, type Held } from './conversation.ts';
import {
  DEFAULT_MESSAGES,
  TOOL_NAME,
  bodyOf,
  collectMessage,
  parseCommandArgs,
  runOpinion,
  toRequest,
} from './index.ts';

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
    `#!/bin/sh\nprintf '%s\\n' "$@" > "${argsFile}"\nprintf '%s' "$CONSULT_POLICY" > "${argsFile}.policy"\nprintf '%s' "$CONSULT_TURNS" > "${argsFile}.turns"\nprintf 'x' >> "${argsFile}.calls"\ntee "${stdinFile}" | exec "${fake}" "$@"\n`,
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

describe('collectMessage', () => {
  it('user は input で貯めるので貯めない', () => {
    const held: Held = { messages: [] };
    collectMessage(held, { role: 'user', content: 'hi', timestamp: 1 });
    expect(held.messages).toHaveLength(0);
  });

  it('agent 側は貯める', () => {
    const held: Held = { messages: [] };
    const message: AgentMessage = {
      role: 'assistant',
      content: [{ type: 'text', text: 'done' }],
      api: 'test',
      provider: 'test',
      model: 'test',
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: 'stop',
      timestamp: 1,
    };
    collectMessage(held, message);
    expect(held.messages).toEqual([message]);
  });

  it('input は時刻つきで貯まる', () => {
    const held: Held = { messages: [] };
    recordMessage(held, ownerMessage('do this', 7));
    expect(held.messages).toEqual([{ role: 'user', content: 'do this', timestamp: 7 }]);
  });
});

/** 終わった子の結果。`ended` だけを変えて終わり方を作る */
function ended(extra: Partial<RunResult> = {}): RunResult {
  return { stdout: '', stderr: '', code: 0, aborted: false, ended: false, ...extra };
}

describe('bodyOf', () => {
  it('終わり切らなければ投げる', () => {
    expect(() => bodyOf(ended({ code: 1, stderr: 'boom' }))).toThrow(/did not finish.*boom/);
  });

  it('生成 0 のまま done の空本文はそのまま返す', () => {
    expect(bodyOf(ended({ ended: true }))).toBe('');
  });

  it('本文があればそのまま返す', () => {
    const stdout =
      '{"type":"message_end","message":{"role":"assistant","content":[{"type":"text","text":"hi"}],"usage":{"output":1}}}\n';
    expect(bodyOf(ended({ stdout, ended: true }))).toBe('hi');
  });
});

describe('不正な messages', () => {
  it('messages: 0 → 子を走らせず投げる', async () => {
    const dir = tmpDir();
    await expect(
      runOpinion({ cwd: dir, env: { ...process.env } }, heldOf('hi'), { messages: 0 }),
    ).rejects.toThrow(/positive integer/);
  });

  it('toRequest は素通し（検証は windowFrom がする）', () => {
    expect(toRequest({ messages: 0 })).toEqual({ messages: 0 });
  });

  it("'0 check' → messages: 0 と質問", () => {
    expect(parseCommandArgs('0 check')).toEqual({ messages: 0, focus: 'check' });
  });

  it('先頭の - は件数にしない', () => {
    expect(parseCommandArgs('-3 x')).toEqual({ focus: '-3 x' });
  });
});

describe('runOpinion: 子への env とモデル', () => {
  it('子に役割の許可と上限を渡す', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    const argsFile = join(bin, 'args.txt');
    placeWrapper(bin, argsFile, join(bin, 'stdin.txt'));
    await runOpinion({ cwd: dir, env: fakeEnv(bin, 'Consistent: yes') }, heldOf('hi'), {});
    expect(readFileSync(`${argsFile}.policy`, 'utf8')).toBe(
      JSON.stringify({ paths: [], bash: [] }),
    );
    expect(readFileSync(`${argsFile}.turns`, 'utf8')).toBe('8');
  });

  it('子のモデルは役割の1番目で、1回で終わる', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    const argsFile = join(bin, 'args.txt');
    placeWrapper(bin, argsFile, join(bin, 'stdin.txt'));
    await runOpinion({ cwd: dir, env: fakeEnv(bin, 'Consistent: yes') }, heldOf('hi'), {});
    const args = readFileSync(argsFile, 'utf8').split('\n');
    expect(args[args.indexOf('--model') + 1]).toBe('opencode-go/deepseek-v4.1-flash:high');
    expect(readFileSync(`${argsFile}.calls`, 'utf8')).toBe('x');
  });
});
