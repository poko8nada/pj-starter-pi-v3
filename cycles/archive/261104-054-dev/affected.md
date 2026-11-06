# Affected 054

## 01: スターターの README をどの見出しで何を書く形にするか

### Code

#### README.md

- Search:
  - 01: `README.md` のパス参照（scripts/product-ready 配下） - 7件/3ファイル: 置き換え後の本文の中身は見えない
  - 02: `## What is in it` の見出し参照（リポジトリ全体） - 44件/9ファイル: 5見出し化後の新文はまだ存在しないため見えない
  - 03: `## Contributing` の見出し参照（ルート直下・rules・scripts/product-ready） - 3件/3ファイル: cycles配下の旧議論の文脈は見えない
  - 04: `pullfrog` の参照（README.md・README.ja.md・.github配下） - 10件/3ファイル: ワークフローの実行状態は見えない
  - 08: `product:ready` の置き換え宣言（rules配下） - 4件/3ファイル: 実行時の置き換え結果は見えない
  - 09: バッジの規則と行（rules/readme.format.md・scripts/product-ready/readme-format.test.ts・README.md・README.ja.md） - 8件/4ファイル: 画像の表示結果と値の解決は見えない
  - 10: `README` のテスト内参照（scripts/product-ready/index.test.ts） - 6件/1ファイル: 置き換え後の本文の目視は見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`## What is in it` の詰め込み・重複・抜けは Context（adr.md:7-9）、5見出し化・説明文1文・項目ごとの説明・フェンス廃止・4つの見出しの削除は Scope の format in（adr.md:16）と Decision（adr.md:54-61）、一覧の中身は Decision（adr.md:64-67）、`## Getting started` の前提条件1文は Decision（adr.md:68）、題名・説明・言語リンクは Decision（adr.md:69）、バッジ4つとプルフロッグ除外は Scope の dependency in（adr.md:19）と Decision（adr.md:62-63）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える本体であり、見出し・説明文・一覧・バッジ・前提条件の文が置き換えられる。`### Checks` は `lefthook.yaml` の検査内容と一致させる先であり、`### CI` は `_Under construction_` を置く先である。
- Role: スターターの使い方を外向きに示す利用文書で、公開面である。
- Role change: **Change**
  - 見出しの可視性が変わる（`## What is in it` の1塊から5小見出しへ、トップレベルの `## Contributing`、`## Checks`、`## Harness`、`## Cycle` が消えて項目の説明に寄り、サイクルのフェンスが消える）。規則が変わる（一覧の各項目が `- <パス>: <説明>` の形で説明を持ち、同じ種類の項目は入れ子になる）。バッジの規則が変わる（出所つき4つに限り、プルフロッグを外す）。`## Getting started` の流れが変わる（前提条件1文が先頭に立つ）。
- Adjustment: **YES**
  - 5見出しへの組み直し、各見出し直後の説明文1文、一覧の項目ごとの説明と入れ子、バッジ4つへの置き換え、`## Contributing`、`## Checks`、`## Harness`、`## Cycle` の削除、前提条件1文を書く。詳細はplanが決める。

#### README.ja.md

- Search:
  - 01: `README.md` のパス参照（scripts/product-ready 配下） - 7件/3ファイル: 置き換え後の本文の中身は見えない
  - 04: `pullfrog` の参照（README.md・README.ja.md・.github配下） - 10件/3ファイル: ワークフローの実行状態は見えない
  - 08: `product:ready` の置き換え宣言（rules配下） - 4件/3ファイル: 実行時の置き換え結果は見えない
  - 09: バッジの規則と行（rules/readme.format.md・scripts/product-ready/readme-format.test.ts・README.md・README.ja.md） - 8件/4ファイル: 画像の表示結果と値の解決は見えない
  - 10: `README` のテスト内参照（scripts/product-ready/index.test.ts） - 6件/1ファイル: 置き換え後の本文の目視は見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。英語の READMEと同じ組み替えを日本語の READMEにも施し、見出し名は英語のまま揃えることは Scope の naming in（adr.md:18）と Decision（adr.md:54-59）のとおりである。現文の7対の見出し対応は保たれたまま組み替えられる。
- Direction: _Read by_
- Relation: 変更が書き換える本体の日本語側であり、英語の READMEと同じ見出し・説明文・一覧・バッジ・前提条件の文が置き換えられる。`rules/readme.format.md` の対保持（同順・同数）の相手である。
- Role: スターターの使い方を日本語で外向きに示す利用文書で、公開面である。
- Role change: **Change**
  - 英語の READMEと同じく可視性・規則・流れが変わる（5小見出し化、`## コントリビュート` に相当する最上位の見出しと、`## Checks`、`## Harness`、`## Cycle` に相当する見出しの削除、項目ごとの説明と入れ子、フェンスの削除、バッジ4つ、前提条件1文）。題名が `# Harness-included starter（ハーネス付きスターター）` と英語（日本語）表記になる。日英の対の境界は変わらない。
- Adjustment: **YES**
  - 英語の READMEと同じ組み直しを日本語の READMEに施し、見出し名は英語のまま揃え、題名は英語（日本語）表記にし、説明の文は現行を継承し、一覧の項目ごとの説明と入れ子、4つの見出しの削除を同じにする。詳細はplanが決める。

#### package.json

- Search:
  - 05: `engines`・`packageManager` のキー参照（package.json・cycles/261104-054-dev/adr.md） - 4件/1ファイル: pnpm実行時のバージョンの切り替えの動的挙動は見えない
  - 08: `product:ready` の置き換え宣言（rules配下） - 4件/3ファイル: 実行時の置き換え結果は見えない
  - 11: `package.json` のテスト内参照（scripts/product-ready/index.test.ts） - 11件/1ファイル: `engines`・`packageManager` の新欄の断言はまだ存在しないため見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`engines: ">=24"` と `packageManager: "pnpm@12.15.0"` を足すことは Scope の dependency in（adr.md:19）と Decision（adr.md:63）、pnpmの判定が変わることは Scope の behaviour in（adr.md:20）と compatibility in（adr.md:21）、値の出所（TypeScript・Node・pnpm・piの対応）は Decision（adr.md:63）と Research（adr.md:43-45）のとおりである。現 `package.json:1-37` に `version`・`engines`・`packageManager` はない。
- Direction: _Read by_
- Relation: 変更が2欄を足す台帳であり、足した後はバッジの値の出所とpnpmの実行時判定の根拠になる。`scripts/product-ready/index.mjs` が `scripts` の旗を読む対象でもある。
- Role: 実行の入口（`scripts`）とバージョンの台帳（`devDependencies`）を束ねる内部の基準面であり、足した後はバージョンの宣言面を兼ねる。
- Role change: **Change**
  - 規則が変わる（Node 24未満では設置が止まり、宣言と違うpnpmは宣言したバージョンへ切り替わる）。境界が変わる（台帳がバッジの値の出所になる）。使う側は変わらない（読むのはpnpmと読む側のまま）。
- Adjustment: **YES**
  - `engines` と `packageManager` の2欄を足す。詳細はplanが決める。

#### rules/readme.format.md

- Search:
  - 02: `## What is in it` の見出し参照（リポジトリ全体） - 44件/9ファイル: 5見出し化後の新文はまだ存在しないため見えない
  - 03: `## Contributing` の見出し参照（ルート直下・rules・scripts/product-ready） - 3件/3ファイル: cycles配下の旧議論の文脈は見えない
  - 08: `product:ready` の置き換え宣言（rules配下） - 4件/3ファイル: 実行時の置き換え結果は見えない
  - 09: バッジの規則と行（rules/readme.format.md・scripts/product-ready/readme-format.test.ts・README.md・README.ja.md） - 8件/4ファイル: 画像の表示結果と値の解決は見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。テンプレートと生成の仕組みは変えないことは Scope の refactor out（adr.md:22）のとおりであり、現 `rules/readme.format.md:9-25` のテンプレートと `## Writing`（出所つきバッジ、`## Getting started` が導入と使い方を兼ねる）はそのまま残る。
- Direction: _Read_
- Relation: 変更が従う書式であり、特に出所つきバッジの規則（`## Writing`）が新しいバッジ4つの根拠になる。テンプレート自体は `product:ready` の置き換え先として読まれるだけである。
- Role: README2枚の形を定める書式で、検査（`readme-format.test.ts`）と生成（`product-ready`）が読みに来る共有の基準である。
- Role change: Not change
  - 比べたものは使う人の数（検査と生成が読むまま）、境界（テンプレートと規則の持ち分け）、可視性（公開の規則）、主体（読まれる側）、規則（8行・6行の固定）、流れ（読まれて写される順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/targets.mjs

- Search:
  - 01: `README.md` のパス参照（scripts/product-ready 配下） - 7件/3ファイル: 置き換え後の本文の中身は見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`README.md` と `README.ja.md` を置換対象に列挙し、テンプレートの出所を `rules/readme.format.md` とすることは Research（adr.md:46-48）のとおりであり、生成の仕組み自体は Scope の refactor out（adr.md:22）で変えない。
- Direction: _Read by_
- Relation: 変更後の2枚のREADMEを置換対象として挙げる表であり、`index.mjs` がテンプレート引きに使う出所表を兼ねる。本文の中身には触れない。
- Role: 置き換える物の一覧で、`index.mjs` から読まれる内部の対象表である。
- Role change: Not change
  - 比べたものは使う人の数（`index.mjs` が読むまま）、境界（対象は4件のまま）、可視性（内部の表）、主体（読まれる側）、規則（`whole` 指定）、流れ（表を引いて置き換える順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/index.mjs

- Search:
  - 11: `package.json` のテスト内参照（scripts/product-ready/index.test.ts） - 11件/1ファイル: `engines`・`packageManager` の新欄の断言はまだ存在しないため見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。README2枚をテンプレートで丸ごと置き換え、`test` 系3スクリプトの旗を外し `vitest.starter.config.ts` を消すことは Research（adr.md:46）と `index.mjs:7-9・:132-177` のとおりであり、仕組み自体は Scope の refactor out（adr.md:22）で変えない。
- Direction: _Read by_
- Relation: 変更後の2枚のREADMEと `package.json`（`test` 系の旗）と `vitest.starter.config.ts` を置き換え・消去する実行であり、本文の中身には触れない。
- Role: 置き換えと消去を走らせる入口で、一時ツリーの検査（`index.test.ts`）から呼ばれる内部の流路である。
- Role change: Not change
  - 比べたものは使う人の数（検査と所有者が呼ぶまま）、境界（対象4件と旗3件と設定1件）、可視性（内部の実行）、主体（書く側）、規則（`--run` なしは表示だけ）、流れ（表を引いて書く順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/checks/ja-check.mjs

- Search:
  - 07: `ja-check` の実行の入口（lefthook.yaml・scripts/checks/ja-check.mjs） - 13件/2ファイル: 実行時のステージ対象の顔ぶれは見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。相対リンク先の実在の確かめと `ja-check` の禁止語を使わない書き方は Scope の errors in（adr.md:25）のとおりであり、検査本体の振る舞いは変えない。
- Direction: _Check_
- Relation: 書き換えた2枚のREADMEの日本語を確かめる検査であり、直接は `lefthook.yaml` 経由で stage されたREADMEを走査することで関わる。
- Role: 渡されたファイルを走査し `warn` と `error` を出して終了符号を返す単一用途の実行物である。
- Role change: Not change
  - 比べたものは使う人の数（`lefthook` と検査から呼ばれるまま）、境界（引数と設定パスの受け方）、可視性（公開されない検査）、主体（走査する側）、規則（終了符号の規則）、流れ（読み込みから走査・集計への順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/checks/ja-check.json

- Search:
  - 07: `ja-check` の実行の入口（lefthook.yaml・scripts/checks/ja-check.mjs） - 13件/2ファイル: 実行時のステージ対象の顔ぶれは見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。禁止語を使わない書き方は Scope の errors in（adr.md:25）のとおりであり、辞書の中身自体はこのエントリーでは変えない。
- Direction: _Read_
- Relation: 書き換える日本語が従う辞書であり、`ja-check.mjs` が読み込む境界の設定である。説明文1文ずつの語はこの辞書に触れない書き方になる。
- Role: 禁止語の辞書という共有資源であり、`mjs` との間の境界に置かれる設定である。
- Role change: Not change
  - 比べたものは使う人の数（`mjs` が読むまま）、境界（設定と検査本体の関係）、可視性（リポジトリ内の設定）、主体（読まれる側）、規則（欄の構成）、流れ（読み込まれて走査に使われる順序）であり、いずれも変わらない。
- Adjustment: No

#### lefthook.yaml

- Search:
  - 07: `ja-check` の実行の入口（lefthook.yaml・scripts/checks/ja-check.mjs） - 13件/2ファイル: 実行時のステージ対象の顔ぶれは見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`### Checks` に寄せる内容（commit時の5検査・push時の2検査・3コマンド）は現 `lefthook.yaml:1-36` と現READMEの `## Checks`・`## Contributing` のとおりであり、配線自体は変えない。
- Direction: _Read_
- Relation: `### Checks` の記述が一致させる相手であり、書き換えたREADMEのコミット時に `ja-check` を含む検査群を走らせる配線である。
- Role: commit時とpush時の検査群の呼び出しの入口で、変更分だけを配る内部の配線である。
- Role change: Not change
  - 比べたものは使う人の数（commit・pushの呼び出しのまま）、境界（引数の渡し方と `glob`）、可視性（開発者が見る設定）、主体（呼ぶ側）、規則（終了符号による抑止）、流れ（並列実行の中の位置）であり、いずれも変わらない。
