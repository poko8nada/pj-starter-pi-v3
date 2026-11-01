# PLAN `plan-always-five`

- No: 03

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md                    update
      references/
        format.md                 update
        tasks.md
    work/
      SKILL.md
      references/
        tasks.md
    yolo/
      SKILL.md
package.json
```

## Slices

## 1.5 本を書き下す

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/format.md`:
   - `## Shape` の `Always` の雛形を、`<緑にしたもの。既定の 5 つで足りるなら `既定の 5 つ`>` の 1 行から、関連テスト（`pnpm test:related <changed files>`。関連が無ければ `pnpm test:run`）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、このスライスが変えた名前と説明を大小文字を問わず `grep` する、の 5 行に変える。
2. `.pi/skills/plan/references/format.md`:
   - `## Verify` の `:149` の「`Always:` — these five, and nothing else.」を「`Always:` — the bullets below, and nothing else.」に直し、`:161` の「the five above」を「the checks above」に直して、`Added` の 5 本を指す意味を保つ。
3. `.pi/skills/plan/SKILL.md`:
   - `:63` の「`Always` — the five: the related tests, the typecheck, the lint, the format, and the case-insensitive `grep` for stale wording」から「the five: 」を消し、`:122` の「Do not invent a check: `Always` is the five, and `Added` is the list `references/format.md` gives」を「Do not invent a check: `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides.」に直す。

### Verify

- Always:
  - 関連するテスト: 変えるのは md の 2 本で、どのテストもこの 2 本を取り込まないため関連は無い。`pnpm test:run` を走らせる
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが消した文言（`既定の 5 つ`、`these five`、`the five above`、`the five`）が、`.pi/skills/plan/SKILL.md` と `.pi/skills/plan/references/format.md` に残っていないことを、`grep -in` が 0 件であることで見る（`five viewpoints` は除く）
- Added:
  - other — `.pi/skills/plan/references/format.md:49-55` を読み、`Always:` の下に ` -` で始まる 5 行があり、`pnpm test:related`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`grep` がそれぞれ 1 行ずつ入っていることを見る
  - other — `grep -n "the bullets below" .pi/skills/plan/references/format.md` が 1 件、`grep -n "the checks above" .pi/skills/plan/references/format.md` が 1 件であることを見る
  - other — `git diff .pi/skills/plan/references/format.md` の `## Verify` の節を読み、`Added` の 6 つの組（DB、front、auth、base plan's look、proofread、other）の意味が変わっていないことを見る
  - other — `git diff --stat` で `package.json`、`.pi/skills/work/SKILL.md`、`.pi/skills/work/references/tasks.md`、`.pi/skills/yolo/SKILL.md`、`cycles/` に差分が無いことを見る

## Notes

### Slice 1: 5 本を書き下す

- Findings:
- Unplanned:
- Commit:
- Stopped:

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
