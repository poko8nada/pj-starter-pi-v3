# PLAN `close-commit-and-fixed`

- No: 05, 06
- Place: worktree
- Boundary Plans: なし

## Goal

roadmap の status が wip のとき、close のコミットが `close.md` だけを含み、`## Verified` の `Fixed` が変更内容と commit を持つようになる

## Design

- Inside:
  - Modules: なし（`close/SKILL.md` の `### 8.` と `### 6.`、`close/references/format.md` の `Fixed` を書き換えるだけで、ファイルやモジュールの統合・分割はない）
  - Dirs: なし（ディレクトリの統合・分割・移動はない）
- Outside:
  - Extract: なし（ほかの文書と共有する新しいモジュールはない）
  - Colocate: なし（コロケーションに変えるモジュールはない）

## Files

```text
.pi/
  extensions/
    consult/
      sub/
        guard.test.ts
  skills/
    adr/
      scripts/
        cycle.mjs
        index.test.ts
      SKILL.md
    close/
      references/
        format.md              update
      scripts/
        collect.mjs
        collect.test.ts
      SKILL.md                 update
    work/
      SKILL.md
    yolo/
      SKILL.md
rules/
  definition.format.md
  roadmap.md
scripts/
  checks/
    ja-check.json
    ja-check.test.ts
    scopes.json
  product-ready/
    index.test.ts
    targets.mjs
    targets.test.ts
AGENTS.md
lefthook.yaml
README.ja.md
README.md
ROADMAP.md
```

## Slices

## 1.wip のときの close のコミット

roadmap が wip のときは、close のコミットに `close.md` だけを含める。

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`
   1. update: `### 8. Commit` の Step 1 に、wip のときは `close.md` だけをコミットし、`ROADMAP.md` を作業ツリーに残す条件と、そのときのメッセージを足す。

      ```md
      1. Commit `close.md` and `ROADMAP.md` in one, with `close: NNN-<suffix>'s close and roadmap`; `<suffix>` is the part right of the number in the cycle folder name, as in work step 2 (`261104-054-dev` gives `dev`). When the roadmap's status is `wip`, commit `close.md` alone, with `close: NNN-<suffix>'s close`, and leave `ROADMAP.md` in the working tree.
      ```

   2. update: `### 8. Commit` の Note `The roadmap is written before it` に、wip のときはコミットに含めないことを足す。

      ```md
      - The roadmap is written before it: the roadmap step says so. When the item is `wip`, it is written but stays out of this commit.
      ```

2. Outside: `git commit`
   1. update: wip のときは `close: NNN-<suffix>'s close` をメッセージにし、`close.md` だけを渡す。

3. Outside: `lefthook` pre-commit（staged files だけを検査する）
   1. update: wip のときは `ROADMAP.md` が staged でないため、pre-commit は `close.md` だけを見る。

### Policy

- Allowed:
  - roadmap が done のときは、`close.md` と `ROADMAP.md` を1つにまとめてコミットする
- Forbidden:
  - roadmap が wip のとき、`ROADMAP.md` を close のコミットに含めない - wip の roadmap を close の記録と一緒に確定させない
  - `base(ex-change): ...` のコミットを close のコミットに含めない - エクスチェンジは別のコミットである

### Verify

- Always:
  - 関連テスト（`pnpm test:related .pi/skills/close/SKILL.md`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.Fixed の形

`## Verified` の `Fixed` を、変更内容と commit を持つ形にする。

### Types

なし（`Fixed` の行は文書の書式で、TS の宣言ではない。`Steps` のフェンスに置く）

### Steps

