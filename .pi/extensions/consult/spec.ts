/**
 * consult が起動する子 pi の組み立てと、子が返す JSONL の解釈。
 *
 * IO を持たない純粋な部分だけを置く。プロセスの起動は run.ts、道具としての入口は index.ts が持つ。
 *
 * 走り方は type が決める（types.ts）。ここは policy を引数に変えるだけで、選び直す口は無い。費用の歯止め（上限）も type が持つ。
 */

import type { Limits, TypePolicy } from './types.ts';

/**
 * 隔離が要るか。type の `environment` が決める。
 *
 * ツールから推測しない。試すための type は、書き込むツールを持っていても実ツリーを汚してよいわけではない。逆に書き込むツールを持たない type でも隔離したいことはある。決めるのは 1 箇所だけにする。
 */
export function needsIsolation(policy: TypePolicy): boolean {
  return policy.environment === 'worktree';
}

export interface ConsultOptions {
  /** 選んだ type の名前。診断に使う */
  readonly type: string;
  readonly task: string;
  readonly policy: TypePolicy;
}

/**
 * 子に渡す引数を組み立てる。
 *
 * モデルは候補の 1 番目だけを渡す。候補を順に試すのは run.ts の仕事で、ここは「1 回どう走らせるか」だけを決める。空なら渡さない（親と同じになる）。
 */
export function buildPiArgs(options: ConsultOptions): string[] {
  const { policy } = options;
  const args = ['--mode', 'json', '-p', '--no-session'];
  const model = policy.models[0];
  if (model !== undefined) {
    args.push('--model', model);
  }
  if (policy.role !== undefined && policy.role !== '') {
    // 追記なので、既定のツール説明を壊さない。
    args.push('--append-system-prompt', policy.role);
  }
  args.push('--tools', policy.tools.join(','));
  // プロジェクトの設定・拡張を読まない。読むと、リポジトリ側が子の設定を変えられる。
  args.push('--no-approve');
  args.push(options.task);
  return args;
}

/** JSONL の各行をイベントにする。壊れた行は捨てる */
export function parseEvents(text: string): unknown[] {
  const events: unknown[] = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      continue;
    }
    try {
      events.push(JSON.parse(line));
    } catch {
      // 解析できない行はイベントではない。
    }
  }
  return events;
}

interface AssistantMessage {
  role?: string;
  content?: { type?: string; text?: string }[];
  usage?: { input?: number; output?: number; cost?: { total?: number } };
  provider?: string;
  model?: string;
  errorMessage?: string;
}

interface JsonlEvent {
  type?: string;
  message?: AssistantMessage;
}

function asEvent(event: unknown): JsonlEvent {
  return typeof event === 'object' && event !== null ? event : {};
}

/** 最後の assistant メッセージのテキスト */
export function finalTextFrom(events: unknown[]): string {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = asEvent(events[i]);
    if (event.type !== 'message_end' || event.message?.role !== 'assistant') {
      continue;
    }
    const text = (event.message.content ?? [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join('');
    if (text !== '') {
      return text;
    }
  }
  return '';
}

/**
 * 子がモデルから何かを生成したか。乗り換えの判定に使う。
 *
 * assistant の `message_end` があっても、モデルが動いたとは限らない。存在しないモデル ID では pi が警告を出して API が失敗し、出力 0 のまま exit 0 で終わる。生成が 0 なら、そのモデルは動いていない。
 */
export function ranFrom(events: unknown[]): boolean {
  return usageFrom(events).output > 0;
}

/**
 * 子が実際に使ったモデル。子の報告が唯一の事実で、呼び出し元の環境に依存しない。診断に出すのは「何が動いたか」を知るためで、指定するためではない。
 */
export function modelFrom(events: unknown[]): string | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = asEvent(events[i]);
    const message = event.message;
    if (event.type === 'message_end' && message?.role === 'assistant' && message.model) {
      return message.provider ? `${message.provider}/${message.model}` : message.model;
    }
  }
  return undefined;
}

export interface Usage {
  turns: number;
  input: number;
  output: number;
  cost: number;
}

/** 消費量。診断に使う */
export function usageFrom(events: unknown[]): Usage {
  const total = { turns: 0, input: 0, output: 0, cost: 0 };
  for (const event of events) {
    const { type, message } = asEvent(event);
    if (type !== 'message_end' || message?.role !== 'assistant') {
      continue;
    }
    total.turns += 1;
    total.input += message.usage?.input ?? 0;
    total.output += message.usage?.output ?? 0;
    total.cost += message.usage?.cost?.total ?? 0;
  }
  return total;
}

/** 子が異常終了した理由。エラーイベントが残っていれば拾う */
export function errorFrom(events: unknown[]): string {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const message = asEvent(events[i]).message;
    if (message?.role === 'assistant' && message.errorMessage) {
      return message.errorMessage;
    }
  }
  return '';
}

export interface Spent {
  turns: number;
  output: number;
}

/**
 * 1 イベント分を数える。上限を超えたら理由を返す（超えていなければ undefined）。
 *
 * 走りながら呼ぶ。message_end が届いた時点で usage は入っている。終わってから数えても、使った後では遅い。
 */
export function accountEvent(spent: Spent, event: unknown, limits: Limits): string | undefined {
  const { type, message } = asEvent(event);
  if (type !== 'message_end' || message?.role !== 'assistant') {
    return undefined;
  }
  spent.turns += 1;
  spent.output += message.usage?.output ?? 0;
  if (spent.turns > limits.turns) {
    return `turn limit reached (${limits.turns})`;
  }
  if (spent.output > limits.output) {
    return `output token limit reached (${limits.output})`;
  }
  return undefined;
}