- Adjustment: No

#### .github/workflows/pullfrog.yml

- Search:
  - 04: `pullfrog` の参照（README.md・README.ja.md・.github配下） - 10件/3ファイル: ワークフローの実行状態は見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。プルフロッグのバッジを外すことと `.github/workflows/pullfrog.yml` を削除することは Scope の dependency in（adr.md:19）と Decision（adr.md:62）のとおりであり、ワークフローが手動実行だけであることは Research（adr.md:39：`pullfrog.yml:4-12`）のとおりである。CI の整備はロードマップの `1.0.0 002` が扱う。
- Direction: _Read by_
- Relation: 外していたバッジが指していた先であり、外した後は README の一覧（`### CI` は `_Under construction_`）から読まれなくなり、ファイル自体が消える。
- Role: dispatchでエージェントを走らせる実行の定義で、手動起動の外部実行の入口である。
- Role change: **Change**
  - 読む側の数が減る（READMEのバッジと `### CI` の一覧が指さなくなる）。主体と境界が変わる（dispatchでエージェントを走らせる定義がリポジトリから消える）。可視性が変わる（READMEから状態が見えなくなる）。規則と流れ（dispatch起動の仕組み）は、消えることで対象がなくなる。
- Adjustment: **YES**
  - `.github/workflows/pullfrog.yml` を削除する。CI の整備はロードマップの `1.0.0 002` が扱う。詳細はplanが決める。

#### scripts/product-ready/index.test.ts

- Search:
  - 10: `README` のテスト内参照（scripts/product-ready/index.test.ts） - 6件/1ファイル: 置き換え後の本文の目視は見えない
  - 11: `package.json` のテスト内参照（scripts/product-ready/index.test.ts） - 11件/1ファイル: `engines`・`packageManager` の新欄の断言はまだ存在しないため見えない
  - 12: `ROADMAP` のテスト内参照（scripts/product-ready/targets.test.ts・index.test.ts・scripts/checks/ja-check.test.ts） - 21件/3ファイル: 新項目の断言はまだ存在しないため見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。確かめるのはテンプレートによる置き換え後の見出し（`## What is in it`・`## 入っているもの`）と `package.json` の旗の付け外しであり、スターター側READMEの本文の中身は断言しない。生成の仕組みを変えないことは Scope の refactor out（adr.md:22）のとおりである。
- Direction: _Check_
- Relation: 置き換えの振る舞いを確かめる検査であり、直接は一時ツリーでの置き換えと旗の断言で、間接はテンプレートの読みで関わる。スターター側の書き換え自体は確かめない。
- Role: 一時ツリーで置き換えを走らせて断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（置き換えを呼ぶ検査のまま）、境界（一時ツリーの構成）、可視性（公開されない検査）、主体（断言する側）、規則（置き換え後と旗の断言）、流れ（書いて読む順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/readme-format.test.ts

- Search:
  - 09: バッジの規則と行（rules/readme.format.md・scripts/product-ready/readme-format.test.ts・README.md・README.ja.md） - 8件/4ファイル: 画像の表示結果と値の解決は見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。テンプレートの8行と `## Writing` の6行を固定することは現 `readme-format.test.ts:17-46` のとおりであり、スターター側READMEの書き換えは断言しない。テンプレートを変えないことは Scope の refactor out（adr.md:22）のとおりである。
- Direction: _Check_
- Relation: テンプレートの形を留める検査であり、直接は `EXPECTED_EN`・`EXPECTED_JA`・`EXPECTED_WRITING` の照合で関わる。スターター側の書き換え自体は確かめない。
- Role: テンプレートの固定値を断言する留め具である。
- Role change: Not change
  - 比べたものは使う人の数（テンプレートを読む検査のまま）、境界（実物の読みと写しの突き合わせ）、可視性（公開されない検査）、主体（断言する側）、規則（8行・6行の固定）、流れ（読んで比べる順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/checks/ja-check.test.ts

- Search:
  - 12: `ROADMAP` のテスト内参照（scripts/product-ready/targets.test.ts・index.test.ts・scripts/checks/ja-check.test.ts） - 21件/3ファイル: 新項目の断言はまだ存在しないため見えない
  - 15: ファイル直読（README.md:1-89・README.ja.md:1-89・package.json:1-37・ROADMAP.md:31-56・rules/readme.format.md:1-56・scripts/product-ready/index.mjs:7-9・:132-177・targets.mjs:25-33・:72-73・lefthook.yaml:1-36・.github/workflows/pullfrog.yml:1-12・scripts/checks/ja-check.mjs:1-13） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。仮設定と一時ツリーの子プロセスで振る舞いを確かめる検査であり、実物のREADMEの文言は断言しない。
- Direction: _Check_
- Relation: 日本語検査の振る舞いを置く場所であり、直接は子プロセス実行で、間接は `SCRIPT` 経由で `mjs` を呼ぶことで関わる。書き換えたREADMEの文言自体は検査しない。
- Role: 一時ツリーに設定と対象ファイルを作り、子プロセスで実行して出力と終了符号を断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（`mjs` を呼ぶ検査のまま）、境界（一時ツリーと子プロセスの構成）、可視性（公開されない検査）、主体（断言する側）、規則（出力と終了符号の断言）、流れ（設定を書いて実行する順序）であり、いずれも変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 13: `https?://` の外部参照（README.md・README.ja.md・.github/workflows/pullfrog.yml） - 10件/3ファイル: 取得の成否は見えない
  - 14: Node・pnpm のバージョンの保存場所（リポジトリ直下の `.nvmrc`・`.node-version`・`.github/workflows` の `node-version`） - 0件/0ファイル: pnpm実行時のバージョンの切り替えの動的挙動は見えない
- Adr: ADRの事実と一致する。依存の追加・削除は `package.json` の2欄に限り（Scope の dependency in、adr.md:19）、秘密・権限・外部接続は扱わない（Scope の security in は参照先を4つに限ること、adr.md:24）。配布・移行・監視は扱わない（Scope の deploy out・migration out・logs and monitoring out、adr.md:28-30）。バッジ画像はURLの文字列であり、外部との取決めはない。
- Relation: 変更が外部と受け渡すものはない。バージョンの宣言は `package.json` の中に置き、画像の取得成否は確かめない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 02: product:ready がプロダクトの README をどう組み立てるか

### Code

#### rules/readme.format.md

- Search:
  - 01: `rules/readme.format.md` のパス参照（scripts/product-ready 配下） - 4件/3ファイル: 置き換え結果は見えない
  - 02: `## What is in it` の見出し参照（scripts/product-ready 配下・rules 配下・ルート直下） - 7件/4ファイル: 置き換え後の本文の目視は見えない
  - 03: `## Skeleton` の見出し参照（scripts/product-ready 配下） - 11件/4ファイル: 実行時の読み替えは見えない
  - 04: `## Writing` の参照（scripts/product-ready 配下・rules 配下） - 4件/3ファイル: 規則の文言の妥当性は見えない
  - 09: `product:ready` の置き換え宣言（rules 配下） - 4件/3ファイル: 実行時の置き換え結果は見えない
  - 14: `## 入っているもの` の参照（rules・scripts/product-ready・README.ja.md） - 4件/4ファイル: 英語化後の形はまだ存在しないため見えない
  - 15: `## Getting started`・`## License` の参照（ルート直下・rules・scripts/product-ready） - 8件/3ファイル: 日本語の READMEの英語化後は見えない
  - 17: ファイル直読（rules/readme.format.md:1-56） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。唯一の出所であることは Decision（adr.md:123）、`## What is in it` の下の `###` 2つ（前がプロダクト用、後ろが `### Default`）は Scope の format in（adr.md:92）と Decision（adr.md:123）、`### Product` を置かない理由と説明文の規則は Scope の format in（adr.md:92）と Decision（adr.md:124）、日本語の見出しの英語化（`## What is in it`・`## Getting started`・`## License`）は Decision（adr.md:125）のとおりである。現 `rules/readme.format.md:16-17`・`:38-39` の `## What is in it`・`## 入っているもの` は本文も `###` も持たない。
- Direction: _Read by_
- Relation: 変更が書き換える本体であり、テンプレートに `###` 2つを足し、`## Writing` に規則と理由を足し、日本語の見出しを英語に置く先である。`scripts/product-ready` がテンプレートと本文を読む出所でもある。
- Role: README2枚の形と規則を定める書式で、検査と生成が読みに来る共有の基準である。
- Role change: **Change**
  - 可視性が変わる（`## What is in it` の下に `###` が2つ現れる）。規則が変わる（説明文の規則と `### Product` を置かない理由が `## Writing` に加わる）。境界が変わる（日英のテンプレートの見出しが英語にそろう）。使う人の数は変わらない（検査と生成が読むまま）。
- Adjustment: **YES**
  - Skeleton2つの組み直し、`## Writing` への規則と理由の追加、日本語の見出しの英語化を書く。詳細はplanが決める。

#### scripts/product-ready/index.mjs

- Search:
  - 05: `blockUnder` の関数参照（scripts/product-ready 配下） - 6件/3ファイル: 実行時の動的挙動は見えない
  - 06: `sectionOf` の関数参照（scripts/product-ready 配下） - 6件/3ファイル: 実行時の動的挙動は見えない
  - 07: `skeletonFor` の参照（scripts/product-ready 配下） - 7件/3ファイル: テンプレート不在時の挙動は見えない
  - 08: `jobsFor`・`replaceSections` の参照（scripts/product-ready 配下） - 4件/1ファイル: 組み立て後の本文はまだ存在しないため見えない
  - 16: `planLines` の定義・使用（scripts/product-ready 配下） - 10件/3ファイル: 表示の目視は見えない
  - 17: ファイル直読（scripts/product-ready/index.mjs:1-186） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。置き換え前の各 `###` の直後の段落を集めて `- <見出しの名前>: <段落>` にし、後ろの `###` の本文に置き、前の `###` を残すことは Decision（adr.md:126）、見出し名を定数にせずテンプレートから読むことは Decision（adr.md:127）と Options（adr.md:131-132）、書き込み前の停止は Decision（adr.md:129）と Scope の errors in（adr.md:100）、`### Default` の見出しの表示は Scope の logs and monitoring in（adr.md:107）のとおりである。現 `index.mjs:47-72` は `whole` をそのまま書き、`README.md`・`README.ja.md` の本文を読まない。
- Direction: _Read by_
- Relation: 変更が書き換える実行であり、置き換え前の読み取り、箇条書きの組み立て、後ろの `###` への配置、書き込み前の検証、見出しの表示を担う先である。
- Role: 置き換えと消去を走らせる入口で、一時ツリーの検査から呼ばれる内部の流路である。
- Role change: **Change**
  - 流れが変わる（そのまま書く順序から、読んで集めて置いて確かめて書く順序へ）。主体が変わる（置き換え前のREADMEを読む側になる）。規則が変わる（固定の見出し名とプレースホルダ置換を持たない）。境界が変わる（テンプレートから見出しを読む）。使う人の数は変わらない（検査と所有者が呼ぶまま）。
- Adjustment: **YES**
  - 組み立ての処理への名前付け、段落の収集と配置、テンプレートからの見出し読み、書き込み前の検証、見出しの表示を書く。エラーケースはplanが決める。

#### scripts/product-ready/blocks.mjs

- Search:
  - 05: `blockUnder` の関数参照（scripts/product-ready 配下） - 6件/3ファイル: 実行時の動的挙動は見えない
  - 06: `sectionOf` の関数参照（scripts/product-ready 配下） - 6件/3ファイル: 実行時の動的挙動は見えない
  - 17: ファイル直読（scripts/product-ready/blocks.mjs:1-59） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`blockUnder` が見出し後ろの最初のフェンス中身を返し、`sectionOf` が見出し直後の本文範囲を返すことは Research（adr.md:112）のとおりである。組み立てが `sectionOf` を使うことは Decision（adr.md:126）の段落収集の相手である。
- Direction: _Read_
- Relation: 変更が使う道具であり、テンプレートの取り出しと見出し直後の本文範囲の取得で関わる。直接は `index.mjs` と `readme-format.test.ts` からの呼び出しで、間接は組み立ての段落収集で関わる。
- Role: 見出しから範囲と中身を返す単一用途の共有関数である。
- Role change: Not change
  - 比べたものは使う人の数（`index.mjs` と検査が読むまま）、境界（引数と戻り値の受け方）、可視性（内部の共有）、主体（読まれる側）、規則（完全一致とフェンス・見出し判定）、流れ（読んで範囲を返す順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/targets.mjs

- Search:
  - 01: `rules/readme.format.md` のパス参照（scripts/product-ready 配下） - 4件/3ファイル: 置き換え結果は見えない
  - 03: `## Skeleton` の見出し参照（scripts/product-ready 配下） - 11件/4ファイル: 実行時の読み替えは見えない
  - 07: `skeletonFor` の参照（scripts/product-ready 配下） - 7件/3ファイル: テンプレート不在時の挙動は見えない
  - 13: `README.md`・`README.ja.md` のパス参照（scripts/product-ready 配下） - 11件/3ファイル: 置き換え前の段落の有無は見えない
  - 17: ファイル直読（scripts/product-ready/targets.mjs:1-93） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`README.md` を `## Skeleton`、`README.ja.md` を `## Skeleton (ja)` で `whole` とすることは Research（adr.md:111）と現 `targets.mjs:72-73` のとおりであり、出所表自体の変更は Scope・Decisionのいずれにもない。
