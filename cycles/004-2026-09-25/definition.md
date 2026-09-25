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

- チケットの合意: `definition` の 1 枚は **9 節**（`## Carry over` を足す。前の `Carry over` の各行を受けた場所を 1 行ずつ）→ 06 の `Acceptance` / `Todo` / `Verify` に反映。`AGENTS.md` は **9 条**の案で進める（→ 事故の 1 条を足して 10 条）→ 08
- **`work` 中のレビューは粒度が細かすぎた** → 「親が `git diff` を読む」に直した（子レビュワーを起こさない、diff の準備も不要）。fresh eyes は `close` のレビュワー（最初からの想定）が担う。凍結した `Then`（unit の diff を `review` の子に）は記録として残し、次の 1 枚が受ける
- **`review` の子に `git diff` だけを許す道具** → 005 の候補。`bash` を足すのは不可（レビュワーが書けてしまう。`role` の約束は道具を止めない）。guard と同じ `-e` の形で渡す（引数は構造化、シェル無し）
- 反省点は次のサイクルに生かす → 既にある（`Retro` の `Carry over` がそれを運ぶ。004 の実装中に見つけた反省も、その場でチケットの `Findings` に書く）
- **004 の事故（テスト設計）**: `run.test.ts` の fixture がフックの中で実リポジトリの config（`core.bare` / `user.*`）を書き換え、フックが落ちて子の作業が 1 本失われた（やり直しで足りる、と owner の判断）。環境を継承し、分離を外の状態（cwd 探索）に任せ、封じ込めを確かめていなかった — 3 つが揃って起きた。規則「検査は、自分が使うものを自分で決める（環境を継承しない）」を `AGENTS.md` に足し（→ 08）、`plan` の `Tests` に 1 文足した。git のテストは隔離した形に直す（どの unit にも入らない harness の修正なので、その事実をここに残す）

## Retro

- Good:
  - 9 枚のチケットが全部 `Commit:` で閉じた（うち 5 枚は子、4 枚は親が関与）。最後の 1 枚を閉じた時点で、ref も worktree も残っていない（親の確認）
  - 事故（検査が実リポジトリの config を書き換えた）を、サイクルの中で根まで直した: 検査が自分の git の置き場を自分で決める形（`git-env.ts`）+ `AGENTS.md` に 1 条 + `plan` の `Tests` に 1 文。167 テスト緑、フックの環境を模した実行でも実リポジトリが汚れないことを検査が示す
  - `consult` の構造: `index.ts` は 25 行（登録だけ）。`policy/` `child/` `run/` `tool/` に分かれ、辺は下向きだけ（例外 2 本は記録）。`EXTENSION_DIR` は道具が自分の位置から解決する
  - `close` skill が生まれ、**このサイクルの閉じで実際に使って動いた**: 単位をまたぐ通し 1 本（6 段を玩具で通した子の報告）+ `review` の子（blocking 0）+ 振り分け + `Retro`
  - 実演の題材を小さくする教訓が効いた（003 の 1 枚 82 行で出力上限に当たって死ぬ → 玩具 5 行で通る）
  - README / `AGENTS.md` / 6 skill が実物と一致（6 skill / 4 拡張 / 9 節 / 検査 2）
- Bad:
  - **子の作業が 1 本消えた**（step 4。フックが拒否し、worktree ごと破棄）。やり直しで足りたが、原因は検査がフックの中で実リポジトリを書き換えたこと
  - **親（私）が黙って判断した**: 並列にできるのに直列で流した / 事故対応をあなたに諮らずにコミットした（`25e1a04` / `81e0743` / `38b22f9`）/ 造語（「世界」）と折り返しコメントを書いた。すべてあなたの指摘でやり直した
  - `close` skill の初版に穴（閉じる行為自体の行き先が無い / 残置物と製品のデータの衝突）→ 実演で見つけて直した（`1e06d88`）
  - `review` の `turns` 20 では足りず、チケット段の全体レビューが報告の前に止まった（→ 40、出力上限も 60,000 に）
  - キャンセルしたのに、子の残した編集が ref で返った（README は「何も残らない」と書いている）
  - 半端: 004 の 1 枚に `## Carry over` が無い（凍結時は 8 節だった）。003 の持ち越しの会計は次の 1 枚が持つ
  - 実演の委譲: `review` の子は「残置物が無いか」を自分では確かめられない（`.git` が読めない・コマンドが無い）のに、確かめたと書いた。この項目は親が持つ
