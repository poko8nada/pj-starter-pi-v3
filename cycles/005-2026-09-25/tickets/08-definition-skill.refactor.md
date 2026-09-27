# definition-skill.refactor

Acceptance:

- `Carry over` の一覧が 1 つになっている（`Retro` の中だけ）
- 次のサイクルが読む先が、その 1 つを指している
- 005 の定義書から、重複した上の一覧が消えている

## Todo

- `.pi/skills/definition/references/format.md`
  - `## The shape` から `## Carry over` の節を外す（`## Stack` の次は `## Retro`）
  - `## Carry over` の規則（番号 / 3 部 / `From:`）を `## Retro` の側に寄せ、節を 1 つにする
- `.pi/skills/definition/SKILL.md`
  - step 6: 写し先を `Retro` の `Carry over` にする。unit が取らなかった行は、閉じまで穴のまま
  - checklist: 前の `Retro` の開いている行が、unit に取られたか、穴のままかで説明されていること
- `.pi/skills/stack/SKILL.md`
  - step 1: 読む先を `Retro` の `Carry over` に
- `cycles/005-2026-09-25/definition.md`
  - 上の `## Carry over`（10 行）を消す。同じ 10 行は `Retro` の中にある
- テストファイル: なし（書類の書き換え。`Verify` は `read` と `form`）
- 出所: 005 の閉じ（owner が重複を指摘）

## Verify

### read

- `review` の子に `.pi/skills/definition/references/format.md` を渡す（1 つの子に 1 つの入力）
  - `.pi/skills/definition/SKILL.md` と `.pi/skills/close/SKILL.md`、`.pi/skills/stack/SKILL.md` は子が自分で読む
  - `Acceptance` の 1・2 行を 1 行ずつ判定させ、落ちた箇所を行番号で報告させる

### form

- `grep -c '^## Carry over' .pi/skills/definition/references/format.md` → 0（節が 1 つになった）（1 行）
- `grep -c '^## Carry over' cycles/005-2026-09-25/definition.md` → 0（重複した一覧が消えた）（3 行）
- `grep -c '^### Carry over' cycles/005-2026-09-25/definition.md` → 1（残るのは `Retro` の中だけ）（1 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
