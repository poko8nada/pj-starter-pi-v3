# ADR 051

## 01: consult の `run` と `tool` のテストのうち、どれが不要か

### Context

- オーナーは、`plan`、`work`、`プリンシプル` に反しているテストを整理すると決めた（`ROADMAP.md` の 013）。
- テストは62本786件である。consult の `run` と `tool` は13本223件で、1つの区画としては最大である（実測）。
- この区画のテストは、外部プロセス（`ps`、`git`）、ワークツリー、ツールの入力を確かめる。分岐が多いため、異常系と境界値が1件ずつ並んでいる。
- たとえば `proc.test.ts` は、`check` と `readLstart` の2つの関数について、「0 以下・非整数の pid」を2回、「ps に渡る引数」を2回確かめる（実測）。
- `run/worktree.test.ts`（35 件）と `tool/worktree.test.ts`（21 件）は、同じワークツリーの操作を別のレイヤーから確かめる。
- サイクル 050 では、`consult/policy/types.test.ts` の1件だけを削除した。この区画はまだ手つかずである。

### Scope

- 変更:
  - behaviour: out — 製品の振る舞いを変えない。テストの削除と統合だけを行う。
  - refactor: out — 製品コードの構造を変えない。統合はテスト側で行う。
  - dependency: out — 依存を足さない、減らさない。
  - naming: in — 統合したテストに、残す振る舞いを表す名前を付ける。
  - format: in — テストファイルの形（`describe` と `it` の並び、ファクトリの使用）を `## Test cases` に合わせる。
  - prose: in — 削除と統合で意味が通らなくなる説明だけを直す。日本語の全面的な書き直しはしない（050で対応済みである）。
- 品質:
  - speed: in — テストの総数を減らして実行時間を縮め、縮んだ分を実測して記録する。
  - security: out — 秘密、権限、外部接続を扱わない。
  - compatibility: out — テストの削除は製品の互換性に影響しないため、製品の外部との約束を変えない。
  - errors: out — 異常系のテストを削除する場合も製品のエラーの分岐は残すため、エラーの扱いは変えない。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- 対象は13本223件で、全体は62本786件、実行時間は3.42秒だった（`pnpm test:run` の実測）。
- 同じ分岐を2本以上のテストで確かめる組が、ファイルをまたいでおよそ25組あり（実測）、その組は `run/log.test.ts` と `run/delivery.test.ts`、`run/worktree.test.ts` と `tool/worktree.test.ts`、`tool/consult.test.ts` と `tool/subagents.test.ts` の間に多い。
- 同じ関数の中で同じ分岐を2回確かめる組が4つあり（実測）、内訳は `proc.test.ts:56` と `:123`（ps の引数）、`proc.test.ts:70` と `:136`（pid のガード）、`place.test.ts:25` と `:73`（保存場所がない → `[]`）、`log.test.ts:171` と `:260`（startToken なし + pidAlive）である。
- `log.ts:138`、`:139`、`:147` の3フィールドは同じ形の型ガードで、`log.test.ts:366`、`:396`、`:556` が1件ずつ確かめる（実測）。
- 壊れても誰も読まないことを確認できたテストは7件であり（実測。`index.ts:80-91`、`index.ts:184-185`、`tool/worktree.ts:130-163` をたどった）、対象は `delivery.test.ts:133`、`place.test.ts:61`、`log.test.ts:211`、`log.test.ts:366`、`log.test.ts:433`、`tool/run.test.ts:52`、`tool/commit.test.ts:95`である。
- 読者がいることを確認できたテストは10件であり、最初の調査の「誰も気づかない」の分類は9件については誤りだった（実測）が、その値は一覧の本文か `details` でエージェントに返る。
- `delivery.ts:83-84` のコメントは、古いフィールドの掃除について「保存場所を小さく保つ掃除でしかない」と書いている（実測）。
- このリポジトリに `records/` はなく（実測）、旧形の行、数値の `token`、ちょうど30日前のファイルはここには存在しない。
- ダミーデータは `consult.fixture.ts` の `aRunRecord`、`aTypePolicy`、`aConsultOptions` と `test/temp-dir.ts` から来て、`test/pi.fixture.ts` は consult のテストでは読まれていない（実測）。
- 引数の検証を確かめるテストは13件あり、`worktree: ''`、`task: '  '`、`role: ''` は `PARAMETERS` の型が許すため検証に到達する（実測）。
- 断言にハードコードした値を持つテストがほぼ全件であり、製品の出力文（`no change`、`committed: `、`lost`）と入力から取るべき値（`'consult-1'`、`123`、`2000`）が混ざるが、`consult.fixture.ts:10` は「断言に数や文を直書きしない」と定める。
- 「読む」と「気づく」の区別は、`worktree.test.ts:224` と `:352` で未確定であり、その値はエージェントに返るが、異常に気づくかは記録がない（実測）。
- pi のホストは `execute` の前に `parameters` を検証して値を強制変換し、不正な引数のときは `execute` を呼ばず、`isError: true` のツール結果を返す（出典: `pi-agent-core@1.4.0` の `agent-loop.js` の `prepareToolCall`、`pi-ai@1.4.0` の `validation.js` の `validateToolArguments`、`pi.dev` の extensions の Tool Events）。
- したがって `parseRunRequest` の throw のうち、「オブジェクトでない」「role がない」「continue が真偽値でない」はツールの面では起こり得ず、空文字の `role`、`task`、`worktree` は `PARAMETERS` が `minLength` を持たないため起こり得る（実測: `run.ts:12-30`）。
- 未知のフィールド（`input`、`message`）はホストが落とさないため `execute` に届く（出典: 同じ `validation.js`）が、届いても読まれない（consult-4 の実測）。
- テストはホストを迂回し、`consult.test.ts:61-62` は `runtime.run` を直接呼ぶ（実測）が、`/` コマンドはツールの検証を通らないものの、consult の3つのコマンドは `run` を呼ばない（実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案 Bは、外から届く振る舞いに限り、同じ分岐を確かめる組を1本に統合し、誰も読まないテストと型が保証する前提のテストを削除し、さらにツールの入力、コマンド、`ps` と `git` のどれからも届かない分岐のテストを削除する。
  - ハードコードした値は、製品の出力文は契約として残し、入力から取るべき値だけファクトリに寄せる。
  - 旧形の行、数値の `token`、`startToken` なしの移行、台帳なしの一覧は、届かない分岐として削除する。