- Direction: _Read_
- Relation: 変更が読む出所表であり、どのREADMEをどのテンプレートで読むかの対応で関わる。本文の中身と組み立てには触れない。
- Role: 置き換える物の一覧で、`index.mjs` から読まれる内部の対象表である。
- Role change: Not change
  - 比べたものは使う人の数（`index.mjs` が読むまま）、境界（対象は4件のまま）、可視性（内部の表）、主体（読まれる側）、規則（`whole` 指定）、流れ（表を引いて読む順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/cli.mjs

- Search:
  - 12: `--only` の旗参照（scripts/product-ready 配下） - 7件/2ファイル: 実行時の絞り込み結果は見えない
  - 16: `planLines` の定義・使用（scripts/product-ready 配下） - 10件/3ファイル: 表示の目視は見えない
  - 17: ファイル直読（scripts/product-ready/cli.mjs:1-83） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`--only <label>` と表示の行の形を変えないことは Scope の compatibility in（adr.md:101）のとおりであり、`### Default` に並べた見出しを出すことは Scope の logs and monitoring in（adr.md:107）のとおりである。現 `cli.mjs:69-83` の `planLines` は label ごとの件数と `at` のみを出す。
- Direction: _Read by_
- Relation: 変更が書き換える表示であり、`--only` の絞りと行の形は保ったまま、並べた見出しの行を足す先である。
- Role: 引数の解釈と表示の行を作る単一用途の内部の流路である。
- Role change: **Change**
  - 可視性が変わる（並べた見出しが出る）。流れが変わる（`at` の列挙に加えて見出しの列挙が加わる）。境界・主体・規則（`--only` の形と行の形）・使う人の数は変わらない。
- Adjustment: **YES**
  - 見出しの行の足し方を書く。`--only` の形と行の形は変えない。詳細はplanが決める。

#### scripts/product-ready/index.test.ts

- Search:
  - 02: `## What is in it` の見出し参照（scripts/product-ready 配下・rules 配下・ルート直下） - 7件/4ファイル: 置き換え後の本文の目視は見えない
  - 03: `## Skeleton` の見出し参照（scripts/product-ready 配下） - 11件/4ファイル: 実行時の読み替えは見えない
  - 12: `--only` の旗参照（scripts/product-ready 配下） - 7件/2ファイル: 実行時の絞り込み結果は見えない
  - 13: `README.md`・`README.ja.md` のパス参照（scripts/product-ready 配下） - 11件/3ファイル: 置き換え前の段落の有無は見えない
  - 14: `## 入っているもの` の参照（rules・scripts/product-ready・README.ja.md） - 4件/4ファイル: 英語化後の形はまだ存在しないため見えない
  - 17: ファイル直読（scripts/product-ready/index.test.ts:1-353） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。テンプレートの形と生成を `index.test.ts` で確かめることは Decision（adr.md:128）、エラーケースはプランが決めることは Decision（adr.md:128）と Scope の errors in（adr.md:100）のとおりである。現 `index.test.ts:181-192` は `## What is in it` と `## 入っているもの` の有無のみを確かめ、組み立て後の `###` と箇条書きは確かめない。
- Direction: _Check_
- Relation: 変更の振る舞いを確かめる検査であり、直接は一時ツリーでの置き換えとテンプレートの読みで、間接は `RULE_FILES` による実物の写しで関わる。
- Role: 一時ツリーで置き換えを走らせて断言する検査である。
- Role change: **Change**
  - 確かめる対象が増える（テンプレートの `###` 2つと箇条書きの配置、書き込み前の停止）。境界（一時ツリーの構成）と可視性（公開されない検査）と主体（断言する側）は変わらない。
- Adjustment: **YES**
  - テンプレートの形と生成の断言を足す。エラーケースはplanが決める。

#### scripts/product-ready/targets.test.ts

- Search:
  - 03: `## Skeleton` の見出し参照（scripts/product-ready 配下） - 11件/4ファイル: 実行時の読み替えは見えない
  - 07: `skeletonFor` の参照（scripts/product-ready 配下） - 7件/3ファイル: テンプレート不在時の挙動は見えない
  - 13: `README.md`・`README.ja.md` のパス参照（scripts/product-ready 配下） - 11件/3ファイル: 置き換え前の段落の有無は見えない
  - 17: ファイル直読（scripts/product-ready/targets.test.ts:1-147） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。出所表の `whole` 指定と `skeletonFor` の振る舞いは変えないため、現 `targets.test.ts:85-89`・`:96-100` の断言はそのまま残る。組み立ての断言は `index.test.ts` が持つ（Decision adr.md:128）。
- Direction: _Check_
- Relation: 出所表の振る舞いを置く場所であり、直接は `plan` と `skeletonFor` の断言で関わる。組み立て自体は検査しない。
- Role: 一時ツリーに設定と対象ファイルを作り、出所表の対応を断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（出所表を呼ぶ検査のまま）、境界（一時ツリーの構成）、可視性（公開されない検査）、主体（断言する側）、規則（対応と投げの断言）、流れ（書いて呼ぶ順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/cli.test.ts

- Search:
  - 16: `planLines` の定義・使用（scripts/product-ready 配下） - 10件/3ファイル: 表示の目視は見えない
  - 17: ファイル直読（scripts/product-ready/cli.test.ts:1-137） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`--only` の形と行の形を変えないことは Scope の compatibility in（adr.md:101）、見出しの表示を足すことは Scope の logs and monitoring in（adr.md:107）のとおりである。現 `cli.test.ts:35-99` は件数と `at` の行のみを断言し、見出しの行は断言しない。
- Direction: _Check_
- Relation: 表示の振る舞いを置く場所であり、直接は `planLines` の断言で関わる。組み立て自体は検査しない。
- Role: 引数と表示の行を断言する検査である。
- Role change: **Change**
  - 確かめる対象が増える（見出しの行）。境界（引数と行の構成）と可視性（公開されない検査）と主体（断言する側）は変わらない。
- Adjustment: **YES**
  - 見出しの行の断言を足す。行の形は変えない。詳細はplanが決める。

#### scripts/product-ready/readme-format.test.ts

- Search:
  - 01: `rules/readme.format.md` のパス参照（scripts/product-ready 配下） - 4件/3ファイル: 置き換え結果は見えない
  - 02: `## What is in it` の見出し参照（scripts/product-ready 配下・rules 配下・ルート直下） - 7件/4ファイル: 置き換え後の本文の目視は見えない
  - 03: `## Skeleton` の見出し参照（scripts/product-ready 配下） - 11件/4ファイル: 実行時の読み替えは見えない
  - 04: `## Writing` の参照（scripts/product-ready 配下・rules 配下） - 4件/3ファイル: 規則の文言の妥当性は見えない
  - 05: `blockUnder` の関数参照（scripts/product-ready 配下） - 6件/3ファイル: 実行時の動的挙動は見えない
  - 06: `sectionOf` の関数参照（scripts/product-ready 配下） - 6件/3ファイル: 実行時の動的挙動は見えない
  - 11: `EXPECTED_` の固定値参照（scripts/product-ready 配下） - 9件/1ファイル: テンプレートの将来の形は見えない
  - 14: `## 入っているもの` の参照（rules・scripts/product-ready・README.ja.md） - 4件/4ファイル: 英語化後の形はまだ存在しないため見えない
  - 15: `## Getting started`・`## License` の参照（ルート直下・rules・scripts/product-ready） - 8件/3ファイル: 日本語の READMEの英語化後は見えない
  - 17: ファイル直読（scripts/product-ready/readme-format.test.ts:1-133） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。3つの固定値の配列を削除し固定値のテストをなくすことは Scope の refactor in（adr.md:95）と Decision（adr.md:128）、写しが二重管理であることは Context（adr.md:86）と Research（adr.md:114）と Options（adr.md:133）のとおりである。現 `readme-format.test.ts:17-46` が8行・8行・6行を固定する。
- Direction: _Read by_
- Relation: 変更が消す検査であり、直接は `EXPECTED_EN`・`EXPECTED_JA`・`EXPECTED_WRITING` の照合で関わる。消した後はテンプレートの形と生成を確かめない。
- Role: テンプレートの固定値を断言する留め具である。
- Role change: **Change**
  - 存在しなくなる（読む側・断言する側としての数と可視性と規則が消える）。境界（実物の読みと写しの突き合わせ）も消える。
- Adjustment: **YES**
  - ファイルを消す。詳細はplanが決める。

#### README.md

- Search:
  - 02: `## What is in it` の見出し参照（scripts/product-ready 配下・rules 配下・ルート直下） - 7件/4ファイル: 置き換え後の本文の目視は見えない
  - 13: `README.md`・`README.ja.md` のパス参照（scripts/product-ready 配下） - 11件/3ファイル: 置き換え前の段落の有無は見えない
  - 15: `## Getting started`・`## License` の参照（ルート直下・rules・scripts/product-ready） - 8件/3ファイル: 日本語の READMEの英語化後は見えない
  - 17: ファイル直読（README.md:1-89） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。置き換える前の各 `###` の直後の段落を集めることは Decision（adr.md:126）、エントリー01後の5つの `###` と説明文1文は Context（adr.md:84）のとおりである。現 `README.md:9-23` は1つの箇条書きで `###` を持たない。
- Direction: _Read_
- Relation: 変更が読む置き換え前の資料であり、各 `###` の直後の段落を箇条書きの種として渡すことで関わる。本文自体は書き換えない。
- Role: スターターの使い方を外向きに示す利用文書で、公開面である。
- Role change: **Change**
  - 流れが変わる（無視されて丸ごと置かれる側から、段落を読まれる側へ）。境界が変わる（`## What is in it` の `###` ごとの段落が生成の入力になる）。可視性・主体・規則・使う人の数は変わらない。
- Adjustment: **YES**
  - 各 `###` の直後に説明文1文を置く。内容はエントリー01が決める。

#### README.ja.md

- Search:
  - 13: `README.md`・`README.ja.md` のパス参照（scripts/product-ready 配下） - 11件/3ファイル: 置き換え前の段落の有無は見えない
  - 14: `## 入っているもの` の参照（rules・scripts/product-ready・README.ja.md） - 4件/4ファイル: 英語化後の形はまだ存在しないため見えない
  - 17: ファイル直読（README.ja.md:1-89） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。置き換える前の各 `###` の直後の段落を集めることは Decision（adr.md:126）、見出しは英語にそろうことは Scope の format in（adr.md:92）のとおりである。現 `README.ja.md:9-23` は1つの箇条書きで `###` を持たない。
- Direction: _Read_
- Relation: 変更が読む置き換え前の日本語側の資料であり、各 `###` の直後の段落を箇条書きの種として渡すことで関わる。本文自体は書き換えない。
- Role: スターターの使い方を日本語で外向きに示す利用文書で、公開面である。
- Role change: **Change**
  - 英語の READMEと同じく流れと境界が変わる（無視される側から段落を読まれる側へ、`###` ごとの段落が生成の入力になる）。日英の対の境界は変わらない。
- Adjustment: **YES**
  - 各 `###` の直後に説明文1文を置き、見出し名は英語のままそろえる。内容はエントリー01が決める。

### External

#### なし

- Search:
  - 18: `https?://` の外部参照（rules/readme.format.md・scripts/product-ready 配下） - 0件/0ファイル: 外部取得の成否は見えない
- Adr: ADRの事実と一致する。新しいパッケージを足さないことは Scope の dependency out（adr.md:98）、外部からの入力を扱わないことは Scope の security out（adr.md:103）、配布・移行を扱わないことは Scope の deploy out・migration out（adr.md:105-106）のとおりである。読むのは2つのREADMEと1つのテンプレートだけである。
- Relation: 変更が外部と受け渡すものはない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
  - 比べたものは使う人の数、境界、可視性、主体、規則、流れであり、いずれも変わらない。
- Adjustment: No

## 03: ロードマップの記法をどうそろえるか

### Code

#### rules/roadmap.md

- Search:
  - 01: `rules/roadmap.md` のパス参照（.pi/skills/adr/SKILL.md） - 3件/1ファイル: 置き換え後の本文は見えない
  - 02: `rules/roadmap.md` のパス参照（.pi/skills/close/SKILL.md・rules/definition.format.md・scripts/product-ready/targets.mjs） - 3件/3ファイル: 置き換えの実行結果は見えない
  - 03: `ROADMAP.md` のパス参照（rules/roadmap.md） - 2件/1ファイル: 表の選択・書込みの実行は見えない
  - 06: status の語参照（rules/roadmap.md:11・:19-20・.pi/skills/adr/SKILL.md:45-46・.pi/skills/close/SKILL.md:101） - 6件/3ファイル: 表の選択・書込みの実行は見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。status が `todo`、`wip`、`done` であることは現 `rules/roadmap.md:11` のとおりであり、cycles の文字に触れていないことは現 `rules/roadmap.md:11-12・:19-20` のとおりである（adr.md:144、:170）。直す内容は Scope（adr.md:151）と Decision（adr.md:181-183）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える本体であり、status の語と cycles の形・文字の決め方を書き足す先である。`adr` と `close` が形と規則を読みに来る出所でもある。
