# Affected 060

## 01: エントリが複数の関心事を持つとき、Decision とスキャフォールドはどの形にするか

### Code

- Path: `.pi/skills/adr/references/adr.format.md`
  - Kind: `doc`
  - Edge: `names` `DEFINITION.md`

- Path: `.pi/skills/adr/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/affected.format.md`

- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/adr.format.md`, `.pi/skills/adr/references/tasks.md`, `.pi/skills/adr/references/affected.format.md`, `.pi/skills/adr/scripts/index.mjs`

- Path: `.pi/skills/adr/scripts/adr.mjs`
  - Kind: `module`
  - Edge: `names` `.pi/skills/adr/references/adr.format.md`

- Path: `.pi/skills/adr/scripts/index.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/skills/adr/scripts/adr.mjs`, `.pi/skills/adr/scripts/index.mjs`
  - Edge: `names` `.pi/skills/adr/references/adr.format.md`

- Path: `.pi/skills/plan/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md`, `.pi/skills/plan/references/cut.md`, `.pi/skills/plan/references/tasks.md`, `.pi/skills/adr/references/affected.format.md`

- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `names` `DEFINITION.md`, `scripts/harness/harness.json`

- Path: `.pi/skills/plan/references/tasks.md`
  - Kind: `doc`
  - Edge: `contains` `.pi/skills/plan/references`

### External

なし

## 02: エントリは、どの条件で分けるか

### Code

- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/scripts/index.mjs`

### External

なし

## 03: 全エントリのプレリサーチは、どの単位で提案し、どう並列に走らせ、いつ各エントリへ転記するか

### Code

- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/tasks.md`, `.pi/skills/adr/references/adr.format.md`, `.pi/skills/adr/references/affected.format.md`

### External

なし

## 04: work のレビューは、Policy が守られているかをどう確かめるか

### Code

- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/work/references/tasks.md`, `.pi/skills/plan/references/format.md`

- Path: `.pi/skills/work/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md`

- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/work/SKILL.md`, `.pi/skills/work/references/tasks.md`, `.pi/skills/close/scripts/collect.mjs`

- Path: `.pi/skills/close/scripts/collect.mjs`
  - Kind: `module`
  - Edge: `needs` `.pi/skills/plan/references/format.md`

### External

なし

## 05: work の acceptance は、実装が goal を達成しているかをどう確かめるか

### Code

- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/references/format.md`
- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/work/SKILL.md`

### External

なし
