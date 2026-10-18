# PLAN `intent-questions`

## Files

```text
DEFINITION.md                                          update
README.md                                              update
README.ja.md                                           update
.pi/extensions/intent-router/
  index.ts                                             update
  index.test.ts                                        update
  README.md                                            update
  settings.json                                        update
  classifier.ts                                        drop
  classifier.test.ts                                   drop
  command.ts                                           drop
  command.test.ts                                      drop
  log.ts                                               drop
  log.test.ts                                          drop
  settings.ts                                          drop
  settings.test.ts                                     drop
  state.ts                                             drop
  state.test.ts                                        drop
  logs/2026-*.jsonl                                    drop
  hook/
    route.ts                                           drop
    route.test.ts                                      drop
    judge.ts                                           drop
    judge.test.ts                                      drop
  ask/
    ask.ts                                             add
    ask.test.ts                                        add
    questions.ts                                       update
  command/
    intent.ts                                          add
    intent.test.ts                                     add
  judge/
    decide.ts                                          add
    decide.test.ts                                     add
    hook.ts                                            add
    hook.test.ts                                       add
  record/
    recent.ts                                          add
    recent.test.ts                                     add
  route/
    decide.ts                                          add
    decide.test.ts                                     add
    hook.ts                                            add
    hook.test.ts                                       add
  settings/
    schema.ts                                          add
    schema.test.ts                                     add
    read.ts                                            add
    read.test.ts                                       add
  state/
    payload.ts                                         add
    payload.test.ts                                    add
    run.ts                                             add
    run.test.ts                                        add
  logs/recent.json                                     add
```

## Slices

## 1.ファイルを段階ごとに分ける

### Types

なし

### Steps

1. `.pi/extensions/intent-router/settings/schema.ts` と `settings/read.ts`: `settings.ts` を、既定値とスキーマと `settings/read.ts` の読み込みに分けて移す。テストは `settings/schema.test.ts` と `settings/read.test.ts` に分ける。元の 2 ファイルは消す（design の 07）。
2. `.pi/extensions/intent-router/ask/ask.ts` と `ask/ask.test.ts`: `classifier.ts` と `classifier.test.ts` を移す。元の 2 ファイルは消す（design の 07）。
3. `.pi/extensions/intent-router/ask/questions.ts`: `questions.ts` を移す。中身はこの slice では変えない。元のファイルは消す（design の 07）。
4. `.pi/extensions/intent-router/route/decide.ts` と `route/hook.ts`: `hook/route.ts` を、判定と文面（`decideRoute` / `guideMessage`）と `before_agent_start` の登録に分けて移す。テストは `route/decide.test.ts` と `route/hook.test.ts` に分ける。元の 2 ファイルは消す（design の 07）。
5. `.pi/extensions/intent-router/judge/decide.ts` と `judge/hook.ts`: `hook/judge.ts` を同じように分けて移す。テストは `judge/decide.test.ts` と `judge/hook.test.ts` に分ける。元の 2 ファイルは消す（design の 07）。
6. `.pi/extensions/intent-router/state/run.ts` と `state/payload.ts`: `state.ts` を、run と署名（`arm` / `addAction` / `noteTurn` / `countJudgement` / `fire`）と、Jev に渡す state の組み立て（`judgeState` / `routeState` / `toAction` / `targetOf` / `isSecretTarget` / `asInput` / `textOf`）に分けて移す。テストは `state/run.test.ts` と `state/payload.test.ts` に分ける。元の 2 ファイルは消す（design の 07）。
7. `.pi/extensions/intent-router/command/intent.ts` と `command/intent.test.ts`: `command.ts` と `command.test.ts` を移す。元の 2 ファイルは消す（design の 07）。
8. `.pi/extensions/intent-router/record/recent.ts` と `record/recent.test.ts`: `log.ts` と `log.test.ts` を移す。中身はこの slice では変えない。元の 2 ファイルは消す（design の 07）。
9. `.pi/extensions/intent-router/index.ts`: import を新しい道に直す。`index.test.ts` も直す（design の 07）。