- Role: 表の語と形を定める書式で、`adr` と `close` と生成が読みに来る共有の基準である。
- Role change: **Change**
  - 規則が変わる（`todo` が `_todo_` になり、`todo` だけがアンダースコアで囲まれる。cycles が `NNN-m`、`NNN-d`、`NNN-f` になり、文字が接尾辞の最初の語の頭文字と決まる）。可視性が変わる（cycles の文字の決め方が文になる）。使う人の数（`adr` と `close` と生成が読むまま）、境界（テンプレートと規則の持ち分け）、主体（読まれる側）、流れ（読まれて書かれる順序）は変わらない。
- Adjustment: **YES**
  - status の3語と cycles の形・文字の決め方を書く。`## Skeleton` は変えない。詳細はplanが決める。

#### .pi/skills/adr/SKILL.md

- Search:
  - 01: `rules/roadmap.md` のパス参照（.pi/skills/adr/SKILL.md） - 3件/1ファイル: 置き換え後の本文は見えない
  - 04: `ROADMAP.md` のパス参照（.pi/skills/adr/SKILL.md） - 4件/1ファイル: 表の選択の実行は見えない
  - 06: status の語参照（rules/roadmap.md:11・:19-20・.pi/skills/adr/SKILL.md:45-46・.pi/skills/close/SKILL.md:101） - 6件/3ファイル: 表の選択・書込みの実行は見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`todo` と `wip` を候補とし選んだ項目を `wip` にすることは現 `SKILL.md:45-46` のとおりであり、素の語であることは Research（adr.md:171）のとおりである。そろえることは Scope の naming in（adr.md:152）と Decision（adr.md:184）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える手順であり、`todo` の語を `_todo_` にそろえ、記法の説明を `rules/roadmap.md` に寄せる先である。
- Role: 項目の選び方と status の書込みを定める手順で、サイクルの入口に置かれる共有の手順である。
- Role change: **Change**
  - 規則が変わる（候補と書込みの語が `_todo_`、`wip`、`done` になる）。境界が変わる（語の決め方が `rules/roadmap.md` に寄り、スキル側は参照になる）。使う人の数（エージェントが読むまま）、可視性（公開されない手順）、主体（読んで書く側）、流れ（意図の確定から項目の選択への順序）は変わらない。
- Adjustment: **YES**
  - status の語を `_todo_` にそろえ、記法の説明を `rules/roadmap.md` への参照にする。詳細はplanが決める。

#### .pi/skills/close/SKILL.md

- Search:
  - 02: `rules/roadmap.md` のパス参照（.pi/skills/close/SKILL.md・rules/definition.format.md・scripts/product-ready/targets.mjs） - 3件/3ファイル: 置き換えの実行結果は見えない
  - 05: `ROADMAP.md` のパス参照（.pi/skills/close/SKILL.md・scripts/product-ready/targets.mjs・scripts/checks/ja-check.mjs） - 5件/3ファイル: 表の書込み・置換・走査の実行は見えない
  - 06: status の語参照（rules/roadmap.md:11・:19-20・.pi/skills/adr/SKILL.md:45-46・.pi/skills/close/SKILL.md:101） - 6件/3ファイル: 表の選択・書込みの実行は見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`done` にするか `wip` のままにする語は現 `SKILL.md:101` のとおりであり、素の語であることは Research（adr.md:171）のとおりである。直後で形と規則を `rules/roadmap.md` に委ねることは現 `SKILL.md:102` のとおりであり、説明を `rules/roadmap.md` に置くこと（adr.md:184）と合う。
- Direction: _Read_
- Relation: 変更が従う先の読む側であり、`rules/roadmap.md` の語（`done`、`wip`）を読むことで関わる。`todo` の語は持たない。
- Role: 周期の終わりに `cycles` を足して `status` を書く手順で、所有者の判断の後に置かれる共有の手順である。
- Role change: Not change
  - 比べたものは使う人の数（エージェントが読むまま）、境界（形と規則を `rules/roadmap.md` に委ねる関係）、可視性（公開されない手順）、主体（読んで書く側）、規則（`done` にするか `wip` のままにする語）、流れ（判断の後に書く順序）であり、いずれも変わらない。
- Adjustment: No

#### ROADMAP.md

- Search:
  - 03: `ROADMAP.md` のパス参照（rules/roadmap.md） - 2件/1ファイル: 表の選択・書込みの実行は見えない
  - 04: `ROADMAP.md` のパス参照（.pi/skills/adr/SKILL.md） - 4件/1ファイル: 表の選択の実行は見えない
  - 05: `ROADMAP.md` のパス参照（.pi/skills/close/SKILL.md・scripts/product-ready/targets.mjs・scripts/checks/ja-check.mjs） - 5件/3ファイル: 表の書込み・置換・走査の実行は見えない
  - 07: 表の status・cycles の値（ROADMAP.md:31-52） - 20件/1ファイル: 過去サイクルの経緯は見えない
  - 10: 読み飛ばし参照（scripts/checks/ja-check.mjs:160-176・scripts/checks/ja-check.test.ts:204-220） - 10件/2ファイル: 語の妥当性の判定は見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。表が `_todo_`、`wip`、`done` で cycles が `NNN-d`、`NNN-f` の形であることは現 `ROADMAP.md:31-52` のとおりであり（adr.md:143、:169）、表を書き換えないことは Scope の migration out（adr.md:164）のとおりである。
- Direction: _Read_
- Relation: 変更が合わせる相手の実物であり、すでに `_todo_` と `NNN-d`・`NNN-f` の形であることで規則の直しの根拠になる。本文は書き換えない。
- Role: 次にやることの一覧で、`adr` が選び `close` が `cycles` と `status` を書く共有の台帳である。
- Role change: Not change
  - 比べたものは使う人の数（`adr` が選び `close` が書くまま）、境界（`rules/roadmap.md` の形に従う関係）、可視性（公開の台帳）、主体（書かれる側）、規則（列とセクションの規則）、流れ（選んで書く順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/cycle.mjs

- Search:
  - 08: 接尾辞の写像参照（.pi/skills/adr/scripts/cycle.mjs:48-67） - 6件/1ファイル: ブランチ操作の動的挙動は見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。接尾辞が `main` は `main`、`develop` は `dev`、`feature/x` は `feat-x` になることは現 `cycle.mjs:55-67` のとおりであり（adr.md:172）、cycles の文字を最初の語の頭文字とすることは Decision（adr.md:183）の相手である。コードは変えないことは Scope の refactor out（adr.md:155）のとおりである。
- Direction: _Read_
- Relation: 変更が読む由来であり、cycles の文字（`m`、`d`、`f`）の決め方の根拠になることで関わる。本文は変えない。
- Role: ブランチ名から cycle のフォルダ名の語を作る単一用途の共有関数である。
- Role change: Not change
  - 比べたものは使う人の数（`index.mjs` と検査が読むまま）、境界（引数と戻り値の受け方）、可視性（内部の共有）、主体（読まれる側）、規則（完全一致と先頭写像と清書の規則）、流れ（写して返す順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/targets.mjs

- Search:
  - 02: `rules/roadmap.md` のパス参照（.pi/skills/close/SKILL.md・rules/definition.format.md・scripts/product-ready/targets.mjs） - 3件/3ファイル: 置き換えの実行結果は見えない
  - 05: `ROADMAP.md` のパス参照（.pi/skills/close/SKILL.md・scripts/product-ready/targets.mjs・scripts/checks/ja-check.mjs） - 5件/3ファイル: 表の書込み・置換・走査の実行は見えない
  - 09: `skeleton` の参照（scripts/product-ready/targets.mjs） - 11件/1ファイル: 置き換え後の本文の目視は見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`ROADMAP.md` を `rules/roadmap.md` の `## Skeleton` で `whole` とすることは現 `targets.mjs:64` のとおりであり、コードを変えないことは Scope の refactor out（adr.md:155）のとおりである。`## Skeleton` 自体は変えない。
- Direction: _Read_
- Relation: 変更のうち `## Skeleton` だけを読む出所表であり、`Fields` の語の直しには触れないことで関わる。
- Role: 置き換える物の一覧で、`index.mjs` から読まれる内部の対象表である。
- Role change: Not change
  - 比べたものは使う人の数（`index.mjs` が読むまま）、境界（対象は4件のまま）、可視性（内部の表）、主体（読まれる側）、規則（`whole` 指定）、流れ（表を引いて置き換える順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/targets.test.ts

- Search:
  - 11: status語のテスト内断言（scripts・.pi/skills の test ファイル） - 0件/0ファイル: 語を断言する自動検査は存在しないため見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。出所表の `whole` 指定と `skeletonFor` の振る舞いを確かめる検査であり、status・cycles の語は断言しない。コードを変えないことは Scope の refactor out（adr.md:155）のとおりである。
- Direction: _Check_
- Relation: 出所表の振る舞いを置く場所であり、直接は `plan` と `skeletonFor` の断言で関わる。語の直し自体は検査しない。
- Role: 一時ツリーに設定と対象ファイルを作り、出所表の対応を断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（出所表を呼ぶ検査のまま）、境界（一時ツリーの構成）、可視性（公開されない検査）、主体（断言する側）、規則（対応と投げの断言）、流れ（書いて呼ぶ順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/product-ready/index.test.ts

- Search:
  - 11: status語のテスト内断言（scripts・.pi/skills の test ファイル） - 0件/0ファイル: 語を断言する自動検査は存在しないため見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`ROADMAP.md` がテンプレートで置き換わることを確かめる検査であり、置き換えるのは `## Skeleton` の中身だけで、`Fields` の語は断言しない。
- Direction: _Check_
- Relation: 置き換えの振る舞いを置く場所であり、直接は一時ツリーでの置き換えとテンプレートの読みで関わる。語の直し自体は検査しない。
- Role: 一時ツリーで置き換えを走らせて断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（置き換えを呼ぶ検査のまま）、境界（一時ツリーの構成）、可視性（公開されない検査）、主体（断言する側）、規則（置き換え後の見出しと旗の断言）、流れ（書いて読む順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/checks/ja-check.mjs

- Search:
  - 05: `ROADMAP.md` のパス参照（.pi/skills/close/SKILL.md・scripts/product-ready/targets.mjs・scripts/checks/ja-check.mjs） - 5件/3ファイル: 表の書込み・置換・走査の実行は見えない
  - 10: 読み飛ばし参照（scripts/checks/ja-check.mjs:160-176・scripts/checks/ja-check.test.ts:204-220） - 10件/2ファイル: 語の妥当性の判定は見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`ROADMAP.md` の `## 0.x.x` の下を読み飛ばすことは現 `ja-check.mjs:160-176` のとおりであり（adr.md:175）、status・cycles の値の妥当性は確かめない。
- Direction: _Check_
- Relation: 表の語が置かれる `## 0.x.x` を読み飛ばす検査であり、語の直しの前後いずれも走査の対象にしないことで関わる。
- Role: 渡されたファイルを走査し `warn` と `error` を出して終了符号を返す単一用途の実行物である。
- Role change: Not change
  - 比べたものは使う人の数（`lefthook` と検査から呼ばれるまま）、境界（引数と設定パスの受け方）、可視性（公開されない検査）、主体（走査する側）、規則（終了符号の規則と読み飛ばしの規則）、流れ（読み込みから走査・集計への順序）であり、いずれも変わらない。
- Adjustment: No

#### scripts/checks/ja-check.test.ts

- Search:
  - 10: 読み飛ばし参照（scripts/checks/ja-check.mjs:160-176・scripts/checks/ja-check.test.ts:204-220） - 10件/2ファイル: 語の妥当性の判定は見えない
  - 11: status語のテスト内断言（scripts・.pi/skills の test ファイル） - 0件/0ファイル: 語を断言する自動検査は存在しないため見えない
  - 12: ファイル直読（rules/roadmap.md:1-58・ROADMAP.md:31-52・.pi/skills/adr/SKILL.md:42-48・.pi/skills/close/SKILL.md:97-102・.pi/skills/adr/scripts/cycle.mjs:48-67・scripts/product-ready/targets.mjs:62-74・scripts/checks/ja-check.mjs:160-176） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`## 0.x.x` の内側の語は報告しないことを確かめる検査であり（`ja-check.test.ts:204-220`）、status・cycles の語自体は断言しない。
- Direction: _Check_
- Relation: 読み飛ばしの振る舞いを置く場所であり、直接は一時ツリーと `ROADMAP.md` の見出しでの断言で関わる。語の直し自体は検査しない。
- Role: 一時ツリーに設定と対象ファイルを作り、子プロセスで実行して出力と終了符号を断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（`mjs` を呼ぶ検査のまま）、境界（一時ツリーと子プロセスの構成）、可視性（公開されない検査）、主体（断言する側）、規則（出力と終了符号の断言）、流れ（設定を書いて実行する順序）であり、いずれも変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 13: 外部参照（rules/roadmap.md・.pi/skills/adr/SKILL.md・.pi/skills/close/SKILL.md の `https?://`） - 0件/3ファイル: 外部との受け渡しは見えない
- Adr: ADRの事実と一致する。外部との受け渡しがないことは Scope の security out（adr.md:161）と deploy out・migration out・logs and monitoring out（adr.md:162-165）のとおりであり、読むのはリポジトリ内の文書だけである。
- Relation: 変更が外部と受け渡すものはない。語の直しはリポジトリの中に置く。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
  - 比べたものは使う人の数、境界、可視性、主体、規則、流れであり、いずれも変わらない。
