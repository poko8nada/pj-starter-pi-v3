# ADR 074

## 01: 定義の規則の重複の統合と definition.rules.md の組み直し

Type: _Full_

### Context

- C1: ロードマップの 036（0.9.7「rules配下のファイル更新」）が対象である。意図は 2 エントリに分かれ、このエントリは `rules/definition.rules.md` と、重複の解消のために `rules/definition.format.md` を扱う。
- C2: `rules/definition.rules.md` は 6 セクションある。`## What may be a Unit` は 6 つのテスト、`## What may be a Sub` は 3 つの規則、`## How the list is grouped` は 6 本、`## Each field` は 4 本と `Who` と `Stack` の説明、`## What does not come here` は 3 本、`## Naming` は 8 本と `Who` と `Stack` の綴り一覧を持つ。規則・例・語彙の一覧が同じ階層の箇条書きで並ぶ。
- C3: 規則の意味は変えない。文言の修正と、ファイルをまたぐ重複を片方に寄せる移動は行うが、規則そのものを失わない。
- C4: オーナーは、フラットな箇条書きを関心事でまとめ、冗長を削って整理したい。セクションの統合・分割・順序変更と、`## What may be a Unit` の 6 つのテストを原理と帰結の入れ子に組み替えることを許している。
- C5: `rules/roadmap.md` は対象外。`rules/definition.format.md` は重複の解消のためにだけ触る。`cycles/` の記録は更新しない（記録はその時点の事実であるため）。
- このエントリで決めるセクション構成が、エントリ 02 のセクション構成の見本になる。
- C7: オーナーは、ファイルをまたぐ重複もまとめたいとしている。対象は `definition.rules.md` と `definition.format.md` の間の `Who`、`Stack`、1 行 1 Unit/Sub、適用範囲の文である。

### Research & Trial

- F1: セクション見出しは `# Definition rules` と 6 つの `##`（`What may be a Unit`、`What may be a Sub`、`How the list is grouped`、`Each field`、`What does not come here`、`Naming`）である。出所: `rules/definition.rules.md:1,7,22,30,38,50,56`
- F2: `cycles/` を除き、見出しの文字列をそのまま引用する箇所も、バッククォートで見出しを指す箇所もない。`rules/definition.format.md:70` は内容を言い換えて参照するだけである。出所: `rules/definition.format.md:70`（調査範囲: `rules/`、`.pi/`、`scripts/`、`lib/`、`test/`、ルートの `.md`）
- F3: 「test 04」の言及は `rules/definition.rules.md:34` の 1 件だけである。出所: `rules/definition.rules.md:34`
- F4: `rules/definition.rules.md:<行>` の形の行番号引用は 0 件である。参照はファイル名だけで、`.pi/skills/adr/SKILL.md:227` は手順として両ファイルを読むことを指示し、`:246` は「`rules/definition.rules.md` が許さない Unit と Sub は part ではない」と定める。出所: `.pi/skills/adr/SKILL.md:227,246`
- F5: 1 行 1 Unit/Sub の規則は 3 か所にある。`rules/definition.rules.md:35`、`rules/definition.format.md:67`、`rules/definition.format.md:75`。出所: 同左
- F6: `Who` の定義が両ファイルにある（`rules/definition.rules.md:44`、`rules/definition.format.md:66`）。出所: 同左
- F7: `Stack` の定義が両ファイルにある（`rules/definition.rules.md:45`、`rules/definition.format.md:68`）。出所: 同左
- F8: 適用範囲の文が両ファイルにあり、互いを参照している（`rules/definition.rules.md:3,5`、`rules/definition.format.md:70`）。出所: 同左
- F9: 内容が近く条件が異なる組がある（`rules/definition.rules.md:41-42` と `rules/definition.format.md:76`、`rules/definition.rules.md:53` と `rules/definition.format.md:74`）。出所: 同左
- F10: 上記以外に、両ファイル全文の照合で同一文の重複はない。出所: 本調査

### Scope

