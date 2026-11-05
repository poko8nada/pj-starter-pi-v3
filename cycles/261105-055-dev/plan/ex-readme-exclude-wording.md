# PLAN `ex-readme-exclude-wording`

- Place: worktree
- Boundary Plans: なし

## Files

```text
README.md         update
README.ja.md      update
```

## Slices

## 1.設定ファイルのパスまで書く

### Types

なし

### Steps

1. `README.md`:
   - update: japanese-check の 1 行を、`exclude` の後ろに設定ファイルのパスが続く形に書き換える（行は増やさない）。文は「counts, and skips the paths listed in `exclude` in `scripts/checks/ja-check.json`.」で終わる。
2. `README.ja.md`:
   - update: japanese-check の 1 行を、`exclude` の前に設定ファイルのパスが来る形に書き換える（行は増やさない）。文は「`scripts/checks/ja-check.json` の `exclude` に書いたパスは検査しない。」で終わる。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep` ツールで `scripts/checks/ja-check.json` を `README.md` と `README.ja.md` から検索し、それぞれ 1 件であることを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: なし

## Notes

### Slice 1: 設定ファイルのパスまで書く

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - c2ab8c8 consult(ex-readme-exclude-wording): add config path to exclude wording
- Stopped:
  - なし

## Work Review

### Round 1

- Stale: なし — 旧文言を残す箇所はなく、両 README の当該 1 行は新文言に置き換わり、scripts/checks/ja-check.mjs:5 と scripts/checks/ja-check.test.ts:6 の `exclude` の説明は判定 logic が不変のため古くならない（README.md:50、README.ja.md:50）。
- Unlisted: なし — `git diff eedf470d3da437cf392e0ed01e1c3b7c9aa8c5d5..HEAD` の変更は README.md:50 と README.ja.md:50 の各 1 行のみで、いずれも cycles/261105-055-dev/plan/ex-readme-exclude-wording.md:8-10 の Files が名指ししている。
- Gaps: なし — 文言の決定値は cycles/261105-055-dev/plan/ex-readme-exclude-wording.md:23-26 の Steps が定め、検証は同 plan の Verify（cycles/261105-055-dev/plan/ex-readme-exclude-wording.md:30-37）の grep 計数と全ファイル通読が担うため、Added: なしは文書のみの変更に妥当である。
- Unproven: なし — この plan はテストの Steps を持たず、Test cases（.pi/skills/plan/references/format.md:174-182）が求める事例も生じないため、壊しても緑のまま残るテストは存在しない。
- Noise: なし — テストの追加はなく、Types は cycles/261105-055-dev/plan/ex-readme-exclude-wording.md:17-19 のとおりなしであるため、型や制約が決める重複検査や魔法の数値・直書き文字列の事例は生じない。 exact な文面は plan が決めた値であり発見にしない。
- Doubts: なし

## Acceptance

- Ran:
  - `pnpm test:run` — 63 ファイル、761 件が通過。
  - `pnpm typecheck` — `root: ok`、`.pi: ok`。
  - `pnpm lint` と `pnpm format:check` — 通過。
  - `grep` ツールで `scripts/checks/ja-check.json` を `README.md` と `README.ja.md` から検索し、それぞれ 1 件（`README.md:50`、`README.ja.md:50`）であることを確かめた。
  - 差分を通読した。`README.md:50` と `README.ja.md:50` の各 1 行だけで、行は増えておらず、英語と日本語の文が同じ趣旨で、設定ファイルのパスを名指ししている。振る舞いを足さない文書だけの変更なので、壊して赤になるかの確認は行わない。
- Findings: なし
- Doubts: なし