- Adjustment: No

## 04: close のトリアージの表記をどうするか

### Code

#### .pi/skills/close/SKILL.md

- Search:
  - 01: `ex-plan` の字面参照（リポジトリ全体） - 97件/23ファイル: 置き換え後の `_ex-plan_` の行の形は見えない（この検索に `.pi/skills/close/SKILL.md` のヒットはない）
  - 02: `proposed` の字面参照（.pi/skills/close配下） - 7件/2ファイル: 置き換え後の `_proposed_` の形は見えない
  - 03: ファイル直読（.pi/skills/close/SKILL.md:35-58・:82-94） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。トリアージの区分を素で書いていることは Context（adr.md:197）、016のメモが `ex-plan` を `_ex-plan_` に `proposed` を `_proposed_` にするとしていることは Context（adr.md:198）、SKILL.mdとformat.mdの `ex-plan` と `proposed` を `_ex-plan_` と `_proposed_` にすることは Scope の format in（adr.md:205）と Decision（adr.md:232）のとおりである。現 `SKILL.md:53・:58` に `proposed` があり、現 `SKILL.md` に `ex-plan` の字面はない。
- Direction: _Read by_
- Relation: 変更が書き換える手順であり、`proposed` の2件を `_proposed_` に置く先である。`ex-plan` の字面は持たず、`ex-` の語で行き先と計画を書くことで関わる。
- Role: 周期の終わりに集めて提案して閉じる手順で、エージェントが読む共有の手順である。
- Role change: **Change**
  - 規則と可視性が変わる（`proposed` が `_proposed_` になり斜体で見える）。使う人の数（エージェントが読むまま）、境界（手順と書式の持ち分け）、主体（読まれて書かれる側）、流れ（集めて提案して閉じる順序）は変わらない。
- Adjustment: **YES**
  - `proposed` の2件を `_proposed_` に置く。`ex-` の扱いは変えない。詳細はplanが決める。

#### .pi/skills/close/references/format.md

- Search:
  - 01: `ex-plan` の字面参照（.pi/skills/close配下） - 9件/3ファイル: 置き換え後の `_ex-plan_` の行の形は見えない
  - 02: `proposed` の字面参照（.pi/skills/close配下） - 7件/2ファイル: 置き換え後の `_proposed_` の形は見えない
  - 03: `no backticks` の文参照（.pi/skills/close配下） - 1件/1ファイル: 書き換え後の文の形は見えない
  - 04: ファイル直読（.pi/skills/close/references/format.md:18-65） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`close.md` の `## Triage` の行の形が `- <N>: ex-plan <plan id> (ADR <NN>, ...)` と `- <N>: proposed ...` であることは Research（adr.md:225）と現 `format.md:18・:22` のとおりであり、idを `ex-plan` のすぐ後ろに置きバッククォートを付けないことは現 `format.md:65` のとおりである。直すことは Scope の format in（adr.md:205）と prose in（adr.md:207）と Decision（adr.md:232・:234）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える書式であり、`ex-plan` の6行と `proposed` の5行を `_ex-plan_` と `_proposed_` に置き、idの文の主語を `_ex-plan_` に合わせる先である。`SKILL.md` と `collect.mjs` と校正が読みに来る出所でもある。
- Role: `close.md` の形を定める書式で、エージェントと検査と収集器が読みに来る共有の基準である。
- Role change: **Change**
  - 規則と可視性が変わる（区分の語が斜体になり、idの文の主語が `_ex-plan_` になる）。使う人の数（エージェントと収集器と校正が読むまま）、境界（形と規則の持ち分け）、主体（読まれる側）、流れ（読まれて書かれる順序）は変わらない。
- Adjustment: **YES**
  - 区分の語の置き換えとidの文の主語合わせを書く。列の形は変えない。詳細はplanが決める。

#### .pi/skills/close/scripts/collect.mjs

- Search:
  - 01: `ex-plan` の字面参照（.pi/skills/close配下） - 9件/3ファイル: 置き換え後の正規表現の中身は見えない
  - 02: `collect.mjs` のパス参照（.pi/skills/close配下） - 7件/4ファイル: 実行時の収集結果は見えない
  - 03: `未特定|UNKNOWN|noOf|readTriageNos` の参照（.pi/skills/close配下） - 14件/4ファイル: `_ex-plan_` 化後の読みの成否は見えない
  - 04: ファイル直読（.pi/skills/close/scripts/collect.mjs:226-265・:369） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`collect.mjs:235` の正規表現が `^-(\s)*\d+:(\s)*ex-plan` を要求し `_ex-plan_` には一致しないことは Research（adr.md:222）と現 `collect.mjs:235` のとおりであり、`proposed` を読むコードがないことは Research（adr.md:223）と現 `collect.mjs` に `proposed` がないことのとおりである。正規表現を `_ex-plan_` に合わせ古い形を読まないことは Scope の refactor in（adr.md:206）と Decision（adr.md:233）のとおりであり、過去の `close.md` を読まないことは Scope の compatibility out（adr.md:212）のとおりである。Scopeの `scripts/close/collect.mjs` は実物の `.pi/skills/close/scripts/collect.mjs` を指す。
- Direction: _Read_
- Relation: 変更が書き換える実行であり、`## Triage` から `ex-` planの `No` を読む正規表現（`readTriageNos:231-238`）を `_ex-plan_` に合わせる先である。古い `ex-plan` の形は読まなくなり、読めないときは `noOf` が nullを返して見出しが `未特定` になる。
- Role: 残りを集めて `## Collected` の見出しに `No` を付ける収集器で、Triageを読んで見出しを書く内部の仕組みである。
- Role change: **Change**
  - 規則が変わる（読む行の形が `_ex-plan_ <plan id> (ADR <NN>, ...)` になり、古い形は一致しなくなる）。使う人の数（検査と所有者が呼ぶまま）、境界（Triage行と見出しの受け渡し）、可視性（内部の実行）、主体（読んで書く側）、流れ（読んで集めて書く順序）は変わらない。
- Adjustment: **YES**
  - 正規表現と注釈の `ex-plan` の形を `_ex-plan_` に合わせる。古い形の分岐は持たない。詳細はplanが決める。

#### .pi/skills/close/scripts/collect.test.ts

- Search:
  - 01: `noOf` の参照（.pi/skills/close/scripts配下） - 9件/2ファイル: `_ex-plan_` 化後の断言は見えない
  - 02: `未特定` の字面参照（.pi/skills/close配下） - 4件/3ファイル: `_ex-plan_` 行の描画の断言は見えない
  - 03: ファイル直読（.pi/skills/close/scripts/collect.test.ts:29-48） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`_ex-plan_` の行から `No` を読めないときに `未特定` になることをテストで確かめることは Scope の errors in（adr.md:211）と Decision（adr.md:235）のとおりである。現 `collect.test.ts:34-36` は旧 `ex-plan` 行（fixture経由）で読めるときと行がないときのnullを確かめ、`未特定` の描画は断言しない。
- Direction: _Check_
- Relation: 変更を確かめる検査であり、直接は `noOf` の戻り（値とnull）の断言で、間接は `writeClose` の見出し描画で関わる。`未特定` の描画の断言を足す先である。
- Role: 一時ツリーで収集を走らせて断言する検査である。
- Role change: **Change**
  - 確かめる対象が変わる（旧 `ex-plan` 行から新 `_ex-plan_` 行へ、nullの先の `未特定` の描画が加わる）。境界（一時ツリーとTriage行の構成）と可視性（公開されない検査）と主体（断言する側）は変わらない。
- Adjustment: **YES**
  - `_ex-plan_` 行の読みと読めないときの `未特定` の断言を足す。旧形の断言は残さない。詳細はplanが決める。

#### .pi/skills/close/scripts/collect.fixture.ts

- Search:
  - 01: `ex-plan` の字面参照（.pi/skills/close配下） - 9件/3ファイル: 置き換え後の生成行の形は見えない
  - 02: ファイル直読（.pi/skills/close/scripts/collect.fixture.ts:31-36） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。Triage行の形が `- <N>: ex-plan <plan id> (ADR <NN>, ...)` であることは Research（adr.md:225）と現 `collect.fixture.ts:34` のとおりであり、正規表現を `_ex-plan_` に合わせることは Decision（adr.md:233）の相手である。ADRに名指しはないが検査の材料である。
- Direction: _Read by_
- Relation: 検査が読むテンプレートであり、Triage行を組み立てて `closeDoc` で渡すことで関わる。生成する行を `_ex-plan_` に変える先である。
- Role: Triage行を持つclose文書のテンプレートを作る単一用途の共有関数である。
- Role change: **Change**
  - 生成する行の形が変わる（`ex-plan` から `_ex-plan_` へ）。使う人の数（検査が読むまま）、境界（引数と戻り値の受け方）、可視性（内部の共有）、主体（読まれる側）、流れ（受けて組み立てる順序）は変わらない。
- Adjustment: **YES**
  - 生成行の区分を `_ex-plan_` に置く。旧形の生成は残さない。詳細はplanが決める。

### External

#### なし

- Search:
  - 01: `https?://` の外部参照（.pi/skills/close配下） - 0件/6ファイル: 外部との受け渡しは見えない
- Adr: ADRの事実と一致する。新しいパッケージを足さないことは Scope の dependency out（adr.md:209）、外部との受け渡しがないことは Scope の security out（adr.md:214）、配布・移行を扱わないことは Scope の deploy out・migration out（adr.md:215-216）、表示を変えないことは Scope の logs and monitoring out（adr.md:217）のとおりである。読むのは `close.md` とplan mdだけである。
- Relation: 変更が外部と受け渡すものはない。表記の置き換えはリポジトリの中に置く。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
  - 比べたものは使う人の数、境界、可視性、主体、規則、流れであり、いずれも変わらない。
- Adjustment: No

## 05: ex- のプランを通常のプランと同じ手順で扱うとき、何をどこに書くか

### Code

#### .pi/skills/close/SKILL.md

- Search:
  - 01: `ex-<what it fixes>` の字面参照（.pi/skills配下） - 4件/2ファイル: レビュー・修正・コミットを加えた後の新文は見えない
  - 02: `An `ex-` plan` の文参照（.pi/skills配下） - 5件/5ファイル: 新手順の文言はまだ存在しないため見えない
  - 03: `write each confirmed` の行参照（.pi/skills/close/SKILL.md） - 1件/1ファイル: 実行時の作業の進行は見えない
  - 04: `consult_worktree` の参照（.pi/skills配下） - 3件/2ファイル: 実行時のworktreeの有無は見えない
  - 05: ファイル直読（.pi/skills/close/SKILL.md:82-86・:94・:112） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。確定した `ex-` のプランを直接書いて作業を走らせると定めていることは Context（adr.md:247）と現 `SKILL.md:84`・`:94` のとおりであり、プラン自体のレビュー・修正・コミットを加えることは Scope の prose in（adr.md:255）と Decision（adr.md:285）のとおりであり、worktree なら worktree を作り `base` なら確認を挟まずに走ることを書くことは Scope の prose in（adr.md:256）と Decision（adr.md:286）のとおりであり、コードは変えないことは Scope の refactor out（adr.md:259）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える本体であり、第9手順と第10手順の `ex-` の行にプラン自体のレビュー・修正・コミットを足し、worktree と `base` の分岐を書く先である。
- Role: 周期の終わりに集めて提案して閉じる手順で、エージェントが読む共有の手順である。
- Role change: **Change**
  - 流れが変わる（書いたらすぐ作業に入る順序から、レビューと修正とコミットを挟む順序へ）。規則が変わる（worktree なら作ること、`base` なら確認を挟まずに走ることが文になる）。使う人の数（エージェントが読むまま）、境界（手順と書式の持ち分け）、可視性（公開されない手順）、主体（読まれて書かれる側）は変わらない。
- Adjustment: **YES**
  - レビュー・修正・コミットの文と worktree・`base` の分岐の文を書く。詳細はplanが決める。

#### .pi/skills/work/SKILL.md

- Search:
  - 01: `wait for their OK` の行参照（.pi/skills/work/SKILL.md） - 1件/1ファイル: オーナーの目視の実行は見えない
  - 02: `takes the default` の行参照（.pi/skills/work/SKILL.md） - 1件/1ファイル: 既定の選択の実行は見えない
  - 03: `consult_worktree` の参照（.pi/skills配下） - 3件/2ファイル: 実行時のworktreeの有無は見えない
  - 04: `An `ex-` plan` の文参照（.pi/skills配下） - 5件/5ファイル: 新手順の文言はまだ存在しないため見えない
  - 05: ファイル直読（.pi/skills/work/SKILL.md:25・:35-46・:59-62・:78-79） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`base` のプランで1スライスごとにオーナーのOKを待つことは Context（adr.md:249）と現 `SKILL.md:46` のとおりであり、`ex-` のプランは確認を挟まないことを書くことは Scope の prose in（adr.md:257）と Decision（adr.md:287）のとおりであり、`ex-` 以外の `base` は1スライスごとの確認のままであることは Decision（adr.md:287）のとおりである。`ex-` の既定が worktree であることは Research（adr.md:277）と現 `SKILL.md:25` のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える手順であり、`base` の手順（`:46`）に `ex-` は確認を挟まない例外を書く先である。`ex-` 以外の行には触れない。
