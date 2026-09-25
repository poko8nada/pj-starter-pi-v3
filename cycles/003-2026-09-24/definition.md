# ハーネス付きスターター

## What

- Type: プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター
- Who:
  - owner: clone する人。プロジェクトの持ち主。検査とゲートの恩恵を受ける
  - agent: 同じリポジトリで作業する。規則に従う側

Changes: update **プロダクト名を決めた（ハーネス付きスターター。英名は Harness-included starter）**

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

Changes: update **owner の判断の境界と、触らないものを足した**

## What to build

### 1. work-skill

- Change: add
- Actor: agent
- Given: チケットの `Todo` と `Verify` が合意されている
- When: agent がチケットの作業を進める
- Then:
  - 子に任せた場合、そのコミットは ref で返る
  - agent がその ref を取り込むかを決める
  - チケットは `Commit:` のハッシュで閉じる
  - `Notes` に `Findings` と `Unplanned` が書かれている
    - その step の中の穴は直す
    - 外の穴は次の 1 枚に渡す
  - 実演のあと、リポジトリに残っているのは自分で消せるものだけ

### 2. ref-cleanup

- Change: add
- Actor: agent
- Given: `consult` の ref が残っている
- When: agent が ref を消す
- Then:
  - 消す前に、消えるものが一覧で見える
  - `consult` の ref 以外は拒まれる
  - 消したあと、`git branch` から消えている

### 3. secret-guard

- Change: add
- Actor: agent
- Given: リポジトリに秘密のファイルがある
  - `.env`
  - `.envrc`
  - `*.pem`
  - `*.key`
- When: agent が子に仕事を渡す
- Then:
  - 子の `read` は拒否される
  - 子は「読めない」と報告する
  - 親の `.env` の中身は変わらない

### 4. consult

- Change: update
  - **空ファイルを payload にしない**
  - **`input` の意味を正す**
  - **`consult` の `README` の表を実物に合わせる**
  - **`review` の出力上限を上げる**
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

### 5. input-guard

- Change: add
- Actor: agent
- Given: `consult` に空のファイルを渡す
- When: agent が入力を渡す
- Then:
  - 子は走らない
  - 理由が返る

### 6. readme

- Change: update
  - **節は 7 つ**
  - **tickets の行を分ける**
  - **次の入口の名指しをやめる**
  - **検査の数を実物に合わせる**
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

### 7. definition-skill

- Change: update
  - **本文から、次のスキルの名指しを消す**
    - 入口を指すのは `description` だけ
- Actor: agent
- Given: 前のサイクルが閉じている
- When: agent がサイクルを始める
- Then:
  - `cycles/<NNN-DATE>/definition.md` が出て、7 節がある
    - `Stack` は空でよい
    - `Retro` は空でよい
  - 前のサイクルの `Carry over` の全行が、この 1 枚のどこかに対応している
    - 単位
    - `Non-goal`
    - `Changes` の理由
  - 子に書かせる題材には、リポジトリに答えが無いものを選ぶ
    - 子が写せない
  - 承認までは、`cycles/` 以外に変更が無い
  - 本文が、次のスキルを名指ししない

### 8. stack-skill

- Change: update **`description` から、次を名指しする句を消す**
- Actor: agent
- Given: 定義の他の節が埋まっている
- When: agent がスタックを決める
- Then:
  - `Stack` が埋まる
    - 与えられたハーネスが土台
    - 足した分だけが書かれる
  - 足した理由が残る（差分で読める）
  - `description` に、次のスキルの名前が無い

### 9. plan-skill

- Change: update **`description` から、次を名指しする句を消す**
- Actor: agent
- Given: 定義が承認された
- When: agent がプランを書く
- Then:
  - `step 0` を含む `Steps` と、`Structure` が出る
  - 全 step にファイル名とテスト名が入っている
  - 単位に無い step（後片付けなど）は、`step 0` の `Cleanup` に置かれる
  - 承認までは、プランのファイル以外に変更が無い
  - `description` に、次のスキルの名前が無い

### 10. tickets-skill

- Change: update
  - **`description` から、次を名指しする句を消す**
  - **合意で終わることを本文どおりにする**
- Actor: agent
- Given: プランが承認された
- When: agent がチケットを切る
- Then:
  - チケットが出る
  - `Todo` と `Verify` の承認を取る
  - コミットされる
  - ハッシュを書くのは作業した側で、このスキルは合意したところで終わる
  - `description` に、次のスキルの名前が無い

