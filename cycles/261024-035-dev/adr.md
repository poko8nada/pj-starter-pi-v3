# ADR 035

## 01: テストの指針を、プランスキルのどこに、どんな形で入れるか

### Context

- 今のプランスキルは、`Verify` が実装の正しさを証明する形になっている。テストファイルを作ることが `Verify` の項目に入っている。
- そのため、設定値を 2 から 4 に変えるだけの実装でも、値が 4 であることを確かめるテストが書かれた。オーナーはこれを発端に、6 つの指針を書いた。
- 指針は「何をテストするか」を決める基準である。`Verify` とステップの形が変わらないと効かない。
- 統合スライスも無くしたい。plan 全体が動くかの確認は、クローズに移す（02）。
- フロントの確認は、スクリーンショットを撮らない。エージェントがローカルホストを立てて cmux-browser を開き、チャットでオーナーに確認を促し、OK で完了とする。
- cmux は画面幅を変えられない。だから幅違いの確認は、書かない。
- cmux-browser スキルは、エージェントが dev サーバーを立てることを禁じている（`~/.pi/agent/skills/cmux-browser/SKILL.md` 20 行）。この規則はリポジトリの外なので、このサイクルでは触らない。

### Decision

- Status: **accepted**
- Adopted:
  - `Verify` を「常に確認するもの」と「実装内容で足すもの」に分ける。テストのケースの列は置かない。
  - テストファイルを作るのを、ステップの仕事にする。ステップの書き方を、コード、テスト、文書で分ける。
  - `Kinds`、`Cases`、`Walk` を削除する。テストの基準は、新しいセクションに書く。
  - レビューの観点を、テストのステップの妥当性と、ステップの `Verify` の妥当性に向ける。
  - 統合スライスを削除する。
  - `Files` に、ファイルの構造の作り方を足す。
- Options:
  - 一部だけ組み替える（`Kinds` の一覧を、条件付きのチェックの名前として残す）（採らない: 種類を選ぶ形に戻りやすく、指針が半分しか効かない）
  - 指針のセクションを足すだけで、`Verify` とステップの形は変えない（採らない: `Verify` が実装の証明である形が残り、発端が残る）

### Scope

- 変更:
  - in: behaviour — エージェントの手順が変わる。テストはステップで書き、`Verify` はテストが通ることを確かめる。
  - in: refactor — `Kinds`、`Cases`、`Walk` を整理し、統合スライスを消す。
  - out: dependency — 新しい道具を増やさない。フロントの確認は、いまの cmux-browser で足りる。
  - in: naming — `統合:` の名前が消え、`Verify` と `Cases` の見出しが変わる。
  - in: format — plan md の形が変わる。
  - in: prose — レビュワーとサブエージェントへ渡すタスク文が変わる。
- 品質:
  - out: speed — このサイクルの外。目的ではない。再訪: 036 で、テストの数と実行時間を数えるとき。
  - out: security — このサイクルの外。認証の `Verify` を足すのは書き方で、認証の性質は変えない。再訪: 認証を持つプロダクトで、この行を初めて使うとき。
  - in: compatibility — `close/scripts/collect.mjs` が読む `## Notes` の形を、変えない。
  - in: errors — `Verify` が落ちたときと、サブエージェントが止まったときの扱いを見直す。
- 運用:
  - out: deploy — ずっと外。Stack に Deploy がない。
  - out: migration — ずっと外。DB を持たない。DB の `Verify` は文書として書く。
  - out: logs and monitoring — ずっと外。ログと監視を持たない。

### Research & Trial

- `.pi` はプロダクトへコピーされる（`scripts/harness/harness.json` の `copy`）。スキルの文面は、プロダクトでも読まれる。
- レビューのサブエージェントは `read` を持つ。書き込みは `cycles/*/plan/*.md` に限られる（`.pi/extensions/consult/types.json` 25 行）。テストの基準は `format.md` に置き、タスク文から指せる。
- `close/scripts/collect.mjs` は、plan md の `## Notes`、`## Review`、`## Acceptance` を読む（181〜209 行）。
- cmux は画面幅を変えられない。`viewport emulation` は `not_supported`（`~/.pi/agent/skills/cmux-browser/SKILL.md` 126〜131 行）。`browser screenshot` と `browser zoom` はある（`cmux --help`）。

### Definition

- `Unit.plan-skill`(kept): 手順、検査、ファイルの形が変わるだけで、plan を書けるという機能は動かない。
- `Unit.work-skill`(kept): 受入とレビューの観点が変わるだけで、plan を片付けるという機能は動かない。
- `Unit.close-skill`(kept): 最後に Unit の確認を聞く手順が増えるだけで、クロージングできるという機能は動かない。

## 02: クローズの最後に、オーナーの確認をどこまで求めるか

### Context

- 統合スライスを消すと、plan 全体が動くかを、ワークの中で確かめない（01）。
- クローズは、すべての plan がマージされた後に走る。機能が動くかをオーナーが触って確かめられる、唯一の場所になる。
- 直した後の姿を見たいので、確認はトリアージと `ex-` の修正の後に回す。
- オーナーは、確認するかを聞き、OK で完了とする形を望んでいる。
- フロントの確認の書き方は、プランスキルに置く。クローズには置かない。

### Decision

- Status: **accepted**
- Adopted:
  - トリアージと `ex-` の修正が済んでから、最後に、Unit ごとに、実際に動かすか目視で見るかを聞く。
  - 確認すると答えたら、マージ後の機能をオーナーが確かめ、チャットの OK で完了とする。
  - 確認しないと答えたら、その理由を 1 行で残す。
  - 記録は close.md の先頭に、Unit ごとに置く。Unit には、その Unit を切った plan を並べる。
  - 確認で機能が動かなければ、その Unit の `Fixed` に `ex-` の plan を書き、マージしたら commit を入れる。