- Role: 計画を1つずつ片付ける手順で、エージェントとサブエージェントが読む共有の手順である。
- Role change: **Change**
  - 規則が変わる（`base` の確認に `ex-` の例外が付く）。流れが変わる（`ex-` の `base` は見せて待たずに進む順序になる）。使う人の数（エージェントとサブエージェントが読むまま）、境界（`Place` による worktree・`base` の分け）、可視性（公開されない手順）、主体（読んで走らせる側）は変わらない。
- Adjustment: **YES**
  - `base` の手順に `ex-` の例外を書く。`ex-` 以外の文は残す。詳細はplanが決める。

#### .pi/skills/plan/SKILL.md

- Search:
  - 01: `review.*subagent|proofreader` の参照（.pi/skills/plan/SKILL.md） - 2件/1ファイル: 実行時のレビューの往復は見えない
  - 02: `An `ex-` plan` の文参照（.pi/skills配下） - 5件/5ファイル: 新手順の文言はまだ存在しないため見えない
  - 03: ファイル直読（.pi/skills/plan/SKILL.md:20・:56-79） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。プランを書いたらすぐ `review` に渡すことは Context（adr.md:248）と現 `SKILL.md:58` のとおりであり、すべてのレビューのあとに `proofreader` を走らせることは Context（adr.md:248）と Research（adr.md:276）と現 `SKILL.md:74` のとおりであり、3つのスキルの記述の食い違いを確かめることは Scope の errors in（adr.md:262）のとおりである。本文は変えない。
- Direction: _Read_
- Relation: 変更がならう相手であり、close が `ex-` のプランに足すレビューと修正の順序の出所になることで関わる。本文には触れない。
- Role: 計画の書き方とレビュー・校正の順序を定める手順で、エージェントが読む共有の手順である。
- Role change: Not change
  - 比べたものは使う人の数（エージェントが読むまま）、境界（ADR と affected を読んで書く関係）、可視性（公開されない手順）、主体（読んで書く側）、規則（1件ずつのレビューとファイルごとの校正）、流れ（書いて渡して直して見せる順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/close/references/format.md

- Search:
  - 01: `ex-<what it fixes>` の字面参照（.pi/skills配下） - 4件/2ファイル: レビューを加えた後の新文は見えない
  - 02: `An `ex-` plan` の文参照（.pi/skills配下） - 5件/5ファイル: 新手順の文言はまだ存在しないため見えない
  - 03: ファイル直読（.pi/skills/close/references/format.md:18・:38・:47・:60・:86） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`ex-` の Triage 行の形と `No` を Triage から読むことは Research（adr.md:279）と現 `format.md:47`・`:60` のとおりであり、`Fixed` の形は現 `format.md:38` のとおりであり、close のコミット時に `ex-` とその作業を別にすること（adr.md:279）は現 `format.md:86` のとおりである。本文は変えない。
- Direction: _Read_
- Relation: 変更が従う書式であり、`ex-` の名付け（`ex-<what it fixes>`）と `No` の出所（Triage 行）の根拠になることで関わる。本文には触れない。
- Role: `close.md` の形を定める書式で、エージェントと収集器が読みに来る共有の基準である。
- Role change: Not change
  - 比べたものは使う人の数（エージェントと収集器が読むまま）、境界（形と手順の持ち分け）、可視性（公開されない書式）、主体（読まれる側）、規則（Triage 行の形と `No` の出所）、流れ（読まれて書かれる順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/plan/references/format.md

- Search:
  - 01: `An `ex-` plan` の文参照（.pi/skills配下） - 5件/5ファイル: 新手順の文言はまだ存在しないため見えない
  - 02: `ex-` の字面参照（.pi/skills/plan/references/format.md） - 1件/1ファイル: 実行時の `No` の扱いは見えない
  - 03: ファイル直読（.pi/skills/plan/references/format.md:102） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`ex-` のプランが `No` を書かず Triage 行を唯一の出所とすることは現 `format.md:102` のとおりであり、close の `ex-` の `No` が Triage から読まれること（adr.md:279）と合う。本文は変えない。
- Direction: _Read_
- Relation: 変更が従う書式であり、`ex-` の `No` の扱いの根拠になることで関わる。本文には触れない。
- Role: 計画の形を定める書式で、エージェントとレビューが読みに来る共有の基準である。
- Role change: Not change
  - 比べたものは使う人の数（エージェントとレビューが読むまま）、境界（形と手順の持ち分け）、可視性（公開されない書式）、主体（読まれる側）、規則（`No` を書かない規則）、流れ（読まれて書かれる順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/work/references/tasks.md

- Search:
  - 01: `Review|owner|base` の参照（.pi/skills/work/references/tasks.md） - 5件/1ファイル: 実行時のレビューの往復は見えない
  - 02: ファイル直読（.pi/skills/work/references/tasks.md:32-57） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。work のレビューが worktree（`base` はエージェントのツリー）で差分を読むことは現 `SKILL.md:59` と現 `tasks.md:32-57` のとおりであり、変更後の `ex-` の作業もこの任務文で走る。本文は変えない。
- Direction: _Read_
- Relation: 変更後の作業が使う任務文であり、レビューと修正の受け渡しで関わる。本文には触れない。
- Role: サブエージェントに渡す任務文で、スライス・掃除・レビュー・修正の入口を束ねる共有の文書である。
- Role change: Not change
  - 比べたものは使う人の数（エージェントが渡すまま）、境界（スキルと任務文の持ち分け）、可視性（公開されない文書）、主体（渡される側）、規則（差分を読んで `## Work Review` に書く規則）、流れ（渡して読ませて書かせる順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/yolo/SKILL.md

- Search:
  - 01: `ex-` の字面参照（.pi/skills/yolo/SKILL.md） - 3件/1ファイル: 変更後の close の順序での実行は見えない
  - 02: ファイル直読（.pi/skills/yolo/SKILL.md:20-47） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。判断後の `ex-` と検証が yolo の仕事でないことは現 `SKILL.md:44`・`:47` のとおりであり、`base` を使わず全計画を worktree にすることは現 `SKILL.md:34` のとおりである。本文は変えない。
- Direction: _Read_
- Relation: 変更後の close の順序を読む側であり、判断後の `ex-` の扱いを close と同じ順序で終点の前に置くことで関わる。本文には触れない。
- Role: 所有者の確認なしに段階を歩く流れで、確認を落とす点だけを定める共有の手順である。
- Role change: Not change
  - 比べたものは使う人の数（所有者が起動しエージェントが歩くまま）、境界（各段階の規則を残して順序だけ歩く関係）、可視性（公開されない手順）、主体（歩く側）、規則（落とす確認の規則）、流れ（plan から work を経て close の判断前で止まる順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/close/scripts/collect.mjs

- Search:
  - 01: `close/SKILL|work/SKILL|plan/SKILL` の参照（.pi/skills/close/scripts配下） - 0件/0ファイル: スキル文書の手順を断言する自動検査は存在しないため見えない
  - 02: ファイル直読（.pi/skills/close/scripts/collect.mjs:226-252） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。Triage から `ex-` の `No` を読むことは現 `collect.mjs:226-252` のとおりであり、コードは変えないことは Scope の refactor out（adr.md:259）のとおりである。
- Direction: _Read_
- Relation: 変更が読む由来であり、`ex-` の `No` を Triage から読む受け渡しの根拠になることで関わる。本文は変えない。
- Role: 残りを集めて `## Collected` の見出しに `No` を付ける収集器で、Triage を読んで見出しを書く内部の仕組みである。
- Role change: Not change
  - 比べたものは使う人の数（検査と所有者が呼ぶまま）、境界（Triage 行と見出しの受け渡し）、可視性（内部の実行）、主体（読んで書く側）、規則（行の形の読み）、流れ（読んで集めて書く順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/close/scripts/collect.test.ts

- Search:
  - 01: `close/SKILL|work/SKILL|plan/SKILL` の参照（.pi/skills/close/scripts配下） - 0件/0ファイル: スキル文書の手順の断言は存在しないため見えない
  - 02: ファイル直読（.pi/skills/close/scripts/collect.test.ts:29-78） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。確かめるのは Triage 行からの `No` の読みと `## Collected` の描画であり、スキルの手順の文言は断言しない。コードは変えないことは Scope の refactor out（adr.md:259）のとおりである。
- Direction: _Check_
- Relation: 収集の振る舞いを置く場所であり、Triage 行の読みで関わる。手順の書き換え自体は検査しない。
- Role: 一時ツリーで収集を走らせて断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（収集を呼ぶ検査のまま）、境界（一時ツリーの構成）、可視性（公開されない検査）、主体（断言する側）、規則（読みと描画の断言）、流れ（書いて呼ぶ順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/close/scripts/collect.fixture.ts

- Search:
  - 01: `close/SKILL|work/SKILL|plan/SKILL` の参照（.pi/skills/close/scripts配下） - 0件/0ファイル: スキル文書の手順の生成は存在しないため見えない
  - 02: ファイル直読（.pi/skills/close/scripts/collect.fixture.ts:8-36） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。Triage 行を持つ close 文書のテンプレートを作ることは現 `collect.fixture.ts:31-36` のとおりであり、手順の書き換えの材料ではない。
- Direction: _Read by_
- Relation: 検査が読むテンプレートであり、Triage 行を組み立てて渡すことで関わる。手順の書き換え自体には触れない。
- Role: Triage 行を持つ close 文書のテンプレートを作る単一用途の共有関数である。
- Role change: Not change
  - 比べたものは使う人の数（検査が読むまま）、境界（引数と戻り値の受け方）、可視性（内部の共有）、主体（読まれる側）、規則（行の組み立ての規則）、流れ（受けて組み立てる順序）であり、いずれも変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 01: `https?://` の外部参照（.pi/skills/close配下） - 0件/6ファイル: 外部との受け渡しは見えない
  - 02: `https?://` の外部参照（.pi/skills/work配下） - 0件/2ファイル: 外部との受け渡しは見えない
- Adr: ADRの事実と一致する。外部との受け渡しがないことは Scope の security out（adr.md:265）、配布・移行を扱わないことは Scope の deploy out・migration out（adr.md:267-268）、表示を変えないことは Scope の logs and monitoring out（adr.md:269）のとおりである。読むのはリポジトリ内の文書だけである。
- Relation: 変更が外部と受け渡すものはない。手順の書き換えはリポジトリの中に置く。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
  - 比べたものは使う人の数、境界、可視性、主体、規則、流れであり、いずれも変わらない。
- Adjustment: No

## 06: work の開始時と close のコミットメッセージをどうするか

### Code

#### .pi/skills/work/SKILL.md

- Search:
  - 01: `update: NNN.*ADR, affected and plan` の字面参照（リポジトリ全体） - 7件/4ファイル: 新形 `NNN-<suffix>` の実コミットは見えない
  - 02: `Commit message` の行参照（リポジトリ全体） - 1件/1ファイル: close の第 13 手順の文言は見えない
  - 03: ファイル直読（.pi/skills/work/SKILL.md:28-31） - 存在と現状の確認: 実行時のコミット操作は見えない
  - 04: `Commit message|ADR, affected|close and roadmap` の参照（_.test._） - 0件/0ファイル: 自動検査による断言は見えない
- Adr: ADRの事実と一致する。現行が `update: NNN's ADR, affected and plan` であることは Context（adr.md:300）と Research（adr.md:326）と現 `SKILL.md:31` のとおりであり、新形が `update: NNN-<suffix>'s ADR, affected and plan` であることは Scope の format in（adr.md:308）と Decision（adr.md:337）のとおりである。`<suffix>` がフォルダ名の番号より右（`261104-054-dev` なら `dev`）であることは Decision（adr.md:338）のとおりである。中身と時点を変えないことは Scope の behaviour out（adr.md:311）、コードを変えないことは Scope の refactor out（adr.md:312）、過去を書き換えないことは Scope の compatibility out・migration out（adr.md:316・321）と Decision（adr.md:339）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える本体であり、第 2 手順のメッセージ行を新形に置き、`<suffix>` の取り方を書く先である。書く対象（`adr.md`・`affected.md`・`plan/*.md`）と時点は変えず、読む対象として関わる。
- Role: 計画を1つずつ片付ける手順で、エージェントが読む共有の手順である。
- Role change: **Change**
  - 規則が変わる（メッセージに `-<suffix>` が付く）。可視性が変わる（履歴に枝名が現れる）。使う人の数（エージェントが読むまま）、境界（対象3種と時点）、主体（読まれて書かされる側）、流れ（文書を書いて束ねて積む順序）は変わらない。
- Adjustment: **YES**
  - メッセージ行の新形への置き換えと `<suffix>` の取り方の文を書く。対象と時点は変えない。詳細はplanが決める。

#### .pi/skills/close/SKILL.md

- Search:
  - 01: `close and roadmap` の字面参照（リポジトリ全体） - 4件/1ファイル: SKILL本文の新行はまだ存在しないため見えない
  - 02: `in one commit` の行参照（.pi/skills/close配下） - 2件/2ファイル: メッセージの文言は見えない
  - 03: ファイル直読（.pi/skills/close/SKILL.md:109-112） - 存在と現状の確認: 実行時のコミット操作は見えない
  - 04: `Commit message|ADR, affected|close and roadmap` の参照（_.test._） - 0件/0ファイル: 自動検査による断言は見えない
