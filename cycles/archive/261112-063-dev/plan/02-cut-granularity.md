# PLAN `cut-granularity`

- No: 02
- Place: worktree
- Boundary Plans: なし（`adr-context-first`、`verify-change` と並行して走る）

## Goal

plan の cut が、共有の設定ファイルや文書を別のプランに切り出し、触る部分が違えば分割し、work のマージが両方の変更を残す

## Design

- Inside:
  - Modules: なし。`cut.md`、`plan/references/format.md`、`work/SKILL.md` はいずれも 1 ファイルで完結しており、統合も分割もしない。
  - Dirs: なし。`.pi/skills/plan/` と `.pi/skills/work/` の位置は動かさない。
- Outside:
  - Extract: なし。`### Present` の書式と `Why` の書き方は `cut.md` にあり、`work` は `Boundary Plans` を読むだけである。共有する新しい文書は作らない。
  - Colocate: なし。共通化をやめる文書はない。

## Files

```text
.pi/
  skills/
    plan/
      references/
        cut.md                      update
        format.md                   update
    work/
      SKILL.md                      update
```

## Slices

## 1.cut の粒度の規則を新しい形にする

`cut.md` の衝突する 4 つの規則を、共有の設定ファイルや文書の切り出しと、触る部分が違う場合の分割に合わせる。

### Types

なし

### Steps

1. `.pi/skills/plan/references/cut.md`
   1. update: `## Cut` の規則を、下のフェンスの形にする。4 つの規則を書き換え、共有の Path の規則を 5 行足す。

      ```md
      ## Cut

      What the work reads decides how the plans are cut.

      - Work that reads the same input stays in one plan, except the paths cut out below.
      - The input is the entries it decides, the sources it changes, and the outside it talks to.
      - The input is not every file the work happens to read.
      - One subagent continues the work, so nothing is read twice.
      - Split only when the inputs differ and the halves can run at once, or when the parts the two change are clearly different.
      - The paths are in the affected's `### Code`.
      - Order the two when one reads the output of the other, or when the cut takes out a shared path.
      - Whether a file exists, and its shape, is the plan's.
      - A description never merges before the behaviour it describes.
      - A path that more than one entry changes with the same change, and that is a `config` or a `doc`, is cut into a plan of its own. The entries change it the same way; a path they change differently is not cut out.
      - Where that plan sits is decided by what it holds: before, after, or between the others.
      - Two plans may touch the same path when the parts they change are clearly different.
      - The parts are read from the file, not from the affected: the plan step reads every path whole before it writes.
      - Two plans that change different parts of the same path may run at once. Their merge keeps both changes.
      ```

   2. update: `### Asking of a split` の 4 つの問いを、下のフェンスの形にする。

      ```md
      ### Asking of a split

      - Does a half leave the branch failing lint, typecheck or test? Then keep it together.
      - Is a half not usable on its own? Then keep it together.
      - Do the two touch the same path? Then they are one plan, unless the parts they change are clearly different.
      - Does a piece depend on more than one plan? Then it is its own plan, after all of them, or before them when it holds a shared `config` or `doc`.
      ```

   3. update: `### Present` の表の `ADR` と `Why` の 2 行を、共有の Path から切り出したプランを書ける形にする。

      ```text
      | `ADR` | the ADR entries this plan cuts, by number, comma-separated; a plan cut out of a shared path names every entry that path serves |
      | `Why` | what the `Kind` and the `Edge` say, and why they make these entries one plan; when two plans change the same path, the part each one changes |
      ```

   4. update: `### Present` のフェンスの例にある `- Why:` の 1 行を、同じ Path を分割するときは各部分を書く形にする。

      ```text
      - Why: <read the `Kind` and the `Edge` in the affected, and write what those say and why they make these entries one plan; when two plans change the same path, write the part each one changes; do not list the field names alone>
      ```

### Policy

- Allowed:
  - 1 つのプランが複数のエントリを名乗ってよい
  - 切り出したプランを、内容に応じて他のプランより前にも後にも置いてよい
- Forbidden:
  - 共有だけを理由にコード（`module`）を切り出さない - コードの変更が先になると機能が一時的に不全になりうるため
  - `affected/<NN>.md` に触る部分を持たせない - 位置はファイルを読んで判断するため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `cut.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/plan/references/cut.md` の全体と、それが名指す `.pi/skills/adr/references/affected.format.md`、`.pi/skills/plan/references/format.md`、`.pi/skills/plan/SKILL.md`、`.pi/skills/plan/scripts/plan.mjs` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## 2.プランの No は複数のエントリを名乗れる

`No` が複数のエントリ番号を持てることと、同じ番号が別のプランにも現れてよいことを書く。

### Types

なし

### Steps

1. `.pi/skills/plan/references/format.md`
   1. add: `## No` の箇条書きに、同じエントリ番号が別のプランにも現れてよいことを足す。

      ```md
      - The same entry number may appear in another plan.
      ```

### Policy

- Allowed:
  - 1 つのプランが複数のエントリを名乗ってよい
  - 同じエントリ番号が複数のプランに現れてよい
