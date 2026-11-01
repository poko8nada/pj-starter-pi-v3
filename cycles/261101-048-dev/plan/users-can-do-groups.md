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
  - other — `rules/definition.rules.md` の `## How the list is grouped` の節を読み、階層は最大 2、親は `Who` が何をするかの単位、親は Unit にしない（試験 04）、親の下は 1 行 1 Unit、種類の語を軸にしない、束ねない選択、の 6 点があることを見る
  - other — `rules/definition.format.md` の `## Sections` の `Users can do` の項を読み、見出しで束ねてよいことと、見出しは Unit でないことが書かれていることを見る
  - other — `git diff f457113 -- rules/definition.format.md` を読み、`## Skeleton` の `### Users can do` の下の 2 行に hunk が無いことを見る

## Notes

### Slice 1: 束ね方と読み方

- Findings: なし
- Unplanned: なし
- Commit: c863c8a
- Stopped:

### Cleanup: test files

- 対象: `Files` に並ぶ4件 (`scripts/product-ready/targets.test.ts`、`scripts/product-ready/index.test.ts`、`.pi/skills/adr/scripts/scaffold.test.ts`、`.pi/skills/close/scripts/collect.test.ts`) を精読し、重複・消えた振る舞い・止めた分岐・前提の再掲がないか見た。fallen `####` 見出しは `targets` の `sections` (`## Product`、`### What`) と `scaffold` の `#` 見出し検査に触れず、`index` の `- reader: x` 残存検査も `Product`/`What` 置換だけを見るため有効のままである。`appendEntry`/`lastEntryNumber`/`CLI open cycle` の数違いは単発と連鎖で守る物が違い、`package.json` の欠けと壊れ・雛形の欠けと見出し欠けも枝が違うため残す。削る物なし、4件76テスト緑のままである。
- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし — `DEFINITION.md`、`rules/`、`.pi/skills/adr/SKILL.md`、`.pi/skills/design/SKILL.md`、`.pi/skills/yolo/SKILL.md`、`scripts/product-ready/`、4件のテストにフラット前提の文言や数は残っていないことを `grep` で確かめた。`rules/definition.format.md:76` の「One line is one Unit」は ADR 01 の決定どおり見出しを行と数えないため陳腐化ではない。
- Unlisted:
  - なし — `git diff --stat` の変更は `DEFINITION.md`、`rules/definition.rules.md:22`、`rules/definition.format.md:68`、`.pi/skills/adr/references/format.md:73`、`.pi/skills/close/references/format.md:72`、`.pi/skills/close/SKILL.md:90` の6件だけで、Files の `update` 6件と一致し、計画外のファイル差分はない。
- Gaps:
  - `rules/definition.rules.md:24-28` の新節の内容（最大2階層・親は `Who` の単位・親は Unit にしない・下は1行1Unit・種類語を軸にしない・束ねない選択）を確かめる Added がない。`cycles/261101-048-dev/plan/users-can-do-groups.md:72` の Always は節名の存在だけを見るため、内容の正しさは検査されない。
    - fixed: `Verify` の `Added` に `## How the list is grouped` の6点読みの `other` を足し、`rules/definition.rules.md:24-28` を読んで6点があるのを見た。
  - `rules/definition.format.md:68` の Sections 追記（見出しで束ねてよい・見出しは Unit でない）を確かめる Added がない。`cycles/261101-048-dev/plan/users-can-do-groups.md:78` の Added は `:67` と `:75` の無差分だけを見るため、追記文の読みがない。
    - fixed: `Verify` の `Added` に `## Sections` の `Users can do` 項読みの `other` を足し、`rules/definition.format.md:68` に2点があり `:67` が残るのを見た。
  - `rules/definition.format.md:33-36` の Skeleton の `### Users can do` 下2行の無変更を確かめる Added がない。`cycles/261101-048-dev/plan/users-can-do-groups.md:78` の Added は `:67` と `:75` だけを見るため、雛形の同一性は検査されない。
    - fixed: `Verify` の `Added` に `git diff f457113` の Skeleton hunk無しの `other` を足し、hunkが Sections の1件だけで雛形に無いことを見た。
- Unproven:
  - なし — 新規テストの追加はなく、Verify が走らせる4件（`targets.test.ts`、`index.test.ts`、`scaffold.test.ts`、`collect.test.ts`）は旧来の互換性だけを守り、新しい束ね方を名指ししないため、壊れても緑になる振る舞いはない。
- Noise:
  - なし — 新規テストの Steps がなく、`5` や `6 / 6 / 5 / 3 / 3` は ADR 01 と plan が決めた値のため魔数ではなく、既存4件に重複や前提の再掲の追加もない。
- Doubts:
  - `cycles/261101-048-dev/plan/users-can-do-groups.md:55` と `rules/definition.rules.md:28` は種類語に `command` を使うが、同 plan `:77` と `cycles/261101-048-dev/design.md:77` の grep は `script` を使う。`DEFINITION.md:22-58` の見出し5つは英字を含まないため両方0件で閉塞に影響しない。
  - `cycles/261101-048-dev/plan/users-can-do-groups.md:53,75` の「ほかの行が無い」は空行を数えていない読みで運用している。差分の `DEFINITION.md:22-58` は内容行が `####` 5行と `- ` 23行だけで、空行は従来どおりのため findings にしない。

## Acceptance

- Ran:
- Findings:
- Doubts:
