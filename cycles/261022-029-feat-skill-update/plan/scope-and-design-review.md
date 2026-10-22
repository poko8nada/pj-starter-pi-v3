# PLAN `scope-and-design-review`

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md                       update
      references/
        format.md                    update
      scripts/
        scaffold.mjs                 update
        scaffold.test.ts             update
    brief/
      SKILL.md                       update
    close/
      SKILL.md                       update
      references/
        format.md                    update
      scripts/
        collect.mjs                  update
    design/
      SKILL.md                       update
      references/
        format.md                    update
        tasks.md                     update
    plan/
      SKILL.md                       update
      references/
        format.md                    update
    propose/
      SKILL.md                       update
    yolo/
      SKILL.md                       update
definition/
  rules.md                           update
README.md                            update
README.ja.md                         update
```

## Slices

## 1. 定義の規則と ADR の書式

### Types

なし

### Steps

1. `definition/rules.md`:
   - ユニットの行は主たる機能の説明であり、機能を得る経路と検査は行に入らない、と足す。
2. `.pi/skills/adr/SKILL.md`:
   - 手順 5 を、関係する定義の部分（`Unit` / `Who` / `Stack` / `What`）を挙げ、変わるかそのままかを理由付きで決める形に書き直す。
   - 手順 5 から `なし` を消す。
3. `.pi/skills/adr/references/format.md`:
   - `Definition Change` の節を `Definition` に改める。
   - 操作に `(kept)` を足し、値は行が動かない理由とする。
   - `なし` と、値の無い `(updated)` を消す。

### Verify:

- `read`: `review` サブエージェントがこの 3 ファイルを読み、次を報告する。
  - (happy) `definition/rules.md` に「行は主たる機能。経路と検査は入らない」の文がある → ある。
  - (happy) `adr/SKILL.md` の手順 5 に、4 種類の名前を挙げて 4 つの操作で書く文がある → ある。
  - (empty) `adr/references/format.md` の `Definition` の節に `なし` が無い → 無い。
  - (error) `Definition Change` の語が 3 ファイルのどれかに残る → 指摘として返る。

## 2. 雛形とテスト

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/scaffold.mjs`:
   - 雛形の節名を `### Definition` にする。
   - `- \`Unit.<name>\`(kept): <行が動かない理由>` の行を出す。
   - `- なし` の行を消す。
2. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - 見出しの名前、並び順、`(kept)`、`なし` の検査を消す。ゼロ埋めの検査は残す。

### Verify:

- `read`: `review` サブエージェントが `scaffold.mjs` と `scaffold.test.ts` を読み、次を報告する。
  - (happy) 雛形に `### Definition` と `(kept)` の行がある → ある。
  - (empty) 雛形に `- なし` が無い → 無い。
  - (happy) テストに、見出しの名前・並び順・`(kept)`・`なし` の検査が無い → 無い。
  - (error) 雛形の節名が `Definition Change` のまま → 指摘として返る。

## 3. brief / propose / design の手順

### Types

なし

### Steps

1. `.pi/skills/brief/SKILL.md`:
   - 手順 1 の直後に、内外の一覧を確定する工程を置く。軸は変更 / 品質 / 運用。外の行は理由を持つ。
   - `## The end` に、内外の一覧が書けることを足す。
2. `.pi/skills/propose/SKILL.md`:
   - 候補ごとに内外の一覧を持たせる。
   - `## The end` に、内外の一覧が書けることを足す。
3. `.pi/skills/design/SKILL.md`:
   - 手順 5 を `Summary`（ダイジェスト）と `Paths`（変えるファイル）にする。
   - 手順 5 の `Boundary` を、リサーチが返した外の接点にする。
   - `design.md` を書き終えた後に、7 観点 1 往復のレビューを走らせる手順を足す。
   - 手順 2 のリサーチを 4 分類にし、依頼に主体を渡す。
4. `.pi/skills/design/references/format.md`:
   - `### Scope` を `### Summary` にし、`Paths` の節を足す。
   - `Boundary.External` の説明を外の接点に変え、子から `Version` を落とす。
   - `## Cut` に、外の接点を共有するエントリーは 1 つのプランに入れる、を戻す。
   - `## Possibly related files` の説明を、追随と検査に変える。
5. `.pi/skills/design/references/tasks.md`:
   - リサーチの依頼を 4 分類にし、主体を渡す。
   - レビューの依頼を 7 観点で足す。

### Verify:

- `read`: `review` サブエージェントがこの 5 ファイルを読み、次を報告する。
  - (happy) `brief` の手順 1 の後に内外の工程があり、`## The end` にその条件がある → ある。
  - (happy) `propose` に候補ごとの内外と、`## The end` の条件がある → ある。
  - (happy) `design/SKILL.md` に 7 観点のレビュー、`Summary` と `Paths`、4 分類のリサーチ、主体を渡す文がある → ある。
  - (happy) `design/references/format.md` に `Summary` と `Paths`、外の接点の `Boundary`、外の接点を共有するエントリーの `Cut`、追随と検査の `Possibly related files` がある → ある。
  - (happy) `design/references/tasks.md` のリサーチの依頼に 4 分類と主体がある → ある。
  - (empty) `### Scope` と `Definition Change` が 5 ファイルに無い → 無い。
  - (error) 上のどれかが欠ける → 指摘として返る。

## 4. plan / close / yolo / README

### Types

なし

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - 手順 1 で読む design の欄を `No` / `Why` / `Where` / `Summary` / `Paths` / `Boundary` にする。
2. `.pi/skills/plan/references/format.md`:
   - `Outside:` の参照先を、design の `Boundary` の項目から、このプランが design の `Boundary` に書いた項目に変える。
3. `.pi/skills/close/SKILL.md`:
   - 穴の定義から `Scope` を外し、`Files` と `Paths` にする。
   - 「`DEFINITION.md` の行を動かす残り物」を、定義の部分で書き直す。
4. `.pi/skills/close/references/format.md`:
   - 見出しを `ADR <プランの No の値>` にし、design の欄を読まない形にする。
5. `.pi/skills/yolo/SKILL.md`:
   - design の段に、レビューを走らせることを足す。レビューはオーナーの目ではないので、飛ばさない。
6. `README.md`:
   - 8 技能の列挙と説明を、`Definition` と `Scope` に合わせる。
   - `DEFINITION.md` の ADR の文を、定義の変更のときだけ要る、と読めない形にする。
7. `README.ja.md`:
   - 同じ 2 点を直す。

### Verify:

- `read`: `review` サブエージェントがこの 7 ファイルを読み、次を報告する。
  - (happy) `plan/SKILL.md` の欄の並びが `Summary` と `Paths` を含む → 含む。
  - (happy) `close/SKILL.md` の穴の定義が `Files` と `Paths` → そうなっている。
  - (happy) `yolo/SKILL.md` の design の段にレビューの行がある → ある。
  - (happy) `README.md` と `README.ja.md` の 8 技能の列挙と ADR の文が直っている → 直っている。
  - (empty) `### Scope` と `ADR <NN> / Scope` が 7 ファイルに無い → 無い。
  - (error) 上のどれかが欠ける → 指摘として返る。

## 5. close のスクリプト

### Types

なし

### Steps

1. `.pi/skills/close/scripts/collect.mjs`:
   - `SCOPE_HEAD` と `scope` の読み取りを消し、design から何も読まないようにする。
   - `linkText` を、プランの `No` の値をそのまま出す形（`ADR 01, 02, 03, 04, 05`）に変える。
   - `designLinks` と `design.md` を読む道を消す。

### Verify:

- `cli`: 一時ディレクトリに cycle dir を作り、`### ADR & Where` に `- No: 01, 02, 03, 04, 05` を持つ plan md を 1 つ置く（`## Notes` に `- Findings: 穴` を 1 行）。そのうえで `node .pi/skills/close/scripts/collect.mjs <その dir>` を走らせ、できる `close.md` の見出しを読む。
  - (happy) 上の fixture を置いて走らせる → 見出しが `ADR 01, 02, 03, 04, 05`。
  - (error) plan md から `### ADR & Where` を消して走らせる → 見出しが `ADR 未特定`。
  - (empty) `design.md` に `### Scope` と名前を置いて走らせる → 見出しにその名前が出ない。

## Notes

### Slice 1: 定義の規則と ADR の書式

- Findings:
- Unplanned:
- Commit:

### Slice 2: 雛形とテスト

- Findings:
- Unplanned:
- Commit:

### Slice 3: brief / propose / design の手順

- Findings:
- Unplanned:
- Commit:

### Slice 4: plan / close / yolo / README

- Findings:
- Unplanned:
- Commit:

### Slice 5: close のスクリプト

- Findings:
- Unplanned:
- Commit:
