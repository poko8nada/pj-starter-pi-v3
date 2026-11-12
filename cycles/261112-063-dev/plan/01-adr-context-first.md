# PLAN `adr-context-first`

- No: 01
- Place: worktree
- Boundary Plans: なし（`cut-granularity`、`verify-change` と並行して走る）

## Goal

adr スキルが、プリリサーチの間に全エントリの `Context` を書き、`adr.md` のエントリを `Context` から並べる

## Design

- Inside:
  - Modules: なし。`SKILL.md`、`adr.format.md`、`adr.mjs`、`index.test.ts` はいずれも 1 ファイルで完結しており、統合も分割もしない。
  - Dirs: なし。`.pi/skills/adr/` の位置は移動しない。
- Outside:
  - Extract: なし。`Context` を名指すのは `plan`、`close`、`affected` の手順だが、いずれもセクション名で読むだけで、共有する新しい文書やモジュールは作らない。
  - Colocate: なし。共通化をやめる文書はない。

## Files

```text
.pi/
  skills/
    adr/
      references/
        adr.format.md                update
      scripts/
        adr.mjs                      update
        index.test.ts                update
      SKILL.md                       update
```

## Slices

## 1.サイクル段階で Context を書く

`Context` を書く時点をエントリ段階からプリリサーチの待ち時間へ移し、エントリ段階から `Context` の手順を外す。

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. add: サイクル段階に `### 5. Context` を足し、プリリサーチの間に全エントリの `Context` を書く手順にする。

      ```md
      ### 5. Context

      Steps:

      1. Once the pre-research is running, write the items of every entry, in the split's order.
      2. Write what is settled at that point: the cycle's intent, the roadmap item, the split, and what the owner said.
      3. Write one entry's own items only: its premise, its constraint, its intent, and its question.
      4. Number them `C1`, `C2`, ... in each entry.

      View:

      | kind       | what it is                              |
      | ---------- | --------------------------------------- |
      | premise    | how it behaves now                      |
      | constraint | a limit, or what must not change        |
      | intent     | what the owner wants to become, and why |
      | question   | the entry's question                    |

      Note: do not leave out what is known. What is not known yet stays out, and the research or the discussion adds it.
      Note: write what is settled. A guess stays in the chat.
      ```

   2. update: `### 4. Pre-research` の手順 3 のあとに `Context` を書く手順を入れ、以降の手順の番号を 1 つずつ繰り下げる（旧 4、5 を 5、6 にする）。

      ```md
      1. Read the `Look it up` section of `references/tasks.md`.
      2. Propose the pre-research of every entry together. Name the entry, the type, the question, and what the answer decides.
      3. Run the approved ones in parallel. Group the entries whose question is the same, and run one `research` or `trial` subagent per group.
      4. Write every entry's `Context` in section 5 while they run.
      5. Wait for all of them, and write each result in its entry's `Research & Trial`.
      6. Show the owner a new entry found while the pre-research runs, and add it after the answer, with its `Context`.
      ```

   3. update: `## One entry` から `### 2. Context` のセクションを削り、残るセクションの番号を 1 つずつ詰める。並びは `1. Scope`、`2. The opening proposal`、`3. Discussion Loop`、`4. Decision`、`5. Definition`、`6. Affected`、`7. Next entry` になる。本文中のセクション番号の参照も詰める（`Discussion Loop` の `Notes` にある `as in section 3` を `as in section 2` にする）。
   4. update: `The opening proposal` の手順 1 を、`Context` と `Research & Trial` を読む形にする。

      ```md
      1. Read the entry's `Context` and its pre-research facts in `Research & Trial`, and what they decide.
      ```

   5. update: `Decision` の手順 2 を、採用しなかった `C` のラベルを外して `Context` に残す形にする。

      ```md
      2. When a `C` is not carried, explain it to the owner. When they say it no longer limits the entry, remove its `C<n>:` label and keep the item in `Context` as a plain bullet. Otherwise return to section 3.
      ```

   6. drop: `### 1. Scope` の Note の 1 行「A constraint the owner adds here goes to `Context` as a new item.」。

### Policy

- Allowed:
  - プリリサーチを待つ間に、全エントリの `Context` を書いてよい
  - 議論ループで `C<n>` を足してよい
- Forbidden:
  - 既存の `cycles/*/adr.md` を並べ替えない - 記録はその時点の形で残すため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `SKILL.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/adr/SKILL.md` の全体と、それが名指す `.pi/skills/adr/references/adr.format.md`、`.pi/skills/adr/references/tasks.md`、`.pi/skills/adr/scripts/index.mjs` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## 2.エントリのセクションを Context 先頭にする

