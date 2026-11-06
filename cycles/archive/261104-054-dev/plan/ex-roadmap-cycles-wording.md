# PLAN `ex-roadmap-cycles-wording`

- Place: base
- Boundary Plans: なし（`cycle-rules` のマージ後に `rules/roadmap.md` の 1 行だけ直す）

## Files

```text
rules/roadmap.md              update
```

## Slices

## 1.cycles の行にある重複した句

### Types

```ts
なし;
```

### Steps

1. `rules/roadmap.md`:
   - update: `cycles` の行に足した句「and separated by `,` when more than one is present」を「and separated by `,`」に戻し、もとからある「More than one is allowed.」を残す。行を「区切り方は `,`」と「複数あってよい」の2文に分け、`NNN-m`・`NNN-d`・`NNN-f` の形と接尾辞の頭文字の規則はその後ろに続ける。この形と規則は変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `git diff` を読み、`when more than one is present` を消したことと、`More than one is allowed.`・`NNN-m`・`NNN-d`・`NNN-f` と接尾辞の頭文字の規則を残したことを確かめる。
  - 変更したファイルを変更前と見比べて読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: base — オーナーが差分を読んで OK する。

## Notes

### Slice 1: cycles の行にある重複した句

- Findings: なし
- Unplanned: なし
- Commit: `97ed552`
- Stopped: なし

## Work Review

### Round 1

- Stale: なし — `rules/roadmap.md:12` の変更が古くする文書・コメント・テストはない。残る `when more than one is present` の言及は履歴と記録だけで現行の規則ではないため。理由：`cycles/261104-054-dev/plan/02-cycle-rules.md:143` の疑義と `cycles/261104-054-dev/close.md:54` の Fact は当時の判断と残りの説明であり、ADR 03 の Scope（過去の記録は書き換えない）に沿い対象外である。
- Unlisted: なし — このプランの変更は `rules/roadmap.md:12` の1行だけで Steps の指示どおりである。理由：`git diff 8c1b195..HEAD` の7ファイル中、残り6ファイルは別プラン（ex-review-and-cases、ex-plan-cut）の所掌であり、このプランの Steps が名指ししないのは当然である。自プランmdの Notes の「なし」埋めは定型の進捗記録で Files に数えない通例のため finding にしない。
- Gaps: なし — ADR 03 の Adopted と残り6の Then をすべて運んでいる。理由：Then の「重複を1つにまとめ、`NNN-m`・`NNN-d`・`NNN-f` と接尾辞の頭文字、`close` が番号を足すことを保つ」に対し、差分は `when more than one is present` だけを消し、`More than one is allowed.`・`NNN-m`・`NNN-d`・`NNN-f`・接尾辞規則・`which close appends` をすべて残した。
- Unproven: なし — Verify の行為固有の行は行為を戻すと赤になる。理由：`git diff` で削除と残存を確かめる行と変更前と並べる通読は、文言を戻せば失敗する。`pnpm test:run`・`typecheck`・`lint`・`format:check` は定型の Always であり、1行の文書整理に自動テストの追加は影響が軽微で不要のため不足としない。
- Noise: なし — 重複・名付け・分岐のいずれも残していない。理由：残る2文（区切りはカンマ／複数は可）は Then と Steps が決めた形どおりの重複解消であり、新しい名前や分岐を足していない。
- Doubts: なし — 直すかオーナー判断が要る疑いは残らなかった。理由：単数時の読み方や他プラン分の扱いは Then・Steps・所掌で解決済みであり、自分で解決した疑いは書かない。

## Acceptance

- Ran: `pnpm test:run`（63 ファイル、756 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`git diff 8c1b195..HEAD` の読み（`when more than one is present` を消した行と、`More than one is allowed.`・`NNN-m`・`NNN-d`・`NNN-f`・接尾辞の頭文字を保った行）、`rules/roadmap.md` の `cycles` の行の読み。
- Findings: なし
- Doubts: なし
