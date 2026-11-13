# Affected 057

## 01: 手順スキルの手順・観点・注意点は、どの形に置くか

### Code

- Path: `.pi/skills/plan/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/cut.md, .pi/skills/plan/references/format.md, .pi/skills/plan/references/tasks.md, .pi/skills/adr/references/affected.format.md`
- Path: `.pi/skills/work/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md, .pi/skills/work/references/tasks.md`
- Path: `.pi/skills/upgrade/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/upgrade/references/report.md, .pi/skills/upgrade/references/tasks.md`

### External

なし

## 02: 流れスキルの流れ・条件・注意点は、どの形に置くか

### Code

- Path: `.pi/skills/yolo/SKILL.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/plan/SKILL.md, .pi/skills/work/SKILL.md, .pi/skills/close/SKILL.md`

### External

なし

## 03: 判定スキルの門・状態・手順は、どの形に置くか

### Code

- Path: `.pi/skills/close/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/close/references/format.md, .pi/skills/close/references/tasks.md, .pi/skills/close/scripts/collect.mjs, ROADMAP.md`
  - Edge: `mentions` `.pi/skills/plan/SKILL.md, .pi/skills/work/SKILL.md`

### External

なし

## 04: 参照資料のフェンス・規則・記録の形は、どこまで揃えるか

### Code

- Path: `.pi/skills/plan/references/cut.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/plan/references/format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md, .pi/skills/work/SKILL.md, .pi/skills/plan/references/tasks.md, .pi/skills/work/references/tasks.md`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/plan/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/SKILL.md, .pi/skills/plan/references/format.md`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/work/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/work/SKILL.md, .pi/skills/plan/references/format.md`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/upgrade/references/report.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/upgrade/SKILL.md`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/upgrade/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/upgrade/SKILL.md`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/close/references/format.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/close/SKILL.md, .pi/skills/close/scripts/collect.mjs`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`
- Path: `.pi/skills/close/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/close/SKILL.md`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md, .pi/skills/adr/references/affected.format.md, .pi/skills/adr/references/tasks.md`

### External

なし
