# Affected 056

## 01: proofreader は ja-check をどう実行し、warn と error をゼロ件にする義務をどう定めるか

### Code

- Path: `.pi/extensions/consult/types.json`
  - Kind: `config`
  - Edge: `names` `scripts/checks/ja-check.mjs`
- Path: `.pi/extensions/consult/README.md`
  - Kind: `doc`
  - Edge: `names` `.pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/policy/types.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/run/subagent.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/policy/types.ts`
- Path: `scripts/checks/ja-check.mjs`
  - Kind: `module`
  - Edge: `needs` `scripts/checks/ja-check.json`
- Path: `scripts/checks/ja-check.json`
  - Kind: `config`
  - Edge: `names` `ROADMAP.md`
- Path: `lefthook.yaml`
  - Kind: `config`
  - Edge: `needs` `scripts/checks/ja-check.mjs`

### External

なし

## 02: スキル側の proofread は何を残し、何をロールに返すか

### Code

- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/adr.format.md`
- Path: `.pi/skills/plan/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/plan/references/format.md`
- Path: `.pi/skills/close/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/close/references/format.md`
- Path: `.pi/skills/yolo/SKILL.md`
  - Kind: `doc`
- Path: `.pi/skills/close/references/format.md`
  - Kind: `doc`

### External

なし
