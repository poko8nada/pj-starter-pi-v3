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
  - Why: ローカルのフックが担う
    - 自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す
    - `react`
    - `src`
    - `app`
    - `pages`
- メッシュ（`remote-pi`）をハーネスの機能にしない
  - Why: サードパーティのパッケージの仕事
    - ハーネスは設定の置き場所（`.pi/remote-pi/.gitignore`）だけを用意する
- owner の判断を、エージェントが代わりにやらない
  - Why: これらは owner のもの
    - シートの OK
    - `Verify` の合意
    - 許可が要る操作
  - 「エージェントだけ」は、owner が手を動かさないという意味
- `.env` の中身は触らない
  - Why: 問題は、子が読めてしまうことのほう
    - 中身は別
- clone の初期化（`init`）はやらない
  - Why: このサイクルは「エージェントだけで終わらせる」に絞る
- `ref-cleanup` を `consult` に統合しない
  - Why: 統合は 005 でやる
    - 004 は棚を作るところまで
- リファクタで振る舞いを変えない
  - Why: 動かすだけ
    - 差分が読めることが、この unit の検査の質を決める

Changes: update **004 でやらないことを足した（統合は 005 / 構造は整えるが振る舞いは変えない）。003 の `What to keep` に unit として並んでいた `remote-pi` は unit ではないので外した（メッシュを機能にしない、はこの節が受け持つ）**

## What to build

### 1. consult

- Change: update **フォルダがフラットすぎる。005 で `ref-cleanup` を統合する前段の整理が要る。動かすだけで振る舞いは変えない**
- Actor: agent
- Given: pi セッションが動いている
- When: agent が type を渡して子に任せる
- Then:
  - 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る
    - agent が選べるのは type だけ
  - 入力ごとに 1 体走る
    - 入力が 1 つなら 1 体
  - `code` の子のコミットは ref で返る
    - agent が取り込むかを決める
  - `input` の全文が、子のプロンプトの先頭に payload として入る
    - 子が読む文書ではない
  - `consult` の `README` の表が、実際のツールと一致する
  - 定義 1 枚のレビューが、出力上限に当たらずに終わる
  - agent が、直したいものがどのフォルダにあるか一目で分かる
    - `policy/`
    - `child/`
    - `run/`
    - `tool/`
    - README と json は直下
  - `index.ts` を開くと道具の登録だけがある
    - 進行も整形も見当たらない
  - import の向きが一方通行で、逆向きを探しても無い
    - `tool` は `run` を知っている
    - `run` は `child` を知っている
    - `child` は `policy` を知っている
  - 既存の検査が緑のまま
    - 振る舞いは変えない

### 2. close-skill

- Change: add **サイクル全体を判定する段がどの skill にも無い。unit の `check` は継ぎ目を見ない**
- Actor: agent
- Given: 全チケットが閉じている
- When: agent がサイクルを閉じる
- Then:
  - サイクル全体の統合が 1 本走り、1 枚の `Goal` と `Then` に当たる
  - 完成形が `review` の子に当たる
  - 穴が振り分けられる
    - `Goal` を壊すものはそのサイクルで直す
    - それ以外は次へ
  - `Retro` が書かれ、owner が閉じてよいと言う

### 3. work-skill

- Change: update **実装を第二の目で見るレビューが、どの skill にも枠にも無い**
- Actor: agent
- Given: チケットの `Todo` と `Verify` が合意されている
- When: agent がチケットの作業を進める
- Then:
  - 子に任せた場合、そのコミットは ref で返り、agent が取り込むかを決める
  - チケットは `Commit:` のハッシュで閉じる
  - `Notes` に `Findings` と `Unplanned` が書かれている
    - その step の中の穴は直し、外の穴は次の 1 枚に渡す
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
  - `cycles/<NNN-DATE>/definition.md` が出て、8 節がある
    - `Stack` は空でよい
    - `Remarks` は空でよい
    - `Retro` は空でよい
  - 前のサイクルの `Carry over` の全行が、この 1 枚のどこかに対応している
    - 単位
    - `Non-goal`
    - `Changes` の理由
    - 明示的な拒否
  - 承認までは、`cycles/` 以外に変更が無い
  - 本文が、次のスキルを名指ししない
  - 受けた場所が、その 1 枚から読める
    - どの `Carry over` の行が、どの unit や `Non-goal` に落ちたか
  - どこにも受けない行が残っていない

### 5. plan-skill

- Change: update **足すことが既定になっていて整理が計画に入らず、層も向きも計画に無い**
- Actor: agent
- Given: 定義が承認された
- When: agent がプランを書く
- Then:
  - `step 0` を含む `Steps` と、`Structure` が出る
  - 全 step にファイル名とテスト名が入っている
    - `step 0` と `<unit-id>.check` は なし と書く
  - 単位に無い step（後片付けなど）は、`step 0` の `Cleanup` に置かれる
  - 承認までは、プランのファイル以外に変更が無い
  - `description` に、次のスキルの名前が無い
  - ファイルを増やす step に「足した後の形」の判断があり、要るなら整理が計画に入っている
  - 層と向きが計画に書かれている
    - 誰が誰を知らないか
  - 差し替え点が書かれている
    - 何を交換しても他を触らずに済むか
  - 構造の step も、その場で走る検証を持つ
    - 形で検証する