- Adr: ADRの事実と一致する。第 13 手順が `close.md` と `ROADMAP.md` を1コミットにすると定めメッセージを定めていないことは Context（adr.md:301）と Research（adr.md:327）と現 `SKILL.md:111` のとおりであり、新たに `close: NNN-<suffix>'s close and roadmap` を書くことは Scope の format in（adr.md:309）と Decision（adr.md:337）のとおりである。中身と時点を変えないことは Scope の behaviour out（adr.md:311）、コードを変えないことは Scope の refactor out（adr.md:312）、過去を書き換えないことは Decision（adr.md:339）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える手順であり、第 13 手順にメッセージの1行を足す先である。束ねる対象（`close.md` と `ROADMAP.md`）と1コミットの形は変えず、読む対象として関わる。
- Role: 周期の終わりに集めて提案して閉じる手順で、エージェントが読む共有の手順である。
- Role change: **Change**
  - 規則が変わる（第 13 手順に形の定めが付く）。可視性が変わる（履歴に枝名が現れる）。使う人の数（エージェントが読むまま）、境界（束ねる2件と1コミットの形）、主体（読まれて書かされる側）、流れ（判断の後に束ねて積む順序）は変わらない。
- Adjustment: **YES**
  - 第 13 手順へのメッセージ1行の追加を書く。束ねる対象と形は変えない。詳細はplanが決める。

#### .pi/skills/adr/scripts/cycle.mjs

- Search:
  - 01: `slugBranch|cycleDirName` の参照（.pi/skills/adr/scripts配下） - 26件/3ファイル: 実行時の枝名から名への写像の実行は見えない
  - 02: ファイル直読（.pi/skills/adr/scripts/cycle.mjs:49-67・:109-117） - 存在と現状の確認: 実行時の枝操作は見えない
- Adr: ADRの事実と一致する。`develop` が `dev` になることは現 `cycle.mjs:57` のとおりであり、番号より右が `dev` であること（adr.md:329・338）の由来になる。コードは変えないことは Scope の refactor out（adr.md:312）のとおりである。本文は変えない。
- Direction: _Read_
- Relation: 変更が読む由来であり、`<suffix>`（番号より右）の決め方の根拠になることで関わる。本文には触れない。
- Role: 枝名から cycle のフォルダ名の語を作り名を組み立てる単一用途の共有関数である。
- Role change: Not change
  - 比べたものは使う人の数（`index.mjs` と検査が読むまま）、境界（引数と戻り値の受け方）、可視性（内部の共有）、主体（読まれる側）、規則（完全一致と先頭写像と清書と0埋め）、流れ（写して返す順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/close/references/format.md

- Search:
  - 01: `in one commit` の行参照（.pi/skills/close配下） - 2件/2ファイル: メッセージの文言は見えない
  - 02: ファイル直読（.pi/skills/close/references/format.md:86） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。`close.md` と `ROADMAP.md` を1コミットにし `ex-` とその作業を別にすることは現 `format.md:86` のとおりであり、中身と時点を変えないこと（adr.md:311）と合う。本文は変えない。
- Direction: _Read_
- Relation: 変更が従う書式であり、束ねる2件と1コミットの形の根拠になることで関わる。本文には触れない。
- Role: `close.md` の形を定める書式で、エージェントと収集器と校正が読みに来る共有の基準である。
- Role change: Not change
  - 比べたものは使う人の数（エージェントと収集器と校正が読むまま）、境界（形と手順の持ち分け）、可視性（公開されない書式）、主体（読まれる側）、規則（束ねる形）、流れ（読まれて書かれる順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/close/scripts/collect.mjs

- Search:
  - 01: `git log|%s` の参照（.pi/skills配下の*.mjs） - 0件/0ファイル: メッセージを読む処理は見えない
  - 02: `git log|%s` の参照（scripts配下の*.mjs） - 0件/0ファイル: メッセージを読む処理は見えない
  - 03: ファイル直読（.pi/skills/close/scripts/collect.mjs:231-252） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。メッセージを読むコードが無いことは Research（adr.md:330）のとおりであり、読むのは Triage 行の `done <commit>` のハッシュであることは Research（adr.md:331）と現 `collect.mjs:231-252` のとおりである。コードは変えないことは Scope の refactor out（adr.md:312）のとおりである。
- Direction: _Read_
- Relation: 変更を読まない実行であり、Triage 行のハッシュ読みで関わることで、メッセージの新旧いずれにも触れない。
- Role: 残りを集めて `## Collected` の見出しに `No` を付ける収集器で、Triageを読んで見出しを書く内部の仕組みである。
- Role change: Not change
  - 比べたものは使う人の数（検査と所有者が呼ぶまま）、境界（Triage行と見出しの受け渡し）、可視性（内部の実行）、主体（読んで書く側）、規則（行の形の読み）、流れ（読んで集めて書く順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/close/scripts/collect.test.ts

- Search:
  - 01: `Commit message|ADR, affected|close and roadmap` の参照（_.test._） - 0件/0ファイル: 自動検査による断言は見えない
  - 02: `work/SKILL|close/SKILL` の参照（_.test._） - 0件/0ファイル: 手順の文言の断言は見えない
  - 03: ファイル直読（.pi/skills/close/scripts/collect.test.ts:29-78） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。確かめるのは Triage 行からの `No` の読みと `## Collected` の描画であり、メッセージの形は断言しない。コードは変えないことは Scope の refactor out（adr.md:312）のとおりであり、形の食い違いの確かめは Scope の errors in（adr.md:315）の目視である。
- Direction: _Check_
- Relation: 収集の振る舞いを置く場所であり、メッセージの書き換え自体は検査しないことで関わる。
- Role: 一時ツリーで収集を走らせて断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（収集を呼ぶ検査のまま）、境界（一時ツリーとTriage行の構成）、可視性（公開されない検査）、主体（断言する側）、規則（読みと描画の断言）、流れ（書いて呼ぶ順序）であり、いずれも変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/index.test.ts

- Search:
  - 01: `slugBranch|cycleDirName` の参照（.pi/skills/adr/scripts配下） - 26件/3ファイル: 実行時の枝名から名への写像の実行は見えない
  - 02: `Commit message|ADR, affected|close and roadmap` の参照（_.test._） - 0件/0ファイル: メッセージの形の断言は見えない
  - 03: ファイル直読（.pi/skills/adr/scripts/index.test.ts:34-63・:99-106） - 存在と現状の確認: 実行時の枝操作は見えない
- Adr: ADRの事実と一致する。確かめるのは `slugBranch` の写像と `cycleDirName` の組み立てであり、メッセージの形は断言しない。コードは変えないことは Scope の refactor out（adr.md:312）のとおりである。
- Direction: _Check_
- Relation: 名の組み立てを置く場所であり、`<suffix>` の材料の振る舞いで関わる。メッセージ自体は検査しない。
- Role: 一時ツリーに名を作り組み立てを断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（名の組み立てを呼ぶ検査のまま）、境界（一時ツリーと名の構成）、可視性（公開されない検査）、主体（断言する側）、規則（写像と0埋めの断言）、流れ（書いて呼ぶ順序）であり、いずれも変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 01: `https?://` の外部参照（.pi/skills/work配下） - 0件/2ファイル: 外部との受け渡しは見えない
  - 02: `https?://` の外部参照（.pi/skills/close配下） - 0件/6ファイル: 外部との受け渡しは見えない
- Adr: ADRの事実と一致する。外部との受け渡しがないことは Scope の security out（adr.md:318）、配布・移行を扱わないことは Scope の deploy out・migration out（adr.md:320-321）、表示を変えないことは Scope の logs and monitoring out（adr.md:322）のとおりである。読むのはリポジトリ内の文書だけである。
- Relation: 変更が外部と受け渡すものはない。文言の置き換えはリポジトリの中に置く。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
  - 比べたものは使う人の数、境界、可視性、主体、規則、流れであり、いずれも変わらない。
- Adjustment: No

## 07: プランのファイル名に NN- を付けると影響はどこまで及ぶか

### Code

#### .pi/skills/plan/SKILL.md

- Search:
  - 01: `plan/<plan id>.md` の字面参照（.pi/skills/plan配下） - 5件/3ファイル: 置き換え後の `plan/<NN>-<plan id>.md` の形は見えない
  - 02: ファイル直読（.pi/skills/plan/SKILL.md:3・:12・:74） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。プランの保存場所が `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` であることは現 `SKILL.md:3・:12` のとおりであり、校正の対象が `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` であることは現 `SKILL.md:74` のとおりである（adr.md:390）。記述を `plan/<NN>-<plan id>.md` にすることは Scope の format in（adr.md:361）のとおりであり、ファイル名を `NN-<plan id>.md` にすることは Decision（adr.md:397）のとおりである。`NN-` を plan id に含めないことは Decision（adr.md:398）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える手順であり、保存場所と校正対象の3件の記述を `plan/<NN>-<plan id>.md` に置く先である。`# PLAN` の中身と `No` の扱いには触れない。
- Role: 計画の書き方とレビュー・校正の順序を定める手順で、エージェントが読む共有の手順である。
- Role change: **Change**
  - 規則が変わる（保存場所と校正対象の path の形が `NN-` 付きになる）。可視性が変わる（並び順の接頭辞が path に現れる）。使う人の数（エージェントが読むまま）、境界（ADR と affected を読んで書く関係）、主体（読んで書く側）、流れ（書いて渡して直して見せる順序）は変わらない。
- Adjustment: **YES**
  - 3件の path の記述の置き換えを書く。plan id の定義は変えない。詳細はplanが決める。

#### .pi/skills/plan/references/format.md

- Search:
  - 01: `plan/<plan id>.md` の字面参照（.pi/skills/plan配下） - 5件/3ファイル: 置き換え後の `plan/<NN>-<plan id>.md` の形は見えない
  - 02: ファイル直読（.pi/skills/plan/references/format.md:3・:10・:96・:101-102） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。保存場所が `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` であることは現 `format.md:3` のとおりであり（adr.md:390）、見出しが `# PLAN` であることは現 `format.md:10` のとおりであり、plan id が計画の名であることは現 `format.md:96` のとおりである。通常のプランが `- No:` を持ち `ex-` のプランが持たないことは現 `format.md:101-102` のとおりであり（adr.md:381）。記述を `plan/<NN>-<plan id>.md` にすることは Scope の format in（adr.md:361）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える書式であり、保存場所の1件を `plan/<NN>-<plan id>.md` に置く先である。`# PLAN` の見出しと `No` の規則には触れず、plan id から `NN-` を除く根拠になることで関わる。
- Role: 計画の形を定める書式で、エージェントとレビューが読みに来る共有の基準である。
- Role change: **Change**
  - 規則が変わる（保存場所の path の形が `NN-` 付きになる）。可視性が変わる（並び順の接頭辞が保存場所に現れる）。使う人の数（エージェントとレビューが読むまま）、境界（形と手順の持ち分け）、主体（読まれる側）、流れ（読まれて書かれる順序）は変わらない。
- Adjustment: **YES**
  - 保存場所の1件の置き換えを書く。`# PLAN` と `No` の規則は残す。詳細はplanが決める。

#### .pi/skills/work/SKILL.md

- Search:
  - 01: `plan/<plan id>.md` の字面参照（.pi/skills/work配下） - 4件/2ファイル: 置き換え後の `plan/<NN>-<plan id>.md` の形は見えない
  - 02: ファイル直読（.pi/skills/work/SKILL.md:16・:35） - 存在と現状の確認: 実行時の作業の進行は見えない
- Adr: ADRの事実と一致する。読み書きの対象が `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` であることは現 `SKILL.md:16` のとおりであり（adr.md:390）、`consult_worktree new <plan id>` が worktree の作り方であることは現 `SKILL.md:35` のとおりである。記述を `plan/<NN>-<plan id>.md` にすることは Scope の format in（adr.md:361）のとおりであり、ファイル名を `NN-<plan id>.md` にすることは Decision（adr.md:397）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える手順であり、読み書きの対象の1件を `plan/<NN>-<plan id>.md` に置く先である。`consult_worktree new <plan id>` と `consult(<plan id>)` の `<plan id>` は plan id のままであり、接頭辞を付けないことで関わる。
- Role: 計画を1つずつ片付ける手順で、エージェントとサブエージェントが読む共有の手順である。
- Role change: **Change**
  - 規則が変わる（読み書きの対象の path の形が `NN-` 付きになる）。可視性が変わる（並び順の接頭辞が対象に現れる）。使う人の数（エージェントとサブエージェントが読むまま）、境界（`Place` による worktree・`base` の分け）、主体（読んで走らせる側）、流れ（読んで走らせる順序）は変わらない。
- Adjustment: **YES**
  - 対象の path の1件の置き換えを書く。worktree 名と commit 名の `<plan id>` は変えない。詳細はplanが決める。

#### .pi/skills/work/references/tasks.md

