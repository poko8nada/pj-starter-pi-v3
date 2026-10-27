# ADR 043

## 01: thinking-scrub の定数を settings.json に出し、README ペアで説明する形をどうするか

### Context

- オーナーは、thinking-scrub の定数をコードから設定ファイルに移し、コードを変えずに調整できるようにしたいと考えています。
- 最初に調整したいのは `MIN_THINKING`、`SCAN_EVERY`、`MIN_RUN_CHARS` で、値として `8000`、`1000`、`350` を考えています。
- オーナーは JSONC をやめました。設定ファイルは純粋な JSON のままとし、各定数の説明と、値を上げたとき・下げたときの変更例は、拡張の `README.md` と `README.ja.md` に書く方針です。
- オーナーは、文の層と文字の層の両方の定数を出し、`live`、`sentence`、`char` の 3 グループに分ける形を選びました。`sampleChars` は `live` に置きます。
- オーナーは、今回作る `README.ja.md` を、手順の最後に `proofreader` で日本語校正するよう求めました。
- 定数はいま、`guard.ts:20-23`、`units.ts:21-24`、`detect.ts:22-25` にあり、`observe`、`detectUnitRuns`、`scrubThinking` が直接読んでいます。テストも定数を直接 import しています（`guard.test.ts:13-20`、`detect.test.ts:3-11`、`units.test.ts:6`）。
- 文の層は停止とフォールドの両方で使い、文字の層はフォールドだけで使います。停止側は `detectUnitRuns` だけを使います（`guard.ts:68-69`、`detect.ts:215-219`）。文と文字の間に共通の定数はありません。
- `char.minPeriod` は、短い周期を除外する `isSmallPeriodic` の境目でもあります（`detect.ts:39-53`）。`char.maxPeriod` は、`detectRuns` の周期の走査の上限です（`detect.ts:115-121`）。
- 設定ファイルは `.pi/extensions/thinking-scrub/settings.json` にあり、追跡されています。いまは `enabled` と `show` だけを持ちます。
- `parseSettings` は `JSON.parse` で読み（`settings/schema.ts:24-51`）、`writePatch` は `readDoc` の spread と `JSON.stringify` で書き戻します（`index.ts:75-95`）。純粋な JSON なら、足した定数は書き戻しで消えません。
- オーナーは、拡張の README を `README.md` と `README.ja.md` のペアにし、root の README ペアから拡張の README へリンクする形を考えています。root の README ペアは言語リンクを持っています（`README.md:5`、`README.ja.md:5`）。
- この entry が決めることは、定数を 3 グループにどう分けるか、キーをどう名づけるか、README の表をどのような形にするか、値をどう検証するか、`README.ja.md` の校正をどの手順に置くかです。

### Scope

- 変更:
  - behaviour: in — `settings.json` に `live`、`sentence`、`char` の 3 グループを出し、`Tuning` として読む。キーが無ければ既定を使う。`/thinking-scrub` の on/off/show/hide は今までどおりにする。
  - refactor: in — 定数を `Tuning` 型にまとめ、`observe`、`detectUnitRuns`、`detectRuns`、`scrubThinking` に注入する。テストは既定の `Tuning` を使う。
  - dependency: out — 新しい依存を足さない（JSONC をやめたため）。
  - naming: in — ファイル名、グループ名（`live`、`sentence`、`char`）、キー名を決める。
  - format: in — `settings.json` の 3 グループの形と、README の表の形を決める。
  - prose: in — 拡張の `README.md` / `README.ja.md` を書き、root の README ペアからリンクを張る。`README.ja.md` は、書き終えた後に `proofreader` の日本語校正を通す。
  - values: out — `8000` / `1000` / `350` はこの entry で変えない（抽出後の最初の調整のため。再訪: 抽出がマージされたら見直す）。
  - char-layer: in — `minPeriod`、`maxPeriod`、`minRepeats`、`minLength` を `char` グループとして出す。値は今の既定のままにする。README には、下げたときの誤爆と、`maxPeriod` を上げたときのフォールドのコストを書く。
  - detection: out — 正規化と近似一致は別の問い。
  - ui: out — 設定を編集する UI は別の問い。
  - profiles: out — 複数のプロファイルは別の問い。
- 品質:
  - speed: out — 読み込みの回数は entry 02 で扱う。この entry では変えない。
  - security: out — 設定はローカルのファイルであり、新しい入力は増えない。
  - compatibility: in — 既存の `settings.json` に 3 グループを足す。キーが無ければ既定を使う。
  - errors: in — 型の違い、範囲外の値、`scanEvery <= tail`、`minPeriod < maxPeriod`、`minRepeats >= 2` などの矛盾の扱いを決める。
  - tests: in — パース、既定値の使用、コマンドの書き戻しで定数が残ることを固定する。README の表のキーが `settings.json` のキーと一致することを確かめる。
