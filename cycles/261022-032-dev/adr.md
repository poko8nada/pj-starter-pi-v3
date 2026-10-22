# ADR 032

## 01: `/prune` のカードで、落とした量が分かるか

### Context

- `/prune` のカードは、折りたたみで `Compacted from 427,463 tokens` しか出さない。落とした件数と、減ったトークンは展開しないと見えない。
- 展開の最終行は `省略: 160 件 / 260,256 文字` で、コンテキストの話なのに文字数だけで出ている。
- 実セッションでは 182 件中 160 件を落とし、260,256 文字（65,064 トークン相当）を空けた。この効果が 1 画面で見えない。

### Decision

- Status: **accepted**
- Adopted:
  - 折りたたみは `Compacted from {前} → {後} tokens (ctrl+o to expand)` にする。前後の値は同じ見積もり（文字数 ÷ 4）で出す。
  - 展開は、見出し `**Compacted from {前} → {後} tokens**`、`省略: {件数} 件 / {トークン} トークン / {文字数} 文字`、`要約と判定: {秒} 秒`、空行、要約の順にする。
  - 記録（`PrunePass`）に、落とした結果のトークンを見積もって足す。
- Options:
  - 1 行に効果を全部足す（`427,463 → 362,399` と `160 件 / 65,064 トークン` を同じ行に並べる）：1 行が 80 文字前後になり、狭い端末で折り返す。
  - 2 行に分ける（前後の行と、件数の行）：折りたたみが 4 行になり、`[prune]` と空行で既に 2 行使っているぶん縦を取る。
  - 件数だけ足す（`160 dropped`）：減ったトークン量が展開しないと見えない。

### Scope

- 変更:
  - in: 折りたたみに、前後のトークンと件数を出す（behaviour）
  - in: 展開の最終行に、件数・トークン・文字数を出す（format）
  - in: 記録に落としたトークンを足す（naming）
  - in: `entry/render.ts` と `format/count.ts` の周辺を整える（refactor）
  - in: `README.md` と `DEFINITION.md` の記述を合わせる（prose）
  - out: 新しい依存（理由: 今の `pi-tui` の API で描ける）
- 品質:
  - out: 速度（理由: 換算は既存の見積もりで計算するだけで、速度は変わらない）
  - out: セキュリティ（理由: 変更なし）
  - out: 互換（理由: 古い記録はむしする）
  - out: エラー（理由: 新しい失敗経路を作らない。既存の fail-open のまま）
- 運用:
  - out: deploy（理由: 展開先は無い）
  - out: migration（理由: 古い記録はむしする）
  - out: logs and monitoring（理由: この entry では触らない）

### Research & Trial

- pi 本体のコンパクションカードは、折りたたみが `Compacted from {tokens} tokens (ctrl+o to expand)`、展開が `**Compacted from {tokens} tokens**` と要約（`node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/components/compaction-summary-message.js:37,43`）。`context-prune` はこれに 2 行を足している。
- 前後の値は同じ見積もり（文字数 ÷ 4）。実セッションでは 427,463 − 65,064 = 362,399 で、プロバイダの実測は 379,860（38%）だった。差は prune が数えない system prompt とツール定義（約 17,000 トークン）。

### Definition

- `Unit.context-prune`(kept): 古いツール結果を文脈から外す機能は変わらず、変わるのは結果の見せ方だけ。

## 02: `intent-router` を削除するか

### Context

- owner が、同じサイクルで `.pi/extensions/intent-router/` を消したい。
- 参照は、拡張の中、`DEFINITION.md:28`、`definition/rules.md:46`、`README.md:13`、`README.ja.md:13` にある。スキルからは参照されていない。
- 拡張は設定（`settings.json`）と日ごとの記録（`logs/*.jsonl`）を持つ。

### Decision

- Status: **accepted**
- Adopted:
  - `.pi/extensions/intent-router/` を、設定と `logs/*.jsonl` ごと削除する。
  - `DEFINITION.md` から `Unit.intent-router` を外し、`definition/rules.md` と 2 つの README の記述を消す。
- Options:
  - `cycles/archive/` に写してから削除する（記録はサイクルに残っており、複製は要らない）
  - 残して読み込ませない（設定と読み込みの口が残り、掃除にならない）

### Scope

- 変更:
  - in: `.pi/extensions/intent-router/` を削除する
  - in: `DEFINITION.md`、`definition/rules.md`、`README.md`、`README.ja.md` の参照を消す（prose）
  - out: 他の拡張の変更（理由: 参照が無い）
- 品質:
  - out: 互換（理由: 旧設定の移行はしない。消えた拡張の設定は読まれない）
  - out: 速度（理由: 読み込みが 1 つ減るだけで、測る意味がない）
  - out: セキュリティ（理由: 変更なし）
- 運用:
  - in: `.pi/extensions/intent-router/logs/*.jsonl` を削除する
  - out: deploy（理由: 展開先は無い）
  - out: monitoring（理由: 無くなる拡張の監視は無い）

### Research & Trial

- 参照は 5 か所（拡張の中を除く）。`.pi/skills/` からの参照は無い（`grep -rln intent-router --exclude-dir=node_modules --exclude-dir=.git`）。
- 削除で動かなくなる拡張は無い（他の拡張からの呼び出しが無い）。

### Definition

- `Unit.intent-router`(dropped)