- Options:
  - 案 A（統合と確認できた不要分の削除だけを行い、減る数がおよそ25〜30件で、移行と旧形の互換性のテストが残るため）
  - 案 C（3つの文書の字面で切ると、製品の出力文を確かめる手段がなくなり、出力の退行に気づけないため）

### Definition

- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.subagent-consult`(kept): サブエージェントのコンサルを実行し、そのワークツリーと結果を扱うという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.sound-notify`(kept): pi からの通知に気づくという働きは変わらず、音を確かめるテストが1件に統合されるだけである。
- `Unit.quality-gate`(kept): そのターンの変更分の検査結果を返すという働きは変わらず、検査が実行するテストが減るだけである。
- `Unit.lefthook-gate`(kept): 検査を通して commit と push をするという働きは変わらず、検査が実行するテストが減るだけである。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの件数が減る。

## 02: consult の `policy`、`sub`、`index` のテストのうち、どれが不要か

### Context

- この区画は5本105件である（実測）。内訳は `policy/types.test.ts` 16件、`sub/spec.test.ts` 37件、`sub/guard.test.ts` 29件、`sub/budget.test.ts` 12件、`index.test.ts` 11件である。
- `policy/types.test.ts` は、`types.json` の読み込みと型の引き当てを確かめる。この区画ではサイクル 050 で1件を削除した。
- `sub/spec.test.ts` は、子の pi の argv、イベントの解析、消費の集計、上限の判定を確かめる。
- `sub/guard.test.ts` は、読み取り用のツール、書き込み用のツール、bash の権限を確かめる。ガードが検出しない既知の抜け（`FOO=.env; cat $FOO`）を記録するテストを含む。
- `sub/budget.test.ts` は、ターン数の上限と、上限の手前で1回だけ促すことを確かめる。
- `index.test.ts` は、5秒ごとのティックが未配達の完了を渡し、音を鳴らし、印を書くことを確かめる。
- エントリー 01 で案 B（外から届く振る舞いに限る）を採用したため、このエントリーも同じ基準で判定する。

### Scope

