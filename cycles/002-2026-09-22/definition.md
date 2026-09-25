# ハーネス付きスターター

## What

- Type: プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター
- Who:
  - owner: clone する人。プロジェクトの持ち主。検査とゲートの恩恵を受ける
  - agent: 同じリポジトリで作業する。規則に従う側

Changes: keep

## Goal

新しいプロジェクトを始めたときに、検査・commit ゲート・エージェントの規則が最初から揃っていて、
自分で配線しなくてよい。エージェントが 1 枚を書き、レビューと実演を子に任せて、サイクルを回せる。

Changes: update **エージェントがサイクルを回せることを加えた**

## Non-goal

- CI に検査を足さない
  - Why: ローカルのフックが担う。自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す（react / src / app / pages）
- メッシュ（`remote-pi`）をハーネスの機能にしない
  - Why: サードパーティのパッケージの仕事。ハーネスは設定の置き場所（`.pi/remote-pi/.gitignore`）だけを用意する

Changes: keep

## What to build

### 1. consult

- Change: update **type で policy を持つ形に変える（上書き不可）。成果物は ref で返す。実演とスキルから使う**
- Actor: agent
- Given: pi セッションが動いている
- When: agent が type を渡して子に任せる
- Then:
  - 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）
  - 入力ごとに 1 体走る（入力が 1 つなら 1 体）
  - `code` の子のコミットは ref で返り、agent が取り込むかを決める

### 2. definition-skill

- Change: add
- Actor: agent
- Given: 前のサイクルが閉じている
- When: agent がサイクルを始める
- Then:
  - 1 枚の定義が出る（型どおり）
  - 前のサイクルを閉じて、印を引き継ぐ
  - 承認を待つ（承認前にコードに触らない）

### 3. stack-skill

- Change: add
- Actor: agent
- Given: 定義の他の節が埋まっている
- When: agent がスタックを決める
- Then:
  - `Stack` が埋まる（与えられたハーネスが土台、足した分だけが書かれる）
  - 足した理由が残る（差分で読める）

### 4. plan-skill

- Change: add
- Actor: agent
- Given: 定義が承認された
- When: agent がプランを書く
- Then:
  - `step 0` を含む `Steps` と、`Structure` が出る
  - 全 step にファイル名とテスト名が入っている
  - 承認を待つ

### 5. tickets-skill

- Change: add
- Actor: agent
- Given: プランが承認された
- When: agent がチケットを切って作業する
- Then:
  - チケットが出て、`Todo` と `Verify` の承認を取る（承認前に手を動かさない）
  - 作業した結果が `Notes` に残る
  - `Commit` のハッシュで閉じる

### 6. readme

- Change: add
- Actor: owner
- Given: clone 直後
- When: owner が `README.md` を開く
- Then:
  - 何が入っているか分かる
  - 最初に何をすればいいか分かる

## What to keep

- `agent-rules` From: 001
- `sound-notify` From: 001

## Stack

- Runtime: Node 24 / TypeScript 6
- Package manager: pnpm 12
- Checks: oxlint / oxfmt / tsc / vitest
- Hooks: lefthook（pre-commit / pre-push）
- Agent: pi 拡張（quality-gate / consult）

Changes: keep

## Retro

- Good:
  - サイクルが最後まで回った
    - 12 枚のチケットが全部ハッシュで閉じた
    - 6 つの単位が届いた
  - 子のレビューが実物を直した
    - `001` と「最初の 1 枚」の混同
    - `12` の `Verify` が満たせない
    - プランの `pnpm check` が存在しない
    - `review` 型の上限が足りない
  - ゲートが実バグを拾った
    - フックの中では `GIT_*` が環境に載っており、git が cwd のリポジトリではなくフックのリポジトリを見ていた
    - 素の実行では再現しない
  - grilling で 1 枚が良くなった
    - `Goal` が「振り返りが主」に定まった
  - 凍結の規律が効いた
    - 変更はすべてチケットの「実装前の窓」で、理由付きで記録された
