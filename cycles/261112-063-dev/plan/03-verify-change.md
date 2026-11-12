# PLAN `verify-change`

- No: 03
- Place: worktree
- Boundary Plans: なし（本プランは`adr-context-first`、`cut-granularity` と並行して走る）

## Goal

close の Verify が、Unit の機能に加えて今サイクルの変更も見て、結果を `Change:` に残す

## Design

- Inside:
  - Modules: なし。`close/SKILL.md` と `close/references/format.md` はいずれも 1 ファイルで完結しており、統合も分割もしない。
  - Dirs: なし。`.pi/skills/close/` の位置は動かさない。
- Outside:
  - Extract: なし。`## Verified` の形は `close/SKILL.md` と `close/references/format.md` が持つ。`collect.mjs` は `## Collected` だけを作り直して、`## Triage` 以降をそのまま残す。共有する新しい文書は作らない。
  - Colocate: なし。共通化をやめる文書はない。

## Files

```text
.pi/
  skills/
    close/
      references/
        format.md                   update
      SKILL.md                      update
```

## Slices

## 1.Verify が機能と変更の 2 つを見る

`### 6. Verify, by Unit` の手順を、Unit の機能と、その Unit を切ったプランが変えたところの 2 つを見る形にする。

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`
   1. update: `### 6. Verify, by Unit` の手順 1 を、Unit の機能と変更の 2 つを見る形にする。

      ```md
      1. Take one Unit at a time: propose how to check its function, and how to check what the plans that cut it changed — the command to run and what to see, or the place to read and what to look for, and the result that means it works.
      ```

   2. add: その直後に、変更を説明する手順を足し、以降の手順の番号を 1 つずつ繰り下げる（旧 2〜5 を 3〜6 にする）。

      ```md
      2. Explain what changed, in the same message: what every plan in `Plans:` changed, and where.
      ```

   3. update: `View:` の表の `a line under `Users can do`` の行を、機能と変更の 2 つを見る形にする。

      ```text
      | a line under `Users can do` | its function, and the change the plans that cut it made |
      ```

   4. update: `Notes:` の「The check is of the Unit's function, not of the change.」を、機能と変更の 2 つを見る形にする。

      ```text
      The check has two parts: the Unit's function, and the change the plans made.
      ```

   5. update: `## How not to write this` の該当行の末尾の句「the verification is of the Unit's function, in `## Verified`」を「the verification is of the Unit's function and the change, in `## Verified`」に置き換える。行の前の文は残す。

      ```text
      ... the verification is of the Unit's function and the change, in `## Verified`.
      ```

### Policy

- Allowed:
  - Unit ごとに、機能と変更の確認を 1 度に提示してよい
  - 変更の確認の範囲は、その Unit を名指すエントリを切ったプラン（`Plans:` のプラン）が変えたところとしてよい
- Forbidden:
  - acceptance のチェックをそのまま繰り返さない - 変更の確認は、変えたところと、それが意図どおりかを示すものであるため
  - 変更の説明を `## Verified` に書かない - 何が変わったかは plan md の `Steps` がすでに持っているため
  - `yolo` の close 段階を変えない - 検証をスキップしたままで、`## Verified` の形を写していないため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `close/SKILL.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/close/SKILL.md` の全体と、それが名指す `.pi/skills/close/references/format.md`、`.pi/skills/close/scripts/collect.mjs` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## 2.Verified に Change を足す

`## Verified` の Unit ごとの項目に `Change:` を足し、項目の説明を機能と変更の 2 つの確認に合わせる。

### Types

なし

### Steps

1. `.pi/skills/close/references/format.md`
   1. update: `## Verified` のフェンスの `- Result:` の下に、`- Change:` の行を足す。

      ```text
      - Change: <OK / 見つかったもの / しない — 理由>
      ```

   2. add: `### Fields` の `Result` の 2 行のあとに、`Change` の 2 行を足す。

      ```md
      - `Change` is `OK` when the owner checked what the plans changed and it is as intended, and what they found when it is not.
      - `Change` is `しない` with the reason on the same line when they will not check.
      ```

   3. update: `Fixed` の行の「written only when the function did not work」を、「written only when the function or the change did not work」にする。
   4. update: `### Fields` の「The check is of the Unit's function, not of the change.」を、機能と変更の 2 つを見る形にする。

      ```text
      The check has two parts: the Unit's function, and the change the plans made.
      ```

   5. update: `### Fields` の「The change is what the work looked at.」を、マージ後の Unit を見る形にする。

      ```text
      The acceptance saw the plan's work; this check sees the Unit after the merge.
      ```

### Policy

- Forbidden:
  - `collect.mjs` と `collect.test.ts` を変えない - `## Verified` を読まず書かず、テストもそれを検証していないため
  - 過去のサイクルの `close.md` を移行しない - 記録はその時点の形で残すため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `close/references/format.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/close/references/format.md` の全体と、それが名指す `.pi/skills/close/scripts/collect.mjs`、`.pi/skills/close/scripts/collect.test.ts`、`.pi/skills/close/SKILL.md` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## Notes

### Slice 1: Verify が機能と変更の 2 つを見る

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
- Stopped:
  - なし

### Slice 2: Verified に Change を足す

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: 掃除なし

- Findings:
- Unplanned:

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
