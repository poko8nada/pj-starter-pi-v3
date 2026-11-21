# PLAN `lefthook-suppression`

- ADR-No: 03
- Place: worktree
- Boundary Plans: なし

## Goal

コミットの前に抑制の検査が走り、指摘があればコミットが止まるようになる。

## Refactor

- Inside:
  - Modules: なし。既存の job の形に 1 つ加えるだけである。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
lefthook.yaml                       update
package.json
scripts/
  checks/
    suppression-check.mjs
  harness-sync/
    setting.json
ROADMAP.md
README.md                           update
README.ja.md                        update
```

## Slices

## 1.pre-commit の job

pre-commit の検査の並びに、抑制を報告する job を加える。

### Types

なし

### Steps

1. `lefthook.yaml`
   1. add: `checks` group の `typecheck` の次に、`suppression-check` の job を加える。

      ```yaml
      - name: suppression-check
        glob: '*.{js,jsx,ts,tsx,mts,cts,mjs,cjs}'
        run: pnpm suppression-check {staged_files}
        fail_text: 'Suppression check failed. Fix the code, or ask the owner to allow it with a Reason line.'
      ```

### Policy

- Allowed:
  - `glob` をスクリプトの対象拡張子と同じにする。
  - `run` を `pnpm suppression-check {staged_files}` とする。
  - `fail_text` に、コードを直すか、オーナーの許可を得て `Reason` を添えるかを書く。
  - job を `parallel: true` の `checks` group に置き、`typecheck` の次に並べる。
  - 対象が 0 件のときは、lefthook のスキップに任せる。
  - 既存の 6 件の抑制は許可済みのまま通るため、この job を登録しても既存のコミットを止めない。
  - job の CWD がリポジトリのルートであるという前提を、既存の `ja-check` と共有する。
- Forbidden:
  - `stage_fixed` を付けない - 直す手段がないため。
  - `{staged_files}` をクォートしない - lefthook がシェルのエスケープを行うため。
  - `root` を指定しない - 既存の job と同じ CWD の前提を変えないため。
  - `group` の `parallel` を変えない - 既存の job の実行を変えないため。
  - スクリプトの検出と判定を変えない - 078-d で決着済みである。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示されたファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other — 抑制を含むファイルをステージして `pnpm exec lefthook run pre-commit` を実行し、`suppression-check` の job が失敗して `fail_text` を出すことを確かめる。抑制を含まないファイルでは job が通ることを確かめる。

## 2.README の追従

ルートの README の検査の一覧と pre-commit の説明に、`suppression-check` を加える。

### Types

なし

### Steps

1. `README.md`
   1. update: Checks の一覧の `typecheck` のブロックの次、`test` の前に `suppression-check` の項目を加える。

      ```md
      - suppression-check: `scripts/checks/suppression-check.mjs` - Reports linter and typecheck suppressions that the allowlist and the Reason line do not permit.
      ```

   2. update: pre-commit の説明に `suppression-check` を加える。

      ```md
      - pre-commit: Runs format, lint, staged typecheck, suppression-check, related tests, and japanese-check on changed parts.
      ```

2. `README.ja.md`
   1. update: Checks の一覧の `typecheck` のブロックの次、`test` の前に `suppression-check` の項目を加える。

      ```md
      - suppression-check: `scripts/checks/suppression-check.mjs` - リンターと型チェックの抑制のうち、ホワイトリストと Reason で許可されていないものを報告する。
      ```

   2. update: pre-commit の説明に `抑制検査` を加える。

      ```md
      - pre-commit: 変更分に書式と lint と型と抑制検査と関連テストと日本語検査を実行する。
      ```

### Policy

- Allowed:
  - 既存の検査の並びに合わせ、`typecheck` のブロックの次、`test` の前に `suppression-check` を置く。
  - 英語と日本語の一覧を同じ並びにする。
- Forbidden:
  - `lefthook.yaml` を変えない - 前のスライスで決めた job をそのまま説明する。
  - ほかの検査の説明を変えない - このエントリーの主題ではないため。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示されたファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - other — `README.md` と `README.ja.md` を読み、`suppression-check` が `typecheck` の次、`test` の前にあり、英語と日本語の並びが同じであることを確かめる。
  - proofread — `README.ja.md` の日本語を校正する。

## Notes

### Slice 1: pre-commit の job

- Findings:
  - `pnpm test:run` は `scripts/product-ready/index.test.ts` の1件（ROADMAP 置き換えが `## 0.x.x` を含むこと）が赤い。`rules/roadmap.md` の見出しが `## 1.0.x` 系に変わったことによる期待のずれで、`lefthook.yaml` は関与しない。`typecheck`・`lint`・`format:check` は緑。
    - left: 赤はこのスライスの前からある置き換え側のずれで、直す先は product-ready と roadmap の持ち分であるため。このスライスでは閉じない。
- Unplanned: なし
- Commit: 57972ea3ee826d30e7bc496adc3bed6523e6d532
- Stopped:

### Slice 2: README の追従

- Findings:
  - `pnpm test:run` はスライス1と同じ `scripts/product-ready/index.test.ts` の1件が赤い。ほかは緑で、README の変更が赤に関与しないことは差分の範囲から明らか。
    - left: スライス1に書いたとおり、赤は前からの置き換え側のずれでこの計画の持ち分でないため。ここでは閉じない。
- Unplanned: なし
- Commit: 5ae1a97bad0602b96339aa5c810c1b5c4c8a43a0
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
