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
  - other — `.pi/skills/plan/SKILL.md:63` を読み、`Always` の 5 本の列挙（the related tests、the typecheck、the lint、the format、the case-insensitive `grep`）が残り、「the five」が無いことを見る
  - other — `.pi/skills/plan/SKILL.md:122` を読み、`Always` が `references/format.md` の checks で、`Added` がその変更が決めるもの、と書いてあることを見る

## Notes

### Slice 1: 5 本を書き下す

- Findings: なし
- Unplanned: なし
- Commit: 01a997c
- Stopped:

### Cleanup: test files

- 対象: `Files` で `update` の 2 本に対応するテストを探し、`plan/` 配下にテストが無く `pnpm test:related` も該当なしのため削除は無しとし、`pnpm test:run` の緑を保った。
- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — `.pi/skills/plan/SKILL.md:74`の`five viewpoints`と`.pi/skills/work/SKILL.md:60`、`.pi/skills/yolo/SKILL.md:34`等の`five viewpoints`は計画レビューの5観点を指し本スライスの`Always`の5本とは別物のため陳腐化しないこと、`.pi/skills/plan/references/tasks.md`と`.pi/skills/work/references/tasks.md`に`Always`の旧文言が無いことを確かめた
- Unlisted: なし — `git diff 45e4b06..HEAD --name-only`が`.pi/skills/plan/SKILL.md`と`.pi/skills/plan/references/format.md`の2本のみでいずれも`Files`の`update`と一致することを確かめた
- Gaps:
  - `.pi/skills/plan/SKILL.md:63`（および`:122`）— 新文言（`Always` holds〜／`Added` holds〜）が正しく入ったことを積極的に確かめる`Added`の検査がなく、`Always`の`grep`は旧文言の不在だけを見るため、行削除や誤記でも緑のまま閉じてしまう
    - fixed: `Verify` の `Added` に `:63` の 5 本列挙の残存と `the five` 不在を見る `other` と `:122` の新文言を見る `other` を足し、`:63` が 5 本を保ち `grep -in "the five"` が 0 件で `:122` が新文言どおりであることを見た
- Unproven: なし — `grep`の不在確認と`grep -n`の1件確認と`git diff --stat`の不在確認は文言を戻せば赤になることを確かめた
- Noise: なし — テスト段階がなく、`Added`の文字列・件数（`the bullets below`等、5行・各1件）は`Steps`が決めた値のため`## Test cases`の魔術数・ハードコードに当たらないことを確かめた
- Doubts:
  - `### Steps`の2.は`Added`を「5本」と書くが`### Verify`の`Added`の検査は「6つの組（DB、front、auth、base plan's look、proofread、other）」と書く。数え方の差異か確かめきれなかった
  - `### Verify`の`Always`の`grep -in`は（`five viewpoints`は除く）とあるが除外の手続き（`-v`等）が書かれていない。現状は対象2本に`the five viewpoints`の行がなく素直な`grep`で0件になるため実害はない

## Acceptance

- Ran:
- Findings:
- Doubts:
