import { describe, expect, it } from 'vitest';
import {
  accountEvent,
  buildPiArgs,
  errorFrom,
  finalTextFrom,
  modelFrom,
  needsIsolation,
  parseEvents,
  ranFrom,
  usageFrom,
  type ConsultOptions,
  type Spent,
} from './spec.ts';
import type { TypePolicy } from '../policy/types.ts';
import { aConsultOptions, aTypePolicy } from '../consult.fixture.ts';

// 純粋な部分だけを試す。サブエージェントの起動と worktree は実際の pi とリポジトリが要るので扱わない。

/** 上限は type が決める。ここでは「効くか」を見る（数字そのものは設定の話） */
const LIMITS = aTypePolicy().limits;

function policy(overrides: Partial<TypePolicy> = {}): TypePolicy {
  return aTypePolicy(overrides);
}

function options(overrides: Partial<ConsultOptions> = {}): ConsultOptions {
  return aConsultOptions(overrides);
}

describe('buildPiArgs: subagent-guard', () => {
  it('-e で subagent-guard をサブエージェントに渡し、--tools の後ろに置く', () => {
    const args = buildPiArgs(options());
    const index = args.indexOf('--extension');
    expect(index).toBeGreaterThan(args.indexOf('--tools'));
    expect(args[index + 1]?.endsWith('guard.ts')).toBe(true);
  });

  it('subagent-guard のパスは空でない絶対パス', () => {
    const args = buildPiArgs(options());
    const path = args[args.indexOf('--extension') + 1] ?? '';
    expect(path.startsWith('/')).toBe(true);
    expect(path.length).toBeGreaterThan('/subagent-guard.ts'.length);
  });

  it('-e は guard と budget の 2 回（順に guard・budget の絶対パス）', () => {
    const args = buildPiArgs(options());
    const indexes = args.flatMap((arg, i) => (arg === '--extension' ? [i] : []));
    expect(indexes).toHaveLength(2);
    const guardPath = args[(indexes[0] ?? 0) + 1] ?? '';
    const budgetPath = args[(indexes[1] ?? 0) + 1] ?? '';
    expect(guardPath.startsWith('/')).toBe(true);
    expect(guardPath.endsWith('guard.ts')).toBe(true);
    expect(budgetPath.startsWith('/')).toBe(true);
    expect(budgetPath.endsWith('budget.ts')).toBe(true);
  });

  it('--tools が空配列でも -e の位置が崩れない', () => {
    const args = buildPiArgs(options({ policy: policy({ tools: [] }) }));
    expect(args.indexOf('--extension')).toBeGreaterThan(args.indexOf('--tools'));
  });

  it('パスは機械に依らない形で組まれる（このファイルの隣）', () => {
    const args = buildPiArgs(options());
    expect(args[args.indexOf('--extension') + 1]?.includes('/.pi/extensions/consult/')).toBe(true);
  });
});
describe('buildPiArgs', () => {
  it('ヘッドレスで 1 回だけ走る形にする', () => {
    const token = 'token-1';
    const args = buildPiArgs(options({ token }));
    expect(args.slice(0, 5)).toEqual(['--mode', 'json', '-p', '--name', token]);
    expect(args).toContain('--no-session');
  });

  it('既定でプロジェクトの設定・拡張を読まない', () => {
    expect(buildPiArgs(options())).toContain('--no-approve');
  });

  it('`--model` に候補 1 番目を入れる', () => {
    const model = 'a/1:high';
    const args = buildPiArgs(options({ policy: policy({ models: [model, 'b/2'] }) }));
    const index = args.indexOf('--model');
    expect(args[index + 1]).toBe(model);
  });

  it('候補が空ならモデルを渡さない（メインエージェントと同じ設定で走る）', () => {
    expect(buildPiArgs(options())).not.toContain('--model');
  });

  it('type のツールを渡す', () => {
    const tools = ['read', 'grep'];
    const args = buildPiArgs(options({ policy: policy({ tools }) }));
    const index = args.indexOf('--tools');
    expect(args[index + 1]).toBe(tools.join(','));
  });

  it('役割をシステムプロンプトへの追記で渡す（ファイル探索はしない）', () => {
    const role = 'あなたは査読者です';
    const args = buildPiArgs(options({ policy: policy({ role }) }));
    const index = args.indexOf('--append-system-prompt');
    expect(index).toBeGreaterThan(-1);
    expect(args[index + 1]).toBe(role);
  });

  it('役割が空なら追記しない', () => {
    expect(buildPiArgs(options({ policy: policy({ role: '' }) }))).not.toContain(
      '--append-system-prompt',
    );
  });

  it('task: 指示は引数に載らない', () => {
    const task = '調べる';
    const args = buildPiArgs(options({ task }));
    expect(args).not.toContain(task);
    expect(args).not.toContain('--');
  });
});