- 変更:
  - behaviour: out — 製品の振る舞いを変えず、テストの削除と統合だけを行う。
  - refactor: out — 製品コードの構造を変えず、統合はテスト側で行う。
  - dependency: out — 依存を追加せず、削除もしない。
  - naming: in — 統合後のテストに、残す振る舞いを表す名前を付ける。
  - format: in — `describe` と `it` の並びとファクトリの使用を `## Test cases` に合わせる。
  - prose: in — 削除と統合で意味が通らなくなる説明だけを直し、日本語の全面的な書き直しはしない（050で対応済みである）。
- 品質:
  - speed: in — テストの総数を減らして実行時間を縮め、その効果を実測して記録する。
  - security: in — `guard` の権限のテストを、外から届く振る舞いの基準で見直し、削除で権限の検査を弱めず、既知の抜けを記録するテストは残す。
  - compatibility: out — テストの削除は製品の互換性に影響しないため、外部との取り決めを変えない。
  - errors: out — 異常系のテストを削除しても製品のエラーの分岐は残すため、エラーの扱いは変えない。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- `policy/types.test.ts:34`、`:60`、`:64`、`:79` の4件は、`types.ts:43-55` のスキーマがすでに保証する前提を再現する（実測: `minItems: 1`、`limits` の必須、`minimum: 1`、必須キー）。`:79` は `toThrow()` だけで文面を確かめない。`:34`、`:60`、`:64` はいずれもスキーマライブラリの文面を正規表現で確かめる。
- `policy/types.test.ts:104` の権限のテストは、ルート権限のないこの環境では実行される（`pnpm test:run` で成功を実測）。
- `sub/guard.test.ts` の 29 件は、権限の判定を確かめる。判定はフェイルクローズドであり（壊れた設定では書き込み用のツールと bash の実行を止め、読み取りは許可する）、フェイルオープンは設定がないときの仕様である（`:245`。実測）。
- 既知の抜けを記録するテスト（`sub/guard.test.ts:108`）の読者は誰もいない。真の境界はホストの権限と OS である（`guard.ts:19-20`。実測）。
- `sub/budget.test.ts:34`、`:64`、`:74` の3件は、壊れても誰も気づかない（実測。pi の打ち切りが残る）。
- `index.test.ts` の 11 件は、`run/delivery.test.ts`、`run/log.test.ts`、`tool/sound.test.ts` と重なる（`:74`、`:155`、`:215`。実測）。`:231` は一覧の running→done と音の on→off を1件で確かめる。
- `sub/spec.test.ts` の 37 件は、子の pi の argv、stdout の解析、消費の集計、上限の判定を確かめる。このうち一部が `tool/render.test.ts` と間接的に重なる（`finalTextFrom`、`modelFrom`、`usageFrom`、`errorFrom`。実測）。
- `sub/guard.test.ts` で重なる組は4つある（実測）。内訳は`:36`/`:59`/`:74`（秘密名）、`:149`/`:174`（空の一覧）、`:153`/`:160`/`:190`/`:219`/`:224`/`:233`/`:238`（`pathAllowed`）、`:178`/`:205`（接頭辞）である。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A を採用し、案 B の基準をこの区画にそのまま適用する。`policy/types.test.ts` のスキーマ前提の4件（`:34`、`:60`、`:64`、`:79`）、`sub/budget.test.ts` の壊れても誰も気づかない3件（`:34`、`:64`、`:74`）、`sub/guard.test.ts:108` の既知の抜けを記録する1件を削除する。
  - `sub/guard.test.ts` の4組、`index.test.ts` の3組、`sub/spec.test.ts` の2組の重なりを統合する。
- Options:
  - 案 B（`policy` の4件と `sub/guard.test.ts:108` を案内と記録として残す。同じ区画の中で基準を変えることになり、次のエントリーに一貫しない前例を残すため）

### Definition

- `Unit.test-run`(kept): 壊れた振る舞いについての指摘を受け取るという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.subagent-consult`(kept): サブエージェントのコンサルを実行し、そのワークツリーと結果を扱うという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.sound-notify`(kept): pi からの通知に気づくという働きは変わらず、ティックの音を確かめるテストが減るだけである。
- `Unit.quality-gate`(kept): そのターンの変更分の検査結果を返すという働きは変わらず、検査が実行するテストが減るだけである。
- `Unit.lefthook-gate`(kept): 検査を通して commit と push をするという働きは変わらず、検査が実行するテストが減るだけである。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの件数が減る。

## 03: context-precompact のテストのうち、どれが不要か

### Context