### Verify:

- test: `pnpm vitest run .pi/extensions/intent-router` と `pnpm typecheck`
  - (happy) `pnpm typecheck` → ルートと `.pi` の両方が緑
  - (happy) `.pi/extensions/intent-router` のテスト → 移す前と本数が同じで緑
  - (boundary values) `ls .pi/extensions/intent-router/{settings.ts,questions.ts,classifier.ts,command.ts,log.ts,state.ts,hook}` → どれも無い
  - _no case_: 移すこと自体 — 機械的で、上の 2 つが新しい道で緑になることが証拠になる

## 2.設定を外へ出す

### Types

```ts
// settings/schema.ts
export type Choice = 'reply' | 'approve' | 'other';
export type Verdict = 'yes' | 'no';

export interface Question<K extends string> {
  readonly instructions: string;
  readonly criteria: Readonly<Record<K, string>>;
}

export interface ClassifierCandidate {
  readonly provider: string;
  readonly model: string;
}

export interface Settings {
  readonly classifier: {
    readonly models: readonly ClassifierCandidate[];
    readonly allowPaid: boolean;
  };
  readonly route: {
    readonly shadow: boolean;
    readonly question: Question<Choice>;
    readonly thresholds: Readonly<Record<'reply' | 'approve', number>>;
    readonly guides: Readonly<Record<'reply' | 'approve', string>>;
  };
  readonly judge: {
    readonly shadow: boolean;
    readonly minTurns: number;
    readonly everyNTurns: number;
    readonly maxJudgements: number;
    readonly threshold: number;
    readonly questions: { readonly useful: Question<Verdict>; readonly new: Question<Verdict> };
    readonly stop: {
      readonly consecutive: number;
      readonly maxNudges: number;
      readonly nudges: Readonly<Record<'reply' | 'approve', string>>;
    };
  };
  readonly state: {
    readonly textChars: number;
    readonly assistantChars: number;
    readonly resultChars: number;
    readonly maxActions: number;
    readonly maxStateChars: number;
  };
  readonly record: { readonly recent: number };
}

export function defaultSettings(): Settings;
export function parseSettings(text: string, defaults: Settings): Settings;

// settings/read.ts
export function readSettings(dir: string): Settings;
```

```ts
// ask/questions.ts
export type { Choice, Verdict } from '../settings/schema.ts';
export const ROUTE_QUESTION = 'expect';
export const JUDGE_QUESTIONS = { readonly useful: 'useful', readonly new: 'new' } as const;
export function choicesOf<K extends string>(question: Question<K>): readonly K[];
```

### Steps

1. `.pi/extensions/intent-router/settings/schema.ts`: 新しい形の既定値とスキーマを書く。`enabled` を落として `shadow` にし、問いの文と criteria（英語）・閾値・guide・促しの文・state のつまみ・記録の数を持たせる（04、06）。
2. `.pi/extensions/intent-router/settings/read.ts`: 既定を引数で受けず、呼ぶたびにファイルを読む形にする（04）。
3. `.pi/extensions/intent-router/ask/questions.ts`: `Label` と古い criteria を消し、`Choice` と問いの id だけにする（01、06）。
4. `.pi/extensions/intent-router/settings.json`: 新しい形に書き換える。文面は英語で書き、criteria を選択肢ごとに書く。第一候補を `opencode/jev-1.13-free` に固定する（04、06）。
5. `.pi/extensions/intent-router/index.ts`: 設定を ask のたびに読む形にし、`enabled` を落とす。`index.test.ts` も直す（04）。

### Verify:

