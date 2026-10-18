# PLAN `ex-drop-unused`

close の収集から: 2（使われていない `noteVerdict`）と 11（同じ枝に見える検査 8 組）。

## Files

```text
.pi/extensions/intent-router/
  state/
    run.ts            update
    run.test.ts       update
    payload.test.ts   update
  judge/
    hook.test.ts      update
  settings/
    schema.test.ts    update
  route/
    decide.test.ts    update
  ask/
    ask.test.ts       update
```

## Slices

## 1.使われていない `noteVerdict` を消す

### Types

```ts
なし; // 消すだけ。新しい型は増やさない
```

### Steps

1. `.pi/extensions/intent-router/state/run.ts`:
   - `noteVerdict` を消す（コメント、2 つの宣言、本体。159 行目から 167 行目まで）。`nudge` と `countJudgement` は残す
2. `.pi/extensions/intent-router/state/run.test.ts`:
   - `it('noteVerdict(true) で unrelated が増える')`（161 行目）と `it('noteVerdict(false) で unrelated は 0 に戻らない')`（175 行目）を消す
   - `it('idle に addAction / noteTurn しても idle のまま')`（58 行目）の中の `expect(noteVerdict(idleRun(), true).kind).toBe('idle');`（61 行目）を消す。同じ `it` の中の `nudge` の行は残す
   - `describe('noteVerdict / nudge')`（160 行目）の題を `nudge` に直す。`it('nudge で nudges が増える')`（185 行目）と `it('countJudgement …')`（193 行目）は残す
3. 消える検査が覆っていた規則を、残る検査が持っていることを確かめる:
   - 「no で 1 増え、yes では戻さない」は `judge/decide.test.ts` の `it('related=no と yes が交互 → 合計で数えて 2 回目の no で出る')`（68 行目）
   - 促しが 1 回だけは `judge/hook.test.ts` の `it('3 往復で related=no/yes/no → 合計 2 回で促しが出て、その後は出ない')`（674 行目）

### Verify:

- `test`: `.pi/extensions/intent-router/state/run.test.ts`、`pnpm vitest run .pi/extensions/intent-router` と `pnpm typecheck` と `pnpm lint`
  - (happy) `git grep -n "noteVerdict" -- .pi/extensions/intent-router` → 0 件
  - (happy) `judge/decide.test.ts` の `it('related=no と yes が交互 → 合計で数えて 2 回目の no で出る')` が緑（no で 1 増え、yes では戻さない規則が生きている）
  - (happy) `judge/hook.test.ts` の `it('3 往復で related=no/yes/no → 合計 2 回で促しが出て、その後は出ない')` が緑（1 回だけの規則が生きている）
  - (boundary values) `state/run.test.ts` の `describe('nudge')` の 2 件（armed で `nudges` が 1 増える、idle では変わらない）が緑
  - (empty) `state/run.test.ts` の `describe` の題に `noteVerdict` が残っていない（`git grep -n "noteVerdict" -- .pi/extensions/intent-router/state/run.test.ts` → 0 件）
  - _no case_: 判別共用体の枝（Armed / Run） — 消える関数の枝なので、ケースも一緒に消える
  - _no case_: 省略可能な欄・状態の移り変わり・境界値・空 — 使われていない関数を消すだけで、外からの値を扱わない
  - _no case_: 不正入力・失敗の道・権限・2 回目・同時 — 同上

## 2.同じ枝に見える組を、コードを読んで確かめて消す

### Types

```ts
なし;
```

### Steps

1. 下の a から h までを 1 つずつ読む。組の 2 つの検査が通す入力が、同じ枝（同じ `if` の道）を通るかをコードで確かめる:
   - a. `judge/hook.test.ts` の `it('read が空（道具を使っていない往復）→ 何も聞かない')`（280 行目）と `it('一覧から落ちた edit の往復 → read に入らない')`（797 行目）
   - b. `state/run.test.ts` の `it('includeTools に無い道具は入らない')`（97 行目）と `it('既定の一覧の道具は通り、落ちた edit は通らない')`（105 行目）
   - c. `settings/schema.test.ts` の `it('judge.stop.consecutive を書く → 投げる')`（100 行目）と `it('judge.stop.nudges を書く → 投げる')`（107 行目）
   - d. `state/payload.test.ts` の `it('owner は短く agent_prev だけが長い → truncated が true')`（114 行目）と `it('前の発言が上限より長い → textChars で切れる')`（130 行目）
   - e. `judge/hook.test.ts` の `it('3 往復で related=no/yes/no → 合計 2 回で促しが出て、その後は出ない')`（674 行目）と `it('related=no と yes が交互 → 合計で数えて 2 回目の no で出る')`（485 行目）
   - f. `route/decide.test.ts` の `it('{prompt} に抜粋が差し込まれ、{prompt} の文字は残らない')`（77 行目）— 重なる相手は書いていないので、読んで探す
   - g. `ask/ask.test.ts` の `it('1つ目の候補で choice が返る → answered で候補と答えと usage が入る')`（153 行目）の中の `latencyMs` の表明 — 数であることは型が決めるので、この 1 行を消す
   - h. `record/recent.test.ts` の `it('旧形式（1 行に配列） → 読める行が無いので tail は空')` — ファイルごと消えたので対象外
2. 同じ枝だと決めた組だけ消す。消す単位は `it` の塊ごと（行だけ抜かない。g だけは例外で、その 1 行だけ）
3. 消す前に、消す側が赤くなる壊し方をコードに入れ、**残す側も赤くなる**ことを見る。赤くならなければ、残す側は別の枝なので消さない。壊し方は戻す
4. a から h まで 8 つぶんの行を `## Notes` に書く（消した組: 消した検査の題、壊し方、赤くなった検査 / 残した組: 違い 1 行）。1 つでも欠けたら、この slice は閉じない

### Verify:

- `test`: `pnpm vitest run .pi/extensions/intent-router` と `pnpm typecheck` と `pnpm lint`
  - (happy) 1 つ消すたびに、残る検査と全体が緑
  - (happy) 消した `it` の題を `git grep -n` で探すと 0 件
  - (empty) 消した題の数と、`## Notes` の a から h までの行の数が合っている
  - _no case_: 消した検査が覆っていた枝 — 同じ枝と決めた組だけを消すので、消した側の枝は残す側が覆う。覆いは手順 3 の壊し方で確かめて `## Notes` に残す（閉じる時には戻っている）
  - _no case_: 不正入力・失敗の道・権限・2 回目・同時 — 検査を消すだけで、外からの値を扱わない
  - _no case_: 境界値・空・省略可能な欄・状態の移り変わり — 同上

## 3.統合: 使われていない物と、二重の検査が残っていない

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/` のコードとテストを読む:
   - `noteVerdict` の残り（本体、輸入、ケース）が 0 件
   - slice 2 で消した題が 0 件（`## Notes` の一覧と突き合わせる）
   - 消さなかった組が `## Notes` の行に、違いつきで書いてある

### Verify:

- `test`: `pnpm test:run` と `pnpm typecheck` と `pnpm lint`
  - (happy) 全体が緑（41 ファイル）
  - (happy) `git grep -n "noteVerdict" -- .pi/extensions/intent-router` → 0 件
  - (happy) `git grep -n "describe('noteVerdict" -- .pi/extensions/intent-router` → 0 件
  - (empty) slice 2 で消した題を `git grep -n` で探すと 0 件
  - (boundary values) 消した検査の数だけ、`## Notes` の Slice 2 に組の行がある
  - _no case_: 外からの値・誤り・権限・2 回目・同時 — 消すだけなので、扱う値が無い

## Notes

### Slice 1: 使われていない `noteVerdict` を消す

- Findings: なし
- Unplanned: なし
- Commit: 44e71ea

### Slice 2: 同じ枝に見える組を、コードを読んで確かめて消す

- a: 消した `read が空（道具を使っていない往復）→ 何も聞かない`、残した `一覧から落ちた edit の往復 → read に入らない`。壊しは addAction の includeTools 判定外し。赤は両方。理由は edit 除外の記録を残すため
- b: 消した `includeTools に無い道具は入らない`、残した `既定の一覧の道具は通り、落ちた edit は通らない`。壊しは同上。赤は両方。理由は残す側が肯定と否定の両方を覆うため
- c: 消した `judge.stop.nudges を書く → 投げる`、残した `judge.stop.consecutive を書く → 投げる`。壊しは JudgeStopSchema の追加欄許可。赤は両方。理由は未知欄拒否の枝が同じため
- d: 両方残す。違いは 114 が truncated の旗、130 が直前発言の切り詰め（旗固定壊しでは 114 のみ赤）
- e: 消した hook の `related=no と yes が交互 → 合計で数えて 2 回目の no で出る`、残した `3 往復で related=no/yes/no → 合計 2 回で促しが出て、その後は出ない`。壊しは decideJudge の加算外し。赤は両方。理由は計数は decide 側が覆い残す側が1回限りまで見るため
- f: 消した `{prompt} に抜粋が差し込まれ、{prompt} の文字は残らない`、残した `reply と approve で文面を選ぶ` と `改行は1つの空白に潰れて40字で切れる`。壊しは guideText の置換なし。赤は 3 件全赤
- g: 消した latencyMs の型表明1行（同 it は残す）。数が型で決まるため
- h: 対象外。record/recent.test.ts は存在しない
- Findings: なし
- Unplanned: なし
- Commit: 5641697

### Slice 3: 統合: 使われていない物と、二重の検査が残っていない

- noteVerdict の残り 0 件、消した題は hook 側 0 件（e の題は decide 側に残る）、残した組は a〜h の 8 行に記録。全体 41 ファイル 699 件緑
- Findings: なし
- Unplanned: なし
- Commit: 5641697

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
