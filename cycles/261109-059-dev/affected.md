# Affected 059

## 01: references の format とタスクは、フラットな箇条書きの羅列ではなく、読み手が迷わないどの形で書くか

### Code

- Path: `.pi/skills/adr/references/adr.format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/SKILL.md`

- Path: `.pi/skills/adr/references/affected.format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/SKILL.md, .pi/skills/plan/SKILL.md, .pi/skills/adr/references/tasks.md`

- Path: `.pi/skills/close/references/format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/close/SKILL.md`

- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md, .pi/skills/work/SKILL.md, .pi/skills/work/references/tasks.md`

- Path: `.pi/skills/upgrade/references/report.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/upgrade/SKILL.md`

- Path: `.pi/skills/plan/references/cut.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md`

- Path: `.pi/skills/adr/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/SKILL.md`

- Path: `.pi/skills/close/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/close/SKILL.md`

- Path: `.pi/skills/plan/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md`

- Path: `.pi/skills/upgrade/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/upgrade/SKILL.md`

- Path: `.pi/skills/work/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/work/SKILL.md`

### External

なし

## 02: plan のスライスは、閉じた変更で関心を 1 つにするために、どの基準で切り、Verify をどこに置くか

### Code

- Path: `.pi/skills/plan/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md, .pi/skills/plan/references/tasks.md, .pi/skills/adr/references/affected.format.md`

- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md, .pi/skills/work/SKILL.md, .pi/skills/work/references/tasks.md`

- Path: `.pi/skills/plan/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md`

- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md`

- Path: `.pi/skills/work/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md`

- Path: `.pi/skills/close/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md`

### External

なし

## 03: work の clean test は、追加されたテストの前提と、共有すべき前提を、どの観点で見るか

### Code

- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md, .pi/skills/work/references/tasks.md`

- Path: `.pi/skills/work/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md`

- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/work/SKILL.md, .pi/skills/work/references/tasks.md`

### External

なし

## 04: 各スキルの How not to write this は、どの項目の想定も迷わず、自明な項目を残さない形にどうするか

### Code

- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `DEFINITION.md`
- Path: `.pi/skills/close/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `DEFINITION.md`
- Path: `.pi/skills/plan/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md`
- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
- Path: `.pi/skills/upgrade/SKILL.md`
  - Kind: `doc`
- Path: `.pi/skills/yolo/SKILL.md`
  - Kind: `doc`

### External

なし
