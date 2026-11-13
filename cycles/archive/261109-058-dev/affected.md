# Affected 058

## 01: ADR のエントリは、Scope から始まり、In/Out の Scope と、Adopted の一言と、Allowed/Forbidden の Policy を、どの順に置くか

### Code

- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/adr/references/adr.format.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/adr/SKILL.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/adr/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/affected.format.md`
  - Edge: `mentions` `.pi/skills/adr/SKILL.md, .pi/skills/adr/references/adr.format.md`
- Path: `.pi/skills/adr/scripts/adr.mjs`
  - Kind: `module`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md`
- Path: `.pi/skills/adr/scripts/index.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/skills/adr/scripts/adr.mjs`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md`
- Path: `.pi/skills/plan/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md`
- Path: `.pi/skills/plan/references/tasks.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md`
- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md`

### External

なし

## 02: plan は、Goal と、ADR の Add/Update/Drop を affected のファイル群に当てる手順と、スライスごとの Policy を、どの形で持ち、レビューでどう確かめるか

### Code

- Path: `.pi/skills/plan/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md, .pi/skills/plan/references/tasks.md, .pi/skills/plan/references/cut.md`
- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/SKILL.md, .pi/skills/work/SKILL.md, .pi/skills/work/references/tasks.md`
- Path: `.pi/skills/plan/references/tasks.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/references/format.md, .pi/skills/plan/SKILL.md`
- Path: `.pi/skills/plan/references/cut.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/SKILL.md`
- Path: `.pi/skills/yolo/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/SKILL.md, .pi/skills/plan/references/format.md, .pi/skills/plan/references/tasks.md`
- Path: `.pi/skills/close/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/SKILL.md, .pi/skills/plan/references/format.md`
- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/references/format.md`
- Path: `.pi/skills/work/references/tasks.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/references/format.md`
- Path: `.pi/skills/close/scripts/collect.mjs`
  - Kind: `module`
  - Edge: `mentions` `.pi/skills/plan/references/format.md`
- Path: `.pi/skills/close/scripts/collect.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/skills/close/scripts/collect.mjs`
- Path: `.pi/skills/close/scripts/collect.fixture.ts`
  - Kind: `test`

### External

なし

## 03: work は、plan の Goal と Policy にどう従い、work のレビューでどう確かめるか

### Code

- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/work/references/tasks.md`
  - Edge: `mentions` `.pi/skills/plan/references/format.md`
- Path: `.pi/skills/work/references/tasks.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/references/format.md, .pi/skills/work/SKILL.md`
- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/work/SKILL.md, .pi/skills/work/references/tasks.md`
- Path: `.pi/skills/close/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/work/SKILL.md, .pi/skills/work/references/tasks.md, .pi/skills/plan/references/format.md`

### External

なし

## 04: work は、受入とマージの間に、オーナー確認をどう置き、yolo でどう飛ばすか

### Code

- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/yolo/SKILL.md`
- Path: `.pi/skills/close/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/work/SKILL.md`
- Path: `.pi/skills/yolo/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/work/SKILL.md`

### External

なし