- 運用:
  - deploy: out — 配布しない。
  - migration: in — 追跡されている `settings.json` に 3 グループの既定値を足す。
  - logs and monitoring: out — ログと監視を変えない。

### Research & Trial

- `writePatch` は `readDoc` の spread と `JSON.stringify` で書き戻します（`index.ts:90-95`）。純粋な JSON なら、入れ子の定数は残ります。
- `parseSettings` は `JSON.parse` で読み、壊れていれば `broken` を返します（`settings/schema.ts:24-51`）。
- 設定ファイルは追跡されています（`git ls-files`）。
- 定数は `guard.ts:20-23`、`units.ts:21-24`、`detect.ts:22-25` にあります。テストは定数を直接 import しています。
- 文の層は停止とフォールドの両方で使い、文字の層はフォールドだけで使います（`guard.ts:68-69`、`detect.ts:215-219`）。文と文字の間に共通の定数はありません。
- `char.minPeriod` は `isSmallPeriodic` の境目で（`detect.ts:39-53`）、`char.maxPeriod` は `detectRuns` の周期の上限です（`detect.ts:115-121`）。
- `proofreader` は md を書ける非隔離の役割です（`.pi/extensions/consult/types.json:31-43`）。ADR の校正と同じ役割を、`README.ja.md` に使えます。
- root の README ペアは言語リンクを持っています（`README.md:5`、`README.ja.md:5`）。拡張の README は英語版だけです。
- `8000` / `1000` / `350` は、`scanEvery <= tail` を満たします（`1000 <= 20000`）。`minRunChars / minCycles` は約 `117` 文字です。
- 外部の調査と試作は行っていません。JSONC をやめたことで、パーサーと依存の問いは消えました。

### Decision

- Status: **accepted**
- Adopted:
  - **B**: `settings.json` を `live`、`sentence`、`char` の 3 グループに分けます。フラグの `enabled` と `show` はトップレベルに残します。
  - `live` は `minThinking`、`scanEvery`、`tail`、`maxAborts`、`sampleChars` を持ちます。`sentence` は `minCycles`、`minRunChars`、`maxPeriodUnits` を持ちます。`char` は `minPeriod`、`maxPeriod`、`minRepeats`、`minLength` を持ちます。
  - 文の層と文字の層は、それぞれのグループだけを読みます。共通の定数はありません。
  - 拡張の README は `README.md` と `README.ja.md` のペアにし、root の README ペアからリンクします。`README.ja.md` は、書き終えた後に `proofreader` の日本語校正を通します。
- Options:
  - **A**: フラットな `settings.json` と、拡張の README ペア。
    - 利点は、設定が単純で、README の表と 1 対 1 になることです。
    - 欠点は、キーが増えると構造がフラットになることです。
    - この案を採らなかったのは、オーナーが `live`、`sentence`、`char` の層ごとのまとまりを選んだためです。
  - **C**: root の README ペアだけに書く。
    - 利点は、文書が 1 か所になることです。
    - 欠点は、設定と文書が離れることです。
    - この案の弱点は、オーナーが拡張の README ペアを求めた要望に合わないことです。
  - **D**: JSONC とコメント。
    - 利点は、設定ファイルの中に説明を置けることです。
    - 欠点は、書き戻しがコメントと定数を消すことです（`index.ts:75-95`）。
    - この案の弱点は、オーナーが JSONC をやめたことに合わないことです。
  - **E**: 別の `SETTINGS.md`。
    - 利点は、設定の説明を別ファイルに分けて書けることです。
    - 欠点は、ファイルが増えることです。
    - この案の弱点は、オーナーが README に書くと言ったことに合わないことです。

### Definition

- `Unit.thinking-scrub`(kept): ループした thinking を取り除き、次のターンに持ち越さない main function は同じです。定数を 3 グループの設定ファイルから読むことと、README ペアで説明することは、ルートの変更です。
- `Unit.usage-readme`(kept): スターターの使い方を読める main function は同じです。拡張の README ペアの追加と、`README.ja.md` の校正は、ルートと検査の変更です。

## 02: 生成中の設定の読み込みを、スキャン時だけにする形をどうするか

### Context