- In:
  - structure: `rules/definition.rules.md` と `rules/definition.format.md` の間で重複する規則（`Who`、`Stack`、1 行 1 Unit/Sub、適用範囲の文）をどちらに残すかを決め、`definition.rules.md` のセクションの分け方、順序、入れ子、見出しを決める。6 つのテストを原理と帰結の入れ子に組み替えることを含む。
  - downstream: `.pi/skills/adr/SKILL.md` が前提にしている参照が壊れないかを確かめ、壊れる場合だけ合わせる。
  - expression: 見出しと規則の文言を、新しいセクション構成と重複の置き場所に合わせて書き直す。
  - verification: 再構成で規則が落ちていないことを確かめる手段を決める（plan の Verify で、旧バージョンの各行を新しいファイルの見出しと読み合わせる）。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない。
  - failure: 失敗の経路は変えない（文書であり、実行時の失敗がない）。規則を落とさない制約は `verification` で扱う。
  - upstream: 外部のパッケージ・契約・情報源の追加・更新・削除はない。
  - result: 読む人が受け取る規則の種類は変えない（構成と文言だけが変わる）。
  - logic: 規則の条件と判断（何を Unit とし、いつ Sub とするか）は変えない。
  - existing: 配布済みの製品側の文書は移行しない（次の harness-sync の copy が `fs.copyFileSync` で上書きする）。
  - cost: 読み込みの量は結果として減るが、費用を目的にした選択はしない。
  - observability: 監査記録は変えない。
  - release: 配布の仕組みは変えない（`rules` は harness-sync の `copy` の対象のままで、次の copy で配られる）。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: `rules/definition.rules.md` と `rules/definition.format.md` の役割を分けて、重複する規則を片方に寄せたうえで、`definition.rules.md` を「何が Unit か」「何が Sub か」「行をどう書くか」「どう並べるか」「どう名付けるか」「何をここに置かないか」の順に組み直す。読む人は、Unit と Sub の判定、行の書き方、名付けをこのファイルで決められる。（C1, C2, C4）
  - Add:
    - `## What may be a Unit` の下の 4 つの原理の見出し（One noun、Reach and result、One loss、Internal work）と、その下の 6 つのテスト（C4, F1）
    - `## How a line is written`。行が運ぶものと言い方の 2 つの原理の下にまとめる（C4, F9）
    - `## Naming` の下の 4 つの見出し（`Name`、`A Unit's name`、`A Sub's name`、`Spelling lists`）（C4, F1）
  - Update:
    - 冒頭を、役割を宣言する 2 文に変える（判定と書き方と名付けは rules、セクションと欄の形は format）。format への参照を残す（C7, F8）
    - `## What may be a Unit` の 6 つのテストを、原理の下の入れ子にする（C4, F1）
    - `by test 04` を、入れ子の位置を指す文に変える（F3）
    - `## Naming` の綴り一覧の導入を、format の `Who` と `Stack` の定義を指す形にする（F6, F7）
    - `definition.format.md` の 1 行 1 Unit/Sub の重複（`## Sections` の `Users can do` と `## Writing`）を 1 つにまとめる（C7, F5, F10）
  - Drop:
    - `definition.rules.md` の `Who` と `Stack` の定義（format に残す）（C7, F6, F7）
    - `definition.rules.md` の 1 行 1 Unit/Sub の規則（format に残す）（C7, F5）
    - `definition.rules.md` の `## Each field` の欄の説明（format の `## Sections` が持つ）（C7, F6, F7）
- Policy:
  - Allowed:
    - セクションの統合、分割、順序の変更、見出しの改名（C3, F2, F4）
  - Forbidden:
    - 規則の条件を変えること - 意味を変えないと決めたため（C3）
    - `cycles/` の記録を直すこと - 記録はその時点の事実であるため（C5）

#### Details

- 冒頭（本文）
  ```md
  # Definition rules

  Read this when a line is added, moved or dropped. It holds what may be a Unit or a Sub of `DEFINITION.md`, and how the Units, the Subs, the `Who` and the `Stack` are named and written; the shape of the file and its fields are in `rules/definition.format.md`.
  ```
- `rules/definition.format.md` の `## Sections` の `Users can do`（規則を外し、セクションが何を持つかの説明だけにする）
  ```md
  - `Users can do` — what the `Who` can do with each Unit and Sub.
  ```
- `rules/definition.format.md` の `## Writing` に残す 1 行（1 行 1 Unit/Sub の唯一の規則）
  ```md
  - One line is one Unit, or one Sub under its Unit.
  ```
