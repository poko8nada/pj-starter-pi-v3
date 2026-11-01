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

- Stale: なし — `.pi/skills/adr/scripts/scaffold.mjs:43` と `.pi/skills/close/scripts/collect.mjs:22,25,32,37` は strings 側で新語になっており、`scripts/product-ready/*.test.ts` は `rules/` を動的に読むため、今回の置き換えで古くなる文書・コメント・テストは無い。
- Unlisted: なし — 差分の 8 件は `cycles/261101-050-dev/plan/docs.md:5` の Files の `update` 印と一致し、`docs.md` 自体の Notes 更新は plan の記録である。
- Gaps: なし — 対応表の旧語は差分で消え、Verify の 2 本の grep が 0 件になることと、Added の読みどころ (`ROADMAP.md:31,32` の引用と `0.x.x`/`cycles` の不変、`scaffold.mjs` との一致、`rules/readme.format.md` の 8 行対、`SKILL.md` 英語本文の不変) は差分で確かめられ、無変更の `update` 印ファイルに残る日本語は「なし」・引用・雛形の語だけで直す本文は無い。
- Unproven: なし — `scripts/product-ready/readme-format.test.ts:108` の肯定例が雛形自体を直接検査するため、雛形が壊れれば赤になり、否定例だけが緑に残ることは無い。
- Noise: なし — `EXPECTED_EN`・`EXPECTED_JA` の 8 行は ADR と design が決めた値であり、`1 行`・`exit 1` の断言は決めた契約の写しで、型や制約が決める前提の再現は無い。
- Doubts:
  - `ROADMAP.md:29` の「見るに堪えない」→「見るに耐えない」は、どちらも常用漢字で読みも同じため規則 1,2,6,7,8,9 のどれにも当たらず、元の慣用句を変えた根拠が読み取れない。
  - `.pi/skills/design/references/format.md:22,52` の `<外の物>` は残り、`DEFINITION.md:31` の「作った物」は「作ったもの」になったため、物→ものの適用が揃っているか読み取れない。

## Acceptance

- Ran: `pnpm test:run` (62 files, 787 tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; the diff read of the 8 changed files and the unchanged `Files` entries
- Findings: なし
- Doubts: なし