describe('needsIsolation', () => {
  it('`isolated` が真 → 隔離する', () => {
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
    const event = messageEnd({ content: [{ type: 'text', text: 'hi' }] });
    expect(finalTextFrom([event])).toBe('hi');
  });

  it('text 以外のパート（toolcall など）は無視する', () => {
    const event = messageEnd({
      content: [{ type: 'toolcall', name: 'read', text: 'SHOULD-NOT-APPEAR' }],
    });
    expect(finalTextFrom([event])).toBe('');
  });

  it('複数の text パートを連結する', () => {
    const first = 'a';
    const second = 'b';
    const event = messageEnd({
      content: [
        { type: 'text', text: first },
        { type: 'text', text: second },
      ],
    });
    expect(finalTextFrom([event])).toBe(first + second);
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
  it('サブエージェントが報告した provider と model を組み立てる', () => {
    const provider = 'p';
    const model = 'm';
    const event = messageEnd({ provider, model });
    expect(modelFrom([event])).toBe(`${provider}/${model}`);
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
    const input = 10;
    const output = 5;
    const total = 0.001;
    const event = messageEnd({ usage: { input, output, cost: { total } } });
    expect(usageFrom([event, event])).toEqual({
      turns: 2,
      input: input * 2,
      output: output * 2,
      cost: total * 2,
    });
  });
});

describe('errorFrom', () => {
  it('errorMessage があれば返す', () => {
    const reason = 'rate limited';
    const event = messageEnd({ errorMessage: reason });
    expect(errorFrom([event])).toBe(reason);
  });
});

// 上限は走りながら判定する。終わってから数えても、使った後では遅い。
const turn = (output: number) => messageEnd({ usage: { output } });

describe('accountEvent', () => {
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
    const sessionPath = '/tmp/s';
    const args = buildPiArgs(options({ sessionPath }));
    expect(args).toContain('--session');
    expect(args[args.indexOf('--session') + 1]).toBe(sessionPath);
    expect(args).not.toContain('--no-session');
  });
});

describe('buildPiArgs: token', () => {
  it('token と --session あり → argv に --name <token> と --session が両方ある', () => {
    const token = 'token-abc';
    const sessionPath = '/tmp/s';
    const args = buildPiArgs(options({ token, sessionPath }));
    const nameIndex = args.indexOf('--name');
    expect(nameIndex).toBeGreaterThan(-1);
    expect(args[nameIndex + 1]).toBe(token);
    expect(args).toContain('--session');
    expect(args[args.indexOf('--session') + 1]).toBe(sessionPath);
  });

  it('--no-session の子 → argv に --name <token> がある', () => {
    const token = 'token-xyz';
    const args = buildPiArgs(options({ token }));
    const nameIndex = args.indexOf('--name');
    expect(nameIndex).toBeGreaterThan(-1);
    expect(args[nameIndex + 1]).toBe(token);
    expect(args).toContain('--no-session');
  });
});

describe('finalTextFrom: 複数イベント', () => {
  it('最後が空なら、前のイベントの本文を返す', () => {
    const text = 'hi';
    expect(finalTextFrom([messageEnd(), messageEnd({ content: [] })])).toBe(text);
  });
});
