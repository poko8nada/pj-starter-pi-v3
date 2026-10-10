# ADR 013

pi 1.0.4 で読んだ。行番号はこの版の物。

## 01: intent-router

### 01-1: intent-router

1. Agenda:
   - Title: 足す単位の形と、判定の分け方
   - Proposal: `intent-router` という1つの拡張を足す。owner の発言ごとに1回、jev の choice で6ラベル（question / design / verify / permission / chat / unknown）に分け、動くのは3つだけにする
2. Highlight:
   - owner の困りごとは2つ。質問の返事なのに勝手に編集されることと、調べすぎて答えが返らないこと
   - 6つのうち動かすのは question / design / verify の3つ。permission / chat / unknown は何もしない。受け皿として持つのは、「その他」が無いと実在の発言が無理に別のラベルへ寄るため
   - 動かない3つも**分類は全部ログに残す**。「unknown に逃げた」「permission を question と誤った」を後から数えられるようにする
   - ラベルを増やすほど、当てる閾値・テスト・ログの読み方が増える。6で止める。閾値そのものは置きで始める（置き場所は settings の `thresholds`、初期値は plan が持つ）。shadow のログの分布を見て動かす
   - `pi --list-models jev` に出る `openrouter/typesafe/jev-router` は「どのモデルに回すか」を選ぶ chat 側の router で、判断器ではない（投げたら `openai/gpt-6-luna` に回り、文章が返った）。判断には Jev 本体（`jev-1.13` / `~typesafe/jev-latest`）を使う
   - 捨てた別案: route と judge を2つの単位に割る → 単位の数だけ設定・コマンド・ログが増え、owner の発言1つ分の状態が単位をまたぐ
   - 残る弱点（承知の上）: route が question を chat と誤ると、judge は arm されず、その発言では両方とも効かない。切り分けはログで行う
   - **1つの単位に、1つの状態機械（owner の発言 → 分類 → 促し → 調査の記録 → 判定）を持たせる**
3. Research:
   - mechanism: 拡張は `ctx.modelRegistry.classify(model, { state, questions }, { signal })` で classifier を呼ぶ（`dist/core/model-registry.d.ts:29-47`、pi 同梱の実例 `examples/extensions/jev-router.ts:67-87`）
   - mechanism: カタログに `opencode/jev-1.13-free` と `openrouter/~typesafe/jev-latest` が classifier として載っている（`@earendil-works/pi-ai@1.0.3` の `dist/providers/data/opencode.json` と `openrouter.json`）
   - 実測: `classify()` は 604〜1091ms で `stopReason: "stop"`。confidence 0.99〜1 で `design` を返した
4. Trial: なし
5. Decision: **accepted**

### 01-2: .guide

1. Agenda:
   - Title: 「質問されているのに編集する」をどう止めるか
   - Proposal: route が question / design / verify と決め、confidence が閾値以上なら、そのターンの頭に「Kind: ◯◯。編集するな、答えに要る分だけ調べて答えろ」を1回だけ差し込む
2. Highlight:
   - 差し込む位置はターンの最初でないと効かない。編集は最初の往復から起こる
   - `before_agent_start` は最初のモデル要求の前に await される（`agent-session.js:1587`）。handler が返した `message` は同じターンの owner の発言の直後に並ぶ（`agent-session.js:1611-1620`）。だから `sendMessage` を使わず、この戻り値で届ける
   - 差し込みは1回だけ。毎ターン繰り返すと context に同じ指示が積み、調査の方を伸ばす（止める側は judge が持つ）
   - 差し込んだ文はセッションに残るので、次の発言のターンでもモデルから見える。文面の先頭で「どの発言についてか」が分かるようにする（古い指示が効き続けないように）
   - 文面は英語（モデルに読ませる文）。owner の画面にも出す（`display: true`）。効いているかを見て閾値を動かせるように
   - 除外する入口: `/` で始まる発言は分類しない（コマンドを分類しても何も起きないので、遅延だけ払うことになる）
   - この遅延（0.5〜1.1秒）は何もしないラベル（chat / permission / unknown）でも払う。速くする工夫は v1 では入れない（まず効くかを見る）
   - 捨てた別案: system prompt を差し替える → ターン全体の指示が変わり、他の指示との関係が読みにくくなる（キャッシュへの影響は測っていない）
   - 捨てた別案: `on("context")` で**その要求だけ**に差し込む → 後を引かない代わりに、画面とトランスクリプトに残らず、後から「何が起きたか」を見られない。v1 はトランスクリプトに残す
   - **差し込みは「ターンの最初に1回、戻り値で」**
