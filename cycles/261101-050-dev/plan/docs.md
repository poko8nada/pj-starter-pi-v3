# PLAN `docs`

- No: 05

## Files

```text
DEFINITION.md              update
ROADMAP.md                 update
README.md
README.ja.md
rules/
  definition.format.md     update
  definition.rules.md
  readme.format.md         update
  roadmap.md               update
.pi/skills/adr/
  SKILL.md                 update
  references/
    format.md              update
    tasks.md               update
  scripts/
    scaffold.mjs
.pi/skills/close/
  SKILL.md                 update
  references/
    format.md              update
    tasks.md               update
.pi/skills/design/
  SKILL.md                 update
  references/
    format.md              update
    tasks.md               update
.pi/skills/plan/
  SKILL.md                 update
  references/
    format.md              update
    tasks.md               update
.pi/skills/work/
  SKILL.md                 update
  references/
    tasks.md               update
.pi/skills/upgrade/
  SKILL.md                 update
  references/
    report.md              update
    tasks.md               update
.pi/skills/yolo/
  SKILL.md                 update
scripts/product-ready/
  blocks.mjs
  cli.mjs
  index.mjs
  index.test.ts            update
  readme-format.test.ts    update
  targets.mjs
  targets.test.ts          update
```

## Slices

## 1.エージェント向け文書

### Types

なし

### Steps

1. `DEFINITION.md`:
   - `definition-file` と `definition-rules` の行の `絵` を `全体像` に、`subagent-consult` の行の `作業場` を `ワークツリー` に直す。Unit の名前、`Stack`、`Product`、`What`、`Who` は変えない。
2. `ROADMAP.md`:
   - `1.x.x` の項目の語を、基準に合わない行だけ直す。`0.x.x` の 11 件、`cycles` の列、`ROADMAP.md:31,32` の引用は変えない。
3. `rules/definition.format.md`:
   - `絵` を `全体像` に直す。雛形の見出しと欄の構造は変えない。
4. `rules/readme.format.md`:
   - 雛形の語を基準に合わせ、英語と日本語の 8 行の対を保つ。`## Writing` と見出しの構造は変えない。
5. `rules/roadmap.md`:
   - 雛形の語を基準に合わせる。見出しと欄の構造は変えない。
6. `.pi/skills/adr/SKILL.md`:
   - 日本語の引用 `なし（採らなかった）` を `なし（採用しなかった）` に直す。英語の本文は変えない。
7. `.pi/skills/adr/references/format.md`:
   - `<採った形>` を `<採用した形>` に、`(採らなかった理由)` を `(採用しなかった理由)` に、`なし（採らなかった）` を `なし（採用しなかった）` に直す。`scaffold.mjs` の雛形と同じ綴りにする。見出しと欄の構造は変えない。
8. `.pi/skills/adr/references/tasks.md`:
   - 本文の語を基準に合わせる。引用と見出しの構造は変えない。
9. `.pi/skills/close/SKILL.md`:
   - 日本語の引用 `<穴>` を `<出どころ>` に直す。英語の本文は変えない。
10. `.pi/skills/close/references/format.md`:
    - `<穴>` を `<出どころ>` に直す。見出しと欄の構造は変えない。
11. `.pi/skills/close/references/tasks.md`:
    - 本文の語を基準に合わせる。引用と見出しの構造は変えない。
12. `.pi/skills/design/SKILL.md`:
    - 日本語の引用の語を基準に合わせる。英語の本文は変えない。
13. `.pi/skills/design/references/format.md`:
    - 本文の語を基準に合わせる。見出しと欄の構造は変えない。
14. `.pi/skills/design/references/tasks.md`:
    - 本文の語を基準に合わせる。引用と見出しの構造は変えない。
15. `.pi/skills/plan/SKILL.md`:
    - 日本語の引用の語を基準に合わせる。英語の本文は変えない。
16. `.pi/skills/plan/references/format.md`:
    - 本文の語を基準に合わせる。見出しと欄の構造は変えない。
17. `.pi/skills/plan/references/tasks.md`:
    - 本文の語を基準に合わせる。引用と見出しの構造は変えない。
18. `.pi/skills/work/SKILL.md`:
    - 日本語の引用の語を基準に合わせる。英語の本文は変えない。
19. `.pi/skills/work/references/tasks.md`:
    - 本文の語を基準に合わせる。引用と見出しの構造は変えない。
20. `.pi/skills/upgrade/SKILL.md`:
    - 日本語の引用の語を基準に合わせる。英語の本文は変えない。
21. `.pi/skills/upgrade/references/report.md`:
    - 本文の語を基準に合わせる。見出しと欄の構造は変えない。
22. `.pi/skills/upgrade/references/tasks.md`:
    - 本文の語を基準に合わせる。引用と見出しの構造は変えない。
23. `.pi/skills/yolo/SKILL.md`:
    - 日本語の引用の語を基準に合わせる。英語の本文は変えない。
24. `scripts/product-ready/readme-format.test.ts`:
    - (happy) `rules/readme.format.md` の雛形 → `EXPECTED_EN` と `EXPECTED_JA` の 8 行の対が一致する。雛形が変わらない場合は期待値を変えない。
25. `scripts/product-ready/index.test.ts`:
    - (happy) `rules/` の雛形 → 差し替え後の期待値が一致する。雛形が変わらない場合は期待値を変えない。
26. `scripts/product-ready/targets.test.ts`:
    - (happy) `rules/` の雛形 → 差し替え後の期待値が一致する。雛形が変わらない場合は期待値を変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rniE '<穴>|採った形|採らなかった' .pi/skills/adr/SKILL.md .pi/skills/adr/references/format.md .pi/skills/close/SKILL.md .pi/skills/close/references/format.md` (the command exits 0 when there is no match)
  - `! grep -rniE '絵|作業場' DEFINITION.md rules/definition.format.md` (the command exits 0 when there is no match)
- Added: the agent reads the diff for: the `1.x.x` lines' judgment by the rules 1, 2, 6, 7, 8, 9; the `ROADMAP.md:31,32` quotes and the `0.x.x`/`cycles` column unchanged; the `adr/references/format.md` placeholders match `scaffold.mjs`; the `rules/readme.format.md` English/Japanese pair; the `SKILL.md` Japanese quotes follow and the English bodies are unchanged; the quotes and the lists remain

## Notes

### Slice 1: エージェント向け文書

- Findings: なし
- Unplanned: なし
- Commit: a24fcd2
- Stopped:

### Cleanup: 重複・廃止のテストなし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
