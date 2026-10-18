# ADR 020

## 01: Jev に何を聞くか

### Context

- intent-router はいま 5 択（question / design / verify / permission / chat / unknown）を 1 問で聞いている。ラベルは想定と合わず、confidence も低い。
- 直近のプロンプト 1 つでは判断できない。何を求められているかは、直前のエージェントの発言があって初めて決まる。
- owner が求めているのは、発言に合わせて振る舞いを変えること。防ぎたい失敗は 4 つ。質問なのに実装を始める / 「調べて」と言われて調べずに答える / 調査が長くて答えが返らない / 承認したのに確認が返る。
- owner の整理: 質問 / 調査 / 提案 を分ける必要はもう無い。求められている物は「返事か、実行の承認か、それ以外」の 3 つで足りる。

### Decision

- Status: **accepted**
- Adopted:
  - 頭で 1 問 3 択（`reply` / `approve` / `other`）を聞き、choice ごとに guide を 1 回差し込む。
  - 途中で 2 問（`useful` / `new`）を聞き、効いていないと同じ判断が続いたら促しを 1 回差し込む。
- Options:
  - 5 択を 1 問のまま（段が混ざる。機能と目的を同時に解かせることになる）
  - 機能と目的の 2 問に分ける（頭を 3 択にすると、答え方の指示が guide 1 文にまとまるので分ける理由が消える）
  - 質問 / 調査 / 提案 を分けたまま残す（候補が増えるほど当たらない）
  - 途中で「メッセージが予告だけか、渡しているか」を聞く（促しに繋がらない）

### Research & Trial

- 直前 1 往復を入れて +2 点、2 往復目以降はほぼ横ばい（SwDA 42 タグ、74.7% / 77.1% → 76.8% / 79.3% → 79.3% / 80.1%）
- 候補を 2 択に絞ると macro-F1 +7.0 点（11〜102 クラスで検証）。対話行為でも 42 タグ 70% → 6 タグ 78%
- 承諾は直前が提案か依頼かで別のカテゴリになる（ISO 24617-2 の変換規則で、同じ Accept が直前で分かれる）
- 1 問に複数の判断を混ぜると弱い（TUNA の指摘）
- 「答えられるか」を尋ねると、ほぼ何でも人手に投げる（Pydantic の観測）
- 大きな state から要る物を選ばせる用途で relevance の yes/no が公式に勧められている
- 独立な問いは 1 リクエストにまとめてよい。並列に評価され、時間はほぼ増えない（公式）

### Definition Change

- `Unit.intent-router`(updated): エージェントが、owner の発言の意図通りに動ける

## 02: 頭の判定に何を渡すか

### Context

- いまの route は `owner_prompt`（2000 字）と `cwd_basename` と `has_images` だけ。会話が入っていない。
- `approve` は直前のエージェントの発言が無いと決まらない。同じ承諾でも、直前が提案か依頼かで別のカテゴリになる。

### Decision

- Status: **accepted**
- Adopted:
  - `owner_now` と `agent_prev`（2000 字まで）の 2 つだけを渡す。
- Options:
  - 直近 N 往復を渡す（2 往復目以降は効きが横ばい。無関係な物を足すと落ちる）
  - ツールの結果を渡す（頭の時点ではまだ何もしていない）
  - `has_images` を残す（Jev 1.13 は画像を判定できない。1.14 に上げるときに足す）
  - `cwd_basename` を残す（3 択の判定に使わない）

### Research & Trial

- 直前 1 往復で +2 点。2 以降は横ばい（Liu et al. 2017、SwDA）
- 無関係な情報を増やすと落ちる。distractor 1→15 で 43% → 19%、26% → 2%。中間に置くと 20 点以上低下
- 前提の事実を 1 行足すだけで confidence が 0.29 → 0.99 まで動いた（20 店舗の実測）

### Definition Change

- なし

## 03: 途中の促しの条件

### Context

- 失敗 3「調査が長すぎて、答えが返ってこない」を止めたい。
- いまは score（0〜2、閾値 1.5）で「答えられるか」を聞いている。
- owner は、量の閾値で切るのは避けたい。止める判断は Jev に持たせたい。

### Decision