### 6. agent-rules

- Change: update **`AGENTS.md` が、Retro 3 つ分の教訓を拾えていない。規則の一覧はチケットで合意する**
- Actor: agent
- Given: clone 直後。何も説明されていない
- When: owner が「テストが落ちてるので直して」と頼む
- Then:
  - `AGENTS.md` の規則に従う
    - コードに触る前に 1 枚を書き、承認を待つ
    - 検査を弱めない
  - サイクルの流れと、いつでも当てはまる規則だけがある
  - どの規則も skill と重複していない
    - 同じことを 2 箇所に書かない

### 7. readme

- Change: update **`ref-cleanup` と `sound-notify` が README に無い。skill も 1 つ増える**
- Actor: owner
- Given: clone 直後
- When: owner が `README.md` を開く
- Then:
  - 何が入っているか分かる
  - 最初に何をすればいいか分かる
  - 書いてあることと実物が食い違わない
    - 節の数
    - 各スキルの役割
    - 検査の数
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

- Base:
  - Node
  - TypeScript
  - pnpm
  - lefthook
  - oxlint
  - oxfmt
  - vitest
  - `@earendil-works/pi-coding-agent`
  - `typebox`
- Added: なし

Changes: update **`typebox` を Base に足した。pi のホストが peer として与えるもので、選んだものではない（無料で来たものと、選んだものを見分けられるようにする）**

## Remarks

- チケットの合意: `definition` の 1 枚は **9 節**（`## Carry over` を足す）
  - 前の `Carry over` の各行を受けた場所を 1 行ずつ
  - 06 に反映する
    - `Acceptance`
    - `Todo`
    - `Verify`
  - `AGENTS.md` は **9 条**の案で進める
    - 事故の 1 条を足して 10 条
    - 08
- **`work` 中のレビューは粒度が細かすぎた** → 「親が `git diff` を読む」に直した
  - 子レビュワーを起こさない、diff の準備も不要
  - fresh eyes は `close` のレビュワー（最初からの想定）が担う
  - 凍結した `Then`（unit の diff を `review` の子に）は記録として残し、次の 1 枚が受ける
- **`review` の子に `git diff` だけを許す道具** → 005 の候補
  - `bash` を足すのは不可
    - レビュワーが書けてしまう
    - `role` の約束は道具を止めない
  - guard と同じ `-e` の形で渡す
    - 引数は構造化、シェル無し
- 反省点は次のサイクルに生かす → 既にある
  - `Retro` の `Carry over` がそれを運ぶ
  - 004 の実装中に見つけた反省も、その場でチケットの `Findings` に書く
- **004 の事故（テスト設計）**: `run.test.ts` の fixture がフックの中で実リポジトリの config（`core.bare`、`user.*`）を書き換え、フックが落ちて子の作業が 1 本失われた
  - やり直しで足りる、と owner の判断
  - 環境を継承し、分離を外の状態（cwd 探索）に任せ、封じ込めを確かめていなかった — 3 つが揃って起きた
  - 規則「検査は、自分が使うものを自分で決める（環境を継承しない）」を `AGENTS.md` に足した → 08
  - `plan` の `Tests` に 1 文足した
  - git のテストは隔離した形に直す
    - どの unit にも入らない harness の修正なので、その事実をここに残す

## Retro

- Good:
  - 9 枚のチケットが全部 `Commit:` で閉じた
    - うち 5 枚は子、4 枚は親が関与
    - 最後の 1 枚を閉じた時点で、ref も worktree も残っていない
  - 事故（検査がフックの中で実リポジトリの config を書き換えた）を、サイクルの中で根まで直した
    - 検査が自分の git の置き場を自分で決める形にした（`git-env.ts`）
    - `AGENTS.md` に 1 条、`plan` の `Tests` に 1 文
    - フックの環境を模した実行でも、実リポジトリが汚れないことを検査が示す
  - `consult` の構造: `index.ts` は登録だけ（25 行）、`policy/` `child/` `run/` `tool/` に分かれ、辺は下向きだけ（例外 2 本は記録）
  - `close` skill が生まれ、このサイクルの閉じで実際に使って動いた
    - 単位をまたぐ通し 1 本（6 段を玩具で通した子の報告）
    - `review` の子を当てて blocking 0 件
    - 穴の振り分けをした
  - 実演の題材を小さくする教訓が効いた（82 行の 1 枚では出力上限で死に、玩具 5 行なら通る）
  - README、`AGENTS.md`、6 skill が実物と一致（6 skill、4 拡張、9 節、検査 2）