3. Research: なし
4. Trial: なし
5. Decision: **accepted**

### 01-3: .judge

1. Agenda:
   - Title: 「調べすぎて答えない」をどう止めるか
   - Proposal: `turn_end` で owner の発言と調査ログ（道具の結果の抜粋）を jev の score で判定し、score と confidence の両方が閾値以上なら、1プロンプト1回だけ「もう答えられる。調査をやめて答えろ」を差し込む
2. Highlight:
   - `turn_end` は「1往復の終わり」で、owner の元に戻る位置ではない。1往復 = assistant の応答1つと、その道具の束。往復ごとに1回発火する（pi 1.0.4 の bundle `dist/bundle/chunks/chunk-H33F2TZD.js` の `runLoop`）
   - 差し込みは `{ entries: [custom_message] }` を返すだけでよい。道具を使った往復では、ループが自分で次の要求へ進むので、`continue` は要らない（`runLoop` の内側の `for (; hasMoreToolCalls || pendingMessages.length > 0;)`）。entry は判定の前にセッションへ入る（`agent-session.js:513-514`）
   - 道具を使わずに答えた往復では、pi 自身が end と決めるので拡張の `continue` は勝たない（`agent-session.js:526-530`）。だから `event.toolResults.length > 0` の往復だけ判定する。でないと「答えろ」が答えの後に残るだけ
   - score は criteria の3本立てに対する**連続値**（0〜2、実測 0.42）。confidence は確からしさ。choice と違い段に幅があるので片方だけでは決められない（owner 判断 A）。両方の閾値を満たす時だけ撃つ
   - judge は route が question / design / verify と決めた時だけ arm する。chat / unknown では動かさない
   - 判定は handler が await されるので、その往復の次の要求を 0.5〜1.1秒遅らせる。1プロンプトあたりの判定回数に上限を置く（`budget`）。上限に当たったら判定をやめる（エージェントは止めない）
   - 撃った後はそのプロンプトではもう判定しない（`maxFires: 1`）。無視された場合はログに残す。足りなければ 2 に上げる
   - 1つのプロンプトの中では、route が選んだ classifier の候補を judge も使い回す。途中で提供元が入れ替わると、分類と判定の出どころが混ざる
   - 判定の候補が両方落ちた時は何もしない（fail-open）。ログに `stopReason` と理由を残す
   - 親セッションで `turn_end` を使う拡張は今のところ他に無い（consult と second-opinion の促しは子プロセス側）。登録順は route → guide の順だけ守る
   - 捨てた別案: 3択の choice にする → 段の広がり（部分的に足りる）を捨てることになる
   - 捨てた別案: `tool_result` で結果の文に促しを足す → 道具の結果そのものを書き換えることになり、後続の読み手を混乱させる
   - 止める指示は助言であって強制ではない。編集の強制は pi の許可システムの領分
   - **止める指示も走っている最中に届く。撃つのは1プロンプト1回、道具を使った往復だけ**
3. Research:
   - mechanism: `turn_end` の位置と `continue` の効き方は bundle の `runLoop` と `agent-session.js:486-531` を読んで確かめた（012 の ADR 01-5 は pi 0.87.1 の行番号なので、この版とはずれる）
4. Trial: なし
5. Decision: **accepted**

### 01-4: .onoff

1. Agenda:
   - Title: 止め方をどこまで残すか
   - Proposal: `/intent on|off` を足す。切り替わるのはそのセッションだけ。settings は書き換えない（次のセッションは settings の値から始まる）
2. Highlight:
   - 誤爆した時にその場で止められないと邪魔になる。judge の「答えろ」は走っている最中に割り込むので、なおさら要る
   - settings を書き換える口にすると、セッションとファイルのどちらが正かが曖昧になる。pi-jev も `/jev on|off` をセッション限りとしている
   - off は route を止めるだけで judge も止まる（judge は route の判定で arm される）。v1 はこの1段だけ。guide だけ / judge だけを止める粒度は足さない（誤爆の切り分けはログで行う）
   - off はその場で効く。走っている run でも、次の `turn_end` から判定しない。arm 済みの記録は捨てる
   - 状態は pi のプロセスの中だけに持つ（reload で消える）。ファイルに残さない
   - 設定の置き場: 既定はコード、上書きは `.pi/extensions/intent-router/settings.json`。全体設定との二重取りはしない
   - `registerCommand` の handler は `(args, ctx)`（`dist/core/extensions/types.d.ts:1136-1142`）
   - **切り替えはセッション限り。永続は settings が持つ**
