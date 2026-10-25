# PLAN `slim-scripts`

- No: 01

## Files

```text
scripts/
  checks/
    typecheck.test.ts          update
    typecheck-staged.test.ts   update
  harness/
    config.test.ts             update
    index.test.ts              update
    list.test.ts               update
  product-ready/
    cli.test.ts                update
    index.test.ts              update
    targets.test.ts            update
test/
  scripts-fixture.ts           add
```

## Slices

## 1.型検査の範囲

### Types

なし

### Steps

1. `test/scripts-fixture.ts`:
   - 表示行の印（`ok`、`failed`）とスクリプト名（`copy`、`remove`、`same`）と旗（`--run`、`--only`）を 1 か所に集める。断言はそこから取り、`'root: ok'` のような行を各所に書かない。パスと名前と件数はテストが渡した値から取る。
   - 定数と小さな組み立てだけで、プロセスも FS も開かない。テストの外から読まれても、何も起きずに止まらない。
2. `scripts/checks/typecheck.test.ts`:
   - (happy) 一覧の全部に `tsconfig.json` があるとき → どの範囲も `ok` の行を出す。
   - (error) 1 つの範囲が失敗する → その範囲だけ `failed` の行を出す。
   - (happy) 一覧にある範囲でも `tsconfig.json` が無ければ、その行を出さない。
   - (empty) 一覧が空 → root の行だけを出す。
   - (error) 一覧のファイルが無い → root の行だけを出し、exit 0（無いことは誤りにしない）。
   - (error) `scopes.json` が JSON でない → exit 1 と理由の行。
   - 落とす: 「`scopes.json` は `[.pi]`」「`scripts.typecheck` の定義」「`scripts.typecheck:staged` の定義」の 3 本（リポジトリの現状を写しているだけで、`scopes.json` を変えれば誰でも気づく）。
3. `scripts/checks/typecheck-staged.test.ts`:
   - (empty) 対象が空 → exit 0。
   - (happy) 対象は 8 つの拡張子（ts、tsx、mts、cts、js、jsx、mjs、cjs）で、md は外れる。
   - (happy) `.pi` の下のファイルは `.pi` の範囲で回る。
   - (happy) 一覧に `.pi` が無ければ root の範囲で回る。
   - (error) `tsconfig` が JSON でない → exit 1 と理由の行。
   - 落とす: 「存在しない物だけは exit 0」（消えたパスは起きにくく、落ちても気づかれない）。
   - 落とす: 「root の `tsconfig` が無いと空で exit 0」「`.opencode` が無ければ skip で exit 0」（構成の欠落は起きにくい）。
   - 落とす: 「一覧が無ければ root で回る」（`.pi` が無い一覧のケースと同じ仕様）。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 2.ハーネスの写し

### Types

なし

### Steps

1. `scripts/harness/config.test.ts`:
   - (happy) `false` の一覧 → `copy` の各道から除外の glob を作る。
   - (happy) `true` の一覧 → 除外が無い。
   - (happy) 両方とも既定値を埋める。
   - 落とす: 「starter の既定は exclude が無い」（上の `true` のケースと同じ仕様）。
2. `scripts/harness/list.test.ts`:
   - (happy) 一覧をそのまま返す。
   - (error) 道が無い → 道を入れた誤りで投げる。
   - (error) `copy` が配列でない → 投げる。
   - (happy) `copy` の 1 件から 2 つの glob を作り、2 件は順に並ぶ。
   - (boundary) 末尾の `/` は落とし、空と `.` は飛ばす。
   - 落とす: 「この repo の一覧の旧 5 道が無い」（リポジトリの現状の写し）。
   - 落とす: 「copy 空は空」「空と点は空」の 2 本（上の境目のケースに畳む）。
