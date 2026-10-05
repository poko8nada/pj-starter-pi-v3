import { describe, expect, it } from 'vitest';
import {
  accountEvent,
  buildPiArgs,
  errorFrom,
  finalTextFrom,
  isBlank,
  joinPrompt,
  modelFrom,
  needsIsolation,
  parseEvents,
  ranFrom,
  usageFrom,
  type ConsultOptions,
  type Spent,
} from './spec.ts';
import type { TypePolicy } from '../policy/types.ts';

// 純粋な部分だけを試す。子の起動と worktree は実際の pi とリポジトリが要るので扱わない。

/** 上限は type が決める。ここでは「効くか」を見る（数字そのものは設定の話） */
const LIMITS = { turns: 20, output: 20000 };

function policy(overrides: Partial<TypePolicy> = {}): TypePolicy {
  return {
    name: 'review',
    models: [],
    tools: ['read', 'ls'],
    isolated: false,
    paths: [],
    bash: [],
    continueByDefault: false,
    limits: LIMITS,
    ...overrides,
  };
}

function options(overrides: Partial<ConsultOptions> = {}): ConsultOptions {
  return { type: 'review', task: '調べる', policy: policy(), ...overrides };
}

describe('isBlank', () => {
  it('空文字は空', () => {
    expect(isBlank('')).toBe(true);
  });

  it('文字が 1 つでもあれば空ではない', () => {
    expect(isBlank('a')).toBe(false);
  });
});

describe('joinPrompt', () => {
  it('payload を先頭に連結する（間に改行）', () => {
    expect(joinPrompt('PAYLOAD', 'TASK')).toBe('PAYLOAD\nTASK');
  });

  it('payload が無ければ task だけ', () => {
    expect(joinPrompt(undefined, 'TASK')).toBe('TASK');
  });
});

describe('buildPiArgs: child-guard', () => {
  it('-e で child-guard を子に渡し、--tools の後ろに置く', () => {
    const args = buildPiArgs(options());
    const index = args.indexOf('--extension');
    expect(index).toBeGreaterThan(args.indexOf('--tools'));
    expect(args[index + 1]?.endsWith('guard.ts')).toBe(true);
  });

  it('child-guard のパスは空でない絶対パス', () => {
    const args = buildPiArgs(options());
    const path = args[args.indexOf('--extension') + 1] ?? '';
    expect(path.startsWith('/')).toBe(true);
    expect(path.length).toBeGreaterThan('/child-guard.ts'.length);
  });

  it('-e は guard と budget の 2 回（子にだけ読ませる）', () => {
    expect(buildPiArgs(options()).filter((arg) => arg === '--extension')).toHaveLength(2);
  });

  it('--tools が空配列でも -e の位置が崩れない', () => {
    const args = buildPiArgs(options({ policy: policy({ tools: [] }) }));
    expect(args.indexOf('--extension')).toBeGreaterThan(args.indexOf('--tools'));
  });

  it('パスは機械に依らない形で組まれる（このファイルの隣）', () => {
    const args = buildPiArgs(options());
    expect(args[args.indexOf('--extension') + 1]?.includes('/.pi/extensions/second-opinion/')).toBe(
      true,
    );
  });
});
describe('buildPiArgs', () => {
  it('ヘッドレスで 1 回だけ走る形にする', () => {
    const args = buildPiArgs(options());
    expect(args.slice(0, 4)).toEqual(['--mode', 'json', '-p', '--no-session']);
  });

  it('既定でプロジェクトの設定・拡張を読まない', () => {
    expect(buildPiArgs(options())).toContain('--no-approve');
  });

  it('`--model` に候補 1 番目を入れる', () => {
    const args = buildPiArgs(options({ policy: policy({ models: ['a/1:high', 'b/2'] }) }));
    const index = args.indexOf('--model');
    expect(args[index + 1]).toBe('a/1:high');
  });

  it('候補が空ならモデルを渡さない（親と同じ設定で走る）', () => {
    expect(buildPiArgs(options())).not.toContain('--model');
  });

  it('type のツールを渡す', () => {
    const args = buildPiArgs(options({ policy: policy({ tools: ['read', 'grep'] }) }));
    const index = args.indexOf('--tools');
    expect(args[index + 1]).toBe('read,grep');
  });

  it('役割をシステムプロンプトへの追記で渡す（ファイル探索はしない）', () => {
    const args = buildPiArgs(options({ policy: policy({ role: 'あなたは査読者です' }) }));
    const index = args.indexOf('--append-system-prompt');
    expect(index).toBeGreaterThan(-1);
    expect(args[index + 1]).toBe('あなたは査読者です');
  });

  it('役割が空なら追記しない', () => {
    expect(buildPiArgs(options({ policy: policy({ role: '' }) }))).not.toContain(
      '--append-system-prompt',
    );
  });

  it('task: 調べる → 引数に指示が載らない（happy）', () => {
    const args = buildPiArgs(options({ task: '調べる' }));
    expect(args).not.toContain('調べる');
    expect(args).not.toContain('--');
  });

  it('task: 空 → 引数は同じ（happy、empty）', () => {
    expect(buildPiArgs(options({ task: '' }))).toEqual(buildPiArgs(options({ task: '調べる' })));
  });
});

