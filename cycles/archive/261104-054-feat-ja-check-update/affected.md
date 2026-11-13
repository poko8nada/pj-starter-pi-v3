# Affected 054

## 01: 例外をどのような形で持つか

### Code

#### scripts/checks/ja-check.json

- Search:
  - 02: `ja-check.json` の文字列検索（リポジトリ全体、.git・node_modules除く） - 55件/9ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 05: ファイル直読（`scripts/checks/ja-check.json:1-35`、`scripts/checks/ja-check.mjs:1-162`） - 存在と2欄構成の確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と一致する。`error` と `warn` の2欄を持ち、値は語から置換案への文字列対応である（ADR Contextの記述どおり）。
- Direction: _Read by_
- Relation: 変更が最上位に `exception` 配列を1つ足す対象であり、実行時に `ja-check.mjs` が読み込む設定である。
- Role: `error` と `warn` の2欄からなる禁止語辞書という共有資源であり、`mjs` との間の境界に置かれる設定である。
- Role change: **Change**
  - 欄が2つから3つになり、`mjs` の検証が読む欄と、照合が参照する欄が増える。例外が `error` と `warn` の両方に効く規則が加わる。
- Adjustment: **YES**
  - `mjs` の検証を3欄構成に合わせ、例外の型（文字列配列）を検証し、照合で例外一致を抑止する。詳細はplanが決める。

#### scripts/checks/ja-check.mjs

- Search:
  - 01: `ja-check.mjs` の文字列検索（リポジトリ全体、.git・node_modules除く） - 52件/10ファイル: 実行時に渡される一時パスの実体と配布先の複製は見えない
  - 02: `ja-check.json` の文字列検索（リポジトリ全体、.git・node_modules除く） - 55件/9ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 05: ファイル直読（`scripts/checks/ja-check.mjs:1-162`） - 設定読み込み・検証・部分一致走査の確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と一致する。語を行内で部分一致で探し、同じ引用符間に語だけがある場合は指摘しない。設定の読み込みと検証を新しい形に組み直す対象である。
- Direction: _Read by_
- Relation: 変更が設定の読み込み・検証を組み直し、ヒットした語の前後と例外の語を照合して一致時は報告を抑止する対象である。
- Role: ステージされたファイルを走査し、`warn` と `error` を出して終了符号を返す検査本体という単一用途の実行物である。
- Role change: **Change**
  - 設定検証が2キー固定から3キー固定になり、報告の前に例外照合という一段が増える。例外の有無を判断する主体になり、処理の流れが変わる。終了符号の規則（`error` があれば1、なければ0）は変わらない。
- Adjustment: **YES**
  - 例外欄の読み込み・検証と、ヒット前後の例外一致による抑止の実装を足す。詳細はplanが決める。

#### scripts/checks/ja-check.test.ts

- Search:
  - 01: `ja-check.mjs` の文字列検索（リポジトリ全体、.git・node_modules除く） - 52件/10ファイル: 実行時に渡される一時パスの実体と配布先の複製は見えない
  - 02: `ja-check.json` の文字列検索（リポジトリ全体、.git・node_modules除く） - 55件/9ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 04: `validConfig` の文字列検索（scripts/checks配下） - 15件/1ファイル: fixtureが将来持つ例外欄の形は見えない
  - 05: ファイル直読（`scripts/checks/ja-check.test.ts:1-322`） - 子プロセス実行と一時ルートfixtureの確認: 例外抑止の事例はまだ存在しないため見えない
- Adr: ADRの事実と一致する。フィクスチャを新しい設定の形に合わせる対象であり（Scopeのformat:in）、子プロセスとして振る舞いを確かめる検査である。
- Direction: _Check_
- Relation: 変更の振る舞い（例外一致時の抑止、壊れた形でのheader 2行とexit 1）を確かめる検査であり、フィクスチャは新しい3欄構成に合わせる対象である。
- Role: 一時ルートに設定と対象ファイルを作り、子プロセスで実行して出力と終了符号を断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（`mjs` を呼ぶ検査のまま）、境界（一時ルートと子プロセスの構成）、可視性（公開されない検査）、主体（断言する側）、規則（出力と終了符号の断言）、流れ（設定を書いて実行する順序）であり、いずれも変わらない。
- Adjustment: No

#### lefthook.yaml

- Search:
  - 01: `ja-check.mjs` の文字列検索（リポジトリ全体、.git・node_modules除く） - 52件/10ファイル: 実行時に渡される一時パスの実体と配布先の複製は見えない
  - 05: ファイル直読（`lefthook.yaml:1-36`） - `pre-commit` の `ja-check` ジョブと `node scripts/checks/ja-check.mjs {staged_files}` の確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と一致する。`Unit.lefthook-gate` はkeptであり、検査を通してcommitもpushもできる働きは変わらない。