- この区画は14本106件である（実測）。
- 内訳は `index.test.ts` 36件、`gate/gate.test.ts` 12件、`prepare/compare.test.ts` 8件、`prepare/copied.test.ts` 7件、`prepare/guard.test.ts` 5件、`prepare/prepare.test.ts` 5件、`settings/schema.test.ts` 7件、`settings/read.test.ts` 4件、`ui/status.test.ts` 8件、`ui/count.test.ts` 2件、`run/ports.test.ts` 4件、`run/summarize.test.ts` 3件、`command/precompact.test.ts` 4件、`apply/draft.test.ts` 1件である。
- `ui/status.test.ts` には、近い名前のテストが並ぶ。「ready に前後の数を渡すと桁区切りの 2 値が文面に並ぶ」と「ready と applied に前後の数を渡すと桁区切りの 2 値が入る」、「failed に理由を渡すと文面はあり理由は入らない」と「failed に理由を渡すと理由が入る」などである。
- `index.test.ts` の 36 件は、`now` の draft、off の条件、session 切替を確かめる。off の4件（拡張の off と Pi の off が、`agent_before_settle` と `session_before_compact` で効く）は、2つの関数と2つのフラグの4通りを確かめる。
- `settings/schema.test.ts` の 7 件は、既定値と範囲の検査を確かめる。
- エントリー 01 と 02 で案 B（外から届く振る舞いに限る）を採用したため、このエントリーも同じ基準で判定する。

### Scope

- 変更:
  - behaviour: out — 製品の振る舞いを変えず、テストの削除と統合だけを行う。
  - refactor: out — 製品コードの構造を変えず、統合はテスト側で行う。
  - dependency: out — 依存を追加せず、削除もしない。
  - naming: in — 統合後のテストに、残す振る舞いを表す名前を付ける。
  - format: in — `describe` と `it` の並びとファクトリの使用を `## Test cases` に合わせる。
  - prose: in — 削除と統合で意味が通らなくなる説明だけを直し、日本語の全面的な書き直しはしない（050で対応済みである）。
- 品質:
  - speed: in — テストの総数を減らして実行時間を縮め、その効果を実測して記録する。
  - security: out — 秘密、権限、外部接続を扱わない。
  - compatibility: out — テストの削除は製品の互換性に影響しないため、外部との取り決めを変えない。
  - errors: out — 異常系のテストを削除しても製品のエラーの分岐は残すため、エラーの扱いは変えない。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- off の4件（`index.test.ts:837`、`:847`、`:854`、`:869`）は、2つの関数（`index.ts:361`、`:389`）と2つのフラグ（拡張の off、Pi の off）の4通りを確かめる。同じ分岐の重複ではない（実測）。
- `now` の複数のテスト（`:721`、`:731`、`:741`、`:760`、`:778`、`:788`、`:795`、`:808`、`:819`）は、それぞれ別の行の分岐を確かめる（実測）。
- `index.test.ts:578` は、on/off の `settings.json` の書き換えと、`running→preparing→ready` の遷移と通知を1件で確かめる（実測）。
- `gate/gate.test.ts` の12件は、`gate.ts` の純計算を確かめる。これらは `index.test.ts` の統合側と重なる（`:26` と `:257`、`:30` と `:269` など。実測）。
- `ui/status.test.ts` の近い名前の組は、重複ではない。`chatText` の `ready` と `applied`、`statusText`、`statusLine`、`failureText`、`brokenText` は、関数も出力先も別である（実測）。
- `ui/count.test.ts` は、桁区切りを支える唯一のテストである。`ui/status.test.ts` の期待値は `formatCount` 自体を使うため、区切りが壊れても緑のままである（実測）。
- `settings/schema.test.ts:29`、`:35`、`:41` は、`constants.ts:17-19` の定数の境界を確かめており、これらはスキーマ宣言の確認である（実測）。
- `prepare/compare.test.ts:69`、`:76`、`:82` は、同じ分岐（`compare.ts:33-39` の `fileOps` の比較）を3回確かめる（実測）。
- `prepare/prepare.test.ts:30` と `:41` は、同じ `if` の真と偽の両側を確かめる（実測）。
- `settings/read.test.ts` と `settings/schema.test.ts` は、同じ委譲先（`parseSettings`）を、読む経路とじかに呼ぶ経路で確かめる（`:24` と `:47`、`:9` と `:11`。実測）。
- `command/precompact.test.ts:60` と `ui/status.test.ts` は、`statusLine` を重複して確かめる（実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A を採用し、案 B の基準をこの区画にそのまま適用する。`settings/schema.test.ts:29`、`:35`、`:41` の定数の境界3件を削除する。
  - `prepare/compare.test.ts:69`、`:76`、`:82`、`settings/read.test.ts:24` と `settings/schema.test.ts:47`、`prepare/prepare.test.ts:30` と `:41`、`command/precompact.test.ts:60` と `ui/status.test.ts`、`gate/gate.test.ts` と `index.test.ts` の重なりを統合する。
  - `index.test.ts:578` は2つの振る舞いを1件で持つが、分割しない（テストが増えるため）。