describe('needsIsolation', () => {
  it('`isolated` が true → 隔離する', () => {
    expect(needsIsolation(policy({ isolated: true }))).toBe(true);
  });
});

describe('parseEvents', () => {
  it('各行をイベントにする', () => {
    const events = parseEvents('{"type":"a"}\n{"type":"b"}\n');
    expect(events).toHaveLength(2);
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
    const event = messageEnd({
      content: [{ type: 'toolcall', name: 'read', text: 'SHOULD-NOT-APPEAR' }],
    });
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
});

describe('ranFrom', () => {
  it('生成があれば true（モデルが動いた）', () => {
    expect(ranFrom([messageEnd()])).toBe(true);
  });

  it('生成が 0 / イベント無しなら false（モデルが動いていない）', () => {
    expect(ranFrom([])).toBe(false);
    const failed = messageEnd({ usage: { input: 0, output: 0 } });
    expect(ranFrom([failed])).toBe(false);
  });
});

describe('usageFrom', () => {
  it('assistant のターン数と消費を合計する', () => {
    const usage = usageFrom([messageEnd(), messageEnd()]);
    expect(usage).toEqual({ turns: 2, input: 20, output: 10, cost: 0.002 });
  });
});

describe('errorFrom', () => {
  it('errorMessage があれば返す', () => {
    const event = messageEnd({ errorMessage: 'rate limited' });
    expect(errorFrom([event])).toBe('rate limited');
  });
});

describe('accountEvent', () => {
  // 上限は走りながら判定する。終わってから数えても、使った後では遅い。
  const turn = (output: number) => messageEnd({ usage: { output } });

  it('assistant 以外は数えない', () => {
    const spent: Spent = { turns: 0, output: 0 };
    expect(
      accountEvent(spent, { type: 'message_end', message: { role: 'user' } }, LIMITS),
    ).toBeUndefined();
    expect(accountEvent(spent, { type: 'turn_start' }, LIMITS)).toBeUndefined();
    expect(spent.turns).toBe(0);
  });

  it('ターンと出力トークンを積む', () => {
    const spent: Spent = { turns: 0, output: 0 };
    accountEvent(spent, turn(100), LIMITS);
    accountEvent(spent, turn(200), LIMITS);
    expect(spent).toEqual({ turns: 2, output: 300 });
  });

  it('上限内では止めない', () => {
    expect(accountEvent({ turns: 0, output: 0 }, turn(1000), LIMITS)).toBeUndefined();
  });

  it('ターン数の上限を超えたら理由を返す', () => {
    const spent: Spent = { turns: LIMITS.turns, output: 0 };
    expect(accountEvent(spent, turn(1), LIMITS)).toMatch(/turn limit/);
  });

  it('出力トークンの上限を超えたら理由を返す', () => {
    const spent: Spent = { turns: 0, output: LIMITS.output - 500 };
    expect(accountEvent(spent, turn(1000), LIMITS)).toMatch(/output token limit/);
  });

  it('ちょうど上限までは許し、1 を超えたら止める', () => {
    const spent: Spent = { turns: 0, output: LIMITS.output - 500 };
    expect(accountEvent(spent, turn(500), LIMITS)).toBeUndefined();
    expect(accountEvent(spent, turn(1), LIMITS)).toMatch(/output token limit/);
  });

  it('type ごとの上限が効く（同じ消費でも狭い上限なら止まる）', () => {
    const narrow = { turns: 1, output: 100 };
    expect(accountEvent({ turns: 0, output: 0 }, turn(200), narrow)).toMatch(/output token limit/);
    expect(accountEvent({ turns: 0, output: 0 }, turn(200), LIMITS)).toBeUndefined();
  });
});

describe('buildPiArgs: sessionPath', () => {
  it('sessionPath あり → --session を指し、--no-session は付けない', () => {
    const args = buildPiArgs(options({ sessionPath: '/tmp/s' }));
    expect(args).toContain('--session');
    expect(args[args.indexOf('--session') + 1]).toBe('/tmp/s');
    expect(args).not.toContain('--no-session');
  });
});

describe('finalTextFrom: 複数イベント', () => {
  it('最後が空なら、前のイベントの本文を返す', () => {
    expect(finalTextFrom([messageEnd(), messageEnd({ content: [] })])).toBe('hi');
  });
});
