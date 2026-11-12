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
  - 6132e4c consult(verify-change): verify by unit checks function and change
- Stopped:
  - なし

### Slice 2: Verified に Change を足す

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - e2854ed consult(verify-change): add Change to Verified
- Stopped:
  - なし

### Cleanup: 掃除なし

- Findings:
  - なし
- Unplanned:
  - なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/close/SKILL.md:3` — description が「verifies each Unit's function」のままで、変更の確認に触れていない。理由: 今回の変更で Verify は機能と変更の 2 部構成になったのに、冒頭の説明が機能のみのまま残り、読み手は Verify の範囲を機能だけと誤読しうるため。
    - fixed: description を「verifies each Unit's function and the change the plans made」に直した。
  - `.pi/skills/close/SKILL.md:10` — Procedure 冒頭の「asks the owner to verify each Unit's function」が機能のみのままで、変更の確認に触れていない。理由: 同上。`### 6. Verify, by Unit` と `format.md` が 2 部構成に変わったため、この一文は古いまま残っているため。
    - fixed: 冒頭文を「asks the owner to verify each Unit's function and the change the plans made」に直した。
- Unlisted:
  - なし — diff が変えた実装は `Files` が名指す 2 ファイル（`SKILL.md`、`references/format.md`）だけで、`plan md` の差分は `Notes` の記録追記のみのため、計画外の変更はないため。
- Gaps:
  - `.pi/skills/close/SKILL.md:117` と `.pi/skills/close/references/format.md:149` — `Fixed` は「the function or the change did not work」のときに書くのに対し、`_ex-change_` を作る手順 4 は「whose function does not work」のままで、変更が意図どおりでなかったときの直し方がない。理由: `Goal` の「変更も見て」に失敗した場合の扱いが欠けており、`Verify` の目視確認（番号・パス・名前・形）だけではこの手順の欠けを実際に動かして確かめないため。
    - fixed: 手順 4 を「Give a Unit whose function or change does not work」に直し、`format.md` の `Fixed`（function or the change）と一致させた。
- Policy:
  - なし — スライス 1 の `Allowed`（機能と変更の確認を 1 度に提示、`Plans:` の範囲）が手順 1〜2 の形で守られ、`Forbidden`（acceptance の繰り返し禁止は `How not to write this` で維持、`## Verified` に説明を書かずチャットで説明、`yolo` 不変）が守られ、スライス 2 の `Forbidden`（`collect.mjs` / `collect.test.ts` 不変、過去 `close.md` の移行なし）が守られているため。
- Unproven:
  - なし — 両スライスとも `Verify` の `Added: なし`（関連するテストがないことが明記）で、新規・更新のテストが存在せず、既存の `pnpm test:run` 等も今回の文書挙動を名指ししていないため、壊れても緑のまま残るテストはないため。
- Noise:
  - なし — 同上。`Added` のテスト自体がなく、型・スキーマ・DB 制約がすでに保証する前提を再現したテストも、マジックナンバーやハードコード文字列を持つケースも存在しないため。`design.md` の `## Test cases` に照らすべき対象がないため。
- Doubts:
  - `.pi/skills/close/SKILL.md:119` — 手順 6 の「Write what they answered in `## Verified`」が `Result:` と `Change:` の両方を書くことを明示していない。`Goal` の「結果を `Change:` に残す」を手順上で保証するために `Change:` を名指しすべきかは、`what they answered` を両方の回答と読めば足りるとも言えるため、修正が必要か所有者の判断が要る。

### Round 2

- Stale:
  - OK — `.pi/skills/close/SKILL.md:3` の description が「verifies each Unit's function and the change the plans made」になっており、Round 1 の指摘どおり機能と変更の 2 部構成と一致するため。
  - OK — `.pi/skills/close/SKILL.md:10` の冒頭文が「asks the owner to verify each Unit's function and the change the plans made」になっており、同上、Verify の範囲の誤読が解消されているため。
- Unlisted:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Gaps:
  - OK — `.pi/skills/close/SKILL.md:117` が「Give a Unit whose function or change does not work」になっており、`.pi/skills/close/references/format.md:149` の「written only when the function or the change did not work」と一致し、変更が意図どおりでない場合の直し方が確保されているため。
- Policy:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Unproven:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Noise:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Doubts:
  - なし — `fixed:` 3 件はいずれも文言どおりに直っており、所見に至らない疑義も残らなかったため。

## Acceptance

- Goal: 「close の Verify が、Unit の機能に加えて今サイクルの変更も見て、結果を `Change:` に残す」を達成している。`### 6. Verify, by Unit` の手順 1 と 2 が機能と変更の 2 つを 1 回で見せ、`## Verified` が `Result:` と `Change:` を並びに持つ。
- Ran: `pnpm test:run`（65 files / 813 tests passed）、`pnpm typecheck`（root: ok、.pi: ok）、`pnpm lint`（指摘なし）、`pnpm format:check`（整形済み）。変更の適用後に `git diff 6a9dfab..HEAD -- .pi/skills/close` を読み、`SKILL.md` と `references/format.md` の用語（機能と変更、`Fixed`、`Plans:`）が揃っていることを確かめた。
- Findings: なし
- Doubts: なし
