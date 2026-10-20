# PLAN `ex-skill-text`

## Files

```text
.pi/
  skills/
    adr/
      references/
        format.md             update
    brief/
      references/
        tasks.md              update
    plan/
      references/
        tasks.md              update
    propose/
      SKILL.md                update
      references/
        tasks.md              update
    work/
      references/
        tasks.md              update
```

## Slices

## 1.スキルの文面の食い違いを閉じる

### Types

なし

### Steps

1. `.pi/skills/adr/references/format.md`:
   - `Research & Trial` の説明から、試作を走らせたという記述を外す。ADR が書くのは、決定が乗る事実だけになる。セクションの名前は変えない。

2. `.pi/skills/propose/SKILL.md`:
   - `4. Stop` の箇条から、候補のセクションと重なる規則を外す。「決めるのは ADR」「owner がサイクルを起こす」は、候補のセクションと「そうしない」のセクションにだけ置く。
   - 停止の段は、そこで仕事が終わることだけを書く。

3. `.pi/skills/brief/references/tasks.md`:
   - 型の並びを、1 つの型に 1 行にする。`propose` のものと同じ書き方にする。何に答えるかは変えない。

4. `.pi/skills/plan/references/tasks.md` と `.pi/skills/work/references/tasks.md`:
   - 前書きの 1 行を、4 つの `tasks.md` で同じ文にする。

5. `.pi/skills/propose/references/tasks.md`:
   - 公式情報の説明を、`brief` のものと同じ文にする。

### Verify:

- read: `review` サブエージェントが `.pi/skills/adr/references/format.md`、`.pi/skills/propose/SKILL.md`、4 つの `references/tasks.md`（`brief` / `propose` / `plan` / `work`）を読み、次の各ケースを報告する
  - (happy) `adr/references/format.md` の `Research & Trial` の説明を読む → 試作を走らせたと書いておらず、決定が乗る事実を書くと書いてある
  - (happy) `adr/references/format.md` を読む → セクションの名前（`Context` / `Decision` / `Research & Trial` / `Definition Change`）が変わっていない
  - (happy) `propose/SKILL.md` の `4. Stop` を読む → 候補のセクションと同じ規則を繰り返していない
  - (happy) `propose/SKILL.md` を読む → 「決めるのは ADR」が `4. Stop` に無く、候補のセクション・収束点のセクション・「そうしない」のセクションにある
  - (happy) `propose/SKILL.md` を読む → 「どの候補でサイクルを起こすかは owner」が候補のセクションと「そうしない」のセクションにあり、`4. Stop` に無い
  - (happy) `propose/SKILL.md` の `4. Stop` を読む → そこで仕事が終わることが書かれている
  - (happy) 4 つの `references/tasks.md` を読む → `# Texts handed to subagents` の見出し、同じ前書きの 1 行、`## <何> (a <role> subagent)` の見出し、囲み、の順になっている
  - (happy) `brief` と `propose` の型の並びを読む → 1 つの型に 1 行で、公式情報の行が同じ文になっている
  - (boundary values) `brief` と `propose` の型を読む → `brief` は 3 つの型を 1 行ずつ持ち、`propose` は 2 つで、`propose` の SKILL.md がソースは探索で読むと書いている
  - _no case_: 文面の読みやすさ — 読む者の判断であり、機械では決まらない

## Notes

### Slice 1: スキルの文面の食い違いを閉じる

- Findings: なし
- Unplanned: check で揃っていない所が見つかり、plan の step を 5 つに増やした（`work` の前書き、`propose` の公式情報の行）。`Files` も合わせて直した。
- Commit: 70e7a36

## Review

### Round 1

- Stale: なし — `3dc4e12..HEAD` で旧文面の残存はなく、`README.md`・`DEFINITION.md` に旧表記の残存はない。`.pi/skills/adr/references/format.md:28` と `.pi/skills/adr/scripts/scaffold.mjs:35` の「試した事」は Shape の例示で Entries の説明ではなく、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:37` の対象外のため本 change が古くしたものではない。
- Unlisted: なし — `3dc4e12..HEAD` の製品差分 6 件（`.pi/skills/adr/references/format.md`、`.pi/skills/brief/references/tasks.md`、`.pi/skills/plan/references/tasks.md`、`.pi/skills/propose/SKILL.md`、`.pi/skills/propose/references/tasks.md`、`.pi/skills/work/references/tasks.md`）は `cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:5-15` の Files と一致し、Files 外の製品変更はない。
- Gaps:
  - `.pi/skills/propose/SKILL.md:46` の owner 決定が候補のセクションとそうしないのセクションにあることに対応する case がなく、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:58` は「決めるのは ADR」の配置だけを見て owner を見ない。`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:57` は Stop が繰り返さないことだけのため現行 `.pi/skills/propose/SKILL.md:46,69` の存在を押さえず、外しても read が緑のままになる。`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:40` の Steps と `cycles/261018-022-feat-new-skill/adr.md:82` の Adopted は配置を決めていないため ADR・plan 決定値の除外に当たらず、`look`/`use` の扱いもない。
    - fixed: 「どの候補でサイクルを起こすかは owner」の置き場所を見る case を足した。
  - `.pi/skills/propose/SKILL.md:50` の Stop が仕事が終わることだけを書くことに対応する case がなく、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:57-58` は繰り返さないこと・ADR 決定がないことだけのため Stop が空でも別文でも read が緑のままになる。`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:41` の Steps は存在を決めているため除外に当たらない。
    - fixed: `4. Stop` に仕事が終わることが書かれているのを見る case を足した。
- Unproven: なし — 各 happy/boundary は対応する文を外せば赤になる。`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:55` は試作の語が残れば赤に、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:56` はセクション名が動けば赤に、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:57-58` は旧 Stop が残れば赤に・候補等から外せば赤に、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:59-61` は前書き・型・数が崩れれば赤になると読める弱さはない。
- Doubts:
  - `.pi/skills/adr/references/format.md:28` と `.pi/skills/adr/scripts/scaffold.mjs:35` の試した事は事実の例示と読めるため Stale にしなかった。
  - `.pi/skills/brief/SKILL.md:72` の Stop の ADR 決定は `brief` と `propose` で技能が別で Files・Steps の対象外のため Stale にしなかった。
  - `.pi/skills/brief/SKILL.md:36` のまとめた一文は `.pi/skills/brief/references/tasks.md:10-11` の要約として読めるため指摘にしなかった。
  - `.pi/skills/propose/SKILL.md:8,61,68` の ADR 決定の重なりは導入・収束点・補足で、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:58` が収束点を含むため厳密な「だけ」の不一致としては指摘にしなかった。

## Acceptance

- Ran: `read`（10 ケース、1 回）、`pnpm typecheck`、`pnpm test:run`（41 files、699 tests）である。壊して確かめたのは 3 つで、`format.md` の `Research & Trial` に試作を戻す、`4. Stop` に決定の規則を戻す、`brief` の型を 1 行にまとめ戻すと、どれも赤になって戻した。
- Findings: なし。review の 2 件は `fixed` で、Round 2 が確かめている。
- Doubts: なし。