- Bad:
  - 子の作業が 1 本消えた（step 4。フックが拒否し、worktree ごと破棄）
    - やり直しで足りたが、原因は検査がフックの中で実リポジトリを書き換えたこと
  - 親（私）が黙って判断した
    - 並列にできるのに直列で流した
    - 事故対応を owner に諮らずにコミットした（`25e1a04`、`81e0743`、`38b22f9`）
    - 造語（「世界」）と折り返しコメントを書いた
  - `close` skill の初版に穴があり、実演で見つけて直した（`1e06d88`）
    - 閉じる行為自体の行き先が無い
    - 残置物と製品のデータの衝突
  - `review` の `turns` 20 では足りず、チケット段の全体レビューが報告の前に止まった（40 に上げた）
  - キャンセルしたのに、子の残した編集が ref で返った（README は「何も残らない」と書いている）
  - 半端: 004 の 1 枚には `## Carry over` が無い（凍結時は 8 節だった）。003 の持ち越しの会計は次の 1 枚が持つ
  - `review` の子は「残置物が無いか」を自分では確かめられない（`.git` が読めず、コマンドも無い）のに、確かめたと書いた
- Carry over:
  - `review` の子は `bash` を持たないので、`git diff` を子に見せるには親が外に書き出すしかない
  - その置き場所は `Verify` の後、`Commit:` の前。あいだに入れるため Step 8 以降を 1 つ繰り下げた
  - 実演（`Verify`）は親の担当で、子の側では観察しない（子は `consult` を起こさない）
  - `types.json` は「無い」のではなく git 管理外で、HEAD から作る worktree に入らない
    - 子の worktree では `types.json` が読めず、`EXTENSION_DIR` の直し方に関係なく実演が落ちる
  - チケットの `Acceptance`「findings が残っている」は「残っていない」の意（合意済みなので直さない）
  - レビューを `Verify` の後に置くと「`Commit:` は `Verify` が判定した内容」と噛み合わない。ツリーが変わったラウンドは `Verify` に戻ると本文に足した
  - 外の穴（step 9 が受けた）: README の `work` の行の要約に `the review` が無かった
  - 004 の `plan.md` とチケットは新しい規則より前に書かれている（`Depends` が `plan` を直す step を待っていない、`Structure` の隣に `Layers` も `Seam` も無い）。規則は次のプランから効く
  - プランの `Files` に、`spec.test.ts`（step 3）と `tool/render.ts` + 移すテスト 4 本（step 4）が無い。プランは凍結なのでチケットに書いた
  - プランの `Tests` と `05` の実演 ③ は辺を 3 本と書いているが、実物は 6 本（`tool` → `child`、`tool` → `policy`、`run` → `policy` が抜けている）
  - 子のコミットでフックが落ちると、ref が作られず子の作業が消える
  - チケットの `Files` に無いものを足した: `git-env.ts`（検査が git の置き場を決めるヘルパー）
    - 逆向きの辺 1 本（`child/spec.test.ts` → `../tool/consult.ts`）と同層の辺 1 本（`tool/consult.ts` → `./render.ts`）も残っている
  - `review` の `turns` 20 では足りない（9 枚の全体レビューが読むだけで尽きた）。`types.json` と `types.example.json` を 40 に揃えた
  - owner の指摘で 1 枚は 9 節に決まった。定義の `Then` は 8 節のままだが凍結なので触らない
  - 子をキャンセルしても、子の残した編集が ref で返る。`work` の失敗の一覧にもキャンセルの経路が無い
  - 実演の題材が大きいと出力上限で死ぬ（003 の 1 枚 82 行 → out 51,278 で死亡）
  - 閉じが 2 箇所にある: `definition` の Step 10 と `close` の Step 5。どちらが閉じるかは決まっていない
  - `close` の `review` の子は「残置物が無いか」を確かめられないので、この項目は親が持つ
  - 閉じの段で見つけた穴（次のサイクルが受ける）
    - `work` の `Then` は「unit の diff を `review` の子に当てる」だが、木は親が `git diff` を読む形（`Remarks` に記録済み）
    - README（マークダウン）はどの検査も通らない（`quality-gate` は lint と typecheck の 2 つ）
    - `git-env.ts` は `consult/` 直下にあり、unit の `Then` の列挙に無い 3 つ目の種類
    - 実演の題材を `/tmp` に置いても、そのターンに触ったファイルとして `quality-gate` の lint 対象になる
    - 子は作業ファイル（`.flat`、`.tokens`、`.words`）をサイクルのフォルダに残し、`consult` がそれを成果と一緒に ref にコミットした。子の残置物を ref に混ぜない道が要る
    - 003 の持ち越しのうち少なくとも 3 行（`$VAR` の fail-closed は偶然、`read` のキー名が未確認、`review` の句が 4 skill にある）が 004 のどこにも現れない
  - `/tmp` の実演の玩具（`close-toy`、`definition-toy`、`six-skills-toy`、`plan-demo-2`、`stack-demo`）は、記録が場所を指しているので閉じるときに消す
