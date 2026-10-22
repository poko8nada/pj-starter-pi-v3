# DESIGN 029

## Possibly related files

### 01: スコープの内外を、どこで確定し、どこに残すか

- `.pi/skills/plan/references/format.md` — design の欄の名前を名指す（追随）
- `.pi/skills/adr/scripts/scaffold.test.ts` — 雛形の骨を確かめる（追随）
- `lefthook.yaml` — commit の整形が `md` と `mjs` を対象にする（検査）
- `.oxfmtrc.json` — 整形の設定（検査）
- `.oxlintrc.json` — `mjs` の lint、`md` は除外（検査）
- `scripts/checks/scopes.json` — 型検査の対象（検査）
- `scripts/checks/typecheck-staged.mjs` — `mjs` の型検査（検査）
- `package.json` — `format` / `lint` / `typecheck` の入口（検査）

### 02: `Boundary` に何を書くか

- `.pi/skills/plan/references/format.md` — `Outside:` が design の `Boundary` の項目を名指す（追随）
- `lefthook.yaml` — commit の整形（検査）
- `.oxfmtrc.json` — 整形の設定（検査）
- `package.json` — `format` の入口（検査）

### 03: 設計のレビューをどう組むか

- `.pi/skills/yolo/SKILL.md` — design の段を歩く（追随）
- `.pi/skills/close/SKILL.md` — カットを読む（追随）
- `lefthook.yaml` — commit の整形（検査）
- `package.json` — `format` / `lint` の入口（検査）

### 04: 設計のリサーチに何を挙げさせるか

- `.pi/skills/yolo/SKILL.md` — design の段で paths を書く（追随）
- `.pi/skills/plan/SKILL.md` — design の section を読む（追随）
- `.pi/skills/close/SKILL.md` — カットを読む（追随）
- `.pi/skills/close/references/format.md` — design の plans を読む（追随）
- `.pi/skills/close/scripts/collect.mjs` — `design.md` を読む（追随）
- `lefthook.yaml` — commit の整形（検査）
- `package.json` — `format` の入口（検査）

### 05: 作業の軸を、定義の行から何に変えるか

- `.pi/skills/plan/references/format.md` — plan の欄の名前を名指す（追随）
- `.pi/skills/yolo/SKILL.md` — design の段を歩く（追随）
- `lefthook.yaml` — staged の検査（検査）
- `.oxfmtrc.json` — 整形の設定（検査）
- `.oxlintrc.json` — `mjs` の lint（検査）
- `package.json` — 検査の入口（検査）
- `scripts/checks/typecheck-staged.mjs` — staged の `mjs` の型検査（検査）

## `scope-and-design-review`

### ADR & Where

- No: 01, 02, 03, 04, 05
- Why: 01 の改名と 03・04 の書き換えが `design/SKILL.md` で重なり、`scaffold.mjs` の節名だけを変えると `scaffold.test.ts` が赤になり、`collect.mjs` と `close` の見出しは対でしか使えない。どれも他のプランを待たない。
- Where: base（オーナーが書かれた文面を読む）

### Summary

- `brief` と `propose` の手順 1 の直後に、内外の一覧を確定する工程を足し、`## The end` の条件にも足す。
- 内外の軸は変更 / 品質 / 運用の 3 分類。外の行は理由を持ち、再訪条件は要る行にだけ添える。深さの 3 段階は、エントリーごとに使うか選ぶ。
- `adr` のエントリーに `Scope`（内外）と `Definition`（関係する定義の部分と、`(kept)` か変わるか）を足す。
- `adr` の手順 5 と書式を、関係する部分を挙げ、`(added)` / `(updated)` / `(dropped)` / `(kept)` で書く形に書き直す。`なし` と値の無い `(updated)` を消し、どれも関わらないという書き方もしない。
- `definition/rules.md` に、ユニットの行は主たる機能であり、機能を得る経路と検査は入らない、と書く。
- `design` のプランの欄を `Summary`（ダイジェスト）と `Paths`（このプランが変えるファイル）にする。
- `design` の `Boundary` を、リサーチが返した外の接点にする。子は `Env` / `Contract` / `Data` / `Path` / `Limit` で、`Version` を落とす。版は設計に書かず、`package.json` を読む。
- 外の接点を共有するエントリーは、1 つのプランに入れる（カットの材料に戻す）。
- `DEFINITION.md` の `Stack` に版の列は足さない。
- `design` にレビューの工程（7 観点、1 往復）を足す。覆いはレビュワーが見る。
- `design` のレビューと `work` のレビューは別の依頼文を使う（`design/references/tasks.md` と `work/references/tasks.md`）。
- `design` のリサーチを 4 分類にする。この変更を読むもの（逆依存）、検査するもの、生成されるもの、話す外のもの（相手、契約、環境、データ、上限）。「この変更が読むもの」は落とす。
- リサーチの依頼に、エントリーと、変更が書き換えるファイル（主体）を渡す。
- `plan`、`close`、`yolo` の欄の名前と段の列挙を合わせ、`collect.mjs`、`scaffold.mjs`、`scaffold.test.ts` を直す。
- `yolo` の design の段にレビューを足す。レビューはオーナーの目ではなくサブエージェントの往復なので、`yolo` でも走らせる。
- `collect.mjs` の見出しを、プランの `No` の値（`ADR 01, 02, 03, 04, 05`）にし、design の欄を読むのをやめる。
- `close` の「定義の行を動かす残り物」の扱いを、定義の部分で書き直す。
- `work` は `design` の `Where` を読むだけで、変えない。
- `README.md` と `README.ja.md` の 8 技能の列挙と分担の文を、`Definition` と `Scope` に合わせる。

### Paths

- `.pi/skills/adr/SKILL.md`
- `.pi/skills/adr/references/format.md`
- `.pi/skills/adr/scripts/scaffold.mjs`
- `.pi/skills/adr/scripts/scaffold.test.ts`
- `.pi/skills/brief/SKILL.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/close/scripts/collect.mjs`
- `.pi/skills/design/SKILL.md`
- `.pi/skills/design/references/format.md`
- `.pi/skills/design/references/tasks.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/propose/SKILL.md`
- `.pi/skills/yolo/SKILL.md`
- `README.md`
- `README.ja.md`
- `definition/rules.md`

### Boundary

- Plans: なし
- External:
  - `git`: ブランチ名から cycle の slug を作る
    - Contract: worktree のブランチは `consult/scope-and-design-review` なので、できるフォルダ名が base と変わる
  - `端末の日付`: 実行した日を cycle の日付にする
    - Env: 走らせる日で、できるフォルダ名が変わる