- Options:
  - 案 B（レイヤーをまたぐ統合をしない。純計算の表と統合の経路を切り分けて残すため）

### Definition

- `Unit.context-precompact`(kept): コンパクションを待たずにコンテキストを空けるという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.quality-gate`(kept): そのターンの変更分の検査結果を返すという働きは変わらず、検査が実行するテストが減るだけである。
- `Unit.lefthook-gate`(kept): 検査を通して commit と push をするという働きは変わらず、検査が実行するテストが減るだけである。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの件数が減る。

## 04: thinking-scrub のテストのうち、どれが不要か

### Context

- この区画は9本140件である（実測）。
- 内訳は `index.test.ts` 36件、`live/guard.test.ts` 14件、`scrub/detect.test.ts` 22件、`scrub/message.test.ts` 14件、`scrub/units.test.ts` 16件、`settings/schema.test.ts` 16件、`settings/read.test.ts` 4件、`state/cell.test.ts` 6件、`command/scrub.test.ts` 12件である。
- `scrub/detect.test.ts` と `scrub/units.test.ts` は、繰り返しの検出と単位の分割を、境界値つきで確かめる。周期の下限と上限、繰り返しの下限、`minRunChars` の直前と直後を確かめるテストが並ぶ。
- `settings/schema.test.ts` の 16 件は、既定値とフィールドをまたぐ関係（`scanEvery` と `tail`、`minPeriod` と `maxPeriod`）を確かめる。
- `index.test.ts` の 36 件は、`message_end`、`agent_end`、コマンドの配線、設定のキャッシュ、`live` の中断を確かめる。
- エントリー 01 から 03 で案 B（外から届く振る舞いに限る）を採用したため、このエントリーも同じ基準で判定する。

### Scope

- 変更:
  - behaviour: out — 製品の振る舞いを変えず、テストの削除と統合だけを行う。
  - refactor: out — 製品コードの構造を変えず、統合はテスト側で行う。
  - dependency: out — 依存を追加せず、削除もしない。
  - naming: in — 統合後のテストに、残す振る舞いを表す名前を付ける。
  - format: in — `describe` と `it` の並びとファクトリの使用を `## Test cases` に合わせる。
  - prose: in — 削除と統合で意味が通らなくなる説明だけを直し、日本語の全面的な書き直しはしない（050で対応済みである）。
- 品質:
  - speed: in — テストの総数を減らして実行時間を縮め、その効果を実測して記録する。
  - security: out — 秘密、権限、外部接続を扱わない。
  - compatibility: out — テストの削除は製品の互換性に影響しないため、外部との取り決めを変えない。
  - errors: out — 異常系のテストを削除しても製品のエラーの分岐は残すため、エラーの扱いは変えない。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- 「誰も気づかない」の分類は、2つに分ける必要がある（実測）。負の分岐（いまの出力が「変化なし」）は、その分岐が壊れると中断、通知、置換が出るため、気づかれる。本当に気づかれないのは、設定の読み込み回数（`index.test.ts:274`）、`scanned` の進行（`live/guard.test.ts:113`、`:142`）、2回目の適用（`detect.test.ts:219`。本番では1回だけ適用する）、`failures`（`state/cell.test.ts:16`。`failures` は `command/scrub.ts` の表示に使われない）の4種である。
