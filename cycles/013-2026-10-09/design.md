# DESIGN 013

## `intent-router`

1つの新しい拡張で、route / guide / judge / onoff / log が同じ状態機械（owner の発言 → 分類 → 促し → 調査の記録 → 判定）を共有する。分けても半分は何も動かないので、1つの worktree で作る。

- ADR: 01-1, 01-2, 01-3, 01-4, 01-5, 02-1
- Where: worktree（owner が見る物ではない。子が1人で走り、マージで入る）
- Scope:
  - intent-router: 新しい拡張 `.pi/extensions/intent-router/` を足す
  - intent-router.route: owner の発言を6ラベルに分ける
  - intent-router.guide: question / design / verify の時、ターンの頭に「編集せず調べろ」を1回だけ差し込む
  - intent-router.judge: 道具を使った往復の終わりに「もう答えられるか」を判定し、1プロンプト1回だけ止めて答えさせる
  - intent-router.onoff: `/intent on|off` を足す（セッション限り）
  - intent-router.log: 判定と差し込みを拡張の中に記録する
  - Stack.Classifier: Jev を pi の classifier 経由で使う（候補の順、費用の可視化、送る物の線）
- Boundary:
  - Plans: なし
  - External:
    - `pi`: 拡張の口と classifier の呼び口
      - Version: 1.0.4（`turn_end` の続行と classifier の語彙はこの版で確認した）
      - Contract: `before_agent_start` の戻り値 `message` でターンに差し込める。`turn_end` は `{ entries }` だけ返せばよい（道具を使った往復はループが自分で続く）。`ctx.modelRegistry` に `findOfType` / `getAvailableOfType` / `classify`（例外を投げず `stopReason` で返す）
    - `jev`: 判定に使う classifier
      - Contract: 質問は choice（route）と score（judge）の2つ。答えは `answers[<id>]` に `{ type, choice, probabilities, confidence }` か `{ type, score, confidence }`
      - Limit: 1回の state は 12000 字まで
    - `.pi/extensions/intent-router/logs/`: 記録の置き場
      - Path: 拡張のファイルからの相対（worktree で走らせても、その木の中に出る）

`intent-router-memo.md`（追跡外）の中身は plan md に写した。このファイルはサイクルの close で消す（owner 判断）。
