# ハーネス付きスターター

## What

- Type: プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター
- Who:
  - owner: clone する人。プロジェクトの持ち主。検査とゲートの恩恵を受ける
  - agent: 同じリポジトリで作業する。規則に従う側

Changes: keep

## Goal

新しいプロジェクトを始めたときに、検査・commit ゲート・エージェントの規則が最初から揃っていて、自分で配線しなくてよい。エージェントが 1 枚を書き、レビューと実演を子に任せて、サイクルを回せる。

Changes: keep

## Non-goal

- CI に検査を足さない
  - Why: ローカルのフックが担う。自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す（react / src / app / pages）
- メッシュ（`remote-pi`）をハーネスの機能にしない
  - Why: サードパーティのパッケージの仕事。ハーネスは設定の置き場所（`.pi/remote-pi/.gitignore`）だけを用意する
- owner の判断を、エージェントが代わりにやらない
  - Why: シートの OK / `Verify` の合意 / 許可が要る操作は owner のもの。「エージェントだけ」は、owner が手を動かさないという意味
- `.env` の中身は触らない
  - Why: 問題は、子が読めてしまうことのほう。中身は別
- clone の初期化（`init`）はやらない
  - Why: このサイクルは「エージェントだけで終わらせる」に絞る
- `ref-cleanup` を `consult` に統合しない
  - Why: 005 でやる。004 は棚を作るところまで
- リファクタで振る舞いを変えない
  - Why: 動かすだけ。差分が読めることが、この unit の検査の質を決める

Changes: update **004 でやらないことを足した（統合は 005 / 構造は整えるが振る舞いは変えない）。003 の `What to keep` に unit として並んでいた `remote-pi` は unit ではないので外した（メッシュを機能にしない、はこの節が受け持つ）**

## What to build

### 1. consult

- Change: update **フォルダがフラットすぎる。005 で `ref-cleanup` を統合する前段の整理が要る。動かすだけで振る舞いは変えない**
- Actor: agent
- Given: pi セッションが動いている
- When: agent が type を渡して子に任せる
- Then:
  - 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）
  - 入力ごとに 1 体走る（入力が 1 つなら 1 体）
  - `code` の子のコミットは ref で返り、agent が取り込むかを決める
  - `input` の全文が、子のプロンプトの先頭に payload として入る（子が読む文書ではない）
  - `consult` の `README` の表が、実際のツールと一致する
  - 定義 1 枚のレビューが、出力上限に当たらずに終わる
  - agent が、直したいものがどのフォルダにあるか一目で分かる（`policy/` `child/` `run/` `tool/`。README と json は直下）
  - `index.ts` を開くと道具の登録だけがあり、進行も整形も見当たらない
  - import の向きが一方通行で、逆向きを探しても無い（`tool` は `run` を、`run` は `child` を、`child` は `policy` を知っている）
  - 既存の検査が緑のまま（振る舞いは変えない）

### 2. close-skill

- Change: add **サイクル全体を判定する段がどの skill にも無い。unit の `check` は継ぎ目を見ない**
- Actor: agent
- Given: 全チケットが閉じている
- When: agent がサイクルを閉じる
- Then:
  - サイクル全体の統合が 1 本走り、1 枚の `Goal` と `Then` に当たる
  - 完成形が `review` の子に当たる
  - 穴が振り分けられる（`Goal` を壊すものはそのサイクルで直し、それ以外は次へ）
  - `Retro` が書かれ、owner が閉じてよいと言う

### 3. work-skill

- Change: update **実装を第二の目で見るレビューが、どの skill にも枠にも無い**
- Actor: agent
- Given: チケットの `Todo` と `Verify` が合意されている
- When: agent がチケットの作業を進める
- Then:
  - 子に任せた場合、そのコミットは ref で返り、agent が取り込むかを決める
  - チケットは `Commit:` のハッシュで閉じる
  - `Notes` に `Findings` と `Unplanned` が書かれている（その step の中の穴は直し、外の穴は次の 1 枚に渡す）
  - 実演のあと、リポジトリに残っているのは自分で消せるものだけ
  - unit の diff が `review` の子に当たり、findings が残っている
  - 直したか、理由をつけて答えていないかが `Notes` に書かれている
  - 3 周で止まり、残りは owner に渡る

