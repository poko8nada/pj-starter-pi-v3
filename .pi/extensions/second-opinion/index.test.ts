import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { DEFAULT_QUESTION } from './tool/answer.ts';
import { type RunResult } from './run/run.ts';
import { ownerMessage, recordMessage, type AgentMessage, type Held } from './tool/conversation.ts';
import { loadTypes, resolveType } from './policy/types.ts';
import extensionDefault, {
  bodyOf,
  collectMessage,
  formatBody,
  parseCommandArgs,
  runOpinion,
  toRequest,
  TOOL_NAME,
} from './index.ts';

// 子を走らせない分だけを試す（文字列の組み立て）。子の起動は Slice 4 の統合で扱う。

describe('toRequest', () => {
  it('既定の質問と件数 20（何も渡さない）', () => {
    expect(toRequest({})).toEqual({});
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
  const messages = texts.map((text, index): AgentMessage => ({
    role: 'user',
    content: text,
    timestamp: index,
  }));
  return {
    messages,
    seen: new Set(messages.map((message) => `${message.role}:${String(message.timestamp)}`)),
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
      { messages: [], seen: new Set() },
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
    const held: Held = { messages: [], seen: new Set() };
    collectMessage(held, { role: 'user', content: 'hi', timestamp: 1 });
    expect(held.messages).toHaveLength(0);
  });

  it('agent 側は貯める', () => {
    const held: Held = { messages: [], seen: new Set() };
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
    const held: Held = { messages: [], seen: new Set() };
    recordMessage(held, ownerMessage('do this', 7));
    expect(held.messages).toEqual([{ role: 'user', content: 'do this', timestamp: 7 }]);
  });
});

/** 終わった子の結果。`ended` だけを変えて終わり方を作る */
function ended(extra: Partial<RunResult> = {}): RunResult {
  return { stdout: '', stderr: '', code: 0, aborted: false, ended: false, ...extra };
}

/** 本文つきの子の stdout を組む */
function stdoutOf(text: string): string {
  return `{"type":"message_end","message":{"role":"assistant","content":[{"type":"text","text":"${text}"}],"usage":{"output":1}}}\n`;
}

describe('bodyOf', () => {
  it('終わり切らなければ投げる', () => {
    expect(() => bodyOf(ended({ code: 1, stderr: 'boom' }))).toThrow(/did not finish.*boom/);
  });

  it('生成 0 のまま done の空本文はそのまま返す', () => {
    expect(bodyOf(ended({ ended: true }))).toEqual({ text: '' });
  });

  it('本文があればそのまま返す', () => {
    const stdout =
      '{"type":"message_end","message":{"role":"assistant","content":[{"type":"text","text":"hi"}],"usage":{"output":1}}}\n';
    expect(bodyOf(ended({ stdout, ended: true }))).toEqual({ text: 'hi' });
  });
});

describe('bodyOf: 打ち切られても最後の本文', () => {
  it('ended で本文あり → cut なし', () => {
    expect(bodyOf(ended({ stdout: stdoutOf('hi'), ended: true }))).toEqual({ text: 'hi' });
  });

  it('stopped で本文あり → cut に理由が入る', () => {
    expect(bodyOf(ended({ stdout: stdoutOf('hi'), stopped: 'turn limit reached (20)' }))).toEqual({
      text: 'hi',
      cut: 'turn limit reached (20)',
    });
  });

  it('aborted で本文あり → cut は親が止めた旨', () => {
    expect(bodyOf(ended({ stdout: stdoutOf('hi'), aborted: true }))).toEqual({
      text: 'hi',
      cut: 'stopped by the parent',
    });
  });

  it('code 1 で本文あり → cut は stderr の1行目', () => {
    expect(bodyOf(ended({ stdout: stdoutOf('hi'), code: 1, stderr: 'boom' }))).toEqual({
      text: 'hi',
      cut: 'boom',
    });
  });

  it('本文が空で ended → 空のまま返す', () => {
    expect(bodyOf(ended({ ended: true }))).toEqual({ text: '' });
  });

  it('本文が空で stopped → 投げる', () => {
    expect(() => bodyOf(ended({ stopped: 'turn limit reached (20)' }))).toThrow(
      /did not finish.*turn limit reached \(20\)/,
    );
  });

  it('本文が空で aborted → 投げる', () => {
    expect(() => bodyOf(ended({ aborted: true }))).toThrow(/did not finish.*stopped by the parent/);
  });

  it('本文が空で code 1 → 投げる', () => {
    expect(() => bodyOf(ended({ code: 1, stderr: 'boom' }))).toThrow(/did not finish.*boom/);
  });
});

describe('formatBody: 打ち切りの注', () => {
  it('cut が無ければそのまま', () => {
    expect(formatBody({ text: 'hi' })).toBe('hi');
  });

  it('cut があれば本文の後ろに注を添える', () => {
    const body = bodyOf(ended({ stdout: stdoutOf('hi'), stopped: 'turn limit reached (20)' }));
    expect(formatBody(body).endsWith('(打ち切られました: turn limit reached (20))')).toBe(true);
  });
});

describe('runOpinion: 打ち切りの注', () => {
  it('exit の子 → 注なしで本文だけ返す', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    placeWrapper(bin, join(bin, 'args.txt'), join(bin, 'stdin.txt'));
    const body = await runOpinion({ cwd: dir, env: fakeEnv(bin, 'cut-free') }, heldOf('hi'), {});
    expect(body).toBe('cut-free');
    expect(body).not.toContain('打ち切られました');
  });

  it('cut 付きの子 → 返る本文が注で終わる', async () => {
    const body = bodyOf(ended({ stdout: stdoutOf('hi'), stopped: 'turn limit reached (20)' }));
    expect(formatBody(body).endsWith('(打ち切られました: turn limit reached (20))')).toBe(true);
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

describe('runOpinion: 子への env', () => {
  it('子に役割の許可と上限を渡す', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    const argsFile = join(bin, 'args.txt');
    placeWrapper(bin, argsFile, join(bin, 'stdin.txt'));
    await runOpinion({ cwd: dir, env: fakeEnv(bin, 'Consistent: yes') }, heldOf('hi'), {});
    expect(readFileSync(`${argsFile}.policy`, 'utf8')).toBe(
      JSON.stringify({ paths: [], bash: [] }),
    );
    expect(readFileSync(`${argsFile}.turns`, 'utf8')).toBe('20');
  });
});

describe('runOpinion: 子へのモデル', () => {
  it('役割の1番目のモデルを --model に渡す', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    const argsFile = join(bin, 'args.txt');
    placeWrapper(bin, argsFile, join(bin, 'stdin.txt'));
    await runOpinion({ cwd: dir, env: fakeEnv(bin, 'Consistent: yes') }, heldOf('hi'), {});
    const args = readFileSync(argsFile, 'utf8').split('\n');
    const role = resolveType(
      loadTypes(join(process.cwd(), '.pi/extensions/second-opinion')),
      'opinion',
    );
    expect(args[args.indexOf('--model') + 1]).toBe(role.models[0]);
  });
});

describe('registration: 道具とコマンドの名前', () => {
  it('TOOL_NAME は second_opinion', () => {
    expect(TOOL_NAME).toBe('second_opinion');
  });

  it('registerTool と registerCommand に second_opinion を渡す', () => {
    let toolName: string | undefined;
    let commandName: string | undefined;
    const pi = {
      registerTool: (tool: { name: string }) => {
        toolName = tool.name;
      },
      registerCommand: (name: string) => {
        commandName = name;
      },
      on: () => {},
      sendMessage: () => {},
    };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 偽 pi の登録だけを試すための、意図的な狭い形
    extensionDefault(pi as never);
    expect(toolName).toBe('second_opinion');
    expect(commandName).toBe('second_opinion');
  });

  it('コマンドの description が second_opinion を指す', () => {
    let commandDescription = '';
    const pi = {
      registerTool: () => {},
      registerCommand: (_name: string, command: { description: string }) => {
        commandDescription = command.description;
      },
      on: () => {},
      sendMessage: () => {},
    };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 偽 pi の登録だけを試すための、意図的な狭い形
    extensionDefault(pi as never);
    expect(commandDescription).toContain('second_opinion');
  });
});

describe('context: reload をまたいでも会話を材料にする', () => {
  it('偽 pi の context を起こす → その会話で子の窓が埋まる', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    const stdinFile = join(bin, 'stdin.txt');
    placeWrapper(bin, join(bin, 'args.txt'), stdinFile);
    const savedPath = process.env.PATH;
    const savedMode = process.env.FAKE_PI_MODE;
    const savedText = process.env.FAKE_PI_TEXT;
    try {
      process.env.PATH = `${bin}:${savedPath ?? ''}`;
      process.env.FAKE_PI_MODE = 'exit';
      process.env.FAKE_PI_TEXT = 'Consistent: yes';
      const handlers = new Map<string, (event: { messages: AgentMessage[] }) => void>();
      type ExecuteFn = (
        ...args: [
          toolCallId: string,
          params: Record<string, unknown>,
          signal: AbortSignal | undefined,
          onUpdate: (() => void) | undefined,
          ctx: { cwd: string },
        ]
      ) => Promise<{ content: { type: string; text: string }[] }>;
      let execute: ExecuteFn | undefined;
      const pi = {
        registerTool: (tool: { execute: ExecuteFn }) => {
          execute = tool.execute;
        },
        registerCommand: () => {},
        on: (event: string, handler: (event: { messages: AgentMessage[] }) => void) => {
          handlers.set(event, handler);
        },
        sendMessage: () => {},
      };
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 偽 pi の context だけを試すための、意図的な狭い形
      extensionDefault(pi as never);
      const onContext = handlers.get('context');
      expect(onContext).toBeDefined();
      onContext?.({ messages: [ownerMessage('reload-kept', 5)] });
      if (execute === undefined) {
        throw new Error('execute was not registered');
      }
      const result = await execute('id', {}, undefined, undefined, { cwd: dir });
      expect(readFileSync(stdinFile, 'utf8')).toContain('reload-kept');
      expect(result.content[0]?.text).toBe('Consistent: yes');
    } finally {
      if (savedPath === undefined) {
        delete process.env.PATH;
      } else {
        process.env.PATH = savedPath;
      }
      if (savedMode === undefined) {
        delete process.env.FAKE_PI_MODE;
      } else {
        process.env.FAKE_PI_MODE = savedMode;
      }
      if (savedText === undefined) {
        delete process.env.FAKE_PI_TEXT;
      } else {
        process.env.FAKE_PI_TEXT = savedText;
      }
    }
  });
});

describe('runOpinion: 進行の通知', () => {
  it('子が起動できない → 例外を投げ、その前onProgressがちょうど1度呼ばれる', async () => {
    const dir = tmpDir();
    const emptyBin = tmpDir();
    const seen: string[] = [];
    await expect(
      runOpinion(
        { cwd: dir, env: { ...process.env, PATH: emptyBin } },
        heldOf('hi'),
        {},
        (text) => {
          seen.push(text);
        },
      ),
    ).rejects.toThrow();
    expect(seen).toHaveLength(1);
  });

  it('子の本文が届いたら、その本文がonProgressに来る', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    placeWrapper(bin, join(bin, 'args.txt'), join(bin, 'stdin.txt'));
    const seen: string[] = [];
    const body = await runOpinion(
      { cwd: dir, env: fakeEnv(bin, 'progress-body-here') },
      heldOf('hi'),
      {},
      (text) => {
        seen.push(text);
      },
    );
    expect(body).toBe('progress-body-here');
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen.join('\n')).toContain('progress-body-here');
  });

  it('onProgressを渡さない → 何も起きず今までどおり本文が返る', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    placeWrapper(bin, join(bin, 'args.txt'), join(bin, 'stdin.txt'));
    const body = await runOpinion({ cwd: dir, env: fakeEnv(bin, 'quiet-body') }, heldOf('hi'), {});
    expect(body).toBe('quiet-body');
  });

  it('executeのonUpdateを包んで渡す → 更新が届き本文が返る', async () => {
    const bin = tmpDir();
    const dir = tmpDir();
    placeWrapper(bin, join(bin, 'args.txt'), join(bin, 'stdin.txt'));
    const savedPath = process.env.PATH;
    const savedMode = process.env.FAKE_PI_MODE;
    const savedText = process.env.FAKE_PI_TEXT;
    try {
      process.env.PATH = `${bin}:${savedPath ?? ''}`;
      process.env.FAKE_PI_MODE = 'exit';
      process.env.FAKE_PI_TEXT = 'update-body';
      type ExecuteFn = (
        ...args: [
          toolCallId: string,
          params: Record<string, unknown>,
          signal: AbortSignal | undefined,
          onUpdate: (update: { content: { type: string; text: string }[] }) => void,
          ctx: { cwd: string },
        ]
      ) => Promise<{ content: { type: string; text: string }[] }>;
      let execute: ExecuteFn | undefined;
      const pi = {
        registerTool: (tool: { execute: ExecuteFn }) => {
          execute = tool.execute;
        },
        registerCommand: () => {},
        on: () => {},
        sendMessage: () => {},
      };
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 偽 pi の更新だけを試すための、意図的な狭い形
      extensionDefault(pi as never);
      if (execute === undefined) {
        throw new Error('execute was not registered');
      }
      const updates: string[] = [];
      const result = await execute(
        'id',
        {},
        undefined,
        (update) => {
          const first = update.content[0];
          if (first !== undefined) {
            updates.push(first.text);
          }
        },
        { cwd: dir },
      );
      expect(result.content[0]?.text).toBe('update-body');
      expect(updates.length).toBeGreaterThanOrEqual(1);
      expect(updates.join('\n')).toContain('update-body');
    } finally {
      if (savedPath === undefined) {
        delete process.env.PATH;
      } else {
        process.env.PATH = savedPath;
      }
      if (savedMode === undefined) {
        delete process.env.FAKE_PI_MODE;
      } else {
        process.env.FAKE_PI_MODE = savedMode;
      }
      if (savedText === undefined) {
        delete process.env.FAKE_PI_TEXT;
      } else {
        process.env.FAKE_PI_TEXT = savedText;
      }
    }
  });
});
