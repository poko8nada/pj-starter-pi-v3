# Close 056

## Collected

### 02 skill-wording (ADR 02)

1. 130 / Work Review Round 1 / 対象外に残る素の `proofread` (例: `.pi/skills/adr/SKILL.md:150` の `### 11. Proofread and Affected`、同 `:152` の `run the proofread`、`.pi/skills/close/SKILL.md:75` の `after the proofread`、`.pi/skills/yolo/SKILL.md:45` の `complete and proofread`) を `the Japanese proofread` にそろえるかは所有者の判断が必要 — 計画の `Design` では見出し3つを名指しする文のみを対象と決めており、拡大は本計画の範囲外になるため所見とせず残す

## Triage

- 1: dropped (ADR 02, Unit.adr-skill)
  - Fact: 対象外に残る素の `proofread` が4行ある。ADR の C17 では、同じファイルの見出しがセクションを指していることと、変えると英語として通らなくなることを理由に、変えないと決めている。
  - Why: 直す手間が残す不利益を上回るため、落とすことが妥当である。残る行は、近くの `Japanese Proofread` の見出しによって意味が通じる。
  - Then: なし

## Verified

### japanese-check

- Plans:
  - `proofreader-role`
- Result: しない — 振る舞いは変わらないため

### subagent-consult

- Plans:
  - `proofreader-role`
- Result: OK

### adr-skill

- Plans:
  - `skill-wording`
- Result: しない — 振る舞いは変わらないため

### plan-skill

- Plans:
  - `skill-wording`
- Result: しない — 振る舞いは変わらないため

### close-skill

- Plans:
  - `skill-wording`
- Result: しない — 振る舞いは変わらないため

### yolo-skill

- Plans:
  - `skill-wording`
- Result: しない — 振る舞いは変わらないため