- `command/scrub.test.ts:55` と `:63`（off と on）は、同じ分岐（`scrub.ts:56-59`）を真偽の両側で確かめる。`:71` と `:79`（show と hide）も、同じ分岐（`scrub.ts:60-63`）の両側を確かめる（実測）。
- `settings/schema.test.ts:41`、`:59`、`:70`、`:81`、`:92` は、同じ分岐（`schema.ts:122` の `scanEvery` と `tail` の関係）を、到達経路を変えて5回確かめる（実測）。
- `scrub/units.test.ts:217` と `:247` は、同じ分岐（`units.ts:246-247` の `period<=3`）を別の周期数で確かめる（実測）。
- `live/guard.test.ts:89` と `:142` は、同じ分岐（`live/guard.ts:64-65` の `maxAborts`）を、設定値 0 の場合と蓄積後の場合という2つの到達経路で確かめる（実測）。
- 設定キャッシュの組（`index.test.ts:483` と `:521`）と notify の組（`:718`、`:763`、`:778`）は、同じ分岐ではない（実測）。
- `settings/schema.test.ts` のフィールドをまたぐ関係は、スキーマの宣言をなぞっただけのものではない。合否を決めるのは `schema.ts:122-124` と `:192-194` の製品独自の判断である（実測）。
- `scrub/detect.test.ts:63` と `:72`、`:38` と `:45` は、同じ分岐の両側を1回ずつ確かめる（実測）。`scrub/units.test.ts:141` と `:151` は、別々のガード（`units.ts:165` と `:170`）を確かめる（実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案 B を採用し、その基準をこの区画に適用する。本当に気づかれない5件（`index.test.ts:274`、`live/guard.test.ts:113`、`live/guard.test.ts:142`、`detect.test.ts:219`、`state/cell.test.ts:16`）を削除する。
  - `command/scrub.test.ts` の2組（`:55` と `:63`、`:71` と `:79`）と、`scrub/units.test.ts` の2本（`:217` と `:247`）を統合する。
  - `settings/schema.test.ts` の5本（`:41`、`:59`、`:70`、`:81`、`:92`）は、到達経路が異なるため統合しない。
  - `live/guard.test.ts:142` は、`scanned` の進行と `enabled` を呼ばないことを確かめるため、削除する。同じ分岐を確かめる `:89` は、`maxAborts` が 0 なら中断しないという外から届く振る舞いを持つため、残す。
- Options:
  - 案 A（`settings/schema.test.ts` の5本も統合する。既定値の補完と明示値の関係を1つの名前にまとめると、切り分けにくくなるため）

### Definition

- `Unit.thinking-scrub`(kept): ループしたシンキングを取り除き、次のターンに持ち越さないという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.quality-gate`(kept): そのターンの変更分の検査結果を返すという働きは変わらず、検査が実行するテストが減るだけである。
- `Unit.lefthook-gate`(kept): 検査を通して commit と push をするという働きは変わらず、検査が実行するテストが減るだけである。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの件数が減る。

## 05: quality-gate と sound-notify のテストのうち、どれが不要か

### Context

- この区画は6本68件である（実測）。
- 内訳は `quality-gate/checks.test.ts` 11件、`quality-gate/report.test.ts` 12件、`quality-gate/targets.test.ts` 12件、`sound-notify/index.test.ts` 22件、`sound-notify/settings/read.test.ts` 3件、`sound-notify/settings/schema.test.ts` 8件である。
- `quality-gate/checks.test.ts` は、git の状態、`.gitignore`、拡張子ごとの対象を確かめる。`report.test.ts` は、失敗したチェックの見出し、出力の切り詰め、セクションの順序を確かめる。`targets.test.ts` は、変更されたパスの取り出しと、指紋（`mtime:ctime:size`）を確かめる。
- `sound-notify/index.test.ts` の 22 件は、どの合図でどの音が鳴り、通知を出すかを確かめる。
- `sound-notify/settings/schema.test.ts:40` は、`../settings.json` を実ファイルから直接読んで、既定値と一致することを確かめる。
- エントリー 01 から 04 までで案 B（外から届く振る舞いに限る）を採用したため、このエントリーも同じ基準で判定する。

### Scope

- 変更:
  - behaviour: out — 製品の振る舞いを変えず、テストの削除と統合だけを行う。
  - refactor: out — 製品コードの構造を変えず、統合はテスト側で行う。
  - dependency: out — 依存を追加せず、削除もしない。
  - naming: in — 統合後のテストに、残す振る舞いを表す名前を付ける。
  - format: in — `describe` と `it` の並びとファクトリの使用を `## Test cases` に合わせる。
  - prose: in — 削除と統合で意味が通らなくなる説明だけを直し、日本語の全面的な書き直しはしない（050で対応済みである）。
