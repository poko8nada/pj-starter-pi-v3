# Affected 061

## 01: 動いているサブエージェントの数を、エディタの上にどう表示するか

### Code

- Path: `.pi/extensions/consult/index.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/run/log.ts, .pi/extensions/consult/tool/consult.ts, .pi/extensions/consult/tool/sound.ts`
- Path: `.pi/extensions/consult/tool/consult.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/run/log.ts, .pi/extensions/consult/tool/subagents.ts, .pi/extensions/consult/tool/sound.ts`
- Path: `.pi/extensions/consult/run/log.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/run/place.ts, .pi/extensions/consult/run/proc.ts`
- Path: `.pi/extensions/consult/tool/subagents.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/run/log.ts`
- Path: `.pi/extensions/consult/README.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/extensions/consult/index.ts, .pi/extensions/consult/run/log.ts, .pi/extensions/consult/tool/consult.ts, .pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/index.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/extensions/consult/index.ts`
- Path: `.pi/extensions/consult/run/log.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/extensions/consult/run/log.ts`
- Path: `.pi/extensions/consult/tool/consult.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/extensions/consult/tool/consult.ts`

### External

- Name: `ctx.ui.setWidget`
  - Kind: `contract`
  - Used by: `.pi/extensions/consult/index.ts`
- Name: `session_start`
  - Kind: `contract`
  - Used by: `.pi/extensions/consult/index.ts`

## 02: 同じ表示場所を他の拡張と共用するとき、表示をどう並べるか

### Code

なし

### External

- Name: `ctx.ui.setWidget`
  - Kind: `contract`
  - Used by: `.pi/extensions/consult/index.ts`
- Name: `widget display order`
  - Kind: `limit`
  - Used by: なし

## 03: 稼働状況が画面に見えるようになったとき、`/consult-status` をどうするか

### Code

- Path: `.pi/extensions/consult/index.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/tool/consult.ts`
- Path: `.pi/extensions/consult/tool/consult.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/tool/subagents.ts`
- Path: `.pi/extensions/consult/tool/subagents.ts`
  - Kind: `module`
  - Edge: `needs` `.pi/extensions/consult/tool/consult.ts`
- Path: `.pi/extensions/consult/README.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/extensions/consult/index.ts, .pi/extensions/consult/tool/consult.ts, .pi/extensions/consult/tool/subagents.ts`
- Path: `.pi/extensions/consult/index.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/extensions/consult/index.ts`
- Path: `.pi/extensions/consult/tool/consult.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/extensions/consult/tool/consult.ts`

### External

- Name: `/consult-status`
  - Kind: `contract`
  - Used by: `.pi/extensions/consult/index.ts, .pi/extensions/consult/README.md`
- Name: `consult_subagents`
  - Kind: `contract`
  - Used by: `.pi/extensions/consult/index.ts, .pi/extensions/consult/tool/consult.ts, .pi/extensions/consult/tool/subagents.ts`
- Name: `/consult-cancel`
  - Kind: `contract`
  - Used by: `.pi/extensions/consult/index.ts, .pi/extensions/consult/tool/consult.ts`
