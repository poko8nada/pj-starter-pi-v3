# ADR 031

## 01: 要約の生成に、独自の出力上限を持つか

### Context

- `/prune now` が `prune: failed (Summarization failed: generation hit the token cap and the summary is incomplete)` で失敗していた。
- `prune/ports.ts:77` が `reserveTokens = ceil(summaryTokens / 0.8)` を渡し、出力上限を 2,000 にしていた。
- 2,000 の出どころは ADR 029/03 で、Jev の state に入れる要約の長さとして owner が決めた数。
- 生成の枠として決めた数ではなく、中身の長さと生成の枠が 1 つの数に潰れていた。
- 実測では、失敗した会話の要約は `output: 1829` で、上限 2,000 に対して余白が 171 しかなかった。

### Decision

- Status: **accepted**
- Adopted:
  - 独自の出力上限を持たない。モデルの `maxTokens` まで使う。
- Options:
  - pi と同じ `reserveTokens: 16384` を持つ（16384 は会話の応答のために空ける枠で、prune の要約には会話の応答が無い）
  - 中身の長さの数（2,000）を生成の枠にも使う（今回の不具合そのもの）
  - 2,000 を 8,000 に上げる（上限 32k に対して 1/16 しか無く、上げる根拠が無い）
  - 要約専用に非リーズニングのモデルへ替える（owner が不要とした。opencode-go のチャットモデル 29 件はすべて `reasoning: true` で、このプロバイダには非リーズニングのモデルが無い）

### Research & Trial

- 裏の要約は表のエージェントのコンテキストを共有しない独立した呼び出し（`node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.js:497-509`）。
- prune の発動は `ratio` で決まり、`reserveTokens` の役割が無い（`…/docs/compaction.md:32-35` は `reserveTokens` を閾値の数とし、457 行目で出力上限にも効くと書く）。
- 思考と本文は同じ `max_tokens` を分け合う（`…/dist/api/openai-completions.js:726-729`）。
- 実測: 失敗した会話の prune パスは `usage: { input: 31780, output: 1829 }`（`.pi/agent/sessions/…/2026-10-22T00-51-13-171Z_01a16117-3493-7318-adfa-8033c15a4562.jsonl:702`）。

### Definition Change

- なし

## 02: Jev に渡す state をどう作るか

### Context

- state は `{ summary, candidates }` で、summary は pi のコンパクション書式（7 見出し）の出力。
- 7 見出しは「別の LLM が続きをやるためのチェックポイント」用で、Constraints / Key Decisions / Critical Context まで書かせる。
- 質問は「このツール結果は要約の話題にまだ関係あるか」で、判定の物差しは直近の要約。
- 候補は `toolName`、`args`（200 文字）、`chars` のみで、結果の本文は state に無い。
- 要約の対象は直近 50,000 トークンで、候補はその窓の外にある古い `toolResult`。要約には候補のことは書かれていない。
- 公開実装を調べたところ、「要約を state に入れて個別項目の関連度を聞く」型は他に例が無い。

### Decision

- Status: **accepted**
- Adopted:
  - 要約は pi の仕組み（`generateSummaryWithUsage`）のまま作り、Jev に渡す直前に Goal / Progress / Next Steps の節へ加工する。
  - 候補に結果の先頭 500 文字と末尾 500 文字の抜粋を足す。中央は省略の注記に置き換える。
  - バッチの件数は固定せず、32,000 から固定分を引いた残りで決める。
  - 落とす対象は古いツール結果のみとし、会話メッセージは判定の対象にしない。
  - 質問は「後に要るか」を聞く（`keep` / `drop`）。`verdicts` は `probabilities.keep` を読む。
- Options:
  - 要約を丸ごと渡す（判定に使わない節が入り、入力を 31% 減らす加工を捨てることになる）
  - prune 用の自前の書式にする（用途には合うが、pi の要約関数から降りる）
  - state を「goal ＋ 履歴の骨格」に変える（物差しを要約から goal に替える話で、owner の意図と違う。他実装の goal は直近 3 件の user から作るが、`ok, ok, ok` しか無い場合があり物差しにならない）
  - 抜粋を足さない（判定される側の中身が無く、コマンド文字列と文字数だけで判定することになる）
  - 古い会話メッセージも対象にする（成熟した実装は会話を落とさない。落とすと戻せず、外部計測では Jev の削除判定が AUC 0.544 の例がある）

### Research & Trial