- test: `pnpm vitest run .pi/extensions/intent-router/settings .pi/extensions/intent-router/index.test.ts` と `pnpm typecheck`
  - (happy) `settings.json` を書かずに `readSettings` → 既定の値が全部返る（ファイルが無い場合と同じ道）
  - (happy) ファイルを書き換えてから `readSettings` をもう一度呼ぶ → 新しい値が返る
  - (error) 知らないキーを書く → 投げる
  - (error) `thresholds.approve` に 1.5 を書く → 投げる
  - (error) `route.question.criteria` から `other` を抜く → 投げる
  - (happy) `choicesOf(settings.route.question)` → `['reply', 'approve', 'other']`（criteria のキー）
  - _no case_: `ROUTE_QUESTION` と `JUDGE_QUESTIONS` の値 — plan と `settings.json` が決める文字列で、型が閉じている
  - _no case_: `defaultSettings` の値そのもの — plan と `settings.json` が決める値で、機械が決める物ではない

## 3.頭の判定を 3 択にする

### Types

```ts
// state/payload.ts
export interface RoutePayload {
  readonly owner_now: string;
  readonly agent_prev: string;
}
export function routePayload(prompt: string, agentPrev: string, settings: Settings): RoutePayload;
export function lastAssistantText(entries: readonly SessionEntry[], maxChars: number): string;

// route/decide.ts
export type RouteDecision =
  | { readonly kind: 'act'; readonly choice: 'reply' | 'approve'; readonly confidence: number }
  | { readonly kind: 'idle'; readonly choice: Choice; readonly confidence: number }
  | { readonly kind: 'skip'; readonly reason: string };
export function decideRoute(answer: Answer, settings: Settings): RouteDecision;
export function guideText(settings: Settings, choice: 'reply' | 'approve'): string;

// route/hook.ts
export interface RouteCtx {
  readonly cwd: string;
  readonly agentPrev: string;
}
```

### Steps

1. `.pi/extensions/intent-router/state/payload.ts`: `routeState` を `routePayload`（`owner_now` と `agent_prev` の 2 つだけ）に置き換え、両方を `textChars` で切る。`lastAssistantText` を足し、pi のセッションから最後のエージェントの発言の文を抜く（01、02）。
2. `.pi/extensions/intent-router/route/decide.ts`: `decideRoute` を 3 択用にする。閾値は選択肢ごとに見て、`reply` は 0.8、`approve` は 0.9、`other` は idle にする。`guideMessage` を `guideText` に置き換える（01）。
3. `.pi/extensions/intent-router/route/hook.ts`: `before_agent_start` の登録を、1 問（`expect`）を聞き、shadow なら記録だけ、live なら guide を差し込む形にする。`ctx.agentPrev` を `routePayload` に渡す（01、02、05）。
4. `.pi/extensions/intent-router/index.ts`: `ctx.sessionManager.buildContextEntries()` から最後のエージェントの発言を読み、`RouteCtx.agentPrev` として渡す配線にする（02）。
5. `.pi/extensions/intent-router/route/decide.test.ts` と `route/hook.test.ts`: 3 択と閾値と `guideText` のケースを書く（01）。

### Verify:

- test: `pnpm vitest run .pi/extensions/intent-router/route .pi/extensions/intent-router/state/payload.test.ts .pi/extensions/intent-router/index.test.ts`
  - (happy) `expect` が `reply` 0.87 → `act` で `reply` の guide
  - (happy) `expect` が `approve` 0.92 → `act` で `approve` の guide
  - (boundary values) `approve` 0.85 → `idle`（0.9 に届かない）
  - (boundary values) `reply` 0.8 → `act`（閾値と同じ値は出る）
  - (happy) `other` → `idle`（文を出さない）
  - (error) 答えが choice でない → `skip`
  - (error) choice が知らない文字列（`weird`）→ `skip`
  - (error) `classify` が失敗 → 記録 1 行だけ残して何も出さない
  - (empty) セッションに前の発言が無い → `agent_prev` は空文字
  - (boundary values) `owner_now` が上限より長い → `textChars` で切れる
  - (boundary values) 前の発言が上限より長い → `textChars` で切れる
  - (happy) セッションの最後の発言がエージェントの物 → `agent_prev` に入る（`index.test.ts` の偽の ctx）
  - (boundary values) 画像つきの発言 → 頭の state に画像を入れない
  - (happy) shadow → 差し込まずに記録だけ残る
  - (happy) live → guide が 1 回だけ差し込まれる
  - _no case_: `cwd_basename` と `has_images` を落とすこと — 落とすだけで、結果が変わる分岐が無い

## 4.途中の判定を 2 問にする

### Types

```ts
// state/run.ts
export type Action = {
  readonly turn: number;
  readonly tool: string;
  readonly target: string;
  readonly result: string;
  readonly attempts: number;
  readonly error: boolean;
};

export type Run =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'armed';
      readonly ownerNow: string;
      readonly choice: 'reply' | 'approve';
      readonly confidence: number;
      readonly candidate: ClassifierCandidate;
      readonly startedAt: number;
      readonly lastJudgedAt: number | null;
      readonly latest: readonly Action[];
      readonly earlier: readonly Action[];
      readonly assistantLast: string;
      readonly turns: number;
      readonly judgements: number;
      readonly streak: number;
      readonly nudges: number;
      readonly truncated: boolean;
    };

export function addAction(run: Run, action: Action, limits: Settings['state']): Run;
export function noteTurn(run: Run, text: string, limits: Settings['state']): Run;
export function noteVerdict(run: Run, unhelpful: boolean): Run;
export function nudge(run: Run): Run;

// judge/decide.ts
export interface JudgeAnswers {
  readonly useful: Answer;
  readonly new: Answer;
}
export type JudgeDecision =
  | { readonly kind: 'nudge'; readonly streak: number }
  | { readonly kind: 'wait'; readonly streak: number; readonly reason: string };
export function decideJudge(answers: JudgeAnswers, settings: Settings): JudgeDecision;
export function due(
  run: Run,
  settings: Settings,
  now: number,
): { readonly kind: 'due' } | { readonly kind: 'wait'; readonly reason: string };
export function nudgeText(settings: Settings, choice: 'reply' | 'approve'): string;

// state/payload.ts
export interface JudgePayload {
  readonly owner_now: string;
  readonly agent_text: string;
  readonly latest: readonly JsonObject[];
  readonly earlier: readonly JsonObject[];
}
export function judgePayload(
  run: Run,
  settings: Settings,
): { readonly payload: JudgePayload; readonly truncated: boolean };
```

### Steps

1. `.pi/extensions/intent-router/state/run.ts`: `Run` を `latest` / `earlier` / `streak` / `nudges` を持つ形に変える。`addAction` は `latest` に足し、`noteTurn` は `latest` を `earlier` へ送ってから 1 往復と数える。`noteVerdict` と `nudge` を足す（01、03）。
2. `.pi/extensions/intent-router/state/payload.ts`: `judgeState` を `judgePayload` に置き換える。`owner_now` / `agent_text` / `latest` / `earlier` の 4 つを組み、上限で切る（03）。
3. `.pi/extensions/intent-router/judge/decide.ts`: `decideJudge` を 2 問用にする。両方が閾値以上で、どちらかが「効いていない」なら `unhelpful`。`due` の助走・間隔・上限は今のまま残す。`stopMessage` を `nudgeText` に置き換える（03）。
4. `.pi/extensions/intent-router/judge/hook.ts`: `turn_end` の登録を、2 問を 1 リクエストで聞き、`unhelpful` が `consecutive` 回続いたら促しを 1 回出す形にする。shadow なら記録だけにする（01、03、05）。
5. `.pi/extensions/intent-router/judge/decide.test.ts` と `judge/hook.test.ts`: 連続の数え方と促しの条件のケースを書く（03）。

### Verify:

- test: `pnpm vitest run .pi/extensions/intent-router/judge .pi/extensions/intent-router/state`
  - (happy) `useful=no` かつ `new=no` が 2 回続く → `nudge`（`streak` は 2）
  - (happy) `useful=yes` かつ `new=no` が 2 回続く → `nudge`（`new` だけで促しになる）
  - (boundary values) `useful=no` が 1 回だけ → `wait` で `streak` は 1
  - (happy) `useful=yes` かつ `new=yes` → `wait` で `streak` は 0 に戻る
  - (empty) `latest` が空（道具を使っていない往復）→ 何も聞かない
  - (boundary values) `useful` の confidence が 0.89 → 判断に使わず `wait`
  - (boundary values) 促しを 1 回出した後の往復 → `nudge` は出ない（`maxNudges`）
  - (boundary values) 往復が `minTurns` 未満 → 聞かない
  - (boundary values) `turns` が `everyNTurns` で割り切れない → 聞かない（理由: interval）
  - (boundary values) 判断の回数が `maxJudgements` に達した → 聞かない
  - (happy) `earlier` が 12 件を超える → 古い物から落ちて `truncated` が立つ
  - (boundary values) state が `maxStateChars` を超える → `earlier` を後ろから削る
  - (error) 2 問の classify が失敗 → 記録 1 行だけ残して何も出さない
  - (happy) shadow → 促しを差し込まずに記録だけ残る
  - (happy) live → 促しが 1 回だけ差し込まれる

## 5.切り替えと調整の道具を入れる

### Types

```ts
// command/intent.ts
export type Mode = 'shadow' | 'live';
export interface Flags {
  readonly mode: Mode;
}
export type IntentCommand =
  | { readonly kind: 'show' }
  | { readonly kind: 'mode'; readonly mode: Mode }
  | { readonly kind: 'set'; readonly path: string; readonly value: string }
  | { readonly kind: 'last'; readonly count: number }
  | { readonly kind: 'usage'; readonly text: string };
export function parseIntent(args: string, settings: Settings): IntentCommand;
export interface IntentPorts {
  readonly flags: FlagsPort;
  readonly run: RunPort;
  readonly recent: {
    readonly add: (record: Record) => void;
    readonly tail: (count: number) => readonly Record[];
  };
  readonly settingsFile: string;
}

// record/recent.ts
export interface Record {
  readonly at: string;
  readonly hook: 'route' | 'judge';
  readonly owner_now: string;
  readonly agent_prev: string | null;
  readonly choice: Choice | null;
  readonly confidence: number | null;
  readonly threshold: number | null;
  readonly guide: string | null;
  readonly verdicts: { readonly useful: Verdict; readonly new: Verdict } | null;
  readonly streak: number | null;
  readonly nudge: string | null;
  readonly fired: boolean;
}
export function createRecent(
  limit: number,
  file: string,
): { readonly add: (record: Record) => void; readonly tail: (count: number) => readonly Record[] };
```

### Steps

1. `.pi/extensions/intent-router/record/recent.ts`: 日付ごとの追記と prune をやめ、1 つのファイル（`logs/recent.json`）に直近 `limit` 件だけを持つ形にする。書き込みは上書きで、読むのは `tail` から（05）。
2. `.pi/extensions/intent-router/command/intent.ts`: `/intent` の引数を、`on` / `off` / `set` / `last` / 引数なしの 5 つに分ける。`on` は live、`off` は shadow（08）。
3. `.pi/extensions/intent-router/index.ts`: `flags` を `{ mode }` に変え、`/intent` の 4 つの下位コマンドを配線する。`set` には `settings.json` の道を渡し、`on` / `off` では抱えている run を捨てる（04、08）。
4. `.pi/extensions/intent-router/command/intent.test.ts`: 5 つの引数と、`set` が書いた値を次の ask が読むことを確かめるケースを書く（04、08）。
5. `.pi/extensions/intent-router/logs/2026-*.jsonl`: 古い記録を消す（05）。

### Verify:

- test: `pnpm vitest run .pi/extensions/intent-router/command .pi/extensions/intent-router/record .pi/extensions/intent-router/index.test.ts`
  - (happy) `/intent on` → `mode` が live
  - (happy) `/intent off` → `mode` が shadow
  - (happy) `mode` を切り替える → 抱えている run が idle に戻る
  - (happy) 引数なしの `/intent` → 今の mode を文で返す
  - (happy) `/intent last` → 直近の記録を返す
  - (boundary values) `/intent last 3` → 3 件だけ返す
  - (empty) 記録が 1 件も無い → 「まだ無い」を返す
  - (error) `/intent foo` → 使い方を返す（投げない）
  - (happy) `/intent set route.thresholds.approve 0.9`（道は `tmpDir()`）→ そのファイルが変わり、次の `readSettings` が 0.9 を返す
  - (happy) `set` が書いた値を次の ask が読む（`index.test.ts`）
  - (error) `/intent set route.thresholds.approve abc` → 投げずに理由を返し、ファイルは変わらない
  - (boundary values) 記録が上限を超える → 古い物から落ちる
  - (boundary values) `limit` が 1 → 直近 1 件だけ残る
  - (happy) `createRecent(3, join(tmpDir(), 'recent.json'))` → そのパスの 1 ファイルに直近 3 件だけが入る

## 6.統合: 意図通りに動ける

### Types

なし

### Steps

1. `DEFINITION.md`: `intent-router` の行を「エージェントが、owner の発言の意図通りに動ける」に変える（design の `Scope`）。
2. `README.md` と `README.ja.md`: `intent-router` の説明を、3 択と促しの形に合わせる。
3. `.pi/extensions/intent-router/README.md`: 設定の表・コマンド・ファイルの並びを新しい形に書き換える。

### Verify:

- cli: `pnpm typecheck` / `pnpm test:run` / `pnpm lint` と、置き場の確認
  - (happy) `pnpm typecheck` → ルートと `.pi` の両方が緑
  - (happy) `pnpm test:run` → 緑
  - (happy) `pnpm lint` → 緑
  - (happy) `ls .pi/extensions/intent-router/logs` → 出るのは `recent.json` だけ
  - (happy) `grep -n "意図通りに動ける" DEFINITION.md` → 1 件
- read: `review` サブエージェントが `.pi/extensions/intent-router/README.md`、`README.md`、`README.ja.md`、`DEFINITION.md` を読み、設定の表が `settings.json` と一致し、コマンドの一覧が `command/intent.ts` の 5 つと一致し、`intent-router` を説明する行が 3 択と促しの形になっているかを報告する
  - (happy) 表・一覧・説明が実物と一致する
  - (error) 実物に無いキー・コマンドが書いてある → 直す

## Notes

### Slice 1: ファイルを段階ごとに分ける

- Findings: なし
- Unplanned: なし
- Commit: 4196c86

### Slice 2: 設定を外へ出す

- Findings: なし
- Unplanned: なし
- Commit: 6a6325f

### Slice 3: 頭の判定を 3 択にする

- Findings: なし
- Unplanned: なし
- Commit: dc91384

### Slice 4: 途中の判定を 2 問にする

- Findings: なし
- Unplanned: なし
- Commit: 4c7d42e

### Slice 5: 切り替えと調整の道具を入れる

- Findings: なし
- Unplanned: なし
- Commit: 476250c

### Slice 6: 統合: 意図通りに動ける

- Findings: `ls .pi/extensions/intent-router/logs` は現物が repo に無い（gitignore 済み）ため `git ls-files` で代用し、日付ファイルの残存が無いことを確認した。実行時にできるのは `logs/recent.json` だけ。`JUDGE_QUESTIONS`（複数形・新形）は plan 通りのため残す（単数形の旧名は 0 件）。review は subagent 口が無いため直接実施：設定表は `settings.json` と一致、コマンドは 5 種と一致、説明は 3 択と促しの形。
- Unplanned: 旧設定形の除去（`0890ec1`、`87487a5` の 2 件。`settings/schema.test.ts` の旧ケース削除、`ask/ask.ts` の旧単発 score 経路の除去、`AskRequest.kind` を `'choice'` に狭め、`fromRegistryAnswer` を choice 専用化、`armAbort` の引数を `{ signal }` に狭め、未使用の `assertJudgeShape` を削除、`toAction` の引数名を `resultChars` に統一、`ask.test.ts` の timer 仮名 `fire` を `trigger` に変更）。`Record` が TS の組込み名と衝突したため記録型を `IntentRecord` に改名。README の表に合わせて `state.includeTools` を `settings.json` に追加して残した。
- Commit: 1040ec9

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