## What to keep

- `check-suite` From: 001
- `commit-gate` From: 001
- `quality-gate` From: 001
- `agent-rules` From: 001
- `sound-notify` From: 001
- `remote-pi` From: 001

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
- Added: なし

Changes: update

- **002 の 5 行を、ハーネスの名前の 1 行にまとめた**
  - Runtime
  - Package manager
  - Checks
  - Hooks
  - Agent
- **中身は同じ**

## Retro

- Good:
  - 16 枚のチケットが全部ハッシュで閉じ、10 の単位が届いた
  - ref も worktree も残っていない
  - **自前の guard が、あなたの設定が無くても効くことを証明した**
    - `probe.pem` はあなたの config に規則が無い名前で、それが child-guard で拒否された
    - クローンした他人の子も秘密には届かない
  - **実演が実バグを 2 つ捕まえた**
    - child-guard が bash のトークン（`cat`）を秘密扱いして子が凍った
    - 空の入力 1 つで全部の子が走らなくなっていた
    - どちらも動かさなければ見えない形だった
  - **ref を取り込む経路が初めて通った**
    - 子のコミットが ref で返った
    - fast-forward で `main` に入った
    - ハッシュがチケットに残った
    - ref と探り用ファイルを片付けた
  - **文書とコードのズレを 1 つ捕まえた**
    - `consult` は前から「payload はプロンプトの先頭」と書いていた
    - 実装は stdin に流していた（08）
  - オーナーの指摘が、skill の本文に入った
    - 誰が実装するか（既定は子、例外は親）→ `work`
    - `<unit-id>.check` は親が持つ → `work`
    - 「work の終わり」の線 → `work`
    - `Notes` は実装した者が書く → `work`
    - `Remarks` と凍結の表 → `definition`
    - 指摘の振り分け → `definition`
      - 枠 → 次の 1 枚
      - 単位 → そのチケット
      - 段の手順 → その段の skill
      - サイクルの規則 → その文書
- Bad:
  - **同じ形の失敗を、また自分でやった**
    - 「実演で子に書かせない」と skill に書いた 1 時間後に、計測のために子にファイルを書かせて ref を 1 本残した（11）
  - **自分が書いた規則の穴を、実演の子に突かれた**
    - `Carry over` の着地先が書けない
    - `Unplanned` を拾えない
    - `Stack` の `Changes:`
    - 読めば分かる形だった
  - **設計を 2 つ間違えて直した**
    - `work` にまだ無い skill（`close`）を名指しした
    - `Carry over` に着地先を書かせた（会計は次の 1 枚が書く）
  - **実装を第二の目で見ていない**
    - このサイクルのレビューはチケットと文書にだけ当たった
    - コードは 1 度も他人の目を通っていない
    - バグを捕まえたのは実演だけ
  - 朝の `.env` の一件は未解決のまま（002 からの持ち越し）
    - 今サイクルも再現できず、子の主張とあなたの観測が残っている
  - サイクルが長くなり、親（私）が実装とレビューの両方を担った
    - 閾値の話（既定は子）はこの形を減らすために入れた
