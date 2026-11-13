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
      1. Commit `close.md` and `ROADMAP.md` in one, with `close: NNN-<suffix>'s close and roadmap`; `<suffix>` is the part right of the number in the cycle folder name, as in work step 2 (`261104-054-dev` gives `dev`). When the roadmap's status stays `wip`, commit `close.md` alone, with `close: NNN-<suffix>'s close`, and leave `ROADMAP.md` in the working tree.
      ```

   2. update: `### 8. Commit` の Note `The roadmap is written before it` に、wip のときはコミットに含めないことを足す。

      ```md
      - The roadmap is written before it: the roadmap step says so. When the item stays `wip`, it is written but stays out of this commit.
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
      - `Fixed` is a short description of the change and the commit it made, written only when the function or the change did not work, and it takes the place of the `done <commit>` a `## Triage` line carries. When there was no fix, write `なし`.
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

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: Fixed の形

- Findings:
- Unplanned:
- Commit:
- Stopped:

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
