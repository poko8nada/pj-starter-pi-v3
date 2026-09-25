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
    - ハーネスは設定の場所所（`.pi/remote-pi/.gitignore`）だけを用意する
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
    - 次の 1 枚が受ける穴は次の 1 枚に渡す
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
  - 自前の guard が、あなたの設定が無くても効くことを証明した（`probe.pem` はあなたの config に規則が無い名前で、child-guard が拒否した）
  - 動かさなければ見えない実バグを、実演が 2 つ捕まえた
    - child-guard が bash のトークン（`cat`）を秘密扱いして子が凍った
    - 空の入力 1 つで全部の子が走らなくなっていた
  - ref を取り込む経路が初めて通った
    - 子のコミットが ref で返った
    - fast-forward だったので、ハッシュがチケットに残った
  - 文書とコードのズレを 1 つ捕まえた
    - `consult` の README は「payload はプロンプトの先頭」と書いていたが、実装は stdin に流していた（08）
  - オーナーの指摘が、skill の本文に入った
    - `work`: 誰が実装するか（既定は子、例外は親）、`<unit-id>.check` は親、work のどこで終わりとするか、`Notes` は実装した者が書く
    - `definition`: `Remarks` と凍結の表、指摘の振り分け（枠 / 単位 / 段の手順 / サイクルの規則）
- Bad:
  - 同じ形の失敗を、また自分でやった
    - 「実演で子に書かせない」と skill に書いた 1 時間後に、計測のために子にファイルを書かせて ref を 1 本残した（11）
  - 自分が書いた規則の穴を、実演の子に突かれた
    - `Carry over` の着地先が書けない
    - `Unplanned` を拾えない
    - `Stack` の `Changes:`
  - 設計を 2 つ間違えて直した
    - `work` にまだ無い skill（`close`）を名指しした
    - `Carry over` に着地先を書かせた（会計は次の 1 枚が書く）
  - 実装を第二の目で見ていない: レビューはチケットと文書にだけ当たり、コードは 1 度も他人の目を通っていない
  - 朝の `.env` の一件は未解決のまま（002 からの持ち越し）
    - 今サイクルも再現できず、子の主張とあなたの観測が残っている
  - サイクルが長くなり、親（私）が実装とレビューの両方を担った
    - 既定を子にする閾値は、この形を減らすために入れた
- Carry over:
  - `02-ref-cleanup.tool`: `parseAction` はチケットの `index.ts` ではなく `refs.ts` にある（テストが拡張の登録を import せずに済む）
  - `04-secret-guard.rules`: `$VAR` を組み立てた字面は「存在しないパス」として fail-closed で止まるが、偶然であって保証ではない
  - `04-secret-guard.rules`: 道具によってパスのキー名が違う（`path` / `file_path` / `filePath` / `file`）。pi の `read` の実際のキー名は未確認
  - `05-secret-guard.consult`: チケットの「配列そのものを比較」は絶対パスが機械に依存するため、テストは `--tools` の後ろ / `child-guard.ts` で終わる絶対パス / `-e` は 1 回で確かめている
  - `10-input-guard`: 場所所はチケットの `run.ts` ではなく `index.ts` にした（`runForInputs` は結果を組む係で、入力の検証は呼び出し側）
  - `10-input-guard`: 結果の形はチケットの `{ok: false, reason}` ではなく `{ok: false, error}`（`InputOutcome`）
  - `10-input-guard`: 拡張は起動時に読まれるので、親のコードを直した実演は毎回 `/reload` が要る（子に渡すファイルなら要らない）
  - `11-work-skill`: 試し用チケットはコミットしないと子から見えない（子は `HEAD` の写しで働く）ので、履歴に残る（`da4cfc4` 追加 / `bc59819` 削除）
  - `11-work-skill`: `close` skill（サイクル全体の統合・レビュー・振り分け・`Retro`）が無く、サイクル全体の判定がどの skill のものでもない → 004 で決める
  - `11-work-skill`: 実装を第二の目で見るレビューが、skill にも枠にも無い → 004
  - `12-definition-skill`: `format.md` に節数の記述が無く、「7 節 → 8 節」に直す対象が無かった（テンプレートと空節の規則を直した）
  - `12-definition-skill`: `plan.md` の step 12 の `Tests` とチケットの `Acceptance` は「7 節」だが、この step で 8 節になる（8 節は 004 の 1 枚から。003 の 1 枚は凍結なので触らない）
  - `14-plan-skill`: 本文が次のフェーズを名指しする句が 4 skill にある（`definition` / `stack` / `plan` / `tickets`）。1 つだけ直すと揺れる（`review` は consult の type で skill 名ではない）→ 次のサイクル
  - `15-tickets-skill`: `tickets` のレビューと合意の取得は、子に `consult` が無くオーナーも居ない演習だったので実演で走っていない
  - `15-tickets-skill`: 子が自分の worktree でコミットし、ref `consult/trial-20260924-161035-0` を 1 本残した（002 の 07 と同じ形。`ref-cleanup` で消すか、先に owner の許可を取る）
  - `16-readme`: チケットの `Verify` のコマンドが誤っていた（`format.md` 自身の節が混ざって 14 を返し、8 を数えるにはコードブロックの中を見る）。チケットは凍結なので直さない
