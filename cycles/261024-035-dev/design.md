# DESIGN 035

## Affected

### 01: テストの指針を、プランスキルのどこに、どんな形で入れるか

- 結果を読む:
  - `.pi/skills/work/SKILL.md` — 受入が `Verify` を走らせ、統合スライスを含めると書いてある（24、67 行）。
  - `.pi/skills/work/references/tasks.md` — `code` のサブエージェントが `Steps` と `Verify` を読み、`review` が `### Verify` を読む（10、34 行）。
  - `.pi/skills/yolo/SKILL.md` — plan の段に `the cases` がある（32 行）。
  - `README.md` — plan の段を 1 行で説明する（64 行）。検査の名前が変わらないので、動かない。
  - `README.ja.md` — 同じ行の日本語（64 行）。動かない。
  - `.pi/skills/design/SKILL.md` — plan に渡すものを「types, steps, checks」と書く（88 行）。名前が変わらないので、動かない。
- 検査する:
  - `pnpm format:check` — `*.md` を整形の対象にしている（`lefthook.yaml` 8 行）。
  - `read` — サブエージェントが新しい `format.md` と、それに沿った plan md を読み、形が揃っているかを報告する。
  - `なし` — テストも型も、スキルの md を読まない。
- 生成される:
  - `なし`

### 02: クローズの最後に、オーナーの確認をどこまで求めるか

- 結果を読む:
  - `.pi/skills/yolo/SKILL.md` — close の段に、飛ばすものを列挙してある（49 行）。
  - `.pi/skills/propose/SKILL.md` — `close.md` の `Triage` の `proposed` を読む（22 行）。`## Triage` の後ろに足すので、動かない。
  - `.pi/skills/close/scripts/collect.mjs` — `## Triage` 以降をそのまま残す（317〜322、369 行）。記録をその後ろに置けば、変えなくてよい。
  - `README.md` — close の段を 1 行で説明する（66 行）。段の要約で、確認の手順は元から書いていないので、動かない。
  - `README.ja.md` — 同じ行の日本語（66 行）。動かない。
- 検査する:
  - `pnpm format:check` — `*.md`。
  - `look` — オーナーが各スライスの後に close の手順と `close.md` の形を読み、確認の聞き方が意図通りかを答える。
  - `なし` — テストも型も、スキルの md を読まない。
- 生成される:
  - `なし`

### 03: スキルとフォーマットを読み直して見つけた不備を、このサイクルで直すか

- なし

## External

### 01: テストの指針を、プランスキルのどこに、どんな形で入れるか

- `@earendil-works/pi-coding-agent` のスキル仕様（`docs/skills.md`）— スキルの md の形はそのまま使う。`name`、`description`、`references/` の道を変えない。
  - Contract: `references/` は `SKILL.md` からの相対の道で読まれる。`description` は 1024 文字まで。
- `cmux-browser` スキル（`~/.pi/agent/skills/cmux-browser/SKILL.md`）— フロントの確認の行が触れる。
  - Contract: 20 行はエージェントが dev サーバーを立てることを禁じている。プランスキルに書く行は、これと食い違う。外部のスキルなので、この plan では変えない。

### 02: クローズの最後に、オーナーの確認をどこまで求めるか

- `なし`

### 03: スキルとフォーマットを読み直して見つけた不備を、このサイクルで直すか

- `なし`

## `test-guideline`

### ADR & Where

- No: 01, 02, 03
- Why: 2 つの entry は `yolo` と `README` の同じファイルに触れるので、1 つの plan にまとめる。待つ plan は無い。
- Where: base（オーナーが各スライスを見て、OK を返す）

### Summary

- プランスキルから、テストを実装の証明にする形を外す。`Verify` を「常に確認するもの」と「実装内容で足すもの」に分け、テストのケースはステップに書く。`Kinds`、`Cases`、`Walk` と統合スライスを消し、`Files` にファイルの構造の作り方を足す。
- `work` の受入から統合スライスを外し、レビューの観点を、テストのステップの妥当性と `Verify` の妥当性に向ける。
- クローズの最後に、Unit ごとに、動かすか目視で見るかを聞く手順を足す。記録は close.md の最後に Unit ごとに置く。

### Paths

- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/plan/references/tasks.md`
- `.pi/skills/work/SKILL.md`
- `.pi/skills/work/references/tasks.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/design/references/tasks.md`
- `.pi/skills/propose/SKILL.md`
- `README.md`
- `README.ja.md`
- `.pi/skills/yolo/SKILL.md`

### Boundary

- Plans: なし
- External:
  - `pi-coding-agent` のスキル仕様: スキルの md の形と、`references/` の道はそのまま使う。
    - Contract: `references/` は `SKILL.md` からの相対の道で読まれる。`description` は 1024 文字まで。
  - `cmux-browser` スキル: フロントの確認の行が、その 20 行と食い違う。
    - Contract: 食い違いは既知で、外部のスキルはこの plan では変えない。