- 品質:
  - speed: in — テストの総数を減らして実行時間を縮め、その効果を実測して記録する。
  - security: out — 秘密、権限、外部接続を扱わない。`sound-notify` が外部の `cmux` と `afplay` を呼ぶ点は、`behaviour` の範囲として扱う。
  - compatibility: out — テストの削除は製品の互換性に影響しないため、外部との取り決めを変えない。
  - errors: out — 異常系のテストを削除しても製品のエラーの分岐は残すため、エラーの扱いは変えない。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- `quality-gate/report.test.ts:12`、`:13`、`:14` は同じ分岐（`report.ts:78-86` の `failedLabels`）を3回確かめる。`:15` と `:16`、`:19` と `:20`、`:21` と `:22` は、同じ `if` の真と偽の両側を確かめる（実測）。
- `quality-gate/checks.test.ts:109` と `:116` は同じ分岐（`checks.ts:58-61`）の真と偽の両側を確かめ、`:156` と `:176` は `.gitignore` の同じ分岐（`checks.ts:90-99`）の真と偽の両側を確かめる（実測）。
- `quality-gate/targets.test.ts:75`、`:81`、`:87` は同じ分岐（`targets.ts:86-99`）を3回確かめる。`:104`（指紋の書式）と `:81`（再検出）は対になっており、片方だけでは再検出を確かめられない（実測）。
- `sound-notify/index.test.ts:136` は5つの音を一括で確かめる。`:335`、`:341`、`:347`、`:225`、`:277`、`:388` が合図ごとに同じ分岐を確かめる（実測）。
- `sound-notify/settings/read.test.ts:9` と `index.test.ts:186`（ok）、`:24` と `:192`（broken）は、レイヤー違いで同じ入力を確かめる（実測）。
- `sound-notify/settings/schema.test.ts:68` と `:74` は、`settingsOrDefault` の2つの分岐を確かめる（実測）。
- `sound-notify/settings/schema.test.ts:40` は `../settings.json` を実ファイルから直接読む。既定値と食い違えば起動時の音が変わるため、読者はオーナーである（実測）。
- `sound-notify/index.test.ts:312` は `hasUI` が false のとき鳴らないことを確かめる。テストが壊れても、端末のない環境では誰も気づかない（実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案 B を採用し、その基準をこの区画に適用する。`sound-notify/index.test.ts:136`（5つの音を束ねたもの）、`:312`（`hasUI` が false）、`settings/schema.test.ts:40`（`../settings.json` を実ファイルから直接読む）を削除する。
  - `quality-gate/report.test.ts` の4組（`:12`/`:13`/`:14`、`:15`/`:16`、`:19`/`:20`、`:21`/`:22`）、`checks.test.ts` の2組（`:109`/`:116`、`:156`/`:176`）、`targets.test.ts` の1組（`:75`/`:81`/`:87`）、`sound-notify` の2組（`settings/read.test.ts:9` と `index.test.ts:186`、`:24` と `:192`）、`settings/schema.test.ts` の1組（`:68`/`:74`）を統合する。
  - 実ファイルとコードの既定値の一致は、テストではなく、`settings.json` を読む起動時の経路で保つ。サイクル 050 で `types.test.ts` の `stored types.json` を消したのと同じ形とする。
- Options:
  - 案 A（`settings/schema.test.ts:40` を残す。実ファイルとコードの既定値の一致を CI で保つため）

### Definition

- `Unit.quality-gate`(kept): そのターンの変更分の検査結果を返すという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.sound-notify`(kept): pi からの通知と、commit が通ったことに気づくという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.lefthook-gate`(kept): 検査を通して commit と push をするという働きは変わらず、検査が実行するテストが減るだけである。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの件数が減る。

## 06: scripts と `.pi/skills` のテストのうち、どれが不要か

### Context

- この区画は15本144件である（実測）。
- `scripts` は13本99件である。内訳は `checks/typecheck-staged.test.ts` 5件、`checks/typecheck.test.ts` 6件、`harness/collect/index.test.ts` 6件、`harness/config.test.ts` 3件、`harness/diff/index.test.ts` 4件、`harness/display/index.test.ts` 3件、`harness/index.test.ts` 10件、`harness/list/index.test.ts` 7件、`harness/path/index.test.ts` 6件、`product-ready/cli.test.ts` 13件、`product-ready/index.test.ts` 17件、`product-ready/readme-format.test.ts` 4件、`product-ready/targets.test.ts` 15件である。
- `.pi/skills` は2本45件である。内訳は `adr/scripts/scaffold.test.ts` 38件、`close/scripts/collect.test.ts` 7件である。
- `scaffold.test.ts` は、サイクルのフォルダ名、エントリーの番号、引数の読み取り、開いたサイクルの判定を確かめる。テスト名の一部は、引数の断片で途中で切れている（`plan(root, ` など）。
- `product-ready/targets.test.ts` も、同じ形で名前が途中で切れているテストを含む（`plan(root, `）。
- エントリー 01 から 05 までで案 B（外から届く振る舞いに限る）を採用したため、このエントリーも同じ基準で判定する。