- Options:
  - 常に確認する（聞かない）（採らない: 確認が要らないサイクルでも、オーナーの手が入る）
  - エージェントが機能を叩いて確かめ、オーナーには報告だけする（採らない: オーナーが自分の目で確かめる機会が消え、統合スライスを消した代わりが無くなる）
  - 聞かない（確認も記録もしない）（採らない: plan 全体が動くかを誰も見なくなり、確認したかどうかも次のサイクルから見えない）

### Scope

- 変更:
  - in: behaviour — トリアージのあと、最後に、Unit ごとに確認するかを聞く。
  - out: refactor — プランの構成は 01 が決める。ここでは動かさない。
  - out: dependency — 新しい道具を増やさない。
  - in: naming — `## Verified` を新しい節として、close.md の先頭に置く。
  - in: format — close.md に、確認の結果を残す。
  - in: prose — クローズのスキルと、タスクの文面が変わる。
- 品質:
  - out: speed — このサイクルの外。目的ではない。
  - out: security — このサイクルの外。性質は変えない。
  - in: compatibility — `collect.mjs` は close.md の `## Triage` より前を書き直すので、記録はその後ろに置く。
  - in: errors — 確認しなかったときと、確認で問題が見つかったときの扱いを書く。
- 運用:
  - out: deploy — ずっと外。Stack に Deploy がない。
  - out: migration — ずっと外。DB を持たない。
  - out: logs and monitoring — ずっと外。ログと監視を持たない。

### Research & Trial

- `close/scripts/collect.mjs` は、`## Triage` の位置から後ろをそのまま残し、それより前を作り直す（317〜322 行、369 行）。先頭を残すには、スクリプトを直す。

### Definition

- `Unit.close-skill`(kept): 確認を聞く手順が最初に増えるだけで、クロージングできるという機能は動かない。

## 03: スキルとフォーマットを読み直して見つけた不備を、このサイクルで直すか

### Context

- 01 と 02 の変更のあと、全スキルと全フォーマットを読み直した。手順で迷う所が 13 件出た。
- オーナーは、11 以外をこのサイクルで直すと決めた。
- 11 は、鎖（plan → ADR の entry → `Definition` → Unit）を確かめたうえで、`なし` が起きないと分かったので、規則から消す。

### Decision

- Status: **accepted**
- Adopted:
  - `propose` の「four things」を 5 に直す。
  - `work` の受入に、振る舞いを足さない plan ではエージェントが読む、と足す。
  - `work` のテストの片付けに、`## Test cases` が禁じるテストを足す。
  - `plan` の `## Test cases` の「2 回」を、いつ使うかに書き換える。
  - `plan` のフロントの行を、オーナーがサーバーを立てて見る形にする。
  - `design` のレビュー観点 6 に、検査の例を足す。
  - `yolo` の close の段に、`## Verified` を書かないと足す。
  - `close` の `Fixed` と `## Closing` を、commit の置き場が分かるように直す。
  - `README` の 2 枚の close の行を直す。
  - `close` の `## Verified` の `Plans` から `なし` を消す。accepted の entry は design が必ず plan に切るので、名指しされた Unit には plan が付く。
- Options:
  - 13 件とも close の残り物に回す（採らない: 手順の迷いは次の close を歩く者にも出る。直せるうちに直す）
  - 6 も直す（採らない: ハーネスはライブラリとスクリプトを含むので、5 つのコマンドは変わらない）
  - `adr` に、決め直しの道を書く（採らない: 決め直しはその場ででき、規則を置く必要が無い）
  - `plan` に、フラットな機能の `index` を書く（採らない: フラットな機能に `index` は要らない）

### Scope

- 変更:
  - in: behaviour — `work` の受入と片付け、`yolo` の close の段が変わる。
  - in: naming — `## Verified` の使われ方が文面で変わる。
  - in: format — `plan` の `## Test cases`、`close` の `Fixed` の書き方が変わる。
  - in: prose — スキルと README の文面が変わる。
  - out: refactor — 構成は動かさない（不備は文面と手順だけで、切る物が無い）。
  - out: dependency — 新しい道具を増やさない。
- 品質:
  - in: compatibility — `## Test cases` を参照する場所と、`## Verified` を参照する場所を合わせる。
  - out: speed — このサイクルの外。目的ではない。
  - out: security — このサイクルの外。性質は変えない。
  - out: errors — このサイクルの外。失敗の扱いは動かさない。
- 運用:
  - out: deploy — ずっと外。Stack に Deploy がない。
  - out: migration — ずっと外。DB を持たない。
  - out: logs and monitoring — ずっと外。ログと監視を持たない。

### Research & Trial

- なし

### Definition

- `Unit.plan-skill`(kept): 文面だけが変わり、plan を書けるという機能は動かない。
- `Unit.work-skill`(kept): 受入と片付けの文が増えるだけで、plan を片付ける機能は動かない。
- `Unit.propose-skill`(kept): 数の字が直るだけで、候補を並べる機能は動かない。
- `Unit.design-skill`(kept): レビューの観点の説明が増えるだけで、サイクルを切る機能は動かない。
- `Unit.adr-skill`(kept): 決め直しの道が増えるだけで、決めて記録する機能は動かない。
- `Unit.yolo-skill`(kept): 飛ばす物の説明が増えるだけで、確認を挟まずに歩く機能は動かない。
- `Unit.close-skill`(kept): commit の置き場が分かるようになるだけで、クロージングできる機能は動かない。
