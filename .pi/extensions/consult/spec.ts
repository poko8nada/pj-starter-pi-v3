/**
 * consult が起動する子 pi の組み立てと、子が返す JSONL の解釈。
 *
 * IO を持たない純粋な部分だけを置く。プロセスの起動は run.ts、
 * 道具としての入口は index.ts が持つ。
 */

/** 子に渡す既定のツール。読み取り専用なので実ツリーを汚せない */
export const READ_ONLY_TOOLS = 'read,ls,find,grep';

/** これを含むツール指定なら worktree に入れる */
export const WRITING_TOOLS = new Set(['bash', 'edit', 'write', 'powershell']);

/**
 * 1 回の実行で使える出力トークンの上限。変更できない。
 *
 * 費用の歯止めは呼び出し元が外せてはいけない。範囲の広いタスクを無制限に
 * 走らせて出力 87,876 トークンを消費したことがある（通常は 4,000〜16,000）。
 */
export const MAX_OUTPUT_TOKENS = 30_000;

/** ターン数の上限。走り続ける子を止める */
export const MAX_TURNS = 30;

export interface ConsultOptions {
  readonly task: string;
  readonly role?: string;
  readonly input?: string;
  readonly tools: string;
  readonly worktree: boolean;
}

/** ツール指定に書き込み可能なものを含むか */
export function includesWritingTool(tools: string): boolean {
  return tools
    .split(',')
    .map((name) => name.trim())
    .some((name) => WRITING_TOOLS.has(name));
}

/**
 * 子に渡す引数を組み立てる。
 * モデルは渡さない。子が呼び出し元と同じ設定で動くのが正しく、
 * モデルを選べる口があると、高いモデルの費用がアカウント所有者に落ちる。
 */
export function buildPiArgs(options: ConsultOptions): string[] {
  const args = ['--mode', 'json', '-p', '--no-session'];
  if (options.role !== undefined && options.role !== '') {
    // 追記なので、既定のツール説明を壊さない。
    args.push('--append-system-prompt', options.role);
  }
  if (options.tools !== '') {
    args.push('--tools', options.tools);
  }
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
 * 子が実際に使ったモデル。子の報告が唯一の事実で、呼び出し元の環境に依存しない。
 * 診断に出すのは「何が動いたか」を知るためで、指定するためではない。
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
 * 走りながら呼ぶ。message_end が届いた時点で usage は入っている。
 * 終わってから数えても、使った後では遅い。
 */
export function accountEvent(spent: Spent, event: unknown): string | undefined {
  const { type, message } = asEvent(event);
  if (type !== 'message_end' || message?.role !== 'assistant') {
    return undefined;
  }
  spent.turns += 1;
  spent.output += message.usage?.output ?? 0;
  if (spent.turns > MAX_TURNS) {
    return `turn limit reached (${MAX_TURNS})`;
  }
  if (spent.output > MAX_OUTPUT_TOKENS) {
    return `output token limit reached (${MAX_OUTPUT_TOKENS})`;
  }
  return undefined;
}