3. `scripts/harness/index.test.ts`:
   - 塊の 1 行は、印と、テストが作った相対パスと件数から組む。5 対 2 の混ざりは工場で作る。
   - (happy) 中身が同じで片方にしか無い → `copy` の 1 行。
   - (happy) 元にだけある → `copy` に出る。
   - (happy) 先にだけある → `remove` に出る。
   - (empty) 両側が空 → どちらの行も出さない。
   - (happy) `logs`、`node_modules`、`.git` は、一覧の `skip` に書いてなくても両側とも集めない。
   - (happy) `copy` の一覧の外は集めない。
   - (happy) 元の dir が無い → 先の物が全部 `copy`。
   - (happy) `push` は `pull` の逆の向きになる。
   - (happy) `starter.json` の `~` は `HOME` の下に解決する。
   - (happy) `~foo` は `HOME/foo` として解決する。
   - (happy) `--run` 無し → 木を変えない。
   - (error) `harness.json` が無い / `copy` が配列でない / `starter.json` が無い / JSON でない / 空文字 / 空の物 / 向きが無い / 知らない向き / 未知の引数 / 旧 `harness.json` / `legacy` が配列でない → どれも 1 行で exit 1。
   - (happy) `pull --run` は写して消す。
   - (happy) `push --run` は逆の向きで同じ結果になる。
   - (happy) 元の側でだけ古い物 → 消え、空になった dir も消える。
   - (happy) `logs` と一覧の外は、両方向とも残る。
   - (happy) 2 回目の `--run` → 何も写さず、木は同じ。
   - (error) 相手の道が無い `--run` → 何も書かずに exit 1。
   - (error) 一覧が壊れた `--run` → 何も書かずに exit 1。
   - (happy) `legacy` の道は消え、`--run` 無しでは残る。
   - (empty) `legacy` の道が先に無い → 何も消さず、消した物の表示も出さない。
   - (happy) `starter.json` は `copy` にも `remove` にも出ない。
   - (happy) starter 自身は `same` の 1 行。
   - (happy) 相対の道は root から解決する。
   - 落とす: 「元の空 dir は先に作らない」（空の dir が増えても誰も気づかない）。
   - 落とす: 「legacy が無いときは文言のみ」「legacy 不在は文言のみ」の 2 本（上の `legacy` の空のケースに畳む）。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 3.プロダクトの準備

### Types

なし

### Steps

1. `scripts/product-ready/targets.test.ts`:
   - (happy) `cycles` の 2 件を集め、README は入れない。
   - (happy) `--only cycles` → `cycles` の行だけ。
   - (empty) 何も無ければ空。
   - (error) 知らない `label` → 空（既定の行を返さない）。
   - (error) 無い root → 投げる。
   - (happy) `at` の昇順に並ぶ。
   - (happy) `labels` の指定が無ければ既定の名前を使う。
   - (happy) `labels` を指定するとその名前を使う。
   - (happy) `remove` の 2 回目は空。
   - (happy) 消した `at` を返す。
   - 落とす: 「旧 `label` の物は入らない」（旧い形は起きにくい）。
2. `scripts/product-ready/cli.test.ts`:
   - 旗の名前は `test/scripts-fixture.ts` から取る。
   - (happy) `config` の `scripts` が 2 件 → 2 行。
   - (empty) 空 → 無い旨の 1 行。
   - (happy) 対象 2 件 → 見出しと 2 件の 3 行。
   - (happy) `label` が空でも並びを保つ。
   - (happy) `label` ごとにまとめ、`at` を出す。
   - (empty) 無い `label` → 表示だけ。
   - (happy) `--run` を読む。
   - (error) 未知の引数 → 投げる。
   - (happy) `--only tests` と `--only=tests` の両方を読む。
   - (error) `--only` の値が無い → 投げる。
   - 落とす: 「空は無い旨の 1 行」の 2 本目（上の空のケースと同じ仕様）。
3. `scripts/product-ready/index.test.ts`:
   - (happy) `--run` で `cycles` の下が消える。
   - (happy) `--run` 無し → 表示だけで木は変わらない。
   - (happy) `--only cycles` と `--run` → `cycles` だけ消える。
   - (happy) もう一度 `--run` → 無い旨の表示。
   - (happy) 旗の無い混在 → 旗のある物だけが変わり、無い物は内容が同じまま。
   - (happy) `scripts` が無くても消える。
   - (happy) 1 つの鍵が欠けていても、欠けを作らない。
   - (error) `package.json` が無い / JSON でない → 1 行で exit 1、木は変わらない。
   - (error) `--only` の値が無い / 未知の引数 → exit 1。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 型検査の範囲

- Findings: なし
- Unplanned:
  - 製品を直してしまった 1 件を戻した。plan が「大文字の拡張子も対象」を case に挙げたが、それは quality-gate の filterByExtensions の話で、typecheck-staged の仕様ではない。ADR の「製品のコードを変えない」に合わせ、製品を戻してケースを落とした。
- Commit: de67dd21617d9a73446b4e84a498b00eef821b8a
- Stopped:

### Slice 2: ハーネスの写し

- Findings: なし
- Unplanned: なし
- Commit: 5eab6ac
- Stopped:

### Slice 3: プロダクトの準備

- Findings: なし
- Unplanned: なし
- Commit: b84300d774ebf0f6117f5f548a2749916f2eb160
- Stopped:

### Cleanup: 重なった写しの検査