- オーナーは、ライブ・ガードの設定の読み込みを、ストリーミングの更新ごとではなく、スキャン時だけにしたいと考えています。
- いまの `handleMessageUpdate` は、`MIN_THINKING` を超えた後、`SCAN_EVERY` の判定より前に `readSettings` を呼びます（`index.ts:175-181`）。
- `readSettings` は毎回 `readFileSync` と `JSON.parse` を行います（`settings/read.ts:20-35`）。
- `SCAN_EVERY` の判定は `observe` の中にあり（`guard.ts:64-66`）、`MAX_ABORTS` の判定も `SCAN_EVERY` の判定の前後にあります（`guard.ts:61-63`）。
- そのため、`MIN_THINKING` を超えた後は、スキャンが不要な更新でも、`MAX_ABORTS` に達した後でも、設定ファイルを読みます。
- オーナーは、この修正を今回のサイクルの Scope に入れたいと考えています。
- この entry が決めることは、読み込みをどの位置に移すか、設定が無効のときにスキャン位置をどう進めるか、コマンドの即時性をどう保つかです。

### Scope

- 変更:
  - behaviour: in — 外部ファイルの手編集の反映は次のスキャンまで遅らせる。`/thinking-scrub` の on/off はメモリの更新で即時にする。`message_end` のフォールドは今までどおり即時に行う。
  - refactor: in — `handleMessageUpdate` の読み込みを、スキャン間隔と `MAX_ABORTS` の判定の後へ移す。設定が無効のときも `scanned` を進める、または設定をキャッシュする。
  - dependency: out — 依存を足さない。
  - naming: out — 新しい名前を増やさない。
  - format: in — README の設定の節に、反映のタイミングを書く。
  - prose: in — `README.md` / `README.ja.md` に、手編集の反映は次のスキャン時、コマンドは即時反映、と書く。
  - tests: in — 差分不足時、`MAX_ABORTS` 到達後、無効時の読み込み回数を固定する。
- 品質:
  - speed: in — 読み込みの回数が更新ごとからスキャンごとに減る。スキャンの回数と 1 回のコストは変えない。
  - security: out — 読みの権限と秘密の扱いを変えない。
  - compatibility: in — 手編集の反映が最大 `SCAN_EVERY` 文字遅れる。コマンドは即時に反映する。`message_end` は即時に反映する。
  - errors: in — 壊れた設定があっても既定値で動く。読み込みの失敗は今までどおりに扱う。
- 運用:
  - deploy: out — 配布しない。
  - migration: out — データを移さない。
  - logs and monitoring: out — ログと監視を変えない。

### Research & Trial

- `handleMessageUpdate` の順序は、`thinkingOf`、`MIN_THINKING`、`readSettings`、`observe` です（`index.ts:167-189`）。
- `observe` は `effective` を 0 に戻す判定、`MIN_THINKING`、`MAX_ABORTS`、`SCAN_EVERY` の順に見ます（`guard.ts:53-83`）。
- `readSettings` は毎回 `readFileSync` と `parseSettings` を行います（`settings/read.ts:20-35`）。
- `message_end`、`agent_end`、コマンドも設定を読みます（`index.ts:151`、`:215`、`:236`）。これらはメッセージごとまたはコマンドごとであり、更新ごとではありません。
- `enabled: false` のとき、読み込みをスキャン間隔の後へ移しても `scanned` を進めなければ、差分が `SCAN_EVERY` 以上のままになり、更新ごとに設定を読みます。
- コマンドの on/off を即時にするには、ハンドラでメモリ上の設定を更新するか、次の更新で強制的に読む必要があります。いまはハンドラがファイルを書くだけです（`index.ts:227-249`）。
- 外部の調査と試作は行っていません。

### Decision

- Status: **accepted**
- Adopted:
  - **A**: スキャン時読み込み。読み込みをスキャン間隔と `MAX_ABORTS` の後へ移し、無効時も `scanned` を進める。コマンドはメモリ上の設定を更新して即時にする。
- Options:
  - **B**: 境界キャッシュ。`message_end` とコマンドで設定をメモリに取り込み、ライブの経路はメモリだけを読む。
    - 利点は、ライブの経路からファイル読み込みが消えることです。
    - 欠点は、手編集の反映が次の `message_end` まで遅れることです。
    - この案の弱点は、オーナーが読み込みをスキャン時だけにする形を求めたことです。境界キャッシュは、反映を次の `message_end` まで遅らせます。
  - **C**: 現状維持。更新ごとに設定を読む。
    - 利点は、手編集が次の更新で反映されることです。
    - 欠点は、スキャンが不要な更新でも設定を読むことです。
    - この案の弱点は、更新ごとの読み込みが、今回減らす対象であることです。

### Definition

- `Unit.thinking-scrub`(kept): ループした thinking を取り除き、次のターンに持ち越さない main function は同じです。読み込みの位置とタイミングは、ルートの変更です。
- `Unit.usage-readme`(kept): スターターの使い方を読める main function は同じです。反映のタイミングの 1 文は、ルートの変更です。
