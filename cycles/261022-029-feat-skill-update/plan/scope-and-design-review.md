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

## 3. スコープの内外

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`:
   - 手順 1 で埋めるものに `Scope` を足す。
2. `.pi/skills/adr/references/format.md`:
   - 雛形に `### Scope` を置き、`## Scope` の節を足す。
   - 形は軸の見出しと in / out の行。観点の名前は列挙しない（名前は `brief` のもの）。
3. `.pi/skills/adr/scripts/scaffold.mjs`:
   - 雛形に `### Scope` を、3 つの軸の見出しと in / out の行で出す。
4. `.pi/skills/brief/SKILL.md`:
   - 手順 1 の直後に、内外を確定する工程を置く。
   - 観点を並べ、エージェントが自分の読みとして in / out を先に書き、オーナーが直す形にする。
   - `## The end` に、内外の一覧が書けることを足す。
5. `.pi/skills/propose/SKILL.md`:
   - 手順 4 を足す。候補ごとに、`brief` と同じ観点で in / out に並べ、エージェントの読みを先に書く。
   - 手順 3 の候補の説明から、内外を外す。
   - `## The end` に、内外の一覧が書けることを足す。
   - description の `the Unit it would move` を、関係する定義の部分と内外に変える。

### Verify:

- `read`: `review` サブエージェントがこの 5 ファイルを読み、次を報告する。
  - (happy) `adr/SKILL.md` の手順 1 が `Scope` を含み、`adr/references/format.md` と `scaffold.mjs` の雛形に `### Scope` がある → ある。
  - (happy) `## Scope` の節が軸の見出しと in / out の行で、観点の名前を列挙していない → そうなっている。
  - (happy) `brief` の手順 2 と `propose` の手順 4 が、観点ごとの内外を読みとして先に書き、オーナーが直す形である → そうなっている。
  - (happy) `propose` の手順 3 に、内外が残っていない → 残っていない。
  - (empty) `Definition Change` と `Possibly related files` が 5 ファイルに無い → 無い。
  - (error) 上のどれかが欠ける → 指摘として返る。

## 4. 設計の対象とレビューと欄の名前

### Types

なし

### Steps

1. `.pi/skills/design/SKILL.md`:
   - 手順 1 で、ADR の `Scope` と `Definition` を読む。
   - 手順 2 のリサーチを 4 分類にし、依頼に主体を渡す。
   - 手順 5 を `Summary`（ダイジェスト）と `Paths`（変えるファイル）にし、`Boundary` をリサーチが返した外の接点にする。
   - `design.md` を書き終えた後に、7 観点 1 往復のレビューを走らせる手順を足す。
   - 節の名前を `## Affected` に変える。
2. `.pi/skills/design/references/format.md`:
   - `### Scope` を `### Summary` にし、`Paths` の節を足す。
   - `Boundary.External` の説明を外の接点に変え、子から `Version` を落とす。
   - `## Cut` に、外の接点を共有するエントリーは 1 つのプランに入れる、を戻す。
   - `## Affected` の説明を、追随と検査に変える。
3. `.pi/skills/design/references/tasks.md`:
   - リサーチの依頼を 4 分類にし、主体を渡す。
   - レビューの依頼を 7 観点で足す。
4. `.pi/skills/yolo/SKILL.md`:
   - design の段に、レビューを走らせる行を足す。
   - design の段が飛ばす対象の名前を `## Affected` に変える。

### Verify:

- `read`: `review` サブエージェントがこの 4 ファイルを読み、次を報告する。
  - (happy) `design/SKILL.md` に、7 観点 1 往復のレビュー、`Summary` と `Paths`、4 分類のリサーチと主体、`## Affected` がある → ある。
  - (happy) `design/references/format.md` に `Summary`、`Paths`、外の接点の `Boundary`、`Cut` の外の接点、`## Affected` がある → ある。
  - (happy) `design/references/tasks.md` のリサーチの依頼に 4 分類と主体、レビューの依頼に 7 観点がある → ある。
  - (happy) `yolo/SKILL.md` の design の段にレビューの行があり、飛ばす対象が `## Affected` か → そうなっている。
  - (empty) `Possibly related files` が 4 ファイルに無い → 無い。
  - (error) 上のどれかが欠ける → 指摘として返る。

## 5. 追随する側

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
5. `README.md`:
   - 8 技能の列挙と説明を、`Definition` と `Scope` に合わせる。
   - `DEFINITION.md` の ADR の文を、定義の変更のときだけ要る、と読めない形にする。
6. `README.ja.md`:
   - 同じ 2 点を直す。

### Verify:

- `read`: `review` サブエージェントがこの 6 ファイルを読み、次を報告する。
  - (happy) `plan/SKILL.md` の欄の並びが `Summary` と `Paths` を含む → 含む。
  - (happy) `plan/references/format.md` の `Outside:` が、design の `Boundary` を名指す → 名指す。
  - (happy) `close/SKILL.md` の穴の定義が `Files` と `Paths` → そうなっている。
  - (happy) `README.md` と `README.ja.md` の 8 技能の列挙と ADR の文が直っている → 直っている。
  - (empty) `### Scope` と `ADR <NN> / Scope` が 6 ファイルに無い → 無い。
  - (error) 上のどれかが欠ける → 指摘として返る。

## 6. 締めのスクリプト

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

- Findings: なし
- Unplanned: なし
- Commit: 82df2c4

### Slice 2: 雛形とテスト

- Findings: なし
- Unplanned: テストの部分一致の穴（`### Definition Change` が `### Definition` を含む）を見つけ、`'### Definition\n'` に直した。
- Commit: cdf60dd

### Slice 3: スコープの内外

- Findings:
- Unplanned:
- Commit:

### Slice 4: 設計の対象とレビューと欄の名前

- Findings:
- Unplanned:
- Commit:

### Slice 5: 追随する側

- Findings:
- Unplanned:
- Commit:

### Slice 6: 締めのスクリプト

- Findings:
- Unplanned:
- Commit:
