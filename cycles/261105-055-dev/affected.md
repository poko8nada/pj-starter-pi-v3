# Affected 055

## 01: ja-check の除外を、パス一致の設定に置き換えられるか

### Code

#### scripts/checks/ja-check.json

- Search:
  - 01: `ja-check.json` の文字列検索（リポジトリ全体） - 86件/13ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と将来の編集は見えない
  - 07: ファイル直読（`scripts/checks/ja-check.json:1-71`） - 存在と3欄構成の確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と一致する。現在は `error` と `warn` と `exception` の3欄を持ち、`exclude` 欄はまだ存在しない。変更で `exclude` に `"ROADMAP.md"` と `"**/affected.md"` を置く対象である。
- Direction: _Read by_
- Relation: 変更が最上位に `exclude` 配列を足す対象であり、実行時に `ja-check.mjs` が読み込む設定である。
- Role: `error` と `warn` と `exception` の3欄からなる共有の設定であり、`mjs` との間の境界に置かれる辞書と除外の一覧である。
- Role change: **Change**
  - 欄が3つから4つになり、`mjs` の検証が読む欄と、除外の判定が参照する欄が増える。ファイル全体を除外する規則が加わる。
- Adjustment: **YES**
  - `mjs` の検証を4欄構成に合わせ、`exclude` が文字列配列であることの検証と、一致時の読み飛ばしを足す。詳細はplanが決める。

#### scripts/checks/ja-check.mjs

- Search:
  - 01: `ja-check.json` の文字列検索（リポジトリ全体） - 86件/13ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と将来の編集は見えない
  - 02: `isZeroHeading|isHeading|inZero` の文字列検索（リポジトリ全体） - 9件/2ファイル: 削除後の参照は見えない
  - 05: `ROADMAP|isRoadmap` の文字列検索（scripts/checks配下） - 6件/2ファイル: 実行時のステージ対象の顔ぶれは見えない
  - 07: ファイル直読（`scripts/checks/ja-check.mjs:1-202`） - 設定読み込み・検証・ROADMAP部分読み飛ばしの確認: 実行時のステージ対象の顔ぶれは見えない
- Adr: ADRの事実と一致する。`isZeroHeading`、`isHeading`、`inZero` による `ROADMAP.md` の `## 0.x.x` 範囲判定（`:135-141`、`:160-176`）と設定ファイル自身の除外を持ち、`matchesGlob` の参照はまだ存在しない。変更で前者を削除し、後者の設定ファイル自身の除外は残す対象である。
- Direction: _Read by_
- Relation: 変更が除外の判定を `exclude` と `matchesGlob` による1か所にまとめ、`isZeroHeading`、`isHeading`、`inZero` を削除し、引数をルートからの相対パスへ直す対象である。
- Role: 引数のファイルを走査し、`warn` と `error` を出して終了符号を返す検査本体という単一用途の実行物であり、除外をスクリプトの中で判定する主体である。
- Role change: **Change**
  - 除外の主体がコード固定の範囲判定から設定のパス一致に変わり、検証する欄が3つから4つになる。読み込み前に相対パス化と照合という 1 つの処理が増え、`ROADMAP.md` は部分から全体へ、`**/affected.md` は新規に対象外となり、流れが変わる。出力の形と件数の数え方は変わらない。
- Adjustment: **YES**
  - `exclude` の検証、`matchesGlob` による照合、相対パス化、範囲判定の削除を足す。詳細はplanが決める。

#### scripts/checks/ja-check.test.ts

- Search:
  - 01: `ja-check.json` の文字列検索（リポジトリ全体） - 86件/13ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と将来の編集は見えない
  - 04: `validConfig` の文字列検索（scripts/checks配下） - 23件/1ファイル: 将来のexclude欄の形は見えない
  - 05: `ROADMAP|isRoadmap` の文字列検索（scripts/checks配下） - 6件/2ファイル: 実行時のステージ対象の顔ぶれは見えない
  - 07: ファイル直読（`scripts/checks/ja-check.test.ts:1-439`） - 子プロセス実行と一時ルートfixture、ROADMAPの2件と検証の事例の確認: 除外の事例はまだ存在しないため見えない