- Jev の上限は per-question 32k / per-request 64k で、超過は `400 max_tokens_exceeded`（https://docs.typesafe.ai/models 、https://docs.typesafe.ai/api/errors ）。pi は長さを検査しない。
- state は object が推奨で、質問に必要な分だけ入れる（https://docs.typesafe.ai/concepts/state 、https://docs.typesafe.ai/concepts/how-to-build-with-system-one ）。
- 加工の実測: pi コンパクション v2 の要約は 3,948 → 1,214 トークン（31%）（`…_pj-starter-pi-v2--/2026-09-19T07-31-39-984Z_01a0b893…jsonl:2270` の要約を `~typesafe/jev-latest` で実測）。
- 抜粋の実測（固定分 1,953 トークン。要約 5,439 文字のときの値）:
  - 抜粋なし: 1 件 138、40 件 7,476（上限の 23%）、1 リクエスト $0.00032
  - 500 文字: 1 件 334、40 件 15,316（48%）、1 リクエスト $0.00065
  - 1,000 文字: 1 件 537、40 件 23,436（73%）、1 リクエスト $0.00099
  - 1 リクエストに入る件数: 217 / 89 / 55
  - 候補 260 件の 1 パス（7 バッチ）: $0.0022 / $0.0045 / $0.0069、約 4 秒
- 落とす対象の平均は 1,380 文字で、エラーは末尾に出る。`fast-compact` も先頭 1,000 ＋ 末尾 500 を残す（https://github.com/NodarDavituri/fast-compact ）。
- 2,000 の枠の下で採った要約（5,439 文字、1,679 トークン）は、枠の影響を受けた値なので判断の根拠にしない（owner の指摘）。
- pi 本体のコンパクション要約（同じ書式、上限 13,107）は、v3 と new-skill の 8 件が 58.6〜76.6KB の行で、50KB の read 上限を超えるため本文を読めない。v2 の 1 件は 13,181 文字で 3,948 トークン（入力 690,740 トークンの要約）。
- `fast-compact` は人と assistant の書いた文を不変とし、候補は古くて長いツール出力のみ。`jev-compactor` も落とす単位は tool_call と結果の組だけ（https://github.com/edwardyen724-g/jev-compactor ）。
- 第三者計測では、shipped questions の AUC が 0.544、256 件中 0 件しか 0.5 以上にならなかった回がある（https://stackness.dev/blog/can-a-decision-model-prune-your-coding-agent-s-context-what-fast-jev-compaction-keeps-costs-and-drop ）。
- 会話メッセージは、今は要約に潰れて渡っており、個別には渡っていない（`prune/judge.ts:31-48`）。
- 実測（実セッションの実物 7 件、`~typesafe/jev-latest`）: 「要約の話題に関係あるか」は yes 0.92〜0.94 で全件 keep。「後に要るか」は keep 0.06〜0.38。前者は判定として働かない。

### Definition Change

- なし

## 03: 分類器への指示と要約の言語

### Context

- `prune/judge.ts:43-44` の質問文と基準が日本語で、Jev にそのまま送られている。
- 要約は pi の英語プロンプトで作られ、実物も英語だった。
- 同じ経路に英語と日本語が混在していた。

### Decision

- Status: **accepted**
- Adopted:
  - 英語に揃える。質問文と基準を英語にし、要約にも英語を指示する。
- Options:
  - 日本語に揃える（会話が日本語なので内容を落とさない可能性はあるが、Jev の文書とモデルは英語前提）

### Research & Trial

- 40 問の質問コストは、日本語 3,139 / 英語 2,379 トークン（`~typesafe/jev-latest` で実測）。
- pi の要約プロンプトは英語（`…/dist/core/compaction/compaction.js:379-410`）。

### Definition Change

- なし

## 04: 失敗したパスをどう扱うか

### Context

- 失敗すると `failures` が増えるだけで、`lastPass` が更新されない。
- 冷却が効かないので、割合を超えている間は毎ターン要約を呼び直す。
- 失敗の理由も記録に残らず、`/prune now` の通知にしか出ない。

### Decision

- Status: **accepted**
- Adopted:
  - 失敗も冷却の起点にし、理由を記録に残す。
- Options:
  - 今のまま（毎ターン再試行し、理由は通知にだけ出す）

### Research & Trial

- `prune/plan.ts:41` の冷却は `lastPass.tokensBefore` のみを見るので、失敗では更新されない。
- 失敗したパスは何も積まれない（`prune/run.ts` の fail-open）。

### Definition Change

- なし
