# consult.children

Acceptance:

- `consult_children{action: list|cancel, id?}` が、子ごとに `id / role / worktree / 経過 / ターン / 費用` を返す
- reload をまたいでも出る（記録を読む）。動いている子の行には pid がある
- 実行の記録は `<root>/<unit-id>/log.jsonl` に移る（`stopped.json` を消す）
- `consult_resume` と、`run/stopped.ts` / `run/resume.ts` / `tool/resume.ts` が消える（続きは `consult_run{continue: true}`、一覧と削除は `consult_worktree` が担う）

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/children.ts`（新規）
  - `consult_children` の `list` / `cancel`（既定 `list`）と、戻り値の組み立て
- `.pi/extensions/consult/run/log.ts`（新規）
  - `appendRun(run)` — `<root>/<unit-id>/log.jsonl` に 1 行足す（`child id / role / pid / 開始 / 終了 / state / reason / files / turns / spend`）
  - `readRuns()` — 全部を読み、走っている物（pid が生きていて終了の行が無い物）を含めて返す
  - `pidAlive(pid)` — 生存確認
- `.pi/extensions/consult/run/stopped.ts`（削除）、`.pi/extensions/consult/run/resume.ts`（削除）、`.pi/extensions/consult/tool/resume.ts`（削除）
- `.pi/extensions/consult/tool/consult.ts`
  - `action: list` / `cancel` と `USAGE` を消す（`consult_children` へ移る）
- `.pi/extensions/consult/index.ts`
  - `consult_children` を登録し、`consult_resume` の登録を消す
- テスト: `.pi/extensions/consult/run/log.test.ts`（新規）、`.pi/extensions/consult/tool/children.test.ts`（新規）、`.pi/extensions/consult/run/resume.test.ts`（削除）、`.pi/extensions/consult/tool/resume.test.ts`（削除）、`.pi/extensions/consult/tool/consult.test.ts`（`list` / `cancel` を外す）

## Verify

### test

- `pnpm test:run consult/run/log consult/tool/children consult/tool/consult`（10 ケース）
  - 1 行足して読む → その 1 行がそのまま返る（happy）— 3 行目を決める
  - 走っている子（pid が生きていて終了行が無い）→ 一覧に含まれる（happy）— 2 行目を決める
  - 終わった子 → 一覧に含まれ、state と reason を持つ（happy）— 2 行目を決める
  - 壊れた行（JSON でない）→ その行だけ飛ばし、他は読める（error）— 3 行目を決める
  - 記録が無い unit → 空の配列（empty）— 2 行目を決める
  - 同じ run を 2 回足す → 2 行になる（a second call）— 3 行目を決める
  - `{action: 'list'}` → 走っている子の行（happy）— 1・2 行目を決める
  - `{action: 'cancel', id}` → 止めた結果が返る（happy）— 1 行目を決める
  - `{action: 'cancel'}`（id 無し）→ エラー（error）— 1 行目を決める
  - `consult_resume` と 3 ファイルが消えている（happy）— 4 行目を決める
  - 権限: 該当なし（理由: `/tmp` の中の自分の記録だけ）
  - 同時実行: 該当なし（理由: 追記は 1 行単位で、unit 内は直列）

## Notes

### Findings

- `run/stopped.ts` / `run/resume.ts` / `tool/resume.ts` / `consult_resume` は **step 2 で既に消えていた**（前倒しの逸脱として記録済み）
  - 観測: `grep -rn "resume\|stopped.json\|consult_resume" --include=*.ts` が 0 件。チケットの削除項目は空振りだった
  - `tool/children.test.ts` の「消えた面」が、この状態を検査として固定している
- **記録を書く人がいなかった**: チケットの Todo は `run/log.ts` の関数だけで、受け入れ条件の「動いている子の行には pid がある」を成立させる書き手がいなかった
  - なぜ外か: pid は `runPi` の spawn 直後にしか分からない（`RunResult` を待つと遅い）。記録は「走っている間」にも読まれる
  - 実装: `RunOptions.onStarted` / `RunResult.pid`（`run/run.ts`）→ `ChildJob.onStarted`（`run/child.ts`）→ `beginRun` の `onStarted` が「走っている」1 行を書き、`runInBackground` が終わりの 1 行（`catch` では `state: 'error'`）を書く
  - 副産物: `ConsultOutcome.report`（型のある塊）を足した。`details` は `Record<string, unknown>` なので、書き手が型で読めなかった
- 記録は **1 体につき 2 行**（走っている行 → 終わりの行）になる。追記のみで上書きしないため
  - なぜ外か: 設計は「1 行足す」としか書いていない。写しを上書きする道（ファイル全体の書き直し）は、途中で落ちると壊れる
  - 実装: 一覧は子ごとに最後の行を取る（`tool/children.ts` の `latest`）で 1 行に畳む。並びは始まった順のまま
- `unit` を持たない子（読むだけのロールで worktree を省いた物）の記録は `<root>/_parent/log.jsonl` に置く
  - なぜ: チケットは `<root>/<unit-id>/log.jsonl` と言っているが、unit が無い子にも置き場が要る（設計 §5 は readOnly の子が親の木で走ると認めている）
- 走っている子の行が実際に出るのは実物でしか確かめられない（子を起こさないテストでは `runPi` を通らない）
  - この環境の条件: `pnpm test:run` は子を起動しない。step 8 の `use` 検証（親が実物で子を走らせる）で見る

### Unplanned

- `.pi/extensions/consult/run/run.ts`: `RunResult.pid` と `RunOptions.onStarted` を足した（spawn 直後に子の pid を知らせる）
  - なぜ: 記録の書き手が pid を要るため
- `.pi/extensions/consult/run/child.ts`: `ChildJob.onStarted` を足し、`runPi` へ渡すようにした
  - なぜ: 同上（道具が pid を受け取る道）
- `.pi/extensions/consult/tool/consult.ts`: 記録の開始/終了の 2 か所を書くようにした。`RunningChild.pid` と `ConsultOutcome.report` も足した
  - なぜ: `consult_children` が「動いている子」を出せるのは、走っている間に記録がある場合だけ
- `.pi/extensions/consult/tool/children.ts`: `latest`（子ごとに最後の行を取る）を足した
  - なぜ: 記録が 2 行になるため（上書きしない方針を選んだ）
- `.pi/extensions/consult/tool/consult.test.ts` / `child/spec.test.ts`: 道具の面（`action` / `USAGE` / `PARAMETERS`）の検査を外した
  - なぜ: `consult_children` へ移したため（検査の総数は `children.test.ts` の新しい分で増えている）

Commit: 7d7e61b