- Bad:
  - **同じ形の失敗を 3 回繰り返した**: 「消せないものを作る」
    - ref を残した
    - 共有ストアに触って、事後に掃除の 1 行を渡した
    - 守られない約束を書いた
    - 毎回 owner に止められた
  - **目の前の実例から製品の範囲を決めた**
    - ローカルの道具ばかり → web の観点は要らない、と提案
    - owner の指摘で、入る前に止まった
  - 実演が 2 回汚染された
    - 答えがリポジトリにあった
      - `plan.md`
      - `12-cleanup.md`
  - 折り返しを直すスクリプトが frontmatter を 2 回壊した
  - まだ必要か決まっていないうちに、消える文書に規則を書き足した
    - README に移しては外し、を繰り返した
- Carry over:
  - `01-consult.types`: 実演の結果
    - 経路は実物のコードで通った
      - 設定
      - type の解決
      - 引数の組み立て
      - 子の起動
    - 診断のモデルは候補 1 番目（`commandcode/deepseek/deepseek-v4.1-flash`）
    - 子は `bash` を使えないと報告した
  - `01-consult.types`: 道具 `consult` としての呼び出しは、この走っているセッションが古いスキーマを読み込んでいて実行できなかった
    - 拡張は起動時に読まれる
    - 子の pi は新しいスキーマを読むので、そこからなら呼べる
  - `01-consult.types`: `README.md` は step 5 の `consult.readme` で書き直す
    - それまで古いインターフェースの記述が残る
      - `role`
      - `tools`
      - `worktree`
  - `02-consult.models`: 実演の結果
    - 候補 1 番目に存在しない ID を置くと、pi は `Warning: Model "…" not found for provider "…". Using custom model id.` を出して **exit 0** で終わり、assistant の `message_end` は作られる
    - 生成は 0、`errorFrom` は `404 status code (no body)`
    - 「assistant の有無」では乗り換えを判定できない
  - `02-consult.models`: 判定を「生成（output トークン）が 1 以上」に変えたら乗り換えが起きた
    - 実演が通った
    - 診断のモデルが候補 2 番目（`commandcode/meta/muse-spark-1.3-contributor`）になり、答えも返った
  - `02-consult.models`: 生成 0 は、起動できずに死んだ場合（イベント無し）と同じ条件で拾える
    - 失敗の形が 2 つあっても規則は 1 つで済む
  - `03-consult.inputs`: 実演の結果
    - 入力 2 つで結果が 2 件、入力ごとに並び、答えも取り違えていない（`2` と `東京です。`）
    - 経過 3.0 秒で、2 体が並列に走ったことが分かる
  - `03-consult.inputs`: 子は並列に走らせた（`Promise.allSettled`）
    - 入力が増えても待ち時間は伸びず、代わりに同時に費用が載る
    - 順番は結果の並びで保つ
  - `03-consult.inputs`: 道具としての呼び出しは、この走っているセッションが古いスキーマなので実演できていない
    - 整形は `## input:` の見出しを含む
    - 経路は実物のコードで通した
      - 読み込み
      - 入力ごとの実行
      - 入力ごとの結果
  - `04-consult.code`: 実演の結果
    - 子は `consult-demo-note.md` を作った
    - `{"kind":"committed","ref":"consult/demo"}` が返った
    - worktree は消えた
    - 親のツリーは汚れていない
    - `git branch` に `consult/demo` が残った（`bfd00f8`）
  - `04-consult.code`: **コミットのフックで落ちた**
    - `createWorktree` が `.git/index: index file open failed: Not a directory` で失敗
    - lefthook が `GIT_INDEX_FILE` などの変数を環境に載せており、それを git にそのまま渡していたので、`cwd` の一時リポジトリではなくフックのリポジトリを見ていた
    - 素の実行では再現しない（環境の差）
    - ローカルのテストが緑でも、フックの中では落ち得る
  - `04-consult.code`: フックが実際に走ることは、この実演では確かめられない
    - lefthook は非コードのファイルを飛ばすので、markdown 1 つの変更では検査が動かない
    - `.ts` を触らせれば動くが、子が落とす可能性もある
      - その場合は ref ができない = 決めたとおり
  - `04-consult.code`: 親の取り込みは実装していない（チケットどおり）
    - ref を cherry-pick するか、一部を取るか、捨てるかは親の判断
    - 必要になったら次の 1 枚
  - `05-consult.readme`: 実演の結果
    - `research` を 2 入力で走らせ、両方とも診断のモデルが 1 番目の候補（`commandcode/deepseek/deepseek-v4.1-flash`）
    - 結果は入力ごとに並んだ
  - `05-consult.readme`: 入力の 1 つ目に `README.md` を渡したら、子は「ファイルが指定されていない」と答えた
    - payload ではなく、リポジトリを自分で探し始めた
    - `README.md` は 0 バイトの追跡ファイルなので、空の payload が渡っていた
  - `05-consult.readme`: `readPayload` は読めない入力を例外にしている（001 で「無言で空の子を走らせない」と決めた）のに、空ファイルは素通りする
    - 同じ「文脈なしの答えが返る」形なので、次に拾う
  - `06-consult.check`: 実演の結果
    - 2 入力で 2 体が走り、結果が入力ごとに並ぶ
    - `code` は worktree で走り、コミットして ref を返した（`consult/code-20260923-161043-0` ほか計 3 本）
    - main のツリーは汚れていない
    - worktree を消しても ref は残る
  - `06-consult.check`: **`Then` 1 が満たせない**
    - モデルは道具の `details` にしか無い
    - **`details` は agent に渡らない**
      - 新しい pi が「見ているのは `content` だけ」と報告し、`details` の中身を知る経路が無かった
    - つまり呼び出し側は「どのモデルで走ったか」「乗り換えたか」を知れない
  - `06-consult.check`: **`input` は子が読む文書ではなく、プロンプトに連結されるテキスト**
    - 子の返答が payload と task を連結した 1 文を引用していた（payload が前、task が後ろ）
    - だから payload が指示として読まれる
      - 「検査は oxlint…」と書いた `a.md` を、子は作業指示と読んでリポジトリの設定ファイルを要約した
    - 空ファイルなら何も足されない（前のチケットの `Findings` と同じ穴）
  - `06-consult.check`: ref は残り続ける
    - 取り込むか捨てるかは親が決める（いまは 3 本残っている）
    - 掃除の仕組みは無い
  - `06-consult.check`: **修正後: `Then` 3 つとも 1 回の実演で観測できた**
    - `content` の最後に `[consult]` の 1 行を足したのでモデルが見える（`commandcode/deepseek/deepseek-v4.1-flash` = 候補 1 番目）
    - セッションを `/reload` して、このセッションから道具を直接呼んだ
      - 2 入力で 2 体が走り、2 本の ref が返った
    - main は汚れず、worktree も残らなかった（ref は計 5 本）
  - `06-consult.check`: 設計にも反映した（`8a3c8f4`）
    - ref は決めたらその場で消す
    - 破壊的な操作はガード付きの道具側に持たせる（次のサイクルで作る）
    - 次の 1 枚を書くときは前のチケットの `Findings` を読む
  - `07-definition-skill`: 実演（a）の結果
    - 子は `.pi/skills/definition/` だけを読んで 1 枚を書いた
    - 7 節が出た
    - 印は `update` の理由が太字
    - 単位は `memo-entry` / `memo-list`
    - `Then` は観測できる形（`exit 0`）
    - `Stack` は空のまま
    - 実行できない段を全部報告した
      - `consult` が無い
      - 対話できない
      - 前のサイクルが未クローズ
    - `001` と「最初の 1 枚」の混同を指摘した（スキル側で修正済み）
  - `07-definition-skill`: 実演（b）の結果
    - 成立
    - 1 問ずつ・推奨案つき・節の順で実際に回せた
      - `What`
      - `Goal`
      - `Non-goal`
      - 数え上げ
    - 訂正は 2 回
      - `Goal` で「振り返りが主」
      - 「ちゃんと」の解釈の確認
    - 質問は 5 問で、仮のお題が小さかったのが理由
  - `08-stack-skill`: 実演（a）の結果
    - 読み取り専用の子 `review` が、スキルとリポジトリだけから `Stack` を書いた
      - worktree も ref も作らない
    - `Base` はファイルと行番号つき
      - `package.json:4`
      - `tsconfig.json:7-14`
      - `lefthook.yaml:1-32`
    - `Added: なし`
      - 保存は `node:fs`
      - 入力は `node:util` の `parseArgs` と `node:readline`
      - 配布は `noEmit`
    - 印について質問を 1 つ返してきた
  - `08-stack-skill`: 実演（b）の結果
    - `trial` の子が `picocolors` を追加して実行し、元に戻せた
    - **リポジトリには何も残らなかった**
      - ref もできなかった
    - 共有ストアに 1 つ分が残った
  - `08-stack-skill`: 子が見つけた欠陥
    - 最初の 1 枚の印は `add`（定義側の規則）なのに、スキルは `keep` と `update` しか出していなかった
    - 直した
  - `08-stack-skill`: 子の観察
    - 002 の `Node 24` と `pnpm 12` はコードからは読めない
    - `Base` は名前だけ、の規則に合う
  - `09-plan-skill`: 実演の結果
    - 子 `research` が、定義 1 枚とスキルからプランを書いた
      - worktree も ref も作らない
    - `step 0` の 3 欄が出た
    - 各単位が step になった
      - consult は 5 分割 + `consult.check`
    - `What` `Depends` `Action` `Files` `Tests` が全部埋まった
    - `Structure` と `What to keep` が出た
    - 本物の `plan.md` とほぼ一致した
  - `09-plan-skill`: 子の指摘
    - `step 12` は定義の単位に無い
      - `CYCLE-DESIGN.md` を消す
    - `step 0` の `Cleanup` で扱っても同じ
    - この step をどう扱うかは決まっていない
      - 実装時にチケットで決める
  - `09-plan-skill`: **最初の試行は `review` 型で失敗した**
    - 出力上限 20k に当たり（22,489 トークン）打ち切られ、テキストが 1 つも返らなかった
    - `review` は判定用で、長い成果物を書かせるには足りない
    - **型の上限とタスクの大きさを、実演の前に見る**
  - `09-plan-skill`: **この実演は汚染されている**
    - リポジトリに本物の `plan.md` があったので、子が写した可能性がある（本人は言及していない）
    - 次は存在しない題材で試す
  - `10-tickets-skill`: **実演の結果**
    - 読み取り専用の子 `research` が、プランの step 12 のチケットを書いた
      - worktree も ref も作らない
    - `Todo` は成果物の構造で分かれ、9 観点を全部たどって「ケースか当てはまらない理由」を書いた
      - 例: 「boundary: 未割当 0 件が境目。max は節の数で 12」
  - `10-tickets-skill`: **子が 2 つの誤りを直してきた**
    - `12-cleanup` の `Verify` の「`grep -r CYCLE-DESIGN` が何も返さない」は満たせない
      - このチケット自身と `cycles/` の記録が必ず一致する
      - 「`cycles/` 配下だけ」に直した
    - プランの step 12 の `pnpm check` は存在しない
      - `package.json` にあるのは `test:run` と `lint` と `typecheck`
  - `10-tickets-skill`: **この実演も汚染されている**
    - 子が既存の `12-cleanup.md` を読んだ
    - 今回は既存より良い案を出した（置き換え前提として扱った）
  - `10-tickets-skill`: **目の前の実例から、製品の範囲を決めない**
    - 「このリポジトリはローカルの道具ばかりだから、web サービスの観点（権限・並行）は要らない場面が多い」と提案した
    - スターターの `What` はどんなプロジェクトでもよく、実例を範囲と取り違えていた
    - **観点は選別のフィルタではなく、考える手掛かり**
    - 当てはまらないときは理由を書く（外す・黙って飛ばすの両方を防ぐ）
    - owner の指摘で、製品に入る前に止まった
  - `11-readme`: **プロダクト名は未決のまま**
    - 両方の README のタイトルは仮
      - 「ハーネス付きスターター」
      - 「Harness-included starter」
  - `12-cleanup`: 実演の結果
    - 棚卸しは全項目で行き先が決まった（移したか消すか）
    - 削除後、`CYCLE-DESIGN` の参照は `cycles/` 配下だけ
      - 記録そのもの
  - `12-cleanup`: 差分が 3 箇所あったが、いずれも**文書のほうが古かった**
    - `001` の行 → 「プロダクトの最初の 1 枚」
    - 実演の規則 → 「残してよいのは自分で消せるものだけ」
    - `Stack` → 「空で渡す」
    - スキル側が新しい
  - `12-cleanup`: 「どのスキルにも入らない」と分類した 4 行（メタの規則）は、**当たり前すぎるので消す**ことにした
    - README に節を足してから、owner の判断で外した
      - コミットしていないので、作業ツリーは元のまま
