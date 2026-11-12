# Close 063

## Collected

### 03 verify-change (ADR 03)

1. 199 / Work Review Round 1 / `.pi/skills/close/SKILL.md:119` — 手順 6 の「Write what they answered in `## Verified`」が `Result:` と `Change:` の両方を書くことを明示していない。`Goal` の「結果を `Change:` に残す」を手順で保証するための `Change:` の名指しが要るかどうかは、`what they answered` を両方の回答とも読めるため、修正の要否は所有者の判断による。

## Triage

- 1: _ex-change_ (ADR 03, `Unit.close-skill`): done 102a0d7
  - Fact: `.pi/skills/close/SKILL.md:119` の手順 6 は「Write what they answered in `## Verified`」とだけ書き、`Result:` と `Change:` を名指ししない。`## Verified` は両方の項目を持つ形だが、片方だけ書いた場合でも手順を満たしたことになる。
  - Why: Verify は今サイクルから機能と変更の 2 部構成になったため、残すべき項目も 2 つになった。手順 6 が両方を名指ししないと、`Change:` の書き忘れが見逃されるおそれがある。
  - Then: 手順 6 を「Write `Result:` and `Change:` from what they answered in `## Verified`」に変える。

## Verified

### Unit.adr-skill

- Plans:
  - `01-adr-context-first`
- Result: OK
- Change: OK
- Fixed: なし

### Unit.plan-skill

- Plans:
  - `02-cut-granularity`
- Result: OK
- Change: OK
- Fixed: `_ex-change_` (508e35b)

### Unit.work-skill

- Plans:
  - `02-cut-granularity`
- Result: OK
- Change: OK
- Fixed: なし

### Unit.close-skill

- Plans:
  - `03-verify-change`
- Result: OK
- Change: OK
- Fixed: なし

### Unit.yolo-skill

- Plans:
  - `04-yolo-start`
- Result: OK
- Change: OK
- Fixed: なし