- Adr: ADRの事実と一致する。`validConfig()` は3欄の仮設定を作り、`ROADMAPの0.x.xセクション内のerror語 → 報告しない` と `ROADMAPの1.x.xセクション内のerror語 → 報告する` の2件を持つ。変更で2件の置き換えと `validConfig()` と欄の形を見る検証の合わせ直しの対象である。
- Direction: _Check_
- Relation: 変更の振る舞い（`exclude` 一致時の読み飛ばし、4欄構成での検証）を確かめる検査であり、仮設定と2件の事例を新しい形に合わせる対象である。
- Role: 一時ルートに設定と対象ファイルを作り、子プロセスで実行して出力と終了符号を断言する検査である。
- Role change: Not change
  - 比べたものは使う人の数（`mjs` を呼ぶ検査のまま）、境界（一時ルートと子プロセスの構成）、可視性（公開されない検査）、主体（断言する側）、規則（出力と終了符号の断言）、流れ（設定を書いて実行する順序）であり、いずれも変わらない。
- Adjustment: No

#### README.md

- Search:
  - 06: `japanese-check` の文字列検索（README.md・README.ja.mdに限定） - 3件/2ファイル: 追加後の除外文は見えない
  - 07: ファイル直読（`README.md:40-53`） - japanese-checkの説明1行の確認: 追加後の除外文は見えない
  - 09: `scripts/checks/ja-check.mjs` の文字列検索（lefthook.yaml・README.md・README.ja.mdに限定） - 3件/3ファイル: 実行時の呼び出し結果は見えない
- Adr: ADRの事実と一致する。japanese-checkの説明1行を持ち、設定に書いたパスを除外する文はまだ存在しない。変更でその1行に足す対象である。
- Direction: _Read by_
- Relation: 検査の働きを案内する文書であり、変更で除外の一文を足される対象である。
- Role: スターターの使い方を読むための利用文書である。
- Role change: Not change
  - 比べたものは使う人の数（使い方を読む人のまま）、境界（文書と設定の関係）、可視性（公開文書）、主体（読む側）、規則（読み方）、流れ（参照の順序）であり、いずれも変わらない。足すのは除外の一文のみである。
- Adjustment: No

#### README.ja.md

- Search:
  - 06: `japanese-check` の文字列検索（README.md・README.ja.mdに限定） - 3件/2ファイル: 追加後の除外文は見えない
  - 07: ファイル直読（`README.ja.md:40-53`） - japanese-checkの説明1行の確認: 追加後の除外文は見えない
  - 09: `scripts/checks/ja-check.mjs` の文字列検索（lefthook.yaml・README.md・README.ja.mdに限定） - 3件/3ファイル: 実行時の呼び出し結果は見えない
- Adr: ADRの事実と一致する。japanese-checkの説明1行を持ち、設定に書いたパスを除外する文はまだ存在しない。変更でその1行に足す対象である。
- Direction: _Read by_
- Relation: 検査の働きを案内する文書であり、変更で除外の一文を足される対象である。
- Role: スターターの使い方を読むための利用文書である。
- Role change: Not change
  - 比べたものは使う人の数（使い方を読む人のまま）、境界（文書と設定の関係）、可視性（公開文書）、主体（読む側）、規則（読み方）、流れ（参照の順序）であり、いずれも変わらない。足すのは除外の一文のみである。
- Adjustment: No

#### lefthook.yaml

- Search:
  - 07: ファイル直読（`lefthook.yaml:1-36`） - `pre-commit` の `ja-check` ジョブと `node scripts/checks/ja-check.mjs {staged_files}` の確認: 実行時のステージ対象の顔ぶれは見えない
  - 08: `staged_files` の文字列検索（lefthook.yamlに限定） - 5件/1ファイル: 実行時のステージ対象の実体は見えない
  - 09: `scripts/checks/ja-check.mjs` の文字列検索（lefthook.yaml・README.md・README.ja.mdに限定） - 3件/3ファイル: 実行時の呼び出し結果は見えない
- Adr: ADRの事実と一致する。`node scripts/checks/ja-check.mjs {staged_files}` で呼び出し、変更で呼び出し方は変えない対象である。
- Direction: _Read by_
- Relation: `mjs` を `{staged_files}` で呼び出す配線であり、変更後の `mjs` を実行する側である。
- Role: commit時の検査群の中で日本語検査を受け持つ呼び出し元である。
- Role change: Not change
  - 比べたものは使う人の数（commit時の呼び出しのまま）、境界（引数の渡し方と `glob: '*'`）、可視性（開発者が見る設定）、主体（呼ぶ側）、規則（終了符号による抑止）、流れ（並列実行の中の位置）であり、いずれも変わらない。
- Adjustment: No

#### ROADMAP.md

- Search:
  - 01: `ja-check.json` の文字列検索（リポジトリ全体） - 86件/13ファイル: 実行時に一時ルートへ書かれるfixtureの実内容と将来の編集は見えない
  - 07: ファイル直読（`ROADMAP.md:30-66`） - `## 0.x.x` と020の除外想定の記述の確認: 除外後の検査結果は見えない
  - 10: `affected.md` の文字列検索（ROADMAP.mdに限定） - 9件/1ファイル: 除外後の検査結果は見えない
- Adr: ADRの事実と一致する。`## 0.x.x` の範囲にerror 6件とwarn 8件を含み、`mjs` がその範囲を読み飛ばす対象であり、020は除外を求める項目である。変更でファイル全体が除外の対象になる。
- Direction: _Read by_
- Relation: `mjs` が走査する側から読み飛ばす側へ変わる対象であり、変更で中身を読まれなくなる。
- Role: バージョンごとの項目を持つ計画の文書であり、検査から見ると走査の対象という検査対象物である。
- Role change: **Change**
  - 対象の範囲が `## 0.x.x` の範囲のみからファイル全体に広がり、検査の流れにおける扱いが読み飛ばしから読み込み前の除外に変わる。可視性（公開文書）と主体（読まれる側）は変わらない。
- Adjustment: No

#### cycles/261105-055-dev/affected.md

- Search:
  - 11: ファイル名検索 `affected.md`（cycles配下） - 4件/4ファイル: 将来のサイクル分と除外後の検査結果は見えない
- Adr: ADRの事実と一致する。サイクルの記録であり、校正の機会が少なく検査のたびに直す作業が増えるものである。変更でどのサイクルのものでも除外の対象になる。
- Direction: _Read by_
- Relation: `mjs` が走査する側から読み飛ばす側へ変わる対象であり、変更で中身を読まれなくなる。設定の `**/affected.md` は、どのサイクルの記録にも一致する。
- Role: サイクルの影響範囲を記す記録であり、検査から見ると走査の対象という検査対象物である。
- Role change: **Change**
  - 対象の範囲が走査対象から除外対象に変わり、検査の流れにおける扱いが読み込み後の走査から読み込み前の除外に変わる。可視性（リポジトリ内の記録）と主体（読まれる側）は変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 03: `matchesGlob` の文字列検索（リポジトリ全体） - 9件/5ファイル: 実行時の照合結果と配布先の複製の状態は見えない
- Adr: ADRの事実と一致する。依存の追加はなく（Scopeのdependency:out、`node:path` と `node:fs` で足りる）、秘密・権限・外部接続は扱わず（Scopeのsecurity:out）、監視の仕組みもない（Scopeのmonitoring:out）。
- Relation: 変更が外部と受け渡すものはない。設定と引数のパスを読むだけである。
- Role: 外部との受け渡しはない。
- Role change: Not change
- Adjustment: No
