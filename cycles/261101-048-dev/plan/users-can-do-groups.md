# PLAN `users-can-do-groups`

- No: 01

## Files

```text
DEFINITION.md                        update
rules/
  definition.rules.md                update
  definition.format.md               update
.pi/
  skills/
    adr/
      SKILL.md
      references/
        format.md                    update
      scripts/
        scaffold.mjs
        scaffold.test.ts
    close/
      SKILL.md                       update
      references/
        format.md                    update
      scripts/
        collect.mjs
        collect.test.ts
    design/
      SKILL.md
    yolo/
      SKILL.md
scripts/
  product-ready/
    targets.mjs
    targets.test.ts
    index.mjs
    index.test.ts
```

## Slices

## 1.束ね方と読み方

### Types

```ts
なし;
```

### Steps

1. `DEFINITION.md`:
   - エントリ 01 の `Adopted` の割り当てに従い、`### Users can do` の下を `#### サイクルを回す`、`#### 作った物を検査する`、`#### 読んで知る`、`#### 文脈を整える`、`#### ハーネスを保つ` の 5 つに分け、各見出しを `####` の 1 行にして `- ` で始めず `<name>: ` の形も持たせず、その下に 23 の Unit の行を、名前も文言も変えずに 6 / 6 / 5 / 3 / 3 で、グループの中は今の並びのままに置き、見出しでも Unit の行でもない行を置かない。
2. `rules/definition.rules.md`:
   - `## What may be a Unit` の後ろに `## How the list is grouped` を足し、階層は最大 2、親は `Who` が何をするかの単位で取る、親は Unit にしない（試験 04 により、複数の Unit をまとめる行は Unit にならない）、親の下の行は 1 行 1 Unit のまま、親の軸に種類の語（extension、skill、gate、document、command）を使わない、束ねない選択もある、と書く。
3. `rules/definition.format.md`:
   - `## Sections` の `Users can do` の行に、`####` の見出しで束ねてよく、見出しは Unit ではないことを足し、`## Skeleton` の `### Users can do` の 2 行と、`:67` と `:75` の「1 行 1 Unit」の 2 行は変えない。
4. `.pi/skills/adr/references/format.md`:
   - `Unit.<name>` の行を、`Users can do` の下の 1 行のことであり、`####` の見出しは Unit ではないと書き直す。
5. `.pi/skills/close/references/format.md`:
   - `### <Unit>` の行に、`Users can do` の下の行を Unit とし、`####` の見出しは Unit ではないと足す。
6. `.pi/skills/close/SKILL.md`:
   - step 10 の verify の対象の行に、`Users can do` の下の行を Unit とし、`####` の見出しは Unit ではないと足す。

### Verify

- Always:
  - 関連するテスト（`pnpm test:related <changed files>`。関連が無ければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが変えた名前と説明（`サイクルを回す`、`作った物を検査する`、`読んで知る`、`文脈を整える`、`ハーネスを保つ`、`How the list is grouped`）を、`grep -n` で `DEFINITION.md`、`rules/definition.rules.md`、`rules/definition.format.md`、`.pi/skills/adr/references/format.md`、`.pi/skills/close/references/format.md`、`.pi/skills/close/SKILL.md` から探し、`DEFINITION.md` の 5 つの見出しが各 1 件、`How the list is grouped` が `rules/definition.rules.md` に 1 件あることを見る
- Added:
  - other — `grep -c "^#### " DEFINITION.md` が 5、`grep -c "^#### .*: " DEFINITION.md` が 0、`grep -c "^- #### " DEFINITION.md` が 0 であることを見る
  - other — `DEFINITION.md` の `### Users can do` から `## Stack` の手前までを読み、`####` の 5 行と `- ` で始まる 23 行だけがあり、ほかの行が無いことを見る
  - other — 5 つの見出しの下の行数が 6 / 6 / 5 / 3 / 3 で、各行が `- <name>: <Who> が、…` の形のままで、変更前の 23 行と文言が 1 字も違わないことを読む
  - other — `grep -c "^#### .*\(extension\|skill\|gate\|document\|script\)" DEFINITION.md` が 0 であることを見る
  - other — `git diff rules/definition.format.md` を読み、`:67` と `:75` の「1 行 1 Unit」の 2 行に差分が無いことを見る
  - other — `grep -n "heading" .pi/skills/adr/references/format.md .pi/skills/close/references/format.md .pi/skills/close/SKILL.md` が 3 ファイルそれぞれで 1 件以上あり、`####` の見出しを Unit と読まないと書いていることを読む
  - other — `pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/targets.test.ts scripts/product-ready/index.test.ts .pi/skills/adr/scripts/scaffold.test.ts .pi/skills/close/scripts/collect.test.ts` を走らせ、4 件とも緑であることを見る
  - other — `git diff --stat` で `scripts/product-ready/targets.mjs` と `scripts/product-ready/index.mjs` に差分が無いことを見る

## Notes

### Slice 1: 束ね方と読み方

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
