# DESIGN 037

## Affected

### 01: 生成中のループを止めるか

- `DEFINITION.md` — Unit thinking-scrub の主機能を定義している。
- `README.md` — 拡張の一覧で thinking-scrub の振る舞いを説明している。
- `README.ja.md` — 拡張の一覧で thinking-scrub の振る舞いを説明している。
- `.pi/extensions/thinking-scrub/index.test.ts` — `createScrubWiring` と `registerScrub` を読み、abort とフォローアップの検査を持つ。

### 02: 検出の単位をセンテンスにするか

- `.pi/extensions/thinking-scrub/scrub/detect.test.ts` — `detectRuns` と `scrubThinking` を読む。
- `.pi/extensions/thinking-scrub/scrub/message.test.ts` — `detectRuns` と `scrubMessage` を読む。

### 03: フォローアップに何を注入するか

- `.pi/extensions/thinking-scrub/index.test.ts` — `createScrubWiring` と `registerScrub` を読み、フォローアップの検査を持つ。

## External

### 01: 生成中のループを止めるか

- `ctx.abort()` — thinking が 20,000 文字以上で周期を検出したときに、生成を止めるために呼ぶ。
  - Contract: 現在の run の abort signal を止める。
- `agent_settled` — 停止後に custom message を送る場として使う。
  - Contract: settle の後に発火する。
- `triggerTurn: true` の custom message — `agent_settled` の中で送り、次の run を始める。
  - Contract: `agent_settled` の中の送信は settle の後に遅延実行される。
- 生成中の assistant メッセージの thinking — 20,000 文字以上か、周期があるかを読む。
  - Data: 末尾 20,000 文字を走査する。

### 02: 検出の単位をセンテンスにするか

- なし

### 03: フォローアップに何を注入するか

- `triggerTurn: true` の custom message — サンプル入りのメッセージを次の run の入力として送る。
  - Contract: `agent_settled` の中で送ると、settle の後に実行される。
- run 内の thinking の文の並び — 最も多い 3 文の連続を選ぶデータ。
  - Data: 200 文字で切る。周期が 3 以下なら周期そのもの。
- トランスクリプト — フォローアップの出力先。
  - Data: custom message として残る。

## `sentence-loop-stop`

### ADR & Where

- No: 01, 02, 03
- Why: 3 entry が同じ入力（センテンス検出器と `thinking-scrub` の配線）を読み、02 の run を 01 と 03 が使うので、分けると同じ検出器を二重に作り、branch がテストで赤くなる。待つ plan は無い。
- Where: worktree — yolo の plan。owner の look は無い。

### Summary

- センテンス単位の周期検出を足し、文字単位の検出と並べる。センテンスの run は最初の 1 周期を残し、文字の run は全部消す。
- thinking が 20,000 文字以上で run を見つけたら `ctx.abort()` し、`agent_settled` で custom message を送って次の run を始める。abort は 1 run 2 回までで、上限の後は畳み込みだけを行う。
- custom message のサンプルは run の中で最も多い 3 文の連続（200 文字で切る。周期が 3 以下なら周期そのもの）で、abort・フォローアップ・上限は `index.test.ts` の偽の pi で確かめる。README（拡張とルート）を 2 段階の動きに合わせる。

### Paths

- `.pi/extensions/thinking-scrub/scrub/detect.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
- `.pi/extensions/thinking-scrub/scrub/message.ts`
- `.pi/extensions/thinking-scrub/scrub/message.test.ts`
- `.pi/extensions/thinking-scrub/index.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/README.md`
- `README.md`
- `README.ja.md`

### Boundary

- Plans: なし
- External:
  - `ctx.abort()`: 生成を止める。
    - Contract: thinking が 20,000 文字以上で周期を検出したときだけ呼ぶ。
  - `agent_settled`: 停止後に custom message を送る。
    - Contract: `aborted === true` のときだけ送る。
  - `triggerTurn: true` の custom message: 次の run の入力になる。
    - Contract: `agent_settled` の中で送ると、settle の後に実行される。
  - 生成中の assistant メッセージの thinking: 20,000 文字以上と周期の有無を読む。
    - Data: 末尾 20,000 文字を走査する。
  - run 内の thinking の文の並び: 最も多い 3 文の連続を選ぶ。
    - Data: 200 文字で切る。周期が 3 以下なら周期そのもの。
  - トランスクリプト: フォローアップの出力先。
    - Data: custom message として残る。
