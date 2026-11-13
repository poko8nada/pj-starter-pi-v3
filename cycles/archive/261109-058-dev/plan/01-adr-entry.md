# PLAN `adr-entry`

- No: 01
- Place: worktree
- Boundary Plans: plan-work（plan-work の後に実行する）

## Goal

ADR のエントリが、`Scope` を先頭に置き、`In`/`Out` の `Scope`、`Adopted` の一言、`Allowed`/`Forbidden` の `Policy` で書けるようになる。

## Design

- Inside:
  - Modules: なし。`adr` の 3 ファイル、`adr.mjs`、`index.test.ts` はそれぞれひとまとまりのため、統合も分割もしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md    update
      references/
        adr.format.md    update
        tasks.md    update
      scripts/
        adr.mjs    update
        index.test.ts    update
    plan/
      SKILL.md
      references/
        tasks.md
        format.md
```

## Slices

## 1.adr-entry

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `One entry` の順序を `Scope` → `Context` → `Pre-research` → `Discussion Loop` → `Decision` → `Definition` → `Affected` → `Next entry` にする。
   2. drop: `Scope` の `View` の `Axis` の 3 軸。
   3. update: `Scope` の `View` を kind と説明の 2 列の表にし、13 kind（behaviour, refactor, dependency, naming, format, prose, speed, security, compatibility, errors, deploy, migration, logs and monitoring）を並べ、出力を `In:`/`Out:` にする。最初の推量と `Discussion Loop` での書き換えを許す。
   4. drop: `Adopted` の `Keep` と `Denied`。
   5. update: `Decision` の `Adopted` をエントリ全体の一言にし、`Policy` の `Allowed`/`Forbidden` を置く。
   6. update: `Context` の手順を `Scope` の合意後にし、`Context` を `Scope` の後に置く。
   7. update: `How not to write this` に、`Keep`/`Denied` を新しい形に残さないことを足す。
2. `.pi/skills/adr/references/adr.format.md`
   1. update: `Shape` を `Scope`、`Context`、`Research & Trial`、`Decision`、`Definition` の順にし、`Scope` の `In:`/`Out:`、`Decision` の `Adopted` の一言と `Policy` の `Allowed`/`Forbidden` を入れる。

      ```md
      ### Scope

      - In:
        - <kind>: <何をするか>
      - Out:
        - <kind>: <何をしないか>（理由）

      ### Context

      - C1: <前提。いまの振る舞い>
      - C2: <制約。Who の要望、上限、変えないと決めたこと>

      ### Research & Trial

      - F1 (C1): <事実>。出所。

      ### Decision

      - Status: <決定の前は空。**accepted** | **rejected**（理由）>
      - Adopted: <エントリ全体として何がどうなるか>
        - Add:
          - <増えるもの>（C1, F2）
        - Update:
          - <変わるもの（何がどうなるか）>（C1）
        - Drop:
          - <消えるもの>（F1）
      - Policy:
        - Allowed:
          - <して良いこと>（C2, F2）
        - Forbidden:
          - <明示的にしてはいけないこと> - <しない理由>（C2, F2）

      ### Definition

      - `Unit.<name>`(updated): <新しい行>
      - `Unit.<name>`(kept): <その行が動かない理由>
      ```

   2. drop: `## Scope` の 3 軸と `## Decision` の `Keep`/`Denied`。
   3. update: `## Scope` を 2 列の `View` と `In`/`Out` の出力にし、13 kind を `SKILL.md` の `View` と同じ並びで置き、`## Decision` の `Adopted` の一言と `Policy` の `Allowed`/`Forbidden` にする。
   4. update: `## Entries`、`## Context`、`## Research & Trial`、`## Definition` の順と説明を新しい `Shape` に合わせる。
3. `.pi/skills/adr/references/tasks.md`
   1. update: `Look at the affected` の 1 と 2 を、`Scope` の `In`、`Adopted`、`Policy`（`Forbidden` を飛ばす）、`Definition` を読む形にする。
4. `.pi/skills/adr/scripts/adr.mjs`
   1. drop: `entrySkeleton` の `Keep`/`Denied` と、`Scope` の `Change`/`Quality`/`Operation` の軸。
   2. update: `entrySkeleton` を、`Scope`（`In:`/`Out:`）、`Context`、`Research & Trial`、`Decision`（`Adopted` の一言と `Policy` の `Allowed`/`Forbidden`）、`Definition` の順にする。
5. `.pi/skills/adr/scripts/index.test.ts`
   1. drop: `Keep:`/`Denied:` の断言と、`Change`/`Quality`/`Operation` の断言。
   2. update: (happy) the skeleton's headings are Scope, Context, Research & Trial, Decision, Definition
   3. update: (happy) the skeleton has Policy, Allowed, Forbidden
   4. update: (happy) checkEntry accepts a Decision with Policy

### Policy

