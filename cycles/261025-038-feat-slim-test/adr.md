# ADR 038

## 01: 既存の 881 ケースを `## Test cases` に合わせるか

### Context

- 035 で `.pi/skills/plan/references/format.md` に `## Test cases` の 6 規則を決め、以後に書くテストには当たっている。
- 既存のテストは 55 ファイル・881 ケースで、その前に書かれたまま、指針に当たっていない。
- owner は、指針を既存のテストの基準に広げ、できる限り全てを対象にしたい。
- 直近の 2 サイクルの片付けは、その変更が残したテストだけを落としていた。
- 消す候補のうち、どれが本当に「起きにくく、壊れても誰も気づかない」かは、1 本ずつソースを読むまで確定しない。
- 分かっていないこと: 書き換えたあとのテストが、同じ振る舞いを同じ強さで押さえるか。

### Scope

- 変更:
  - behaviour: in — 881 ケースを指針に合わせ、消す・畳む・直す。
  - refactor: in — テストデータの工場関数と偽物を `test/` に寄せる。
  - dependency: out — 新しい依存は無い。vitest と Node の標準機能で書ける。
  - naming: out — 製品の名前は変えない。テストのファイル名も変えない。
  - format: in — テストの書き方（断言、ケースの分け方、データの置き場）を揃える。
  - prose: out — 指針そのものは変えない。035 で決めた 6 規則をそのまま使う。
- 品質:
  - speed: out — テストの実行時間は変えない。ケースが減る分だけ短くなる。
  - security: out — 新しい入力面が無い。製品のコードを変えない。
  - compatibility: in — 製品のコードと、いま緑の振る舞いは変えない。
  - errors: in — テストが確かめる失敗の道は、指針に合う形で残す。
- 運用:
  - deploy: out — このスターターに deploy は無い。
  - migration: out — 移行は無い。テストはリポジトリの中だけ。
  - logs and monitoring: out — 記録の形は変えない。

### Research & Trial

- テストは 55 ファイル・881 ケース・12,217 行で、対象のコードは 9,409 行。テストがコードより 2,808 行多い。
- 5 本の `research` が全ケースを判定した。内訳は keep 544、fix-literal 128、fix-data 32、fix-mock 9、merge-boundary 82、drop-dup 38、drop-premise 19、drop-unlikely 29。
- 消す側の 86 と畳む側の 82 を当てると、881 は 713 になる（19% 減）。直す側の 169 は、本数ではなく断言の中身が変わる。
- 断言は 1,870。文字列を直書きしたものが 276（`toBe('')` 36、`toBe('broken')` 25、`toBe('ok')` 13、`toBe('failed')` 13）、数値が 210、`toHaveLength(数値)` が 181。
- 形を推測した偽物（`as unknown as`）が 14 箇所。テストデータを組み立てる関数を先頭に持たないファイルが 15 本。
- `.pi/skills/work/SKILL.md` の手順 5 は落とすことだけを持ち、直す手順が無い。片付けの口は、その変更が残したテストに限られる。
- 削除の候補は、根拠を確かめずに消さない。少なくとも 5 件は `keep` に戻すと決めた（`.pi/extensions/quality-gate/targets.test.ts:60`、`.pi/extensions/consult/policy/types.test.ts:48`、同 `:78`、`.pi/extensions/thinking-scrub/state/cell.test.ts:22`、同 `:34`）。

### Decision

- Status: **accepted**
- Adopted:
  - **A**: 1 サイクルで 55 ファイル全部を対象にする。plan は並列に走らせる。削除の候補は、plan の step で 1 本ずつソースを読んで確かめる。
- Options:
  - **B**: 消す側を先に、直す側を次のサイクルに回す。買うもの: 先に 713 件まで減り、「スリムに」に先に答える。コスト: 1 つ目の終わりに、直書きの断言が 169 残る。成り立たない所: 1 サイクルで全部を対象にすること。（採らなかった理由: 並列で走らせれば 1 サイクルに収まり、分ける理由が無い）
  - **C**: 機能ごとに 5 サイクルに分ける。買うもの: 1 サイクルが 106〜275 ケースに収まり、レビューが届く。コスト: 5 サイクルと、前半の判定を後半で見直す手戻り。成り立たない所: 一度に全部そろうこと。（採らなかった理由: B と同じ。並列で走らせれば 1 サイクルに収まる）

### Definition

- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取る main function は同じ。テストが主張する仕様の書き方が変わるのは check。
- `Unit.subagent-consult`(kept): サブエージェントのコンサルを走らせる main function は同じ。consult のテストを指針に合わせるのは check。
- `Unit.context-prune`(kept): 古いツール結果を文脈から外す main function は同じ。context-prune のテストを指針に合わせるのは check。
- `Unit.thinking-scrub`(kept): ループした thinking を次のターンに持ち越さない main function は同じ。thinking-scrub のテストを指針に合わせるのは check。
- `Unit.quality-gate`(kept): 検査結果を受け取る main function は同じ。quality-gate のテストを指針に合わせるのは check。
- `Unit.sound-notify`(kept): 通知に気づける main function は同じ。sound-notify のテストを指針に合わせるのは check。
- `Unit.type-check`(kept): 型に対する指摘を受け取る main function は同じ。typecheck のスクリプトのテストを指針に合わせるのは check。
- `Unit.harness-copy`(kept): ハーネスを取り込み、戻せる main function は同じ。harness のスクリプトのテストを指針に合わせるのは check。
- `Unit.product-ready`(kept): ハーネスのテストを外した状態に切り替える main function は同じ。product-ready のテストを指針に合わせるのは check。
- `Unit.adr-skill`(kept): 決めて記録する main function は同じ。scaffold のテストを指針に合わせるのは check。
- `Unit.close-skill`(kept): サイクルを閉じる main function は同じ。collect のテストを指針に合わせるのは check。
