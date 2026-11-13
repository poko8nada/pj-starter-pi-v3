import { resolve } from 'node:path';
import type {
  AgentEndEvent,
  ExtensionAPI,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { runChecks, toRelative } from './gate/checks.ts';
import type { CheckRun } from './gate/report.ts';
import { buildGateMessage } from './gate/report.ts';
import { changedSince, snapshot } from './gate/targets.ts';

/**
 * 1 ターンで自動チェックをやり直せる回数の上限である。
 * 無限ループを避けるため、超えたらユーザーに報告して打ち切る。
 */
const MAX_ATTEMPTS = 3;

/** メッセージ内で使う識別子である。 */
const GATE_CUSTOM_TYPE = 'quality-gate';

/** チェック対象にする編集系ツールである。 */
const MUTATING_TOOLS = new Set(['edit', 'write']);

/** ターンをまたいで持ち越す状態である。 */
interface GateState {
  /** このランで edit と write が変更したファイルである（絶対パス）。git が使えないときの代替である。 */
  touched: Set<string>;
  /** ラン開始時点の指紋である。git が答えられない場合は undefined である。 */
  baseline: Map<string, string> | undefined;
  /** 自動チェックの連続失敗回数である。 */
  attempts: number;
  /** 直近で失敗したチェックの名前である。変更のないターンで警告するときに使う。 */
  lastFailed: string[];
  /** 上限まで失敗して打ち切ったかどうかである。ユーザーが話すまで動かさない。 */
  gaveUp: boolean;
  /** 実行中のガードである（agent_end の多重実行を防ぐ）。 */
  running: boolean;
}

function createState(): GateState {
  return {
    touched: new Set(),
    baseline: undefined,
    attempts: 0,
    lastFailed: [],
    gaveUp: false,
    running: false,
  };
}

/** 連続失敗の記録を消す。 */
function clearFailures(state: GateState): void {
  state.attempts = 0;
  state.lastFailed = [];
}

/** 打ち切り後、ユーザーが新しい用件を出したら再び動かす。 */
function rearm(state: GateState): void {
  clearFailures(state);
  state.gaveUp = false;
}

/** ツール呼び出しから対象ファイルパスを取り出す（edit と write はいずれも path を持つ）。 */
function extractPath(input: Record<string, unknown>): string | undefined {
  const path = input.path;
  return typeof path === 'string' && path !== '' ? path : undefined;
}

/** 例外を 1 行のメッセージに正規化する。 */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** event.messages の最後の assistant メッセージから stopReason を取り出す。 */
function lastStopReason(event: AgentEndEvent): string | undefined {
  for (let index = event.messages.length - 1; index >= 0; index -= 1) {
    const message = event.messages[index];
    if (
      typeof message === 'object' &&
      message !== null &&
      'role' in message &&
      message.role === 'assistant' &&
      'stopReason' in message &&
      typeof message.stopReason === 'string'
    ) {
      return message.stopReason;
    }
  }
  return undefined;
}

/**
 * 途中終了したランではゲートを動かさない。
 * stopReason の error と aborted はモデル側の失敗とユーザーの中断であり、
 * 修正指示を積んでも解決せず、エラーを繰り返すだけになる。
 */
function isInterrupted(event: AgentEndEvent): boolean {
  const stopReason = lastStopReason(event);
  return stopReason === 'error' || stopReason === 'aborted';
}

/** 失敗通知に必要な情報をまとめた入力である。 */
interface FailureInput {
  readonly pi: ExtensionAPI;
  readonly ctx: ExtensionContext;
  readonly state: GateState;
  readonly files: readonly string[];
  readonly run: CheckRun;
}

/** 失敗内容を LLM に followUp として渡し、修正ターンを起こす。 */
function reportFailure({ pi, ctx, state, files, run }: FailureInput): void {
  state.attempts += 1;
  const { outcomes, skipped } = run;
  state.lastFailed = outcomes.filter((outcome) => outcome.failed).map((outcome) => outcome.label);
  const isFinalAttempt = state.attempts >= MAX_ATTEMPTS;
  const toRel = (file: string) => toRelative(ctx.cwd, file);

  pi.sendMessage(
    {
      customType: GATE_CUSTOM_TYPE,
      content: buildGateMessage({
        outcomes,
        attempt: state.attempts,
        maxAttempts: MAX_ATTEMPTS,
        relativePaths: files.map(toRel),
        skippedPaths: skipped.map(toRel),
        isFinalAttempt,
      }),
      display: true,
      details: {
        attempt: state.attempts,
        maxAttempts: MAX_ATTEMPTS,
        failed: state.lastFailed,
      },
    },
    { triggerTurn: true, deliverAs: 'followUp' },
  );

  if (isFinalAttempt) {
    if (ctx.hasUI) {
      ctx.ui.notify(
        `quality-gate: still failing after ${MAX_ATTEMPTS} attempts (${state.lastFailed.join(', ')}). Stopping automatic retries.`,
        'error',
      );
    }
    // ここで打ち切る。attempts を消すだけでは、直後のターンで編集されたときに
    // 新しい予算でまた 3 回実行し、上限が上限として働かない。
    clearFailures(state);
    state.gaveUp = true;
  }
}

/** チェックを実行し、必要なら修正指示を送る。 */
async function runGate(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  state: GateState,
  files: readonly string[],
): Promise<void> {
  const run = await runChecks(pi, ctx, files);
  if (run.outcomes.every((outcome) => !outcome.failed)) {
    clearFailures(state);
    if (ctx.hasUI) {
      const labels = run.outcomes.map((outcome) => outcome.label).join(', ');
      ctx.ui.notify(`quality-gate: ${labels} passed`, 'info');
    }
    return;
  }

  reportFailure({ pi, ctx, state, files, run });
}

/**
 * そのランの間に変わったファイルを決める。
 * git の指紋が取れればそれを使い、取れなければ edit と write の記録に切り替わる。
 */
async function resolveTargets(
  pi: ExtensionAPI,
  cwd: string,
  state: GateState,
  edited: readonly string[],
): Promise<string[]> {
  // await の前に控える。待っている間に agent_start が来ても取り違えない。
  const before = state.baseline;
  const after = await snapshot(pi, cwd);
  // 待っている間に次のランが始まっていたら、そちらの基準を残す（早い方を持つ方が安全である）。
  if (state.baseline === before) {
    state.baseline = after;
  }

  const changed = before === undefined || after === undefined ? [] : changedSince(before, after);

  // 記録も混ぜる。ランの途中で commit や stash をされると差分から消えるためである。
  // 消えたパスは後段の prepareTargets が除外する。
  return [...new Set([...changed, ...edited])];
}

/** 失敗が残ったまま変更のないターンが終わったとき、一度だけ告げてループを閉じる。 */
function reportUnresolved(ctx: ExtensionContext, state: GateState): void {
  if (state.attempts === 0) {
    return;
  }
  if (ctx.hasUI) {
    ctx.ui.notify(
      `quality-gate: ${state.lastFailed.join(', ')} still failing, and this turn changed nothing. Stopping automatic retries.`,
      'error',
    );
  }
  clearFailures(state);
}

/** agent_end での 1 回分の処理である。 */
async function handleAgentEnd(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  state: GateState,
  event: AgentEndEvent,
): Promise<void> {
  if (state.running) {
    return;
  }

  // 記録はここで必ず捨てる。打ち切り中に溜めた分を再開後のターンに持ち越さない。
  const edited = [...state.touched];
  state.touched = new Set();

  // 打ち切り後はユーザーが話すまで動かない。
  if (state.gaveUp) {
    return;
  }

  // ユーザーが止めたランとモデルが失敗したランではゲートを動かさない。
  if (isInterrupted(event)) {
    clearFailures(state);
    return;
  }

  // 指紋の取得も含めて running で覆う（その間に次の agent_end が来ても二重に実行しない）。
  state.running = true;
  try {
    const files = await resolveTargets(pi, ctx.cwd, state, edited);

    // 変更のないターンである。未解決の失敗が残っているなら、黙って見逃さずに一度だけ告げる。
    // エージェントが「直した」と言って何も変えていない場合がここに来る。
    if (files.length === 0) {
      reportUnresolved(ctx, state);
      return;
    }

    await runGate(pi, ctx, state, files);
  } catch (error) {
    if (ctx.hasUI) {
      ctx.ui.notify(`quality-gate: check execution failed: ${errorMessage(error)}`, 'error');
    }
    clearFailures(state);
  } finally {
    state.running = false;
  }
}

export default function (pi: ExtensionAPI) {
  const state = createState();

  // agent_start が重なったとき、古い snapshot が新しい基準を上書きしないようにする。
  let baselineEpoch = 0;

  pi.on('session_start', async () => {
    Object.assign(state, createState());
  });

  // ユーザーが新しく入力した時点でリセットする（打ち切りも解く）。
  // 拡張自身の sendMessage は source が extension のためここには来ない。
  pi.on('input', async (event) => {
    if (event.source !== 'extension') {
      rearm(state);
    }
  });

  // 変更の検出は git の指紋で行う。ランの開始時点を記録しておく。
  pi.on('agent_start', async (_event, ctx) => {
    baselineEpoch += 1;
    const epoch = baselineEpoch;
    const current = await snapshot(pi, ctx.cwd);
    if (epoch === baselineEpoch) {
      state.baseline = current;
    }
  });

  // git が答えられないときの代替である。agent_end の messages にはツール入力がないためここで集める。
  // 相対パスで来るため cwd 基準の絶対パスに直す（existsSync と git は process.cwd() で解決するため）。
  pi.on('tool_result', async (event, ctx) => {
    if (!MUTATING_TOOLS.has(event.toolName) || event.isError) {
      return;
    }
    const path = extractPath(event.input);
    if (path !== undefined) {
      state.touched.add(resolve(ctx.cwd, path));
    }
  });

  // agent_settled から送ると 2 周目で extension の ctx が stale になるため agent_end を使う。
  // この時点の isIdle() は false であり、followUp として積むのが正しい振る舞いである。
  pi.on('agent_end', async (event, ctx) => {
    await handleAgentEnd(pi, ctx, state, event);
  });
}