- `rules/definition.rules.md` から落とす行
  ```text
  `## Each field` の `Who` と `Stack` の定義
  1 行 1 Unit/Sub の規則
  ```
- `rules/definition.rules.md` に残す綴り一覧
  ```text
  `## Naming` の `Who` と `Stack` の綴り一覧は残す。`Who` と `Stack` の意味は format の `## Sections` を指す。
  ```
- `## What may be a Unit` の入れ子
  ```md
  ## What may be a Unit

  ### One noun

  - The `Who` calls the thing by one noun. A capability, a state or an internal mechanism has no noun of its own: it is not a Unit.
  - One noun is one Unit. More verbs on the same noun stay inside it, on its line or on a Sub's line.
  - A new noun that stands on its own is another Unit.
  - A Sub keeps the Unit's noun and adds its own word after an underscore: it is not a new Unit.
  - A Unit may span many directories. A directory is not a Unit.

  ### Reach and result

  - The `Who` can reach it and do one thing with it. Another Unit's capability is not a precondition. Data or content is fine as a precondition.
  - Using it changes something the `Who` can see, and the `Who` can stop there. If the work has to continue, the rest is inside the same Unit.

  ### One loss

  - Taking the Unit's line away removes exactly one thing the `Who` could do: its main function.
  - Two losses at the same level: two Units. No loss: it is not a Unit.
  - A thing that cannot exist without the Unit is a Sub, and its own line carries its one loss.

  ### Internal work

  - Aligning, refactoring, syncing are not Units. When they happen, the Unit they touch moves.

  The kinds below are how the Units of this product happen to appear. They are examples, not a rule: an extension, a skill, a gate, a document, a command.
  ```
- `by test 04` の置き換え
  ```md
  - A heading is not a Unit: taking it away loses more than one thing, and a Unit carries exactly one loss.
  ```
- `## How a line is written`（`## Each field` を置き換える本文）
  ```md
  ## How a line is written

  ### A line is the function it carries

  - A Unit's line is its main function. A Sub's line is its own.
  - The route to that function does not go in it: the implementation, the steps, the command, the settings, the file layout.
  - The checks that hold it up do not go in it either: whatever runs to prove it.
  - So a line moves only when the function it carries changes. A change to the route or to a check leaves the line as it is.

  ### A line is written from the `Who`'s side

  - The form is `<Who> が、xxx する`.
  - The name is the thing's name; the description is not.
  - A Sub's line takes the same form, and its `Who` may be a role other than the Unit's.
  ```
- `## Naming` の組み方
  ```md
  ## Naming

  ### Name

  - The name is the `Who`'s word for the thing.
  - The name says what the Unit is. The feature layer is gone, so the name is the only place that says it.

  ### A Unit's name

  - A Unit's name is two or more words joined with hyphens. Two shapes:
    - a thing and its kind: `lefthook-gate`, `adr-skill`, `agent-rules`
    - an object and its work: `sound-notify`
  - A bare word is not written: `lint`, `test`, `consult`, `readme`.
  - The tool's name belongs to the `Stack`: `oxlint` is written there, and the Unit is named for what the `Who` uses.

  ### A Sub's name

  - A Sub's name is the Unit's name, an underscore, and the Sub's own name: `subagent-consult_status`. The underscore appears once, and only in a Sub's name.
  - A Sub's own name is one word, or words joined with hyphens. One word is allowed: the Unit's name already makes the whole name two or more words.

  ### Spelling lists

  - The lists below are the spelling. They are not a gate: a name that is not in them is decided in the ADR entry, and written in `DEFINITION.md`. The list gains the name later, outside a cycle.
  - `Who`:
    - people: owner / administrator / operator / moderator / staff / member / user / customer / subscriber / guest / visitor / author / editor / reader / viewer / buyer / seller / player / student / teacher
    - developers, for a library, a framework, an API or a CLI: developer / integrator / plugin author
    - not a person: another service / the side that sends a webhook / agent / a team
  - `Stack`:
    - Ground: Language / Runtime / Package manager / Deploy
    - Checks: Typechecker / Test runner / Linter / Formatter / Git hooks / Build
    - Agent: Host / Schema
    - Product: Full-stack framework / Web framework / View / Router / Styling / State / Data / Auth / Server / API / Job / Mail / Search / Payments / Analytics / i18n
  ```
- 検証の手段（決定事項）
  ```text
  plan の Verify は、`git show HEAD:rules/definition.rules.md` の各行を、新しいファイルの見出しと読み合わせる。
  ```

### Definition

- `Unit.definition-rules`(kept): 規則の形と置き場所が変わるだけで、エージェントが全体像の書き方の規則を読めるという主機能は変わらない。
- `Unit.definition-file`(kept): `definition.format.md` の重複が消えるだけで、全体像を 1 枚で読めるという主機能は変わらない。
- `Who`(kept): 役と `Does` と `Needs` は変わらない。`Who` の定義の置き場所が format に寄るだけである。
- `Stack`(kept): グループと役と値は変わらない。`Stack` の定義の置き場所が format に寄るだけである。

