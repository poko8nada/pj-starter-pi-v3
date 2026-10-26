# DESIGN 030

## Possibly related files

### 01: thinking-scrub は、壊れた reasoning をどこまで消すか

- `.pi/extensions/thinking-scrub/scrub/detect.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
- `.pi/extensions/thinking-scrub/scrub/message.ts`
- `.pi/extensions/thinking-scrub/scrub/message.test.ts`
- `.pi/extensions/thinking-scrub/index.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/README.md`

### 02: スクラブしたことを owner にどう見せるか

- `.pi/extensions/thinking-scrub/index.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/command/scrub.ts`
- `.pi/extensions/thinking-scrub/command/scrub.test.ts`
- `.pi/extensions/thinking-scrub/settings/schema.ts`
- `.pi/extensions/thinking-scrub/settings/schema.test.ts`
- `.pi/extensions/thinking-scrub/settings/read.ts`
- `.pi/extensions/thinking-scrub/settings/read.test.ts`
- `.pi/extensions/thinking-scrub/settings.json`
- `.pi/extensions/thinking-scrub/scrub/message.ts`
- `.pi/extensions/thinking-scrub/scrub/message.test.ts`
- `.pi/extensions/thinking-scrub/state/cell.ts`
- `.pi/extensions/thinking-scrub/state/cell.test.ts`
- `.pi/extensions/thinking-scrub/README.md`

## `scrub-threshold-and-report`

### ADR & Where

- No: 01, 02
- Why: 2 つのエントリーが `index.ts` と `README.md` を共有するので、1 つの worktree でまとめて閉じる。
- Where: worktree

### Scope

- なし

### Boundary

- Plans: なし
- External: なし