- Search:
  - 01: `plan/<plan id>.md` の字面参照（.pi/skills/work配下） - 4件/2ファイル: 置き換え後の `plan/<NN>-<plan id>.md` の形は見えない
  - 02: `consult(<plan id>)` の字面参照（.pi/skills/work/references/tasks.md:10・:64・:72） - 3件/1ファイル: 実行時の commit 操作は見えない
  - 03: ファイル直読（.pi/skills/work/references/tasks.md:8・:35・:70） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。任務文の読み対象が `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` であることは現 `tasks.md:8・:35・:70` のとおりであり（adr.md:390）、commit 名が `consult(<plan id>)` であることは現 `tasks.md:10・:64・:72` のとおりである。記述を `plan/<NN>-<plan id>.md` にすることは Scope の format in（adr.md:361）のとおりである。
- Direction: _Read_
- Relation: 変更が書き換える任務文であり、読み対象の3件を `plan/<NN>-<plan id>.md` に置く先である。`consult(<plan id>)` の `<plan id>` は plan id のままであり、接頭辞を付けないことで関わる。本文の順序には触れない。
- Role: サブエージェントに渡す任務文で、スライス・掃除・レビュー・修正の入口を束ねる共有の文書である。
- Role change: **Change**
  - 規則が変わる（読み対象の path の形が `NN-` 付きになる）。可視性が変わる（並び順の接頭辞が対象に現れる）。使う人の数（エージェントが渡すまま）、境界（スキルと任務文の持ち分け）、主体（渡される側）、流れ（渡して読ませて書かせる順序）は変わらない。
- Adjustment: **YES**
  - 読み対象の3件の置き換えを書く。`consult(<plan id>)` の形は残す。詳細はplanが決める。

#### .pi/skills/close/SKILL.md

- Search:
  - 01: `collect.mjs cycles/` の呼出し参照（.pi/skills/close配下） - 2件/2ファイル: 実行時の収集結果は見えない
  - 02: `ex-<what it fixes>` の字面参照（.pi/skills配下） - 4件/2ファイル: `NN-` 付きの新文はまだ存在しないため見えない
  - 03: ファイル直読（.pi/skills/close/SKILL.md:35-38・:84） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。`collect.mjs` が `close.md` と `## Collected` を書くことは現 `SKILL.md:35` のとおりであり（adr.md:387）、`ex-` の `No` を Triage から読むことは現 `SKILL.md:38・:84` のとおりであり（adr.md:379-380）、`ex-` の計画名が `ex-<what it fixes>` であることは現 `SKILL.md:84` のとおりである。Triage 行の plan id を `ex-<what it fixes>` のままにすることは Decision（adr.md:402）のとおりである。
- Direction: _Read by_
- Relation: 変更が振る舞いを変える手順であり、直接は収集の呼出しで、間接は `ex-` の計画名と `No` の出所で関わる。Triage 行の plan id の形は変えず、ファイル名だけが `NN-ex-<what it fixes>.md` になることで関わる。
- Role: 周期の終わりに集めて提案して閉じる手順で、エージェントが読む共有の手順である。
- Role change: **Change**
  - 規則が変わる（読む plan md のファイル名が `NN-` 付きになり、plan id は `NN-` を除くことが文になる）。可視性が変わる（並び順の接頭辞が収集対象に現れる）。使う人の数（エージェントが読むまま）、境界（手順と書式の持ち分け）、主体（読んで書く側）、流れ（集めて提案して閉じる順序）は変わらない。
- Adjustment: **YES**
  - ファイル名と plan id の分けの文を書く。Triage 行の形は変えない。詳細はplanが決める。

#### .pi/skills/close/references/format.md

- Search:
  - 01: `### <plan id>` と並びの参照（.pi/skills/close/references/format.md:12・:50） - 2件/1ファイル: 置き換え後の `### <NN> <plan id>` の形は見えない
  - 02: `ex-plan <plan id>` の字面参照（.pi/skills/close/references/format.md:18・:47・:60・:64-65） - 5件/1ファイル: `NN-` 付きのファイル名の実物は見えない
  - 03: ファイル直読（.pi/skills/close/references/format.md:12・:43-50・:60・:65） - 存在と現状の確認: 実行時の動的挙動は見えない
- Adr: ADRの事実と一致する。見出しの形が `### <plan id> (ADR <プランの No の値>)` であることは現 `format.md:12` のとおりであり（adr.md:391）、並びが通常のプランが先・`ex-` のプランが後でそれぞれファイル名の文字順であることは現 `format.md:50` のとおりであり（adr.md:354・384-385）、`No` の出所が通常は plan md・`ex-` は Triage 行であることは現 `format.md:47` のとおりである（adr.md:379-380）。見出しを `### <NN> <plan id> (ADR <No>)` にし並びを `NN` の数値の順にすることは Scope の format in（adr.md:361）と Decision（adr.md:400-401）のとおりであり、Triage 行の plan id を変えないことは Decision（adr.md:402）のとおりである。
- Direction: _Read by_
- Relation: 変更が書き換える書式であり、見出しの形の1件と並びの1件を `NN` 付き・数値順に置く先である。Triage 行の形と id の置き方は変えず、`collect.mjs` と校正が読みに来る出所でもある。
- Role: `close.md` の形を定める書式で、エージェントと検査と収集器が読みに来る共有の基準である。
- Role change: **Change**
  - 規則が変わる（見出しに `NN` が付き、並びがファイル名の文字順から `NN` の数値の順になる）。可視性が変わる（並び順の接頭辞が見出しに現れる）。使う人の数（エージェントと収集器と校正が読むまま）、境界（形と手順の持ち分け）、主体（読まれる側）、流れ（読まれて書かれる順序）は変わらない。
- Adjustment: **YES**
  - 見出しの形と並びの文の置き換えを書く。Triage 行の文は残す。詳細はplanが決める。

#### .pi/skills/close/scripts/collect.mjs

- Search:
  - 01: `planRank` の参照（.pi/skills/close/scripts配下） - 2件/1ファイル: `NN-` 除去後の判定の動きは見えない
  - 02: `noOf|readTriageNos` の参照（.pi/skills/close/scripts配下） - 9件/2ファイル: `NN-` 除去後の対応の動きは見えない
  - 03: `###` と `contexts.get` と `readContexts` の参照（.pi/skills/close/scripts配下） - 7件/1ファイル: `NN` 付き見出しの描画と文脈引きの動きは見えない
  - 04: `readdirSync|toSorted|localeCompare|replace` の参照（.pi/skills/close/scripts配下） - 4件/1ファイル: `NN` の数値順の動きは見えない
  - 05: ファイル直読（.pi/skills/close/scripts/collect.mjs:223・:231-238・:249-258・:271-284・:309-325・:360-368・:385-402） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。ファイル名から `.md` を除いたものを plan id にすることは現 `collect.mjs:367` のとおりであり（adr.md:377）、`planRank` が `ex-` で始まるかで並びを決めることは現 `collect.mjs:223` のとおりであり（adr.md:378）、`noOf` が `ex-` で始まるかを判定することは現 `collect.mjs:249-252` のとおりであり（adr.md:379）、見出しを作ることは現 `collect.mjs:284` のとおりであり（adr.md:383）、並びが `planRank` と `localeCompare` で決まることは現 `collect.mjs:363` のとおりであり（adr.md:385）、`contexts` が鍵で引くことは現 `collect.mjs:271` のとおりであり（adr.md:386）、`writeClose` が結果を `render` に渡すことは現 `collect.mjs:385-402` のとおりである（adr.md:387）。`NN-` を除いた名前を plan id にし判定を `NN-` より後の名前で行い並びを `NN` の数値の順にして見出しに `NN` を渡すことは Scope の refactor in（adr.md:362）と Decision（adr.md:398-401）のとおりである。
- Direction: _Read_
- Relation: 変更が書き換える実行であり、plan id の作り方（`NN-` と `.md` の除去）、`ex-` の判定（`planRank`・`noOf`）、並び（数値順）、見出し（`NN` 渡し）を担う先である。番号行の下の文脈は `<plan id>:<line>` の鍵のまま引き、Triage 行の plan id の読み方は変えないことで関わる。
- Role: 残りを集めて `## Collected` の見出しに `No` を付ける収集器で、Triageを読んで見出しを書く内部の仕組みである。
- Role change: **Change**
  - 規則が変わる（plan id の作り方が `NN-` 除去になり、`ex-` の判定が除去後の名前になり、並びが文字順から数値順になり、見出しに `NN` が付く）。境界が変わる（ファイル名と plan id の分けが入る）。使う人の数（検査と所有者が呼ぶまま）、可視性（内部の実行）、主体（読んで書く側）、流れ（読んで集めて書く順序）は変わらない。
- Adjustment: **YES**
  - plan id の作り方と判定と並びと見出し渡しを書く。Triage 行の読みは変えない。詳細はplanが決める。

#### .pi/skills/close/scripts/collect.test.ts

- Search:
  - 01: `###` の見出し断言（.pi/skills/close/scripts/collect.test.ts:45-46・:66） - 3件/1ファイル: `NN` 付き見出しの断言はまだ存在しないため見えない
  - 02: plan ファイル名の生成（.pi/skills/close/scripts/collect.test.ts:22-24・:60・:77・:95・:105） - 7件/1ファイル: `NN-` 付きの生成の動きは見えない
  - 03: `noOf` の参照（.pi/skills/close/scripts配下） - 9件/2ファイル: `NN-` 付きの読みの成否は見えない
  - 04: ファイル直読（.pi/skills/close/scripts/collect.test.ts:8-27・:29-47） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。見出しを `### <plan id> (ADR <No>)` と断言することは現 `collect.test.ts:45-46・:66` のとおりであり（adr.md:388）、plan のファイル名を検査が自分で作ることは現 `collect.test.ts:22-24` のとおりであり（adr.md:389）、通常の `No` を plan md から・`ex-` の `No` を Triage から読むことを確かめることは現 `collect.test.ts:29-37` のとおりである。`NN-` の付いたファイル名から `No` と並び順が出ることを確かめることは Scope の errors in（adr.md:366）と Decision（adr.md:403）のとおりである。
- Direction: _Check_
- Relation: 変更を確かめる検査であり、直接は `NN-` 付きのファイル名での `No` の読みと `## Collected` の見出し・並びの断言で、間接は `writeClose` と `noOf` と `collectPlan` の呼出しで関わる。
- Role: 一時ツリーで収集を走らせて断言する検査である。
- Role change: **Change**
  - 確かめる対象が変わる（素のファイル名から `NN-` 付きのファイル名へ、見出しが `### <NN> <plan id> (ADR <No>)` へ、並びが文字順から `NN` の数値の順へ）。境界（一時ツリーと Triage 行の構成）と可視性（公開されない検査）と主体（断言する側）は変わらない。
- Adjustment: **YES**
  - `NN-` 付きのファイル名の生成と見出し・並び・`No` の断言を足す。素の形の断言は残さない。詳細はplanが決める。

#### .pi/skills/close/scripts/collect.fixture.ts

- Search:
  - 01: `planDoc|closeDoc` の定義参照（.pi/skills/close/scripts配下） - 6件/2ファイル: `NN-` 付きの生成の動きは見えない
  - 02: `ex-plan` の生成行参照（.pi/skills/close/scripts/collect.fixture.ts:34） - 1件/1ファイル: `NN-` 付きのファイル名の実物は見えない
  - 03: ファイル直読（.pi/skills/close/scripts/collect.fixture.ts:8-36） - 存在と現状の確認: 実行時の収集結果は見えない
- Adr: ADRの事実と一致する。plan md が `# PLAN` を持つことは現 `collect.fixture.ts:19` のとおりであり（adr.md:389）、Triage 行の形が `- <N>: ex-plan <plan id> (ADR <NN>, ...)` であることは現 `collect.fixture.ts:34` のとおりであり（adr.md:379）、plan のファイル名を検査が自分で作ることは `collect.test.ts:22-24` のとおりである（adr.md:389）。Triage 行の plan id を `ex-<what it fixes>` のままにすることは Decision（adr.md:402）のとおりである。
- Direction: _Read by_
- Relation: 検査が読むテンプレートであり、plan md の本文と Triage 行を組み立てて渡すことで関わる。ファイル名は作らず、作るのは本文の `No` と Triage 行の対応だけであるため、生成する形は変えないことで関わる。
- Role: Triage行を持つclose文書のテンプレートを作る単一用途の共有関数である。
- Role change: Not change
  - 比べたものは使う人の数（検査が読むまま）、境界（引数と戻り値の受け方）、可視性（内部の共有）、主体（読まれる側）、規則（行の組み立ての規則）、流れ（受けて組み立てる順序）であり、いずれも変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 01: `https?://` の外部参照（.pi/skills/close配下） - 0件/6ファイル: 外部との受け渡しは見えない
  - 02: `https?://` の外部参照（.pi/skills/plan配下） - 0件/4ファイル: 外部との受け渡しは見えない
  - 03: `https?://` の外部参照（.pi/skills/work配下） - 0件/2ファイル: 外部との受け渡しは見えない
- Adr: ADRの事実と一致する。新しいパッケージを足さないことは Scope の dependency out（adr.md:364）、外部との受け渡しを扱わないことは Scope の security out（adr.md:369）、配布・移行を扱わないことは Scope の deploy out・migration out（adr.md:371-372）、表示を変えないことは Scope の logs and monitoring out（adr.md:373）のとおりである。読むのは plan md と `close.md` だけである。
- Relation: 変更が外部と受け渡すものはない。接頭辞の付け替えはリポジトリの中に置く。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
  - 比べたものは使う人の数、境界、可視性、主体、規則、流れであり、いずれも変わらない。
- Adjustment: No