## 02: readme.format.md のセクション構成と Skeleton の一本化

Type: _Full_

### Context

- C1: ロードマップの 036（0.9.7「rules配下のファイル更新」）が対象である。意図は 2 エントリに分かれ、このエントリは `rules/readme.format.md` と、それを読む `scripts/product-ready` の追随を扱う。
- C2: `rules/readme.format.md` は 3 セクションある。`## Skeleton` と `## Skeleton (ja)` がほぼ同一の説明文とフェンスを持ち、`## Writing` に 9 本のフラットな箇条書きが並ぶ。
- C3: `product:ready` は `rules/readme.format.md` の `## Skeleton` を `README.md` の全体テンプレート、`## Skeleton (ja)` を `README.ja.md` の全体テンプレートとして読む（`scripts/product-ready/targets.mjs`）。
- C4: オーナーは、2 つの Skeleton を 1 か所にまとめてよいとしている。日本語のファイルでも見出しには英語を使う前提である。まとめる場合は `product:ready` のコードとテストを追随させる。
- C5: `## Writing` の規則の意味は変えない。文言の修正は行うが、規則の追加と削除は行わない。
- C6: `README.md` と `README.ja.md` の中身は変えない。テンプレートの置き場所と規則の書き方を変える。
- `cycles/` の記録は更新しない（記録はその時点の事実であるため）。

### Research & Trial

- F1: `README.md` のテンプレートは `rules/readme.format.md` の `## Skeleton`、`README.ja.md` のテンプレートは `## Skeleton (ja)` で、どちらも `kind: 'whole'` である。出所: `scripts/product-ready/targets.mjs:72-73`
- `kind: 'whole'` はファイルを丸ごと差し替え、`kind: 'sections'` は見出しの範囲の本文だけを差し替える。出所: `scripts/product-ready/targets.mjs:4-7`
- F3: 取り出しは `blockUnder(text, heading)` で、`trim` した行が見出しと完全一致する最初の行の次から、最初のフェンスブロックの中身を返す。次の見出しでは切らない。フェンスがなければ投げる。出所: `scripts/product-ready/blocks.mjs:14-36`, `scripts/product-ready/index.mjs:219-223`
- 開始フェンスは言語接尾辞を無視して受理し、終了フェンスは `trim` した行がフェンス記号と完全一致することを要求する。出所: `scripts/product-ready/blocks.mjs:4,23,32`
- フェンスの内側の空行はそのまま残し、開始と終了のフェンス行だけを除く。出所: `scripts/product-ready/blocks.mjs:33`
- `whole` は書き込みの前に末尾改行を 1 つ足し、`sections` は足さない。出所: `scripts/product-ready/index.mjs:225-235`
- F7: `whole` は `fillDefaults` を通し、テンプレートの `##` 範囲のうち `###` を持つものの `###` 以下を、いまのファイルの同じ範囲から置き換える。出所: `scripts/product-ready/index.mjs:18-30,150`
- F8: `rules/readme.format.md` のフェンスは 4 行（`md` の開始 2 つと素の終了 2 つ）で、`## Skeleton` と `## Skeleton (ja)` に 1 つずつある。出所: `rules/readme.format.md:9,29,35,55`
- F9: 説明文は、`## Skeleton` が `README.md` を、`## Skeleton (ja)` が `README.ja.md` を、それぞれ見出し直後の最初のフェンスブロックで置き換えると書く。出所: `rules/readme.format.md:5-7,31-33`
- F10: `targets.test.ts` は `## Skeleton (ja)` の見出し文字列も README の Skeleton も確かめない。`skeletonFor` を確かめるのは `ROADMAP.md` と `DEFINITION.md` だけである。出所: `scripts/product-ready/targets.test.ts:89-102`
- F11: `index.test.ts` は実物の `rules/readme.format.md` を一時ツリーに写し、`README.md` と `README.ja.md` の生成結果を確かめる。確かめるのは `## What is in it` の下の `### Product` と `### Default` の順、5 つの `###` の行と段落、見出しが英語で説明が日本語であること。出所: `scripts/product-ready/index.test.ts:32,115-117,159,285-297,333,344,452,466,544`
- いまの `README.md` と `README.ja.md` に `<...>` のプレースホルダ行はない。出所: `README.md:1-75`, `README.ja.md:1-75`