### 4. definition-skill

- Change: update **`Carry over` の各行を受けた場所が 1 枚から読めない。あわせて節が 8 つになる（`Remarks`）。観測できない 1 行（子に見せる題材）は `Then` から外し、skill の本文に任せる**
- Actor: agent
- Given: 前のサイクルが閉じている
- When: agent がサイクルを始める
- Then:
  - `cycles/<NNN-DATE>/definition.md` が出て、8 節がある（`Stack` / `Remarks` / `Retro` は空でよい）
  - 前のサイクルの `Carry over` の全行が、この 1 枚のどこかに対応している（単位 / `Non-goal` / `Changes` の理由 / 明示的な拒否）
  - 承認までは、`cycles/` 以外に変更が無い
  - 本文が、次のスキルを名指ししない
  - 受けた場所が、その 1 枚から読める（どの `Carry over` の行が、どの unit や `Non-goal` に落ちたか）
  - どこにも受けない行が残っていない

### 5. plan-skill

- Change: update **足すことが既定になっていて整理が計画に入らず、層も向きも計画に無い**
- Actor: agent
- Given: 定義が承認された
- When: agent がプランを書く
- Then:
  - `step 0` を含む `Steps` と、`Structure` が出る
  - 全 step にファイル名とテスト名が入っている（`step 0` と `<unit-id>.check` は なし と書く）
  - 単位に無い step（後片付けなど）は、`step 0` の `Cleanup` に置かれる
  - 承認までは、プランのファイル以外に変更が無い
  - `description` に、次のスキルの名前が無い
  - ファイルを増やす step に「足した後の形」の判断があり、要るなら整理が計画に入っている
  - 層と向き（誰が誰を知らないか）が計画に書かれている
  - 差し替え点（何を交換しても他を触らずに済むか）が書かれている
  - 構造の step も、その場で走る検証を持つ（形で検証する）

### 6. agent-rules

- Change: update **`AGENTS.md` が、Retro 3 つ分の教訓を拾えていない。規則の一覧はチケットで合意する**
- Actor: agent
- Given: clone 直後。何も説明されていない
- When: owner が「テストが落ちてるので直して」と頼む
- Then:
  - `AGENTS.md` の規則に従う。コードに触る前に 1 枚を書き、承認を待つ。検査を弱めない
  - サイクルの流れと、いつでも当てはまる規則だけがある
  - どの規則も skill と重複していない（同じことを 2 箇所に書かない）

### 7. readme

- Change: update **`ref-cleanup` と `sound-notify` が README に無い。skill も 1 つ増える**
- Actor: owner
- Given: clone 直後
- When: owner が `README.md` を開く
- Then:
  - 何が入っているか分かる
  - 最初に何をすればいいか分かる
  - 書いてあることと実物が食い違わない（節の数 / 各スキルの役割 / 検査の数）
  - 拡張の一覧に `ref-cleanup` と `sound-notify` がある
  - `close` の行がある

## What to keep

- `check-suite` From: 001
- `commit-gate` From: 001
- `quality-gate` From: 001
- `sound-notify` From: 001
- `ref-cleanup` From: 003
- `secret-guard` From: 003
- `input-guard` From: 003
- `stack-skill` From: 003
- `tickets-skill` From: 003

## Stack

- Base: Node / TypeScript / pnpm / lefthook / oxlint / oxfmt / vitest / `@earendil-works/pi-coding-agent` / `typebox`
- Added: なし

Changes: update **`typebox` を Base に足した。pi のホストが peer として与えるもので、選んだものではない（無料で来たものと、選んだものを見分けられるようにする）**

## Remarks

- 反省点は次のサイクルに生かす → 既にある（`Retro` の `Carry over` がそれを運ぶ。004 の実装中に見つけた反省も、その場でチケットの `Findings` に書く）

## Retro