- Status: **accepted**
- Adopted:
  - `useful`（`latest` の調べ物は、オーナーの発言に答えるのに役立っているか）と `new`（`latest` で `earlier` と違う新しい事実が得られたか）を聞く。
  - 同じ判断が続いたときに促しを 1 回出す。回数は「同じ判断が続いたか」だけに使い、量では切らない。
  - 閾値は 0.9。間違って止めると失敗 2 と 3 の逆側を踏むため。
- Options:
  - 「情報は十分か」を聞く（Jev が判定できない問い。失敗の観測がある）
  - 往復数で切る（正当な長い調査を潰す。owner が否定）
  - 重複した read / grep で切る（重複は本質ではない。owner が否定）
  - score（0〜2）を残す（期待値なので量に落ちない。いまの 252 件で fire は 7 件）
  - 促しを hard stop にする（促し 1 回に留める）

### Research & Trial

- いまの judge の記録 252 件で fire は 7 件（2.8%）。score の山は 1.0〜1.2 で、閾値 1.5 に届かない
- 判定が走った 292 件で、往復数は中央値 3、p90 8、最大 12
- 他プロダクトの前例は量の規則で、同じ引数の Read 3 回 / Grep 5 回（60 秒の窓）で拒否、読み取り合計 30 回で停止
- `useful` / `new` の 2 問は未実測。shadow で記録してから繋ぐ

### Definition Change

- なし

## 04: 設定の置き場と調整の道具

### Context

- いま閾値と一部の文は `settings.json` にあり、質問文（instructions / criteria）とラベルはコードの中にある。
- 設定は起動時に 1 回だけ読むので、変えると pi の再読み込みが要る。
- owner は、値と質問を変えやすい JSON と、ツールから調整できることを重視する。

### Decision

- Status: **accepted**
- Adopted:
  - 問いの文（instructions / criteria）、閾値、guide、促しの文を JSON に置く。
  - 設定は ask のたびに読む。`/intent show` / `set` / `last` を足す。
  - キーは英語。問いは `expect` / `useful` / `new`、choice は `reply` / `approve` / `other`。
  - 第一候補のモデルを `opencode/jev-1.13-free` に固定し、`~typesafe/jev-latest` は第二候補に残す。
- Options:
  - コードに直書きのまま（変えるのに commit が要る）
  - 起動時に 1 回だけ読む（毎回 reload が要る）
  - 日本語のキー（ツールのドット指定が扱いにくい。owner が否定）
  - `~typesafe/jev-latest` を第一候補のまま（alias が動くと閾値がずれる）

### Research & Trial

- 出力の課金は無く、入力のみ $0.042 / 1M。1,000 決定あたり $0.015（8 択の独立測定）
- モデルを替えると閾値は引き直しが要る（公式と独立測定の両方が同じことを言う）
- 中間帯（0.3〜0.8）の confidence は信頼できない（監査の実測）
- 閾値と精度の実測: 0.8 で 8 割を拾って 93.8%、0.9 で 7 割を拾って 95.5%（791 件）

### Definition Change

- なし

## 05: 記録の形

### Context

- いまは日付ごとの `logs/<日付>.jsonl` に 1 行ずつ書き、14 日で prune している。
- 溜まるだけで、読む主体が無い。owner は「溜める意味が無い」と言う。

### Decision

- Status: **accepted**
- Adopted:
  - 直近だけ見られればよい形にする。調整はその場でやる（`/intent last` と shadow の表示）。
  - 日付ごとの蓄積と prune をやめる。
- Options:
  - 日付ファイルのまま残す（読む者が居ない）
  - 正解ラベルを付けて評価データにする（読む者が居ない。owner が否定）
  - ファイルに書かずメモリだけに持つ（pi を落とすと見られない。直近を見る用途には足りるが、別の端末で読めない）

### Research & Trial

- いま 386 件の route と 252 件の judge が溜まっていて、fire は 7 件（2.8%）
- 公開されている実装例では、止める側の材料は回数と重複で、記録を貯めて後から評価する形は見つからなかった

### Definition Change

- なし

## 06: Jev に渡す文言の言語

### Context

- Jev に渡す文言は 2 つある。questions の `instructions` / `criteria`（Jev が読む指示）と、state（会話と道具の結果）。
- owner は、コンテキスト以外は基本英語にするよう求める。
- いまの `questions.ts` は英語で書かれている。今回の設計案では criteria を日本語にしていた。