### Scope

- In:
  - structure: `rules/readme.format.md` の Skeleton を 1 つにまとめ、`## Writing` の 9 本を関心事で組み直す。
  - logic: `scripts/product-ready/targets.mjs` の `SKELETONS` を、1 つの見出しを両方の README に使う形に変える。
  - downstream: `scripts/product-ready/index.test.ts` の README 生成のテスト名を追随させ、断言が 1 つのブロックでも通ることを確かめる。
  - expression: 見出しと説明文と `## Writing` の文言を書き直し、1 つのブロックのプレースホルダの言語を決める。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない。
  - failure: 失敗の経路は変えない（`blockUnder` が見出しの下のフェンスを見つけられないときに投げる経路はそのまま）。
  - upstream: 外部のパッケージ・契約・情報源の追加・更新・削除はない。
  - result: 外から見える結果の種類は変えない（README が置き換わるという種類は同じで、中身が変わる）。
  - existing: 配布済みの製品側の README は直さない（`product:ready` は clone のときに一度だけ走る）。
  - cost: 費用を比べて選ぶ場面はない。
  - verification: 検証の手段は変えない（同じ `vitest` のテストで確かめる。追随は `downstream`）。
  - observability: 監査記録は変えない。
  - release: 配布の仕組みは変えない（`rules` は harness-sync の `copy` の対象のままで、次の copy で配られる）。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: 2 つの Skeleton を 1 つにまとめ、`## Writing` の 9 本を関心事の 4 つの見出しに組み直し、`product:ready` の対応表とテストを追随させる。1 つのブロックから両方の README ができ、規則は 1 回読めば分かる。（C1, C2, C3, C4）
  - Add:
    - `## Writing` の 4 つの見出し（Pair、Badges、Sections、Starter）（C5, F8）
    - 1 つの Skeleton を両方の README に使う宣言（C4, F3, F9）
  - Update:
    - `## Skeleton` の説明文を「両方をこのブロックで置き換える」に変える（C4, F9）
    - `scripts/product-ready/targets.mjs` の `README.ja.md` の対応を `## Skeleton` に変える（C4, F1）
    - `scripts/product-ready/index.test.ts` の「それぞれのテンプレートに置き換わる」というテスト名を、1 つのテンプレートに置き換わる形に直す。断言は変えない（C4, F7, F10, F11）
    - プレースホルダを英語に揃え、冠詞を外す（C4, F9）
  - Drop:
    - `## Skeleton (ja)` のセクション（見出し、説明文、フェンス）（C4, F8）
    - `## Writing` のフラットな 9 本の並び（C5）
- Policy:
  - Allowed:
    - セクションの統合と見出しの追加（C3, C4）
    - 1 つのブロックを両方の README に使うこと（C4）
  - Forbidden:
    - `## Writing` の規則の条件を変えること - 意味を変えないと決めたため（C5）
    - `README.md` と `README.ja.md` の中身を変えること - このサイクルではテンプレートの置き場所と規則の書き方だけを変えるため（C6）

#### Details

- `## Skeleton` の本文
  ````md
  ## Skeleton

  `product:ready` replaces both `README.md` and `README.ja.md` with the first fenced block after this heading. A line in `<...>` is a place to fill. Write each language in its own file.

  ```md
  # <name>

  <badges>

  <what it is and does, in one sentence>

  ## What is in it

  ### Product

  ### Default

  ## Getting started

  ## <product's own sections>

  ## Contributing

  ## License
  ```
  ````
- `## Writing` の本文
  ```md
  ## Writing

  ### Pair

  - The pair stays a pair: a heading added to one is added to the other, in the same order.
  - A section the product does not need is left out.
  - Do not write what the reader can look up.

  ### Badges

  - Keep only related badges, each with a value from a source.
  - The badges line sits right after the title with no heading.

  ### Sections

  - `## Getting started` covers install and usage. There is no `## Usage`.
  - A description placed right under a heading is one sentence, holds without reading the list, holds no demonstrative and no name from the list, and holds wherever it is placed.
  - A line in `<...>` is a place to fill; under `## What is in it`, `### Product` keeps the product's own lines and `### Default` takes one line per starter heading.

  ### Starter

  - The starter README holds no `### Product`: the starter itself is not a product, and `### Product` with `### Default` appear only in the template `product:ready` writes.
  ```

### Definition

- `Unit.product-ready`(kept): 1 つのテンプレートを読むようになるだけで、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められるという主機能は変わらない。