### Scope

- 変更:
  - behaviour: out — 製品の振る舞いを変えず、テストの削除と統合だけを行う。
  - refactor: out — 製品コードの構造を変えず、統合はテスト側で行う。
  - dependency: out — 依存を追加せず、削除もしない。
  - naming: in — 統合後のテストに、残す振る舞いを表す名前を付ける。名前が途中で切れているテストは、このときに直す。
  - format: in — `describe` と `it` の並びとファクトリの使用を `## Test cases` に合わせる。
  - prose: in — 削除と統合で意味が通らなくなる説明だけを直し、日本語の全面的な書き直しはしない（050で対応済みである）。
- 品質:
  - speed: in — テストの総数を減らして実行時間を縮め、その効果を実測して記録する。
  - security: out — 秘密、権限、外部接続を扱わない。
  - compatibility: out — テストの削除は製品の互換性に影響しないため、外部との取り決めを変えない。
  - errors: out — 異常系のテストを削除しても製品のエラーの分岐は残すため、エラーの扱いは変えない。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- `scaffold.test.ts` の 38 件は、9つの関数と CLI の本体に分かれる。同じ関数を2回以上確かめる組は、`lastEntryNumber`（`:208`/`:213`）、`appendEntry`（`:232`/`:242`）、`createLeafDir`（`:112`/`:122`）、`dirNames`（`:132`/`:144`）の4組である（実測）。
- `scaffold.test.ts:185` は Decision 欄の2行を確かめ、`:191` は見出しの6行と `format.md` の一致を確かめる。両者は別のものである（実測）。
- `scripts/checks/typecheck.test.ts:143` と `typecheck-staged.test.ts:128` は、同じ「JSON でない → exit 1」を2つのスクリプトで確かめる（実測）。
- `.pi/skills/close/scripts/collect.test.ts:34` と `:38` は、`ex-` の同じ分岐の両側を確かめる（実測）。
- `scripts/product-ready/targets.test.ts:58`（root がない）と `:127`（表にない at）が確かめる分岐は、CLI から届かない。`root` の値は `process.cwd()` から来て、`at` の値は固定の一覧から来る（実測）。
- `scripts/harness/diff/index.test.ts` の4件は、4通りの分岐を確かめる（実測）。`scripts/harness/index.test.ts` の pull と push の `--run` は、対称な分岐を確かめる（実測）。
- テスト名は途中で切れていない（`grep` が複数行の `it(` を取りこぼしていた。実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A を採用し、案 B の基準をこの区画に適用する。`scripts/product-ready/targets.test.ts:58`（root がない）と `:127`（表にない at）を削除する。
  - `scaffold.test.ts` の4組（`lastEntryNumber` の `:208`/`:213`、`appendEntry` の `:232`/`:242`、`createLeafDir` の `:112`/`:122`、`dirNames` の `:132`/`:144`）、`checks/typecheck.test.ts:143` と `typecheck-staged.test.ts:128`、`close/scripts/collect.test.ts:34` と `:38` を統合する。
- Options:
  - 案 B（`scaffold.test.ts` の4組を統合しない。ハーネスの道具の退行を入力ごとに見つけるため）

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.close-skill`(kept): サイクル終了後にクロージングできるという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.product-ready`(kept): ハーネスのテストを外した状態に切り替えられるという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.harness-copy`(kept): スターターのハーネスをプロジェクトへ取り込めて、戻せるという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Unit.lefthook-gate`(kept): 検査を通して commit と push をするという働きは変わらず、検査が実行するテストが減るだけである。
- `Unit.quality-gate`(kept): そのターンの変更分の検査結果を返すという働きは変わらず、検査が実行するテストが減るだけである。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取るという働きは変わらず、この働きを支えるテストが減り、残るテストは外から届く分岐にひもづく。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの件数が減る。
