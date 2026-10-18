# PLAN `judge-questions`

## Files

```text
.pi/extensions/intent-router/
  ask/
    questions.ts             update
  settings/
    schema.ts                update
    schema.test.ts
  settings.json              update
  state/
    run.ts                   update
    run.test.ts
    payload.ts               update
    payload.test.ts
  judge/
    decide.ts                update
    decide.test.ts
    hook.ts                  update
    hook.test.ts
  record/
    recent.ts                update
  route/
    hook.ts
    hook.test.ts
    decide.test.ts
  command/
    intent.ts
    intent.test.ts
  index.ts                   update
  index.test.ts
  README.md                  update
README.md                    update
README.ja.md                 update
```

## Slices

## 1.state を 4 つに分ける

### Types

```ts
/** state/run.ts — latest / earlier / streak を置き換える */
readonly read: readonly Action[];     // まだ判定していない、読み込んだ物
readonly related: readonly Action[];  // 関係あると判断して積んだ物
readonly unrelated: number;           // この往復で「関係ない」と判定された回数

/** state/payload.ts */
export interface JudgePayload {
  readonly owner_text: string;
  readonly agent_text: string;
  readonly read: readonly JsonObject[];
  readonly related: readonly JsonObject[];
}

/** 画像を落とし、空白の連なりを 1 つに詰めて、字数で切る */
export function minimizeText(text: string, limit: number): string;
```

### Steps

1. `.pi/extensions/intent-router/state/run.ts`:
   - `latest` → `read`、`earlier` → `related`、`streak` → `unrelated` に置き換える（`arm` の初期値と `noteTurn` / `noteVerdict` も合わせる）
2. `.pi/extensions/intent-router/state/payload.ts`:
   - `judgePayload` が `owner_text` / `agent_text` / `read` / `related` を組む。`minimizeText` を足す
3. `.pi/extensions/intent-router/judge/hook.ts`:
   - 新しい欄に合わせて呼び出しを直す（判定の中身はまだ変えない）
4. `.pi/extensions/intent-router/state/run.test.ts` と `.pi/extensions/intent-router/state/payload.test.ts`:
   - 新しい欄のケースに置き換える

### Verify:

- `test`: `.pi/extensions/intent-router/state/run.test.ts` と `.pi/extensions/intent-router/state/payload.test.ts`、`pnpm vitest run .pi/extensions/intent-router/state`
  - (happy) `read` に足した action が payload の `read` に出る
  - (happy) `related` の action が payload の `related` に出る
  - (happy) 「関係ない」の往復で `unrelated` が 1 増え、次の「関係ある」の往復でも 0 に戻らない（往復の中で数える）
  - (happy) `minimizeText('a\n\n b   c', 100)` → `'a b c'`（改行と連続した空白が 1 つの空白に詰まる）
  - (happy) `minimizeText('x'.repeat(50), 10)` → 10 字（詰めたあとに切る）
  - (happy) `minimizeText('see data:image/png;base64,iVBORw0KGgo=', 100)` → `'see [image omitted]'`
  - (boundary values) `state.textChars` より長い owner の発言 → `owner_text` がその字数になる
  - (happy) 直前のエージェント発言 → `agent_text` に入り、`state.assistantChars` で切れる
  - (happy) 道具の呼び出しブロックを含む発言 → `agent_text` に呼び出しの中身が出ない（平文だけ）
  - (empty) `read` も `related` も空 → payload の 2 つは空の配列
  - _no case_: `state.textChars` の値 — plan が決めた値なので、ケースにならない

## 2.問いと設定を新しい 2 問にする

### Types

