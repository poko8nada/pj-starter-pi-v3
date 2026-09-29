# consult.report

Acceptance:

- 親に戻る塊は `id / role / worktree / state（done | stopped + reason）/ files / turns / spend` と、子の最後の本文
- diff は渡さない（親が要るなら `git -C <path> diff` を自分で読む）
- 打ち切りのとき、子が**最後の 1 ターンに入る前に**自分で状況を報告する（`stopped: turn-limit` に子自身の報告が付く）
- ありえる戻り値は 6 つで全部: `done` / `done` でファイルなし / `turn-limit` / `hook-rejected` / `error` / `aborted`
- 止まった次の手は 2 択だけ（同じ worktree に `continue: true` で送り直す / 何もしない）。**道具は retry しない**

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/render.ts`
  - 戻る塊を組む（`[consult] <id> <role> <unit>`、`state`、`files`、`turns/spend`、`worktree`）
  - 「止まった理由を worktree から推測する」道を消す（理由は道具が持つ）
- `.pi/extensions/consult/child/budget.ts`（新規）
  - 子のセッションに入る拡張。`CONSULT_TURNS` を環境変数から読む
  - `turn_end` を数え、`limits.turns - 1` に達したら `custom_message` で「次が最後のターンです。状況を報告してください」を差し込み、`continue: true` を返す
  - `limits.turns` を超えたら何もしない（親が止める）
- `.pi/extensions/consult/run/run.ts`
  - 子の走りを 1 回に絞り、`state` と `reason`（`turn-limit` / `hook-rejected` / `error` / `aborted`）を決める
  - `files` を `git -C <wt> status --porcelain` から作る
  - `turns` / `spend` を子のイベントから集める
  - 使用量の合算（`combineRuns`）を消す（走りは 1 回）
- テスト: `.pi/extensions/consult/child/budget.test.ts`（新規）、`.pi/extensions/consult/tool/render.test.ts`、`.pi/extensions/consult/run/run.test.ts`（`combineRuns` を外す）

## Verify

### test

- `pnpm test:run consult/child/budget consult/run/run consult/tool/render`（13 ケース）
  - `turn_end` が `turns - 2` 回 → 何も差し込まない（happy）— 3 行目を決める
  - `turns - 1` 回目 → `custom_message` が差し込まれ、`continue: true` が返る（happy）— 3 行目を決める
  - `turns` を超えた → 何もしない（boundary）— 3 行目を決める
  - `CONSULT_TURNS` が無い → 何もしない（empty）— 3 行目を決める
  - 子が普通に終わる → `state: done`、`files` に変えたファイル（happy）— 1・4 行目を決める
  - 子が何も変えない → `state: done`、`files` は空（empty）— 1・4 行目を決める
  - ターン上限で止まる → `state: stopped`、`reason: turn-limit`（error）— 3・4 行目を決める
  - フックが拒否する → `state: stopped`、`reason: hook-rejected`（error）— 4 行目を決める
  - 子のプロセスが落ちる → `state: stopped`、`reason: error`（error）— 4 行目を決める
  - 親が `cancel` する → `state: stopped`、`reason: aborted`（error）— 4 行目を決める
  - `state: stopped` の塊 → `state: stopped (turn-limit)` の行が出る（happy）— 1 行目を決める
  - 塊に diff が含まれない（happy）— 2 行目を決める
  - 同じ worktree に `continue: true` で送る → 道具は retry せず、親の 1 回だけが走る（a second call）— 5 行目を決める
  - 権限: 該当なし（理由: 文字列の組み立てと、子のイベントの集計だけ）
  - 同時実行: 該当なし（理由: unit 内は直列で、同じ worktree に同時に書かない）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