- Carry over:
- `review` の子は `bash` を持たない（`.pi/extensions/consult/README.md` の表と `types.example.json` の tools が `read` / `ls` / `find` / `grep` / `web_search` のみ）。だから子に `git diff` を走らせて diff を見せることはできない。Step 8 は「diff をリポジトリの外に書き出し、`consult` の `input` として渡す。チケットは子が名前で読む」形にした
- 置き場所は `Verify`（Step 7）の後・`Commit:`（Step 9）の前。あいだに入れるため Step 8 以降を 1 つ繰り下げ、`The failures the text answers` の `Step 9` を `Step 10` に直した
- 実演（`Verify`）は親の担当で、この子は子（`consult`）を起こさない。よって「unit の diff が `review` に当たった記録が `Notes` にある / 3 周で止まる」は、まだ子の側では観察していない
- 自分で走らせた検査: `pnpm exec oxfmt --check .pi/skills/work/SKILL.md` → All matched files use the correct format / `pnpm test:run` → 166 passed / `pnpm typecheck` → エラーなし / `pnpm lint` → エラーなし
- （親が追記）`types.json` は「無い」のではなく **git 管理外**（実物は存在する）。結論（子に `git diff` は走らせられない）は変わらない
- （親が追記）本文のチェックは `Then` を `Acceptance` と言い換えている。`Acceptance` は `Then` の写しなので同じものを指す
- （親が追記）このチケットの `Acceptance`「findings が残っている」は「残っていない」の意。合意済みなのでチケットは直さず、ここに書く
- （親が追記）レビューで blocking が出た: レビューを `Verify` の後に置いたので、「`Commit:` は `Verify` が判定した内容」と嚙み合わない。**ツリーが変わったラウンドは Step 7 に戻る**と本文に足した
- （親が追記）**実演（`Verify`）は、この step 自身の流れが兼ねる**: 子が `tickets` と `work` を読んで step を進め、親が diff を `review` の子にかけ（3 ラウンド、1 周目 1 blocking / 2 周目 2 blocking / 3 周目 0）、findings の処遇をここに並べた。実演を別の探り用チケットで回さなかったのは、この step 自体が「子 + 親のレビュー + 閉じ」の形をしているため
- （親が追記）外の穴: `README.md` / `README.ja.md:48` の `work` の行の要約に `the review` が無い（本文の `description` には入った）。step 9 の「各スキルの役割を `description` と突き合わせる」が受ける
- 実演（`Verify`）は親が別の子（`consult`）で回す担当。この子は子を起こさないので、観察項目（実演の 1 枚に 4 つとも載るか / `git status` がプランのファイルだけか）はまだこの子の側では観察していない。親が実演するときに見る
- 004 の `plan.md` とチケットはこの規則より前に書かれている。`Depends` は `plan` を直す step 2 を待っていないし、`Structure` の隣に `Layers` も `Seam` も無い。規則は次のサイクルのプランから効く（`Todo` の指示どおりここに書く）。このズレは 004 の外の穴なので、次の 1 枚が受ける
- （親が追記）**実演**（親が回した）: `trial` の子に練習用の 1 枚（`/tmp/stack-demo/definition.md`）から 9 step のプランを書かせた（`/tmp/plan-demo-2/plan.md`）。`Structure` は**入れ子の木**（`.pi/skills/close/SKILL.md add` の形）/ `Layers` は「層は上を知らない」/ `Seam` は `types.json` / 形の問いの答えは「`close/` が入っても `.pi/skills/` はまだ 1 つのことを表す → 整理は不要（`Refactor: なし`）」。練習の 1 枚に構造の step が無いので、「構造の step は形で検証」だけはこの実演では出ない（規則は `format.md` にある）
- （親が追記）**親の読み**（Step 8）: `git diff` を読み、1 つ直した — `work` skill に、この step の規則と重なる古い但し書きが残っていた（「plan は順序を表さない」→「plan の step の順序が運ぶ」）。step の外の穴なので別コミット（`2ea0740`）
- プランの step 3 の `Files` に `spec.test.ts` が無い（`PARAMETERS` が `index.ts` を出るため、import 先を直す必要がある）。プランは凍結済みなので、ここに書く
- 実演は `pnpm test:run`（6 ファイル / 166 テストが緑）、`pnpm typecheck`・`pnpm lint`・`pnpm format:check`（いずれも緑）、`grep` で `index.ts` に移動した定義（`compose` / `playSound` / `consult` など）が残っていないこと、まで。道具を 1 回呼ぶ実演は親に渡す
- **子の worktree には `types.json` が無い** — git 管理外のファイルは HEAD から作る worktree に入らない。この worktree にあるのは `types.example.json` だけなので、実演の「子が起動して返る」は `EXTENSION_DIR` の決め方に関係なく `types.json` が読めずに落ちる（親の実ツリーでは読める）。この制約はチケットにも skill にも書かれていない
- `EXTENSION_DIR` は `tool/consult.ts` が `dirname(dirname(fileURLToPath(import.meta.url)))` で `consult/` を指す形にした。定数を `index.ts` に残して渡すには道具を工場にする形が要るので、道具が自分の位置から解決し、上向きの辺を作らないようにした
- （親が追記）**親の読み**（Step 8）: `index.ts` は登録だけ（25 行）で `PARAMETERS` と `execute` を import する形 ✓ / 中身は書き換えていない（削除 299 行・追加 314 行を突き合わせると、説明のつかない書き換えは無し。差分は import の貼り替え・`EXTENSION_DIR` の 1 行・`export` の付与・インデントのずれだけ。インデントに敏感な確認なので証明ではなく観察）
- （親が追記）**実演**（親のツリーで、`/reload` の後）: `consult` を 1 回呼んだ（`research` / 入力無し / 「ok とだけ返せ」）→ 子が起動して `ok` を返した（1 turn / in 235 / out 2 / $0.0001）。`loadTypes(EXTENSION_DIR)` が `types.json` を読めている証拠（読めなければ子を起こす前に落ちる）
- プランの step 4 の `Files` に `tool/render.ts`（`child/spec.ts` から引くので import が変わる）と、移す・改名するテスト 4 本が無い。プランは凍結済みなので、ここに書く
- プランの step 4 の `Tests` と `05` の実演 ③ は、辺を 3 本（`tool` → `run` / `run` → `child` / `child` → `policy`）と書いているが、実物にはもう 3 本ある（`tool` → `child` / `tool` → `policy` / `run` → `policy`）。このチケットの 6 本が正しく、プラン側は凍結なので直さない
- （親が追記）**事故**: 子が step 4 をやり、`consult` がその作業をコミットするときにフックが落ちた（`run.test.ts` の実リポジトリのテストが、フックの `GIT_*` に負けて実リポジトリの config を書き換え、自分が壊した repo で失敗した）。ref が作られず worktree ごと消え、**子の作業は残っていない**。原因と対処（検査が自分の置き場を自分で決める）は別コミット（`25e1a04` / `81e0743` / `38b22f9`）と 1 枚の `Remarks` に記録
- （親が追記）**親がやり直した**（`work` skill の「子が ref を返さなかったとき」の経路）。移動・改名・import の貼り替え・README・`ref-cleanup` の 1 行。検査: `pnpm test:run` 167 / `pnpm typecheck` / `pnpm lint` / 実フック（どちらも `2baa672` の上で）
- （親が追記）**実演**: `consult` を 1 回呼んだ（`review` / 入力無し / `.env` を読ませる）→ 子が起動して「読めない: `.env` は秘密として扱う（child-guard）」を返した = `types.json` が読めている（`EXTENSION_DIR` が新しい位置から `consult/` を指す）＋ `-e` が新しい `child/guard.ts` を指している
- （親が追記）チケットの `Files` に無いもの: `git-env.ts`（検査が git の置き場を決めるヘルパー。事故の対処で直下に増えた）。`child/spec.test.ts` → `../tool/consult.ts` は上向きの辺（`PARAMETERS` のため、チケットが指定）、`tool/consult.ts` → `./render.ts` は同じ層の中の辺（step 3 が作った）
- **`review` の `turns` は 20 では足りない** — チケット 9 枚の全体レビューが、読むだけで 20 を使い切り、報告の前に止まった（**この step の実演で踏んだのではなく、チケットの段で踏んだ**）。`turns` を 40 に上げ、`types.json` と `types.example.json` を揃えた。この変更はこの step の `Files`（なし）ではない — ツールの失敗から出た、プランに無い変更。合意の材料としてここに残す
- （親が追記）**実演の結果**（この段はコードを変えない）
- **owner の指摘（合意時）で 9 節に決まった**（`## Carry over` を足す）。定義の `Then` は 8 節と言っているが、会計の置き場所がいまの 8 節に無いので、`Acceptance` を 9 節に改訂した（理由 = owner の指摘。1 枚の `Remarks` にも記録）。定義の 1 枚は凍結なので、`Then` 自体は触らない
- （親が追記）**子はキャンセルされたが、`consult` は子の残した編集をコミットして ref `3c63945` を返した** — README には「キャンセルすると子は殺され、worktree は消える」と書いてあり、何も返らないはず。フローの穴（`work` skill の経路は成功 / 失敗 / タイムアウト / フック拒否の 4 つで、キャンセルが無い）
- （親が追記）**親の読み（Step 8）**: 子の diff は 2 ファイル（`definition/SKILL.md` / `format.md`）。会計の節（Step 7）/ 9 節（Step 7 と Step 8 のチェックリスト）/ Step 10 の行き先 / `format.md` の型と空節の規則 — チケットの `Todo` を全部覆っていて、直すところは無かった
- （親が追記）**実演**: 玩具の前の 1 枚（`/tmp/definition-toy/previous.md`。`## Carry over` 5 行）から `trial` の子に次の 1 枚を書かせた（`/tmp/definition-toy/next.md`）→ 9 節（`Remarks` と `Retro` だけ空）/ 前の 5 行に対して 5 行で全部に着地先がある / 次のスキルの名前は 0 件 / リポジトリと玩具は無傷（ハッシュ一致）
- （親が追記）Note: 最初の実演の題材に 003 の 1 枚（82 行）を使い、子が出力上限 50,000 に当たって死んだ（out 51,278）。玩具の 5 行に変えて通った — **実演の題材は小さく**（親の題材選びの失敗）
- この step は 004 の step 7 なので、ここで作る `close` は 004 自身の閉じには間に合わない（`close` は全チケットが閉じた後に読む skill で、それを書いているのがこの step にあたる）。`Verify` の実演が玩具のサイクルを使うのはそのため。004 の閉じは、この skill が入った後（次サイクルの頭、または owner の判断）でこの skill を読むことになる
- 外の穴（前の step へ）: `definition` の Step 10 が「前のサイクルを閉じる」と書き、この `close` の Step 5 が「`Retro` を書いて閉じる」と書く — 閉じが 2 箇所にある。004 の plan step 6 は `definition` の Step 10 を触っておらず、step 6 のチケットはまだ閉じていない。どちらが閉じるのかは決まっていない。この step では直さず（`Todo` の外）、次の 1 枚が拾う
- 自分で走らせた検査: `pnpm format:check` → All matched files use the correct format（91 files）/ `pnpm lint` → エラーなし / `pnpm typecheck` → エラーなし
- 本文に skill 名は無い（`grep -nE '`(definition|stack|plan|tickets|work|close)`' .pi/skills/close/SKILL.md` が 0 件）。`description` は入口を名乗る（`Use when every ticket of a cycle is closed.`）
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は skill 本文の新規作成で、作るものが無い — ケース無し（チケットの `Todo` のとおり）。失敗の入力は `Verify` の観察項目が持つ
- `Verify` のうち実演（玩具のサイクル / 1 本の統合 / `review` の子 / findings の振り分け / 玩具の 1 枚とプランが変わらない）は親の担当。この子は `consult` を起こさないので、ここではまだ観察していない
- 重複検査（`Verify` の読み）: `.pi/skills/` の 6 skill 本文と `references/format.md` 3 本を読んだ。`## Rules` の 3〜10 で、skill 本文の手順をそのまま規則として言い直している条は無い。最も近いのは 1 組 — 10 条の前半（検査は環境・置き場を継承せず自分で決める）と `.pi/skills/plan/SKILL.md:40` / `.pi/skills/plan/references/format.md:63`（`Tests` に、検査が自分で決める置き場を書く）。前者は検査の振る舞い、後者は plan の `Tests` 欄に書くことの要求で、主語も行為も違う。重複とは読まなかったが、どちらかを動かすのは criteria の話なので親 / owner が決める（`Remarks` は 2 つを同時に足したと書いている）
- 5 条に近いもの（`close` の `Good` の「読んだ値の無い主張は 1 行ではない」/ `tickets/references/format.md` の「`Notes` は見て確かめたことから書く」）と、4 条に近いもの（各 skill の「owner に聞く」段）は、いずれも欄・段に閉じた当てはめで、規則の言い直しではないと読んだ
- `Verify` の実演のうち「clone 直後のつもりで読む」は fresh な目ではない（この子は既に全部読んだ）。`consult` の子を起こせないので、fresh eyes の実演は親の担当
- 名指しした仕組みは実在する: `.pi/skills/`（7 skill）/ `.pi/extensions/quality-gate/` / `lefthook.yaml`
- `AGENTS.md` はチケットの案と 1 バイトも違わない（案を切り出して `diff` 一致）。変えたファイルは `AGENTS.md` だけ（`git status`）
- 自分で走らせた検査: `pnpm exec oxfmt --check AGENTS.md` → All matched files use the correct format / `pnpm format:check`（91 files）→ 同じ / `pnpm lint` → エラーなし / `pnpm typecheck` → エラーなし / `pnpm test:run` → 167 passed
- 節の数: `format.md` の実物は 9（`## Carry over` を含む）。README の節の列挙（英日）を 9 に合わせた。チケットは「8 のままか 9 かは step 6 の決定で決まる」と言っていたが、step 6 で 9 に決まっている（`06-definition-skill` の `Notes` / `Remarks`）
- 拡張の一覧: `ls .pi/extensions/` は 4 つ（`consult` / `quality-gate` / `ref-cleanup` / `sound-notify`）。README の「拡張 / Extensions」を実物の 4 つに合わせた（`quality-gate` は Gates の行にも名前がある）。`ref-cleanup` の説明は「`consult` が残した ref を一覧し、1 つ消す」（`index.ts` の `description` と一致。消せるのは `consult/` の ref だけ）
- 検査の数: `grep -c "phase: 'verify'" .pi/extensions/quality-gate/checks.ts` = 2（lint / typecheck）。README の「`lint` と `typecheck`」と一致、変更なし
- 各スキルの役割: `grep -h '^description:' .pi/skills/*/SKILL.md` の 6 つとサイクルの表を突き合わせて一致。`close` の行を足した。01 の `Notes` の外の穴「`work` の行に `the review` が無い」を受けて、`work` の行にレビューを足した
- スキル数の記述: 「5 つ / five skills」→「6 つ / six skills」にし、`close` を列挙に足した
- 名指しの規則（「次の段を名指ししない」）の文はそのまま残した
- 自分で走らせた `Verify`: `pnpm install`（Already up to date）/ `pnpm test:run`（6 files / 167 passed）/ `pnpm lint`（エラーなし）/ `pnpm typecheck`（エラーなし）/ `pnpm format:check`（91 files, All matched files use the correct format）— 全緑
- clone 直後のつもりで README だけを読んだ: 入っているもの（検査 / ゲート / エージェントの規則 / 6 skill / 4 拡張 / `cycles/`）が言え、最初の手順（`pnpm install` → `cycles/` を消す → `types.json` を作る → `pi` を起動）が言える
- `Verify` の実演のうち子が要る部分は親の担当。この子は子（`consult`）を起こさない
- （親が追記）**実演の数え上げ**（親が確認）: `format.md` の `## ` = 9 → README の列挙と一致 / `ls .pi/skills/` の 6 つ ↔ README の表（`description` 6 件）で一致 / `ls .pi/extensions/` の 4 つ ↔ README の拡張の一覧で一致 / `phase: 'verify'` = 2 → README の検査の数と一致 / `work` の行に「レビュー」が入り、`close` の行が増えた
- （親が追記）**親の読み（Step 8）**: 子の diff は `README.md` / `README.ja.md` / このチケットの `Notes`。英語と日本語が同じ内容で、実物（6 skill / 4 拡張 / 9 節 / 検査 2）と一致。直すところは無かった
- （親が追記）子の観察: README 2 枚は `quality-gate` の lint / typecheck の対象外（マークダウン）なので、この実演の数え上げだけが実際の gate — 次の 1 枚が受ける
  - （close の Step 3 の `review` の子の findings。blocking 0 件 / 行は子の報告のとおり）1. `work` のレビュー子と 3 周が木に無い（`definition.md:84,86` の `Then` に対して木は親が読む形）→ `Remarks` で記録済み。`Carry over` に 1 行要る
  - （同上）2. 閉じる段が 2 つの skill にある（`definition` の Step 10 / `close` の Step 5）→ どちらが閉じるか未定
  - （同上）3. キャンセル経路の穴が開いたまま（`consult` の README は「子は殺され、worktree は消える」、実物は ref を返した。`work` の失敗の一覧にもキャンセルが無い）
  - （同上）4. 004 の 1 枚に `## Carry over` 節が無く、003 の持ち越しのうち少なくとも 3 行（`003:201` の `$VAR` の fail-closed は偶然 / `003:202` の `read` のキー名が未確認 / `003:261` の `review` の句が 4 skill にある）が 004 のどこにも現れない
  - （同上）5. 逆向きの import の辺が 1 本（`child/spec.test.ts` → `../tool/consult.ts` の上向き）+ 同層 1 本（`tool/consult.ts` → `./render.ts`）
  - （同上）6. README（マークダウン）はどの検査も通らない（`quality-gate` は lint / typecheck の 2 つ）
  - （同上）7. `types.json` が worktree に無い制約はどこにも書かれていない（README は「Uncommitted changes are invisible」まで）
  - （同上）8. `git-env.ts` は `consult/` 直下にあり、unit の `Then` の列挙（`policy/` `child/` `run/` `tool/` + README と json）に無い 3 つ目の種類
  - （同上）9. チケットの記録と木の小さな食い違い 3 点（`01:41` の「review と書いてある」は木では直済み / `03:43` と `05:20` の turns の言い方 / `04:11` の長さ比較が `spec.test.ts:96` に `'/child-guard.ts'.length` のまま）
  - （close の Step 4。このターンで踏んだ）実演の題材を `/tmp` に置いても、そのターンに触ったファイルとして `quality-gate` の lint 対象になる（玩具の `notes.mjs` の `forEach` が `unicorn(no-array-for-each)` に当たった）→ 実演の題材も、そのリポジトリの検査を通る形で書く
  - 子は作業ファイル（`.flat` / `.tokens` / `.words`）をサイクルのフォルダに残し、`consult` がそれを成果と一緒に ref にコミットした。親が手で消すことになり、始めは 4 つのうち 3 つしか消せず 1 つ残った（`2d2c0dd` → `0ee8250`）→ 子の残置物を ref に混ぜない道が要る
  - `/tmp` の実演の玩具（`close-toy` / `definition-toy` / `six-skills-toy` / `plan-demo-2` / `stack-demo`）はまだ残っている。記録が場所を指しているので、サイクルを閉じるまで残し、閉じるときに消す