```ts
/** ask/questions.ts */
export const JUDGE_QUESTIONS = { related: 'related', answerable: 'answerable' } as const;

/** settings/schema.ts — judge と state の形 */
readonly judge: {
  readonly shadow: boolean;
  readonly minTurns: number;      // 2
  readonly everyNTurns: number;   // 1
  readonly maxJudgements: number; // 12
  readonly threshold: number;     // 0.8
  readonly questions: {
    readonly related: Question<'yes' | 'no'>;
    readonly answerable: Question<'yes' | 'no'>;
  };
  readonly stop: {
    readonly unrelated: number;   // 2
    readonly maxNudges: number;   // 1
    readonly nudge: string;
  };
};

/** record/recent.ts */
readonly verdicts: { readonly related: Verdict; readonly answerable: Verdict } | null;
```

### Steps

1. `.pi/extensions/intent-router/settings/schema.ts`:
   - `judge.questions` を `related` / `answerable` に、`judge.stop` を `unrelated` / `maxNudges` / `nudge` にする（`consecutive` と `nudges.reply` / `nudges.approve` は消える）。`judge.threshold` と `route.thresholds` を 0.8 に。`state.textChars` を 4000、`state.assistantChars` を 1000、`state.maxStateChars` を 24000 にする
2. `.pi/extensions/intent-router/settings.json`:
   - 同じ値を書く
3. `.pi/extensions/intent-router/ask/questions.ts`:
   - `JUDGE_QUESTIONS` を `related` と `answerable` に
4. `.pi/extensions/intent-router/record/recent.ts`:
   - `verdicts` の鍵を `related` / `answerable` に
5. `.pi/extensions/intent-router/settings/schema.test.ts`:
   - 新しい鍵のケースに置き換える
6. `.pi/extensions/intent-router/README.md`:
   - 設定の表と `Record` の節を合わせる
7. `README.md` と `README.ja.md`:
   - 途中の判定の説明を「関係あるか / 答えられるか」に
8. `.pi/extensions/intent-router/command/intent.ts` と `.pi/extensions/intent-router/command/intent.test.ts`:
   - 設定の鍵を出す所を合わせる（出していなければ触らない）

### Verify:

- `test`: `.pi/extensions/intent-router/settings/schema.test.ts`、`pnpm vitest run .pi/extensions/intent-router/settings .pi/extensions/intent-router/record .pi/extensions/intent-router/command`
  - (happy) 既定の `judge.questions` の鍵が `related` と `answerable` の 2 つ
  - (happy) 既定の `judge.stop` が `unrelated: 2`、`maxNudges: 1`、文面の `nudge` を持つ
  - (happy) `judge.questions.related` だけ書く → `answerable` は既定のまま（部分上書き）
  - (error) `judge.questions.related.criteria` から `no` を抜く → 投げる
  - (boundary values) `judge.threshold` が 1.5 → 投げる
  - (error) `judge.stop.consecutive` を書く → 投げる（旧形の残りが消えた）
  - (error) `judge.stop.nudges` を書く → 投げる

## 3.judge を reply だけで走らせ、促しの条件を変える

### Types

```ts
/** judge/decide.ts */
export interface JudgeAnswers {
  readonly related: Answer;
  readonly answerable: Answer;
}

export type JudgeDecision =
  | { readonly kind: 'nudge'; readonly why: 'unrelated' | 'answerable'; readonly unrelated: number }
  | { readonly kind: 'wait'; readonly reason: string; readonly unrelated: number };

export function decideJudge(
  answers: JudgeAnswers,
  settings: Settings,
  priorUnrelated: number,
): JudgeDecision;
```

### Steps

1. `.pi/extensions/intent-router/judge/decide.ts`:
   - 促しの条件を「`related` が no で、`unrelated` が `stop.unrelated` に届いた」または「`answerable` が yes」にする。どちらも `threshold` を通った答えだけを数える。`due` に「`choice` が `reply` でなければ wait」を足す
2. `.pi/extensions/intent-router/judge/hook.ts`:
   - 2 問を `related` / `answerable` の名で 1 リクエストにまとめて聞く。`related` が yes ならその往復の `read` を `related` へ積み、no なら捨てて `unrelated` を 1 つ増やす。閾値を通らなかった往復は `read` を残して次の往復でまた聞く。促しの文は `stop.nudge` から読む
