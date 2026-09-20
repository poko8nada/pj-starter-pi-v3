import { describe, expect, it } from 'vitest';
import {
  accountEvent,
  buildPiArgs,
  errorFrom,
  finalTextFrom,
  includesWritingTool,
  MAX_OUTPUT_TOKENS,
  MAX_TURNS,
  modelFrom,
  parseEvents,
  READ_ONLY_TOOLS,
  usageFrom,
  type ConsultOptions,
  type Spent,
} from './spec.ts';

// 純粋な部分だけを試す。子の起動と worktree は実際の pi とリポジトリが要るので扱わない。

function options(overrides: Partial<ConsultOptions> = {}): ConsultOptions {
  return {
    task: '調べる',
    tools: READ_ONLY_TOOLS,
    worktree: false,
    ...overrides,
  };
}

describe('buildPiArgs', () => {
  it('ヘッドレスで 1 回だけ走る形にする', () => {
    const args = buildPiArgs(options());
    expect(args.slice(0, 4)).toEqual(['--mode', 'json', '-p', '--no-session']);
  });

  it('既定でプロジェクトの設定・拡張を読まない', () => {
    expect(buildPiArgs(options())).toContain('--no-approve');
  });

  it('モデルは渡さない（呼び出し元と同じ設定で動かす）', () => {
    expect(buildPiArgs(options())).not.toContain('--model');
  });

  it('ロールはシステムプロンプトへの追記で渡す（ファイル探索はしない）', () => {
    const args = buildPiArgs(options({ role: 'あなたは査読者です' }));
    const index = args.indexOf('--append-system-prompt');
    expect(index).toBeGreaterThan(-1);
    expect(args[index + 1]).toBe('あなたは査読者です');
  });

  it('ロールが空なら追記しない', () => {
    expect(buildPiArgs(options({ role: '' }))).not.toContain('--append-system-prompt');
  });

  it('ツールを渡す', () => {
    const args = buildPiArgs(options({ tools: 'read,bash' }));
    const index = args.indexOf('--tools');
    expect(args[index + 1]).toBe('read,bash');
  });

  it('ツールが空なら渡さない', () => {
    expect(buildPiArgs(options({ tools: '' }))).not.toContain('--tools');
  });

  it('指示は最後に置く（フラグとして解釈させない）', () => {
    expect(buildPiArgs(options({ task: '調べる' })).at(-1)).toBe('調べる');
  });
});

describe('includesWritingTool', () => {
  it('書き込み可能なツールを検出する', () => {
    for (const tools of ['bash', 'read,bash', 'edit', 'write', 'powershell']) {
      expect(includesWritingTool(tools), tools).toBe(true);
    }
  });

  it('読み取り専用は false', () => {
    expect(includesWritingTool(READ_ONLY_TOOLS)).toBe(false);
    expect(includesWritingTool('read')).toBe(false);
  });
});

describe('parseEvents', () => {
  it('各行をイベントにする', () => {
    const events = parseEvents('{"type":"a"}\n{"type":"b"}\n');
    expect(events).toHaveLength(2);
  });

  it('空行を無視する', () => {
    expect(parseEvents('\n\n{"type":"a"}\n\n')).toHaveLength(1);
  });

  it('JSON でない行は捨てる（進捗行などが混ざりうる）', () => {
    expect(parseEvents('not json\n{"type":"a"}\n')).toHaveLength(1);
  });
});

/** assistant の message_end を 1 つ作る */
function messageEnd(overrides: Record<string, unknown> = {}) {
  return {
    type: 'message_end',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: 'hi' }],
      provider: 'p',
      model: 'm',
      usage: { input: 10, output: 5, cost: { total: 0.001 } },
      ...overrides,
    },
  };
}

describe('finalTextFrom', () => {
  it('最後の assistant のテキストを返す', () => {
    expect(finalTextFrom([messageEnd()])).toBe('hi');
  });

  it('text 以外のパート（toolcall など）は無視する', () => {
    const event = messageEnd({ content: [{ type: 'toolcall', name: 'read' }] });
    expect(finalTextFrom([event])).toBe('');
  });

  it('複数の text パートを連結する', () => {
    const event = messageEnd({
      content: [
        { type: 'text', text: 'a' },
        { type: 'text', text: 'b' },
      ],
    });
    expect(finalTextFrom([event])).toBe('ab');
  });

  it('user のメッセージは拾わない', () => {
    const event = {
      type: 'message_end',
      message: { role: 'user', content: [{ type: 'text', text: 'x' }] },
    };
    expect(finalTextFrom([event])).toBe('');
  });

  it('イベントが無ければ空文字', () => {
    expect(finalTextFrom([])).toBe('');
  });
});

describe('modelFrom', () => {
  it('子が報告した provider と model を組み立てる', () => {
    expect(modelFrom([messageEnd()])).toBe('p/m');
  });

  it('報告が無ければ undefined（推測しない）', () => {
    expect(modelFrom([])).toBeUndefined();
    expect(modelFrom([{ type: 'message_end', message: { role: 'user' } }])).toBeUndefined();
  });
});

describe('usageFrom', () => {
  it('assistant のターン数と消費を合計する', () => {
    const usage = usageFrom([messageEnd(), messageEnd()]);
    expect(usage).toEqual({ turns: 2, input: 20, output: 10, cost: 0.002 });
  });

  it('usage が無いイベントでも落ちない', () => {
    const event = { type: 'message_end', message: { role: 'assistant' } };
    expect(usageFrom([event])).toEqual({ turns: 1, input: 0, output: 0, cost: 0 });
  });
});

describe('errorFrom', () => {
  it('errorMessage があれば返す', () => {
    const event = messageEnd({ errorMessage: 'rate limited' });
    expect(errorFrom([event])).toBe('rate limited');
  });

  it('無ければ空文字', () => {
    expect(errorFrom([messageEnd()])).toBe('');
  });
});

describe('accountEvent', () => {
  // 上限は走りながら判定する。終わってから数えても、使った後では遅い。
  const turn = (output: number) => messageEnd({ usage: { output } });

  it('assistant 以外は数えない', () => {
    const spent: Spent = { turns: 0, output: 0 };
    expect(accountEvent(spent, { type: 'message_end', message: { role: 'user' } })).toBeUndefined();
    expect(accountEvent(spent, { type: 'turn_start' })).toBeUndefined();
    expect(spent.turns).toBe(0);
  });

  it('ターンと出力トークンを積む', () => {
    const spent: Spent = { turns: 0, output: 0 };
    accountEvent(spent, turn(100));
    accountEvent(spent, turn(200));
    expect(spent).toEqual({ turns: 2, output: 300 });
  });

  it('上限内では止めない', () => {
    expect(accountEvent({ turns: 0, output: 0 }, turn(1000))).toBeUndefined();
  });

  it('ターン数の上限を超えたら理由を返す', () => {
    const spent: Spent = { turns: MAX_TURNS, output: 0 };
    expect(accountEvent(spent, turn(1))).toMatch(/turn limit/);
  });

  it('出力トークンの上限を超えたら理由を返す', () => {
    const spent: Spent = { turns: 0, output: MAX_OUTPUT_TOKENS - 500 };
    expect(accountEvent(spent, turn(1000))).toMatch(/output token limit/);
  });

  it('ちょうど上限までは許し、1 を超えたら止める', () => {
    const spent: Spent = { turns: 0, output: MAX_OUTPUT_TOKENS - 500 };
    expect(accountEvent(spent, turn(500))).toBeUndefined();
    expect(accountEvent(spent, turn(1))).toMatch(/output token limit/);
  });
});
