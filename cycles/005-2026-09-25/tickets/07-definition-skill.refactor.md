# definition-skill.refactor

Acceptance:

- `Carry over` の一覧が番号付きになっている（両方の一覧とも）
- owner が番号で行を落とせる。落とした番号と理由が `Retro` に残る
- `definition` の `format.md` と `close` の本文が、同じ規則を 1 か所ずつ持っている

## Todo

- `.pi/skills/definition/references/format.md`
  - `## Carry over` の行の形: `- ` → `1. `（番号は位置の記号。行の同一性は `From:` が持つ）
  - `## Retro` の `Carry over`: 同じ形。owner が落とした行は `Bad` に 1 行（`- <番号> を owner が落とした — <理由>`）
  - `## Writing`: 写すときは番号を振り直す
- `.pi/skills/close/SKILL.md`
  - step 5: 写す 2 つの出所それぞれで、番号を振る
  - step 6: owner は行を落とせる。落とした番号と理由は `Bad` に残す（黙って消さない）
  - `:65` の「no gaps」を、足す・落とすの両方を指すように直す
- `.pi/skills/definition/SKILL.md`
  - step 6 と checklist: 写した一覧は 1 から振り直す
- `cycles/005-2026-09-25/definition.md`
  - `## Carry over`（10 行）と `### Carry over`（18 行）を番号付きにする
  - 番号と `From:` は両立する（`1. <場所>: <状態>。閉じるもの From: <NNN>.<ticket>`）
- テストファイル: なし（書類の書き換え。`Verify` は `read` と `form`）
- 出所: 005 の閉じ（owner がこのタイミングで指示）

## Verify

### read

- `review` の子に `.pi/skills/definition/references/format.md` を渡す（1 つの子に 1 つの入力）
  - `close/SKILL.md` と `definition/SKILL.md` は子が自分で読む
  - `Acceptance` の 2・3 行を 1 行ずつ判定させ、落ちた箇所を行番号で報告させる

### form

- `grep -c '^[0-9]\+\. ' cycles/005-2026-09-25/definition.md` → 28（一覧の全行。15 番は 101 字の行を直して閉じたので写さない）（1 行）
- `sed -n '/^## Carry over/,/^## Retro/p' cycles/005-2026-09-25/definition.md | grep -c '^- '` → 0（番号なしの行が残っていない）（1 行）
- `grep -c 'owner drops' .pi/skills/definition/references/format.md .pi/skills/close/SKILL.md` → 各 1（2 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit: 1ec28f2