- Carry over:
  - `01-ref-cleanup.refs`: git を起動しない純関数なので、実演は何も残さない
  - `01-ref-cleanup.refs`: **最初の実行は赤だった**
    - `listConsultRefs` が git の絞り込みに任せていて、`main` を落としていなかった
    - チケットは「`main` は落ちる」と決めていた
    - コード側で `refs/heads/consult/` を filter する形に直した
    - git 側のパターンも残してある（効率）
  - `02-ref-cleanup.tool`: `parseAction` を `index.ts` ではなく `refs.ts` に置いた
    - チケットは `index.ts` と書いていた
    - テストから読むには、拡張の登録（pi の型を読む）を import せずに済ませたい
    - `index.ts` は登録だけになった
  - `02-ref-cleanup.tool`: `gitEnv` は `consult/run.ts` にあり、`../consult/run.ts` から借りた
    - `GIT_*` を落とす環境
    - 同じものを 2 つ持たないため
  - `02-ref-cleanup.tool`: 登録した道具の呼び出しは step 3 の実演で見る
    - 拡張は起動時に読まれるので、`/reload` の後
  - `03-ref-cleanup.check`: 002 の 07 で残った ref は、これで道具で消せることが確かめられた
  - `03-ref-cleanup.check`: **「残してよいのは自分で消せるものだけ」という規則が、道具として形になった**
  - `03-ref-cleanup.check`: 拡張の登録は起動時に読まれるので、実演の前にセッションをリロードした（002 の 06 と同じ）
  - `04-secret-guard.rules`: 止め方の形は、権限の拡張（`@gotgenes/pi-permission-system`）のコードから拾った
    - `pi.on("tool_call", handler)` が入口で、結果は `{ block: true, reason }`
    - **handler が例外を投げると pi は止めずに通す**（SDK が catch しない）ので、本体は自分で握って fail-closed で止める
  - `04-secret-guard.rules`: 判定は `realpathSync` を使う
    - **存在しないパスは `true`**（「読めないものを通さない」）
  - `04-secret-guard.rules`: 字面のすり抜け対策は「引用符と `\` を剥がす」形（`cat .e""nv` → `.env`）
    - **シェルの展開を完全に真似ているわけではない**
    - `$VAR` を使った組み立ては「存在しないパス」として fail-closed で止まる
    - **これは偶然で、保証ではない**
    - 次の 1 枚への持ち越し
  - `04-secret-guard.rules`: 道具によってパスのキー名が違う
    - `path`
    - `file_path`
    - `filePath`
    - `file`
    - pi の `read` の実際のキー名は未確認で、4 つを候補として見ている
  - `05-secret-guard.consult`: パスは `import.meta.url` から組む（`fileURLToPath(new URL('./child-guard.ts', import.meta.url))`）
    - **チケットは「配列そのものを比較」と書いたが、絶対パスは機械に依存する**
    - テストは「`--tools` の後ろ」「`child-guard.ts` で終わる絶対パス」「`-e` は 1 回だけ」で確かめている
  - `05-secret-guard.consult`: `-e` は `--tools` の直後、`--no-approve` の前に置いた
    - まとまりとして読める位置
  - `05-secret-guard.consult`: **子に読ませる実演はこの step では行わない**
    - この step の一部（引数の組み立て）はテストが覆う
    - 単位全体の実演（生きた子に `.env` を読ませる）は 06 が持つ
    - `plan` スキルの「その step の `Verify` は自分の分だけを覆う」に従った
  - `05-secret-guard.consult`: 親の側のケースは作らない
    - `buildPiArgs` は子の引数を組む関数で、親はこの経路を通らない（構造で保証される）
  - `06-secret-guard.check`: `research`（リポジトリ直）
    - child-guard が拒否した
      - `read .env`
      - `read .envrc`
      - `grep .env`
      - 拒否の文は「読めない: … は秘密として扱う（child-guard）」
    - 再帰 `grep` は通るが `No matches`（`.env` の行は混ざらない）
    - `README.md` は通る（止めすぎていない）
  - `06-secret-guard.check`: `review`（リポジトリ直）でも同じ 4 つが同じ結果で拒否された（拒否の文も child-guard）
  - `06-secret-guard.check`: `trial`（worktree）
    - `cat <絶対パス>/.env` は child-guard が拒否した
    - `ls -la` は通る
    - `pwd` は通る
    - child-guard が拒否した
      - `cat <絶対パス>/probe.pem`
      - `grep -c x <絶対パス>/probe.pem`
  - `06-secret-guard.check`: **自前 guard の証明**
    - `probe.pem`（偽物）はあなたの config に規則が無い（`.env` / `.envrc` のみ）
    - それが child-guard で拒否された = **私たちの guard が効いている**
    - あなたの設定が無いクローンでも子は届かない
  - `06-secret-guard.check`: 親の `.env` は前後で変わらない
    - mtime は `Sep 20 14:33`、`.envrc` は `Sep 16 09:17`、ともに不変
  - `06-secret-guard.check`: 実演の後: `probe.pem` を親が消し、`git status` は綺麗
    - 子は何も残さなかった（`ref: (the child changed nothing)`）
  - `07-consult.limits`: **`review` の子を定義 1 枚（`cycles/003-2026-09-24/definition.md`）に当て、最後まで読み切った**
    - 出力 33,792 トークンで、上限に当たらなかった
    - 上げる前は 3 周とも `stopped early: output token limit reached (20000)` で死んでいた
  - `07-consult.limits`: `turns` は変えない（20 で足りていた。実演でも 3 turns）
  - `07-consult.limits`: **副産物**: 子が、こちらが渡したチェックリストの「eight sections」を誤りとして指摘した
    - 実物はまだ 7 節。8 になるのは step 12 の後
    - シートではなくチェックの文の誤り
  - `08-consult.doc`: **コードがドキュメントに追いついていなかった**
    - README は前から「prepended to the child's prompt… the payload first and the task after it」と書いていた
    - 実装は payload を **stdin** に流していた
    - 実装を README に合わせた: `joinPrompt` を `spec.ts` に置き、`index.ts` がプロンプトを組んで `task` として渡す
    - `run.ts` から `payload` の口と stdin への書き込みを消した
  - `08-consult.doc`: `RunOptions.payload` は**消した**
    - 使っていたのは `run.ts` の stdin だけ
    - `run.test.ts` は `readPayloads` のほうしか見ていない
  - `09-consult.check`: **`research` を 2 入力で 1 回**
    - 結果は 2 件、**入力順**
    - 1 体目は「先行文書は存在しません…文書は 1 つだけ」、2 体目は `# PLAN 003` を引用した
    - **入力ごとに 1 体**で、各子は自分の payload 1 枚とタスクを受け取っている
    - 両方とも payload の先頭行を正しく引用した（payload がプロンプトに入っている証拠）
  - `09-consult.check`: **`code` 1 体**
    - `PROBE.md` を作り、`ref: consult/code-20260924-174013-0`（`92fa8a5`、1 file changed）が返った
    - **取り込まない**と決め、`ref_cleanup` の `list` → `delete` で消した
    - 親のツリーは 1 度も触られていない（`git status` は綺麗、`git branch` は `main` だけ、worktree も残っていない）
  - `10-input-guard`: 実演の結果（`Verify`）: `research` に空ファイル + 中身のあるファイルの 2 入力を渡した
    - 空のほうは「(the child could not run) 空の入力」が返り、子が走っていない（`[consult]` の行が無い = 起動回数 0）
    - 中身のあるほうは走って答えを返した
      - 1 turns
      - in 267
      - out 6
  - `10-input-guard`: 空の入力に `[consult]` の行が付かないので、結果を見ただけで「子が走ったか」が分かる
  - `10-input-guard`: 置き場所はチケットの `run.ts` ではなく **`index.ts`** にした
    - `runForInputs` は結果を組む係で、入力の検証はその呼び出し側の仕事
  - `10-input-guard`: 結果の形はチケットの `{ok: false, reason}` ではなく実物の **`{ok: false, error}`**（`InputOutcome`）
  - `10-input-guard`（Unplanned）: 親のコード（`consult` 本体）を直した実演は、毎回 `/reload` が要る。子に渡すファイル（`child-guard.ts` など）なら要らない
  - `11-work-skill`: 子（`type code`）に `.pi/skills/tickets/SKILL.md` と `.pi/skills/work/SKILL.md` を読ませ、探り用チケット `99-probe.md` を閉じさせた
    - 子は `PROBE.txt` を書き、`Verify` を走らせ、**自分の `Notes` をチケットに書いた**
    - `Commit:` は空のままにし、「書くのは ref を取る側」と自分で書いた
  - `11-work-skill`: 子のコミットが ref `consult/code-20260925-110408-0`（`75d5206`）で返り、**親が merge した**
    - このリポジトリで ref を取り込んだのは初めて
    - fast-forward だったので `75d5206` がそのまま `main` の HEAD になり、チケットに書いたハッシュが有効なまま残った
  - `11-work-skill`: 親のツリーで `Verify` を走らせ、`Commit: 75d5206` を書いて閉じた
    - その後、探り用の 2 ファイルを消し、ref を `ref_cleanup` で消した
    - 残っているのは `main` だけ
  - `11-work-skill`: 子が「どちらの skill にも書いていない」と自分で言ってきた 2 つ
    - hook は子の退出後に `consult` が打つコミットで走る
    - `commitWorktree` が `git add -A` する
    - **どちらも Step 2 に足した**（`ccc3e19`）
  - `11-work-skill`: `Verify` の後半（失敗 4 つの置き場所）
    - ref が返らない・子の作業が失敗 → Step 6
    - 依存なのに前の ref が無い → Step 3
    - ref が消せない → Step 9
  - `11-work-skill`（Unplanned）: **子はコミットできない**（`git commit *` は承認必須で、子には UI が無い）
    - だから `Commit:` は取り込む側が書く
    - ref の経路は README どおりに動いた
  - `11-work-skill`（Unplanned）: **004 に送る**
    - `close` skill（サイクル全体の統合・レビュー・振り分け・Retro。中身は 004 で詰める）
    - `Goal` を壊す穴はそのサイクルで直し、それ以外は次へ
    - **実装を第二の目で見るレビューが skill にも枠にも無い**
    - close は実装しない（提案）
  - `11-work-skill`（Unplanned）: **サイクル全体の判定は、いまどの skill のものでもない**
    - 003 の plan は `definition` がサイクルを閉じると言っており、誰が引き受けるかは 004 で決める
  - `11-work-skill`（Unplanned）: 探り用のコミットが履歴に残る（`da4cfc4` 追加 / `bc59819` 削除）
    - 子は `HEAD` の写しで働くので、探り用チケットはコミットしないと子から見えない
  - `12-definition-skill`: 実演の結果（`Verify`）: 子（`trial`）に `definition` の 2 ファイルだけを読ませ、003 の次のサイクルの作業用の 1 枚を `/tmp/definition-demo/definition.md` に書かせた
    - **8 節**がこの順で出た
      - What
      - Goal
      - Non-goal
      - What to build
      - What to keep
      - Stack
      - Remarks
      - Retro
  - `12-definition-skill`: **`Carry over`**
    - 003 の閉じたチケット（01〜11 + 15）から **53 行**を拾い、全行をどこかに着地させた
    - 35 → 既存 unit を `What to keep`
    - 15 → `secret-guard` の `Change: update` の理由
    - 1 → `Non-goal` の明示的な拒否
  - `12-definition-skill`: 5 つの規則は、子が**引用で示せた** = 読める形で書けている
    - 子に見せる題材
    - 指摘の振り分け
    - 凍結の表
    - ref の規則
    - `Remarks` の規則
  - `12-definition-skill`: **本文は次の段の skill を名指ししていない**
    - 子の報告: `The later stages of the cycle have their own skills, and each of those says in its description when to read it`
    - unit の id は artifact の名前としてしか使っていない
  - `12-definition-skill`: **リポジトリには 1 ファイルも触っていない**（`ref: (the child changed nothing)` = ref も残っていない）
  - `12-definition-skill`（Unplanned）: チケットの前提が外れた 2 つ
    - `format.md` に**節数の記述が無かった**（「7 → 8 に直す」対象が無い。テンプレートと空節の規則を直した）
    - `plan.md` の step 12 の `Tests` とチケットの `Acceptance` は「7 節」だが、この step で 8 節になる
    - **8 節は 004 の 1 枚から**。003 の 1 枚は凍結なので触らない
  - `12-definition-skill`（Unplanned）: 実演の題材は人工的（003 はまだ閉じておらず、12〜16 も未閉じ）
    - 子はそれを見抜いて「003 は閉じていないが、コードが入っている 12 は update として扱った」と報告した
    - 相手が閉じたサイクルならこの曖昧さは出ない
  - `13-stack-skill`: 子（`trial`）に `stack` の 1 ファイルだけを読ませ、前の実演が `/tmp/definition-demo/` に書いた作業用の 1 枚の `Stack` を埋めさせた（書き先 `/tmp/stack-demo/definition.md`）
    - **base は名前の 1 行、`Added: なし`、`Changes: keep`** で出た
  - `13-stack-skill`: **足した理由はコミットメッセージに書かれた**
    - 子が使うつもりのコミットメッセージを提示した = Step 3 の「理由はシートに書かず、コミットが記録」が読めている
  - `13-stack-skill`: **`description` にも本文にも次の段の名前が無い**（子が `description` を引用して「No」と報告）
  - `13-stack-skill`: **ref の規則を引用で示せた**（`A trial child can write, and what it leaves behind is committed...`）
  - `13-stack-skill`: 子は、読めない候補を 1 つ挙げて（pi 拡張ホスト API のツール引数のキー名）、**trial を回す前に owner の許可を聞く形で止めた**
    - shared store の規則が正しく適用された
  - `13-stack-skill`: **リポジトリには 1 ファイルも触っていない**（`ref: (the child changed nothing)`）
  - `14-plan-skill`: 実演の結果（`Verify`）: 子（`trial`）に `plan` の 2 ファイルだけを読ませ、前の実演の作業用の 1 枚（`/tmp/stack-demo/definition.md`）から 1 枚のプランを書かせた（`/tmp/plan-demo/plan.md`）
    - **`step 0`**、step 1〜8、**`Structure` 8 行** が出た
      - `step 0` の 3 つの問い
        - Install: なし
        - Cleanup: なし
        - Refactor: なし
      - `Structure` の印
        - `add`
        - `update`
  - `14-plan-skill`: step 1 以降はすべて `Files` と `Tests` を持っている
    - `step 0` は 3 つの問いだけで、`Files` / `Tests` を持たない（format の型どおり。003 のプランも同じ）
  - `14-plan-skill`: **道具の依存が書けた**
    - `setup-check` は直した `secret-guard` のコードに依存する
    - `plan-skill` は `review` の子に依存する
    - 子が引用した一文 = `A dependency is not only documents: a step can need a tool.`
  - `14-plan-skill`: 単位に無い仕事は出なかった（`Cleanup` は `なし`。出ればそこに行く、と子が答えた）
  - `14-plan-skill`: **`description` に次の段の名前が無い**（引用つき）
  - `14-plan-skill`: **リポジトリには 1 ファイルも触っていない**（`ref: (the child changed nothing)`）
  - `14-plan-skill`: **次のサイクルへ送る**
    - 子が「本文は次の段を名指ししている（Step 6 の `review`）」と報告した
    - ここでの `review` は consult の **type** で skill 名ではない
    - 同じ句が 4 skill にあるので、**1 つだけ直すと揺れる**
      - `definition`
      - `stack`
      - `plan`
      - `tickets`
  - `14-plan-skill`（Unplanned）: `trial` の子は子を起こせない（`consult` が無い）ので、Step 6 のレビューは実演の中で走っていない
    - skill の穴ではなく、レビューは agent の仕事
  - `15-tickets-skill`: 実演の結果: `trial` の子に `tickets` と `format.md` だけを読ませ、リポジトリの外（玩具のプランと定義）から 1 単位ぶんのチケットを切らせた
    - 2 枚を切り（`step 0` には切らない）
    - `Acceptance` は定義の `Then` の写し
    - `Todo` は 9 観点すべてに case か「適用しない理由」
    - `Verify` は走る形になった
  - `15-tickets-skill`: 子がスキルの穴を 10 返してきた。**8 つは本物**（`Unplanned` で直した）
    - チケットの置き場所は `cycles/<NNN-DATE>/tickets/`
    - `<unit-id>.<part>` のドットはファイル名にも残る
    - 「適用しない理由」は case と同じリストに置く
    - 検査だけの step は `Todo` に なし と理由を書き、`Verify` は実演そのもの
    - プランの `Tests` は出発点で、9 観点をたどって足す
    - プランの `(empty)` などはカテゴリで、印は `(happy)` と `(error)` のみ
    - 子を起こせないなら止める
    - オーナーが居ないなら止める
    - 残り 2 つは、子に `consult` が無くオーナーも居ない演習なので当然
      - レビューの実行
      - 合意の取得
  - `15-tickets-skill`: **子が自分の worktree でコミットし、ref を 1 本残した**（`consult/trial-20260924-161035-0`）
    - 002 の 07 と同じ形（消す道具が無いのに、残る実演をした）
    - ref は step 2 の `ref-cleanup` で消すか、先に owner の許可を取る
  - `16-readme`: 実演の結果（`Verify`）
    - シートの節は **8** で、README の名前列と一致
      - What
      - Goal
      - Non-goal
      - What to build
      - What to keep
      - Stack
      - Remarks
      - Retro
    - `tickets` の行から「実装」が消え、`work` の行がある
    - 5 つの skill の `description` と表の役割が一致
    - verify に載る検査は **2**
      - `lint`
      - `typecheck`
      - fix 側は `lint:fix` と `format`
    - clone 直後のつもりで読んで、入っているものが言える
      - 検査
      - ゲート
      - 規則
      - 5 skill
      - consult
      - 記録
    - 最初の手順が言える
      - `pnpm install`
      - `cycles/` を消す
      - `types.example.json` をコピー
      - `pi` 起動
  - `16-readme`: **チケットの `Verify` のコマンドが誤っていた**
    - `format.md` 自身の節が混ざり、**14** を返す
    - 8 を数えるにはコードブロックの中を見る必要がある
    - チケットは凍結されているので直さず、正しいコマンドで確かめた
  - `16-readme`: README の文（「次の段を名指ししない」）はそのまま残した — 実物（skill 側）が規則に追いついたので、消さずに済んだ