`adr.md` のエントリのセクションを `Context`、`Research & Trial`、`Scope` の順に並べ、`Context` の定義を広げる。

### Types

なし

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. update: `## Shape` のフェンスのエントリを、`### Context`、`### Research & Trial`、`### Scope`、`### Decision`、`### Definition` の順に並べ替える。`#### Details` は `### Decision` の下に残す。
   2. update: `## Shape` の `### Context` の `- C2:` から「Who の要望、」を外し、制約だけにする。

      ```md
      - C2: <制約。上限、変えないと決めたこと>
      ```

   3. add: `## Shape` の `### Context` のプレースホルダの `- C2:` の次の行に、`intent` の行を足す。`question` はエントリの見出しにあるため、`C` の行は足さない。

      ```md
      - C3: <意図。オーナーの意図と意志>
      ```

   4. update: `## Entries` の並びの 1 行を、`- The sections run `Context`, `Research & Trial`, `Scope`, `Decision`, `Definition`.` にする。
   5. update: `## Context` の定義の 1 文を、事実だけでなくオーナーの意図と意志も入る形にする。

      ```md
      What limits the entry: a fact, and the owner's intent or will.
      ```

   6. add: `## Context` の箇条書きに、書く時点の規則を足す。

      ```md
      - The cycle stage writes the items while the pre-research runs; the discussion adds the rest.
      ```

   7. add: `## Context` の箇条書きの末尾に、採用しなかった項目のラベルを外す規則を足す。

      ```md
      - When the decision does not weigh an item, remove its `C<n>:` label and keep the item here as a plain bullet.
      ```

### Policy

- Forbidden:
  - 既存の `cycles/*/adr.md` を並べ替えない - 記録はその時点の形で残すため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `adr.format.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/adr/references/adr.format.md` の全体と、それが名指す `.pi/skills/adr/SKILL.md`、`.pi/skills/adr/scripts/adr.mjs`、`.pi/skills/adr/scripts/index.test.ts` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## 3.骨組みと検査を新しい並びにする

`adr.md` の骨組みを作る `entrySkeleton` と、その並びを固定している `index.test.ts` を新しい並びに合わせる。

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/adr.mjs`
   1. update: `entrySkeleton` が返す文字列のセクションを、`### Context`、`### Research & Trial`、`### Scope`、`### Decision`、`#### Details`、`### Definition` の順に並べ替える。
   2. update: `entrySkeleton` の `### Context` の `- C2:` から「Who の要望、」を外し、制約だけにする。
   3. add: `entrySkeleton` の `### Context` のプレースホルダの `- C2:` の次の行に、`intent` の行を足す。`question` はエントリの見出しにあるため、`C` の行は足さない。

      ```ts
      - C3: <意図。オーナーの意図と意志>
      ```
2. `.pi/skills/adr/scripts/index.test.ts`
   1. update: 骨組みの見出しを確かめるテストの `expected` 配列を、`## 01: <問い>`、`### Context`、`### Research & Trial`、`### Scope`、`### Decision`、`#### Details`、`### Definition` の順にする。事例の数は変えない。
      - `happy: 骨組みを作る → セクションが Context、Research & Trial、Scope、Decision、Details、Definition の順で出る`
   2. update: `checkEntry` 用の helper `entry` が組み立てる文字列を、同じ順のセクションにする。
   3. update: `--check` のテストの inline の ADR を、同じ順のセクションにする。
      - `happy: 新しい並びの ADR を --check に渡す → 抜けなしで通る`

### Policy

- Forbidden:
  - 並びを見る検査を `--check` に足さない - 読む側はセクション名で読むため
  - 既存の `cycles/*/adr.md` を並べ替えない - 記録はその時点の形で残すため

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/adr.mjs .pi/skills/adr/scripts/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/adr/scripts/adr.mjs` と `.pi/skills/adr/scripts/index.test.ts` の全体と、それが名指す `.pi/skills/adr/references/adr.format.md`、`.pi/skills/adr/scripts/cycle.mjs`、`.pi/skills/adr/scripts/index.mjs` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## Notes

### Slice 1: サイクル段階で Context を書く

- Findings: なし
- Unplanned: なし
- Commit: c7ac58f8619f2f7f698945e8b6e1fbd051b771f1
- Stopped:

### Slice 2: エントリのセクションを Context 先頭にする

- Findings: なし
- Unplanned: なし
- Commit: 39b2a8f8c4cf6b0cac9e92a4ada7da55b456c2b6
- Stopped:

### Slice 3: 骨組みと検査を新しい並びにする

- Findings: なし
- Unplanned: なし
- Commit: f3ab33ea3bf01f3197ccb2e5c4dcd1a01ef45129
- Stopped:

### Cleanup: 掃除なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
