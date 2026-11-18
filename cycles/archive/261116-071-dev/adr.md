# ADR 071

## 01: Sub の呼び分け方

Type: _Full_

### Context

- C1: 前提: `.pi/skills/adr/references/adr.format.md` の `Decision` では、エントリの関心事を `Main` と `Sub` で表す。
- C2: 前提: `rules/definition.rules.md` の `What may be a Sub` と `Naming` は、ユニットの下の機能を `Sub` と呼び、名前を `<unit>_<sub>` とするもので、サイクル 070 で追加した。
- C3: 意図: オーナーは `Sub` の 2 つの用途を区別したいと考え、サイクル 070 の `close.md` の `**proposed**` を承認した。
- ROADMAP の 033 は `wip` のまま残る。ROADMAP の更新はオーナーがあとで行う。
- 問い: `Sub` をどう呼び分けるか。どちらかを改名するか、注意書きを追加するかである。

### Research & Trial

- F1: `Sub` は、ADR の `Decision` の `Main`/`Sub` 対として 12 か所で使われる。出所: `.pi/skills/adr/SKILL.md:168-169`、`.pi/skills/adr/references/adr.format.md:43,117,120`、`.pi/skills/adr/scripts/adr.mjs:73`、`.pi/skills/adr/scripts/index.test.ts:324,327`、`.pi/skills/plan/SKILL.md:65,124`、`.pi/skills/plan/references/tasks.md:45,73`
- F2: `Sub` は、ユニットの下位機能として 32 か所で使われる。出所: `rules/definition.rules.md:3,14-15,22-28,32,35,40-41,63-64`、`rules/definition.format.md:67,70,75`、`.pi/skills/adr/SKILL.md:229,246`、`.pi/skills/adr/references/adr.format.md:142`、`.pi/skills/close/SKILL.md:8,85,89,93,100,106,111-112`、`.pi/skills/close/references/format.md:110,117-118,125`
- F3: 上記の 44 か所に、`Sub` の他の意味はない。出所: リポジトリ全体の検索（`cycles/`、`node_modules`、生成物を除く）
- F4: `cycles/` の記録にも `Sub` はあるが、この集計では数えていない。出所: `cycles/` の検索（この集計から除いた）

### Scope

- In:
  - result: `adr` の `Decision` と、定義書の `Sub` を、読者が区別できる語にする。文書の内容が変わる。
  - structure: `adr.format.md` の `Decision` の項目名を `Secondary` に変え、定義書の `Sub` の名前の形式は変えないことを確かめる。
  - logic: `Sub` の 2 つの用途について、改名するか注意書きを加えるかを含め、どちらをどのように呼ぶかを決める。
  - downstream: `Sub` を名指す文書（`adr`、`plan`、`close`、`definition`）に矛盾がないかを確かめる。
  - expression: 語と文面を決めた呼び方にそろえる。
- Out:
  - safety: 秘密、権限、露出、個人データに触れない。（理由: 文書の語だけを扱う）
  - failure: 失敗時の経路を変えない。（理由: 検査の追加や失敗経路の変更はない）
  - upstream: 外部の依存を変えない。（理由: 語だけを扱う）
  - existing: 既存の配布物や過去の記録を移行しない。（理由: 直すのは現行文書の語であり、それはこのエントリの変更そのものである）
  - cost: 速度、メモリ、API、トークンに触れない。（理由: 語の変更だけである）
  - verification: 検査の手段を変えない。（理由: 文書を読むことと ja-check で足りる）
  - observability: 過去の記録の `Sub` はそのまま残す。（理由: 記録の種類や signal を変えない）
  - release: 配布や適用の手順を変えない。（理由: 文書だけを扱う）
  - other: 上記の種類から漏れる心配はない。（理由: 扱うのは語だけである）

### Decision

- Status: **accepted**
- Main: `Sub` の語の重なりがなくなり、ADR の `Decision` の関心事を `Main` と `Secondary` で区別して読める。定義書の `Sub` はそのまま残る（C3）。
  - Add:
    - `adr.format.md` の `Decision` に `Secondary` の項目（C1, F1）
  - Update:
    - `adr.format.md`、`adr/SKILL.md`、`plan/SKILL.md`、`plan/references/tasks.md`、`adr.mjs`、`index.test.ts` の `Sub` を `Secondary` にする（C1, F1, F3）
  - Drop:
    - `adr` の `Decision` の `Sub` の語（C1, F1）
- Sub: なし
- Policy:
  - Allowed:
    - `Secondary` を、エントリの `Main` に次ぐ関心事に使う（C3）
    - 定義書の `Sub` を、ユニットの下位機能に使い続ける（C2, F2）
  - Forbidden:
    - `adr` の `Decision` で `Sub` を使わない - 定義書の `Sub` と重なる（C1, F1）
    - 過去の記録の `Sub` を直さない - 過去の記録はそのまま残す（F4）

#### Details

- `adr.format.md` の `Decision`
  ```md
  - Secondary: <この関心事は、何がどうなるか>
    ...
  - `Secondary` is from 0 to multiple.
  - A line under `Main`, `Secondary`, `Add`, `Update`, `Drop` or `Policy` ends with the items it settles, in parentheses: `（C1, F2）`.
  ```
- `adr/SKILL.md` の `Decision` の注意
  ```md
  - An entry has one `Main` concern and sometimes `Secondary` concerns.
  - A `Secondary` is only when its change follows from the `Main`'s change or addition.
  ```
- `plan/SKILL.md`
  ```md
  | `Main` / `Secondary` | mark |
  ...
  Send the plan md and the ADR's `Main`, `Secondary`, `Policy`, `Scope` and `Definition` to one `review` subagent.
  ```
- `plan/references/tasks.md`
  ```md
  ... the ADR's `Main`, `Secondary`, `Policy`, `Scope` and `Definition` ...
  The task names the line, the ADR's `Main` and `Secondary` and `Scope` ...
  ```
- `adr.mjs` のテンプレート
  ```md
  - Secondary: <この関心事は、何がどうなるか>
  ```
- `index.test.ts` のフィクスチャ
  ```ts
  it('(happy) Secondary の行が C を運ぶ → 抜けは空'
  ...
  '- Secondary: 追加の関心事...'
  ```

### Definition

- `Unit.adr-skill`(kept): 主機能は同じで、変わったのは `Decision` の `Main` に次ぐ関心事の語である。
- `Unit.plan-skill`(kept): 主機能は同じで、変わったのは `Definition` から読む関心事の語である。
- `Unit.definition-rules`(kept): 主機能は同じで、定義書の `Sub` はそのまま残る。
- `Unit.close-skill`(kept): 主機能は同じで、`Verified` の `Sub` はそのまま残る。