3. `.pi/extensions/intent-router/judge/decide.test.ts` と `.pi/extensions/intent-router/judge/hook.test.ts`:
   - 新しい条件のケースに置き換える
4. `.pi/extensions/intent-router/route/hook.test.ts` と `.pi/extensions/intent-router/route/decide.test.ts`:
   - 閾値 0.8 に合わせる（`approve` の境界のケース）
5. `.pi/extensions/intent-router/index.ts` と `.pi/extensions/intent-router/index.test.ts`:
   - 配線を合わせる

### Verify:

- `test`: `.pi/extensions/intent-router/judge/decide.test.ts` と `.pi/extensions/intent-router/judge/hook.test.ts`、`pnpm vitest run .pi/extensions/intent-router/judge .pi/extensions/intent-router/route .pi/extensions/intent-router/index.test.ts`
  - (happy) `related=yes` `answerable=no`（どちらも閾値以上）→ 促しは出ない
  - (happy) `answerable=yes`（閾値以上）→ 促しが 1 回出る（`why: 'answerable'`）
  - (boundary values) `related=no` が 1 往復目 → 出ない。2 往復目 → 促しが出る（`why: 'unrelated'`）
  - (boundary values) `related=no` と `related=yes` が交互 → 往復の中の合計で数えるので、2 回目の no で出る
  - (boundary values) `related` の confidence が閾値未満 → `unrelated` は増えず、`read` は残る
  - (boundary values) `answerable` の confidence が閾値未満 → 促しは出ない
  - (happy) 1 回の ask の問いの鍵が `related` と `answerable` の 2 つ（1 リクエストにまとまる）
  - (happy) `related=yes` の往復のあと、次の payload の `related` にその action が入る
  - (happy) `approve` の往復 → 2 段目は走らない
  - (empty) `read` が空の往復 → 何も聞かない
  - (happy) 促しの文を差し替えると出す文も変わる。`reply` と `approve` で同じ文を使う（`choice` で文が変わらない）
  - (boundary values) `route` の `approve` が 0.85 → act、0.75 → idle（閾値が 0.8 になった）
  - (happy) `index` の配線で judge の往復を 1 回通すと、記録の 1 件に `related` と `answerable` の鍵が入る

## 4.統合: 関係ある記録が積まれ、答えられるのときに促しが出る

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/judge/hook.test.ts`:
   - 何往復か続ける筋書きの検査を足す（`read` が積まれ、促しが出て、記録が 1 行ずつ残る）

### Verify:

- `test`: `.pi/extensions/intent-router/judge/hook.test.ts`、`pnpm vitest run .pi/extensions/intent-router`
  - (happy) 1 往復目の `related` が 2 往復目の payload の `related` に出る
  - (happy) 2 往復目で `answerable=yes` → 促しが 1 回だけ出て、記録の `nudge` に入る（shadow では `fired` は false）
  - (happy) 3 往復で `related=no` / `related=yes` / `related=no` → 合計 2 回で促しが出る
  - (boundary values) そのあと往復を重ねても促しは出ない（`maxNudges` が 1）
  - (empty) `approve` の往復 → 2 段目が走らず、記録も増えない
  - (error) ask が 2 回続けて失敗 → 記録は残り、促しは出ない
  - (empty) 道具を使わない往復 → 記録が増えず、何も聞かない

## Notes

### Slice 1: state を 4 つに分ける

- Findings: なし
- Unplanned:
  - `judge/hook.test.ts` の `streak`/`latest`参照を `unrelated`/`read`に合わせ、`yesYes`後の期待値を0→1に変えた（`noteVerdict(false)`で戻さない規則のため。型を通す必須手当て）
  - `state/run.test.ts` の上限値を固定値から `limits()`由来に変えた（slice 2の値変更に耐えるため）
- Commit: 69d0f00

### Slice 2: 問いと設定を新しい 2 問にする

- Findings: なし
- Unplanned:
  - `judge/decide.ts`と`judge/hook.ts`を新鍵（`related`/`answerable`、`stop.unrelated`/`stop.nudge`）に合わせた（型を通す必須手当て。判定は旧ORのまま slice 3で変える）
  - `judge/decide.test.ts`・`judge/hook.test.ts`・`index.test.ts`の問名と`nudgeText`期待値を新形に合わせた（`reply`/`approve`で同文。全テスト緑のため）
- Commit: 3dfb70f

### Slice 3: judge を reply だけで走らせ、促しの条件を変える

- Findings: なし
- Unplanned:
  - `judge/hook.test.ts`が肥大化し`max-lines-per-function`で赤になったため、新問の7件を`registerJudge/related answerable`に分離した（lint緑のため）
  - `route/decide.test.ts`に`approve 0.85→act`を追加、`index.test.ts`にjudge記録の`verdicts`鍵確認を追加（slice 3 Verifyのため）
- Commit: ba07a28

### Slice 4: 統合: 関係ある記録が積まれ、答えられるのときに促しが出る

- Findings: なし
- Unplanned: なし
- Commit: ee22a9c

## Review

### Round 1

- Stale: なし — 旧名 useful new consecutive nudges latest earlier の残り、コメントの頭書き、README 3 枚の設定表と Record 節を確認。いずれも新名に揃い、残りはなかった
- Unlisted: なし — git diff 158aff2 から HEAD の stat 19 件と plan Files の一覧を突き合わせ。全ての変更ファイルは Files に載り、載っていないファイルの変更はなかった
- Gaps:
  - 道具呼び出しを含む発言の agent_text は検査されていない。plan は agent_text に呼び出しの中身が出ないことを求めるが、state/payload.test.ts:256 は lastAssistantText を見て judge 用の道を見ない。judge 用は .pi/extensions/intent-router/judge/hook.ts:84 の textOf から noteTurn を経て作られ、hook 側の落としを確かめる検査がない
    - fixed: `judge/hook.test.ts`のintegrationにtoolCall混じり往復→2回目payloadの`agent_text`が平文のみの検査を追加
  - related no かつ answerable yes の組み合わせは検査されていない。.pi/extensions/intent-router/judge/decide.ts:45 の answerable yes の枝で unrelated を足す振る舞いは、.pi/extensions/intent-router/judge/decide.test.ts:46 の yes yes だけでは通らず、hook 側にも no yes の筋書きがない
    - fixed: `decide.test.ts`にno+yesでnudgeかつunrelated+1の検査、`hook.test.ts`integrationに同組み合わせの筋書き検査を追加
- Unproven:
  - 詰めてから切る順序は証明されていない。.pi/extensions/intent-router/state/payload.ts:113 は落として詰めてから切るが、.pi/extensions/intent-router/state/payload.test.ts:192 は空白なし 50 字の長さだけ見るため、切ってから詰める壊れ方でも緑のまま。もう一方の詰めの検査も上限 100 で順序を見ない
    - fixed: `payload.test.ts`に`minimizeText('xxx\n\n\nyyy', 4)`が`'xxx '`になる順序検査を追加
  - owner_text と agent_text に minimize が使われることは証明されていない。.pi/extensions/intent-router/state/payload.ts:152 は minimizeText で組むが、.pi/extensions/intent-router/state/payload.test.ts:231 と 246 は あ の繰り返しの長さだけ見るため、slice に戻しても緑のまま。空白や画像を含む owner 発言の検査がない
    - fixed: `payload.test.ts`に改行空白混じり発言のowner/agent詰め検査、`hook.test.ts`integrationにpayload側minimize検査を追加
- Doubts:
  - index.ts は plan Files で update だが差分なし。配線は変えずに済み、index.test の verdicts 確認は緑。閉じる上では問題ないと見る
  - state/run.ts:160 の noteVerdict は hook から呼ばれず、生産の数えは decide と hook の stamped で行われる。run.test は緑のまま残る。消すか残すかは別 cycle の判断にしたい

### Round 2

- Stale: なし — fixed 指定の4件だけを対象としたため、旧名残りの再走査はしていない
- Unlisted: なし — fixed 指定の4件はいずれも plan 通りの検査追加であり、対象外の差分は見ていない
- Gaps: なし — fixed の2件が穴を塞ぐことを確認した。1件目は道具呼び出し混じり往復で次の payload の agent_text が平文のみになる検査であり、引数混入では赤になる形だった。2件目は related no かつ answerable yes の組み合わせで、decide 単体と hook 筋書きの両方で促しと加算を確かめる形だった
- Unproven: なし — fixed の2件が順序と適用を証明できることを確認した。1件目は詰めてから切る順序を字数4の末尾空白で見る検査であり、逆順では赤になる形だった。2件目は owner と agent の詰めを改行混じり文で見る検査であり、単位検査と hook 経路の両方で確かめる形だった
- Doubts:
  - 実行による緑は確かめていない。読み合わせでの確認にとどまるため、最終の緑は別途の実行記録に任せたい

## Acceptance

- Ran:
  - plan の検査: slice 1〜4 の `Verify` を含む `pnpm vitest run .pi/extensions/intent-router` → 12 ファイル / 199 件が緑（重複 11 件を消した後）
  - `pnpm test:run` → 41 ファイル / 697 件が緑
  - `pnpm typecheck` → ルートと `.pi` とも ok
  - `pnpm lint` → 緑
  - 壊して赤を確かめた 3 件（同時に入れた）:
    - `judge/decide.ts` の `answerable === 'yes'` の枝を止める
    - `judge/decide.ts` の `due` の「`reply` 以外は wait」を外す
    - `state/payload.ts` の `minimizeText` の空白の詰めを外す
    - 3 件で合わせて 40 件が赤になり、戻すと緑に復帰（重複 11 件を消した後にやり直した）
- Findings:
  - テスト 12 ファイルの見直しで、消してよい検査が 11 件見つかった（重複・書き写し・弱い方）。
    - fixed: 重複11件を削除（`judge/hook`の2件、`recent`1件、`route/decide`1件、`route/hook`2件、`schema`2件、`payload`3件）。`pnpm vitest run .pi/extensions/intent-router`は210件→199件（11件減）、`pnpm test:run`は708件→697件で緑を維持
    - `judge/hook.test.ts:799` と `:628` が同じファイルの `:430` / `:511` と同じ振る舞い。
    - `record/recent.test.ts:64` が `:48` と同じ（件数違いだけ）。
    - `route/decide.test.ts:27` が `:16` と同じ（値違いだけ）。
    - `route/hook.test.ts:267` と `:188` が `:149` / `:162` と同じ（文面違いだけ）。
    - `settings/schema.test.ts:122` と `:126` が定数の文字を写しただけ。
    - `state/payload.test.ts:114` が `:103` と同じ。
    - `state/payload.test.ts:160` と `:192` が同じ関数の中の重複。
  - 記録の欄 `streak` が、いまは「関係ないと判定された回数」を入れている（`judge/hook.ts` が `streak: input.unrelated` と書く）。欄の名を `unrelated` に直す（README と関係するテストも）。
    - fixed: 記録欄を`streak`→`unrelated`に改名（`recent.ts`/`judge/hook.ts`/`route/hook.ts`/README/関係テスト）。`git grep -n streak`は`.pi/extensions/intent-router/`で0件
- Doubts:
  - テストの見直しで「同じ枝に見える」として残した 10 件: `judge/hook.test.ts:268` と `:815`、`state/run.test.ts:97` と `:105`、`settings/schema.test.ts:96` と `:103`、`state/payload.test.ts:136` と `:120`、`route/decide.test.ts:84`、`judge/hook.test.ts:676`、`record/recent.test.ts:143`、`ask/ask.test.ts:174`。
  - テストの構造の揺れ: 記録を読む小さな道具が 3 つのテストに写されている、`payload.test.ts` の題と中身のずれ、数値かどうかだけを見る書き方。
