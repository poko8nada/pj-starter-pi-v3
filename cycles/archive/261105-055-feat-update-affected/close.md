# Close 055

## Collected

### 01 adr (ADR 01, 02, 04, 06)

1. 435 / Work Review Round 1 / `.pi/skills/adr/references/tasks.md:28` — 対象抽出の動詞8語のうちには、ADR 01 の Adopted（`adr.md:64`）の10語のうちの「そろえる」に対応する語がない。抽出漏れのおそれがあるため、意図的な読み替えなのか補遺が必要なのかを判断する必要がある。

## Triage

- 1: _ex-plan_ ex-tasks-verb (ADR 01, Unit.adr-skill): done 02cf6fb
  - Fact: `tasks.md` の対象抽出の動詞は8語であり、ADR 01 の `Adopted` の操作の動詞は10語である。8語のうちには、「そろえる」に対応する語がない。
  - Why: 「そろえる」を使う決定文の目的語が対象の抽出から漏れるおそれがあるためである。この漏れはこのサイクルの関心の範囲内であり、対応が1つのプランに収まるためである。
  - Then: 対象抽出の動詞に「そろえる」に対応する語を加える方針のプランを立てる。

## Verified

### Unit.adr-skill

- Plans:
  - `01-adr`
- Result: OK

### Unit.plan-skill

- Plans:
  - `01-adr`
  - `02-plan`
- Result: OK

### Unit.subagent-consult

- Plans:
  - `01-adr`
- Result: OK