- Allowed:
  - `Scope` を `Context` の前に置く。
  - 最初の `Scope` は推量でよい。
  - `Discussion Loop` で `Scope` を書き換えてよい。
  - `Scope` の `In`/`Out` の kind は、表の 13 kind から選ぶ。
  - `Adopted` はエントリ全体の一言にする。
  - `Policy` の `Allowed`/`Forbidden` の各行に `C`/`F` を付ける。
- Forbidden:
  - `Keep` と `Denied` を新しい形に残すこと。
  - `Axis` の 3 軸を `Scope` の `View` に残すこと。
  - `Scope` を `Context` の後に置くこと。
  - 現在の ADR のエントリ 02・03 を新しい形に書き換えること。
  - `checkEntry` の `Decision` の `C`/`F` の読み方を変えること。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/SKILL.md .pi/skills/adr/references/adr.format.md .pi/skills/adr/references/tasks.md .pi/skills/adr/scripts/adr.mjs .pi/skills/adr/scripts/index.test.ts`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 5 ファイルと、`affected.md` が名指す `.pi/skills/plan/SKILL.md`、`.pi/skills/plan/references/tasks.md`、`.pi/skills/plan/references/format.md` を読み、読む者の順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added:
  - other: `node .pi/skills/adr/scripts/index.mjs --check` が通り、`node scripts/checks/ja-check.mjs cycles/261109-058-dev/adr.md` が error 0、warn 0 である。

## Notes

### Slice 1: adr-entry

- Findings:
  - 追加検査の 2 本（`node .pi/skills/adr/scripts/index.mjs --check` と `node scripts/checks/ja-check.mjs cycles/261109-058-dev/adr.md`）を直接実行できず、59 件の試験（新形での `--check` 起動を含む）の通過と hook の `ja-check` の通過で代え、実ファイルでの実行は所有者の shell に残す。
    - left: 作業 shell が素の `node` 実行を禁じ、`cycles/261109-058-dev/adr.md` はこのスライスの `Files` 外で触れないため。
- Unplanned:
  - `.pi/skills/adr/scripts/adr.mjs` の `checkEntry` の説明が `Denied` に触れていたため `Policy` に直し、旧形の名残を消した。
  - `.pi/skills/adr/references/tasks.md` の手順 14 の `Scope` の `in` を新形の `In` に直し、表記を合わせた。
  - `.pi/skills/adr/scripts/index.test.ts` の `--check` 試験の fixture が旧形だったため新形（`Scope` 先頭、`In`、`Adopted` の一言、`Policy`）に直し、試験が旧形を教えないようにした。
  - `.pi/skills/adr/scripts/index.test.ts` の整形を `oxfmt` で直し、`pnpm format:check` を通した。
- Commit: 50baa5ec1a361b3b9cc2c9470353ced21edbe68e
- Stopped:

### Cleanup: テストの掃除

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale:
  - なし — `.pi/skills/adr/SKILL.md`、`.pi/skills/adr/references/adr.format.md`、`.pi/skills/adr/references/tasks.md`、`.pi/skills/adr/scripts/adr.mjs` の旧形語（`Keep`/`Denied`、`Change`/`Quality`/`Operation`、`Axis`、`in —`）を確かめ、残存が意図した禁止文のみであるため stale はない。
- Unlisted:
  - なし — `git diff b55d116..HEAD --stat` が `Files` の5件のみを示し、計画外の変更がないため unlisted はない。
- Gaps:
  - なし — `Steps` の全 substep と `Policy` の禁止5件を diff と突き合わせ、`Scope` 先頭・`In`/`Out`・`Adopted` 一言・`Policy`・13 kind 同順・`checkEntry` の `C`/`F` 読み不変がいずれも満たされ、`Goal` の4要素に穴がないため gaps はない。
- Unproven:
  - なし — 見出し順・`In`/`Out`・`Policy`・`Policy` 付き `checkEntry` の各試験が対象を壊せば赤になることを確かめたため unproven はない。
- Noise:
  - なし — 断言値は計画または ADR が決めた仕様であり、型が保証する前提の再現や魔数・ハードコード文字列の独自断言がないため noise はない。
- Doubts:
  - 追加検査2本の直接実行が `cycles/261109-058-dev/plan/01-adr-entry.md` の `## Notes` の `left` として所有者の shell に残るため、受入前に所有者の shell での実行結果の確認が要る。

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
  - `node .pi/skills/adr/scripts/index.mjs --check`: checked `cycles/261109-058-dev/adr.md`。
  - `node scripts/checks/ja-check.mjs cycles/261109-058-dev/adr.md`: error 0、warn 0。
  - `## Notes` の 59 件の試験通過と hook の `ja-check` 通過の記録を確認。
- Findings:
  - なし。`## Notes` の `left` の 2 本は直接実行で閉じた。
- Doubts:
  - なし。
