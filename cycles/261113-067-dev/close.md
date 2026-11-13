# Close 067

## Collected

### 01 consult-run-sub (ADR 01)

1. 396 / Acceptance / cleanup では plan の見込みより 1 件多くテストを削除した（plan 分の 2 件と cleanup 分の 1 件で合わせて 3 件減となり、最終的に 870 件になった）。

### 02 consult-tool-view (ADR 02)

2. 409 / Acceptance / cleanup でテストが 3 件減った（重複していた番号・文面・短名と USAGE の断言）。plan では 2 件増を見込んでいたが、cleanup 後は base より 1 件少ない 869 件になった。

## Triage

- 1: dropped (ADR 01, `Unit.test-run`)
  - Fact: cleanup が plan の見込みより 1 件多くテストを削除し、最終的に 870 件になった。
  - Why: その削除は plan における cleanup の判断であり、残るテストは plan が定めた単位を保っている。件数の見込みとの差は欠陥ではない。
  - Then: なし
- 2: dropped (ADR 02, `Unit.test-run`)
  - Fact: cleanup が 3 件のテストを削除し、最終的に 869 件になった。plan では 2 件増を見込んでいたが、base より 1 件少ない結果になった。
  - Why: その削除は plan における cleanup の判断であり、残るテストは plan が定めた単位を保っている。件数の見込みとの差は欠陥ではない。
  - Then: なし

## Verified

### subagent-consult

- Plans:
  - `consult-run-sub`
  - `consult-tool-view`
- Result: OK
- Change: OK
- Fixed: なし

### test-run

- Plans:
  - `consult-run-sub`
  - `consult-tool-view`
- Result: OK
- Change: OK
- Fixed: なし