3. Research: なし
4. Trial: なし
5. Decision: **accepted**

### 01-5: .log

1. Agenda:
   - Title: 何をどこに記録し、owner がどう見るか
   - Proposal: 判定と差し込みを、拡張の中の `.pi/extensions/intent-router/logs/<YYYY-MM-DD>.jsonl` に1行1件で残す。owner が直接開いて読める
2. Highlight:
   - 閾値は置きで始めるので、動かす材料が要る。1行に入れる物: hook（route / judge）、時刻、ラベル、confidence、probabilities、score、置いた閾値、撃ったか、差し込んだ文、答えた classifier とモデル、費用、state を切ったか、latency、stopReason
   - shadow の間は差し込まず、「撃ったはず」だけを残す。実物と見比べてから live にする
   - 置き場は拡張の中。`logs/` は既に `.gitignore` にあるので repo は汚れず、owner がすぐ開ける（ホームの下だと探す手間が出る）。consult の記録が `/tmp/pi-consult` なのとは目的が違う（あちらは子の生存確認、こちらは owner が読むため）
   - 保持は新しい方から14日ぶん。古い物は起動時に消す
   - 差し込みそのものは `display: true` で画面にも出るが、確率と閾値はログ側に置く（画面は粗い）
   - **記録は拡張の中に、日ごとの1ファイルで**
3. Research: なし
4. Trial: なし
5. Decision: **accepted**

## 02: Stack

### 02-1: Classifier

1. Agenda:
   - Title: Jev をどう繋ぐか（鍵、費用、外に出す物）
   - Proposal: pi の classifier として使う（`ctx.modelRegistry.classify`）。候補は `opencode/jev-1.13-free` → `openrouter/~typesafe/jev-latest` の順。鍵の設定は増やさない
2. Highlight:
   - pi は Jev を最初から classifier モデルとしてカタログに持つ（ほかに cloudflare の clef 等）。拡張は名前で引いて呼ぶだけで、資格情報は pi が要求時に解決する
   - `getAvailableOfType("classifier")` は資格情報が生きている物だけを返し、`classify()` は例外を投げず `stopReason` で返す。だから鍵の読み取りも、失敗時の分岐も自前で持たなくてよい
   - この環境では opencode が stored、openrouter が env でどちらも configured。`typesafe/jev-latest` は鍵が無いので候補から外れる
   - 無料枠が消える・弾かれると、黙って有料（$0.042/1M）へ落ちる。**有料に落ちたことは、そのセッションで最初の1回だけ画面に1行出す**（費用が動く時は owner が知る）。設定で有料を禁じる口も置く
   - 費用は入力のみ（カタログ価格で出力 0。実測の `cost` も入力ぶんだけ）。1プロンプトあたり route 1回＋judge 数回、状態は 12000 字まで
   - 合計の上限は `budget` と judge の判定回数で抑える。上限に当たったら判定をやめる（機能は黙る、エージェントは止めない）
   - 候補の2つ目は `~typesafe/jev-latest` で浮いている。どのモデルが答えたかをログに残し、後からずれを追えるようにする
   - 外に出す物: owner の発言、道具の的、結果の抜粋（先頭 300 字）、エージェントの最後の文（先頭 500 字）。秘密（`.env`、鍵、`~/.pi/...` の中身）は送らない。切り詰めたことは `truncated` で伝える。012 の ADR 01-2 と同じ線
   - 捨てた別案: 自前の HTTP クライアント + `apiKeyEnv` → 鍵と baseUrl の管理が増え、pi の auth と二重になる
   - 捨てた別案: `typesafe/jev-latest` を直接使う（`TYPESAFE_API_KEY`）→ 鍵の追加が要る
   - **接続は pi の classifier に任せ、こちらは候補の順・費用の可視化・送る物の線だけ持つ**
3. Research:
   - mechanism: classifier の呼び口（`docs/models.md:129-164`、`dist/core/model-registry.d.ts:29-47`、実例 `examples/extensions/jev-router.ts`）
   - mechanism: カタログの中身（`@earendil-works/pi-ai@1.0.3` の `dist/providers/data/opencode.json` と `openrouter.json`）
   - 実測: 両方に実 API で投げた。`opencode/jev-1.13-free` は 402 → 59 tokens で cost 0、`openrouter/~typesafe/jev-latest` は 421 → 76 tokens で $0.000017682
4. Trial: なし
5. Decision: **accepted**