- Direction: _Read by_
- Relation: `mjs` を `{staged_files}` で呼び出す配線であり、変更後の `mjs` を実行する側である。
- Role: commit時の検査群の中で日本語検査を受け持つ呼び出し口である。
- Role change: Not change
  - 比べたものは使う人の数（commit時の呼び出しのまま）、境界（引数の渡し方と `glob: '*'`）、可視性（開発者が見る設定）、主体（呼ぶ側）、規則（終了符号による抑止）、流れ（並列実行の中の位置）であり、いずれも変わらない。
- Adjustment: No

#### scripts/harness/harness.json

- Search:
  - 05: ファイル直読（`scripts/harness/harness.json:1-35`） - `copy` と `push` に `scripts/checks` が含まれることの確認: 配布先での複製の状態は見えない
- Adr: ADRの事実と対象の記述に一致しない点はない。`scripts/checks` は `copy` と `push` に含まれ、変更後の `mjs` と `json` は配布の対象になる。
- Direction: _Read by_
- Relation: `scripts/checks` を `copy` と `push` の対象として挙げ、変更後の2ファイルを製品へ配る一覧である。
- Role: ハーネスの受け渡し範囲を示す一覧である。
- Role change: Not change
  - 比べたものは使う人の数（一覧を読む運搬処理のまま）、境界（項目は `scripts/checks` のまま）、可視性（リポジトリ内の設定）、主体（配る側）、規則（項目の書き方）、流れ（pull/pushの順序）であり、いずれも変わらない。
- Adjustment: No

#### README.md

- Search:
  - 02: `ja-check.json` の文字列検索（リポジトリ全体、.git・node_modules除く） - 55件/9ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 05: ファイル直読（`README.md:44-45`、`README.md:77`） - 禁止語の変更先が `error` と `warn` の2欄で書かれていることの確認: 例外の文はまだ存在しないため見えない
- Adr: ADRの事実と一致する。日本語の禁止語の文に例外の書き方を足す対象である（Scopeのprose:in）。`Unit.usage-readme` はkeptである。
- Direction: _Read by_
- Relation: 禁止語の変更先を `error` と `warn` で案内する文書であり、変更で例外の書き方を足される対象である。
- Role: スターターの使い方を読むための利用文書である。
- Role change: Not change
  - 比べたものは使う人の数（使い方を読む読み手のまま）、境界（文書と設定の関係）、可視性（公開文書）、主体（読む側）、規則（読み方）、流れ（参照の順序）であり、いずれも変わらない。足すのは例外の一文のみである。
- Adjustment: No

#### README.ja.md

- Search:
  - 02: `ja-check.json` の文字列検索（リポジトリ全体、.git・node_modules除く） - 55件/9ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 05: ファイル直読（`README.ja.md:44-45`、`README.ja.md:77`） - 禁止語の変更先が `error` と `warn` の2欄で書かれていることの確認: 例外の文はまだ存在しないため見えない
- Adr: ADRの事実と一致する。日本語の禁止語の文に例外の書き方を足す対象である（Scopeのprose:in）。`Unit.usage-readme` はkeptである。
- Direction: _Read by_
- Relation: 禁止語の変更先を `error` と `warn` で案内する文書であり、変更で例外の書き方を足される対象である。
- Role: スターターの使い方を読むための利用文書である。
- Role change: Not change
  - 比べたものは使う人の数（使い方を読む読み手のまま）、境界（文書と設定の関係）、可視性（公開文書）、主体（読む側）、規則（読み方）、流れ（参照の順序）であり、いずれも変わらない。足すのは例外の一文のみである。
- Adjustment: No

### External

#### なし

- Search:
  - 03: `exception` の文字列検索（リポジトリ全体、.git・node_modules除く） - 12件/6ファイル（本件はADR 3件・ROADMAP 1件、残りは同名の別概念）: 新設するJSON欄の参照はまだ存在しないため見えない
- Adr: ADRの事実と一致する。依存の追加・削除はなく（Scopeのdependency:out）、秘密・権限・外部接続は扱わない（Scopeのsecurity:out）。常時記録する監視の仕組みもない（Scopeのlogs and monitoring:out）。
- Relation: 変更が外部と受け渡すものはない。設定とファイルを読むだけである。
- Role: 外部との受け渡しはない。
- Role change: Not change
- Adjustment: No

## 02: どの語を例外とするか

### Code

#### scripts/checks/ja-check.json

- Search:
  - 02: `ja-check.json` の文字列検索（リポジトリ全体） - 67件/10ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 03: `exception` の文字列検索（リポジトリ全体） - 17件/7ファイル: 新設するJSON欄の参照はまだ存在しないため見えない、同名の別概念（`node-domexception`等）を含む
  - 06: ファイル直読（`scripts/checks/ja-check.json:1-35`） - 存在と2欄構成の確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と一致する。現在は `error` と `warn` の2欄を持ち、値は語から置換案への文字列対応である（ADR Contextの記述どおり）。`exception` 欄はまだ存在しない。
- Direction: _Read by_
- Relation: 変更が `exception` の配列に認める語を書き込む対象であり、エントリ01の形（最上位の配列、`error` と `warn` の両方に効く）に入れる先である。語の採否はworkのbaseのplanで決まるため、このエントリでは語の一覧は確定しない。
- Role: `error` 21語と `warn` 8語の計29語からなる禁止語辞書という共有資源であり、`mjs` との間の境界に置かれる設定である。
- Role change: Not change
  - 比べたものは使う人の数（`mjs` が読み込む設定のまま）、境界（設定と検査本体の関係）、可視性（リポジトリ内の設定）、主体（読まれる側）、規則（例外が両欄に効く規則はエントリ01が決め、このエントリでは変えない）、流れ（読み込まれて走査に使われる順序）であり、いずれも変わらない。増えるのは配列の中身だけである。
- Adjustment: No

#### scripts/checks/ja-check.mjs

- Search:
  - 01: `ja-check.mjs` の文字列検索（リポジトリ全体） - 55件/11ファイル: 実行時に渡される一時パスの実体と配布先の複製は見えない
  - 02: `ja-check.json` の文字列検索（リポジトリ全体） - 67件/10ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 06: ファイル直読（`scripts/checks/ja-check.mjs:1-162`） - 設定読み込み・検証・部分一致走査の確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と一致する。現在は行内で語を部分一致で探し、同じ引用符間に語だけがある場合は指摘しない。設定の検証は2キー固定（`error` と `warn` のみ）であり、構造の組み直しはエントリ01の範囲である（Scopeのrefactor:out）。
- Direction: _Read by_
- Relation: 実行時に `json` を読み込む側であり、変更後の例外の語により報告の有無が変わる。コード自体はこのエントリでは変えない。
- Role: ステージされたファイルを走査し、`warn` と `error` を出して終了符号を返す検査本体という単一用途の実行物である。
- Role change: Not change
  - 比べたものは使う人の数（`lefthook` とテストから呼ばれるまま）、境界（引数と設定パスの受け方）、可視性（公開されない検査）、主体（走査する側）、規則（終了符号の規則と引用符・除外の扱い）、流れ（読み込みから走査・集計への順序）であり、いずれも変わらない。変わるのは入力データによる出力の有無だけである。
- Adjustment: No

#### scripts/checks/ja-check.test.ts

- Search:
  - 01: `ja-check.mjs` の文字列検索（リポジトリ全体） - 55件/11ファイル: 実行時に渡される一時パスの実体と配布先の複製は見えない
  - 02: `ja-check.json` の文字列検索（リポジトリ全体） - 67件/10ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 05: `validConfig` の文字列検索（`scripts/checks`配下） - 15件/1ファイル: 将来の例外欄の形は見えない
  - 06: ファイル直読（`scripts/checks/ja-check.test.ts:1-322`） - 子プロセス実行と一時ルートfixtureの確認: 例外抑止の事例と実設定の語は見えない
- Adr: ADRの事実と一致する。フィクスチャは2欄構成の仮設定を作り、子プロセスとして振る舞いを確かめる検査である。実設定の例外の語を断言する事例は存在しない。
- Direction: _Check_
- Relation: 変更の振る舞いを確かめる検査を置く場所であり、仮設定を使うため実設定の例外の語一覧は検査しない。直接は `validConfig` と子プロセス実行で、間接は `SCRIPT` 経由で `mjs` を呼ぶことで関わる。
- Role: 一時ルートに設定と対象ファイルを作り、子プロセスで実行して出力と終了符号を断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（`mjs` を呼ぶ検査のまま）、境界（一時ルートと子プロセスの構成）、可視性（公開されない検査）、主体（断言する側）、規則（出力と終了符号の断言）、流れ（設定を書いて実行する順序）であり、いずれも変わらない。
- Adjustment: No

#### lefthook.yaml

- Search:
  - 01: `ja-check.mjs` の文字列検索（リポジトリ全体） - 55件/11ファイル: 実行時に渡される一時パスの実体と配布先の複製は見えない
  - 06: ファイル直読（`lefthook.yaml:1-36`） - `pre-commit` の `ja-check` ジョブと `node scripts/checks/ja-check.mjs {staged_files}` の確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と対象の記述に一致しない点はない。検査を通してcommitもpushもできる働きは変わらない。