### Decision

- Status: **accepted**
- Adopted:
  - `instructions` と `criteria` は英語で書く。
  - state の値は原文のまま入れる（日本語のまま。訳さない）。
  - guide と促しの文はエージェントが読む物なので日本語のまま。
- Options:
  - criteria を日本語にする（owner が否定。文言は英語で揃える）
  - `instructions` だけ日本語で criteria を英語にする（揃わない）
  - state の値も英語に訳す（訳の手間が出て、原文の情報が落ちる）
  - 全部日本語（Jev 向けの文とエージェント向けの文が混ざる）

### Research & Trial

- 確認した範囲で、公式の例と cookbook はすべて英語で書かれている。
- 選択肢の名前と説明はどちらもモデルに送られる（公式）。
- Jev は書いた通りに読む（literal reading）。言語で精度が変わるという実測は見つかっていない（未確認）。

### Definition Change

- なし

## 07: intent-router のファイルの並べ方

### Context

- `.pi/extensions/intent-router` は平らで、`index` / `settings` / `questions` / `state` / `classifier` / `command` / `log` と `hook/` だけが並んでいる。
- 今回、問い（頭 1 問 + 途中 2 問）、設定の live 読み、`/intent` の下位コマンド、記録の形が増える。平らのままだと、何がどの段階の物か読めない。
- `consult` は段階ごとの下位ディレクトリ（`run/` `sub/` `tool/` `policy/`）で分けている。

### Decision

- Status: **accepted**
- Adopted:
  - 段階で分ける。`index.ts` を入口に残し、段階ごと（設定・問いを投げる口・頭の判定・途中の判定・状態・コマンド）に下位ディレクトリを切る。
  - 純関数（判定と文面）と、副作用（hook の入出力）を別のファイルにする。
  - テストは対象の隣に置く（今と同じ）。
- Options:
  - 平らのまま（増えると読めない）
  - 種類で分ける（`src/` と `test/`）（テストが対象から離れる。今の repo の形と合わない）
  - `consult` と同じ名前の下位ディレクトリにする（段階が違うので、名前を揃える意味が無い）

### Research & Trial

- `consult` の形: `index.ts`、`policy/` `run/` `sub/` `tool/`、テストは対象の隣（`.pi/extensions/consult` を読んだ）。
- どの分け方でも、モジュールの数と依存の向きは変わらない。変わるのは読む時の見つけやすさ。

### Definition Change

- なし（動くのは `Unit.intent-router` である）

## 08: shadow と live の切り替え

### Context

- いまは `/intent on|off` で、このセッションの間だけ router を止められる。
- shadow は `settings.json` にあり、起動時に 1 回読む。切り替えるにはファイルを直して pi を読み込み直す。
- owner は、shadow か実際に動かすかをスラッシュコマンドで操作したい。頭と途中で分けず、一括でよい。

### Decision

- Status: **accepted**
- Adopted:
  - `/intent` で今の状態を出す（live か shadow か）。
  - `/intent on` で live（頭も途中も実際に出す）、`/intent off` で shadow（どちらも記録だけ）。
  - 切り替えたら、抱えている run を捨てる。記録に残す。
  - `settings.json` は書き換えない。既定は shadow のままで、次のセッションはファイルから始まる。
- Options:
  - 頭と途中で別々に切り替える（owner が不要とした）
  - `settings.json` を書き換える（git 管理のファイルが操作のたびに変わる。既定が動く）
  - 止める / shadow / live の 3 つに分ける（止めるは shadow と同じでよい。owner が不要とした）
  - 起動時の引数や環境変数で切り替える（対話の途中で変えられない）

### Research & Trial

- いまの `/intent on|off` はセッションだけの切り替えで、ファイルを書き換えない（README と実装で確認）。
- 設定は登録時に 1 回読む。ask のたびに読む形に変えるのは entry 04 の決定。
- 一括なので、片方ずつ live にする段階はコマンドで作れない。その間は `settings.json` の 2 つの shadow で決めて読み込み直す（entry 01 と 03 の順序を進める間だけ）。

### Definition Change

- なし