- Findings: なし
- Unplanned:
  - `scripts/harness/index.test.ts` の弱い logs 1 件と `~` 単体 1 件を落とした。強い logs（skip なしでも集めない）が残り、`~` は `~/starter` と `~foo` が残るので、写しは変わらない。

## Review

### Plan review

- `plan/slim-scripts.md` のスライス 2 と 3 に `### Verify` が無く、何が通れば閉じるのか読めませんでした。
  - fixed: 2 つとも `Always` を `既定の 5 つ`、`Added` を `なし` で足した。
- `scripts/checks/typecheck-staged.mjs:10` の 8 つの拡張子のうち、md と ts・tsx 以外を外しても緑のままでした。
  - fixed: 「対象は 8 つの拡張子で、md は外れる」と「大文字の拡張子も対象になる」を足した。
- `scripts/checks/typecheck.mjs:17` の一覧ファイルが無い分岐が、どの step にもありませんでした。
  - fixed: 「一覧のファイルが無い → root の行だけを出し、exit 0」を足した。
- `scripts/harness/index.test.ts:148` の `skip` 付きのケースだけが残り、常時の除外を外しても緑のままでした。
  - fixed: 「一覧の `skip` に書いてなくても集めない」に畳んだ（落とさない）。
- `scripts/harness/index.test.ts:494` の `copy (5):` の件数が、工場から導かれていませんでした。
  - fixed: 塊の 1 行を「印と相対パスと件数から組む」と書き足した。
- `scripts/harness/index.mjs:379` の `legacy` の道が先に無い場合が、落とされていました。
  - fixed: `(empty)` のケースとして残した。
- `scripts/product-ready/index.test.ts:108` の混在のケースは、旗の判定を外しても緑のままでした。
  - fixed: 「旗のある物だけが変わり、無い物は内容が同じまま」に直した。
- `scripts/product-ready/targets.mjs:18` の知らない `label` の絞りが、既定と同じとして落とされていました。
  - fixed: `(error)` のケースとして残した。
- `scripts/checks/typecheck.test.ts:78` の表示文の直書き。
  - left: 印（`ok`、`failed`）と旗は `test/scripts-fixture.ts` に 1 度だけ置き、断言はそこから取ります。断言の行にリテラルを置かないのが規則 3 で、値の出どころを 1 か所にするのが規則 7 です。製品はこの印を公開していません。

### Round 1

- Stale:
  - `scripts/checks/typecheck-staged.test.ts:9` の「印と旗は fixture から取る」との説明は、実際には理由行のみを使い印は独自定数で置いているため、注釈が実態とずれています。
  - fixed: 注釈を実態（理由行のみ fixture、`stub -p` はスタブの目印）に直した。
- Unlisted:
  - なし — 差分の 9 件は Files の 9 件と一致し、計画書自体の更新以外に名の無い変更はありませんでした。
- Gaps:
  - なし — Steps の各ケースは対応する検査に存在し、落とすとされた分岐も計画どおりに除かれています。
- Unproven:
  - `scripts/harness/config.test.ts:13` は期待値を製品の `harnessExcludes` で組み立てるため、その変換が壊れても両側が同じく壊れて緑のままになります。
  - fixed: 期待の後半を渡した `copy` の一覧から自前で組み立てるよう直し、製品の `harnessExcludes` を呼ばないようにした。
  - `scripts/product-ready/targets.test.ts:81` は既定名の期待値を製品の `STARTER_ONLY` から作るため、既定値が変わっても緑のままになります。
  - fixed: 既定名の期待を `cycles` の直書きにし、製品の `STARTER_ONLY` を読まないようにした。
- Noise:
  - `scripts/product-ready/cli.test.ts:19` の断言に製品の表示文が直書きされており、工場や定数から導かれていません。
  - fixed: 表示文を fixture の `configLine` / `scriptsLine` から組み立てるよう直した。
  - `scripts/product-ready/cli.test.ts:60,80,82` の `countLine(..., 1)` は件数の直書きであり、2 件の例のような `entries.length` から導かれていません。
  - fixed: 件数を渡した一覧の長さ（`entries.length` と label ごとの filter の長さ）から取るよう直した。
- Doubts:
  - `scripts/product-ready/index.test.ts:129` の 2 回目の `--run` は scripts と config の表示だけを見て cycles の無い旨の行を見ていませんが、仕様の範囲が曖昧なため所見に留めます。
  - `scripts/harness/config.test.ts:9` は実リポジトリの一覧を読むため現状に依存しますが、Steps の指定どおりであり所見に留めます。

## Acceptance

- Ran:
- Findings:
- Doubts:
