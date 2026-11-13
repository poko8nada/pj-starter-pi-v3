# PLAN `adr-entry-order`

- No: 02
- Place: worktree
- Boundary Plans: なし

## Goal

adr の分割の提示が、エントリの順番とその理由を示し、先に決めた結果が後のエントリに影響するものが先に並ぶようになる

## Design

- Inside:
  - Modules: なし（`adr/SKILL.md` の `### 3. Entries` を書き換えるだけで、ファイルやモジュールの統合・分割はない）
  - Dirs: なし（ディレクトリの統合・分割・移動はない）
- Outside:
  - Extract: なし（ほかの文書と共有する新しいモジュールはない）
  - Colocate: なし（コロケーションに変えるモジュールはない）

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md                 update
    close/
      SKILL.md
    yolo/
      SKILL.md
ROADMAP.md
```

## Slices

## 1.分割の提示に順番と理由を足す

分割の提示に、エントリの順番とその理由、順番を決める条件を足す。

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `### 3. Entries` の Step 3 を、順番とその理由も示す形にする。

      ```md
      3. Show the owner the split, each entry's intent, each entry's `Type`, and the order of the entries with its reason.
      ```

   2. update: `### 3. Entries` の Step 4 に、順番だけを却下された場合は、分割を保ち、順番を直して示し直す、と足す。

      ```md
      4. Rewrite a rejected split, and show it again. When only a `Type` is rejected, keep the split, and write the owner's `Type` for that entry. When only the order is rejected, keep the split and write the order again.
      ```

   3. add: `### 3. Entries` の Notes の末尾に、順番の条件を2本足す。

      ```md
      - Basically, an entry whose decision influences a later entry comes first.
      - An order the condition does not cover is allowed.
      ```

### Policy

- Allowed:
  - 順番の理由を、分割、意図、`Type` と同じ提示に含める
  - 条件に当てはまらない並びを許す
- Forbidden:
  - オーナーの承認なしに順番を決めない - 分割と順番を決めるのはオーナーである
  - 分割の単位（1 エントリ 1 `Main`、`Sub` の条件）を変えない - このエントリは順番だけを扱う
  - `close` と `yolo` に順番の条件を写さない - どちらも adr の分割の順を使う
  - `plan` に順番の条件を写さない - plan はエントリの順番に依存せず、cut の順を使う

### Verify

- Always:
  - 関連テスト（`pnpm test:related .pi/skills/adr/SKILL.md`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: 分割の提示に順番と理由を足す

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