- Forbidden:
  - 過去のサイクルの plan を移行しない - 記録はその時点の形で残すため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `plan/references/format.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/plan/references/format.md` の全体と、それが名指す `.pi/skills/plan/scripts/plan.mjs`、`.pi/skills/plan/scripts/index.test.ts`、`.pi/skills/close/scripts/collect.mjs`、`.pi/skills/close/references/format.md` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## 3.同じファイルの別の部分を変える 2 つのプランのマージ

同じ Path の別の部分を変える 2 つのプランの変更が、マージで両方残ることを書く。

### Types

なし

### Steps

1. `.pi/skills/work/SKILL.md`
   1. update: `### 9. Merge` の手順 2 を、コンフリクトで両方の変更を残す形にする。

      ```md
      2. Resolve a conflict there. Two plans that changed different parts of the same path keep both changes. When keeping both would change either side's meaning, stop and ask the owner.
      ```

### Policy

- Forbidden:
  - 共有だけを理由にコード（`module`）を切り出さない - コードの変更が先になると機能が一時的に不全になりうるため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `work/SKILL.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/work/SKILL.md` の全体と、それが名指す `.pi/skills/plan/references/format.md`、`.pi/skills/plan/references/cut.md`、`.pi/skills/close/SKILL.md` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## Notes

### Slice 1: cut の粒度の規則を新しい形にする

- Findings: なし
- Unplanned: なし
- Commit: 47f9ced7d04864d5201b2c045d924b11ae483638
- Stopped:

### Slice 2: プランの No は複数のエントリを名乗れる

- Findings: なし
- Unplanned: `.pi/skills/plan/references/format.md` の `## No` の説明行が `The ADR entry the plan carries.` と単数で、`No` がエントリの並びを持つことと食い違っていた。同じ `## No` を触るこのスライスで `The ADR entries the plan carries.` に直した。
- Commit: cb58b1647e79fd16f38532355f8ff48d7b653b99
- Stopped:

### Slice 3: 同じファイルの別の部分を変える 2 つのプランのマージ

- Findings: なし
- Unplanned: なし
- Commit: f89ec53738e6ebf70c4dfc8aa74f65cf5fdfb949
- Stopped:

### Cleanup: 掃除なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし — `.pi/skills/plan/SKILL.md:59` の `Why` 要約、`## Where` の `Keep the files apart`、`.pi/skills/adr/references/affected.format.md`、`plan.mjs`、`close/scripts/collect.mjs` を確認。いずれも新規則と矛盾せず、冗長になった文もない。`cut.md:20` と `cut.md:22` の重なりは計画が決めた文言のため指摘にしない。
- Unlisted:
  - なし — 差分は `Files` の3件（`cut.md`、`format.md`、`work/SKILL.md`）と本計画mdの `## Notes` 記録のみ。`format.md:149` の単数→複数修正は同一ファイル同一セクションで `## Notes` の `Unplanned` に開示済みのため、新規ファイルの持ち込みではない。
- Gaps:
  - なし — `Goal` の3点（共有 `config`/`doc` の切り出し、触る部分が違えば分割、マージで両方残す）は `cut.md:18-22,28-29`、`format.md:153`、`work/SKILL.md:227` に対応し、各 `Verify` の読通しで手順をたどる形になっている。文書のみの変更で `Added: なし` は `design.md` の `## Test cases`（検査ファイルなし→検査手順なし）と整合し、実行可能な振る舞いの未検証はない。
- Policy:
  - なし — `Allowed`（複数エントリ名乗り `cut.md:56`・`format.md:151-153`、前後配置 `cut.md:19,29`）を妨げず、`Forbidden`（コードの切り出しなし `cut.md:18` が `config`/`doc` に限定、`affected` に触る部分を持たせない `cut.md:21`）を破らない。
- Unproven:
  - なし — 全スライス `Added: なし` で振る舞いを名乗る新規テストがない。`Always` の `pnpm test:run`・`typecheck`・`lint`・`format:check` は回帰止めであり、文書の正誤で赤くならないのは想定通り。
- Noise:
  - なし — 新規テストがなく、マジックナンバー・ハードコード文字列・型で済むケースの有無を問う対象がない。
- Doubts:
  - なし

### Round 2

- Stale:
  - なし — Round 1の指摘なしのため `fixed:` 行なし、確認対象なし。
- Unlisted:
  - なし — 同上。
- Gaps:
  - なし — 同上。
- Policy:
  - なし — 同上。
- Unproven:
  - なし — 同上。
- Noise:
  - なし — 同上。
- Doubts:
  - なし

## Acceptance

- Goal: 「plan の cut が、共有の設定ファイルや文書を別のプランに切り出し、触る部分が違えば分割し、work のマージが両方の変更を残す」を達成している。`cut.md` の `## Cut` と `### Asking of a split` が新しい 2 つの規則を持ち、`work/SKILL.md` の手順 2 が両方の変更を残す。
- Ran: `pnpm test:run`（65 files / 813 tests passed）、`pnpm typecheck`（root: ok、.pi: ok）、`pnpm lint`（指摘なし）、`pnpm format:check`（整形済み）。変更の適用後に `git diff 6a9dfab..HEAD -- .pi/skills` を読み、`cut.md`、`plan/references/format.md`、`work/SKILL.md` の用語（`config`、`doc`、`No`、`merge`）が揃っていることを確かめた。
- Findings: なし
- Doubts: なし