- Direction: _Read by_
- Relation: `mjs` を `{staged_files}` で呼び出す配線であり、変更後の例外の語による報告の有無を受けて抑止の有無が変わる側である。設定自体は書かない。
- Role: commit時の検査群の中で日本語検査を受け持つ呼び出し口である。
- Role change: Not change
  - 比べたものは使う人の数（commit時の呼び出しのまま）、境界（引数の渡し方と `glob: '*'`）、可視性（開発者が見る設定）、主体（呼ぶ側）、規則（終了符号による抑止）、流れ（並列実行の中の位置）であり、いずれも変わらない。
- Adjustment: No

#### scripts/harness/harness.json

- Search:
  - 06: ファイル直読（`scripts/harness/harness.json:1-35`） - `copy` と `push` に `scripts/checks` が含まれることの確認: 配布先での複製の状態は見えない
- Adr: ADRの事実と対象の記述に一致しない点はない。`scripts/checks` は `copy` と `push` に含まれ、変更後の `json` は配布の対象になる。
- Direction: _Read by_
- Relation: `scripts/checks` を `copy` と `push` の対象として挙げ、変更後の設定ファイルを製品へ配る一覧である。
- Role: ハーネスの受け渡し範囲を示す一覧である。
- Role change: Not change
  - 比べたものは使う人の数（一覧を読む運搬処理のまま）、境界（項目は `scripts/checks` のまま）、可視性（リポジトリ内の設定）、主体（配る側）、規則（項目の書き方）、流れ（pull/pushの順序）であり、いずれも変わらない。
- Adjustment: No

#### README.md

- Search:
  - 02: `ja-check.json` の文字列検索（リポジトリ全体） - 67件/10ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 04: `禁止語`・`Banned Japanese words` の文字列検索（`README.md`・`README.ja.md`に限定） - 4件/2ファイル: 例外の文はまだ存在しないため見えない
  - 06: ファイル直読（`README.md:44-45`、`README.md:77`） - 禁止語の変更先が `error` と `warn` の2欄で書かれていることの確認: 例外の文はまだ存在しないため見えない
- Adr: ADRの事実と一致する。日本語の禁止語の文に例外の語の例を載せる対象である（Scopeのprose:in）。`Unit.usage-readme` はkeptである。
- Direction: _Read by_
- Relation: 禁止語の変更先を `error` と `warn` で案内する文書であり、変更で例外の語の例を足される対象である。
- Role: スターターの使い方を読むための利用文書である。
- Role change: Not change
  - 比べたものは使う人の数（使い方を読む読み手のまま）、境界（文書と設定の関係）、可視性（公開文書）、主体（読む側）、規則（読み方）、流れ（参照の順序）であり、いずれも変わらない。足すのは例外の語の例のみである。
- Adjustment: No

#### README.ja.md

- Search:
  - 02: `ja-check.json` の文字列検索（リポジトリ全体） - 67件/10ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と利用者の将来の編集は見えない
  - 04: `禁止語`・`Banned Japanese words` の文字列検索（`README.md`・`README.ja.md`に限定） - 4件/2ファイル: 例外の文はまだ存在しないため見えない
  - 06: ファイル直読（`README.ja.md:44-45`、`README.ja.md:77`） - 禁止語の変更先が `error` と `warn` の2欄で書かれていることの確認: 例外の文はまだ存在しないため見えない
- Adr: ADRの事実と一致する。日本語の禁止語の文に例外の語の例を載せる対象である（Scopeのprose:in）。`Unit.usage-readme` はkeptである。
- Direction: _Read by_
- Relation: 禁止語の変更先を `error` と `warn` で案内する文書であり、変更で例外の語の例を載せる対象である。
- Role: スターターの使い方を読むための利用文書である。
- Role change: Not change
  - 比べたものは使う人の数（使い方を読む読み手のまま）、境界（文書と設定の関係）、可視性（公開文書）、主体（読む側）、規則（読み方）、流れ（参照の順序）であり、いずれも変わらない。足すのは例外の語の例のみである。
- Adjustment: No

### External

#### なし

- Search:
  - 03: `exception` の文字列検索（リポジトリ全体） - 17件/7ファイル: 新設するJSON欄の参照はまだ存在しないため見えない、同名の別概念（`node-domexception`等）を含む
  - 07: 外部辞書名（`JMdict|Sudachi|MeCab|IPADIC|cspell|Vale|textlint`）の文字列検索（リポジトリ全体） - 15件/4ファイル: いずれもADR・設計・計画の言及であり、実装の依存としては見えない
- Adr: ADRの事実と一致する。依存の追加・削除はなく（Scopeのdependency:out、形態素解析器を入れない）、秘密・権限・外部接続は扱わない（Scopeのsecurity:out）。`JMdict` との突き合わせ（案4）は採用しなかった。常時記録する監視の仕組みもない（Scopeのlogs and monitoring:out）。
- Relation: 変更が外部と受け渡すものはない。設定とファイルを読むだけである。
- Role: 外部との受け渡しはない。
- Role change: Not change
- Adjustment: No
