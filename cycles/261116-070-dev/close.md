# Close 070

## Collected

### 03 reader-sub-handling (ADR 03)

1. 201 / Work Review Round 1 / `.pi/skills/adr/SKILL.md:168` / `.pi/skills/adr/references/adr.format.md:43` — ADR の `Decision` の `Main` / `Sub`（関心事の親子）と `DEFINITION.md` の `Unit` / `Sub`（名の親子）が同じ `Sub` という語で並立する。今回の差分は後者に `Sub` を足しただけで、前者と後者の呼び方の区別を決めていない。読む人が混同するおそれがあるか、注意書きの追記が必要かはオーナーの判断によるため。

## Triage

- 1: **proposed** (ADR 03, `Unit` と `Sub` の名)
  - Fact: `adr.format.md` の `Decision` は、エントリの関心事を `Main` と `Sub` で書く（`adr.format.md:43` 付近）。`DEFINITION.md` は、ユニットの下の機能を `Sub` と呼ぶ（`rules/definition.rules.md` の `What may be a Sub`）。同じ `Sub` という語が 2 つの意味で並び、呼び方の区別は決まっていない。
  - Why: 読む人が `adr.md` の `Decision` の `Sub` と `DEFINITION.md` の `Sub` を同じものと読むおそれがある。文書が増えるほど、この語の重なりは直しにくくなる。
  - Then: 次は、`adr` の `Decision` の `Sub` と、`DEFINITION.md` の `Sub` の呼び方の区別を論点にする。

## Verified

### definition-rules

- Plans:
  - `definition-sub-rule`
- Result: OK
- Change: OK
- Fixed: なし

### subagent-consult

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### subagent-consult_status

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### subagent-consult_cancel

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### subagent-consult_notify

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### thinking-scrub

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### thinking-scrub_switch

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### thinking-scrub_status

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### context-precompact

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### context-precompact_now

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### context-precompact_switch

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### context-precompact_status

- Plans:
  - `definition-sub-lines`
- Result: OK
- Change: OK
- Fixed: なし

### adr-skill

- Plans:
  - `reader-sub-handling`
- Result: OK
- Change: OK
- Fixed: なし

### close-skill

- Plans:
  - `reader-sub-handling`
- Result: OK
- Change: OK
- Fixed: なし