1. `.pi/skills/close/references/format.md`
   1. update: `## Shape` の `Fixed` の行を、変更内容と commit を持つ形にする。

      ```md
      - Fixed: <変更内容を簡潔に説明> (<commit>)
      ```

   2. update: `### Fields` の `Fixed` の説明を、変更内容と commit を持つ形にする。

      ```md
      - `Fixed` is a short description of the change and the commit it made, or `なし` when there was no fix, and it takes the place of the `done <commit>` a `## Triage` line carries.
      ```

2. `.pi/skills/close/SKILL.md`
   1. update: `### 6.` の step 4 を、`Fixed` に変更内容と commit を書く形にする。

      ```md
      4. Give a Unit whose function or change does not work an `_ex-change_`: make it in the base, commit it as `base(ex-change): <subject>`, and write a short description of the change and the commit in `## Verified`'s `Fixed`.
      ```

   2. update: `### 6.` の Note `The Fixed is the _ex-change_ and the commit` を、変更内容と commit に合わせる。

      ```md
      - The `Fixed` is a short description of the change and the commit.
      ```

### Policy

- Allowed:
  - `Fixed` は、Unit の機能か、plans が変えたものが動かなかったときにだけ書く
  - commit のハッシュを残す
- Forbidden:
  - `Fixed` を `_ex-change_` と commit だけにしない - 何を直したかが分からない
  - 過去の `close.md` の `Fixed` を書き換えない - 記録はその時点の形で残す
  - `## Triage` の `done <commit>` の役割を変えない - `Fixed` はその代わりとして書く

### Verify

- Always:
  - 関連テスト（`pnpm test:related .pi/skills/close/references/format.md .pi/skills/close/SKILL.md`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: wip のときの close のコミット

- Findings: なし
- Unplanned: なし
- Commit: b2c18de
- Stopped: なし

### Slice 2: Fixed の形

- Findings: なし
- Unplanned: なし
- Commit: 829ede7
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/close/references/format.md:149` — 足した `When there was no fix, write なし.` が、同じ行に残る `written only when the function or the change did not work` を古くしている。実際の `close.md` は `Result: OK` の Unit にも `Fixed: なし` を書いており（`cycles/261112-064-dev/close.md:31-33`）、修正が要らなかった Unit に `なし` を書くのか行ごと書かないのかが読者に決められない。`なし` を書くと決めた以上、前半の「修正があったときだけ書く」はもう規則を言っていない。理由: 同じ行の中で「書くのは壊れたときだけ」と「無ければ `なし` を書く」が並び、`## Shape`（`:47`）も `なし` を示さないため、書く側が二通りに読む。直すなら「修正があったときは変更内容と commit を持ち、無ければ `なし`」の一つの規則にまとめる。
    - fixed: `.pi/skills/close/references/format.md` の `Fixed` を「変更内容と commit、無ければ `なし`」の一つの規則にまとめ、「written only when the function or the change did not work」を消した。
- Unlisted: なし
- Gaps:
  - `.pi/skills/close/SKILL.md:162`（同じ語を使う `:168` の Note も） — 条件が `stays wip`（close の前から wip だったときに限る）で、ADR 05 の C4「status が wip のとき」より狭い。`### 7. Roadmap` の step 3 は done と言われなければ `wip` を書くので、close の前が `_todo_` だった項目は close の途中で `wip` になり、条件が偽になって `ROADMAP.md` が close のコミットに混ざる。本サイクルの `ROADMAP.md:25` の 031 は実際に `_todo_` のままで（adr の `### 2. Roadmap` が `wip` にしていない）、close で `wip` になる側である。理由: この分かれ道が偽になると Goal の「wip のとき close のコミットが `close.md` だけを含む」を外し、しかも `Verify` の目視では踏まれない。直すなら close が書いた後の status を条件にする。
    - fixed: `.pi/skills/close/SKILL.md` の条件を close 後の status を見る `is wip` に変え、`:162` の Step 1 と `:168` の Note の両方を直した。
- Policy: なし
- Unproven: なし
- Noise: なし
- Doubts:
  - wip で close した後に作業ツリーへ残る `ROADMAP.md` を、どのコミットが持つのかがどのスキルにも書かれていない。`### 9. Proposed` は「次サイクルのファイルはコミットしない」、adr の `### 2. Roadmap` と work の Step 1 も `ROADMAP.md` を名指さない（過去は `1dc4af8 update: roadmap` のように手でコミットしている）。wip のまま close したサイクルの `cycles` 追記が未コミットで残る運用でよいかは、オーナーの判断が要る。

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
